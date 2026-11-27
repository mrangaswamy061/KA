import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import {
  getPublishedEventBySlug,
  getWebsiteSettings,
} from "@/lib/services/public-data";
import { formatEventDate } from "@/lib/utils/format";
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
  if (!result || result.event.category !== "volunteer") {
    return { title: "Volunteer Event Not Found" };
  }

  return {
    title: result.event.title,
    description: result.event.short_description,
    alternates: { canonical: `/volunteers/${slug}` },
  };
}

export default async function VolunteerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [result, settings] = await Promise.all([
    getPublishedEventBySlug(slug),
    getWebsiteSettings(),
  ]);

  if (!result || result.event.category !== "volunteer") notFound();

  const { event } = result;
  const dateLabel = formatEventDate(event.start_date, event.end_date);
  const isOpen = event.status === "published";

  return (
    <div className="pt-24 pb-20 bg-[#F6F4ED]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-10">
        <Link
          href="/volunteers"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#244B3C] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Volunteers Program
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-[#E9E9E2]">
              <Image
                src={event.cover_image_url || "/images/volunteer-cleanup.jpg"}
                alt={event.cover_image_alt || event.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            </div>

            <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-4">
              <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#18372D]">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-[#8C735A]">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  {dateLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {event.location}
                </span>
              </div>
              <p className="text-base text-[#262B27]/85 whitespace-pre-line leading-relaxed">
                {event.description || event.short_description}
              </p>
            </div>
          </div>

          <div id="register" className="lg:col-span-5 space-y-6">
            <EventRegistrationForm
              eventId={event.id}
              eventTitle={event.title}
              eventDate={dateLabel}
              isVolunteer
              isOpenForRegistration={isOpen}
              statusLabel={event.status.replace(/_/g, " ")}
              whatsappNumber={settings.whatsapp_number}
            />
            {isOpen && (
              <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6">
                <WhatsAppButton
                  whatsappNumber={settings.whatsapp_number}
                  eventName={event.title}
                  eventDate={dateLabel}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
