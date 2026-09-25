import { Injectable, NotFoundException } from '@nestjs/common';
import { amountInWords, computeLateFee, formatDateIN, formatDateTimeIN, formatINR, todayIST, toISODate } from '@rnsis/shared';
import { env } from '../../config/env';
import { hmac, signPayload, verifyPayload } from '../../common/utils/crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { COLORS } from '../../core/pdf/pdf-doc';
import { PdfService } from '../../core/pdf/pdf.service';
import { SchoolService } from '../../core/settings/school.service';
import { StorageService } from '../../core/storage/storage.service';
import { FeeLedgerService, modeLabel } from './fee-ledger.service';

export interface PayLinkClaims extends Record<string, unknown> {
  s: string; // studentId
  i?: string; // optional invoice id
}

const STATUS_LABEL: Record<string, string> = { PENDING: 'Pending', PARTIALLY_PAID: 'Partially paid', PAID: 'Paid', OVERDUE: 'Overdue', CANCELLED: 'Cancelled' };

@Injectable()
export class FeeDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdf: PdfService,
    private readonly storage: StorageService,
    private readonly schools: SchoolService,
    private readonly ledger: FeeLedgerService,
  ) {}

  /* ------------------------------ Pay links ------------------------------ */

  async payLink(studentId: string, invoiceId?: string, validityDays?: number) {
    const student = await this.prisma.student.findUniqueOrThrow({ where: { id: studentId }, select: { schoolId: true } });
    const days = validityDays ?? (await this.schools.settings(student.schoolId)).fees.payLinkValidityDays;
    const token = signPayload({ s: studentId, ...(invoiceId ? { i: invoiceId } : {}) }, env.PAY_LINK_SECRET, days * 86400);
    return `${env.APP_URL}/pay/${token}`;
  }

  verifyPayLink(token: string) {
    return verifyPayload<PayLinkClaims>(token, env.PAY_LINK_SECRET);
  }

  receiptVerifyUrl(receiptNo: string) {
    return `${env.APP_URL}/verify/receipt?no=${encodeURIComponent(receiptNo)}&sig=${hmac(env.PAY_LINK_SECRET, `receipt:${receiptNo}`).slice(0, 16)}`;
  }

  verifyReceiptSignature(receiptNo: string, sig: string) {
    return hmac(env.PAY_LINK_SECRET, `receipt:${receiptNo}`).slice(0, 16) === sig;
  }

  private async studentContext(studentId: string) {
    const s = await this.prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      include: {
        guardians: { include: { guardian: true }, orderBy: { isPrimary: 'desc' } },
        enrollments: { include: { grade: true, section: true, academicYear: true }, orderBy: { startDate: 'desc' }, take: 1 },
      },
    });
    const e = s.enrollments[0];
    const g = s.guardians[0]?.guardian;
    return {
      student: s,
      name: [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' '),
      className: e ? `${e.grade.name}${e.section ? ` - ${e.section.name}` : ''}` : '—',
      guardian: g,
    };
  }

  /* ------------------------------ Invoice PDF ------------------------------ */

  async invoicePdf(invoiceId: string): Promise<{ buffer: Buffer; filename: string }> {
    const inv = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lines: { orderBy: { sortOrder: 'asc' } }, academicYear: true, term: true },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    const ctx = await this.studentContext(inv.studentId);
    const { settings } = await this.schools.get(inv.schoolId);
    const doc = await this.pdf.create(inv.schoolId, { title: `Invoice ${inv.invoiceNo}` });
    doc.letterhead({ rightTitle: 'FEE INVOICE', rightSubtitle: inv.invoiceNo });

    doc.sectionHeading('Billed to');
    doc.keyValues([
      ['Student', ctx.name],
      ['Admission No.', ctx.student.admissionNo],
      ['Class', ctx.className],
      ['Parent / Guardian', ctx.guardian?.name ?? '—'],
      ['Invoice date', formatDateIN(inv.issueDate)],
      ['Due date', formatDateIN(inv.dueDate)],
      ['Academic year', inv.academicYear.name],
      ['Status', STATUS_LABEL[inv.status]],
    ]);
    doc.text(inv.title, { size: 11, font: 'semibold' });
    if (inv.prorationNote) doc.text(inv.prorationNote, { size: 8, color: COLORS.muted });
    doc.space(4);

    const visible = inv.lines.filter((l) => l.amount > 0 || l.amountPaid > 0);
    doc.table(
      [
        { header: '#', width: 0.5 },
        { header: 'Fee head', width: 4.2 },
        { header: 'Amount', width: 1.6, align: 'right' },
        { header: 'Discount', width: 1.5, align: 'right' },
        { header: 'Net', width: 1.6, align: 'right' },
        { header: 'Paid', width: 1.5, align: 'right' },
        { header: 'Balance', width: 1.6, align: 'right' },
      ],
      visible.map((l, i) => [
        String(i + 1),
        l.description,
        formatINR(l.amount),
        l.discount + l.waiver ? `− ${formatINR(l.discount + l.waiver)}` : '—',
        formatINR(l.netAmount),
        l.amountPaid ? formatINR(l.amountPaid) : '—',
        formatINR(l.netAmount - l.amountPaid),
      ]),
    );
    doc.totals([
      { label: 'Subtotal', value: formatINR(inv.subtotal) },
      ...(inv.discountTotal ? [{ label: 'Discounts & concessions', value: `− ${formatINR(inv.discountTotal)}`, color: COLORS.green }] : []),
      ...(inv.lateFee ? [{ label: 'Late fee', value: formatINR(inv.lateFee), color: COLORS.red }] : []),
      { label: 'Invoice total', value: formatINR(inv.total), bold: true },
      { label: 'Amount paid', value: formatINR(inv.amountPaid) },
      { label: 'Balance due', value: formatINR(inv.balance), bold: true, color: inv.balance > 0 ? COLORS.red : COLORS.green },
    ]);

    if (inv.balance > 0 && inv.status !== 'CANCELLED') {
      const rule = await this.ledger.lateFeeRule(this.prisma, inv.academicYearId);
      if (rule.enabled && toISODate(inv.dueDate) >= todayIST()) {
        const principal = inv.balance - inv.lateFee;
        const in7 = computeLateFee(rule, principal, inv.dueDate, new Date(inv.dueDate.getTime() + (rule.graceDays + 7) * 86400_000)).amount;
        doc.text(`Late fee preview: paying after ${formatDateIN(inv.dueDate)}${rule.graceDays ? ` (+${rule.graceDays} grace days)` : ''} attracts a late fee — e.g. ${formatINR(in7)} if paid a week late.`, {
          size: 8.5,
          color: COLORS.amber,
        });
        doc.space(4);
      }
      doc.sectionHeading('How to pay');
      const link = await this.payLink(inv.studentId, inv.id);
      const top = doc.y;
      await doc.qr(link, doc.right - 78, top - 78, 78);
      doc.text('Pay online instantly (UPI · cards · net banking · wallets) by scanning the QR code or visiting:', { size: 9, width: doc.contentWidth - 95 });
      doc.text(link, { size: 7.5, color: doc.primary, width: doc.contentWidth - 95 });
      doc.space(4);
      doc.text(`Or pay at the school fees counter (cash / cheque in favour of "${doc.branding.name}") · ${settings.fees.bankDetails}`, { size: 8.5, color: COLORS.muted, width: doc.contentWidth - 95 });
      doc.y = Math.min(doc.y, top - 86);
    }
    if (inv.status === 'PAID') doc.stamp('PAID', COLORS.green);
    if (inv.status === 'CANCELLED') doc.stamp('CANCELLED', COLORS.red);
    doc.setFooter(`${doc.branding.name} · Invoice ${inv.invoiceNo} · This is a computer-generated invoice.`);
    return { buffer: await doc.save(), filename: `${inv.invoiceNo.replace(/\//g, '-')}.pdf` };
  }

  /* ------------------------------ Receipt PDF ------------------------------ */

  async receiptPdf(paymentId: string, format: 'A4' | 'THERMAL' = 'A4'): Promise<{ buffer: Buffer; filename: string }> {
    const p = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        allocations: { where: { reversedAt: null }, include: { invoice: true, invoiceLine: true } },
        collectedBy: { select: { name: true } },
        refunds: { where: { status: 'PROCESSED' } },
      },
    });
    if (!p) throw new NotFoundException('Payment not found');
    const ctx = await this.studentContext(p.studentId);
    const { settings } = await this.schools.get(p.schoolId);
    const balances = await this.ledger.studentBalances(this.prisma, p.studentId);
    const thermal = format === 'THERMAL';
    const doc = await this.pdf.create(p.schoolId, { size: thermal ? 'THERMAL' : 'A4', title: `Receipt ${p.receiptNo}` });
    doc.letterhead({ rightTitle: 'FEE RECEIPT', rightSubtitle: p.receiptNo });
    if (thermal) doc.title('FEE RECEIPT', p.receiptNo);

    doc.keyValues(
      [
        ['Receipt No.', p.receiptNo],
        ['Date', formatDateTimeIN(p.paidAt)],
        ['Student', ctx.name],
        ['Admission No.', ctx.student.admissionNo],
        ['Class', ctx.className],
        ['Received from', p.payerName ?? ctx.guardian?.name ?? '—'],
      ],
      { cols: thermal ? 1 : 2 },
    );

    const details: [string, string][] = [['Payment mode', modeLabel(p.mode)]];
    if (p.gatewayPaymentId) details.push(['Transaction ID', p.gatewayPaymentId]);
    if (p.referenceNo) details.push([p.mode === 'BANK_TRANSFER' ? 'UTR / Reference' : 'Reference', p.referenceNo]);
    if (p.chequeNo) details.push(['Cheque', `${p.chequeNo} · ${p.chequeBank ?? ''} · ${formatDateIN(p.chequeDate)}`]);
    if (p.collectedBy) details.push(['Collected by', p.collectedBy.name]);
    doc.keyValues(details, { cols: thermal ? 1 : 2 });

    // Amount block
    doc.ensureSpace(60);
    if (!thermal) {
      doc.rect(doc.left, doc.y - 46, doc.contentWidth, 46, undefined, doc.primary, 1);
      doc.at('Amount received', doc.left + 12, doc.y - 17, { size: 9, color: COLORS.muted });
      doc.at(formatINR(p.amount, { alwaysPaise: true }), doc.left + 12, doc.y - 37, { size: 18, font: 'bold', color: doc.primary });
      doc.at(amountInWords(p.amount), doc.right - 12, doc.y - 30, { size: 9, font: 'semibold', align: 'right', maxWidth: doc.contentWidth - 200 });
      doc.y -= 56;
    } else {
      doc.hr(COLORS.text, 0.6, 6);
      doc.text(`AMOUNT: ${formatINR(p.amount, { alwaysPaise: true })}`, { size: 11, font: 'bold', align: 'center' });
      doc.text(amountInWords(p.amount), { size: 7, align: 'center' });
      doc.hr(COLORS.text, 0.6, 6);
    }

    if (p.allocations.length) {
      if (!thermal) doc.sectionHeading('Applied to');
      doc.table(
        thermal
          ? [
              { header: 'Fee head', width: 3 },
              { header: 'Amount', width: 1.6, align: 'right' },
            ]
          : [
              { header: 'Invoice', width: 2 },
              { header: 'Fee head', width: 4 },
              { header: 'Amount', width: 1.6, align: 'right' },
            ],
        p.allocations.map((a) => (thermal ? [a.invoiceLine.description, formatINR(a.amount)] : [a.invoice.invoiceNo, a.invoiceLine.description, formatINR(a.amount)])),
      );
    }
    const advance = p.amount - p.allocatedAmount - p.refundedAmount;
    doc.totals([
      { label: 'Total received', value: formatINR(p.amount), bold: true },
      ...(advance > 0 ? [{ label: 'Kept as advance credit', value: formatINR(advance), color: COLORS.green }] : []),
      ...(p.refundedAmount > 0 ? [{ label: 'Refunded', value: formatINR(p.refundedAmount) }] : []),
      { label: 'Outstanding after this payment', value: formatINR(Math.max(0, balances.netDue)), color: balances.netDue > 0 ? COLORS.red : COLORS.green },
    ]);

    if (p.status === 'PENDING_CLEARANCE') doc.text('Cheque payments are subject to realisation.', { size: 8.5, font: 'semibold', color: COLORS.amber, align: thermal ? 'center' : 'left' });
    const verify = this.receiptVerifyUrl(p.receiptNo);
    if (thermal) {
      doc.space(4);
      const size = 70;
      await doc.qr(verify, doc.left + (doc.contentWidth - size) / 2, doc.y - size, size);
      doc.y -= size + 4;
      doc.text('Scan to verify', { size: 7, align: 'center', color: COLORS.muted });
      doc.text(settings.fees.receiptFooter, { size: 6.5, align: 'center', color: COLORS.muted });
      doc.text('Thank you!', { size: 8, font: 'semibold', align: 'center' });
    } else {
      doc.space(6);
      const top = doc.y;
      await doc.qr(verify, doc.left, top - 64, 64);
      doc.text('Scan to verify this receipt online.', { x: doc.left + 76, size: 8.5, color: COLORS.muted });
      doc.text(settings.fees.receiptFooter, { x: doc.left + 76, size: 8, color: COLORS.muted, width: doc.contentWidth - 250 });
      doc.at('Authorised signatory', doc.right, top - 58, { size: 9, align: 'right', color: COLORS.muted });
      doc.at('(Computer-generated, no signature required)', doc.right, top - 70, { size: 7, align: 'right', color: COLORS.muted });
      doc.y = Math.min(doc.y, top - 74);
    }
    if (p.status === 'BOUNCED') doc.stamp('CHEQUE RETURNED', COLORS.red);
    if (p.status === 'VOID') doc.stamp('VOID', COLORS.red);
    doc.setFooter(`${doc.branding.name} · Receipt ${p.receiptNo}`);
    return { buffer: await doc.save(), filename: `${p.receiptNo.replace(/\//g, '-')}${thermal ? '-80mm' : ''}.pdf` };
  }

  /** Render and store the A4 receipt (for email attachments / parent downloads). */
  async storeReceipt(paymentId: string) {
    const p = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const { buffer, filename } = await this.receiptPdf(paymentId, 'A4');
    const file = await this.storage.save({ schoolId: p.schoolId, buffer, originalName: filename, mimeType: 'application/pdf', purpose: 'receipt' });
    if (p.receiptFileId) await this.storage.remove(p.receiptFileId).catch(() => undefined);
    await this.prisma.payment.update({ where: { id: paymentId }, data: { receiptFileId: file.id } });
    return file;
  }

  async storeInvoice(invoiceId: string) {
    const inv = await this.prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    const { buffer, filename } = await this.invoicePdf(invoiceId);
    return this.storage.save({ schoolId: inv.schoolId, buffer, originalName: filename, mimeType: 'application/pdf', purpose: 'invoice' });
  }

  /* ------------------------------ Ledger statement ------------------------------ */

  async statementPdf(studentId: string, entries: { date: string; description: string; debit: number; credit: number; runningBalance: number }[], summary: Record<string, number>) {
    const ctx = await this.studentContext(studentId);
    const doc = await this.pdf.create(ctx.student.schoolId, { title: `Fee statement ${ctx.student.admissionNo}` });
    doc.letterhead({ rightTitle: 'FEE STATEMENT', rightSubtitle: formatDateIN(todayIST()) });
    doc.keyValues([
      ['Student', ctx.name],
      ['Admission No.', ctx.student.admissionNo],
      ['Class', ctx.className],
      ['Parent / Guardian', ctx.guardian?.name ?? '—'],
    ]);
    doc.table(
      [
        { header: 'Date', width: 1.3 },
        { header: 'Particulars', width: 4.4 },
        { header: 'Debit', width: 1.4, align: 'right' },
        { header: 'Credit', width: 1.4, align: 'right' },
        { header: 'Balance', width: 1.5, align: 'right' },
      ],
      entries.map((e) => [formatDateIN(e.date), e.description, e.debit ? formatINR(e.debit) : '', e.credit ? formatINR(e.credit) : '', formatINR(e.runningBalance)]),
    );
    doc.totals([
      { label: 'Total billed', value: formatINR(summary.billed) },
      { label: 'Discounts', value: formatINR(summary.discounts) },
      { label: 'Total paid', value: formatINR(summary.paid) },
      { label: 'Advance credit', value: formatINR(summary.advanceCredit) },
      { label: 'Net due', value: formatINR(summary.netDue), bold: true, color: summary.netDue > 0 ? COLORS.red : COLORS.green },
    ]);
    return { buffer: await doc.save(), filename: `Fee-Statement-${ctx.student.admissionNo.replace(/\//g, '-')}.pdf` };
  }
}
