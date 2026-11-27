"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, ArrowRight } from "lucide-react";
import type { EventCategory, EventRecord } from "@/types/database";
import { formatEventDate, formatINR } from "@/lib/utils/format";

const CATEGORY_LABELS: Record<EventCategory, string> = {
  trek: "Trek",
  trip: "Trip",
  camping: "Camping",
  kids: "Kids Program",
  volunteer: "Volunteer",
  special: "Special Event",
};

const CATEGORY_BADGE_STYLES: Record<EventCategory, string> = {
  trek: "bg-[#244B3C] text-[#FFFDF8]",
  trip: "bg-[#8C735A] text-[#FFFDF8]",
  camping: "bg-[#18372D] text-[#FFFDF8]",
  kids: "bg-[#A8B8A0] text-[#18372D]",
  volunteer: "bg-[#244B3C]/15 text-[#244B3C] border border-[#244B3C]/30",
  special: "bg-[#262B27] text-[#FFFDF8]",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function EventCalendar({ events }: { events: EventRecord[] }) {
  const initialDate = useMemo(() => {
    if (events.length > 0) {
      const first = new Date(`${events[0].start_date}T00:00:00`);
      if (!Number.isNaN(first.getTime())) {
        return new Date(first.getFullYear(), first.getMonth(), 1);
      }
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [events]);

  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "all">("all");
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const filteredEvents = useMemo(() => {
    if (selectedCategory === "all") return events;
    return events.filter((e) => e.category === selectedCategory);
  }, [events, selectedCategory]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventRecord[]>();
    for (const ev of filteredEvents) {
      const start = new Date(`${ev.start_date}T00:00:00Z`);
      const end = ev.end_date ? new Date(`${ev.end_date}T00:00:00Z`) : start;
      if (Number.isNaN(start.getTime())) continue;
      const effectiveEnd =
        !Number.isNaN(end.getTime()) && end >= start ? end : start;
      const cursor = new Date(start.getTime());
      for (let dayOffset = 0; dayOffset < 60 && cursor <= effectiveEnd; dayOffset++) {
        const key = cursor.toISOString().slice(0, 10);
        const list = map.get(key) || [];
        list.push(ev);
        map.set(key, list);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }
    return map;
  }, [filteredEvents]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const sidebarEvents = useMemo(() => {
    if (selectedDateKey) {
      return eventsByDate.get(selectedDateKey) || [];
    }
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const monthPrefix = `${y}-${String(m + 1).padStart(2, "0")}`;
    return filteredEvents.filter((e) => {
      if (e.start_date.startsWith(monthPrefix)) return true;
      if (e.end_date && e.start_date <= `${monthPrefix}-31` && e.end_date >= `${monthPrefix}-01`) {
        return true;
      }
      return false;
    });
  }, [selectedDateKey, eventsByDate, currentMonth, filteredEvents]);

  return (
    <div className="space-y-8">
      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter calendar by category">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory("all");
            setSelectedDateKey(null);
          }}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            selectedCategory === "all"
              ? "bg-[#244B3C] text-[#FFFDF8]"
              : "bg-[#FFFDF8] text-[#262B27] border border-[#E9E9E2] hover:border-[#244B3C]"
          }`}
        >
          All Categories
        </button>
        {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              setSelectedDateKey(null);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              selectedCategory === cat
                ? "bg-[#244B3C] text-[#FFFDF8]"
                : "bg-[#FFFDF8] text-[#262B27] border border-[#E9E9E2] hover:border-[#244B3C]"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Monthly Grid */}
        <div className="lg:col-span-7 rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-editorial text-2xl font-semibold text-[#18372D]">
              {monthLabel}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentMonth(new Date(year, month - 1, 1));
                  setSelectedDateKey(null);
                }}
                aria-label="Previous month"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E9E9E2] text-[#262B27] hover:bg-[#F6F4ED]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentMonth(new Date(year, month + 1, 1));
                  setSelectedDateKey(null);
                }}
                aria-label="Next month"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E9E9E2] text-[#262B27] hover:bg-[#F6F4ED]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-[#8C735A] mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 sm:h-14" aria-hidden="true" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                dayNum
              ).padStart(2, "0")}`;
              const dayEvents = eventsByDate.get(dateKey) || [];
              const hasEvents = dayEvents.length > 0;
              const isSelected = selectedDateKey === dateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() =>
                    setSelectedDateKey(isSelected ? null : dateKey)
                  }
                  aria-label={`${dayNum} ${monthLabel}${
                    hasEvents ? `, ${dayEvents.length} event(s)` : ""
                  }`}
                  className={`relative flex flex-col items-center justify-center h-12 sm:h-14 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-[#244B3C] text-[#FFFDF8]"
                      : hasEvents
                      ? "bg-[#A8B8A0]/25 text-[#18372D] hover:bg-[#A8B8A0]/45 font-semibold"
                      : "text-[#262B27] hover:bg-[#F6F4ED]"
                  }`}
                >
                  <span>{dayNum}</span>
                  {hasEvents && (
                    <span
                      aria-hidden="true"
                      className={`mt-1 h-1.5 w-1.5 rounded-full ${
                        isSelected ? "bg-[#FFFDF8]" : "bg-[#244B3C]"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming / Selected Date Events Sidebar */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-editorial text-xl font-semibold text-[#18372D]">
              {selectedDateKey
                ? `Events on ${formatEventDate(selectedDateKey)}`
                : "Scheduled Adventures"}
            </h3>
            {selectedDateKey && (
              <button
                type="button"
                onClick={() => setSelectedDateKey(null)}
                className="text-xs font-semibold text-[#244B3C] underline"
              >
                Show all
              </button>
            )}
          </div>

          {sidebarEvents.length === 0 ? (
            <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-8 text-center space-y-3">
              <CalendarIcon className="h-8 w-8 mx-auto text-[#8C735A]" aria-hidden="true" />
              <p className="font-editorial text-lg font-medium text-[#18372D]">
                No events scheduled yet
              </p>
              <p className="text-sm text-[#262B27]/75">
                {selectedDateKey
                  ? "No published adventures fall on this date. Select another highlighted date or view all upcoming dates."
                  : "New Western Ghats treks, camps, and volunteer drives are published regularly. Check back soon or reach out for custom group departures."}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#244B3C] hover:underline"
              >
                Enquire for upcoming dates <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sidebarEvents.map((ev) => (
                <article
                  key={ev.id}
                  className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-5 transition-colors hover:border-[#A8B8A0]"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        CATEGORY_BADGE_STYLES[ev.category]
                      }`}
                    >
                      {CATEGORY_LABELS[ev.category]}
                    </span>
                    <span className="text-xs font-medium text-[#8C735A]">
                      {formatEventDate(ev.start_date, ev.end_date)}
                    </span>
                  </div>
                  <h4 className="font-editorial text-lg font-semibold text-[#18372D] mb-1">
                    {ev.title}
                  </h4>
                  <p className="text-sm text-[#262B27]/80 line-clamp-2 mb-3">
                    {ev.short_description}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E9E9E2]">
                    <div className="flex items-center gap-1.5 text-xs text-[#262B27]/75">
                      <MapPin className="h-3.5 w-3.5 text-[#8C735A]" aria-hidden="true" />
                      <span>{ev.location}</span>
                      {ev.price !== null && (
                        <span className="ml-2 font-semibold text-[#18372D]">
                          • {formatINR(ev.price)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={ev.category === "volunteer" ? `/volunteers/${ev.slug}` : `/events/${ev.slug}`}
                      className="inline-flex items-center gap-1 rounded-md bg-[#244B3C] px-3.5 py-1.5 text-xs font-semibold text-[#FFFDF8] hover:bg-[#18372D] transition-colors"
                    >
                      {ev.status === "published" ? "Register" : "View Details"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
