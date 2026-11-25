import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedAdventureBySlug,
  getWebsiteSettings,
} from "@/lib/services/public-data";
import { AdventureDetailView } from "@/components/adventure-cards/AdventureDetailView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedAdventureBySlug("kids", slug);
  if (!result) return { title: "Program Not Found" };

  return {
    title: result.adventure.title,
    description: result.adventure.short_description,
    alternates: { canonical: `/kids/${slug}` },
  };
}

export default async function KidsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [result, settings] = await Promise.all([
    getPublishedAdventureBySlug("kids", slug),
    getWebsiteSettings(),
  ]);

  if (!result) notFound();

  return (
    <AdventureDetailView
      adventure={result.adventure}
      gallery={result.gallery}
      upcomingEvents={result.upcomingEvents}
      settings={settings}
    />
  );
}
