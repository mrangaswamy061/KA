import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  Heart,
  Leaf,
  MapPin,
  Calendar,
  Users,
  Sparkles,
} from "lucide-react";
import {
  getPublishedEvents,
  getPublishedTrekLeaders,
  getWebsiteSettings,
} from "@/lib/services/public-data";
import { EventCalendar } from "@/components/calendar/EventCalendar";
import { formatEventDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const ADVENTURE_CATEGORIES = [
  {
    key: "treks",
    title: "TREKS",
    description: "Explore mountain trails, peaks and hidden landscapes.",
    href: "/treks",
    image: "/images/category-treks.jpg",
    alt: "Misty mountain peak and winding ridge trail in the Western Ghats",
  },
  {
    key: "trips",
    title: "TRIPS",
    description:
      "Discover beautiful destinations, coastal escapes and unforgettable journeys.",
    href: "/trips",
    image: "/images/category-trips.jpg",
    alt: "Palm-fringed coastal cliff overlooking turquoise Arabian Sea waves",
  },
  {
    key: "camping",
    title: "CAMPING",
    description:
      "Experience peaceful nights, campfires and the beauty of the outdoors.",
    href: "/camping",
    image: "/images/category-camping.jpg",
    alt: "Canvas tents with warm lantern glow in a quiet forest clearing at dusk",
  },
  {
    key: "kids",
    title: "FOR KIDS",
    description:
      "Introduce children to nature through guided outdoor learning and adventure programs.",
    href: "/kids",
    image: "/images/category-kids.jpg",
    alt: "Children exploring a forest stream with a nature guide",
  },
];

const BRAND_VALUES = [
  {
    icon: Compass,
    title: "Explore",
    description: "Discover new destinations across the Western Ghats and beyond.",
  },
  {
    icon: Leaf,
    title: "Experience",
    description: "Connect deeply with forests, peaks, streams, and living trails.",
  },
  {
    icon: Users,
    title: "Community",
    description: "Meet like-minded explorers who value responsible outdoor travel.",
  },
  {
    icon: Heart,
    title: "Memories",
    description: "Make every journey meaningful with stories that stay with you.",
  },
];

export default async function HomePage() {
  const [settings, allEvents, volunteerEvents, trekLeaders] = await Promise.all([
    getWebsiteSettings(),
    getPublishedEvents(),
    getPublishedEvents({ category: "volunteer", limit: 3 }),
    getPublishedTrekLeaders(),
  ]);

  return (
    <div className="flex flex-col">
      {/* SECTION 01 — HERO */}
      <section className="relative min-h-[88vh] flex items-end pb-16 sm:pb-24 pt-28 overflow-hidden bg-[#18372D]">
        <Image
          src={settings.hero_image_url || "/images/hero-western-ghats.jpg"}
          alt="Western Ghats mountain ridges at sunrise"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#18372D]/90 via-[#18372D]/45 to-[#18372D]/30"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6 text-[#FFFDF8]">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#FFFDF8]/30 bg-[#18372D]/50 px-3.5 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[#F6F4ED]">
              <MapPin className="h-3.5 w-3.5 text-[#A8B8A0]" aria-hidden="true" />
              {settings.office_location}
            </p>
            <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
              {settings.hero_title}
            </h1>
            <p className="text-base sm:text-lg text-[#F6F4ED]/90 max-w-2xl leading-relaxed">
              {settings.hero_subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#adventure-categories"
                className="inline-flex items-center gap-2 rounded-md bg-[#FFFDF8] px-6 py-3.5 text-sm font-semibold text-[#18372D] hover:bg-[#F6F4ED] transition-colors"
              >
                EXPLORE ADVENTURES
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#upcoming-calendar"
                className="inline-flex items-center gap-2 rounded-md border border-[#FFFDF8]/60 bg-transparent px-6 py-3.5 text-sm font-semibold text-[#FFFDF8] hover:bg-[#FFFDF8]/10 transition-colors"
              >
                UPCOMING EVENTS
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 02 — INTRODUCTION */}
      <section className="py-20 sm:py-28 bg-[#F6F4ED]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5">
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-[#E9E9E2] bg-[#E9E9E2]">
                <Image
                  src={settings.intro_image_url || "/images/intro-trail.jpg"}
                  alt="Trekkers walking through a misty Western Ghats forest trail"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
                {settings.supporting_tagline}
              </p>
              <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#18372D] leading-tight">
                {settings.intro_heading}
              </h2>
              <p className="text-base sm:text-lg text-[#262B27]/85 leading-relaxed max-w-2xl">
                {settings.intro_body}
              </p>
              <div className="pt-2">
                <Link
                  href="/treks"
                  className="inline-flex items-center gap-2 rounded-md bg-[#244B3C] px-6 py-3 text-sm font-semibold text-[#FFFDF8] hover:bg-[#18372D] transition-colors"
                >
                  Explore Our Story
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03 — ADVENTURE CATEGORIES */}
      <section
        id="adventure-categories"
        className="py-20 sm:py-28 bg-[#FFFDF8] border-y border-[#E9E9E2]"
      >
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
              Curated Experiences
            </p>
            <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#18372D]">
              FIND YOUR NEXT ADVENTURE.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ADVENTURE_CATEGORIES.map((cat) => (
              <article
                key={cat.key}
                className="group flex flex-col overflow-hidden rounded-xl bg-[#F6F4ED] border border-[#E9E9E2] transition-colors hover:border-[#A8B8A0]"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E9E9E2]">
                  <Image
                    src={cat.image}
                    alt={cat.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-editorial text-xl font-semibold text-[#18372D]">
                      {cat.title}
                    </h3>
                    <p className="text-sm text-[#262B27]/80 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                  <Link
                    href={cat.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#244B3C] hover:text-[#18372D]"
                  >
                    Explore {cat.title}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 04 — UPCOMING EVENTS CALENDAR */}
      <section id="upcoming-calendar" className="py-20 sm:py-28 bg-[#F6F4ED]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
                Live Departure Schedule
              </p>
              <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#18372D]">
                MARK YOUR NEXT ADVENTURE.
              </h2>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#244B3C] hover:underline"
            >
              View all events <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <EventCalendar events={allEvents} />
        </div>
      </section>

      {/* SECTION 05 — VOLUNTEER EVENTS */}
      <section className="py-20 sm:py-28 bg-[#FFFDF8] border-y border-[#E9E9E2]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
                Conservation & Community
              </p>
              <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#18372D]">
                GIVE BACK TO NATURE.
              </h2>
              <p className="text-base text-[#262B27]/80 leading-relaxed">
                Be part of something meaningful. Join our community initiatives and help protect the natural environment.
              </p>
            </div>
            <Link
              href="/volunteers"
              className="inline-flex items-center gap-2 rounded-md border border-[#244B3C] px-5 py-2.5 text-sm font-semibold text-[#244B3C] hover:bg-[#244B3C] hover:text-[#FFFDF8] transition-colors shrink-0"
            >
              Volunteers Program
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {volunteerEvents.length === 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-xl bg-[#F6F4ED] border border-[#E9E9E2] p-6 sm:p-10">
              <div className="lg:col-span-5 relative aspect-[4/3] overflow-hidden rounded-lg">
                <Image
                  src="/images/volunteer-cleanup.jpg"
                  alt="Volunteers planting saplings and cleaning forest trails"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
              <div className="lg:col-span-7 space-y-4">
                <h3 className="font-editorial text-2xl font-semibold text-[#18372D]">
                  Upcoming Conservation Drives
                </h3>
                <p className="text-sm sm:text-base text-[#262B27]/80 leading-relaxed">
                  Our community leads plastic cleanup drives, trek trail cleanups, native sapling plantations, and environmental awareness programs. New volunteer dates are published here as soon as they are scheduled.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/volunteers"
                    className="inline-flex items-center gap-2 rounded-md bg-[#244B3C] px-5 py-2.5 text-sm font-semibold text-[#FFFDF8] hover:bg-[#18372D] transition-colors"
                  >
                    Explore Volunteer Initiatives
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-md border border-[#244B3C] px-5 py-2.5 text-sm font-semibold text-[#244B3C] hover:bg-[#244B3C] hover:text-[#FFFDF8] transition-colors"
                  >
                    Register Interest
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {volunteerEvents.map((ev) => (
                <article
                  key={ev.id}
                  className="flex flex-col overflow-hidden rounded-xl bg-[#F6F4ED] border border-[#E9E9E2]"
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
                      <div className="flex items-center gap-2 text-xs font-medium text-[#8C735A]">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{formatEventDate(ev.start_date, ev.end_date)}</span>
                      </div>
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
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link
                        href={`/volunteers/${ev.slug}`}
                        className="inline-flex items-center justify-center rounded-md border border-[#244B3C] px-3.5 py-2 text-xs font-semibold text-[#244B3C] hover:bg-[#244B3C] hover:text-[#FFFDF8] transition-colors"
                      >
                        View Details
                      </Link>
                      <Link
                        href={`/volunteers/${ev.slug}#register`}
                        className="inline-flex items-center justify-center rounded-md bg-[#244B3C] px-3.5 py-2 text-xs font-semibold text-[#FFFDF8] hover:bg-[#18372D] transition-colors"
                      >
                        Register as Volunteer
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 06 — TREK LEADERS (Hidden if no profiles published per PRD 1.10) */}
      {trekLeaders.length > 0 && (
        <section className="py-20 sm:py-28 bg-[#F6F4ED]">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
                  Experienced Guides
                </p>
                <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#18372D]">
                  THE PEOPLE BEHIND THE JOURNEY.
                </h2>
              </div>
              <Link
                href="/trek-leaders"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#244B3C] hover:underline"
              >
                All Trek Leaders <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {trekLeaders.slice(0, 6).map((leader) => (
                <article
                  key={leader.id}
                  className="flex flex-col overflow-hidden rounded-xl bg-[#FFFDF8] border border-[#E9E9E2]"
                >
                  <div className="relative aspect-[4/3] bg-[#E9E9E2]">
                    {leader.avatar_url ? (
                      <Image
                        src={leader.avatar_url}
                        alt={leader.avatar_alt || leader.full_name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#A8B8A0]/25 text-[#244B3C]">
                        <Sparkles className="h-8 w-8" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="font-editorial text-xl font-semibold text-[#18372D]">
                        {leader.full_name}
                      </h3>
                      {leader.specialisation && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#8C735A]">
                          {leader.specialisation}
                        </p>
                      )}
                      {leader.experience && (
                        <p className="text-xs text-[#244B3C] font-medium">
                          Experience: {leader.experience}
                        </p>
                      )}
                      <p className="text-sm text-[#262B27]/80 line-clamp-3">
                        {leader.bio}
                      </p>
                    </div>
                    <Link
                      href={`/trek-leaders/${leader.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[#244B3C] hover:underline pt-2"
                    >
                      View Profile <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 07 — BRAND EXPERIENCE */}
      <section className="py-20 sm:py-28 bg-[#FFFDF8] border-t border-[#E9E9E2]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
              Our Philosophy
            </p>
            <h2 className="font-editorial text-3xl sm:text-5xl font-semibold text-[#18372D]">
              MORE THAN JUST AN ADVENTURE.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BRAND_VALUES.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.title}
                  className="rounded-xl bg-[#F6F4ED] border border-[#E9E9E2] p-6 space-y-4"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#244B3C] text-[#FFFDF8]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-editorial text-xl font-semibold text-[#18372D]">
                    {val.title}
                  </h3>
                  <p className="text-sm text-[#262B27]/80 leading-relaxed">
                    {val.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 08 — CALL TO ACTION */}
      <section className="py-20 sm:py-28 bg-[#244B3C] text-[#FFFDF8]">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="font-editorial text-3xl sm:text-5xl font-semibold max-w-2xl mx-auto leading-tight">
            YOUR NEXT STORY STARTS HERE.
          </h2>
          <p className="text-base sm:text-lg text-[#F6F4ED]/85 max-w-xl mx-auto">
            The mountains are calling. Discover your next experience with Kaggadu Adventures.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-md bg-[#FFFDF8] px-6 py-3.5 text-sm font-semibold text-[#18372D] hover:bg-[#F6F4ED] transition-colors"
            >
              Explore Adventures
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md border border-[#FFFDF8]/60 px-6 py-3.5 text-sm font-semibold text-[#FFFDF8] hover:bg-[#FFFDF8]/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
