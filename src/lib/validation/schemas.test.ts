import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeIndianMobile,
  registrationSchema,
  contactEnquirySchema,
} from "./schemas.ts";
import { buildWhatsAppEnquiryUrl } from "../whatsapp/links.ts";
import { generateReferenceCode, slugify, toCsv } from "../utils/format.ts";

test("normalizeIndianMobile handles +91 and 0 prefixes", () => {
  assert.equal(normalizeIndianMobile("+91 98765 43210"), "9876543210");
  assert.equal(normalizeIndianMobile("09876543210"), "9876543210");
  assert.equal(normalizeIndianMobile("9876543210"), "9876543210");
});

test("registrationSchema validates Indian mobile, email, and consent", () => {
  const valid = registrationSchema.safeParse({
    eventId: "11111111-1111-4111-8111-111111111111",
    fullName: "Aarav Rao",
    mobile: "+91 9876543210",
    email: "aarav@example.com",
    participantsCount: 2,
    emergencyContact: "9876500000",
    message: "Excited for the trek",
    consentAccepted: true,
  });
  assert.equal(valid.success, true);

  const invalidMobile = registrationSchema.safeParse({
    eventId: "11111111-1111-4111-8111-111111111111",
    fullName: "Aarav Rao",
    mobile: "12345",
    email: "aarav@example.com",
    participantsCount: 1,
    consentAccepted: true,
  });
  assert.equal(invalidMobile.success, false);
});

test("contactEnquirySchema rejects short messages", () => {
  const res = contactEnquirySchema.safeParse({
    fullName: "Meera",
    email: "meera@example.com",
    mobile: "9876543210",
    subject: "Trek",
    message: "Hi",
  });
  assert.equal(res.success, false);
});

test("buildWhatsAppEnquiryUrl builds prefilled wa.me link", () => {
  const url = buildWhatsAppEnquiryUrl({
    whatsappNumber: "+91 98765 43210",
    eventName: "Kudremukh Trek",
    participantName: "Kiran",
    participantsCount: 2,
    eventDate: "15 Dec 2026",
  });
  assert.ok(url?.startsWith("https://wa.me/919876543210?text="));
  assert.ok(url?.includes("Kudremukh%20Trek"));
});

test("generateReferenceCode, slugify, and toCsv work as expected", () => {
  const code = generateReferenceCode("KGD");
  assert.match(code, /^KGD-\d{8}-[A-F0-9]{4}$/);
  assert.equal(slugify("Kudremukh Peak Trek!"), "kudremukh-peak-trek");
  assert.equal(toCsv(["Name", "Note"], [["A", 'Hello "World"']]), 'Name,Note\r\nA,"Hello ""World"""');
});
