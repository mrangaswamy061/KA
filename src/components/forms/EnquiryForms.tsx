"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function ContactEnquiryForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, mobile, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to submit enquiry.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error while sending your message.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-xl bg-[#FFFDF8] border border-[#244B3C]/30 p-8 space-y-3"
      >
        <CheckCircle2 className="h-7 w-7 text-[#244B3C]" aria-hidden="true" />
        <h3 className="font-editorial text-2xl font-semibold text-[#18372D]">
          Message Sent
        </h3>
        <p className="text-sm text-[#262B27]/80">
          Thank you for reaching out to Kaggadu Adventures. Our team will get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-5"
      noValidate
    >
      <h2 className="font-editorial text-2xl font-semibold text-[#18372D]">
        Send an Enquiry
      </h2>

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
          <label htmlFor="contact-name" className="block text-sm font-medium text-[#18372D] mb-1">
            Full Name <span className="text-red-600">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-[#18372D] mb-1">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="contact-mobile" className="block text-sm font-medium text-[#18372D] mb-1">
            Mobile Number <span className="text-red-600">*</span>
          </label>
          <input
            id="contact-mobile"
            type="tel"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="contact-subject" className="block text-sm font-medium text-[#18372D] mb-1">
            Subject <span className="text-red-600">*</span>
          </label>
          <input
            id="contact-subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="contact-message" className="block text-sm font-medium text-[#18372D] mb-1">
            Message <span className="text-red-600">*</span>
          </label>
          <textarea
            id="contact-message"
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#244B3C] px-6 py-3 text-sm font-semibold text-[#FFFDF8] hover:bg-[#18372D] disabled:opacity-60 transition-colors"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Submit Enquiry
      </button>
    </form>
  );
}

export function CollaborationEnquiryForm() {
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [collaborationType, setCollaborationType] = useState("Corporate Outdoor Retreat");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/collaborations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          organisation,
          email,
          mobile,
          collaborationType,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to submit collaboration enquiry.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error while submitting proposal.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-xl bg-[#FFFDF8] border border-[#244B3C]/30 p-8 space-y-3"
      >
        <CheckCircle2 className="h-7 w-7 text-[#244B3C]" aria-hidden="true" />
        <h3 className="font-editorial text-2xl font-semibold text-[#18372D]">
          Collaboration Proposal Submitted
        </h3>
        <p className="text-sm text-[#262B27]/80">
          Thank you for reaching out on behalf of <strong>{organisation}</strong>. Our partnerships team will review your message and respond shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-5"
      noValidate
    >
      <h2 className="font-editorial text-2xl font-semibold text-[#18372D]">
        Organisation Enquiry Form
      </h2>

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
        <div>
          <label htmlFor="collab-name" className="block text-sm font-medium text-[#18372D] mb-1">
            Your Name <span className="text-red-600">*</span>
          </label>
          <input
            id="collab-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="collab-org" className="block text-sm font-medium text-[#18372D] mb-1">
            Organisation / Institution <span className="text-red-600">*</span>
          </label>
          <input
            id="collab-org"
            type="text"
            required
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="collab-email" className="block text-sm font-medium text-[#18372D] mb-1">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            id="collab-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="collab-mobile" className="block text-sm font-medium text-[#18372D] mb-1">
            Mobile Number <span className="text-red-600">*</span>
          </label>
          <input
            id="collab-mobile"
            type="tel"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="collab-type" className="block text-sm font-medium text-[#18372D] mb-1">
            Collaboration Type <span className="text-red-600">*</span>
          </label>
          <select
            id="collab-type"
            value={collaborationType}
            onChange={(e) => setCollaborationType(e.target.value)}
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          >
            <option value="Corporate Outdoor Retreat">Corporate Outdoor Retreat</option>
            <option value="School / College Nature Program">School / College Nature Program</option>
            <option value="Conservation & CSR Partnership">Conservation & CSR Partnership</option>
            <option value="Eco-Tourism & Community Hosting">Eco-Tourism & Community Hosting</option>
            <option value="Other Partnership">Other Partnership</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="collab-message" className="block text-sm font-medium text-[#18372D] mb-1">
            Message <span className="text-red-600">*</span>
          </label>
          <textarea
            id="collab-message"
            rows={4}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share group size, preferred dates, and collaboration goals..."
            className="w-full rounded-md border border-[#E9E9E2] bg-[#F6F4ED]/50 px-3.5 py-2.5 text-sm text-[#262B27] focus:border-[#244B3C] focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#244B3C] px-6 py-3 text-sm font-semibold text-[#FFFDF8] hover:bg-[#18372D] disabled:opacity-60 transition-colors"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        Submit Partnership Enquiry
      </button>
    </form>
  );
}
