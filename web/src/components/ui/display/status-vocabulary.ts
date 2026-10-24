import {
  AlarmClock,
  Archive,
  ArrowDownLeft,
  BadgeCheck,
  Ban,
  BellOff,
  BellRing,
  CalendarClock,
  Check,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleMinus,
  CirclePause,
  CircleQuestionMark,
  CircleSlash,
  CircleX,
  Clock,
  CreditCard,
  Dot,
  Eye,
  FileCheck,
  FilePen,
  Flag,
  FlaskConical,
  Hourglass,
  Inbox,
  IndianRupee,
  KeyRound,
  Link,
  LoaderCircle,
  Lock,
  type LucideIcon,
  Mail,
  MailOpen,
  MailX,
  MapPin,
  Merge,
  MessageSquareText,
  MousePointerClick,
  OctagonAlert,
  PencilLine,
  Phone,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  PhoneOutgoing,
  Play,
  RefreshCw,
  RotateCcw,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  ShieldX,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Siren,
  ThumbsDown,
  ThumbsUp,
  TimerOff,
  Trash,
  TriangleAlert,
  Trophy,
  Unlink,
  Unplug,
  UserRoundCheck,
  UserRoundPen,
  UserRoundPlus,
  UserRoundX,
  Webhook,
} from "lucide-react";
import type { Tone } from "@/components/ui/feedback/tone";

/**
 * The Status vocabulary (components.md, "Status vocabulary"): the one list of status labels,
 * tones and icons the app shows. StatusPill reads it, and no component gives a state a label or
 * icon of its own. It holds every status enum in the schema's check constraints, the free-text
 * Meta and provider values the schema stores, and the derived states the UI shows ("Derived"
 * values are computed by the server; the UI never computes a status from colour).
 *
 * Every domain names its source table and column (`source`) and maps each value to:
 * - label: our words. "{name}" placeholders are filled from StatusPill's `params`.
 * - tone: neutral, info, success, warning or danger (colour only; the label and icon carry meaning).
 * - icon: a lucide-react 1.52 icon, or null where the value shows nothing.
 * - display: "pill" (default); "none" (the value shows no pill, e.g. adults' consent); "badge"
 *   (shown as a Badge tag, e.g. "Test mode"); "dot" (unread notifications: a dot and a bold title).
 * - note: the rule or detail from the vocabulary.
 */
export type StatusDisplay = "pill" | "none" | "badge" | "dot";

export type StatusEntry = {
  label: string;
  tone: Tone;
  icon: LucideIcon | null;
  display?: StatusDisplay;
  note?: string;
};

export type StatusDomainDefinition = {
  /** The vocabulary section the domain is listed under. */
  section: StatusSection;
  /** Table and column, or "(derived)" with the rule. */
  source: string;
  values: Record<string, StatusEntry>;
  /** Raw values that resolve to another value (Meta's HIGH for GREEN, REINSTATED for APPROVED). */
  aliases?: Record<string, string>;
};

export type StatusSection =
  | "Leads"
  | "Verification"
  | "Follow-ups, calls, attendance"
  | "Messaging"
  | "Channels and WhatsApp onboarding"
  | "Payments"
  | "People, operations and compliance"
  | "Settings, import and incident states";

export const STATUS_SECTIONS: readonly StatusSection[] = [
  "Leads",
  "Verification",
  "Follow-ups, calls, attendance",
  "Messaging",
  "Channels and WhatsApp onboarding",
  "Payments",
  "People, operations and compliance",
  "Settings, import and incident states",
];

const N = "neutral" as const;
const I = "info" as const;
const S = "success" as const;
const W = "warning" as const;
const D = "danger" as const;

export const STATUS_VOCABULARY = {
  /* ---------------------------------------------------------------- Leads */
  "leads.application_status": {
    section: "Leads",
    source: "leads.application_status",
    values: {
      none: { label: "Not started", tone: N, icon: CircleDashed, note: "Usually not shown as a pill; the journey shows the step as not reached." },
      started: { label: "Form started", tone: I, icon: FilePen },
      submitted: { label: "Form submitted", tone: S, icon: FileCheck },
    },
  },
  "leads.parental_consent_status": {
    section: "Leads",
    source: "leads.parental_consent_status",
    values: {
      not_required: { label: "Not needed (18 or over)", tone: N, icon: null, display: "none", note: "Adults: no pill. The label is the filter option." },
      pending: { label: "Guardian consent pending", tone: W, icon: ShieldAlert, note: "Blocks calls, messages and assignment (Alert minor_pending)." },
      verified: { label: "Guardian consent given", tone: S, icon: ShieldCheck },
      refused: { label: "Guardian refused", tone: D, icon: ShieldX, note: "Processing stops (Alert minor_refused)." },
    },
  },
  "leads.contact_verified": {
    section: "Leads",
    source: "leads.email_verified_at, mobile_verified_at (derived)",
    values: {
      set: { label: "Verified", tone: S, icon: BadgeCheck, note: "Shown next to the email or mobile." },
      null: { label: "Not verified", tone: N, icon: CircleDashed },
    },
  },
  "leads.untouched": {
    section: "Leads",
    source: "leads.untouched",
    values: {
      true: {
        label: "New",
        tone: I,
        icon: CircleDot,
        note: "Nobody has worked on the lead yet. In tables: a size-2 bg-accent dot before the name, sr-only \"New, \", and a legend \"New lead\" in the toolbar. Everywhere else: this pill.",
      },
    },
  },
  "leads.merged_into_id": {
    section: "Leads",
    source: "leads.merged_into_id (derived)",
    values: { set: { label: "Merged", tone: N, icon: Merge, note: "Read-only; links to the primary lead." } },
  },
  "leads.restricted_at": {
    section: "Leads",
    source: "leads.restricted_at (derived)",
    values: {
      set: { label: "On hold", tone: N, icon: Lock, note: "Kept under the retention hold; no business use. Filter: \"Show leads on hold\". Alert lead_restricted." },
    },
  },
  "leads.erased_at": {
    section: "Leads",
    source: "leads.erased_at (derived)",
    values: { set: { label: "Erased", tone: N, icon: ShieldOff, note: "Anonymised in place." } },
  },
  "consents.status": {
    section: "Leads",
    source: "consents.status",
    values: {
      granted: { label: "Consent given", tone: S, icon: ShieldCheck, note: "Per channel and purpose." },
      withdrawn: { label: "Consent withdrawn", tone: N, icon: ShieldOff },
    },
  },
  "consents.registration": {
    section: "Leads",
    source: "consents.imported and tsp_registered_at (derived)",
    values: {
      imported_not_registered: {
        label: "Imported, not registered",
        tone: W,
        icon: ShieldAlert,
        note: "Unusable for promotional SMS until registered with the telcos.",
      },
    },
  },
  "opportunities.status": {
    section: "Leads",
    source: "opportunities.status",
    values: {
      open: { label: "Open", tone: I, icon: CircleDot },
      won: { label: "Won", tone: S, icon: Trophy },
      lost: { label: "Lost", tone: N, icon: CircleSlash },
    },
  },
  "capture_events.outcome": {
    section: "Leads",
    source: "capture_events.outcome",
    values: {
      pending: { label: "Processing", tone: N, icon: Clock, note: "S07 result rows, S31 submission log." },
      created: { label: "Created", tone: S, icon: UserRoundPlus },
      updated: { label: "Updated existing lead", tone: I, icon: RefreshCw, note: "A repeat enquiry updated a lead (F02)." },
      rejected: { label: "Rejected", tone: W, icon: Ban, note: "Failed a rule (validation, publisher cap); the reason shows as detail." },
      failed: { label: "Failed", tone: D, icon: CircleX },
    },
  },

  /* --------------------------------------------------------- Verification */
  "verification_challenges.state": {
    section: "Verification",
    source: "verification_challenges (derived from verified_at, expires_at, attempts)",
    values: {
      sent: { label: "Code sent", tone: I, icon: Send, note: "Not verified, not expired, attempts < 5. Detail: \"to an•••@gmail.com\"." },
      verified: { label: "Verified", tone: S, icon: BadgeCheck, note: "verified_at set." },
      expired: { label: "Code expired", tone: N, icon: TimerOff, note: "expires_at passed, not verified." },
      locked: { label: "Too many tries", tone: D, icon: Lock, note: "5 attempts, not verified. A new code is needed." },
    },
  },
  "verification_challenges.decision": {
    section: "Verification",
    source: "verification_challenges.decision",
    values: {
      granted: { label: "Guardian agreed", tone: S, icon: ShieldCheck, note: "Guardian consent only." },
      refused: { label: "Guardian refused", tone: D, icon: ShieldX },
    },
  },
  "channel_accounts.domain_verified_at": {
    section: "Verification",
    source: "channel_accounts.domain_verified_at (derived)",
    values: {
      set: { label: "Domain verified", tone: S, icon: BadgeCheck, note: "Email sending domain (S35)." },
      null: { label: "DNS records not found yet", tone: W, icon: Hourglass, note: "Checked hourly by email_domain_verify." },
    },
  },
  "channel_accounts.dlt_chain_status": {
    section: "Verification",
    source: "channel_accounts.dlt_chain_status (provider text)",
    values: {
      verified: { label: "DLT chain verified", tone: S, icon: Link, note: "Provider text \"ok\" or \"verified\" (resolveDltChainStatus)." },
      broken: { label: "DLT chain broken", tone: D, icon: Unlink, note: "Any other provider text. Banner dlt_chain_broken." },
      null: { label: "Not checked yet", tone: N, icon: CircleDashed },
    },
    aliases: { ok: "verified" },
  },

  /* ------------------------------------------------ Follow-ups, calls, attendance */
  "follow_ups.status": {
    section: "Follow-ups, calls, attendance",
    source: "follow_ups.status (plus derived due states)",
    values: {
      upcoming: { label: "Upcoming", tone: N, icon: CalendarClock },
      due_today: { label: "Due today", tone: I, icon: Clock, note: "Derived: upcoming, due today, not yet due. \"Today\" is in the follow-up's own time zone." },
      overdue: { label: "Overdue", tone: D, icon: AlarmClock, note: "Derived: upcoming and starts_at < now. Text form: \"Overdue · due 05 Oct, 4:00 pm IST\"." },
      done: { label: "Done", tone: S, icon: CircleCheck },
      cancelled: { label: "Cancelled", tone: N, icon: CircleSlash, note: "Reopening sets it back to Upcoming." },
    },
  },
  "calls.status": {
    section: "Follow-ups, calls, attendance",
    source: "calls.status",
    values: {
      initiated: { label: "Calling", tone: I, icon: PhoneOutgoing },
      ringing: { label: "Ringing", tone: I, icon: BellRing },
      connected: { label: "On call", tone: I, icon: PhoneCall },
      completed: { label: "Completed", tone: S, icon: CircleCheck, note: "Detail: duration \"4 min 12 s\"." },
      missed: { label: "Missed", tone: W, icon: PhoneMissed, note: "Inbound call nobody answered." },
      no_answer: { label: "No answer", tone: W, icon: PhoneOff, note: "Outbound call the lead didn't pick up." },
      busy: { label: "Busy", tone: W, icon: CircleMinus },
      failed: { label: "Failed", tone: D, icon: CircleX },
    },
  },
  "members.check_in": {
    section: "Follow-ups, calls, attendance",
    source: "members.checked_in_at, checked_out_at (derived)",
    values: {
      in: { label: "Checked in", tone: S, icon: UserRoundCheck },
      out: { label: "Checked out", tone: N, icon: UserRoundX },
    },
  },
  "member_attendance.checkout_method": {
    section: "Follow-ups, calls, attendance",
    source: "member_attendance.checkout_method",
    values: {
      auto: { label: "Checked out automatically", tone: N, icon: TimerOff },
      manual: { label: "Checked out", tone: N, icon: UserRoundX },
    },
  },

  /* ------------------------------------------------------------ Messaging */
  "messages.status": {
    section: "Messaging",
    source: "messages.status",
    values: {
      queued: { label: "Queued", tone: N, icon: Clock, note: "Includes sends held for quiet hours (detail \"Sends at 9:00 am IST\")." },
      sending: { label: "Sending", tone: I, icon: LoaderCircle, note: "Static icon in pills; it never spins in a list." },
      sent: { label: "Sent", tone: N, icon: Check },
      delivered: { label: "Delivered", tone: I, icon: CheckCheck },
      read: { label: "Read", tone: S, icon: Eye, note: "Not shown for leads under 18 (no tracking)." },
      failed: { label: "Failed", tone: D, icon: CircleX, note: "Detail: the provider's reason in our words." },
      bounced: { label: "Bounced", tone: D, icon: MailX, note: "Email only; the address is suppressed." },
      received: { label: "Received", tone: N, icon: ArrowDownLeft, note: "Inbound." },
      skipped_opt_out: { label: "Not sent: opted out", tone: W, icon: BellOff },
      skipped_suppressed: { label: "Not sent: blocked address", tone: W, icon: Ban },
      skipped_window_closed: { label: "Not sent: reply window closed", tone: W, icon: TimerOff, note: "WhatsApp 24-hour window." },
      skipped_minor: { label: "Not sent: guardian consent needed", tone: W, icon: ShieldAlert },
      skipped_no_consent: { label: "Not sent: no consent", tone: W, icon: ShieldX, note: "Promotional or explicit-service SMS rule." },
      unknown: { label: "Not sure it was sent", tone: W, icon: CircleQuestionMark, note: "A stale send being reconciled; never re-sent blindly." },
    },
  },
  "messages.engagement": {
    section: "Messaging",
    source: "messages.opened_at, clicked_at (derived)",
    values: {
      opened: { label: "Opened", tone: I, icon: MailOpen, note: "Email; approximate (mail apps preload images). Not tracked for minors." },
      clicked: { label: "Clicked", tone: S, icon: MousePointerClick, note: "Not tracked for minors." },
    },
  },
  "conversations.status": {
    section: "Messaging",
    source: "conversations.status (plus reopened_count)",
    values: {
      queued: { label: "Waiting", tone: W, icon: Inbox, note: "Waiting to be picked up." },
      picked: { label: "Assigned", tone: I, icon: UserRoundCheck, note: "Detail: the assignee's name." },
      resolved: { label: "Resolved", tone: S, icon: CircleCheck },
      reopened: { label: "Reopened", tone: W, icon: RotateCcw, note: "Derived: reopened_count > 0 and not resolved." },
    },
  },
  "conversations.service_window": {
    section: "Messaging",
    source: "conversations.service_window_ends_at (derived)",
    values: {
      open: { label: "Reply window open", tone: S, icon: MessageSquareText, note: "In the future. Detail: \"3 hr left\"." },
      closed: { label: "Templates only", tone: W, icon: TimerOff, note: "Past or null." },
    },
  },
  "broadcasts.status": {
    section: "Messaging",
    source: "broadcasts.status (plus derived retrying)",
    values: {
      draft: { label: "Draft", tone: N, icon: PencilLine },
      scheduled: { label: "Scheduled", tone: I, icon: CalendarClock, note: "Detail: \"07 Oct, 10:00 am IST\"." },
      sending: { label: "Sending", tone: I, icon: LoaderCircle },
      retrying: { label: "Retrying", tone: I, icon: RefreshCw, note: "Derived: sending or done, with recipients waiting for a retry. Detail: \"Next try 08 Oct, 10:00 am IST\"." },
      paused: { label: "Paused", tone: W, icon: CirclePause, note: "Detail: paused_reason in our words." },
      done: { label: "Done", tone: S, icon: CircleCheck },
      failed: { label: "Failed", tone: D, icon: CircleX },
      cancelled: { label: "Cancelled", tone: N, icon: CircleSlash },
    },
  },
  "broadcast_recipients.status": {
    section: "Messaging",
    source: "broadcast_recipients.status",
    values: {
      pending: { label: "Waiting", tone: N, icon: Clock },
      sent: { label: "Sent", tone: I, icon: Check, note: "Delivery then follows messages.status." },
      failed: { label: "Failed", tone: D, icon: CircleX, note: "Detail \"Will retry 08 Oct\" while next_retry_at is set." },
      skipped: { label: "Skipped", tone: W, icon: CircleMinus, note: "Detail: the reason (opted out, no consent, minor)." },
    },
  },
  "templates.active": {
    section: "Messaging",
    source: "templates.active",
    values: {
      true: { label: "Active", tone: S, icon: CircleCheck, note: "Email and SMS templates." },
      false: { label: "Turned off", tone: N, icon: CircleSlash },
    },
  },
  "templates.wa_status": {
    section: "Messaging",
    source: "templates.wa_status (Meta value)",
    values: {
      null: { label: "Draft", tone: N, icon: PencilLine, note: "Not submitted yet. The one source for WhatsApp template pills (WhatsAppTemplatePreview uses it)." },
      PENDING: { label: "In review", tone: W, icon: Hourglass },
      APPROVED: { label: "Approved", tone: S, icon: CircleCheck, note: "REINSTATED and UNARCHIVED events also resolve here (or to the restored status)." },
      REJECTED: { label: "Rejected", tone: D, icon: CircleX, note: "Detail: wa_rejection_reason." },
      PAUSED: { label: "Paused by Meta", tone: W, icon: CirclePause },
      DISABLED: { label: "Disabled by Meta", tone: D, icon: Ban },
      FLAGGED: { label: "At risk", tone: W, icon: Flag, note: "Negative feedback; may be disabled." },
      IN_APPEAL: { label: "Appeal in review", tone: I, icon: Scale },
      LOCKED: { label: "Locked", tone: N, icon: Lock, note: "Can't be edited." },
      LIMIT_EXCEEDED: { label: "Template limit reached", tone: W, icon: OctagonAlert, note: "The account is at Meta's template limit." },
      ARCHIVED: { label: "Archived", tone: N, icon: Archive, note: "Unused; deleted after 28 days unless restored." },
      PENDING_DELETION: { label: "Being deleted", tone: N, icon: Trash },
      DELETED: { label: "Deleted", tone: N, icon: Trash },
    },
    aliases: { REINSTATED: "APPROVED", UNARCHIVED: "APPROVED" },
  },
  "templates.wa_quality": {
    section: "Messaging",
    source: "templates.wa_quality (Meta value)",
    values: {
      GREEN: { label: "High quality", tone: S, icon: SignalHigh },
      YELLOW: { label: "Medium quality", tone: W, icon: SignalMedium },
      RED: { label: "Low quality", tone: D, icon: SignalLow, note: "Alert wa_template_low." },
      UNKNOWN: { label: "Not rated yet", tone: N, icon: Signal },
    },
    aliases: { HIGH: "GREEN", MEDIUM: "YELLOW", LOW: "RED", null: "UNKNOWN" },
  },
  "templates.dlt_last_used_at": {
    section: "Messaging",
    source: "templates.dlt_last_used_at (derived)",
    values: {
      lapses_soon: { label: "Lapses soon", tone: W, icon: Clock, note: "Last used 80 days or more ago. Operators deactivate at 90 days." },
    },
  },
  "sms_headers.status": {
    section: "Messaging",
    source: "sms_headers.status",
    values: {
      active: { label: "Active", tone: S, icon: CircleCheck },
      inactive: { label: "Inactive", tone: N, icon: CircleSlash },
    },
  },

  /* --------------------------------------------- Channels and WhatsApp onboarding */
  "channel_accounts.status": {
    section: "Channels and WhatsApp onboarding",
    source: "channel_accounts.status",
    values: {
      pending: { label: "Setting up", tone: I, icon: Hourglass },
      connected: { label: "Connected", tone: S, icon: CircleCheck },
      restricted: { label: "Restricted", tone: W, icon: TriangleAlert, note: "Detail: Meta's or the provider's reason." },
      disconnected: { label: "Disconnected", tone: N, icon: Unplug },
      reconnect_required: { label: "Reconnect needed", tone: D, icon: CircleAlert, note: "Banner wa_reconnect for WhatsApp." },
    },
  },
  "channel_accounts.onboarding_state": {
    section: "Channels and WhatsApp onboarding",
    source: "channel_accounts.onboarding_state",
    values: {
      linked: { label: "Number linked", tone: I, icon: Link, note: "WhatsApp number steps, in this order." },
      region_set: { label: "Data stored in India", tone: I, icon: MapPin, note: "Must happen before registration." },
      phone_registered: { label: "Number registered", tone: I, icon: Phone },
      display_name_pending: { label: "Display name in review", tone: W, icon: Hourglass },
      live: { label: "Live", tone: S, icon: CircleCheck },
      deregistered: { label: "Deregistered", tone: N, icon: Unplug },
    },
  },
  "channel_accounts.wa_quality": {
    section: "Channels and WhatsApp onboarding",
    source: "channel_accounts.wa_quality (Meta value)",
    values: {
      GREEN: { label: "High quality", tone: S, icon: SignalHigh, note: "Phone number quality rating." },
      YELLOW: { label: "Medium quality", tone: W, icon: SignalMedium },
      RED: { label: "Low quality", tone: D, icon: SignalLow },
      UNKNOWN: { label: "Not rated yet", tone: N, icon: Signal },
    },
    aliases: { null: "UNKNOWN" },
  },
  "wa_business_accounts.onboarding_state": {
    section: "Channels and WhatsApp onboarding",
    source: "wa_business_accounts.onboarding_state",
    values: {
      code_received: { label: "Sign-up started", tone: I, icon: Hourglass },
      token_exchanged: { label: "Account linked", tone: I, icon: KeyRound },
      waba_subscribed: { label: "Receiving updates", tone: I, icon: Webhook },
      payment_method_pending: { label: "Payment method needed", tone: W, icon: CreditCard, note: "Banner wa_payment_method." },
      live: { label: "Live", tone: S, icon: CircleCheck, note: "Requires INR billing." },
      offboarded: { label: "Disconnected", tone: N, icon: Unplug },
    },
  },
  "wa_business_accounts.currency": {
    section: "Channels and WhatsApp onboarding",
    source: "wa_business_accounts.currency (derived)",
    values: {
      not_inr: { label: "Billing not in INR", tone: W, icon: IndianRupee, note: "Banner waba_currency until 31 Dec 2026, then danger." },
    },
  },

  /* ------------------------------------------------------------- Payments */
  "payments.status": {
    section: "Payments",
    source: "payments.status",
    values: {
      created: { label: "Not started", tone: N, icon: CircleDashed, note: "Attempt created, student hasn't paid." },
      pending: { label: "Pending", tone: W, icon: Clock, note: "Online: waiting for the gateway." },
      pending_offline: { label: "Waiting for approval", tone: W, icon: Hourglass, note: "pending, offline: waiting for approval." },
      success: { label: "Paid", tone: S, icon: CircleCheck },
      failed: { label: "Failed", tone: D, icon: CircleX },
      expired: { label: "Expired", tone: N, icon: TimerOff },
      cancelled: { label: "Cancelled", tone: N, icon: CircleSlash },
      unknown: { label: "Checking with gateway", tone: W, icon: CircleQuestionMark, note: "payment_reconcile is confirming it." },
      refunded: { label: "Refunded", tone: N, icon: RotateCcw, note: "Amount shows with \"refund\" text (Money)." },
      partially_refunded: { label: "Partly refunded", tone: N, icon: RotateCcw, note: "Detail: \"₹500.00 of ₹1,000.00 refunded\"." },
    },
  },
  "payment_links.status": {
    section: "Payments",
    source: "payment_links.status (plus derived lapsed)",
    values: {
      active: { label: "Active", tone: I, icon: Link, note: "Detail: \"Expires 10 Oct, 11:59 pm IST\"." },
      lapsed: { label: "Expired", tone: N, icon: TimerOff, note: "Derived: active and expires_at passed. Shown before payment_link_expire runs." },
      paid: { label: "Paid", tone: S, icon: CircleCheck },
      expired: { label: "Expired", tone: N, icon: TimerOff },
      cancelled: { label: "Cancelled", tone: N, icon: CircleSlash },
    },
  },
  "refunds.status": {
    section: "Payments",
    source: "refunds.status",
    values: {
      requested: { label: "Waiting for approval", tone: W, icon: Hourglass, note: "Maker-checker: someone else must approve." },
      approved: { label: "Approved", tone: I, icon: BadgeCheck },
      pending: { label: "Processing", tone: I, icon: LoaderCircle, note: "Sent to the gateway." },
      refunded: { label: "Refunded", tone: S, icon: CircleCheck },
      failed: { label: "Failed", tone: D, icon: CircleX },
      rejected: { label: "Rejected", tone: N, icon: Ban },
    },
  },
  "payment_gateways.status": {
    section: "Payments",
    source: "payment_gateways.status",
    values: {
      pending: { label: "Not verified yet", tone: W, icon: Hourglass },
      connected: { label: "Connected", tone: S, icon: CircleCheck },
      disabled: { label: "Turned off", tone: N, icon: CircleSlash },
      reconnect_required: { label: "Reconnect needed", tone: D, icon: CircleAlert, note: "Banner gateway_reconnect." },
    },
  },
  "payment_gateways.mode": {
    section: "Payments",
    source: "payment_gateways.mode",
    values: {
      test: { label: "Test mode", tone: W, icon: FlaskConical, display: "badge", note: "Shown as a Badge (tag warning), not a pill." },
      live: { label: "Live", tone: N, icon: null, display: "none", note: "No badge." },
    },
  },

  /* ------------------------------------------ People, operations and compliance */
  "orgs.status": {
    section: "People, operations and compliance",
    source: "orgs.status",
    values: {
      active: { label: "Active", tone: N, icon: null, display: "none", note: "No pill." },
      suspended: { label: "Suspended", tone: W, icon: CirclePause, note: "Banner org_suspended." },
      closed: { label: "Closed", tone: N, icon: Archive },
    },
  },
  "orgs.plan": {
    section: "People, operations and compliance",
    source: "orgs.plan",
    values: {
      trial: { label: "Trial", tone: I, icon: Clock, display: "badge", note: "Badge in OrgSwitcher; detail \"12 days left\"." },
    },
  },
  "publishers.active": {
    section: "People, operations and compliance",
    source: "publishers.active (plus derived cap)",
    values: {
      true: { label: "Active", tone: S, icon: CircleCheck, note: "S41." },
      false: { label: "Paused", tone: W, icon: CirclePause },
      cap_reached: { label: "Daily cap reached", tone: W, icon: OctagonAlert, note: "Derived: active and today's leads >= daily_cap. Detail: \"New leads are rejected until midnight IST\"." },
    },
  },
  "forms.active": {
    section: "People, operations and compliance",
    source: "forms.active",
    values: {
      true: { label: "Accepting enquiries", tone: S, icon: CircleCheck, note: "S31." },
      false: { label: "Not accepting enquiries", tone: N, icon: CircleSlash },
    },
  },
  "notices.version": {
    section: "People, operations and compliance",
    source: "notices.published_at (plus derived versions)",
    values: {
      draft: { label: "Draft", tone: N, icon: PencilLine, note: "published_at null. Privacy notices, per language." },
      published: { label: "Published", tone: S, icon: CircleCheck, note: "The latest published version for its language. Frozen: changes publish a new version." },
      older: { label: "Older version", tone: N, icon: Archive, note: "Consents keep pointing at the version they saw." },
    },
  },
  "members.status": {
    section: "People, operations and compliance",
    source: "members.status",
    values: {
      invited: { label: "Invited", tone: I, icon: Mail },
      active: { label: "Active", tone: S, icon: CircleCheck },
      inactive: { label: "Inactive", tone: N, icon: CircleSlash },
    },
  },
  "api_keys.revoked_at": {
    section: "People, operations and compliance",
    source: "api_keys.revoked_at (derived)",
    values: {
      null: { label: "Active", tone: S, icon: KeyRound },
      set: { label: "Revoked", tone: N, icon: Ban },
    },
  },
  "automations.state": {
    section: "People, operations and compliance",
    source: "automations (derived from active, versions and validation)",
    values: {
      draft: { label: "Draft", tone: N, icon: PencilLine, note: "Never published." },
      on: { label: "On", tone: S, icon: Play, note: "active true." },
      paused: { label: "Paused", tone: W, icon: CirclePause, note: "active false, published before." },
      needs_fixing: { label: "Needs fixing", tone: D, icon: CircleAlert, note: "Draft graph invalid, e.g. a trigger on a field that is empty at creation." },
    },
  },
  "automation_runs.status": {
    section: "People, operations and compliance",
    source: "automation_runs.status",
    values: {
      running: { label: "Running", tone: I, icon: LoaderCircle },
      waiting: { label: "Waiting", tone: N, icon: Hourglass, note: "Detail: \"Until 06 Oct, 4:00 pm IST\"." },
      done: { label: "Finished", tone: S, icon: CircleCheck },
      failed: { label: "Failed", tone: D, icon: CircleX },
      cancelled: { label: "Cancelled", tone: N, icon: CircleSlash },
    },
  },
  "automation_steps.status": {
    section: "People, operations and compliance",
    source: "automation_steps.status",
    values: {
      done: { label: "Done", tone: S, icon: CircleCheck, note: "Per-step counts on S18." },
      skipped: { label: "Skipped", tone: N, icon: CircleMinus },
      failed: { label: "Failed", tone: D, icon: CircleX },
    },
  },
  "jobs.status": {
    section: "People, operations and compliance",
    source: "jobs.status (plus derived states)",
    values: {
      queued: { label: "Queued", tone: N, icon: Clock },
      running: { label: "Running", tone: I, icon: LoaderCircle },
      not_responding: { label: "Not responding", tone: W, icon: Hourglass, note: "Derived: running, no heartbeat for 2 min." },
      done: { label: "Done", tone: S, icon: CircleCheck },
      done_with_errors: { label: "Done with errors", tone: W, icon: TriangleAlert, note: "Derived: done and totals.failed > 0." },
      failed: { label: "Failed", tone: D, icon: CircleX },
      cancelled: { label: "Stopped", tone: N, icon: CircleSlash },
    },
  },
  "tickets.status": {
    section: "People, operations and compliance",
    source: "tickets.status",
    values: {
      open: { label: "Open", tone: I, icon: CircleDot },
      in_progress: { label: "In progress", tone: I, icon: LoaderCircle },
      closed: { label: "Closed", tone: S, icon: CircleCheck },
    },
  },
  "tickets.feedback": {
    section: "People, operations and compliance",
    source: "tickets.feedback",
    values: {
      positive: { label: "Helpful", tone: N, icon: ThumbsUp, display: "badge", note: "A Badge, not a pill." },
      negative: { label: "Not helpful", tone: N, icon: ThumbsDown, display: "badge", note: "A Badge, not a pill." },
    },
  },
  "data_requests.status": {
    section: "People, operations and compliance",
    source: "data_requests.status (plus derived overdue)",
    values: {
      open: { label: "New", tone: I, icon: Inbox },
      in_progress: { label: "In progress", tone: I, icon: LoaderCircle },
      done: { label: "Completed", tone: S, icon: CircleCheck },
      rejected: { label: "Declined", tone: N, icon: Ban, note: "Detail: the reason given to the requester." },
      overdue: { label: "Overdue", tone: D, icon: AlarmClock, note: "Derived: open or in_progress and due_at passed. Banner requests_overdue." },
    },
  },
  "incidents.status": {
    section: "People, operations and compliance",
    source: "incidents.status (plus derived report deadlines)",
    values: {
      open: { label: "Open", tone: D, icon: Siren },
      contained: { label: "Contained", tone: W, icon: ShieldAlert },
      closed: { label: "Closed", tone: S, icon: ShieldCheck },
      cert_in_overdue: { label: "CERT-In report overdue", tone: D, icon: AlarmClock, note: "Derived: cert_in_reported_at null and 6 h since detected_at." },
      board_overdue: { label: "Board report overdue", tone: D, icon: AlarmClock, note: "Derived: 72 h after aware_at with no detailed report." },
    },
  },
  "webhook_deliveries.status": {
    section: "People, operations and compliance",
    source: "webhook_deliveries.status",
    values: {
      pending: { label: "Pending", tone: N, icon: Clock },
      delivered: { label: "Delivered", tone: S, icon: CircleCheck },
      failed: { label: "Failed, will retry", tone: W, icon: RefreshCw, note: "Retries back off over 24 h." },
      dead: { label: "Stopped retrying", tone: D, icon: CircleX },
    },
  },
  "notifications.state": {
    section: "People, operations and compliance",
    source: "notifications.read_at, acted_at (derived)",
    values: {
      unread: { label: "Unread", tone: I, icon: Dot, display: "dot", note: "read_at null. Shown as a dot and bold title, not a pill." },
      done: { label: "Done", tone: S, icon: CircleCheck, note: "acted_at set." },
      missed: { label: "Missed", tone: W, icon: CircleAlert, note: "acted_at null after the response window (30 minutes by default, open question 15)." },
    },
  },

  /* -------------------------------------------- Settings, import and incident states */
  "settings.enabled": {
    section: "Settings, import and incident states",
    source: "stages.enabled, sub_stages.enabled, picklist_values.active",
    values: {
      false: {
        label: "Off",
        tone: N,
        icon: CircleSlash,
        note: "Settings lists (ReorderableList, TreeEditor). On a lead, a turned-off stage shows as its name plus \"(turned off)\" in text-muted, not a pill.",
      },
    },
  },
  "roles.is_system": {
    section: "Settings, import and incident states",
    source: "roles.is_system",
    values: {
      true: { label: "Built in", tone: N, icon: Lock, note: "PermissionMatrix role header. The four roles seeded for every institution." },
    },
  },
  "notices.language": {
    section: "Settings, import and incident states",
    source: "notices (derived, per language)",
    values: {
      missing: { label: "Missing", tone: W, icon: CircleAlert, note: "The draft's text is empty for a language the forms offer. Publishing is blocked until every offered language has its text." },
    },
  },
  "column_mapping.state": {
    section: "Settings, import and incident states",
    source: "column mapping (derived, not stored)",
    values: {
      matched: { label: "Matched", tone: S, icon: CircleCheck, note: "Matched by header name. ColumnMapper (S07, S26)." },
      matched_by_you: { label: "Matched by you", tone: N, icon: UserRoundPen },
      not_imported: { label: "Not imported", tone: N, icon: CircleSlash, note: "\"Don't import\" chosen." },
      check: { label: "Check this", tone: W, icon: TriangleAlert, note: "Sample values don't fit the field, or picklist values are not on the list. The import can still run." },
      problem: { label: "Problem", tone: D, icon: CircleX, note: "Two columns on one field. The import can't start until it is fixed." },
    },
  },
  "incidents.report_deadline": {
    section: "Settings, import and incident states",
    source: "incidents (derived, per report deadline)",
    values: {
      time_left: {
        label: "{timeLeft} left",
        tone: W,
        icon: Clock,
        note: "Not sent, due time ahead. CERT-In: 6 h after detected_at. Board detailed report: 72 h after aware_at. Static text, refreshed each minute, never announced.",
      },
      sent: { label: "Sent {time}", tone: S, icon: CircleCheck, note: "cert_in_reported_at or board_detailed_report_at recorded." },
      overdue: { label: "Overdue", tone: D, icon: AlarmClock, note: "Not sent, due time passed. Banner incident_deadline for admins." },
    },
  },
} as const satisfies Record<string, StatusDomainDefinition>;

export type StatusDomain = keyof typeof STATUS_VOCABULARY;

/** The known values of a domain: StatusValue<"payments.status"> is "created" | "pending" | … */
export type StatusValue<D extends StatusDomain> = Extract<keyof (typeof STATUS_VOCABULARY)[D]["values"], string>;

export const STATUS_DOMAINS = Object.keys(STATUS_VOCABULARY) as StatusDomain[];

export type ResolvedStatus = StatusEntry & { known: boolean; value: string };

/** The fallback for a value the vocabulary doesn't know (a new value from Meta): it never breaks the page. */
export function unknownStatus(raw: string): ResolvedStatus {
  return { label: `Unknown (${raw})`, tone: "neutral", icon: CircleQuestionMark, known: false, value: raw };
}

/**
 * Looks a raw value up in a domain, following aliases. null and undefined read as "null".
 * Unknown values come back as neutral "Unknown ({raw})" with known: false; the caller logs them.
 */
export function resolveStatus(domain: StatusDomain, raw: string | boolean | null | undefined): ResolvedStatus {
  const definition: StatusDomainDefinition = STATUS_VOCABULARY[domain];
  const key = raw === null || raw === undefined ? "null" : String(raw);
  const resolved = definition.values[key] ? key : definition.aliases?.[key];
  const entry = resolved ? definition.values[resolved] : undefined;
  if (!entry) return unknownStatus(key);
  return { ...entry, known: true, value: resolved ?? key };
}

/** Fills "{name}" placeholders in a label ("{timeLeft} left" → "4 hr 10 min left"). */
export function fillStatusLabel(label: string, params: Record<string, string> = {}): string {
  return label.replace(/\{(\w+)\}/g, (whole, name: string) => params[name] ?? whole);
}

/** DLT chain status is free text from each SMS provider; "ok" or "verified" mean verified (open question 22). */
export function resolveDltChainStatus(providerText: string | null | undefined): StatusValue<"channel_accounts.dlt_chain_status"> {
  if (providerText === null || providerText === undefined || providerText.trim() === "") return "null";
  return /^(ok|verified)$/i.test(providerText.trim()) ? "verified" : "broken";
}

/* -------------------------------------------------------------------------------------------------
 * Labels for other enums: plain text (timeline lines, attribution tables, form options, details),
 * never raw keys, never pills.
 * -----------------------------------------------------------------------------------------------*/

export const ENUM_LABELS = {
  "suppressions.reason": {
    hard_bounce: "Email bounced",
    complaint: "Marked as spam",
    unsubscribe: "Unsubscribed",
    stop_keyword: "Replied STOP",
    manual: "Blocked by staff",
    erasure: "Data erased",
  },
  "source_touches.channel": {
    direct: "Direct",
    publisher: "Publisher",
    social: "Social",
    organic: "Search (organic)",
    referral: "Referral",
    other: "Other",
    telephony: "Phone call",
    offline: "Offline",
    paid_ads: "Paid ads",
    chat: "Chat",
  },
  "source_touches.origin": {
    offline: "Offline",
    online: "Online",
    api: "API",
    telephony: "Phone call",
    form: "Enquiry form",
    chat: "Chat",
  },
  "source_touches.position": { first: "First", second: "Second", third: "Third", latest: "Latest" },
  "lead_assignments.action": {
    assigned: "Assigned",
    added: "Added as owner",
    replaced: "Replaced owners",
    unassigned: "Unassigned",
  },
  "lead_assignments.method": {
    manual: "by hand",
    automation: "by automation",
    import: "by import",
    api: "by API",
    telephony: "from a call",
    round_robin: "by round robin",
    bulk: "in bulk",
  },
  "payments.offline_mode": {
    cash: "Cash",
    cheque: "Cheque",
    dd: "Demand draft",
    neft: "NEFT or bank transfer",
    other: "Other",
  },
  "data_requests.channel": { portal: "Privacy page", email: "Email", phone: "Phone", in_person: "In person" },
  "consents.purpose": {
    marketing: "Updates and offers",
    service: "Service messages",
    data_processing: "Answering the enquiry",
  },
  "consents.given_by": { self: "Student", guardian: "Guardian" },
  "field_defs.type": {
    text: "Short text",
    paragraph: "Paragraph",
    number: "Number",
    email: "Email",
    mobile: "Mobile number",
    date: "Date",
    dropdown: "Dropdown",
    multiselect: "Multiple choice",
    upload: "File upload",
  },
  "field_defs.quick_add": { show: "Shown", hide: "Hidden", mandatory: "Required" },
  "stage_rules.effect": {
    lock: "Lock the stage",
    only_users: "Only these people can move leads here",
    no_move_down: "Moves forward only",
    lock_follow_up: "Lock the follow-up date",
    no_remarks: "No remarks",
    remark_required: "Remark required",
    no_messages: "No messages",
  },
  "lead_ad_connections.provider": { google_ads: "Google Ads lead forms", meta_lead_ads: "Meta lead ads" },
  "follow_up_reminders.channel": { in_app: "In the app", email: "Email", push: "Phone notification" },
  "orgs.plan": { starter: "Starter", growth: "Growth", enterprise: "Enterprise" },
} as const satisfies Record<string, Record<string, string>>;

/**
 * Categories, not statuses: shown as Badge tags with these labels.
 */
export const CATEGORY_LABELS = {
  "templates.nature": { promotional: "Promotional", transactional: "Transactional", service: "Service" },
  "calls.purpose": { promotional: "Promotional", transactional: "Transactional", service: "Service" },
  "templates.dlt_category": {
    promotional: "Promotional",
    service_implicit: "Service (implicit)",
    service_explicit: "Service (explicit)",
    transactional: "Transactional",
  },
  "sms_headers.category": {
    promotional: "Promotional",
    service_implicit: "Service (implicit)",
    service_explicit: "Service (explicit)",
    transactional: "Transactional",
    government: "Government",
  },
  "templates.wa_category": { MARKETING: "Marketing", UTILITY: "Utility", AUTHENTICATION: "Authentication" },
  "data_requests.kind": {
    access: "Access",
    correction: "Correction",
    erasure: "Erasure",
    consent_withdrawal: "Consent withdrawal",
    grievance: "Grievance",
  },
  "data_requests.requested_by": { student: "Student", guardian: "Guardian", nominee: "Nominee" },
  "field_defs.sensitivity": { personal: "Personal data", health: "Health data" },
} as const satisfies Record<string, Record<string, string>>;

/** Shown as plain text, not pills: `channel` and `direction` fields, `calls.via`, and ENUM_LABELS. */
export const PLAIN_TEXT_FIELDS = ["channel", "direction", "calls.via"] as const;

export type EnumLabelSource = keyof typeof ENUM_LABELS;

/** The plain-text label of an enum value; the raw key never shows (unknown values read "Other"). */
export function enumLabel<K extends EnumLabelSource>(source: K, value: string): string {
  const labels: Record<string, string> = ENUM_LABELS[source];
  return labels[value] ?? "Other";
}
