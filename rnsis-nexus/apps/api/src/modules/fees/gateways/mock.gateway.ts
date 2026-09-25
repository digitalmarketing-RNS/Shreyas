import { randomBytes } from 'crypto';
import { env } from '../../../config/env';
import { hmac, safeEqual } from '../../../common/utils/crypto';
import { normalizeRazorpayEvent } from './razorpay.gateway';
import { CreatedOrder, CreateOrderInput, GatewayEvent, GatewayPaymentRecord, InvalidSignatureError, PaymentGateway } from './gateway.types';

/**
 * Local simulator with Razorpay-compatible payloads and real HMAC signatures, so the full
 * order → checkout → signed webhook → receipt pipeline runs without gateway credentials.
 * Never enabled implicitly in production (PAYMENT_GATEWAY must be set to "mock").
 */
export class MockGateway implements PaymentGateway {
  readonly name = 'MOCK' as const;
  readonly configured = true;

  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    const orderId = `order_mock_${randomBytes(8).toString('hex')}`;
    return { orderId, checkout: { redirectUrl: `${env.APP_URL}/pay/checkout/${orderId}`, amount: input.amount, description: input.description } };
  }

  sign(body: string) {
    return hmac(env.MOCK_GATEWAY_SECRET, body);
  }

  checkoutSignature(orderId: string, paymentId: string) {
    return hmac(env.MOCK_GATEWAY_SECRET, `${orderId}|${paymentId}`);
  }

  verifyCheckout(payload: Record<string, string>) {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sig } = payload;
    if (!orderId || !paymentId || !sig) return null;
    return safeEqual(this.checkoutSignature(orderId, paymentId), sig) ? { orderId, paymentId } : null;
  }

  /** Build the signed webhook body the "gateway" would send. */
  simulate(orderId: string, amount: number, method: string, outcome: 'success' | 'failure') {
    const paymentId = `pay_mock_${randomBytes(8).toString('hex')}`;
    const body = JSON.stringify({
      id: `evt_mock_${randomBytes(8).toString('hex')}`,
      event: outcome === 'success' ? 'payment.captured' : 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            amount,
            currency: 'INR',
            method,
            status: outcome === 'success' ? 'captured' : 'failed',
            error_description: outcome === 'failure' ? 'Payment declined by the bank (simulated)' : undefined,
          },
        },
      },
    });
    return { body, signature: this.sign(body), paymentId, checkoutSignature: this.checkoutSignature(orderId, paymentId) };
  }

  parseWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): GatewayEvent {
    const sig = String(headers['x-razorpay-signature'] ?? headers['x-mock-signature'] ?? '');
    if (!sig || !safeEqual(this.sign(rawBody.toString('utf8')), sig)) throw new InvalidSignatureError();
    return normalizeRazorpayEvent(JSON.parse(rawBody.toString('utf8')));
  }

  async refund(paymentId: string) {
    return { refundId: `rfnd_mock_${paymentId.slice(-8)}` };
  }

  async listPayments(): Promise<GatewayPaymentRecord[]> {
    return [];
  }
}
