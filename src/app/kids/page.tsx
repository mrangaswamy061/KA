import type { Metadata } from "next";
import { getPublishedAdventures } from "@/lib/services/public-data";
import { AdventureDirectory } from "@/components/adventure-cards/AdventureDirectory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "For Kids",
  description:
    "Guided outdoor learning, nature exploration, and child-friendly adventure programs by Kaggadu Adventures.",
  alternates: { canonical: "/kids" },
};

export default async function KidsPage() {
  const kidsPrograms = await getPublishedAdventures("kids");

  return (
    <div className="pt-28 pb-20 bg-[#F6F4ED]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
            Outdoor Learning & Nature Discovery
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#18372D]">
            For Kids
          </h1>
          <p className="text-base text-[#262B27]/80 leading-relaxed">
            Introduce children to nature through guided outdoor learning and adventure programs with clear age eligibility and parent/guardian guidelines.
          </p>
        </div>

        <AdventureDirectory
          category="kids"
          adventures={kidsPrograms}
          emptyTitle="Kids programs will be published here soon"
          emptyDescription="Upcoming nature camps and outdoor learning sessions for children will appear here once published. Contact us for school or family enquiries."
        />
      </div>
    </div>
  );
}
