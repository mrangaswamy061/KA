"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Mountain, ChevronDown } from "lucide-react";
import type { WebsiteSettings } from "@/types/database";

const TREK_SUB_ITEMS = [
  { label: "All Treks", href: "/treks" },
  { label: "Trips", href: "/trips" },
  { label: "Camping", href: "/camping" },
  { label: "For Kids", href: "/kids" },
];

const NAV_ITEMS = [
  { label: "Trek Leaders", href: "/trek-leaders" },
  { label: "Collaborations", href: "/collaborations" },
  { label: "Volunteers Program", href: "/volunteers" },
];

export function SiteHeader({ settings }: { settings: WebsiteSettings }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpenPath, setMobileOpenPath] = useState<string | null>(null);
  const [treksOpenPath, setTreksOpenPath] = useState<string | null>(null);
  const [mobileTreksOpenPath, setMobileTreksOpenPath] = useState<string | null>(null);
  const treksMenuRef = useRef<HTMLDivElement>(null);
  const hoverOpenedAtRef = useRef<number>(0);

  const mobileOpen = mobileOpenPath === pathname;
  const treksOpen = treksOpenPath === pathname;
  const mobileTreksOpen = mobileTreksOpenPath === pathname;

  const setMobileTreksOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    setMobileTreksOpenPath((prevPath) => {
      const prev = prevPath === pathname;
      const resolved = typeof next === "function" ? next(prev) : next;
      return resolved ? pathname : null;
    });
  };

  const setMobileOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    setMobileOpenPath((prevPath) => {
      const prev = prevPath === pathname;
      const resolved = typeof next === "function" ? next(prev) : next;
      return resolved ? pathname : null;
    });
  };

  const setTreksOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    setTreksOpenPath((prevPath) => {
      const prev = prevPath === pathname;
      const resolved = typeof next === "function" ? next(prev) : next;
      return resolved ? pathname : null;
    });
  };

  const handleTreksMouseEnter = () => {
    if (!treksOpen) {
      hoverOpenedAtRef.current = Date.now();
      setTreksOpen(true);
    }
  };

  const handleTreksMouseLeave = () => {
    hoverOpenedAtRef.current = 0;
    setTreksOpen(false);
  };

  const handleTreksToggleClick = () => {
    // If hover opened the menu right before this click (e.g. moving pointer onto the chevron),
    // keep it open instead of immediately toggling it shut.
    if (treksOpen && Date.now() - hoverOpenedAtRef.current < 350) {
      hoverOpenedAtRef.current = 0;
      return;
    }
    hoverOpenedAtRef.current = 0;
    setTreksOpen((prev) => !prev);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (
        treksMenuRef.current &&
        !treksMenuRef.current.contains(event.target as Node)
      ) {
        setTreksOpenPath(null);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setTreksOpenPath(null);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Hide public header on admin dashboard routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const transparentOverHero = isHome && !scrolled && !mobileOpen;
  const isTreksSectionActive = TREK_SUB_ITEMS.some(
    (sub) => pathname === sub.href || pathname?.startsWith(`${sub.href}/`)
  );

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors relative py-1 ${
      transparentOverHero
        ? active
          ? "text-[#FFFDF8]"
          : "text-[#FFFDF8]/85 hover:text-[#FFFDF8]"
        : active
        ? "text-[#244B3C]"
        : "text-[#262B27]/80 hover:text-[#244B3C]"
    }`;

  const activeUnderline = (
    <span
      aria-hidden="true"
      className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
        transparentOverHero ? "bg-[#FFFDF8]" : "bg-[#244B3C]"
      }`}
    />
  );

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
                className="h-11 w-11 rounded-full object-cover bg-white border border-[#E9E9E2]/60 shadow-sm"
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
            <Link href="/" className={navLinkClass(pathname === "/")}>
              Home
              {pathname === "/" && activeUnderline}
            </Link>

            {/* Treks Dropdown containing Trips, Camping, For Kids */}
            <div
              ref={treksMenuRef}
              className="relative"
              onMouseEnter={handleTreksMouseEnter}
              onMouseLeave={handleTreksMouseLeave}
            >
              <div className="flex items-center gap-1">
                <Link
                  href="/treks"
                  onClick={() => setTreksOpen(false)}
                  className={navLinkClass(isTreksSectionActive)}
                >
                  Treks
                  {isTreksSectionActive && activeUnderline}
                </Link>
                <button
                  type="button"
                  onClick={handleTreksToggleClick}
                  aria-expanded={treksOpen}
                  aria-haspopup="true"
                  aria-label="Toggle Treks sub-menu"
                  className={`p-1 rounded transition-colors ${
                    transparentOverHero
                      ? "text-[#FFFDF8]/85 hover:text-[#FFFDF8]"
                      : "text-[#262B27]/80 hover:text-[#244B3C]"
                  }`}
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      treksOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {treksOpen && (
                <div className="absolute left-0 top-full pt-2 w-48 z-50">
                  <div className="rounded-lg border border-[#E9E9E2] bg-[#FFFDF8] py-1.5 shadow-lg text-[#262B27]">
                    {TREK_SUB_ITEMS.map((sub) => {
                      const subActive =
                        pathname === sub.href ||
                        pathname?.startsWith(`${sub.href}/`);
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setTreksOpen(false)}
                          className={`block px-4 py-2 text-sm font-medium transition-colors ${
                            subActive
                              ? "bg-[#244B3C] text-[#FFFDF8]"
                              : "hover:bg-[#F6F4ED] hover:text-[#244B3C]"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClass(active)}
                >
                  {item.label}
                  {active && activeUnderline}
                </Link>
              );
            })}
          </nav>

          {/* Right CTAs */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <Link
              href="/contact"
              className={navLinkClass(pathname === "/contact")}
            >
              Contact Us
              {pathname === "/contact" && activeUnderline}
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
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={`rounded-md px-3 py-2.5 text-base font-medium transition-colors ${
                pathname === "/"
                  ? "bg-[#244B3C] text-[#FFFDF8]"
                  : "text-[#262B27] hover:bg-[#E9E9E2]/60"
              }`}
            >
              Home
            </Link>

            <div className="space-y-1">
              <div className="flex items-center justify-between rounded-md hover:bg-[#E9E9E2]/60">
                <Link
                  href="/treks"
                  onClick={() => setMobileOpen(false)}
                  className={`flex-1 rounded-md px-3 py-2.5 text-base font-medium transition-colors ${
                    isTreksSectionActive
                      ? "text-[#244B3C] font-semibold"
                      : "text-[#262B27]"
                  }`}
                >
                  Treks
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileTreksOpen((prev) => !prev)}
                  aria-expanded={mobileTreksOpen}
                  aria-label="Toggle Treks sub-menu"
                  className="px-3 py-2.5 text-[#262B27]"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      mobileTreksOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>
              {mobileTreksOpen && (
                <div className="pl-4 space-y-1 border-l border-[#E9E9E2] ml-3">
                  {TREK_SUB_ITEMS.map((sub) => {
                    const subActive =
                      pathname === sub.href ||
                      pathname?.startsWith(`${sub.href}/`);
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          subActive
                            ? "bg-[#244B3C] text-[#FFFDF8]"
                            : "text-[#262B27]/85 hover:bg-[#E9E9E2]/60"
                        }`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

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
