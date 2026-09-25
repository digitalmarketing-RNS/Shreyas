import type { NotificationChannel } from '@prisma/client';

export interface TemplateDef {
  key: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
  whatsappTemplateName?: string;
}

/**
 * Built-in message templates, seeded into MessageTemplate (where admins edit them) and
 * used as a fallback when a school has not customised a template yet. Placeholders use
 * {{variable}} syntax. SMS bodies stay under ~300 chars for DLT templates.
 */
const T = (key: string, name: string, variables: string[], email: { subject: string; body: string }, sms: string, whatsapp: string): TemplateDef[] => [
  { key, name, channel: 'EMAIL', subject: email.subject, body: email.body, variables },
  { key, name, channel: 'SMS', body: sms, variables },
  { key, name, channel: 'WHATSAPP', body: whatsapp, variables, whatsappTemplateName: key.toLowerCase() },
];

export const DEFAULT_TEMPLATES: TemplateDef[] = [
  ...T(
    'ENQUIRY_ACK',
    'Enquiry acknowledgement',
    ['parent_name', 'student_name', 'grade', 'enquiry_no', 'school_name', 'school_phone', 'apply_url'],
    {
      subject: 'Thank you for your enquiry — {{school_name}}',
      body: 'Dear {{parent_name}},\n\nThank you for your interest in {{school_name}} for {{student_name}} ({{grade}}). Your enquiry number is {{enquiry_no}}.\n\nOur admissions team will contact you shortly. Admission at RNSIS is direct — there is no entrance test or interview, and the online application is free. You can apply right away here:\n{{apply_url}}\n\nFor any questions call us at {{school_phone}}.\n\nWarm regards,\nAdmissions Office\n{{school_name}}',
    },
    'Dear {{parent_name}}, thank you for enquiring at {{school_name}} for {{student_name}} ({{grade}}). Ref {{enquiry_no}}. Apply free online: {{apply_url}} - RNSIS',
    'Hello {{parent_name}} 👋\nThank you for your enquiry for *{{student_name}}* ({{grade}}) at {{school_name}}.\nEnquiry no: {{enquiry_no}}\n\nAdmission is direct — no test, no interview. Apply online for free: {{apply_url}}\nOur team will call you shortly.',
  ),
  ...T(
    'APPLICATION_RECEIVED',
    'Application received',
    ['parent_name', 'student_name', 'grade', 'application_no', 'track_url', 'username', 'password', 'school_name'],
    {
      subject: 'Application {{application_no}} received — {{school_name}}',
      body: 'Dear {{parent_name}},\n\nWe have received the admission application for {{student_name}} ({{grade}}). Your Application ID is {{application_no}}.\n\nTrack the status live at {{track_url}}\n{{credentials}}\n\nRegards,\nAdmissions Office\n{{school_name}}',
    },
    'Application {{application_no}} for {{student_name}} ({{grade}}) received by {{school_name}}. Track: {{track_url}} - RNSIS',
    'Your application for *{{student_name}}* ({{grade}}) has been received ✅\nApplication ID: *{{application_no}}*\nTrack status anytime: {{track_url}}',
  ),
  ...T(
    'APPLICATION_ACCEPTED',
    'Admission offer',
    ['parent_name', 'student_name', 'grade', 'application_no', 'offer_url', 'school_name'],
    {
      subject: 'Admission offer for {{student_name}} — {{school_name}}',
      body: 'Dear {{parent_name}},\n\nWe are delighted to offer admission to {{student_name}} in {{grade}} for the academic year {{academic_year}}.\n\nYour offer letter is attached and also available here: {{offer_url}}\n\nOur team will complete the enrollment and share the fee details and parent-portal login shortly.\n\nWarm regards,\nPrincipal\n{{school_name}}',
    },
    'Congratulations! {{student_name}} has been offered admission to {{grade}} at {{school_name}} (Appl {{application_no}}). Offer letter: {{offer_url}} - RNSIS',
    '🎉 Congratulations! *{{student_name}}* has been offered admission to *{{grade}}* at {{school_name}}.\nOffer letter: {{offer_url}}',
  ),
  ...T(
    'APPLICATION_WAITLISTED',
    'Application waitlisted',
    ['parent_name', 'student_name', 'grade', 'application_no', 'school_name'],
    {
      subject: 'Application {{application_no}} — waitlisted',
      body: 'Dear {{parent_name}},\n\nThank you for applying to {{school_name}}. Seats in {{grade}} are currently full, and {{student_name}}\'s application ({{application_no}}) has been placed on our waitlist. We will contact you as soon as a seat becomes available.\n\nRegards,\nAdmissions Office',
    },
    'Application {{application_no}} for {{student_name}} ({{grade}}) is waitlisted at {{school_name}}. We will inform you when a seat opens. - RNSIS',
    'Application *{{application_no}}* for {{student_name}} ({{grade}}) is on our waitlist. We will reach out as soon as a seat opens. 🙏',
  ),
  ...T(
    'APPLICATION_REJECTED',
    'Application not accepted',
    ['parent_name', 'student_name', 'grade', 'application_no', 'school_name'],
    {
      subject: 'Your application to {{school_name}}',
      body: 'Dear {{parent_name}},\n\nThank you for considering {{school_name}} for {{student_name}}. After careful consideration, we regret that we are unable to offer a seat in {{grade}} this year (Application {{application_no}}).\n\nWe truly appreciate your interest and wish {{student_name}} every success.\n\nWith regards,\nAdmissions Office\n{{school_name}}',
    },
    'Dear {{parent_name}}, we regret we are unable to offer a seat to {{student_name}} in {{grade}} this year. Thank you for considering {{school_name}}. - RNSIS',
    'Dear {{parent_name}}, thank you for considering {{school_name}}. We regret that we cannot offer a seat to {{student_name}} in {{grade}} this year. We wish you the very best. 🙏',
  ),
  ...T(
    'ENROLLMENT_WELCOME',
    'Enrollment confirmation + portal login',
    ['parent_name', 'student_name', 'admission_no', 'class_name', 'portal_url', 'username', 'password', 'invoice_no', 'amount_due', 'due_date', 'pay_url', 'school_name'],
    {
      subject: 'Welcome to {{school_name}} — {{student_name}} ({{admission_no}})',
      body: 'Dear {{parent_name}},\n\nWelcome to the {{school_name}} family! {{student_name}} is now enrolled in {{class_name}}. Admission No: {{admission_no}}.\n\nParent portal: {{portal_url}}\nUsername: {{username}}\nPassword: {{password}}\n(You will be asked to set a new password on first login.)\n\nFee invoice {{invoice_no}} of {{amount_due}} is due on {{due_date}}. Pay securely online (UPI, cards, net banking): {{pay_url}}\n\nThe admission confirmation letter is attached.\n\nWarm regards,\n{{school_name}}',
    },
    'Welcome to {{school_name}}! {{student_name}} enrolled in {{class_name}}, Adm No {{admission_no}}. Portal {{portal_url}} User {{username}} Pwd {{password}}. Fee {{amount_due}} due {{due_date}}: {{pay_url}} - RNSIS',
    'Welcome to {{school_name}} 🎓\n*{{student_name}}* is enrolled in *{{class_name}}* (Adm No {{admission_no}}).\n\nParent portal: {{portal_url}}\nUsername: {{username}}\nPassword: {{password}}\n\nInvoice {{invoice_no}}: *{{amount_due}}* due {{due_date}}\nPay via UPI/card: {{pay_url}}',
  ),
  ...T(
    'APPLICANT_ACCOUNT',
    'Application tracking login',
    ['parent_name', 'portal_url', 'username', 'password', 'application_no', 'school_name'],
    {
      subject: 'Your {{school_name}} parent login',
      body: 'Dear {{parent_name}},\n\nA parent account has been created so you can track application {{application_no}} and, after admission, manage fees and view your child\'s progress.\n\nLogin: {{portal_url}}\nUsername: {{username}}\nPassword: {{password}}\n\nRegards,\n{{school_name}}',
    },
    '{{school_name}} parent login: {{portal_url}} User {{username}} Pwd {{password}} (Appl {{application_no}}) - RNSIS',
    'Your {{school_name}} parent login 🔐\nPortal: {{portal_url}}\nUsername: {{username}}\nPassword: {{password}}',
  ),
  ...T(
    'INVOICE_ISSUED',
    'Fee invoice issued',
    ['parent_name', 'student_name', 'invoice_no', 'title', 'amount_due', 'due_date', 'pay_url', 'school_name'],
    {
      subject: 'Fee invoice {{invoice_no}} — {{student_name}}',
      body: 'Dear {{parent_name}},\n\n{{title}} for {{student_name}} has been issued.\nInvoice: {{invoice_no}}\nAmount: {{amount_due}}\nDue date: {{due_date}}\n\nPay online in one click (UPI, cards, net banking): {{pay_url}}\n\nThe invoice PDF is attached.\n\nRegards,\nAccounts Office\n{{school_name}}',
    },
    '{{school_name}}: {{title}} for {{student_name}} - {{amount_due}} due {{due_date}} (Inv {{invoice_no}}). Pay: {{pay_url}} - RNSIS',
    '📄 *{{title}}* for {{student_name}}\nInvoice: {{invoice_no}}\nAmount: *{{amount_due}}*\nDue: {{due_date}}\n\nPay now via UPI/card: {{pay_url}}',
  ),
  ...T(
    'PAYMENT_RECEIPT',
    'Payment receipt',
    ['parent_name', 'student_name', 'receipt_no', 'amount', 'mode', 'paid_on', 'balance', 'receipt_url', 'school_name'],
    {
      subject: 'Payment received — receipt {{receipt_no}}',
      body: 'Dear {{parent_name}},\n\nWe have received {{amount}} towards the fees of {{student_name}} via {{mode}} on {{paid_on}}.\nReceipt No: {{receipt_no}}\nOutstanding balance: {{balance}}\n\nYour receipt is attached and available here: {{receipt_url}}\n\nThank you,\nAccounts Office\n{{school_name}}',
    },
    'Received {{amount}} for {{student_name}} via {{mode}} on {{paid_on}}. Receipt {{receipt_no}}. Balance {{balance}}. {{receipt_url}} - RNSIS',
    '✅ Payment received\n{{amount}} for *{{student_name}}* via {{mode}} on {{paid_on}}\nReceipt: *{{receipt_no}}*\nBalance due: {{balance}}\nDownload: {{receipt_url}}',
  ),
  ...T(
    'FEE_REMINDER_BEFORE',
    'Fee reminder — before due date',
    ['parent_name', 'student_name', 'amount_due', 'due_date', 'days', 'pay_url', 'school_name'],
    {
      subject: 'Reminder: fees of {{amount_due}} due on {{due_date}}',
      body: 'Dear {{parent_name}},\n\nThis is a gentle reminder that fees of {{amount_due}} for {{student_name}} are due on {{due_date}} ({{days}} days from today).\n\nPay online: {{pay_url}}\n\nPlease ignore if already paid.\n\nAccounts Office\n{{school_name}}',
    },
    'Reminder: {{student_name}} fees {{amount_due}} due {{due_date}}. Pay: {{pay_url}}. Ignore if paid. - RNSIS',
    '🔔 Gentle reminder: fees of *{{amount_due}}* for {{student_name}} are due on *{{due_date}}*.\nPay now: {{pay_url}}\n(Ignore if already paid)',
  ),
  ...T(
    'FEE_REMINDER_DUE',
    'Fee reminder — due today',
    ['parent_name', 'student_name', 'amount_due', 'due_date', 'pay_url', 'school_name'],
    {
      subject: 'Fees due today — {{student_name}}',
      body: 'Dear {{parent_name}},\n\nFees of {{amount_due}} for {{student_name}} are due today ({{due_date}}). Kindly pay to avoid late fees.\n\nPay online: {{pay_url}}\n\nAccounts Office\n{{school_name}}',
    },
    'Fees of {{amount_due}} for {{student_name}} are due TODAY. Pay: {{pay_url}} to avoid late fee. - RNSIS',
    '⏰ Fees of *{{amount_due}}* for {{student_name}} are due *today*.\nPay now to avoid late fees: {{pay_url}}',
  ),
  ...T(
    'FEE_REMINDER_OVERDUE',
    'Fee reminder — overdue',
    ['parent_name', 'student_name', 'amount_due', 'due_date', 'days', 'late_fee', 'pay_url', 'school_name'],
    {
      subject: 'Overdue fees — {{student_name}} ({{amount_due}})',
      body: 'Dear {{parent_name}},\n\nOur records show fees of {{amount_due}} for {{student_name}} are overdue by {{days}} days (due {{due_date}}). {{late_fee}}\n\nPlease pay at the earliest: {{pay_url}}\nIf you have already paid, please share the payment reference with the accounts office.\n\nAccounts Office\n{{school_name}}',
    },
    'Fees {{amount_due}} for {{student_name}} overdue by {{days}} days. Pay: {{pay_url}}. Contact accounts if paid. - RNSIS',
    '⚠️ Fees of *{{amount_due}}* for {{student_name}} are overdue by {{days}} days (due {{due_date}}).\nPay now: {{pay_url}}',
  ),
  ...T(
    'DUE_DATE_CHANGED',
    'Due date changed',
    ['parent_name', 'student_name', 'term', 'old_date', 'new_date', 'amount_due', 'pay_url', 'school_name'],
    {
      subject: '{{term}} fee due date revised to {{new_date}}',
      body: 'Dear {{parent_name}},\n\nThe due date for {{term}} fees has been revised from {{old_date}} to {{new_date}}. Amount payable for {{student_name}}: {{amount_due}}.\n\nPay online: {{pay_url}}\n\nAccounts Office\n{{school_name}}',
    },
    '{{term}} fee due date revised from {{old_date}} to {{new_date}}. {{student_name}}: {{amount_due}}. Pay: {{pay_url}} - RNSIS',
    '📅 {{term}} fee due date revised: {{old_date}} → *{{new_date}}*\n{{student_name}}: {{amount_due}}\nPay: {{pay_url}}',
  ),
  ...T(
    'CHEQUE_BOUNCED',
    'Cheque returned',
    ['parent_name', 'student_name', 'cheque_no', 'amount', 'reason', 'pay_url', 'school_name'],
    {
      subject: 'Cheque {{cheque_no}} returned unpaid',
      body: 'Dear {{parent_name}},\n\nCheque {{cheque_no}} for {{amount}} towards {{student_name}}\'s fees was returned by the bank ({{reason}}). The corresponding receipt has been reversed.\n\nPlease pay online: {{pay_url}} or visit the fees counter.\n\nAccounts Office\n{{school_name}}',
    },
    'Cheque {{cheque_no}} of {{amount}} for {{student_name}} was returned ({{reason}}). Please pay: {{pay_url}} - RNSIS',
    'Cheque {{cheque_no}} of {{amount}} for {{student_name}} was returned by the bank ({{reason}}). Please pay online: {{pay_url}}',
  ),
  ...T(
    'REFUND_PROCESSED',
    'Refund processed',
    ['parent_name', 'student_name', 'refund_no', 'amount', 'method', 'school_name'],
    {
      subject: 'Refund {{refund_no}} processed',
      body: 'Dear {{parent_name}},\n\nA refund of {{amount}} for {{student_name}} has been processed via {{method}} (Ref {{refund_no}}).\n\nAccounts Office\n{{school_name}}',
    },
    'Refund of {{amount}} for {{student_name}} processed via {{method}}. Ref {{refund_no}} - RNSIS',
    'Refund of *{{amount}}* for {{student_name}} processed via {{method}}. Ref {{refund_no}}',
  ),
  ...T(
    'ABSENCE_ALERT',
    'Absence alert',
    ['parent_name', 'student_name', 'date', 'class_name', 'school_name'],
    {
      subject: '{{student_name}} was absent today',
      body: 'Dear {{parent_name}},\n\n{{student_name}} ({{class_name}}) has been marked absent on {{date}}. If this is unexpected, please contact the class teacher.\n\n{{school_name}}',
    },
    '{{student_name}} ({{class_name}}) is marked ABSENT on {{date}}. Contact school if unexpected. - RNSIS',
    '📢 {{student_name}} ({{class_name}}) has been marked *absent* today ({{date}}). Please contact the class teacher if this is unexpected.',
  ),
  ...T(
    'HOMEWORK_ASSIGNED',
    'Homework assigned',
    ['parent_name', 'student_name', 'subject', 'title', 'due_date', 'school_name'],
    {
      subject: 'New homework: {{subject}} — {{title}}',
      body: 'Dear {{parent_name}},\n\nNew {{subject}} homework for {{student_name}}: {{title}}\n{{description}}\nDue: {{due_date}}\n\n{{school_name}}',
    },
    'Homework ({{subject}}) for {{student_name}}: {{title}}. Due {{due_date}}. - RNSIS',
    '📚 New {{subject}} homework for {{student_name}}: *{{title}}*\nDue: {{due_date}}',
  ),
  ...T(
    'ANNOUNCEMENT',
    'Announcement / broadcast',
    ['title', 'body', 'school_name'],
    { subject: '{{title}} — {{school_name}}', body: '{{body}}\n\n— {{school_name}}' },
    '{{school_name}}: {{title}}. {{body}} - RNSIS',
    '*{{title}}*\n\n{{body}}\n\n— {{school_name}}',
  ),
  ...T(
    'PASSWORD_RESET',
    'Password reset',
    ['name', 'reset_url', 'school_name'],
    { subject: 'Reset your {{school_name}} password', body: 'Dear {{name}},\n\nUse this link to reset your password (valid for 30 minutes):\n{{reset_url}}\n\nIf you did not request this, you can ignore this message.\n\n{{school_name}}' },
    'Reset your {{school_name}} password: {{reset_url}} (valid 30 min) - RNSIS',
    'Reset your password (valid 30 min): {{reset_url}}',
  ),
  { key: 'TASK_REMINDER', name: 'Follow-up task due (staff)', channel: 'IN_APP', subject: 'Follow-up due: {{title}}', body: '{{title}} — due {{due_at}} ({{enquiry}})', variables: ['title', 'due_at', 'enquiry'] },
  { key: 'TASK_REMINDER', name: 'Follow-up task due (staff)', channel: 'EMAIL', subject: 'Follow-up due: {{title}}', body: 'Hi {{name}},\n\nYour follow-up "{{title}}" for {{enquiry}} is due {{due_at}}.\n\nRNSIS Nexus', variables: ['name', 'title', 'due_at', 'enquiry'] },
  { key: 'APPROVAL_REQUIRED', name: 'Approval request (staff)', channel: 'IN_APP', subject: '{{title}}', body: '{{body}}', variables: ['title', 'body'] },
];

export function renderTemplate(text: string, data: Record<string, unknown>): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k) => {
    const v = data[k];
    return v === undefined || v === null ? '' : String(v);
  });
}
