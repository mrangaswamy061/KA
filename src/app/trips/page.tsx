import type { Metadata } from "next";
import { getPublishedAdventures } from "@/lib/services/public-data";
import { AdventureDirectory } from "@/components/adventure-cards/AdventureDirectory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trips",
  description:
    "Discover coastal escapes, scenic journeys, and curated nature trips with Kaggadu Adventures.",
  alternates: { canonical: "/trips" },
};

export default async function TripsPage() {
  const trips = await getPublishedAdventures("trip");

  return (
    <div className="pt-28 pb-20 bg-[#F6F4ED]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
            Coastal & Scenic Escapes
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#18372D]">
            Trips
          </h1>
          <p className="text-base text-[#262B27]/80 leading-relaxed">
            Discover beautiful destinations, coastal escapes and unforgettable journeys with curated travel arrangements and accommodation.
          </p>
        </div>

        <AdventureDirectory
          category="trip"
          adventures={trips}
          emptyTitle="Trips will be published here soon"
          emptyDescription="New coastal and countryside trips are being curated. Reach out via Contact Us for custom group trips."
        />
      </div>
    </div>
  );
}
