/**
 * Permission catalog for RNSIS Nexus.
 *
 * Permissions are plain string keys stored on roles (RolePermission table). The catalog
 * below is the single source of truth for what exists; the Super Admin edits which role
 * holds which key through the RBAC matrix screen. Default grants are applied on seed and
 * can be restored per role.
 */
import type { DashboardKind, DataScope } from './enums';

export interface PermissionDef {
  key: string;
  label: string;
  description?: string;
}

export interface PermissionGroup {
  module: string;
  label: string;
  permissions: PermissionDef[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    permissions: [{ key: 'dashboard.view', label: 'View dashboard' }],
  },
  {
    module: 'students',
    label: 'Students (SIS)',
    permissions: [
      { key: 'students.view', label: 'View students' },
      { key: 'students.create', label: 'Create students' },
      { key: 'students.update', label: 'Edit student profiles' },
      { key: 'students.archive', label: 'Withdraw / archive students' },
      { key: 'students.documents', label: 'Manage student documents' },
      { key: 'students.sensitive', label: 'View sensitive fields (Aadhaar, medical)' },
      { key: 'students.idcards', label: 'Generate ID cards' },
      { key: 'students.custom_fields', label: 'Manage custom fields' },
    ],
  },
  {
    module: 'admissions',
    label: 'Admissions',
    permissions: [
      { key: 'admissions.enquiry.view', label: 'View enquiries' },
      { key: 'admissions.enquiry.manage', label: 'Create / update enquiries' },
      { key: 'admissions.tasks.manage', label: 'Manage follow-up tasks' },
      { key: 'admissions.application.view', label: 'View applications' },
      { key: 'admissions.application.manage', label: 'Edit applications' },
      { key: 'admissions.application.verify', label: 'Verify documents' },
      { key: 'admissions.application.approve', label: 'Principal approval' },
      { key: 'admissions.application.decide', label: 'Accept / waitlist / reject' },
      { key: 'admissions.enroll', label: 'Enroll accepted applicants' },
      { key: 'admissions.analytics', label: 'View admission analytics' },
      { key: 'admissions.promotion', label: 'Run year-end promotion' },
      { key: 'admissions.promotion.override', label: 'Override promotion dues block' },
    ],
  },
  {
    module: 'fees',
    label: 'Fees',
    permissions: [
      { key: 'fees.structure.view', label: 'View fee structures' },
      { key: 'fees.structure.manage', label: 'Manage fee heads & structures' },
      { key: 'fees.terms.due_date', label: 'Change term due dates' },
      { key: 'fees.late_fee.manage', label: 'Configure late fee rules' },
      { key: 'fees.discount.request', label: 'Request discounts / concessions' },
      { key: 'fees.discount.approve', label: 'Approve discounts / concessions' },
      { key: 'fees.adjustment.request', label: 'Request fee adjustments / waivers' },
      { key: 'fees.adjustment.approve', label: 'Approve fee adjustments / waivers' },
      { key: 'fees.invoice.view', label: 'View invoices' },
      { key: 'fees.invoice.create', label: 'Create manual invoices' },
      { key: 'fees.invoice.bulk_generate', label: 'Bulk generate invoices' },
      { key: 'fees.invoice.cancel', label: 'Cancel invoices' },
      { key: 'fees.invoice.send', label: 'Send invoices to parents' },
      { key: 'fees.payment.view', label: 'View payments & receipts' },
      { key: 'fees.payment.collect', label: 'Record counter payments' },
      { key: 'fees.payment.cheque', label: 'Clear / bounce cheques' },
      { key: 'fees.refund.request', label: 'Request refunds' },
      { key: 'fees.refund.approve', label: 'Approve refunds' },
      { key: 'fees.refund.process', label: 'Process approved refunds' },
      { key: 'fees.ledger.view', label: 'View student fee ledgers' },
      { key: 'fees.class_status.view', label: 'View fee status of own class (read-only)' },
      { key: 'fees.defaulters.view', label: 'View defaulter dashboard' },
      { key: 'fees.reminders.send', label: 'Send fee reminders' },
      { key: 'fees.reminders.configure', label: 'Configure reminder schedule' },
      { key: 'fees.policy.manage', label: 'Configure dues policies' },
      { key: 'fees.policy.override', label: 'Override dues policy for a student' },
      { key: 'fees.commitments.manage', label: 'Record payment commitments' },
      { key: 'fees.reconciliation', label: 'Gateway reconciliation' },
    ],
  },
  {
    module: 'finance',
    label: 'Finance & Reports',
    permissions: [
      { key: 'finance.dashboard', label: 'View finance dashboard' },
      { key: 'reports.view', label: 'View reports' },
      { key: 'reports.export', label: 'Export reports (PDF / Excel)' },
      { key: 'audit.view', label: 'View audit log' },
    ],
  },
  {
    module: 'communication',
    label: 'Communication',
    permissions: [
      { key: 'notifications.templates', label: 'Edit message templates' },
      { key: 'notifications.log', label: 'View message outbox / delivery log' },
      { key: 'communication.broadcast', label: 'Send SMS / WhatsApp / email broadcasts' },
      { key: 'communication.announcements', label: 'Publish announcements' },
      { key: 'messaging.use', label: 'Use internal messaging' },
    ],
  },
  {
    module: 'attendance',
    label: 'Attendance',
    permissions: [
      { key: 'attendance.mark', label: 'Mark student attendance' },
      { key: 'attendance.view', label: 'View attendance' },
      { key: 'attendance.staff', label: 'Manage staff attendance' },
    ],
  },
  {
    module: 'academics',
    label: 'Academics',
    permissions: [
      { key: 'academics.manage', label: 'Manage classes, sections, subjects' },
      { key: 'academics.timetable', label: 'Build timetable' },
      { key: 'academics.view', label: 'View academics & timetable' },
      { key: 'exams.manage', label: 'Manage exams' },
      { key: 'marks.enter', label: 'Enter marks' },
      { key: 'reportcards.generate', label: 'Generate report cards' },
      { key: 'homework.manage', label: 'Assign homework' },
    ],
  },
  {
    module: 'hr',
    label: 'HR & Payroll',
    permissions: [
      { key: 'hr.staff.view', label: 'View staff' },
      { key: 'hr.staff.manage', label: 'Manage staff records' },
      { key: 'hr.leave.apply', label: 'Apply for leave' },
      { key: 'hr.leave.approve', label: 'Approve leave' },
      { key: 'hr.payroll', label: 'Run payroll & salary slips' },
    ],
  },
  {
    module: 'operations',
    label: 'Operations',
    permissions: [
      { key: 'accounts.view', label: 'View accounts' },
      { key: 'accounts.manage', label: 'Manage vouchers & chart of accounts' },
      { key: 'transport.view', label: 'View transport' },
      { key: 'transport.manage', label: 'Manage routes, vehicles, drivers' },
      { key: 'store.view', label: 'View store & inventory' },
      { key: 'store.manage', label: 'Manage inventory' },
      { key: 'store.pos', label: 'Use POS billing' },
      { key: 'certificates.issue', label: 'Issue certificates' },
      { key: 'certificates.templates', label: 'Edit certificate templates' },
      { key: 'events.view', label: 'View event calendar' },
      { key: 'events.manage', label: 'Manage events' },
      { key: 'visitors.manage', label: 'Visitor log' },
      { key: 'ai.use', label: 'Use AI assistant' },
    ],
  },
  {
    module: 'settings',
    label: 'Administration',
    permissions: [
      { key: 'settings.school', label: 'School settings & branding' },
      { key: 'settings.roles', label: 'Configure roles & RBAC matrix' },
      { key: 'settings.users', label: 'Manage user accounts' },
      { key: 'settings.academic_year', label: 'Manage academic years & terms' },
      { key: 'imports.manage', label: 'Bulk import / data migration' },
      { key: 'backups.manage', label: 'Backups & data export' },
    ],
  },
  {
    module: 'parent',
    label: 'Parent Portal',
    permissions: [{ key: 'parent.portal', label: 'Access parent portal (own children only)' }],
  },
];

export const ALL_PERMISSIONS: string[] = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

export type PermissionKey = (typeof ALL_PERMISSIONS)[number];

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PRINCIPAL: 'PRINCIPAL',
  ADMISSIONS_OFFICER: 'ADMISSIONS_OFFICER',
  ACCOUNTANT: 'ACCOUNTANT',
  TEACHER: 'TEACHER',
  PARENT: 'PARENT',
  FRONT_DESK: 'FRONT_DESK',
} as const;
export type SystemRoleKey = keyof typeof SYSTEM_ROLES;

// Dashboard kind decides which portal a role lands on; data scope limits which rows a
// role can read even when it holds a permission (teachers: own classes, parents: own children).

const except = (...keys: string[]) => ALL_PERMISSIONS.filter((k) => !keys.includes(k));

export interface DefaultRoleDef {
  key: SystemRoleKey;
  name: string;
  description: string;
  dashboard: DashboardKind;
  dataScope: DataScope;
  permissions: string[];
}

export const DEFAULT_ROLES: DefaultRoleDef[] = [
  {
    key: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'School owner — full control over every module and setting',
    dashboard: 'ADMIN',
    dataScope: 'ALL',
    permissions: except('parent.portal', 'fees.class_status.view'),
  },
  {
    key: 'PRINCIPAL',
    name: 'Principal',
    description: 'Academic, admissions and collections oversight; approvals and overrides',
    dashboard: 'PRINCIPAL',
    dataScope: 'ALL',
    permissions: except('parent.portal', 'fees.class_status.view', 'settings.roles', 'backups.manage', 'imports.manage', 'store.pos'),
  },
  {
    key: 'ADMISSIONS_OFFICER',
    name: 'Admissions Officer',
    description: 'Enquiries, applications and the enrollment pipeline',
    dashboard: 'ADMISSIONS',
    dataScope: 'ALL',
    permissions: [
      'dashboard.view',
      'students.view',
      'students.create',
      'students.update',
      'students.documents',
      'admissions.enquiry.view',
      'admissions.enquiry.manage',
      'admissions.tasks.manage',
      'admissions.application.view',
      'admissions.application.manage',
      'admissions.application.verify',
      'admissions.application.decide',
      'admissions.enroll',
      'admissions.analytics',
      'fees.structure.view',
      'fees.invoice.view',
      'fees.discount.request',
      'notifications.log',
      'messaging.use',
      'events.view',
      'visitors.manage',
      'ai.use',
      'hr.leave.apply',
    ],
  },
  {
    key: 'ACCOUNTANT',
    name: 'Accountant / Fees Desk',
    description: 'Invoices, payments, dues, receipts and reconciliation',
    dashboard: 'ACCOUNTS',
    dataScope: 'ALL',
    permissions: [
      'dashboard.view',
      'students.view',
      'fees.structure.view',
      'fees.structure.manage',
      'fees.terms.due_date',
      'fees.late_fee.manage',
      'fees.discount.request',
      'fees.adjustment.request',
      'fees.invoice.view',
      'fees.invoice.create',
      'fees.invoice.bulk_generate',
      'fees.invoice.cancel',
      'fees.invoice.send',
      'fees.payment.view',
      'fees.payment.collect',
      'fees.payment.cheque',
      'fees.refund.request',
      'fees.refund.process',
      'fees.ledger.view',
      'fees.defaulters.view',
      'fees.reminders.send',
      'fees.reminders.configure',
      'fees.commitments.manage',
      'fees.reconciliation',
      'finance.dashboard',
      'reports.view',
      'reports.export',
      'notifications.log',
      'accounts.view',
      'accounts.manage',
      'transport.view',
      'store.view',
      'store.pos',
      'messaging.use',
      'events.view',
      'hr.leave.apply',
      'imports.manage',
    ],
  },
  {
    key: 'TEACHER',
    name: 'Teacher',
    description: 'Attendance, marks, homework and a read-only fee view of own class',
    dashboard: 'TEACHER',
    dataScope: 'OWN_CLASSES',
    permissions: [
      'dashboard.view',
      'students.view',
      'attendance.mark',
      'attendance.view',
      'academics.view',
      'marks.enter',
      'homework.manage',
      'fees.class_status.view',
      'messaging.use',
      'events.view',
      'hr.leave.apply',
      'ai.use',
    ],
  },
  {
    key: 'PARENT',
    name: 'Parent',
    description: 'Parent portal: applications, invoices, online payment, receipts, attendance, grades',
    dashboard: 'PARENT',
    dataScope: 'OWN_CHILDREN',
    permissions: ['parent.portal'],
  },
  {
    key: 'FRONT_DESK',
    name: 'Front Desk',
    description: 'Quick fee collection counter and visitor log',
    dashboard: 'FRONT_DESK',
    dataScope: 'ALL',
    permissions: [
      'dashboard.view',
      'students.view',
      'fees.invoice.view',
      'fees.payment.view',
      'fees.payment.collect',
      'fees.ledger.view',
      'admissions.enquiry.view',
      'admissions.enquiry.manage',
      'visitors.manage',
      'events.view',
      'messaging.use',
      'hr.leave.apply',
    ],
  },
];

export function hasPermission(granted: readonly string[] | undefined, required: string | string[]): boolean {
  if (!granted) return false;
  const req = Array.isArray(required) ? required : [required];
  return req.every((r) => granted.includes(r));
}

export function hasAnyPermission(granted: readonly string[] | undefined, required: string[]): boolean {
  if (!granted) return false;
  return required.some((r) => granted.includes(r));
}
