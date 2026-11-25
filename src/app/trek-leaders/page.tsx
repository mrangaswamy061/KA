import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getPublishedTrekLeaders } from "@/lib/services/public-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trek Leaders",
  description:
    "Meet the experienced trek leaders and outdoor guides behind Kaggadu Adventures.",
  alternates: { canonical: "/trek-leaders" },
};

export default async function TrekLeadersPage() {
  const leaders = await getPublishedTrekLeaders();

  return (
    <div className="pt-28 pb-20 bg-[#F6F4ED]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
            The People Behind the Journey
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#18372D]">
            Trek Leaders
          </h1>
          <p className="text-base text-[#262B27]/80 leading-relaxed">
            Our journeys are led by dedicated outdoor leaders committed to trail safety, local ecology, and memorable community experiences.
          </p>
        </div>

        {leaders.length === 0 ? (
          <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-10 text-center space-y-3">
            <Sparkles className="h-8 w-8 mx-auto text-[#8C735A]" aria-hidden="true" />
            <h2 className="font-editorial text-2xl font-semibold text-[#18372D]">
              Leader profiles coming soon
            </h2>
            <p className="text-sm text-[#262B27]/75 max-w-md mx-auto">
              Verified trek leader profiles will appear here once published by the Kaggadu Adventures team.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {leaders.map((leader) => (
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
                    <h2 className="font-editorial text-2xl font-semibold text-[#18372D]">
                      {leader.full_name}
                    </h2>
                    {leader.specialisation && (
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#8C735A]">
                        {leader.specialisation}
                      </p>
                    )}
                    {leader.experience && (
                      <p className="text-xs font-medium text-[#244B3C]">
                        Experience: {leader.experience}
                      </p>
                    )}
                    <p className="text-sm text-[#262B27]/80 line-clamp-3">
                      {leader.bio}
                    </p>
                  </div>
                  <Link
                    href={`/trek-leaders/${leader.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#244B3C] hover:underline"
                  >
                    View Profile <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
