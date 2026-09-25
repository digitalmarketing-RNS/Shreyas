import Razorpay from 'razorpay';
import { env } from '../../../config/env';
import { hmac, safeEqual } from '../../../common/utils/crypto';
import { CreatedOrder, CreateOrderInput, GatewayEvent, GatewayPaymentRecord, InvalidSignatureError, PaymentGateway } from './gateway.types';

/** Razorpay — UPI, cards, net banking, wallets. Webhooks: payment.captured / payment.failed / refund.processed. */
export class RazorpayGateway implements PaymentGateway {
  readonly name = 'RAZORPAY' as const;
  private client?: Razorpay;

  get configured() {
    return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
  }

  rzp(): Razorpay {
    if (!this.configured) throw new Error('Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)');
    this.client ??= new Razorpay({ key_id: env.RAZORPAY_KEY_ID!, key_secret: env.RAZORPAY_KEY_SECRET! });
    return this.client;
  }

  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    const order: any = await this.rzp().orders.create({ amount: input.amount, currency: 'INR', receipt: input.receipt.slice(0, 40), notes: input.notes });
    return {
      orderId: order.id,
      checkout: {
        key: env.RAZORPAY_KEY_ID,
        order_id: order.id,
        amount: input.amount,
        currency: 'INR',
        name: input.notes.school ?? 'RNSIS International School',
        description: input.description,
        prefill: { name: input.customer.name, email: input.customer.email ?? undefined, contact: input.customer.phone ?? undefined },
        notes: input.notes,
        theme: { color: '#1e3a8a' },
      },
    };
  }

  verifyCheckout(payload: Record<string, string>) {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sig } = payload;
    if (!orderId || !paymentId || !sig || !env.RAZORPAY_KEY_SECRET) return null;
    return safeEqual(hmac(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`), sig) ? { orderId, paymentId } : null;
  }

  parseWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): GatewayEvent {
    const sig = String(headers['x-razorpay-signature'] ?? '');
    if (!env.RAZORPAY_WEBHOOK_SECRET || !sig || !safeEqual(hmac(env.RAZORPAY_WEBHOOK_SECRET, rawBody.toString('utf8')), sig)) throw new InvalidSignatureError();
    return normalizeRazorpayEvent(JSON.parse(rawBody.toString('utf8')), String(headers['x-razorpay-event-id'] ?? ''));
  }

  async refund(paymentId: string, amount: number, notes: Record<string, string>) {
    const r: any = await this.rzp().payments.refund(paymentId, { amount, notes });
    return { refundId: r.id };
  }

  async listPayments(from: Date, to: Date): Promise<GatewayPaymentRecord[]> {
    const out: GatewayPaymentRecord[] = [];
    for (let skip = 0; skip < 10_000; skip += 100) {
      const res: any = await this.rzp().payments.all({ from: Math.floor(from.getTime() / 1000), to: Math.floor(to.getTime() / 1000), count: 100, skip });
      for (const p of res.items ?? []) {
        out.push({ paymentId: p.id, orderId: p.order_id ?? null, amount: p.amount, fee: p.fee ?? 0, tax: p.tax ?? 0, status: p.status, method: p.method ?? null, createdAt: new Date(p.created_at * 1000) });
      }
      if ((res.items ?? []).length < 100) break;
    }
    return out;
  }
}

/** Shared by the Razorpay and Mock gateways (same payload shape). */
export function normalizeRazorpayEvent(body: any, headerEventId = ''): GatewayEvent {
  const eventId = headerEventId || body.id || `${body.event}:${body.payload?.payment?.entity?.id ?? body.payload?.refund?.entity?.id ?? Date.now()}`;
  const payment = body.payload?.payment?.entity;
  switch (body.event) {
    case 'payment.captured':
    case 'order.paid':
      return { eventId, type: 'payment.captured', orderId: payment?.order_id ?? body.payload?.order?.entity?.id, paymentId: payment?.id, amount: payment?.amount, method: payment?.method };
    case 'payment.failed':
      return { eventId, type: 'payment.failed', orderId: payment?.order_id, paymentId: payment?.id, amount: payment?.amount, failureReason: payment?.error_description ?? payment?.error_reason ?? 'Payment failed' };
    case 'refund.processed':
      return { eventId, type: 'refund.processed', paymentId: body.payload?.refund?.entity?.payment_id, amount: body.payload?.refund?.entity?.amount };
    default:
      return { eventId, type: 'ignored' };
  }
}
