"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, Clock, ArrowRight, Mountain } from "lucide-react";
import type { Adventure, AdventureCategory } from "@/types/database";
import { formatINR } from "@/lib/utils/format";

const DEFAULT_FALLBACK_IMAGES: Record<AdventureCategory, string> = {
  trek: "/images/category-treks.jpg",
  trip: "/images/category-trips.jpg",
  camping: "/images/category-camping.jpg",
  kids: "/images/category-kids.jpg",
};

const ROUTE_PREFIX: Record<AdventureCategory, string> = {
  trek: "/treks",
  trip: "/trips",
  camping: "/camping",
  kids: "/kids",
};

export function AdventureDirectory({
  category,
  adventures,
  emptyTitle,
  emptyDescription,
}: {
  category: AdventureCategory;
  adventures: Adventure[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  const difficulties = useMemo(() => {
    const set = new Set<string>();
    for (const item of adventures) {
      if (item.difficulty) set.add(item.difficulty);
    }
    return Array.from(set);
  }, [adventures]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return adventures.filter((item) => {
      const matchesDifficulty =
        difficultyFilter === "all" || item.difficulty === difficultyFilter;
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.short_description.toLowerCase().includes(q);
      return matchesDifficulty && matchesQuery;
    });
  }, [adventures, search, difficultyFilter]);

  if (adventures.length === 0) {
    return (
      <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-10 text-center space-y-4">
        <Mountain className="h-10 w-10 mx-auto text-[#8C735A]" aria-hidden="true" />
        <h2 className="font-editorial text-2xl font-semibold text-[#18372D]">
          {emptyTitle}
        </h2>
        <p className="text-sm sm:text-base text-[#262B27]/75 max-w-xl mx-auto">
          {emptyDescription}
        </p>
        <div className="pt-2">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-md bg-[#244B3C] px-5 py-2.5 text-sm font-semibold text-[#FFFDF8] hover:bg-[#18372D] transition-colors"
          >
            Enquire With Us <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="h-4 w-4 text-[#8C735A] absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or location..."
            aria-label="Search adventures"
            className="w-full rounded-md border border-[#E9E9E2] bg-[#FFFDF8] pl-10 pr-4 py-2.5 text-sm text-[#262B27] placeholder:text-[#8C735A]/70 focus:border-[#244B3C] focus:outline-none"
          />
        </div>

        {difficulties.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by difficulty">
            <button
              type="button"
              onClick={() => setDifficultyFilter("all")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                difficultyFilter === "all"
                  ? "bg-[#244B3C] text-[#FFFDF8]"
                  : "bg-[#FFFDF8] text-[#262B27] border border-[#E9E9E2]"
              }`}
            >
              All Levels
            </button>
            {difficulties.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficultyFilter(diff)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  difficultyFilter === diff
                    ? "bg-[#244B3C] text-[#FFFDF8]"
                    : "bg-[#FFFDF8] text-[#262B27] border border-[#E9E9E2]"
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-8 text-center">
          <p className="text-sm text-[#262B27]/80">
            No matching experiences found. Try clearing your search or filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] transition-colors hover:border-[#A8B8A0]"
            >
              <div className="relative aspect-[4/3] bg-[#E9E9E2] overflow-hidden">
                <Image
                  src={item.cover_image_url || DEFAULT_FALLBACK_IMAGES[category]}
                  alt={item.cover_image_alt || item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.difficulty && (
                  <span className="absolute top-3 left-3 rounded-full bg-[#18372D]/85 px-3 py-1 text-[11px] font-semibold text-[#FFFDF8]">
                    {item.difficulty}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-xs text-[#8C735A]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {item.location}
                    </span>
                    {item.duration && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {item.duration}
                      </span>
                    )}
                  </div>
                  <h2 className="font-editorial text-xl font-semibold text-[#18372D]">
                    {item.title}
                  </h2>
                  <p className="text-sm text-[#262B27]/80 line-clamp-3">
                    {item.short_description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E9E9E2]">
                  <span className="text-sm font-semibold text-[#18372D]">
                    {formatINR(item.price)}
                  </span>
                  <Link
                    href={`${ROUTE_PREFIX[category]}/${item.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#244B3C] hover:underline"
                  >
                    Explore <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
