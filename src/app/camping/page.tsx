import type { Metadata } from "next";
import { getPublishedAdventures } from "@/lib/services/public-data";
import { AdventureDirectory } from "@/components/adventure-cards/AdventureDirectory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Camping",
  description:
    "Experience peaceful nights, campfires, and curated outdoor camping packages with Kaggadu Adventures.",
  alternates: { canonical: "/camping" },
};

export default async function CampingPage() {
  const camping = await getPublishedAdventures("camping");

  return (
    <div className="pt-28 pb-20 bg-[#F6F4ED]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
            Under the Open Sky
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#18372D]">
            Camping
          </h1>
          <p className="text-base text-[#262B27]/80 leading-relaxed">
            Experience peaceful nights, campfires and the beauty of the outdoors with thoughtfully managed tented stays and nature activities.
          </p>
        </div>

        <AdventureDirectory
          category="camping"
          adventures={camping}
          emptyTitle="Camping packages will be published here soon"
          emptyDescription="We are preparing seasonal camping experiences. Contact us for private or group camp enquiries."
        />
      </div>
    </div>
  );
}
