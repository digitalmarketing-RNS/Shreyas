import { Injectable, Logger } from '@nestjs/common';
import { formatDateIN, formatINR } from '@rnsis/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { SchoolService } from '../../core/settings/school.service';
import { NotificationsService } from '../notifications/notifications.service';
import { signedFileUrl } from '../system/files.controller';
import { FeeDocumentsService } from './fee-documents.service';
import { FeeLedgerService, modeLabel } from './fee-ledger.service';

/** Parent-facing fee messages (invoice issued, receipt, reminders…) with PDFs + pay links. */
@Injectable()
export class FeeNotifier {
  private readonly logger = new Logger(FeeNotifier.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly docs: FeeDocumentsService,
    private readonly ledger: FeeLedgerService,
    private readonly schools: SchoolService,
  ) {}

  async invoiceIssued(invoiceId: string, channels?: ('EMAIL' | 'SMS' | 'WHATSAPP')[]) {
    const inv = await this.prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    if (inv.status === 'CANCELLED' || inv.balance <= 0) return 0;
    const file = await this.docs.storeInvoice(invoiceId);
    const n = await this.notifications.notifyGuardians(inv.studentId, {
      templateKey: 'INVOICE_ISSUED',
      channels,
      related: { type: 'Invoice', id: inv.id },
      attachments: [{ fileId: file.id, filename: file.originalName }],
      data: {
        invoice_no: inv.invoiceNo,
        title: inv.title,
        amount_due: formatINR(inv.balance),
        due_date: formatDateIN(inv.dueDate),
        pay_url: await this.docs.payLink(inv.studentId, inv.id),
        invoice_url: signedFileUrl(file.id),
      },
    });
    await this.prisma.invoice.update({ where: { id: invoiceId }, data: { sentAt: new Date() } });
    return n;
  }

  /** Store the receipt PDF and send it to the parent (email attachment + WhatsApp/SMS link). */
  async paymentReceived(paymentId: string) {
    const p = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const file = await this.docs.storeReceipt(paymentId);
    const { settings } = await this.schools.get(p.schoolId);
    if (!settings.notifications.paymentReceipts) return 0;
    const b = await this.ledger.studentBalances(this.prisma, p.studentId);
    const n = await this.notifications.notifyGuardians(p.studentId, {
      templateKey: 'PAYMENT_RECEIPT',
      related: { type: 'Payment', id: p.id },
      attachments: [{ fileId: file.id, filename: file.originalName }],
      data: {
        receipt_no: p.receiptNo,
        amount: formatINR(p.amount),
        mode: modeLabel(p.mode),
        paid_on: formatDateIN(p.paidAt.toISOString()),
        balance: formatINR(Math.max(0, b.netDue)),
        receipt_url: signedFileUrl(file.id, 30 * 86400),
      },
    });
    await this.prisma.payment.update({ where: { id: paymentId }, data: { receiptSentAt: new Date() } });
    return n;
  }

  /** Re-render the stored receipt (e.g. after a bounce/void) without messaging the parent. */
  async refreshReceipt(paymentId: string) {
    return this.docs.storeReceipt(paymentId);
  }

  async chequeBounced(paymentId: string) {
    const p = await this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
    return this.notifications.notifyGuardians(p.studentId, {
      templateKey: 'CHEQUE_BOUNCED',
      related: { type: 'Payment', id: p.id },
      data: { cheque_no: p.chequeNo ?? '', amount: formatINR(p.amount), reason: p.bounceReason ?? 'returned', pay_url: await this.docs.payLink(p.studentId) },
    });
  }

  async refundProcessed(refundId: string) {
    const r = await this.prisma.refund.findUniqueOrThrow({ where: { id: refundId } });
    return this.notifications.notifyGuardians(r.studentId, {
      templateKey: 'REFUND_PROCESSED',
      related: { type: 'Refund', id: r.id },
      data: { refund_no: r.refundNo, amount: formatINR(r.amount), method: r.method.replace(/_/g, ' ').toLowerCase() },
    });
  }

  async dueDateChanged(invoiceId: string, oldDate: Date, termName: string) {
    const inv = await this.prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    if (inv.balance <= 0) return 0;
    return this.notifications.notifyGuardians(inv.studentId, {
      templateKey: 'DUE_DATE_CHANGED',
      related: { type: 'Invoice', id: inv.id },
      data: {
        term: termName,
        old_date: formatDateIN(oldDate),
        new_date: formatDateIN(inv.dueDate),
        amount_due: formatINR(inv.balance),
        pay_url: await this.docs.payLink(inv.studentId, inv.id),
      },
    });
  }
}
