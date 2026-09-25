/**
 * API contract types shared by the NestJS API and the React client. Response payloads
 * are plain JSON: money in paise (number), dates as ISO strings.
 */
import type {
  ApplicationStatus,
  DashboardKind,
  DataScope,
  EnquirySource,
  EnquiryStage,
  InvoiceStatus,
  JobStatus,
  PaymentMode,
  PaymentStatus,
} from './enums';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthUser {
  id: string;
  schoolId: string;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: { id: string; key: string; name: string; dashboard: DashboardKind; dataScope: DataScope };
  permissions: string[];
  mustChangePassword: boolean;
  preferredLanguage: string;
  staffId?: string | null;
  guardianId?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface SchoolBranding {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  tagline: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string;
  affiliationNo: string | null;
  currentAcademicYear: { id: string; name: string } | null;
}

export interface JobDto {
  id: string;
  type: string;
  title: string | null;
  status: JobStatus;
  total: number;
  processed: number;
  failed: number;
  progress: number;
  result: unknown;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface MoneySummary {
  billed: number;
  discounts: number;
  lateFees: number;
  paid: number;
  balance: number;
  overdue: number;
  advanceCredit: number;
  netDue: number;
}

export interface StudentLedgerEntryDto {
  id: string;
  date: string;
  type: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  invoiceId: string | null;
  invoiceNo: string | null;
  paymentId: string | null;
  receiptNo: string | null;
}

export interface InvoiceSummaryDto {
  id: string;
  invoiceNo: string;
  title: string;
  type: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  discountTotal: number;
  lateFee: number;
  total: number;
  amountPaid: number;
  balance: number;
  lateFeePreview?: number;
  student?: { id: string; name: string; admissionNo: string; className: string | null };
}

export interface PaymentSummaryDto {
  id: string;
  receiptNo: string;
  amount: number;
  mode: PaymentMode;
  status: PaymentStatus;
  paidAt: string;
  referenceNo: string | null;
  student?: { id: string; name: string; admissionNo: string; className: string | null };
}

export interface DefaulterRow {
  studentId: string;
  admissionNo: string;
  name: string;
  gradeName: string | null;
  sectionName: string | null;
  className: string | null;
  primaryGuardian: string | null;
  phone: string | null;
  overdueAmount: number;
  totalBalance: number;
  overdueInvoices: number;
  oldestDueDate: string;
  daysOverdue: number;
  bucket: string;
  lastReminderAt: string | null;
  commitment: { amount: number; promisedDate: string; status: string } | null;
}

export interface EnquiryCard {
  id: string;
  enquiryNo: string;
  studentName: string;
  parentName: string;
  phone: string;
  gradeName: string;
  source: EnquirySource;
  stage: EnquiryStage;
  assignedTo: { id: string; name: string } | null;
  openTasks: number;
  nextTaskDue: string | null;
  createdAt: string;
  stageChangedAt: string;
}

export interface ApplicationTrackingDto {
  applicationNo: string;
  studentName: string;
  gradeName: string;
  academicYear: string;
  status: ApplicationStatus;
  submittedAt: string;
  timeline: { status: ApplicationStatus; note: string | null; at: string }[];
  checklist: { documentsVerified: boolean; principalApproved: boolean };
  offerLetterAvailable: boolean;
  admissionNo: string | null;
}
