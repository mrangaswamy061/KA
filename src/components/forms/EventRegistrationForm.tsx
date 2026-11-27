"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

interface EventRegistrationFormProps {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  isVolunteer?: boolean;
  isOpenForRegistration: boolean;
  statusLabel: string;
  whatsappNumber?: string | null;
}

export function EventRegistrationForm({
  eventId,
  eventTitle,
  eventDate,
  isVolunteer = false,
  isOpenForRegistration,
  statusLabel,
  whatsappNumber,
}: EventRegistrationFormProps) {
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [participantsInput, setParticipantsInput] = useState("1");
  const maxParticipantsAllowed = isVolunteer ? 20 : 30;
  const parsedParticipants = Number(participantsInput);
  const participantsCount =
    Number.isInteger(parsedParticipants) && parsedParticipants >= 1
      ? parsedParticipants
      : 1;
  const [emergencyContact, setEmergencyContact] = useState("");
  const [message, setMessage] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    referenceCode: string;
    emailSent: boolean;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const endpoint = isVolunteer
        ? "/api/volunteer-registrations"
        : "/api/registrations";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          fullName,
          mobile,
          email,
          participantsCount,
          emergencyContact: isVolunteer ? undefined : emergencyContact,
          message,
          consentAccepted,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to complete registration. Please check your details.");
        return;
      }

      setConfirmation({
        referenceCode: data.referenceCode,
        emailSent: Boolean(data.emailSent),
      });
    } catch {
      setError("Network error while submitting registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpenForRegistration) {
    return (
      <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-[#8C735A] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-editorial text-xl font-semibold text-[#18372D]">
              Online Registration Unavailable ({statusLabel})
            </h3>
            <p className="text-sm text-[#262B27]/80 mt-1">
              This event is currently marked as <strong>{statusLabel}</strong>. You can still reach out via WhatsApp for waitlist or upcoming batch details.
            </p>
          </div>
        </div>
        <WhatsAppButton
          whatsappNumber={whatsappNumber}
          eventName={eventTitle}
          eventDate={eventDate}
        />
      </div>
    );
  }

  if (confirmation) {
    return (
      <div
        role="status"
        className="rounded-xl bg-[#FFFDF8] border border-[#244B3C]/30 p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-[#244B3C] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="font-editorial text-2xl font-semibold text-[#18372D]">
              Registration Received
            </h3>
            <p className="text-sm text-[#262B27]/80">
              Your {isVolunteer ? "volunteer registration" : "registration"} for{" "}
              <strong>{eventTitle}</strong> has been saved.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-[#F6F4ED] border border-[#E9E9E2] p-4">
          <p className="text-xs uppercase tracking-wider text-[#8C735A] font-semibold">
            Registration Reference
          </p>
          <p className="font-mono text-xl font-bold text-[#18372D] mt-1">
            {confirmation.referenceCode}
          </p>
          <p className="text-xs text-[#262B27]/70 mt-1">
            {confirmation.emailSent
              ? "A confirmation email has been sent to your email address."
              : "Please save this reference code. Our team will contact you shortly."}
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8C735A]">
            Optional WhatsApp Follow-Up
          </p>
          <WhatsAppButton
            whatsappNumber={whatsappNumber}
            eventName={eventTitle}
            participantName={`${fullName} (Ref: ${confirmation.referenceCode})`}
            participantsCount={participantsCount}
            eventDate={eventDate}
            label="SEND REFERENCE ON WHATSAPP"
            showNote={false}
          />
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-5"
      noValidate
    >
      <div className="space-y-1">
        <h3 className="font-editorial text-2xl font-semibold text-[#18372D]">
          {isVolunteer ? "Register as Volunteer" : "Register Online"}
        </h3>
        <p className="text-sm text-[#262B27]/75">
          {eventTitle} • {eventDate}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="reg-full-name" className="block text-sm font-medium text-[#18372D] mb-1">
            Full Name <span className="text-red-600">*</span>
          </label>
          <input
            id="reg-full-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your full name"
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="reg-mobile" className="block text-sm font-medium text-[#18372D] mb-1">
            Mobile Number (India) <span className="text-red-600">*</span>
          </label>
          <input
            id="reg-mobile"
            type="tel"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="10-digit mobile number"
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-[#18372D] mb-1">
            Email Address <span className="text-red-600">*</span>
          </label>
          <input
            id="reg-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="reg-count" className="block text-sm font-medium text-[#18372D] mb-1">
            Number of Participants <span className="text-red-600">*</span>
          </label>
          <input
            id="reg-count"
            type="number"
            min={1}
            max={maxParticipantsAllowed}
            required
            value={participantsInput}
            onChange={(e) => setParticipantsInput(e.target.value)}
            onBlur={() => {
              const n = Number(participantsInput);
              if (!Number.isInteger(n) || n < 1) {
                setParticipantsInput("1");
              } else if (n > maxParticipantsAllowed) {
                setParticipantsInput(String(maxParticipantsAllowed));
              }
            }}
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>

        {!isVolunteer && (
          <div>
            <label htmlFor="reg-emergency" className="block text-sm font-medium text-[#18372D] mb-1">
              Emergency Contact
            </label>
            <input
              id="reg-emergency"
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="Name & phone number"
              className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor="reg-message" className="block text-sm font-medium text-[#18372D] mb-1">
            Message / Dietary or Medical Notes
          </label>
          <textarea
            id="reg-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Any questions or notes for our trek leaders..."
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <input
          id="reg-consent"
          type="checkbox"
          required
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-[#E9E9E2] text-[#244B3C] focus:ring-[#244B3C]"
        />
        <label htmlFor="reg-consent" className="text-xs text-[#262B27]/80 leading-relaxed">
          I agree to the{" "}
          <Link href="/terms-and-conditions" className="underline text-[#244B3C] font-medium">
            Terms & Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" className="underline text-[#244B3C] font-medium">
            Privacy Policy
          </Link>{" "}
          and consent to Kaggadu Adventures contacting me regarding this registration.
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#244B3C] px-6 py-3.5 text-sm font-semibold text-[#FFFDF8] hover:bg-[#18372D] disabled:opacity-60 transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Submitting...
          </>
        ) : (
          "REGISTER ONLINE"
        )}
      </button>
    </form>
  );
}
