import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Leaf, ArrowRight } from "lucide-react";
import { getPublishedEvents } from "@/lib/services/public-data";
import { formatEventDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Volunteers Program",
  description:
    "Join Kaggadu Adventures volunteer drives — plastic cleanup drives, trek trail cleanups, nature conservation, and environmental awareness initiatives.",
  alternates: { canonical: "/volunteers" },
};

export default async function VolunteersPage() {
  const volunteerEvents = await getPublishedEvents({ category: "volunteer" });
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = volunteerEvents.filter((e) => e.start_date >= today);
  const past = volunteerEvents.filter((e) => e.start_date < today);

  return (
    <div className="pt-28 pb-20 bg-[#F6F4ED]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
              Give Back to Nature
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#18372D]">
              Volunteers Program
            </h1>
            <p className="text-base text-[#262B27]/85 leading-relaxed max-w-2xl">
              Be part of something meaningful. Our volunteer community organizes plastic cleanup drives, trek trail conservation, native sapling plantations, and environmental awareness sessions across the Western Ghats.
            </p>
          </div>
          <div className="lg:col-span-5 relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E9E9E2]">
            <Image
              src="/images/volunteer-cleanup.jpg"
              alt="Volunteers planting saplings and cleaning forest trails"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* Upcoming Drives */}
        <section className="space-y-6">
          <h2 className="font-editorial text-3xl font-semibold text-[#18372D]">
            Upcoming Volunteer Initiatives
          </h2>

          {upcoming.length === 0 ? (
            <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-8 text-center space-y-3">
              <Leaf className="h-8 w-8 mx-auto text-[#244B3C]" aria-hidden="true" />
              <p className="font-editorial text-xl font-semibold text-[#18372D]">
                No upcoming volunteer drives scheduled right now
              </p>
              <p className="text-sm text-[#262B27]/75 max-w-lg mx-auto">
                New trail cleanup and conservation drives are posted here as soon as dates are confirmed. Reach out if your group wants to co-host a cleanup.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#244B3C] hover:underline"
              >
                Volunteer Enquiry <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {upcoming.map((ev) => (
                <article
                  key={ev.id}
                  className="flex flex-col overflow-hidden rounded-xl bg-[#FFFDF8] border border-[#E9E9E2]"
                >
                  <div className="relative aspect-[4/3] bg-[#E9E9E2]">
                    <Image
                      src={ev.cover_image_url || "/images/volunteer-cleanup.jpg"}
                      alt={ev.cover_image_alt || ev.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-[#8C735A] flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatEventDate(ev.start_date, ev.end_date)}
                      </p>
                      <h3 className="font-editorial text-xl font-semibold text-[#18372D]">
                        {ev.title}
                      </h3>
                      <p className="text-xs text-[#262B27]/75 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#8C735A]" aria-hidden="true" />
                        {ev.location}
                      </p>
                      <p className="text-sm text-[#262B27]/80 line-clamp-3">
                        {ev.short_description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/volunteers/${ev.slug}`}
                        className="rounded-md border border-[#244B3C] px-3.5 py-2 text-xs font-semibold text-[#244B3C] hover:bg-[#244B3C] hover:text-[#FFFDF8] transition-colors"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/volunteers/${ev.slug}#register`}
                        className="rounded-md bg-[#244B3C] px-3.5 py-2 text-xs font-semibold text-[#FFFDF8] hover:bg-[#18372D] transition-colors"
                      >
                        Register as Volunteer
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Past Highlights */}
        {past.length > 0 && (
          <section className="space-y-6">
            <h2 className="font-editorial text-3xl font-semibold text-[#18372D]">
              Past Event Highlights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {past.map((ev) => (
                <article
                  key={ev.id}
                  className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 space-y-2"
                >
                  <p className="text-xs text-[#8C735A]">
                    {formatEventDate(ev.start_date, ev.end_date)} • {ev.location}
                  </p>
                  <h3 className="font-editorial text-xl font-semibold text-[#18372D]">
                    {ev.title}
                  </h3>
                  <p className="text-sm text-[#262B27]/80">{ev.short_description}</p>
                  <Link
                    href={`/volunteers/${ev.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#244B3C] hover:underline pt-1"
                  >
                    Read Summary <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
