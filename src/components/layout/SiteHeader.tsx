"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Mountain } from "lucide-react";
import type { WebsiteSettings } from "@/types/database";

const NAV_ITEMS = [
  { label: "Treks", href: "/treks" },
  { label: "Trips", href: "/trips" },
  { label: "Camping", href: "/camping" },
  { label: "For Kids", href: "/kids" },
  { label: "Collaborations", href: "/collaborations" },
  { label: "Volunteers Program", href: "/volunteers" },
];

export function SiteHeader({ settings }: { settings: WebsiteSettings }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide public header on admin dashboard routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const transparentOverHero = isHome && !scrolled && !mobileOpen;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        transparentOverHero
          ? "bg-transparent text-[#FFFDF8]"
          : "bg-[#F6F4ED]/95 backdrop-blur-sm text-[#262B27] border-b border-[#E9E9E2]"
      }`}
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label={`${settings.site_name} Home`}
          >
            {settings.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logo_url}
                alt={settings.site_name}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                  transparentOverHero
                    ? "border-[#FFFDF8]/40 bg-[#244B3C]/60 text-[#FFFDF8]"
                    : "border-[#244B3C]/20 bg-[#244B3C] text-[#FFFDF8]"
                }`}
              >
                <Mountain className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
            <div className="flex flex-col leading-tight">
              <span className="font-editorial text-lg font-semibold tracking-tight">
                {settings.site_name}
              </span>
              <span
                className={`text-[10px] uppercase tracking-[0.2em] ${
                  transparentOverHero ? "text-[#FFFDF8]/80" : "text-[#8C735A]"
                }`}
              >
                {settings.tagline}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav
            aria-label="Main navigation"
            className="hidden lg:flex items-center gap-6"
          >
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors relative py-1 ${
                    transparentOverHero
                      ? active
                        ? "text-[#FFFDF8]"
                        : "text-[#FFFDF8]/85 hover:text-[#FFFDF8]"
                      : active
                      ? "text-[#244B3C]"
                      : "text-[#262B27]/80 hover:text-[#244B3C]"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                        transparentOverHero ? "bg-[#FFFDF8]" : "bg-[#244B3C]"
                      }`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right CTAs */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <Link
              href="/contact"
              className={`text-sm font-medium transition-colors ${
                transparentOverHero
                  ? "text-[#FFFDF8]/90 hover:text-[#FFFDF8]"
                  : "text-[#262B27] hover:text-[#244B3C]"
              }`}
            >
              Contact Us
            </Link>
            <Link
              href="/events"
              className={`inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition-colors ${
                transparentOverHero
                  ? "bg-[#FFFDF8] text-[#18372D] hover:bg-[#F6F4ED]"
                  : "bg-[#244B3C] text-[#FFFDF8] hover:bg-[#18372D]"
              }`}
            >
              Book an Adventure
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 focus-visible:outline-2"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          id="mobile-nav-drawer"
          className="lg:hidden bg-[#F6F4ED] text-[#262B27] border-t border-[#E9E9E2] px-4 py-6 space-y-4"
        >
          <nav aria-label="Mobile navigation" className="flex flex-col space-y-2">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-base font-medium transition-colors ${
                    active
                      ? "bg-[#244B3C] text-[#FFFDF8]"
                      : "text-[#262B27] hover:bg-[#E9E9E2]/60"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/events"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2.5 text-base font-medium text-[#262B27] hover:bg-[#E9E9E2]/60"
            >
              Upcoming Events
            </Link>
            <Link
              href="/trek-leaders"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2.5 text-base font-medium text-[#262B27] hover:bg-[#E9E9E2]/60"
            >
              Trek Leaders
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2.5 text-base font-medium text-[#262B27] hover:bg-[#E9E9E2]/60"
            >
              Contact Us
            </Link>
          </nav>
          <div className="pt-2 border-t border-[#E9E9E2]">
            <Link
              href="/events"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center rounded-md bg-[#244B3C] px-4 py-3 text-sm font-semibold text-[#FFFDF8] hover:bg-[#18372D]"
            >
              Book an Adventure
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
