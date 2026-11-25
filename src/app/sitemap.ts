import type { MetadataRoute } from "next";
import {
  getPublishedAdventures,
  getPublishedEvents,
  getPublishedTrekLeaders,
} from "@/lib/services/public-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticRoutes = [
    "",
    "/treks",
    "/trips",
    "/camping",
    "/kids",
    "/collaborations",
    "/volunteers",
    "/events",
    "/trek-leaders",
    "/contact",
    "/privacy-policy",
    "/terms-and-conditions",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const [adventures, events, leaders] = await Promise.all([
    getPublishedAdventures(),
    getPublishedEvents(),
    getPublishedTrekLeaders(),
  ]);

  const categoryRouteMap = {
    trek: "/treks",
    trip: "/trips",
    camping: "/camping",
    kids: "/kids",
  };

  const adventureRoutes = adventures.map((adv) => ({
    url: `${baseUrl}${categoryRouteMap[adv.category]}/${adv.slug}`,
    lastModified: new Date(adv.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  const eventRoutes = events.map((ev) => ({
    url: `${baseUrl}${ev.category === "volunteer" ? "/volunteers" : "/events"}/${ev.slug}`,
    lastModified: new Date(ev.updated_at),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const leaderRoutes = leaders.map((l) => ({
    url: `${baseUrl}/trek-leaders/${l.slug}`,
    lastModified: new Date(l.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...adventureRoutes, ...eventRoutes, ...leaderRoutes];
}
