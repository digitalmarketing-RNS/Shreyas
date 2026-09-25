import type { Gateway } from '@prisma/client';

export interface CreateOrderInput {
  amount: number;
  receipt: string;
  description: string;
  notes: Record<string, string>;
  customer: { name: string; email?: string | null; phone?: string | null };
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatedOrder {
  orderId: string;
  /** Data the browser needs to open checkout (Razorpay options / redirect URL). */
  checkout: Record<string, unknown>;
}

export interface GatewayEvent {
  eventId: string;
  type: 'payment.captured' | 'payment.failed' | 'refund.processed' | 'ignored';
  orderId?: string;
  paymentId?: string;
  amount?: number;
  method?: string;
  failureReason?: string;
}

export interface GatewayPaymentRecord {
  paymentId: string;
  orderId: string | null;
  amount: number;
  fee: number;
  tax: number;
  status: string;
  method: string | null;
  createdAt: Date;
}

export interface PaymentGateway {
  readonly name: Gateway;
  readonly configured: boolean;
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;
  /** Verify the signature returned to the browser after checkout. */
  verifyCheckout(payload: Record<string, string>): { orderId: string; paymentId: string } | null;
  /** Verify + normalise a webhook. Throws if the signature is invalid. */
  parseWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): GatewayEvent;
  refund(paymentId: string, amount: number, notes: Record<string, string>): Promise<{ refundId: string }>;
  listPayments(from: Date, to: Date): Promise<GatewayPaymentRecord[]>;
}

export class InvalidSignatureError extends Error {
  constructor(msg = 'Invalid webhook signature') {
    super(msg);
  }
}

export function methodToMode(method?: string | null): 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' {
  switch ((method ?? '').toLowerCase()) {
    case 'upi':
      return 'UPI';
    case 'card':
    case 'emi':
    case 'cardless_emi':
      return 'CARD';
    case 'netbanking':
    case 'net_banking':
      return 'NET_BANKING';
    case 'wallet':
    case 'paylater':
      return 'WALLET';
    default:
      return 'UPI';
  }
}
