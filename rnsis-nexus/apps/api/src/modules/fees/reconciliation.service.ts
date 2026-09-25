import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Gateway } from '@prisma/client';
import { dateOnly, formatDateIN, formatINR, rupeesToPaise } from '@rnsis/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { ExcelService, ReportTable } from '../../core/excel/excel.service';
import { GatewayPaymentRecord } from './gateways/gateway.types';
import { PaymentsService } from './payments.service';

const istStart = (d: string) => new Date(`${d}T00:00:00.000+05:30`);
const istEnd = (d: string) => new Date(`${d}T23:59:59.999+05:30`);

/**
 * Matches our online payments against the gateway's records (API pull or uploaded
 * settlement report): matched, amount mismatch, captured-but-missing (e.g. lost webhook —
 * one click imports it) and recorded-but-not-at-gateway. Also totals gateway fees & GST.
 */
@Injectable()
export class ReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentsService,
    private readonly excel: ExcelService,
    private readonly audit: AuditService,
  ) {}

  private async gatewayRecords(schoolId: string, gateway: Gateway, from: string, to: string, file?: { buffer: Buffer; mime?: string }): Promise<{ records: GatewayPaymentRecord[]; source: string; settlementIds: Map<string, string> }> {
    const settlementIds = new Map<string, string>();
    if (file) {
      const { rows } = await this.excel.readRows(file.buffer, file.mime);
      const pick = (r: Record<string, string>, ...keys: string[]) => {
        for (const k of Object.keys(r)) if (keys.includes(k.toLowerCase().replace(/\s+/g, '_'))) return r[k];
        return '';
      };
      const records: GatewayPaymentRecord[] = [];
      for (const r of rows) {
        const type = pick(r, 'type', 'entity_type').toLowerCase();
        if (type && type !== 'payment') continue;
        const id = pick(r, 'entity_id', 'payment_id', 'id');
        if (!id) continue;
        const money = (v: string) => (v ? rupeesToPaise(v) : 0);
        const amount = money(pick(r, 'amount', 'credit'));
        records.push({
          paymentId: id,
          orderId: pick(r, 'order_id', 'order_receipt') || null,
          amount,
          fee: money(pick(r, 'fee', 'fees')),
          tax: money(pick(r, 'tax', 'gst')),
          status: 'captured',
          method: pick(r, 'method', 'payment_method') || null,
          createdAt: new Date(pick(r, 'created_at', 'date') || Date.now()),
        });
        const sid = pick(r, 'settlement_id', 'settlement_utr');
        if (sid) settlementIds.set(id, sid);
      }
      return { records, source: 'UPLOAD', settlementIds };
    }
    if (gateway === 'MOCK') {
      // The demo gateway "settles" what it captured, less 2% fee + 18% GST on the fee.
      const orders = await this.prisma.gatewayOrder.findMany({ where: { schoolId, gateway: 'MOCK', status: 'PAID', paidAt: { gte: istStart(from), lte: istEnd(to) } }, include: { payment: true } });
      return {
        records: orders
          .filter((o) => o.payment?.gatewayPaymentId)
          .map((o) => {
            const fee = Math.round(o.amount * 0.02);
            return { paymentId: o.payment!.gatewayPaymentId!, orderId: o.orderId, amount: o.amount, fee, tax: Math.round(fee * 0.18), status: 'captured', method: o.payment!.gatewayMethod, createdAt: o.paidAt ?? o.createdAt };
          }),
        source: 'SIMULATED',
        settlementIds,
      };
    }
    const gw = this.payments.gateway(gateway);
    if (!gw.configured) throw new BadRequestException(`${gateway} is not configured — upload the settlement report instead`);
    const records = (await gw.listPayments(istStart(from), istEnd(to))).filter((r) => r.status === 'captured' || r.status === 'succeeded' || r.status === 'refunded');
    return { records, source: 'API', settlementIds };
  }

  async run(schoolId: string, dto: { gateway: Gateway; from: string; to: string }, actorId: string, file?: { buffer: Buffer; mime?: string }) {
    if (dto.from > dto.to) throw new BadRequestException('Invalid period');
    const { records, source, settlementIds } = await this.gatewayRecords(schoolId, dto.gateway, dto.from, dto.to, file);
    const ours = await this.prisma.payment.findMany({
      where: { schoolId, gateway: dto.gateway, channel: 'ONLINE', paidAt: { gte: istStart(dto.from), lte: istEnd(dto.to) } },
    });
    const byGatewayId = new Map(ours.filter((p) => p.gatewayPaymentId).map((p) => [p.gatewayPaymentId!, p]));
    const seen = new Set<string>();
    const items: any[] = [];
    for (const r of records) {
      let p = byGatewayId.get(r.paymentId);
      if (!p) p = (await this.prisma.payment.findUnique({ where: { gatewayPaymentId: r.paymentId } })) ?? undefined;
      if (p) seen.add(p.id);
      const status = !p ? 'MISSING_IN_SYSTEM' : p.amount !== r.amount || p.status !== 'SUCCESS' ? 'AMOUNT_MISMATCH' : 'MATCHED';
      items.push({
        gatewayPaymentId: r.paymentId,
        settlementId: settlementIds.get(r.paymentId) ?? null,
        gatewayAmount: r.amount,
        gatewayFee: r.fee,
        gatewayTax: r.tax,
        settledAmount: r.amount - r.fee - r.tax,
        systemAmount: p?.amount ?? null,
        paymentId: p?.id ?? null,
        status,
        notes: !p ? (r.orderId ? `Order ${r.orderId} — captured at gateway but not recorded` : 'Captured at gateway but not recorded') : status === 'AMOUNT_MISMATCH' ? `System ${formatINR(p.amount)} (${p.status}) vs gateway ${formatINR(r.amount)}` : null,
      });
    }
    for (const p of ours) {
      if (seen.has(p.id) || p.status !== 'SUCCESS') continue;
      items.push({ gatewayPaymentId: p.gatewayPaymentId, settlementId: null, gatewayAmount: null, gatewayFee: null, gatewayTax: null, settledAmount: null, systemAmount: p.amount, paymentId: p.id, status: 'MISSING_IN_GATEWAY', notes: `${p.receiptNo} not found in gateway records` });
    }
    const sum = (k: string, f?: (i: any) => boolean) => items.filter(f ?? (() => true)).reduce((a, i) => a + (i[k] ?? 0), 0);
    const summary = {
      gatewayCount: records.length,
      systemCount: ours.filter((p) => p.status === 'SUCCESS').length,
      matched: items.filter((i) => i.status === 'MATCHED').length,
      mismatched: items.filter((i) => i.status === 'AMOUNT_MISMATCH').length,
      missingInSystem: items.filter((i) => i.status === 'MISSING_IN_SYSTEM').length,
      missingInGateway: items.filter((i) => i.status === 'MISSING_IN_GATEWAY').length,
      gatewayTotal: sum('gatewayAmount'),
      systemTotal: ours.filter((p) => p.status === 'SUCCESS').reduce((a, p) => a + p.amount, 0),
      fees: sum('gatewayFee'),
      tax: sum('gatewayTax'),
      settled: sum('settledAmount'),
    };
    const run = await this.prisma.reconciliationRun.create({
      data: { schoolId, gateway: dto.gateway, source, periodFrom: dateOnly(dto.from), periodTo: dateOnly(dto.to), summary, createdById: actorId, items: { create: items } },
      include: { items: true },
    });
    await this.audit.log({
      schoolId,
      action: 'fees.reconciliation_run',
      entityType: 'ReconciliationRun',
      entityId: run.id,
      summary: `${dto.gateway} reconciliation ${formatDateIN(dto.from)}–${formatDateIN(dto.to)}: ${summary.matched} matched, ${summary.mismatched} mismatched, ${summary.missingInSystem} missing in system, ${summary.missingInGateway} missing at gateway`,
    });
    return run;
  }

  list(schoolId: string) {
    return this.prisma.reconciliationRun.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async get(schoolId: string, id: string) {
    const run = await this.prisma.reconciliationRun.findFirst({ where: { id, schoolId }, include: { items: { orderBy: { status: 'asc' } } } });
    if (!run) throw new NotFoundException('Reconciliation run not found');
    const payments = await this.prisma.payment.findMany({ where: { id: { in: run.items.map((i) => i.paymentId).filter(Boolean) as string[] } }, select: { id: true, receiptNo: true, student: { select: { firstName: true, lastName: true } } } });
    return { ...run, items: run.items.map((i) => ({ ...i, payment: payments.find((p) => p.id === i.paymentId) ?? null })) };
  }

  /** Record a payment the gateway captured but we never received a webhook for. */
  async importMissing(schoolId: string, itemId: string) {
    const item = await this.prisma.reconciliationItem.findUnique({ where: { id: itemId }, include: { run: true } });
    if (!item || item.run.schoolId !== schoolId) throw new NotFoundException('Item not found');
    if (item.status !== 'MISSING_IN_SYSTEM' || !item.gatewayPaymentId) throw new BadRequestException('Only missing gateway payments can be imported');
    const orderId = item.notes?.match(/Order (\S+)/)?.[1];
    if (!orderId) throw new BadRequestException('Gateway record has no order id to match a student — record it manually from the counter');
    const res = await this.payments.confirmGatewayPayment({ orderId, paymentId: item.gatewayPaymentId, amount: item.gatewayAmount ?? undefined });
    await this.prisma.reconciliationItem.update({ where: { id: itemId }, data: { status: 'MATCHED', paymentId: res.paymentId, systemAmount: item.gatewayAmount, notes: 'Imported from gateway record' } });
    return res;
  }

  toReport(run: Awaited<ReturnType<ReconciliationService['get']>>): ReportTable {
    const s = run.summary as any;
    return {
      title: 'Gateway Reconciliation',
      subtitle: `${run.gateway} · ${formatDateIN(run.periodFrom)} – ${formatDateIN(run.periodTo)}`,
      filters: [
        ['Matched', String(s.matched)],
        ['Mismatched', String(s.mismatched)],
        ['Missing in system', String(s.missingInSystem)],
        ['Missing at gateway', String(s.missingInGateway)],
        ['Gateway fees + GST', formatINR((s.fees ?? 0) + (s.tax ?? 0))],
        ['Net settled', formatINR(s.settled ?? 0)],
      ],
      columns: [
        { key: 'status', header: 'Status', width: 20 },
        { key: 'gatewayPaymentId', header: 'Gateway payment', width: 26 },
        { key: 'receipt', header: 'Receipt', width: 20 },
        { key: 'student', header: 'Student', width: 22 },
        { key: 'gatewayAmount', header: 'Gateway amount', kind: 'money' },
        { key: 'systemAmount', header: 'System amount', kind: 'money' },
        { key: 'gatewayFee', header: 'Fee', kind: 'money' },
        { key: 'gatewayTax', header: 'GST', kind: 'money' },
        { key: 'settledAmount', header: 'Settled', kind: 'money' },
        { key: 'notes', header: 'Notes', width: 36 },
      ],
      rows: run.items.map((i) => ({ ...i, receipt: i.payment?.receiptNo ?? '', student: i.payment ? `${i.payment.student.firstName} ${i.payment.student.lastName}` : '' })),
      totals: { status: 'Total', gatewayAmount: s.gatewayTotal, systemAmount: s.systemTotal, gatewayFee: s.fees, gatewayTax: s.tax, settledAmount: s.settled },
    };
  }
}
