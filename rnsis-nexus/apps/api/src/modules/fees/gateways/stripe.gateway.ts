import Stripe from 'stripe';
import { env } from '../../../config/env';
import { CreatedOrder, CreateOrderInput, GatewayEvent, GatewayPaymentRecord, InvalidSignatureError, PaymentGateway } from './gateway.types';

/** Stripe Checkout — backup gateway (cards). Session id is used as our order id. */
export class StripeGateway implements PaymentGateway {
  readonly name = 'STRIPE' as const;
  private client?: Stripe;

  get configured() {
    return Boolean(env.STRIPE_SECRET_KEY);
  }

  private stripe(): Stripe {
    if (!this.configured) throw new Error('Stripe is not configured (STRIPE_SECRET_KEY)');
    this.client ??= new Stripe(env.STRIPE_SECRET_KEY!);
    return this.client;
  }

  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    const session = await this.stripe().checkout.sessions.create({
      mode: 'payment',
      currency: 'inr',
      customer_email: input.customer.email ?? undefined,
      line_items: [{ quantity: 1, price_data: { currency: 'inr', unit_amount: input.amount, product_data: { name: input.description } } }],
      metadata: input.notes,
      payment_intent_data: { metadata: input.notes },
      success_url: `${input.returnUrl}${input.returnUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: input.cancelUrl,
    });
    return { orderId: session.id, checkout: { redirectUrl: session.url } };
  }

  verifyCheckout(): null {
    return null; // Stripe confirms via webhook only
  }

  parseWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): GatewayEvent {
    if (!env.STRIPE_WEBHOOK_SECRET) throw new InvalidSignatureError('Stripe webhook secret not configured');
    let event: Stripe.Event;
    try {
      event = this.stripe().webhooks.constructEvent(rawBody, String(headers['stripe-signature'] ?? ''), env.STRIPE_WEBHOOK_SECRET);
    } catch {
      throw new InvalidSignatureError();
    }
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.payment_status !== 'paid') return { eventId: event.id, type: 'ignored' };
      return { eventId: event.id, type: 'payment.captured', orderId: s.id, paymentId: String(s.payment_intent), amount: s.amount_total ?? undefined, method: 'card' };
    }
    if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
      const s = event.data.object as Stripe.Checkout.Session;
      return { eventId: event.id, type: 'payment.failed', orderId: s.id, failureReason: event.type };
    }
    return { eventId: event.id, type: 'ignored' };
  }

  async refund(paymentId: string, amount: number, notes: Record<string, string>) {
    const r = await this.stripe().refunds.create({ payment_intent: paymentId, amount, metadata: notes });
    return { refundId: r.id };
  }

  async listPayments(from: Date, to: Date): Promise<GatewayPaymentRecord[]> {
    const out: GatewayPaymentRecord[] = [];
    for await (const pi of this.stripe().paymentIntents.list({ created: { gte: Math.floor(from.getTime() / 1000), lte: Math.floor(to.getTime() / 1000) }, limit: 100 })) {
      out.push({ paymentId: pi.id, orderId: null, amount: pi.amount_received, fee: 0, tax: 0, status: pi.status, method: 'card', createdAt: new Date(pi.created * 1000) });
    }
    return out;
  }
}
