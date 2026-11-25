import type { Metadata } from "next";
import { Building2, GraduationCap, HeartHandshake, Trees } from "lucide-react";
import { CollaborationEnquiryForm } from "@/components/forms/EnquiryForms";

export const metadata: Metadata = {
  title: "Collaborations",
  description:
    "Partner with Kaggadu Adventures for corporate outdoor retreats, school & college nature programs, CSR conservation drives, and community eco-tourism.",
  alternates: { canonical: "/collaborations" },
};

const OPPORTUNITIES = [
  {
    icon: Building2,
    title: "Corporate Outdoor Retreats",
    description:
      "Mindful team treks, wilderness camps, and nature-immersion offsites tailored for organisations.",
  },
  {
    icon: GraduationCap,
    title: "Schools & Colleges",
    description:
      "Educational field trips, ecological walks, and age-appropriate outdoor learning modules.",
  },
  {
    icon: HeartHandshake,
    title: "CSR & Conservation Drives",
    description:
      "Co-branded trail cleanups, sapling plantations, and community environmental awareness initiatives.",
  },
  {
    icon: Trees,
    title: "Local & Eco-Tourism Partners",
    description:
      "Collaborations with homestays, naturalists, and regional outdoor communities in the Western Ghats.",
  },
];

export default function CollaborationsPage() {
  return (
    <div className="pt-28 pb-20 bg-[#F6F4ED]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
            Partner With Us
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#18372D]">
            Collaborations
          </h1>
          <p className="text-base text-[#262B27]/85 leading-relaxed">
            We partner with institutions, companies, educators, and conservation groups to craft responsible outdoor programs that leave a lasting positive impact.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-5">
            <h2 className="font-editorial text-2xl font-semibold text-[#18372D]">
              Partnership Opportunities
            </h2>
            <div className="space-y-4">
              {OPPORTUNITIES.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-5 flex items-start gap-4"
                  >
                    <div className="h-10 w-10 rounded-full bg-[#244B3C] text-[#FFFDF8] flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-editorial text-lg font-semibold text-[#18372D]">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#262B27]/80 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-7">
            <CollaborationEnquiryForm />
          </div>
        </div>
      </div>
    </div>
  );
}
