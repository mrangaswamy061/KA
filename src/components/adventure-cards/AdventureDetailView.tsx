import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Mountain,
  Compass,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Users,
} from "lucide-react";
import type {
  Adventure,
  AdventureCategory,
  EventImage,
  EventRecord,
  WebsiteSettings,
} from "@/types/database";
import { formatEventDate, formatINR } from "@/lib/utils/format";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

const FALLBACK_IMAGES: Record<AdventureCategory, string> = {
  trek: "/images/category-treks.jpg",
  trip: "/images/category-trips.jpg",
  camping: "/images/category-camping.jpg",
  kids: "/images/category-kids.jpg",
};

const BACK_ROUTES: Record<AdventureCategory, { href: string; label: string }> = {
  trek: { href: "/treks", label: "Back to Treks" },
  trip: { href: "/trips", label: "Back to Trips" },
  camping: { href: "/camping", label: "Back to Camping" },
  kids: { href: "/kids", label: "Back to For Kids" },
};

export function AdventureDetailView({
  adventure,
  gallery,
  upcomingEvents,
  settings,
}: {
  adventure: Adventure;
  gallery: EventImage[];
  upcomingEvents: EventRecord[];
  settings: WebsiteSettings;
}) {
  const back = BACK_ROUTES[adventure.category];
  const primaryEvent = upcomingEvents[0];

  return (
    <div className="pt-24 pb-20 bg-[#F6F4ED]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-12">
        <Link
          href={back.href}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#244B3C] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {back.label}
        </Link>

        {/* Hero Cover & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#E9E9E2] bg-[#E9E9E2]">
              <Image
                src={adventure.cover_image_url || FALLBACK_IMAGES[adventure.category]}
                alt={adventure.cover_image_alt || adventure.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            </div>

            {gallery.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {gallery.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[#E9E9E2]"
                  >
                    <Image
                      src={img.image_url}
                      alt={img.alt_text || adventure.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
                {adventure.category.toUpperCase()}
              </p>
              <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#18372D]">
                {adventure.title}
              </h1>
              <p className="text-sm text-[#262B27]/80 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#8C735A]" aria-hidden="true" />
                {adventure.location}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-[#E9E9E2] text-sm">
              {adventure.duration && (
                <div>
                  <span className="text-xs text-[#8C735A] block">Duration</span>
                  <span className="font-semibold text-[#18372D] inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {adventure.duration}
                  </span>
                </div>
              )}
              {adventure.difficulty && (
                <div>
                  <span className="text-xs text-[#8C735A] block">Difficulty</span>
                  <span className="font-semibold text-[#18372D] inline-flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                    {adventure.difficulty}
                  </span>
                </div>
              )}
              {adventure.distance && (
                <div>
                  <span className="text-xs text-[#8C735A] block">Distance</span>
                  <span className="font-semibold text-[#18372D]">{adventure.distance}</span>
                </div>
              )}
              {adventure.elevation && (
                <div>
                  <span className="text-xs text-[#8C735A] block">Elevation</span>
                  <span className="font-semibold text-[#18372D] inline-flex items-center gap-1">
                    <Mountain className="h-3.5 w-3.5" aria-hidden="true" />
                    {adventure.elevation}
                  </span>
                </div>
              )}
              {adventure.age_requirement && (
                <div>
                  <span className="text-xs text-[#8C735A] block">Age Eligibility</span>
                  <span className="font-semibold text-[#18372D] inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {adventure.age_requirement}
                  </span>
                </div>
              )}
              <div>
                <span className="text-xs text-[#8C735A] block">Price</span>
                <span className="font-semibold text-[#18372D] text-base">
                  {formatINR(adventure.price)}
                </span>
              </div>
            </div>

            {/* Dual Registration CTAs */}
            <div className="space-y-3">
              {primaryEvent ? (
                <Link
                  href={`/events/${primaryEvent.slug}#register`}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[#244B3C] px-5 py-3.5 text-sm font-semibold text-[#FFFDF8] hover:bg-[#18372D] transition-colors"
                >
                  REGISTER ONLINE
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <Link
                  href="/contact"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[#244B3C] px-5 py-3.5 text-sm font-semibold text-[#FFFDF8] hover:bg-[#18372D] transition-colors"
                >
                  ENQUIRE FOR NEXT BATCH
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}

              <WhatsAppButton
                whatsappNumber={settings.whatsapp_number}
                eventName={adventure.title}
                eventDate={
                  primaryEvent
                    ? formatEventDate(primaryEvent.start_date, primaryEvent.end_date)
                    : undefined
                }
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Detailed Editorial Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <section className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-4">
              <h2 className="font-editorial text-2xl font-semibold text-[#18372D]">
                Overview
              </h2>
              <p className="text-base text-[#262B27]/85 whitespace-pre-line leading-relaxed">
                {adventure.description || adventure.short_description}
              </p>
            </section>

            {adventure.highlights && adventure.highlights.length > 0 && (
              <section className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-4">
                <h2 className="font-editorial text-2xl font-semibold text-[#18372D]">
                  Highlights
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {adventure.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[#262B27]/85">
                      <CheckCircle2 className="h-4 w-4 text-[#244B3C] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {adventure.itinerary && adventure.itinerary.length > 0 && (
              <section className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-6">
                <h2 className="font-editorial text-2xl font-semibold text-[#18372D]">
                  Itinerary
                </h2>
                <div className="space-y-5">
                  {adventure.itinerary.map((item, i) => (
                    <div key={i} className="border-l-2 border-[#A8B8A0] pl-4 space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8C735A]">
                        {item.day}
                      </p>
                      <h3 className="font-editorial text-lg font-semibold text-[#18372D]">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#262B27]/80 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(adventure.facilities ||
              adventure.accommodation_info ||
              adventure.travel_arrangements ||
              adventure.supervision_info ||
              adventure.safety_guidelines) && (
              <section className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-5">
                <h2 className="font-editorial text-2xl font-semibold text-[#18372D] flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#244B3C]" aria-hidden="true" />
                  Logistics & Safety Information
                </h2>
                {adventure.travel_arrangements && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#18372D]">Travel Arrangements</h3>
                    <p className="text-sm text-[#262B27]/80 mt-1 whitespace-pre-line">
                      {adventure.travel_arrangements}
                    </p>
                  </div>
                )}
                {adventure.accommodation_info && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#18372D]">
                      Accommodation & Tents
                    </h3>
                    <p className="text-sm text-[#262B27]/80 mt-1 whitespace-pre-line">
                      {adventure.accommodation_info}
                    </p>
                  </div>
                )}
                {adventure.facilities && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#18372D]">Facilities</h3>
                    <p className="text-sm text-[#262B27]/80 mt-1 whitespace-pre-line">
                      {adventure.facilities}
                    </p>
                  </div>
                )}
                {adventure.supervision_info && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#18372D]">
                      Supervision & Parent/Guardian Requirements
                    </h3>
                    <p className="text-sm text-[#262B27]/80 mt-1 whitespace-pre-line">
                      {adventure.supervision_info}
                    </p>
                  </div>
                )}
                {adventure.safety_guidelines && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#18372D]">Safety Guidelines</h3>
                    <p className="text-sm text-[#262B27]/80 mt-1 whitespace-pre-line">
                      {adventure.safety_guidelines}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right Column: Inclusions, Exclusions, Upcoming Dates */}
          <div className="lg:col-span-4 space-y-6">
            {adventure.inclusions && adventure.inclusions.length > 0 && (
              <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 space-y-3">
                <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
                  Inclusions
                </h2>
                <ul className="space-y-2">
                  {adventure.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#262B27]/85">
                      <CheckCircle2 className="h-4 w-4 text-[#244B3C] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {adventure.exclusions && adventure.exclusions.length > 0 && (
              <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 space-y-3">
                <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
                  Exclusions
                </h2>
                <ul className="space-y-2">
                  {adventure.exclusions.map((exc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#262B27]/85">
                      <XCircle className="h-4 w-4 text-[#8C735A] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 space-y-4">
              <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
                Upcoming Scheduled Dates
              </h2>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-[#262B27]/75">
                  No upcoming dates are published yet. Enquire via WhatsApp or the Contact page for the next departure.
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg bg-[#F6F4ED] border border-[#E9E9E2] p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-[#8C735A]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatEventDate(ev.start_date, ev.end_date)}
                        </span>
                        <span className="uppercase">{ev.status.replace("_", " ")}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#18372D]">{ev.title}</p>
                      <Link
                        href={`/events/${ev.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#244B3C] hover:underline"
                      >
                        View Event & Register <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
