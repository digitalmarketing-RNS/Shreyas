export interface OutgoingMessage {
  to: string;
  toName?: string | null;
  subject?: string | null;
  body: string;
  /** Ordered variable values for WhatsApp template body parameters / MSG91 flow vars. */
  variables?: Record<string, string>;
  variableOrder?: string[];
  whatsappTemplateName?: string | null;
  whatsappLanguage?: string | null;
  smsDltTemplateId?: string | null;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}

export interface DeliveryResult {
  status: 'SENT' | 'SIMULATED';
  provider: string;
  providerMessageId?: string;
}

export interface ChannelDriver {
  readonly name: string;
  send(msg: OutgoingMessage): Promise<DeliveryResult>;
}

/** Normalise an Indian mobile number to 91XXXXXXXXXX (no plus). */
export function normalizeIndianMobile(phone: string): string | null {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}
