import {
  AlarmClock,
  BellOff,
  CalendarClock,
  CirclePause,
  CircleX,
  Clock,
  CloudOff,
  CreditCard,
  EyeOff,
  FileExclamationPoint,
  FlaskConical,
  Hourglass,
  IndianRupee,
  Lock,
  type LucideIcon,
  MailX,
  Merge,
  MessageCircle,
  OctagonAlert,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  SignalLow,
  Siren,
  TimerOff,
  Unlink,
  Unplug,
  UserCog,
  UserRoundX,
} from "lucide-react";
import type { Tone } from "./tone";

/**
 * The compliance and condition messages (components.md, Banner: "Compliance and condition
 * messages"). Our own words. Alerts and Banners take a `messageKey` and read title, body, tone and
 * icon from here, so the same condition reads the same everywhere.
 *
 * Placeholders: {lead} is the lead's first name, {Institution} the tenant's name, {reason} and
 * {date} come from the record. Dates and times are in the org's zone, with "IST" for Asia/Kolkata.
 */
export type MessagePlace = "alert" | "banner";

export type ComplianceMessage = {
  /** A = Alert (inline), B = Banner (page level). */
  where: readonly MessagePlace[];
  /** Screens and audience, as the catalogue gives them. */
  shownOn: string;
  tone: Tone;
  icon: LucideIcon;
  title: string;
  body: string;
  /** The one action, if any, and who gets it. */
  action?: { label: string; audience?: string };
};

export const COMPLIANCE_MESSAGES = {
  wa_window_closed: {
    where: ["alert"],
    shownOn: "S15 composer, S10 WhatsApp tab",
    tone: "warning",
    icon: TimerOff,
    title: "Reply window closed",
    body: "{lead}'s last message was on 05 Oct, 4:12 pm IST, more than 24 hours ago. WhatsApp only allows approved templates until {lead} writes again.",
    action: { label: "Choose template" },
  },
  wa_window_closing: {
    where: ["alert"],
    shownOn: "S15 composer",
    tone: "info",
    icon: Clock,
    title: "Reply window closes in 40 min",
    body: "After 6:12 pm IST you can only send approved templates.",
  },
  wa_not_connected: {
    where: ["alert", "banner"],
    shownOn: "S15, S10, S16; Banner for admins",
    tone: "warning",
    icon: MessageCircle,
    title: "WhatsApp isn't connected",
    body: "Connect a WhatsApp Business number to send and receive WhatsApp messages. Admins can do this in Settings > Channels.",
    action: { label: "Connect WhatsApp", audience: "admins only" },
  },
  wa_reconnect: {
    where: ["banner"],
    shownOn: "everyone who sends on WhatsApp",
    tone: "danger",
    icon: Unplug,
    title: "WhatsApp needs reconnecting",
    body: "WhatsApp messages can't be sent for {Institution} until an admin reconnects the account.",
    action: { label: "Reconnect", audience: "admins" },
  },
  wa_payment_method: {
    where: ["banner"],
    shownOn: "admins",
    tone: "warning",
    icon: CreditCard,
    title: "Add a payment method in Meta",
    body: "WhatsApp won't send messages until your business adds a payment method in Meta's billing settings.",
    action: { label: "Open Meta Business settings" },
  },
  wa_display_name: {
    where: ["alert"],
    shownOn: "S35",
    tone: "info",
    icon: Hourglass,
    title: "Display name in review",
    body: "Meta is checking the name students will see. Sending starts once it's approved.",
  },
  waba_currency: {
    where: ["banner"],
    shownOn: "admins",
    tone: "warning",
    icon: IndianRupee,
    title: "Switch WhatsApp billing to INR by 31 Dec 2026",
    body: "Meta stops delivering messages from accounts billed in other currencies after that date.",
    action: { label: "How to switch" },
  },
  wa_template_review: {
    where: ["alert"],
    shownOn: "S10, S16, S19",
    tone: "warning",
    icon: Hourglass,
    title: "This template is still in review",
    body: "You can send it once Meta approves it.",
    action: { label: "Pick another template" },
  },
  wa_template_rejected: {
    where: ["alert"],
    shownOn: "S19",
    tone: "danger",
    icon: CircleX,
    title: "Meta rejected this template",
    body: "Reason given: {reason}. Edit it and submit again, or appeal.",
    action: { label: "Edit template" },
  },
  wa_template_paused: {
    where: ["alert"],
    shownOn: "S19, S16",
    tone: "warning",
    icon: CirclePause,
    title: "Meta paused this template",
    body: "It can't be sent until {date}. Broadcasts that use it are on hold.",
    action: { label: "Pick another template" },
  },
  wa_template_low: {
    where: ["alert"],
    shownOn: "S19, S16",
    tone: "warning",
    icon: SignalLow,
    title: "Low quality rating",
    body: "Students have blocked or reported messages from this template. Meta may pause it. Consider rewording it before the next broadcast.",
  },
  sms_promo_no_consent: {
    where: ["alert"],
    shownOn: "S10 SMS (one lead)",
    tone: "danger",
    icon: ShieldX,
    title: "Promotional and explicit-consent SMS can't go to {lead}",
    body: "There's no telco-registered consent, and the enquiry is more than 7 days old. Transactional and implicit-consent service SMS are still allowed.",
    action: { label: "Use a transactional or implicit-consent template" },
  },
  sms_promo_skipped: {
    where: ["alert"],
    shownOn: "S10 bulk, S16",
    tone: "warning",
    icon: ShieldX,
    title: "38 of 250 leads will be skipped",
    body: "They have no telco-registered consent for promotional or explicit-consent SMS, and their enquiries are more than 7 days old.",
    action: { label: "Download the list" },
  },
  consent_imported: {
    where: ["alert"],
    shownOn: "S07 result, S08 consents",
    tone: "info",
    icon: ShieldAlert,
    title: "Imported consents can't be used for promotional or explicit-consent SMS yet",
    body: "They must be registered on the telcos' consent platform first.",
    action: { label: "How registration works" },
  },
  opted_out: {
    where: ["alert"],
    shownOn: "S10, S08",
    tone: "warning",
    icon: BellOff,
    title: "{lead} opted out of WhatsApp",
    body: "{lead} opted out on 02 Oct 2026. Messages on this channel are off for this lead.",
  },
  email_suppressed: {
    where: ["alert"],
    shownOn: "S10, S08",
    tone: "warning",
    icon: MailX,
    title: "Email can't reach this address",
    body: "Emails to an•••@gmail.com bounced on 03 Oct 2026, so we stopped sending to it.",
    action: { label: "Edit email", audience: "if permitted" },
  },
  quiet_hours: {
    where: ["alert"],
    shownOn: "S10, S16",
    tone: "info",
    icon: Clock,
    title: "Promotional messages wait for 9:00 am IST",
    body: "They're held during quiet hours. Service messages go now.",
  },
  minor_pending: {
    where: ["alert"],
    shownOn: "S08 (top of profile)",
    tone: "warning",
    icon: ShieldAlert,
    title: "Waiting for guardian consent",
    body: "{lead} is under 18. Until a parent or guardian agrees, you can't call, message or assign {lead}.",
    action: { label: "Resend consent request" },
  },
  minor_refused: {
    where: ["alert"],
    shownOn: "S08",
    tone: "danger",
    icon: ShieldX,
    title: "Guardian refused consent",
    body: "We've stopped using {lead}'s details. They're kept only as the law requires.",
  },
  minor_limits: {
    where: ["alert"],
    shownOn: "S08, S10",
    tone: "info",
    icon: ShieldCheck,
    title: "Guardian consent given",
    body: "Promotional messages, scoring and tracking stay off for students under 18.",
  },
  stage_no_messages: {
    where: ["alert"],
    shownOn: "S10",
    tone: "warning",
    icon: Lock,
    title: "Messages are off at this stage",
    body: 'A rule for the stage "Not interested" stops messages to these leads.',
  },
  stage_locked: {
    where: ["alert"],
    shownOn: "S09",
    tone: "warning",
    icon: Lock,
    title: "This stage is locked",
    body: "Only Priya Nair and admins can change it.",
  },
  stage_no_back: {
    where: ["alert"],
    shownOn: "S09",
    tone: "info",
    icon: Lock,
    title: "Stages only move forward from here",
    body: 'From "Applied" you can pick a later stage only.',
  },
  contacts_masked: {
    where: ["alert"],
    shownOn: "S08, S05 (table toolbar, compact)",
    tone: "info",
    icon: EyeOff,
    title: "Contact details are hidden for your role",
    body: "You can still call and message students through the app.",
  },
  lead_merged: {
    where: ["alert"],
    shownOn: "S08",
    tone: "neutral",
    icon: Merge,
    title: "This record was merged",
    body: "It's now part of Ananya Rao (lead #10482) and can't be edited.",
    action: { label: "Open Ananya Rao" },
  },
  lead_restricted: {
    where: ["alert"],
    shownOn: "S08",
    tone: "neutral",
    icon: Lock,
    title: "This lead is on hold",
    body: "After a request to erase or withdraw, the details are kept only as the law requires and can't be used.",
  },
  checked_out: {
    where: ["alert"],
    shownOn: "S04",
    tone: "info",
    icon: UserRoundX,
    title: "You're checked out",
    body: "New leads go to colleagues who are checked in.",
    action: { label: "Check in" },
  },
  follow_up_clash: {
    where: ["alert"],
    shownOn: "S11",
    tone: "warning",
    icon: CalendarClock,
    title: "Another follow-up at this time",
    body: "Asha already has a follow-up at 4:30 pm IST on 07 Oct. You can still save.",
  },
  field_limit: {
    where: ["alert"],
    shownOn: 'S28 ("Add field" is aria-disabled with the same reason)',
    tone: "warning",
    icon: OctagonAlert,
    title: "Custom field limit reached",
    body: "You've used all 200 custom fields on your plan. Turn off a field you don't need, or contact us.",
  },
  notice_missing: {
    where: ["alert"],
    shownOn: "S31, privacy notices page",
    tone: "warning",
    icon: FileExclamationPoint,
    title: "No privacy notice published",
    body: "Forms can't go live until a privacy notice is published.",
    action: { label: "Open privacy notices", audience: "admins" },
  },
  dlt_chain_broken: {
    where: ["banner"],
    shownOn: "admins and SMS senders",
    tone: "danger",
    icon: Unlink,
    title: "SMS may not be delivered",
    body: "Your SMS provider reports a problem with your DLT registration chain. Messages can fail without an error until it's fixed.",
    action: { label: "Check SMS settings" },
  },
  dlt_templates_lapsing: {
    where: ["banner"],
    shownOn: "admins",
    tone: "warning",
    icon: Clock,
    title: "4 SMS templates lapse soon",
    body: "Operators deactivate templates unused for 90 days. Use them or register them again.",
    action: { label: "View templates" },
  },
  dlt_self_cert: {
    where: ["banner"],
    shownOn: "admins",
    tone: "warning",
    icon: CalendarClock,
    title: "Renew DLT self-certification by 14 Nov 2026",
    body: "Headers and templates need it every year.",
    action: { label: "How to renew" },
  },
  email_domain: {
    where: ["banner", "alert"],
    shownOn: "Banner for admins; Alert on S16 email",
    tone: "warning",
    icon: MailX,
    title: "Bulk email is off",
    body: "Add the DNS records for admissions.lakeview.edu.in. DMARC is missing. Single emails still send.",
    action: { label: "View DNS records" },
  },
  email_spam_pause: {
    where: ["banner"],
    shownOn: "admins and broadcast owners",
    tone: "danger",
    icon: CirclePause,
    title: "Email broadcasts are paused",
    body: "The spam complaint rate reached 0.3%. Broadcasts stay paused until it falls.",
    action: { label: "View sending health" },
  },
  gateway_reconnect: {
    where: ["banner"],
    shownOn: "admins and finance",
    tone: "danger",
    icon: Unplug,
    title: "Payments can't be taken",
    body: "The connection to Razorpay has expired. Payment links won't open until an admin reconnects it.",
    action: { label: "Reconnect" },
  },
  gateway_test: {
    where: ["banner"],
    shownOn: "everyone who sends payment links",
    tone: "warning",
    icon: FlaskConical,
    title: "Payments are in test mode",
    body: "No real money moves. An admin can switch to live mode in Settings > Payments.",
  },
  org_suspended: {
    where: ["banner"],
    shownOn: "everyone",
    tone: "danger",
    icon: CirclePause,
    title: "{Institution}'s account is suspended",
    body: "You can view data, but you can't send messages or take payments. Contact your account owner.",
  },
  trial_ending: {
    where: ["banner"],
    shownOn: "admins",
    tone: "info",
    icon: Clock,
    title: "Trial ends in 5 days",
    body: "Choose a plan to keep your data and settings.",
    action: { label: "View plans" },
  },
  support_access: {
    where: ["banner"],
    shownOn: "our support staff",
    tone: "info",
    icon: UserCog,
    title: "You're viewing {Institution} as support staff",
    body: "Every action you take is logged.",
  },
  requests_overdue: {
    where: ["banner"],
    shownOn: "admins with privacy rights",
    tone: "danger",
    icon: AlarmClock,
    title: "2 privacy requests are past their due date",
    body: "Students asked to see or erase their data. Reply as soon as you can.",
    action: { label: "Open requests" },
  },
  incident_deadline: {
    where: ["banner"],
    shownOn: "admins",
    tone: "danger",
    icon: Siren,
    title: "Incident report due",
    body: "CERT-In must hear within 6 hours of noticing. Noticed at 2:10 pm IST.",
    action: { label: "Open incident" },
  },
  offline: {
    where: ["banner"],
    shownOn: "session",
    tone: "warning",
    icon: CloudOff,
    title: "You're offline",
    body: "Changes won't save until your connection is back.",
  },
  new_version: {
    where: ["banner"],
    shownOn: "session",
    tone: "info",
    icon: RefreshCw,
    title: "A new version is available",
    body: "Reload to get the latest fixes. Your open dialog will close.",
    action: { label: "Reload" },
  },
} as const satisfies Record<string, ComplianceMessage>;

export type ComplianceMessageKey = keyof typeof COMPLIANCE_MESSAGES;

export const COMPLIANCE_MESSAGE_KEYS = Object.keys(COMPLIANCE_MESSAGES) as ComplianceMessageKey[];

/** Values for the placeholders in a message: { lead: "Ananya", Institution: "Lakeview College" }. */
export type MessageParams = Partial<Record<"lead" | "Institution" | "reason" | "date", string>>;

/** Replaces {name} placeholders; unknown ones are left as written so a missing value is visible in review. */
export function fillTemplate(text: string, params: MessageParams = {}): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => params[name as keyof MessageParams] ?? whole);
}

export function getComplianceMessage(key: ComplianceMessageKey, params?: MessageParams) {
  const message: ComplianceMessage = COMPLIANCE_MESSAGES[key];
  return {
    ...message,
    title: fillTemplate(message.title, params),
    body: fillTemplate(message.body, params),
  };
}
