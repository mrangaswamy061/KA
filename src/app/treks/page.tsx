import type { Metadata } from "next";
import { getPublishedAdventures } from "@/lib/services/public-data";
import { AdventureDirectory } from "@/components/adventure-cards/AdventureDirectory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Treks",
  description:
    "Explore guided mountain treks across the Western Ghats with Kaggadu Adventures. View difficulty, distance, elevation, itinerary, and upcoming dates.",
  alternates: { canonical: "/treks" },
};

export default async function TreksPage() {
  const treks = await getPublishedAdventures("trek");

  return (
    <div className="pt-28 pb-20 bg-[#F6F4ED]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
            Mountain Trails & Peaks
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#18372D]">
            Treks
          </h1>
          <p className="text-base text-[#262B27]/80 leading-relaxed">
            Explore mountain trails, peaks and hidden landscapes across the Western Ghats with safety-first itineraries and experienced leadership.
          </p>
        </div>

        <AdventureDirectory
          category="trek"
          adventures={treks}
          emptyTitle="Treks will be published here soon"
          emptyDescription="Our team is finalizing upcoming trekking itineraries. Contact us or check the Events Calendar for the next scheduled departures."
        />
      </div>
    </div>
  );
}
