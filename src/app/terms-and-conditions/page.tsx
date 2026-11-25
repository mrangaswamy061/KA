import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and Conditions for participating in Kaggadu Adventures events.",
  alternates: { canonical: "/terms-and-conditions" },
};

export default function TermsPage() {
  return (
    <div className="pt-28 pb-20 bg-[#F6F4ED]">
      <article className="mx-auto max-w-[820px] px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="font-editorial text-4xl font-semibold text-[#18372D]">
          Terms & Conditions
        </h1>
        <p className="text-sm text-[#8C735A]">
          Kaggadu Adventures — Participation & Event Guidelines
        </p>

        <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-5 text-sm sm:text-base text-[#262B27]/85 leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
              1. Event Registrations
            </h2>
            <p>
              Online registration submits your booking request and generates a reference code. Final slot confirmation is subject to availability, eligibility requirements, and any applicable registration instructions shared by our team.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
              2. Outdoor Safety & Trail Conduct
            </h2>
            <p>
              Participants agree to follow all safety instructions given by Kaggadu Adventures trek leaders, respect local communities and wildlife, and practice Leave No Trace principles on every trail and campsite.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
              3. Weather & Schedule Adjustments
            </h2>
            <p>
              Outdoor itineraries in the Western Ghats may be adjusted or rescheduled due to weather, forest department advisories, or safety conditions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
              4. Kids & Minors
            </h2>
            <p>
              Participation in For Kids programs or family events requires accurate age disclosure and parent/guardian consent as specified on each program page.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
