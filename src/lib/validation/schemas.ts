import { z } from "zod";

/**
 * Validates standard Indian 10-digit mobile numbers (optional +91 or 0 prefix normalized).
 */
export function normalizeIndianMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

export const indianMobileSchema = z
  .string()
  .trim()
  .transform(normalizeIndianMobile)
  .refine((val) => /^[6-9]\d{9}$/.test(val), {
    message: "Please enter a valid 10-digit Indian mobile number.",
  });

export const registrationSchema = z.object({
  eventId: z.string().uuid("Invalid event selected."),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters.").max(120),
  mobile: indianMobileSchema,
  email: z.string().trim().email("Please enter a valid email address.").max(160),
  participantsCount: z.coerce
    .number()
    .int()
    .min(1, "At least 1 participant is required.")
    .max(30, "For groups larger than 30, please contact us via Collaborations."),
  emergencyContact: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  consentAccepted: z.literal(true, {
    error: "You must accept the Privacy Policy and Terms & Conditions.",
  }),
});

export const volunteerRegistrationSchema = z.object({
  eventId: z.string().uuid("Invalid volunteer event selected."),
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  mobile: indianMobileSchema,
  email: z.string().trim().email("Please enter a valid email address.").max(160),
  participantsCount: z.coerce.number().int().min(1).max(20).default(1),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  consentAccepted: z.literal(true, {
    error: "Please accept the Privacy Policy and Terms & Conditions.",
  }),
});

export const contactEnquirySchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(160),
  mobile: indianMobileSchema,
  subject: z.string().trim().min(2, "Subject is required.").max(160),
  message: z.string().trim().min(10, "Please share a brief message (min 10 characters).").max(2000),
});

export const collaborationEnquirySchema = z.object({
  name: z.string().trim().min(2, "Your name is required.").max(120),
  organisation: z.string().trim().min(2, "Organisation name is required.").max(160),
  email: z.string().trim().email("Please enter a valid email address.").max(160),
  mobile: indianMobileSchema,
  collaborationType: z.string().trim().min(2, "Please select a collaboration type.").max(100),
  message: z.string().trim().min(10, "Please describe your collaboration proposal.").max(2000),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type VolunteerRegistrationInput = z.infer<typeof volunteerRegistrationSchema>;
export type ContactEnquiryInput = z.infer<typeof contactEnquirySchema>;
export type CollaborationEnquiryInput = z.infer<typeof collaborationEnquirySchema>;
