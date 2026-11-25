import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Users,
} from "lucide-react";
import {
  getPublishedEventBySlug,
  getWebsiteSettings,
} from "@/lib/services/public-data";
import { formatEventDate, formatINR } from "@/lib/utils/format";
import { EventRegistrationForm } from "@/components/forms/EventRegistrationForm";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedEventBySlug(slug);
  if (!result) return { title: "Event Not Found" };

  return {
    title: result.event.title,
    description: result.event.short_description,
    alternates: { canonical: `/events/${slug}` },
    openGraph: {
      title: result.event.title,
      description: result.event.short_description,
      images: result.event.cover_image_url ? [result.event.cover_image_url] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [result, settings] = await Promise.all([
    getPublishedEventBySlug(slug),
    getWebsiteSettings(),
  ]);

  if (!result) notFound();

  const { event, gallery } = result;
  const dateLabel = formatEventDate(event.start_date, event.end_date);
  const isOpen = event.status === "published";
  const statusLabel = event.status.replace(/_/g, " ");

  const mapsHref =
    event.map_url ||
    (event.latitude !== null && event.longitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
      : null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.start_date,
    endDate: event.end_date || event.start_date,
    eventStatus:
      event.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: event.location,
    },
    description: event.short_description,
    organizer: {
      "@type": "Organization",
      name: settings.site_name,
    },
  };

  return (
    <div className="pt-24 pb-20 bg-[#F6F4ED]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-10">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#244B3C] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Events Calendar
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Event Info */}
          <div className="lg:col-span-7 space-y-8">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#E9E9E2] bg-[#E9E9E2]">
              <Image
                src={event.cover_image_url || "/images/category-treks.jpg"}
                alt={event.cover_image_alt || event.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            </div>

            <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#244B3C] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#FFFDF8]">
                  {event.category}
                </span>
                <span className="rounded-full bg-[#F6F4ED] border border-[#E9E9E2] px-3 py-1 text-xs font-semibold uppercase text-[#8C735A]">
                  {statusLabel}
                </span>
              </div>

              <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#18372D]">
                {event.title}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-[#E9E9E2] text-sm">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-[#8C735A] mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="text-xs text-[#8C735A] block">Dates</span>
                    <span className="font-semibold text-[#18372D]">{dateLabel}</span>
                  </div>
                </div>
                {(event.start_time || event.end_time) && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-[#8C735A] mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="text-xs text-[#8C735A] block">Timing</span>
                      <span className="font-semibold text-[#18372D]">
                        {event.start_time || ""}
                        {event.end_time ? ` – ${event.end_time}` : ""}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[#8C735A] mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="text-xs text-[#8C735A] block">Location</span>
                    <span className="font-semibold text-[#18372D]">{event.location}</span>
                    {mapsHref && (
                      <a
                        href={mapsHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#244B3C] hover:underline"
                      >
                        Directions on Google Maps
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
                {event.max_participants && (
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-[#8C735A] mt-0.5" aria-hidden="true" />
                    <div>
                      <span className="text-xs text-[#8C735A] block">Capacity</span>
                      <span className="font-semibold text-[#18372D]">
                        Max {event.max_participants} participants
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-[#8C735A] font-semibold">
                  Fee / Contribution
                </p>
                <p className="font-editorial text-2xl font-semibold text-[#18372D]">
                  {formatINR(event.price)}
                </p>
              </div>

              <div className="prose prose-sm max-w-none text-[#262B27]/85 whitespace-pre-line leading-relaxed">
                {event.description || event.short_description}
              </div>

              {event.registration_instructions && (
                <div className="rounded-lg bg-[#F6F4ED] border border-[#E9E9E2] p-4 space-y-1">
                  <h2 className="text-sm font-semibold text-[#18372D]">
                    Registration Instructions
                  </h2>
                  <p className="text-sm text-[#262B27]/80 whitespace-pre-line">
                    {event.registration_instructions}
                  </p>
                </div>
              )}
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
                      alt={img.alt_text || event.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Dual Registration */}
          <div id="register" className="lg:col-span-5 space-y-6">
            <EventRegistrationForm
              eventId={event.id}
              eventTitle={event.title}
              eventDate={dateLabel}
              isVolunteer={event.category === "volunteer"}
              isOpenForRegistration={isOpen}
              statusLabel={statusLabel}
              whatsappNumber={settings.whatsapp_number}
            />

            <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 space-y-3">
              <h2 className="font-editorial text-lg font-semibold text-[#18372D]">
                Prefer WhatsApp?
              </h2>
              <WhatsAppButton
                whatsappNumber={settings.whatsapp_number}
                eventName={event.title}
                eventDate={dateLabel}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
