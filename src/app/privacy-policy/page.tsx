import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy and participant data practices for Kaggadu Adventures.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-28 pb-20 bg-[#F6F4ED]">
      <article className="mx-auto max-w-[820px] px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="font-editorial text-4xl font-semibold text-[#18372D]">
          Privacy Policy
        </h1>
        <p className="text-sm text-[#8C735A]">
          Kaggadu Adventures — Participant & Visitor Privacy Notice
        </p>

        <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-5 text-sm sm:text-base text-[#262B27]/85 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
              1. Information We Collect
            </h2>
            <p>
              When you register for an adventure, volunteer drive, or submit an enquiry on our website, we collect only the details you provide: full name, mobile number, email address, participant count, optional emergency contact, and any notes you share.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
              2. How We Use Your Information
            </h2>
            <p>
              Your contact and emergency details are used strictly to coordinate event logistics, verify capacity, communicate departure updates, and respond to your enquiries. We do not sell or rent participant data to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
              3. Access & Security
            </h2>
            <p>
              Participant records are stored securely in PostgreSQL with Row Level Security enabled so that only authorised Kaggadu Adventures administrators and staff can access registration details.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
              4. Contact & Data Requests
            </h2>
            <p>
              You may request correction or deletion of your registration or enquiry records at any time by reaching out through our Contact page.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
