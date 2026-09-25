import { z } from 'zod';

/** Typed shape of School.settings (JSON). Every key has a default, so partial saves are safe. */
export const SchoolSettingsSchema = z.object({
  numbering: z
    .object({
      applicationPrefix: z.string().default('RNSIS'),
      admissionPrefix: z.string().default('RNSIS'),
      enquiryPrefix: z.string().default('ENQ'),
      invoicePrefix: z.string().default('INV'),
      receiptPrefix: z.string().default('RCPT'),
      refundPrefix: z.string().default('RFD'),
      certificatePrefix: z.string().default('CERT'),
      salePrefix: z.string().default('POS'),
      voucherPrefix: z.string().default('VCH'),
    })
    .default({}),
  admissions: z
    .object({
      autoAcknowledgeEnquiry: z.boolean().default(true),
      requireDocumentsVerified: z.boolean().default(true),
      requirePrincipalApproval: z.boolean().default(true),
      sendParentCredentials: z.boolean().default(true),
      defaultSectionCapacity: z.number().int().default(40),
      maxUploadMb: z.number().default(8),
    })
    .default({}),
  promotion: z
    .object({
      duesCheckEnabled: z.boolean().default(false),
      duesThreshold: z.number().int().default(0),
      undoWindowHours: z.number().int().default(48),
    })
    .default({}),
  fees: z
    .object({
      prorateMidSession: z.boolean().default(true),
      prorateAnnualFees: z.boolean().default(false),
      allowPartialOnlinePayment: z.boolean().default(true),
      minOnlinePayment: z.number().int().default(100_00),
      autoApplyAdvanceCredit: z.boolean().default(true),
      payLinkValidityDays: z.number().int().default(30),
      receiptFooter: z.string().default('This is a computer-generated receipt. Fees once paid are non-refundable except as per school policy.'),
      bankDetails: z.string().default('Bank: Canara Bank, RR Nagar Branch · A/c: RNSIS International School · IFSC: CNRB0001234'),
    })
    .default({}),
  notifications: z
    .object({
      email: z.boolean().default(true),
      sms: z.boolean().default(true),
      whatsapp: z.boolean().default(true),
      paymentReceipts: z.boolean().default(true),
      absenceAlerts: z.boolean().default(true),
      absenceChannels: z.array(z.enum(['SMS', 'WHATSAPP', 'EMAIL'])).default(['SMS', 'WHATSAPP']),
    })
    .default({}),
  academics: z
    .object({
      workingDays: z.array(z.number().int().min(1).max(7)).default([1, 2, 3, 4, 5, 6]),
      periods: z
        .array(z.object({ period: z.number().int(), start: z.string(), end: z.string() }))
        .default([
          { period: 1, start: '08:30', end: '09:15' },
          { period: 2, start: '09:15', end: '10:00' },
          { period: 3, start: '10:15', end: '11:00' },
          { period: 4, start: '11:00', end: '11:45' },
          { period: 5, start: '12:30', end: '13:15' },
          { period: 6, start: '13:15', end: '14:00' },
          { period: 7, start: '14:00', end: '14:45' },
          { period: 8, start: '14:45', end: '15:30' },
        ]),
    })
    .default({}),
  backups: z
    .object({
      dailyEnabled: z.boolean().default(true),
    })
    .default({}),
});

export type SchoolSettings = z.infer<typeof SchoolSettingsSchema>;

export function parseSettings(raw: unknown): SchoolSettings {
  return SchoolSettingsSchema.parse(raw && typeof raw === 'object' ? raw : {});
}
