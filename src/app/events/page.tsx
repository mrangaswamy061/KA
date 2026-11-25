import type { Metadata } from "next";
import { getPublishedEvents } from "@/lib/services/public-data";
import { EventCalendar } from "@/components/calendar/EventCalendar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Upcoming Events",
  description:
    "Browse the Kaggadu Adventures event calendar for upcoming treks, trips, camping departures, kids programs, and conservation volunteer drives.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <div className="pt-28 pb-20 bg-[#F6F4ED]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
            Calendar & Departures
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#18372D]">
            Upcoming Events
          </h1>
          <p className="text-base text-[#262B27]/80 leading-relaxed">
            Explore scheduled treks, coastal trips, overnight camps, kids’ nature sessions, and volunteer conservation drives. Select any highlighted date to view details and register.
          </p>
        </div>

        <EventCalendar events={events} />
      </div>
    </div>
  );
}
