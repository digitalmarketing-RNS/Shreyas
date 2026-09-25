import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { env } from '../../../config/env';
import { ChannelDriver, DeliveryResult, OutgoingMessage } from './types';

export class EmailDriver implements ChannelDriver {
  readonly name: string;
  private readonly logger = new Logger('EmailDriver');
  private transporter?: nodemailer.Transporter;

  constructor() {
    this.name = env.EMAIL_DRIVER;
    if (env.EMAIL_DRIVER === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      });
    } else if (env.EMAIL_DRIVER === 'sendgrid') {
      // SendGrid SMTP relay (username is literally "apikey").
      this.transporter = nodemailer.createTransport({ host: 'smtp.sendgrid.net', port: 587, auth: { user: 'apikey', pass: env.SENDGRID_API_KEY } });
    }
  }

  async send(msg: OutgoingMessage): Promise<DeliveryResult> {
    if (!this.transporter) {
      this.logger.log(`[simulated email] to=${msg.to} subject="${msg.subject}" attachments=${msg.attachments?.length ?? 0}`);
      return { status: 'SIMULATED', provider: 'log' };
    }
    const info = await this.transporter.sendMail({
      from: env.EMAIL_FROM,
      to: msg.toName ? `"${msg.toName.replace(/"/g, '')}" <${msg.to}>` : msg.to,
      subject: msg.subject ?? '',
      text: msg.body,
      html: toHtml(msg.body),
      attachments: msg.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
    });
    return { status: 'SENT', provider: this.name, providerMessageId: info.messageId };
  }
}

function toHtml(text: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const linked = esc.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>');
  return `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;line-height:1.55;color:#1f2937;max-width:620px">${linked.replace(/\n/g, '<br>')}</div>`;
}
