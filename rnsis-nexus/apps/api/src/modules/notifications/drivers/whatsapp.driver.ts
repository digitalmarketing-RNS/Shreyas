import { Logger } from '@nestjs/common';
import { env } from '../../../config/env';
import { ChannelDriver, DeliveryResult, normalizeIndianMobile, OutgoingMessage } from './types';

/**
 * WhatsApp Cloud API. Business-initiated messages must use a pre-approved template: when
 * the template row carries `whatsappTemplateName`, variables are sent as ordered body
 * parameters; otherwise a free-form text message is sent (valid only inside the 24-hour
 * customer-service window, e.g. replies to a parent's inbound message).
 */
export class WhatsAppDriver implements ChannelDriver {
  readonly name = env.WHATSAPP_DRIVER;
  private readonly logger = new Logger('WhatsAppDriver');

  async send(msg: OutgoingMessage): Promise<DeliveryResult> {
    const to = normalizeIndianMobile(msg.to);
    if (!to) throw new Error(`Invalid WhatsApp number: ${msg.to}`);
    if (env.WHATSAPP_DRIVER !== 'cloud') {
      this.logger.log(`[simulated whatsapp] to=${to} "${msg.body.slice(0, 80)}…"`);
      return { status: 'SIMULATED', provider: 'log' };
    }
    if (!env.WHATSAPP_PHONE_NUMBER_ID || !env.WHATSAPP_ACCESS_TOKEN) throw new Error('WhatsApp Cloud API is not configured');

    const payload = msg.whatsappTemplateName
      ? {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: msg.whatsappTemplateName,
            language: { code: msg.whatsappLanguage || 'en' },
            components: [
              {
                type: 'body',
                parameters: (msg.variableOrder ?? []).map((k) => ({ type: 'text', text: String(msg.variables?.[k] ?? '-').slice(0, 1000) || '-' })),
              },
            ],
          },
        }
      : { messaging_product: 'whatsapp', to, type: 'text', text: { preview_url: true, body: msg.body.slice(0, 4096) } };

    const res = await fetch(`https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`WhatsApp error: ${body?.error?.message ?? res.status}`);
    return { status: 'SENT', provider: 'whatsapp-cloud', providerMessageId: body?.messages?.[0]?.id };
  }
}
