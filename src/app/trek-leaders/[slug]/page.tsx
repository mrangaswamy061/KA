import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getPublishedTrekLeaderBySlug } from "@/lib/services/public-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const leader = await getPublishedTrekLeaderBySlug(slug);
  if (!leader) return { title: "Leader Not Found" };

  return {
    title: leader.full_name,
    description: `${leader.full_name} — ${leader.specialisation}`,
    alternates: { canonical: `/trek-leaders/${slug}` },
  };
}

export default async function TrekLeaderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const leader = await getPublishedTrekLeaderBySlug(slug);
  if (!leader) notFound();

  return (
    <div className="pt-24 pb-20 bg-[#F6F4ED]">
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-8 space-y-8">
        <Link
          href="/trek-leaders"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#244B3C] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Trek Leaders
        </Link>

        <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 relative aspect-[4/5] overflow-hidden rounded-lg bg-[#E9E9E2]">
            {leader.avatar_url ? (
              <Image
                src={leader.avatar_url}
                alt={leader.avatar_alt || leader.full_name}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#244B3C]">
                <Sparkles className="h-10 w-10" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="md:col-span-7 space-y-4">
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#18372D]">
              {leader.full_name}
            </h1>
            {leader.specialisation && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
                {leader.specialisation}
              </p>
            )}
            {leader.experience && (
              <p className="text-sm font-semibold text-[#244B3C]">
                Experience: {leader.experience}
              </p>
            )}
            <p className="text-base text-[#262B27]/85 whitespace-pre-line leading-relaxed">
              {leader.bio}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
