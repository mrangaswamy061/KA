import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeIndianMobile,
  registrationSchema,
  contactEnquirySchema,
} from "./schemas.ts";
import { buildWhatsAppEnquiryUrl } from "../whatsapp/links.ts";
import {
  escapeHtml,
  generateReferenceCode,
  isDeadlinePassed,
  parseOptionalNumber,
  safeSlug,
  slugify,
  toCsv,
} from "../utils/format.ts";
import {
  signLocalSessionToken,
  verifyLocalSessionToken,
} from "../auth/local-token.ts";

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

test("generateReferenceCode, slugify, safeSlug, and toCsv work as expected", () => {
  const code = generateReferenceCode("KGD");
  assert.match(code, /^KGD-\d{8}-[A-F0-9]{4}$/);
  assert.equal(slugify("Kudremukh Peak Trek!"), "kudremukh-peak-trek");
  assert.match(safeSlug("", "!!!"), /^item-[a-z0-9]+$/);
  assert.equal(toCsv(["Name", "Note"], [["A", 'Hello "World"']]), 'Name,Note\r\nA,"Hello ""World"""');
});

test("parseOptionalNumber, escapeHtml, and isDeadlinePassed handle edge cases", () => {
  assert.equal(parseOptionalNumber(""), null);
  assert.equal(parseOptionalNumber("abc"), null);
  assert.equal(parseOptionalNumber("1500"), 1500);
  assert.equal(escapeHtml('<script>"test"</script>'), "&lt;script&gt;&quot;test&quot;&lt;/script&gt;");
  assert.equal(isDeadlinePassed("2020-01-01"), true);
  assert.equal(isDeadlinePassed("2099-12-31"), false);
  assert.equal(isDeadlinePassed(null), false);
});

test("signLocalSessionToken and verifyLocalSessionToken reject forged tokens", () => {
  const valid = signLocalSessionToken("admin@example.com");
  const verified = verifyLocalSessionToken(valid);
  assert.equal(verified?.email, "admin@example.com");
  assert.equal(verifyLocalSessionToken("forged.token"), null);
  assert.equal(verifyLocalSessionToken(undefined), null);
});
