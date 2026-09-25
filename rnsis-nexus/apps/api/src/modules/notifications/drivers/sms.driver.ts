import { Logger } from '@nestjs/common';
import { env } from '../../../config/env';
import { ChannelDriver, DeliveryResult, normalizeIndianMobile, OutgoingMessage } from './types';

/** SMS via MSG91 (Flow API, DLT template ids) or Twilio; "log" simulates delivery. */
export class SmsDriver implements ChannelDriver {
  readonly name = env.SMS_DRIVER;
  private readonly logger = new Logger('SmsDriver');

  async send(msg: OutgoingMessage): Promise<DeliveryResult> {
    const mobile = normalizeIndianMobile(msg.to);
    if (!mobile) throw new Error(`Invalid mobile number: ${msg.to}`);

    if (env.SMS_DRIVER === 'msg91') {
      const templateId = msg.smsDltTemplateId || env.MSG91_DEFAULT_TEMPLATE_ID;
      if (!env.MSG91_AUTH_KEY || !templateId) throw new Error('MSG91 is not configured (MSG91_AUTH_KEY / template id)');
      const res = await fetch('https://control.msg91.com/api/v5/flow', {
        method: 'POST',
        headers: { authkey: env.MSG91_AUTH_KEY, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ template_id: templateId, sender: env.MSG91_SENDER_ID, short_url: '0', recipients: [{ mobiles: mobile, ...(msg.variables ?? {}), message: msg.body }] }),
      });
      const body: any = await res.json().catch(() => ({}));
      if (!res.ok || body.type === 'error') throw new Error(`MSG91 error: ${body.message ?? res.status}`);
      return { status: 'SENT', provider: 'msg91', providerMessageId: body.message };
    }

    if (env.SMS_DRIVER === 'twilio') {
      if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM) throw new Error('Twilio is not configured');
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          authorization: `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: `+${mobile}`, From: env.TWILIO_FROM, Body: msg.body }).toString(),
      });
      const body: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`Twilio error: ${body.message ?? res.status}`);
      return { status: 'SENT', provider: 'twilio', providerMessageId: body.sid };
    }

    this.logger.log(`[simulated sms] to=${mobile} "${msg.body.slice(0, 80)}…"`);
    return { status: 'SIMULATED', provider: 'log' };
  }
}
