import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Gateway, PaymentMode, Prisma } from '@prisma/client';
import { formatINR, rupeesToPaise } from '@rnsis/shared';
import { env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../core/audit/audit.service';
import { SchoolService } from '../../core/settings/school.service';
import { FeeLedgerService, OPEN_STATUSES } from './fee-ledger.service';
import { FeeNotifier } from './fee-notifier.service';
import { GatewayEvent, InvalidSignatureError, methodToMode, PaymentGateway } from './gateways/gateway.types';
import { MockGateway } from './gateways/mock.gateway';
import { RazorpayGateway } from './gateways/razorpay.gateway';
import { StripeGateway } from './gateways/stripe.gateway';

export interface CounterPaymentInput {
  studentId: string;
  amount: number;
  mode: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI' | 'CARD';
  invoiceIds?: string[];
  referenceNo?: string;
  chequeNo?: string;
  chequeBank?: string;
  chequeDate?: string;
  payerName?: string;
  remarks?: string;
  paidAt?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  readonly razorpay = new RazorpayGateway();
  readonly stripe = new StripeGateway();
  readonly mock = new MockGateway();

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: FeeLedgerService,
    private readonly notifier: FeeNotifier,
    private readonly audit: AuditService,
    private readonly schools: SchoolService,
  ) {}

  gateway(name: Gateway): PaymentGateway {
    return name === 'RAZORPAY' ? this.razorpay : name === 'STRIPE' ? this.stripe : this.mock;
  }

  primaryGateway(): Gateway {
    return env.PAYMENT_GATEWAY === 'razorpay' ? 'RAZORPAY' : env.PAYMENT_GATEWAY === 'stripe' ? 'STRIPE' : 'MOCK';
  }

  availableGateways() {
    const primary = this.primaryGateway();
    const list: { gateway: Gateway; label: string; primary: boolean }[] = [{ gateway: primary, label: primary === 'STRIPE' ? 'Card (Stripe)' : primary === 'MOCK' ? 'UPI / Card / Net banking (demo gateway)' : 'UPI / Card / Net banking / Wallet', primary: true }];
    if (primary !== 'STRIPE' && this.stripe.configured) list.push({ gateway: 'STRIPE', label: 'International card (Stripe)', primary: false });
    return list;
  }

  /* ------------------------------ Counter (offline) payments ------------------------------ */

  async collect(schoolId: string, dto: CounterPaymentInput, actorId: string) {
    if (dto.mode === 'CHEQUE' && (!dto.chequeNo || !dto.chequeBank || !dto.chequeDate)) throw new BadRequestException('Cheque number, bank and date are required');
    if (dto.mode === 'BANK_TRANSFER' && !dto.referenceNo) throw new BadRequestException('UTR / reference number is required for bank transfers');
    if (dto.referenceNo) {
      const dup = await this.prisma.payment.findFirst({ where: { schoolId, referenceNo: dto.referenceNo, mode: dto.mode, status: { in: ['SUCCESS', 'PENDING_CLEARANCE'] } } });
      if (dup) throw new BadRequestException(`Reference ${dto.referenceNo} was already recorded on receipt ${dup.receiptNo}`);
    }
    const result = await this.prisma.tx((tx) =>
      this.ledger.recordPayment(tx, {
        schoolId,
        studentId: dto.studentId,
        amount: dto.amount,
        mode: dto.mode as PaymentMode,
        channel: 'COUNTER',
        invoiceIds: dto.invoiceIds,
        referenceNo: dto.referenceNo,
        chequeNo: dto.chequeNo,
        chequeBank: dto.chequeBank,
        chequeDate: dto.chequeDate,
        payerName: dto.payerName,
        remarks: dto.remarks,
        collectedById: actorId,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
      }),
    );
    await this.afterSuccess(result.payment.id);
    return result;
  }

  async clearCheque(schoolId: string, paymentId: string, actorId: string, clearedOn?: string) {
    const p = await this.prisma.payment.findFirst({ where: { id: paymentId, schoolId } });
    if (!p) throw new NotFoundException('Payment not found');
    if (p.mode !== 'CHEQUE' || p.status !== 'PENDING_CLEARANCE') throw new BadRequestException('Only pending cheques can be cleared');
    const updated = await this.prisma.payment.update({ where: { id: paymentId }, data: { status: 'SUCCESS', clearedAt: clearedOn ? new Date(clearedOn) : new Date(), clearedById: actorId } });
    await this.audit.log({ schoolId, action: 'payment.cheque_cleared', entityType: 'Payment', entityId: paymentId, summary: `Cheque ${p.chequeNo} on ${p.receiptNo} (${formatINR(p.amount)}) cleared`, before: { status: p.status }, after: { status: 'SUCCESS' } });
    return updated;
  }

  async bounceCheque(schoolId: string, paymentId: string, reason: string, actorId: string, bounceCharge?: number) {
    const p = await this.prisma.payment.findFirst({ where: { id: paymentId, schoolId } });
    if (!p) throw new NotFoundException('Payment not found');
    if (p.mode !== 'CHEQUE') throw new BadRequestException('Only cheque payments can bounce');
    await this.prisma.tx(async (tx) => {
      await this.ledger.reversePayment(tx, paymentId, 'BOUNCED', reason, actorId);
      if (bounceCharge && bounceCharge > 0) {
        const head = await tx.feeHead.findFirst({ where: { schoolId, category: 'OTHER' } });
        if (head) {
          await this.ledger.createInvoice(tx, {
            schoolId,
            studentId: p.studentId,
            academicYearId: p.academicYearId,
            type: 'MANUAL',
            title: `Cheque return charges (${p.chequeNo})`,
            dueDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
            lines: [{ feeHeadId: head.id, description: `Cheque ${p.chequeNo} returned — bank charges`, amount: bounceCharge }],
            createdById: actorId,
          });
        }
      }
    });
    await this.notifier.chequeBounced(paymentId).catch((e) => this.logger.warn(e.message));
    await this.notifier.refreshReceipt(paymentId).catch(() => undefined); // re-render receipt with the RETURNED stamp
    return this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  }

  /** Void a counter payment recorded in error (reverses allocations, keeps the receipt number). */
  async voidPayment(schoolId: string, paymentId: string, reason: string, actorId: string) {
    const p = await this.prisma.payment.findFirst({ where: { id: paymentId, schoolId } });
    if (!p) throw new NotFoundException('Payment not found');
    if (p.channel === 'ONLINE') throw new BadRequestException('Online payments cannot be voided — issue a refund instead');
    await this.prisma.tx((tx) => this.ledger.reversePayment(tx, paymentId, 'VOID', reason, actorId));
    await this.notifier.refreshReceipt(paymentId).catch(() => undefined);
    return this.prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  }

  /** Post-commit side effects of a successful payment: receipt PDF + parent notification. */
  async afterSuccess(paymentId: string) {
    try {
      await this.notifier.paymentReceived(paymentId);
    } catch (e: any) {
      this.logger.error(`Receipt delivery failed for ${paymentId}: ${e.message}`);
    }
  }

  /* ------------------------------ Online payments ------------------------------ */

  async createOnlineOrder(schoolId: string, dto: { studentId: string; invoiceIds?: string[]; amount?: number; gateway?: Gateway; viaPayLink?: boolean; initiatedById?: string | null }) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
      include: { guardians: { include: { guardian: true }, orderBy: { isPrimary: 'desc' } } },
    });
    if (!student) throw new NotFoundException('Student not found');
    const { school, settings } = await this.schools.get(schoolId);
    const invoices = await this.prisma.invoice.findMany({
      where: { studentId: student.id, status: { in: [...OPEN_STATUSES] }, balance: { gt: 0 }, ...(dto.invoiceIds?.length ? { id: { in: dto.invoiceIds } } : {}) },
      orderBy: { dueDate: 'asc' },
    });
    if (dto.invoiceIds?.length && invoices.length !== dto.invoiceIds.length) throw new BadRequestException('Some invoices are already paid or not payable');
    const due = invoices.reduce((a, i) => a + i.balance, 0);
    const amount = dto.amount ?? due;
    if (!Number.isInteger(amount) || amount <= 0) throw new BadRequestException('Nothing to pay');
    if (amount < due && !settings.fees.allowPartialOnlinePayment) throw new BadRequestException('Part payments are not enabled for online payment');
    if (amount < Math.min(due || amount, settings.fees.minOnlinePayment)) throw new BadRequestException(`Minimum online payment is ${formatINR(settings.fees.minOnlinePayment)}`);
    if (amount > due + rupeesToPaise(500000)) throw new BadRequestException('Amount exceeds the permitted advance payment');

    const gatewayName = dto.gateway ?? this.primaryGateway();
    if (gatewayName === 'MOCK' && env.NODE_ENV === 'production' && env.PAYMENT_GATEWAY !== 'mock') throw new ForbiddenException('Demo gateway is disabled');
    const gw = this.gateway(gatewayName);
    const guardian = student.guardians[0]?.guardian;
    const ref = `${student.admissionNo}-${Date.now().toString(36)}`;
    const returnUrl = `${env.APP_URL}/pay/result`;
    const created = await gw.createOrder({
      amount,
      receipt: ref,
      description: invoices.length ? `Fees: ${invoices.map((i) => i.invoiceNo).join(', ')}`.slice(0, 250) : `Advance fee payment ${student.admissionNo}`,
      notes: { school: school.name, studentId: student.id, admissionNo: student.admissionNo, invoices: invoices.map((i) => i.invoiceNo).join(',').slice(0, 250) },
      customer: { name: guardian?.name ?? `${student.firstName} ${student.lastName}`, email: guardian?.email, phone: guardian?.phone },
      returnUrl,
      cancelUrl: `${returnUrl}?cancelled=1`,
    });
    const order = await this.prisma.gatewayOrder.create({
      data: {
        schoolId,
        studentId: student.id,
        gateway: gatewayName,
        orderId: created.orderId,
        amount,
        invoiceIds: invoices.map((i) => i.id),
        initiatedById: dto.initiatedById ?? null,
        viaPayLink: dto.viaPayLink ?? false,
        checkoutUrl: (created.checkout.redirectUrl as string) ?? null,
      },
    });
    return {
      orderId: order.orderId,
      gateway: gatewayName,
      amount,
      due,
      checkout: created.checkout,
      student: { name: `${student.firstName} ${student.lastName}`, admissionNo: student.admissionNo },
    };
  }

  async orderStatus(orderId: string) {
    const o = await this.prisma.gatewayOrder.findUnique({ where: { orderId }, include: { payment: true, student: { select: { firstName: true, lastName: true, admissionNo: true } } } });
    if (!o) throw new NotFoundException('Order not found');
    return {
      orderId: o.orderId,
      gateway: o.gateway,
      status: o.status,
      amount: o.amount,
      failureReason: o.failureReason,
      student: { name: `${o.student.firstName} ${o.student.lastName}`, admissionNo: o.student.admissionNo },
      payment: o.payment ? { id: o.payment.id, receiptNo: o.payment.receiptNo, amount: o.payment.amount, mode: o.payment.mode, paidAt: o.payment.paidAt } : null,
    };
  }

  /**
   * Idempotent confirmation used by both the browser callback and the webhook. The order
   * row is locked, so a webhook and a callback racing each other create exactly one payment.
   */
  async confirmGatewayPayment(ev: { orderId: string; paymentId: string; amount?: number; method?: string }): Promise<{ paymentId: string; created: boolean }> {
    const result = await this.prisma.tx(async (tx) => {
      const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "GatewayOrder" WHERE "orderId" = ${ev.orderId} FOR UPDATE`;
      if (!rows.length) throw new NotFoundException(`Unknown order ${ev.orderId}`);
      const order = await tx.gatewayOrder.findUniqueOrThrow({ where: { id: rows[0].id } });
      if (order.paymentId) return { paymentId: order.paymentId, created: false };
      const existing = await tx.payment.findUnique({ where: { gatewayPaymentId: ev.paymentId } });
      if (existing) {
        await tx.gatewayOrder.update({ where: { id: order.id }, data: { status: 'PAID', paymentId: existing.id, paidAt: existing.paidAt } });
        return { paymentId: existing.id, created: false };
      }
      const amount = ev.amount ?? order.amount;
      const { payment } = await this.ledger.recordPayment(tx, {
        schoolId: order.schoolId,
        studentId: order.studentId,
        amount,
        mode: methodToMode(ev.method),
        channel: 'ONLINE',
        gateway: order.gateway,
        gatewayOrderId: order.orderId,
        gatewayPaymentId: ev.paymentId,
        gatewayMethod: ev.method ?? null,
        invoiceIds: order.invoiceIds,
        remarks: order.viaPayLink ? 'Paid via payment link' : 'Paid via parent portal',
      });
      await tx.gatewayOrder.update({ where: { id: order.id }, data: { status: 'PAID', paymentId: payment.id, paidAt: new Date(), failureReason: null } });
      return { paymentId: payment.id, created: true };
    });
    if (result.created) await this.afterSuccess(result.paymentId);
    return result;
  }

  /** Browser callback after Razorpay/Mock checkout (fast UX; webhook remains the source of truth). */
  async verifyCheckout(gateway: Gateway, payload: Record<string, string>) {
    const verified = this.gateway(gateway).verifyCheckout(payload);
    if (!verified) throw new BadRequestException('Payment signature verification failed');
    const order = await this.prisma.gatewayOrder.findUnique({ where: { orderId: verified.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    let method: string | undefined;
    let amount: number | undefined;
    if (gateway === 'RAZORPAY') {
      try {
        const p: any = await this.razorpay.rzp().payments.fetch(verified.paymentId);
        method = p.method;
        amount = p.amount;
        if (p.status !== 'captured' && p.status !== 'authorized') return this.orderStatus(order.orderId);
      } catch (e: any) {
        this.logger.warn(`Could not fetch Razorpay payment ${verified.paymentId}: ${e.message}`);
      }
    } else {
      method = payload.method;
    }
    await this.confirmGatewayPayment({ orderId: verified.orderId, paymentId: verified.paymentId, method, amount });
    return this.orderStatus(order.orderId);
  }

  /** Verify, de-duplicate, record and process a gateway webhook. */
  async handleWebhook(gateway: Gateway, rawBody: Buffer, headers: Record<string, string | string[] | undefined>) {
    let ev: GatewayEvent;
    try {
      ev = this.gateway(gateway).parseWebhook(rawBody, headers);
    } catch (e) {
      if (e instanceof InvalidSignatureError) {
        this.logger.warn(`Rejected ${gateway} webhook: invalid signature`);
        throw new ForbiddenException('Invalid signature');
      }
      throw e;
    }
    let payload: Prisma.InputJsonValue;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      payload = { raw: rawBody.toString('utf8').slice(0, 5000) };
    }
    const existing = await this.prisma.webhookEvent.findUnique({ where: { provider_eventId: { provider: gateway, eventId: ev.eventId } } });
    if (existing?.status === 'PROCESSED' || existing?.status === 'IGNORED') return { status: 'duplicate' };
    const row =
      existing ??
      (await this.prisma.webhookEvent.create({ data: { provider: gateway, eventId: ev.eventId, type: ev.type, signatureValid: true, payload } }));
    try {
      if (ev.type === 'payment.captured' && ev.orderId && ev.paymentId) {
        await this.confirmGatewayPayment({ orderId: ev.orderId, paymentId: ev.paymentId, amount: ev.amount, method: ev.method });
      } else if (ev.type === 'payment.failed' && ev.orderId) {
        await this.prisma.gatewayOrder.updateMany({ where: { orderId: ev.orderId, status: { in: ['CREATED', 'ATTEMPTED'] } }, data: { status: 'FAILED', failureReason: ev.failureReason ?? 'Payment failed' } });
      } else if (ev.type === 'refund.processed' && ev.paymentId) {
        const p = await this.prisma.payment.findUnique({ where: { gatewayPaymentId: ev.paymentId } });
        if (p) await this.prisma.refund.updateMany({ where: { paymentId: p.id, status: 'APPROVED', method: 'ORIGINAL_GATEWAY' }, data: { status: 'PROCESSED', processedAt: new Date() } });
      }
      await this.prisma.webhookEvent.update({ where: { id: row.id }, data: { status: ev.type === 'ignored' ? 'IGNORED' : 'PROCESSED', processedAt: new Date(), error: null } });
      return { status: 'processed', type: ev.type };
    } catch (e: any) {
      await this.prisma.webhookEvent.update({ where: { id: row.id }, data: { status: 'FAILED', error: String(e.message).slice(0, 1000) } });
      throw e; // non-2xx → gateway retries; processing is idempotent
    }
  }

  /** Demo gateway: simulate the customer completing (or failing) payment on the checkout page. */
  async simulateMockPayment(orderId: string, method: string, outcome: 'success' | 'failure') {
    const order = await this.prisma.gatewayOrder.findUnique({ where: { orderId } });
    if (!order || order.gateway !== 'MOCK') throw new NotFoundException('Mock order not found');
    if (order.status === 'PAID') return this.orderStatus(orderId);
    await this.prisma.gatewayOrder.update({ where: { id: order.id }, data: { status: 'ATTEMPTED' } });
    const sim = this.mock.simulate(orderId, order.amount, method, outcome);
    await this.handleWebhook('MOCK', Buffer.from(sim.body), { 'x-razorpay-signature': sim.signature });
    return this.orderStatus(orderId);
  }
}
