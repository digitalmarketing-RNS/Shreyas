-- CreateEnum
CREATE TYPE "DashboardKind" AS ENUM ('ADMIN', 'PRINCIPAL', 'ADMISSIONS', 'ACCOUNTS', 'TEACHER', 'PARENT', 'FRONT_DESK');

-- CreateEnum
CREATE TYPE "DataScope" AS ENUM ('ALL', 'OWN_CLASSES', 'OWN_CHILDREN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED', 'LOCKED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AcademicYearStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GradeStage" AS ENUM ('PRE_PRIMARY', 'PRIMARY', 'MIDDLE', 'SECONDARY', 'SENIOR_SECONDARY');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('CORE', 'ELECTIVE', 'LANGUAGE', 'CO_SCHOLASTIC');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'GRADUATED', 'TRANSFERRED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PROMOTED', 'DETAINED', 'WITHDRAWN', 'GRADUATED');

-- CreateEnum
CREATE TYPE "GuardianRelation" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN', 'GRANDPARENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('BIRTH_CERTIFICATE', 'REPORT_CARD', 'TRANSFER_CERTIFICATE', 'ADDRESS_PROOF', 'PHOTO', 'AADHAAR', 'MEDICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomFieldEntity" AS ENUM ('STUDENT', 'STAFF');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "EnquirySource" AS ENUM ('WALK_IN', 'PHONE', 'WEBSITE', 'WHATSAPP', 'REFERRAL', 'SOCIAL_MEDIA', 'OTHER');

-- CreateEnum
CREATE TYPE "EnquiryStage" AS ENUM ('NEW', 'CONTACTED', 'VISIT_SCHEDULED', 'APPLIED', 'OFFERED', 'ENROLLED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'EMAIL', 'SMS', 'WHATSAPP', 'VISIT', 'STAGE_CHANGE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'WAITLISTED', 'REJECTED', 'ENROLLED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('APPLIED', 'UNDONE');

-- CreateEnum
CREATE TYPE "PromotionAction" AS ENUM ('PROMOTED', 'GRADUATED', 'DETAINED', 'HELD_FOR_DUES');

-- CreateEnum
CREATE TYPE "FeeCategory" AS ENUM ('ADMISSION', 'TUITION', 'REGISTRATION', 'TRANSPORT', 'MEAL', 'UNIFORM', 'BOOKS', 'EXAM', 'ACTIVITY', 'LATE_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "FeeStructureStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FeeFrequency" AS ENUM ('ONE_TIME', 'ANNUAL', 'PER_TERM');

-- CreateEnum
CREATE TYPE "FeeApplicability" AS ENUM ('ALL', 'NEW_ADMISSION', 'EXISTING');

-- CreateEnum
CREATE TYPE "LateFeeMode" AS ENUM ('FIXED', 'PERCENT');

-- CreateEnum
CREATE TYPE "LateFeeFrequency" AS ENUM ('ONCE', 'PER_DAY', 'PER_WEEK', 'PER_MONTH');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('SIBLING', 'STAFF_CHILD', 'MERIT_SCHOLARSHIP', 'SPECIAL_CONCESSION', 'OTHER');

-- CreateEnum
CREATE TYPE "DiscountMode" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('TERM', 'ADMISSION', 'MANUAL', 'OPENING_BALANCE', 'STORE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('WAIVER', 'LATE_FEE_WAIVER', 'DISCOUNT', 'CORRECTION_INCREASE', 'CORRECTION_DECREASE');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CARD', 'NET_BANKING', 'WALLET', 'OPENING_CREDIT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING_CLEARANCE', 'SUCCESS', 'BOUNCED', 'FAILED', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('COUNTER', 'ONLINE', 'IMPORT');

-- CreateEnum
CREATE TYPE "Gateway" AS ENUM ('RAZORPAY', 'STRIPE', 'MOCK');

-- CreateEnum
CREATE TYPE "GatewayOrderStatus" AS ENUM ('CREATED', 'ATTEMPTED', 'PAID', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundSource" AS ENUM ('WALLET', 'PAYMENT');

-- CreateEnum
CREATE TYPE "RefundMethod" AS ENUM ('ORIGINAL_GATEWAY', 'CASH', 'BANK_TRANSFER', 'CHEQUE');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('INVOICE', 'DISCOUNT', 'LATE_FEE', 'ADJUSTMENT', 'INVOICE_CANCELLED', 'PAYMENT', 'PAYMENT_REVERSAL', 'REFUND', 'OPENING_BALANCE');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('PENDING', 'KEPT', 'PARTIALLY_KEPT', 'BROKEN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'IN_APP');

-- CreateEnum
CREATE TYPE "FeePolicyType" AS ENUM ('BLOCK_REPORT_CARD', 'BLOCK_ADMIT_CARD', 'RESTRICT_PARENT_PORTAL');

-- CreateEnum
CREATE TYPE "ReconciliationItemStatus" AS ENUM ('MATCHED', 'AMOUNT_MISMATCH', 'MISSING_IN_SYSTEM', 'MISSING_IN_GATEWAY');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'SIMULATED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "BroadcastCategory" AS ENUM ('GENERAL', 'FEES', 'ATTENDANCE', 'HOMEWORK', 'EVENT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "BroadcastStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('PERIODIC_TEST', 'NOTEBOOK', 'SUBJECT_ENRICHMENT', 'HALF_YEARLY', 'ANNUAL', 'UNIT_TEST');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('SCHEDULED', 'MARKS_ENTRY', 'COMPLETED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('TEACHING', 'NON_TEACHING', 'ADMINISTRATIVE', 'SUPPORT');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'FINALIZED', 'PAID');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('DRAFT', 'APPROVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StoreCategory" AS ENUM ('UNIFORM', 'BOOKS', 'STATIONERY', 'OTHER');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('BONAFIDE', 'CHARACTER', 'TRANSFER', 'LEAVING', 'MERIT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('HOLIDAY', 'EXAM', 'EVENT', 'MEETING', 'PTM', 'SPORTS', 'CULTURAL');

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "tagline" TEXT,
    "affiliationNo" TEXT,
    "board" TEXT NOT NULL DEFAULT 'CBSE',
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoFileId" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#1e3a8a',
    "secondaryColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "dashboard" "DashboardKind" NOT NULL DEFAULT 'ADMIN',
    "dataScope" "DataScope" NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permission")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ(6),
    "lastLoginAt" TIMESTAMPTZ(6),
    "passwordChangedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "replacedById" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "meta" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT,
    "purpose" TEXT NOT NULL,
    "isTemporary" BOOLEAN NOT NULL DEFAULT false,
    "uploadToken" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sequence" (
    "schoolId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Sequence_pkey" PRIMARY KEY ("schoolId","key","scope")
);

-- CreateTable
CREATE TABLE "BackgroundJob" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "title" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "result" JSONB,
    "error" TEXT,
    "total" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "runAfter" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMPTZ(6),
    "lockedBy" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMPTZ(6),
    "finishedAt" TIMESTAMPTZ(6),

    CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "storageKey" TEXT,
    "sizeBytes" INTEGER,
    "error" TEXT,
    "createdById" TEXT,
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(6),

    CONSTRAINT "BackupRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" "AcademicYearStatus" NOT NULL DEFAULT 'PLANNED',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Term" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "invoiceDate" DATE NOT NULL,
    "autoGenerateInvoices" BOOLEAN NOT NULL DEFAULT true,
    "invoicesGeneratedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DueDateChange" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "termId" TEXT,
    "invoiceId" TEXT,
    "oldDate" DATE NOT NULL,
    "newDate" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "notifyParents" BOOLEAN NOT NULL DEFAULT false,
    "affectedInvoices" INTEGER NOT NULL DEFAULT 0,
    "lateFeeDelta" INTEGER NOT NULL DEFAULT 0,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DueDateChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stage" "GradeStage" NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "room" TEXT,
    "classTeacherId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "SubjectType" NOT NULL DEFAULT 'CORE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionSubject" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT,
    "periodsPerWeek" INTEGER NOT NULL DEFAULT 5,

    CONSTRAINT "SectionSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableSlot" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT,
    "room" TEXT,

    CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "admissionNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "bloodGroup" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'Indian',
    "religion" TEXT,
    "category" TEXT,
    "motherTongue" TEXT,
    "aadhaarEnc" TEXT,
    "aadhaarLast4" TEXT,
    "photoFileId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "admissionDate" DATE NOT NULL,
    "joinedYearId" TEXT,
    "previousSchool" TEXT,
    "leftOn" DATE,
    "leavingReason" TEXT,
    "medicalEnc" TEXT,
    "siblingDiscountEligible" BOOLEAN NOT NULL DEFAULT false,
    "customFields" JSONB NOT NULL DEFAULT '{}',
    "qrToken" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "sectionId" TEXT,
    "rollNo" INTEGER,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "promotionBatchId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" "GuardianRelation" NOT NULL,
    "phone" TEXT NOT NULL,
    "altPhone" TEXT,
    "email" TEXT,
    "occupation" TEXT,
    "organization" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGuardian" (
    "studentId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "receivesNotifications" BOOLEAN NOT NULL DEFAULT true,
    "canPickup" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StudentGuardian_pkey" PRIMARY KEY ("studentId","guardianId")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDocument" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileId" TEXT NOT NULL,
    "title" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldDefinition" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "entity" "CustomFieldEntity" NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "options" TEXT[],
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "enquiryNo" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "dob" DATE,
    "gender" "Gender",
    "parentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" "EnquirySource" NOT NULL,
    "referredBy" TEXT,
    "notes" TEXT,
    "stage" "EnquiryStage" NOT NULL DEFAULT 'NEW',
    "stageChangedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedToId" TEXT,
    "visitScheduledAt" TIMESTAMPTZ(6),
    "lastContactedAt" TIMESTAMPTZ(6),
    "withdrawnReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryActivity" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "content" TEXT NOT NULL,
    "fromStage" "EnquiryStage",
    "toStage" "EnquiryStage",
    "userId" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpTask" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "enquiryId" TEXT,
    "applicationId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueAt" TIMESTAMPTZ(6) NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "completedAt" TIMESTAMPTZ(6),
    "completedById" TEXT,
    "reminderSentAt" TIMESTAMPTZ(6),
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowUpTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "enquiryId" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "studentFirstName" TEXT NOT NULL,
    "studentMiddleName" TEXT,
    "studentLastName" TEXT NOT NULL,
    "dob" DATE NOT NULL,
    "gender" "Gender" NOT NULL,
    "nationality" TEXT NOT NULL DEFAULT 'Indian',
    "bloodGroup" TEXT,
    "aadhaarEnc" TEXT,
    "aadhaarLast4" TEXT,
    "previousSchool" TEXT,
    "previousGrade" TEXT,
    "photoFileId" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "desiredJoinDate" DATE,
    "siblingInSchool" BOOLEAN NOT NULL DEFAULT false,
    "siblingDiscountFlag" BOOLEAN NOT NULL DEFAULT false,
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "documentsVerifiedById" TEXT,
    "documentsVerifiedAt" TIMESTAMPTZ(6),
    "principalApproved" BOOLEAN NOT NULL DEFAULT false,
    "principalApprovedById" TEXT,
    "principalApprovedAt" TIMESTAMPTZ(6),
    "decisionById" TEXT,
    "decisionAt" TIMESTAMPTZ(6),
    "decisionNotes" TEXT,
    "offerLetterFileId" TEXT,
    "admissionLetterFileId" TEXT,
    "applicantUserId" TEXT,
    "studentId" TEXT,
    "source" "EnquirySource" NOT NULL DEFAULT 'WEBSITE',
    "submittedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedIp" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationGuardian" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" "GuardianRelation" NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "occupation" TEXT,
    "organization" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ApplicationGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEmergencyContact" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "ApplicationEmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationSibling" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "admissionNo" TEXT,
    "gradeText" TEXT,
    "matchedStudentId" TEXT,

    CONSTRAINT "ApplicationSibling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "fileId" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMPTZ(6),
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStatusHistory" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "ApplicationStatus",
    "toStatus" "ApplicationStatus" NOT NULL,
    "notes" TEXT,
    "publicNote" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionBatch" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fromYearId" TEXT NOT NULL,
    "toYearId" TEXT NOT NULL,
    "status" "PromotionStatus" NOT NULL DEFAULT 'APPLIED',
    "summary" JSONB NOT NULL DEFAULT '{}',
    "undoDeadline" TIMESTAMPTZ(6) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undoneAt" TIMESTAMPTZ(6),
    "undoneById" TEXT,

    CONSTRAINT "PromotionBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRecord" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromEnrollmentId" TEXT NOT NULL,
    "toEnrollmentId" TEXT,
    "action" "PromotionAction" NOT NULL,
    "duesAmount" INTEGER NOT NULL DEFAULT 0,
    "overrideReason" TEXT,
    "overriddenById" TEXT,

    CONSTRAINT "PromotionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeHead" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "FeeCategory" NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isRefundable" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeHead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "FeeStructureStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructureItem" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "feeHeadId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "frequency" "FeeFrequency" NOT NULL,
    "termId" TEXT,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "applicability" "FeeApplicability" NOT NULL DEFAULT 'ALL',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FeeStructureItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentOptionalFee" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "feeHeadId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentOptionalFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LateFeeRule" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "mode" "LateFeeMode" NOT NULL DEFAULT 'FIXED',
    "amount" INTEGER NOT NULL DEFAULT 0,
    "percentBp" INTEGER NOT NULL DEFAULT 0,
    "frequency" "LateFeeFrequency" NOT NULL DEFAULT 'PER_DAY',
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "maxCap" INTEGER,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "LateFeeRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentDiscount" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "mode" "DiscountMode" NOT NULL,
    "value" INTEGER NOT NULL,
    "feeHeadIds" TEXT[],
    "reason" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "applyToOpenInvoices" BOOLEAN NOT NULL DEFAULT true,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMPTZ(6),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "termId" TEXT,
    "type" "InvoiceType" NOT NULL,
    "title" TEXT NOT NULL,
    "issueDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "subtotal" INTEGER NOT NULL DEFAULT 0,
    "discountTotal" INTEGER NOT NULL DEFAULT 0,
    "lateFee" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL DEFAULT 0,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "isProrated" BOOLEAN NOT NULL DEFAULT false,
    "prorationNote" TEXT,
    "notes" TEXT,
    "dedupeKey" TEXT,
    "lateFeeFrozen" BOOLEAN NOT NULL DEFAULT false,
    "lateFeeCalcAt" TIMESTAMPTZ(6),
    "sentAt" TIMESTAMPTZ(6),
    "paidAt" TIMESTAMPTZ(6),
    "cancelledAt" TIMESTAMPTZ(6),
    "cancelledById" TEXT,
    "cancelReason" TEXT,
    "createdById" TEXT,
    "jobId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "feeHeadId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "netAmount" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "isLateFee" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "discountSources" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeAdjustment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "invoiceLineId" TEXT,
    "type" "AdjustmentType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMPTZ(6),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "mode" "PaymentMode" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'SUCCESS',
    "channel" "PaymentChannel" NOT NULL,
    "gateway" "Gateway",
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewayMethod" TEXT,
    "referenceNo" TEXT,
    "chequeNo" TEXT,
    "chequeBank" TEXT,
    "chequeDate" DATE,
    "clearedAt" TIMESTAMPTZ(6),
    "clearedById" TEXT,
    "bouncedAt" TIMESTAMPTZ(6),
    "bounceReason" TEXT,
    "paidAt" TIMESTAMPTZ(6) NOT NULL,
    "payerName" TEXT,
    "remarks" TEXT,
    "allocatedAmount" INTEGER NOT NULL DEFAULT 0,
    "refundedAmount" INTEGER NOT NULL DEFAULT 0,
    "unallocatedAmount" INTEGER NOT NULL DEFAULT 0,
    "collectedById" TEXT,
    "receiptFileId" TEXT,
    "receiptSentAt" TIMESTAMPTZ(6),
    "voidedAt" TIMESTAMPTZ(6),
    "voidReason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "invoiceLineId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMPTZ(6),
    "reversalReason" TEXT,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatewayOrder" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "gateway" "Gateway" NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "GatewayOrderStatus" NOT NULL DEFAULT 'CREATED',
    "invoiceIds" TEXT[],
    "initiatedById" TEXT,
    "viaPayLink" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" TEXT,
    "failureReason" TEXT,
    "checkoutUrl" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "paidAt" TIMESTAMPTZ(6),

    CONSTRAINT "GatewayOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "error" TEXT,
    "receivedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(6),

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "refundNo" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" "RefundSource" NOT NULL,
    "method" "RefundMethod" NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMPTZ(6),
    "rejectedReason" TEXT,
    "processedAt" TIMESTAMPTZ(6),
    "processedById" TEXT,
    "gatewayRefundId" TEXT,
    "referenceNo" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "entryDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "LedgerEntryType" NOT NULL,
    "description" TEXT NOT NULL,
    "debit" INTEGER NOT NULL DEFAULT 0,
    "credit" INTEGER NOT NULL DEFAULT 0,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "refundId" TEXT,
    "adjustmentId" TEXT,
    "createdById" TEXT,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentCommitment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "promisedDate" DATE NOT NULL,
    "notes" TEXT,
    "contactPerson" TEXT,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'PENDING',
    "amountReceived" INTEGER NOT NULL DEFAULT 0,
    "recordedById" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentCommitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderRule" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "offsetDays" INTEGER NOT NULL,
    "channels" "NotificationChannel"[],
    "templateKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "minBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "ruleId" TEXT,
    "invoiceId" TEXT,
    "studentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "channels" "NotificationChannel"[],
    "amountDue" INTEGER NOT NULL,
    "sentById" TEXT,
    "sentAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePolicy" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "type" "FeePolicyType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "thresholdAmount" INTEGER,
    "thresholdDays" INTEGER,
    "message" TEXT,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FeePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyOverride" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "policyType" "FeePolicyType" NOT NULL,
    "reason" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6),
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationRun" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "gateway" "Gateway" NOT NULL,
    "source" TEXT NOT NULL,
    "periodFrom" DATE NOT NULL,
    "periodTo" DATE NOT NULL,
    "summary" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReconciliationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReconciliationItem" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "gatewayPaymentId" TEXT,
    "settlementId" TEXT,
    "gatewayAmount" INTEGER,
    "gatewayFee" INTEGER,
    "gatewayTax" INTEGER,
    "settledAmount" INTEGER,
    "systemAmount" INTEGER,
    "paymentId" TEXT,
    "status" "ReconciliationItemStatus" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "ReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageTemplate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "whatsappTemplateName" TEXT,
    "whatsappLanguage" TEXT DEFAULT 'en',
    "smsDltTemplateId" TEXT,
    "variables" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "recipientName" TEXT,
    "userId" TEXT,
    "studentId" TEXT,
    "templateKey" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT,
    "providerMessageId" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "broadcastId" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMPTZ(6),

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "readAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "BroadcastCategory" NOT NULL DEFAULT 'GENERAL',
    "audience" JSONB NOT NULL,
    "channels" "NotificationChannel"[],
    "status" "BroadcastStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMPTZ(6),
    "sentAt" TIMESTAMPTZ(6),
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageThread" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadParticipant" (
    "threadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMPTZ(6),

    CONSTRAINT "ThreadParticipant_pkey" PRIMARY KEY ("threadId","userId")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'MANUAL',
    "remarks" TEXT,
    "markedById" TEXT,
    "alertSentAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAttendance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "checkIn" TIMESTAMPTZ(6),
    "checkOut" TIMESTAMPTZ(6),
    "method" TEXT NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "termId" TEXT,
    "name" TEXT NOT NULL,
    "type" "ExamType" NOT NULL,
    "maxMarks" INTEGER NOT NULL DEFAULT 100,
    "weightage" INTEGER NOT NULL DEFAULT 100,
    "startDate" DATE,
    "endDate" DATE,
    "gradeIds" TEXT[],
    "status" "ExamStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mark" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "marksObtained" DOUBLE PRECISION,
    "maxMarks" INTEGER NOT NULL,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "enteredById" TEXT,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Mark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportCard" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "termId" TEXT,
    "fileId" TEXT NOT NULL,
    "generatedById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homework" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "attachmentFileId" TEXT,
    "assignedById" TEXT NOT NULL,
    "notifyParents" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "employeeNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dob" DATE,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "designation" TEXT NOT NULL,
    "department" TEXT,
    "staffType" "StaffType" NOT NULL,
    "joiningDate" DATE NOT NULL,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "qualification" TEXT,
    "experienceYears" INTEGER,
    "addressLine1" TEXT,
    "city" TEXT,
    "panEnc" TEXT,
    "bankAccountEnc" TEXT,
    "bankIfsc" TEXT,
    "bankName" TEXT,
    "photoFileId" TEXT,
    "userId" TEXT,
    "customFields" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveType" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "annualQuota" INTEGER NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "fromDate" DATE NOT NULL,
    "toDate" DATE NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "decidedAt" TIMESTAMPTZ(6),
    "remarks" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "basic" INTEGER NOT NULL,
    "hra" INTEGER NOT NULL DEFAULT 0,
    "da" INTEGER NOT NULL DEFAULT 0,
    "specialAllowance" INTEGER NOT NULL DEFAULT 0,
    "otherAllowance" INTEGER NOT NULL DEFAULT 0,
    "pfPercentBp" INTEGER NOT NULL DEFAULT 1200,
    "professionalTax" INTEGER NOT NULL DEFAULT 20000,
    "tdsMonthly" INTEGER NOT NULL DEFAULT 0,
    "effectiveFrom" DATE NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "totalGross" INTEGER NOT NULL DEFAULT 0,
    "totalNet" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMPTZ(6),

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "earnings" JSONB NOT NULL,
    "deductions" JSONB NOT NULL,
    "gross" INTEGER NOT NULL,
    "totalDeductions" INTEGER NOT NULL,
    "net" INTEGER NOT NULL,
    "workingDays" INTEGER NOT NULL,
    "paidDays" DOUBLE PRECISION NOT NULL,
    "lopDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fileId" TEXT,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "parentId" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "type" "VoucherType" NOT NULL,
    "date" DATE NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "party" TEXT,
    "referenceNo" TEXT,
    "description" TEXT NOT NULL,
    "attachmentFileId" TEXT,
    "status" "VoucherStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'BUS',
    "capacity" INTEGER NOT NULL,
    "make" TEXT,
    "insuranceExpiry" DATE,
    "fitnessExpiry" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "licenseNo" TEXT NOT NULL,
    "licenseExpiry" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportRoute" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "termFee" INTEGER NOT NULL,
    "vehicleId" TEXT,
    "driverId" TEXT,
    "attendantName" TEXT,
    "attendantPhone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TransportRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportStop" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "pickupTime" TEXT,
    "dropTime" TEXT,
    "termFee" INTEGER,

    CONSTRAINT "TransportStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentTransport" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stopId" TEXT,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "StoreCategory" NOT NULL,
    "size" TEXT,
    "gradeId" TEXT,
    "unitPrice" INTEGER NOT NULL,
    "costPrice" INTEGER NOT NULL DEFAULT 0,
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitCost" INTEGER,
    "reference" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "saleNo" TEXT NOT NULL,
    "studentId" TEXT,
    "customerName" TEXT,
    "subtotal" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "invoiceId" TEXT,
    "soldById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "footer" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssuedCertificate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "CertificateType" NOT NULL,
    "data" JSONB NOT NULL,
    "fileId" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "issuedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssuedCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolEvent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "EventCategory" NOT NULL,
    "startAt" TIMESTAMPTZ(6) NOT NULL,
    "endAt" TIMESTAMPTZ(6) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "whomToMeet" TEXT,
    "idProofType" TEXT,
    "idNumber" TEXT,
    "vehicleNo" TEXT,
    "badgeNo" TEXT,
    "peopleCount" INTEGER NOT NULL DEFAULT 1,
    "checkInAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" TIMESTAMPTZ(6),
    "loggedById" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_code_key" ON "School"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Role_schoolId_key_key" ON "Role"("schoolId", "key");

-- CreateIndex
CREATE INDEX "User_schoolId_email_idx" ON "User"("schoolId", "email");

-- CreateIndex
CREATE INDEX "User_schoolId_phone_idx" ON "User"("schoolId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_schoolId_username_key" ON "User"("schoolId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_createdAt_idx" ON "AuditLog"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_action_idx" ON "AuditLog"("schoolId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "StoredFile_storageKey_key" ON "StoredFile"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "StoredFile_uploadToken_key" ON "StoredFile"("uploadToken");

-- CreateIndex
CREATE INDEX "StoredFile_schoolId_purpose_idx" ON "StoredFile"("schoolId", "purpose");

-- CreateIndex
CREATE INDEX "StoredFile_isTemporary_createdAt_idx" ON "StoredFile"("isTemporary", "createdAt");

-- CreateIndex
CREATE INDEX "BackgroundJob_status_runAfter_idx" ON "BackgroundJob"("status", "runAfter");

-- CreateIndex
CREATE INDEX "BackgroundJob_schoolId_type_createdAt_idx" ON "BackgroundJob"("schoolId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "BackupRecord_schoolId_startedAt_idx" ON "BackupRecord"("schoolId", "startedAt");

-- CreateIndex
CREATE INDEX "AcademicYear_schoolId_isCurrent_idx" ON "AcademicYear"("schoolId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_schoolId_name_key" ON "AcademicYear"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Term_academicYearId_sequence_key" ON "Term"("academicYearId", "sequence");

-- CreateIndex
CREATE INDEX "DueDateChange_schoolId_createdAt_idx" ON "DueDateChange"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "DueDateChange_termId_idx" ON "DueDateChange"("termId");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_schoolId_code_key" ON "Grade"("schoolId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_schoolId_order_key" ON "Grade"("schoolId", "order");

-- CreateIndex
CREATE INDEX "Section_classTeacherId_idx" ON "Section"("classTeacherId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_academicYearId_gradeId_name_key" ON "Section"("academicYearId", "gradeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_schoolId_code_key" ON "Subject"("schoolId", "code");

-- CreateIndex
CREATE INDEX "SectionSubject_teacherId_idx" ON "SectionSubject"("teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionSubject_sectionId_subjectId_key" ON "SectionSubject"("sectionId", "subjectId");

-- CreateIndex
CREATE INDEX "TimetableSlot_teacherId_dayOfWeek_period_idx" ON "TimetableSlot"("teacherId", "dayOfWeek", "period");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableSlot_sectionId_dayOfWeek_period_key" ON "TimetableSlot"("sectionId", "dayOfWeek", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Student_qrToken_key" ON "Student"("qrToken");

-- CreateIndex
CREATE INDEX "Student_schoolId_status_idx" ON "Student"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Student_schoolId_lastName_firstName_idx" ON "Student"("schoolId", "lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Student_schoolId_admissionNo_key" ON "Student"("schoolId", "admissionNo");

-- CreateIndex
CREATE INDEX "Enrollment_academicYearId_gradeId_status_idx" ON "Enrollment"("academicYearId", "gradeId", "status");

-- CreateIndex
CREATE INDEX "Enrollment_sectionId_status_idx" ON "Enrollment"("sectionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_academicYearId_key" ON "Enrollment"("studentId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_userId_key" ON "Guardian"("userId");

-- CreateIndex
CREATE INDEX "Guardian_schoolId_phone_idx" ON "Guardian"("schoolId", "phone");

-- CreateIndex
CREATE INDEX "Guardian_schoolId_email_idx" ON "Guardian"("schoolId", "email");

-- CreateIndex
CREATE INDEX "StudentGuardian_guardianId_idx" ON "StudentGuardian"("guardianId");

-- CreateIndex
CREATE INDEX "StudentDocument_studentId_idx" ON "StudentDocument"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_schoolId_entity_key_key" ON "CustomFieldDefinition"("schoolId", "entity", "key");

-- CreateIndex
CREATE INDEX "Enquiry_schoolId_stage_idx" ON "Enquiry"("schoolId", "stage");

-- CreateIndex
CREATE INDEX "Enquiry_schoolId_source_idx" ON "Enquiry"("schoolId", "source");

-- CreateIndex
CREATE INDEX "Enquiry_schoolId_createdAt_idx" ON "Enquiry"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_assignedToId_idx" ON "Enquiry"("assignedToId");

-- CreateIndex
CREATE INDEX "Enquiry_schoolId_phone_idx" ON "Enquiry"("schoolId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_schoolId_enquiryNo_key" ON "Enquiry"("schoolId", "enquiryNo");

-- CreateIndex
CREATE INDEX "EnquiryActivity_enquiryId_createdAt_idx" ON "EnquiryActivity"("enquiryId", "createdAt");

-- CreateIndex
CREATE INDEX "FollowUpTask_assignedToId_status_dueAt_idx" ON "FollowUpTask"("assignedToId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "FollowUpTask_schoolId_status_dueAt_idx" ON "FollowUpTask"("schoolId", "status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Application_enquiryId_key" ON "Application"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_studentId_key" ON "Application"("studentId");

-- CreateIndex
CREATE INDEX "Application_schoolId_academicYearId_status_idx" ON "Application"("schoolId", "academicYearId", "status");

-- CreateIndex
CREATE INDEX "Application_schoolId_gradeId_idx" ON "Application"("schoolId", "gradeId");

-- CreateIndex
CREATE INDEX "Application_schoolId_submittedAt_idx" ON "Application"("schoolId", "submittedAt");

-- CreateIndex
CREATE INDEX "Application_applicantUserId_idx" ON "Application"("applicantUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_schoolId_applicationNo_key" ON "Application"("schoolId", "applicationNo");

-- CreateIndex
CREATE INDEX "ApplicationGuardian_applicationId_idx" ON "ApplicationGuardian"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_idx" ON "ApplicationDocument"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationStatusHistory_applicationId_createdAt_idx" ON "ApplicationStatusHistory"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "PromotionBatch_schoolId_createdAt_idx" ON "PromotionBatch"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "PromotionRecord_batchId_idx" ON "PromotionRecord"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeHead_schoolId_code_key" ON "FeeHead"("schoolId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructure_academicYearId_gradeId_key" ON "FeeStructure"("academicYearId", "gradeId");

-- CreateIndex
CREATE INDEX "FeeStructureItem_feeStructureId_idx" ON "FeeStructureItem"("feeStructureId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentOptionalFee_studentId_academicYearId_feeHeadId_key" ON "StudentOptionalFee"("studentId", "academicYearId", "feeHeadId");

-- CreateIndex
CREATE UNIQUE INDEX "LateFeeRule_academicYearId_key" ON "LateFeeRule"("academicYearId");

-- CreateIndex
CREATE INDEX "StudentDiscount_schoolId_status_idx" ON "StudentDiscount"("schoolId", "status");

-- CreateIndex
CREATE INDEX "StudentDiscount_studentId_academicYearId_idx" ON "StudentDiscount"("studentId", "academicYearId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_dedupeKey_key" ON "Invoice"("dedupeKey");

-- CreateIndex
CREATE INDEX "Invoice_schoolId_status_dueDate_idx" ON "Invoice"("schoolId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Invoice_studentId_status_idx" ON "Invoice"("studentId", "status");

-- CreateIndex
CREATE INDEX "Invoice_termId_status_idx" ON "Invoice"("termId", "status");

-- CreateIndex
CREATE INDEX "Invoice_academicYearId_status_idx" ON "Invoice"("academicYearId", "status");

-- CreateIndex
CREATE INDEX "Invoice_schoolId_issueDate_idx" ON "Invoice"("schoolId", "issueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_schoolId_invoiceNo_key" ON "Invoice"("schoolId", "invoiceNo");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceLine_feeHeadId_idx" ON "InvoiceLine"("feeHeadId");

-- CreateIndex
CREATE INDEX "FeeAdjustment_schoolId_status_idx" ON "FeeAdjustment"("schoolId", "status");

-- CreateIndex
CREATE INDEX "FeeAdjustment_invoiceId_idx" ON "FeeAdjustment"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayPaymentId_key" ON "Payment"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "Payment_schoolId_paidAt_idx" ON "Payment"("schoolId", "paidAt");

-- CreateIndex
CREATE INDEX "Payment_studentId_paidAt_idx" ON "Payment"("studentId", "paidAt");

-- CreateIndex
CREATE INDEX "Payment_schoolId_mode_paidAt_idx" ON "Payment"("schoolId", "mode", "paidAt");

-- CreateIndex
CREATE INDEX "Payment_schoolId_status_idx" ON "Payment"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Payment_studentId_unallocatedAmount_idx" ON "Payment"("studentId", "unallocatedAmount");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_schoolId_receiptNo_key" ON "Payment"("schoolId", "receiptNo");

-- CreateIndex
CREATE INDEX "PaymentAllocation_paymentId_idx" ON "PaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_invoiceId_idx" ON "PaymentAllocation"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentAllocation_invoiceLineId_idx" ON "PaymentAllocation"("invoiceLineId");

-- CreateIndex
CREATE UNIQUE INDEX "GatewayOrder_orderId_key" ON "GatewayOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "GatewayOrder_paymentId_key" ON "GatewayOrder"("paymentId");

-- CreateIndex
CREATE INDEX "GatewayOrder_schoolId_status_createdAt_idx" ON "GatewayOrder"("schoolId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "GatewayOrder_studentId_idx" ON "GatewayOrder"("studentId");

-- CreateIndex
CREATE INDEX "WebhookEvent_receivedAt_idx" ON "WebhookEvent"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "WebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE INDEX "Refund_schoolId_status_idx" ON "Refund"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_schoolId_refundNo_key" ON "Refund"("schoolId", "refundNo");

-- CreateIndex
CREATE INDEX "LedgerEntry_studentId_entryDate_idx" ON "LedgerEntry"("studentId", "entryDate");

-- CreateIndex
CREATE INDEX "LedgerEntry_schoolId_type_entryDate_idx" ON "LedgerEntry"("schoolId", "type", "entryDate");

-- CreateIndex
CREATE INDEX "PaymentCommitment_schoolId_status_promisedDate_idx" ON "PaymentCommitment"("schoolId", "status", "promisedDate");

-- CreateIndex
CREATE INDEX "PaymentCommitment_studentId_idx" ON "PaymentCommitment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderRule_schoolId_offsetDays_key" ON "ReminderRule"("schoolId", "offsetDays");

-- CreateIndex
CREATE INDEX "ReminderLog_studentId_sentAt_idx" ON "ReminderLog"("studentId", "sentAt");

-- CreateIndex
CREATE INDEX "ReminderLog_schoolId_sentAt_idx" ON "ReminderLog"("schoolId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderLog_ruleId_invoiceId_key" ON "ReminderLog"("ruleId", "invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "FeePolicy_schoolId_type_key" ON "FeePolicy"("schoolId", "type");

-- CreateIndex
CREATE INDEX "PolicyOverride_studentId_policyType_idx" ON "PolicyOverride"("studentId", "policyType");

-- CreateIndex
CREATE INDEX "ReconciliationRun_schoolId_createdAt_idx" ON "ReconciliationRun"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "ReconciliationItem_runId_status_idx" ON "ReconciliationItem"("runId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MessageTemplate_schoolId_key_channel_key" ON "MessageTemplate"("schoolId", "key", "channel");

-- CreateIndex
CREATE INDEX "NotificationLog_schoolId_createdAt_idx" ON "NotificationLog"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_status_createdAt_idx" ON "NotificationLog"("status", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationLog_studentId_idx" ON "NotificationLog"("studentId");

-- CreateIndex
CREATE INDEX "NotificationLog_relatedType_relatedId_idx" ON "NotificationLog"("relatedType", "relatedId");

-- CreateIndex
CREATE INDEX "NotificationLog_broadcastId_idx" ON "NotificationLog"("broadcastId");

-- CreateIndex
CREATE INDEX "InAppNotification_userId_readAt_createdAt_idx" ON "InAppNotification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Announcement_schoolId_createdAt_idx" ON "Announcement"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageThread_schoolId_lastMessageAt_idx" ON "MessageThread"("schoolId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "ThreadParticipant_userId_idx" ON "ThreadParticipant"("userId");

-- CreateIndex
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "AttendanceRecord_sectionId_date_idx" ON "AttendanceRecord"("sectionId", "date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_schoolId_date_status_idx" ON "AttendanceRecord"("schoolId", "date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_date_key" ON "AttendanceRecord"("studentId", "date");

-- CreateIndex
CREATE INDEX "StaffAttendance_schoolId_date_idx" ON "StaffAttendance"("schoolId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendance_staffId_date_key" ON "StaffAttendance"("staffId", "date");

-- CreateIndex
CREATE INDEX "Exam_academicYearId_idx" ON "Exam"("academicYearId");

-- CreateIndex
CREATE INDEX "Mark_studentId_idx" ON "Mark"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Mark_examId_studentId_subjectId_key" ON "Mark"("examId", "studentId", "subjectId");

-- CreateIndex
CREATE INDEX "ReportCard_studentId_idx" ON "ReportCard"("studentId");

-- CreateIndex
CREATE INDEX "Homework_sectionId_dueDate_idx" ON "Homework"("sectionId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Staff_schoolId_status_idx" ON "Staff"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_schoolId_employeeNo_key" ON "Staff"("schoolId", "employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_schoolId_code_key" ON "LeaveType"("schoolId", "code");

-- CreateIndex
CREATE INDEX "LeaveRequest_schoolId_status_idx" ON "LeaveRequest"("schoolId", "status");

-- CreateIndex
CREATE INDEX "LeaveRequest_staffId_idx" ON "LeaveRequest"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructure_staffId_key" ON "SalaryStructure"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_schoolId_month_key" ON "PayrollRun"("schoolId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_payrollRunId_staffId_key" ON "Payslip"("payrollRunId", "staffId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_schoolId_code_key" ON "LedgerAccount"("schoolId", "code");

-- CreateIndex
CREATE INDEX "Voucher_schoolId_date_idx" ON "Voucher"("schoolId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_schoolId_voucherNo_key" ON "Voucher"("schoolId", "voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_schoolId_registrationNo_key" ON "Vehicle"("schoolId", "registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "TransportRoute_schoolId_code_key" ON "TransportRoute"("schoolId", "code");

-- CreateIndex
CREATE INDEX "StudentTransport_studentId_academicYearId_active_idx" ON "StudentTransport"("studentId", "academicYearId", "active");

-- CreateIndex
CREATE INDEX "StudentTransport_routeId_idx" ON "StudentTransport"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreItem_schoolId_sku_key" ON "StoreItem"("schoolId", "sku");

-- CreateIndex
CREATE INDEX "StockMovement_itemId_createdAt_idx" ON "StockMovement"("itemId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_invoiceId_key" ON "Sale"("invoiceId");

-- CreateIndex
CREATE INDEX "Sale_schoolId_createdAt_idx" ON "Sale"("schoolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_schoolId_saleNo_key" ON "Sale"("schoolId", "saleNo");

-- CreateIndex
CREATE INDEX "IssuedCertificate_studentId_idx" ON "IssuedCertificate"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "IssuedCertificate_schoolId_serialNo_key" ON "IssuedCertificate"("schoolId", "serialNo");

-- CreateIndex
CREATE INDEX "SchoolEvent_schoolId_startAt_idx" ON "SchoolEvent"("schoolId", "startAt");

-- CreateIndex
CREATE INDEX "Visitor_schoolId_checkInAt_idx" ON "Visitor"("schoolId", "checkInAt");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDateChange" ADD CONSTRAINT "DueDateChange_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDateChange" ADD CONSTRAINT "DueDateChange_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DueDateChange" ADD CONSTRAINT "DueDateChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grade" ADD CONSTRAINT "Grade_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubject" ADD CONSTRAINT "SectionSubject_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubject" ADD CONSTRAINT "SectionSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionSubject" ADD CONSTRAINT "SectionSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_promotionBatchId_fkey" FOREIGN KEY ("promotionBatchId") REFERENCES "PromotionBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardian" ADD CONSTRAINT "StudentGuardian_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDocument" ADD CONSTRAINT "StudentDocument_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryActivity" ADD CONSTRAINT "EnquiryActivity_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpTask" ADD CONSTRAINT "FollowUpTask_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpTask" ADD CONSTRAINT "FollowUpTask_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpTask" ADD CONSTRAINT "FollowUpTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationGuardian" ADD CONSTRAINT "ApplicationGuardian_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEmergencyContact" ADD CONSTRAINT "ApplicationEmergencyContact_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSibling" ADD CONSTRAINT "ApplicationSibling_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStatusHistory" ADD CONSTRAINT "ApplicationStatusHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRecord" ADD CONSTRAINT "PromotionRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PromotionBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRecord" ADD CONSTRAINT "PromotionRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureItem" ADD CONSTRAINT "FeeStructureItem_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureItem" ADD CONSTRAINT "FeeStructureItem_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "FeeHead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructureItem" ADD CONSTRAINT "FeeStructureItem_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentOptionalFee" ADD CONSTRAINT "StudentOptionalFee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentOptionalFee" ADD CONSTRAINT "StudentOptionalFee_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "FeeHead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateFeeRule" ADD CONSTRAINT "LateFeeRule_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDiscount" ADD CONSTRAINT "StudentDiscount_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDiscount" ADD CONSTRAINT "StudentDiscount_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentDiscount" ADD CONSTRAINT "StudentDiscount_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_feeHeadId_fkey" FOREIGN KEY ("feeHeadId") REFERENCES "FeeHead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAdjustment" ADD CONSTRAINT "FeeAdjustment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAdjustment" ADD CONSTRAINT "FeeAdjustment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAdjustment" ADD CONSTRAINT "FeeAdjustment_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAdjustment" ADD CONSTRAINT "FeeAdjustment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_invoiceLineId_fkey" FOREIGN KEY ("invoiceLineId") REFERENCES "InvoiceLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatewayOrder" ADD CONSTRAINT "GatewayOrder_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatewayOrder" ADD CONSTRAINT "GatewayOrder_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentCommitment" ADD CONSTRAINT "PaymentCommitment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentCommitment" ADD CONSTRAINT "PaymentCommitment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ReminderRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyOverride" ADD CONSTRAINT "PolicyOverride_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyOverride" ADD CONSTRAINT "PolicyOverride_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReconciliationItem" ADD CONSTRAINT "ReconciliationItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "ReconciliationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadParticipant" ADD CONSTRAINT "ThreadParticipant_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mark" ADD CONSTRAINT "Mark_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportCard" ADD CONSTRAINT "ReportCard_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Homework" ADD CONSTRAINT "Homework_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "LedgerAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRoute" ADD CONSTRAINT "TransportRoute_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRoute" ADD CONSTRAINT "TransportRoute_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportStop" ADD CONSTRAINT "TransportStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTransport" ADD CONSTRAINT "StudentTransport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTransport" ADD CONSTRAINT "StudentTransport_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTransport" ADD CONSTRAINT "StudentTransport_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "TransportStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StoreItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StoreItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuedCertificate" ADD CONSTRAINT "IssuedCertificate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CertificateTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssuedCertificate" ADD CONSTRAINT "IssuedCertificate_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
