import Link from "next/link";
import { Mountain, Mail, Phone, ExternalLink, MessageCircle, Star } from "lucide-react";
import type { WebsiteSettings } from "@/types/database";
import { buildWhatsAppEnquiryUrl } from "@/lib/whatsapp/links";

export function SiteFooter({ settings }: { settings: WebsiteSettings }) {
  const whatsappUrl = buildWhatsAppEnquiryUrl({
    whatsappNumber: settings.whatsapp_number,
  });

  return (
    <footer className="bg-[#18372D] text-[#F6F4ED] border-t border-[#244B3C]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              {settings.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logo_url}
                  alt={settings.site_name}
                  className="h-11 w-11 rounded-full object-cover bg-white border border-[#A8B8A0]/40"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#244B3C] text-[#FFFDF8]">
                  <Mountain className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
              <div>
                <p className="font-editorial text-xl font-semibold text-[#FFFDF8]">
                  {settings.site_name}
                </p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#A8B8A0]">
                  {settings.tagline}
                </p>
              </div>
            </Link>
            <p className="text-sm text-[#F6F4ED]/80 leading-relaxed">
              {settings.footer_note}
            </p>
            <p className="text-xs text-[#A8B8A0]">{settings.office_location}</p>
          </div>

          {/* Adventure Categories */}
          <div>
            <h3 className="font-editorial text-base font-semibold text-[#FFFDF8] mb-4">
              Adventures
            </h3>
            <ul className="space-y-2.5 text-sm text-[#F6F4ED]/80">
              <li>
                <Link href="/treks" className="hover:text-[#FFFDF8] transition-colors">
                  Treks
                </Link>
              </li>
              <li>
                <Link href="/trips" className="hover:text-[#FFFDF8] transition-colors">
                  Trips
                </Link>
              </li>
              <li>
                <Link href="/camping" className="hover:text-[#FFFDF8] transition-colors">
                  Camping
                </Link>
              </li>
              <li>
                <Link href="/kids" className="hover:text-[#FFFDF8] transition-colors">
                  For Kids
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-[#FFFDF8] transition-colors">
                  Upcoming Events Calendar
                </Link>
              </li>
            </ul>
          </div>

          {/* Community & Quick Links */}
          <div>
            <h3 className="font-editorial text-base font-semibold text-[#FFFDF8] mb-4">
              Community
            </h3>
            <ul className="space-y-2.5 text-sm text-[#F6F4ED]/80">
              <li>
                <Link href="/volunteers" className="hover:text-[#FFFDF8] transition-colors">
                  Volunteers Program
                </Link>
              </li>
              <li>
                <Link href="/collaborations" className="hover:text-[#FFFDF8] transition-colors">
                  Collaborations
                </Link>
              </li>
              <li>
                <Link href="/trek-leaders" className="hover:text-[#FFFDF8] transition-colors">
                  Trek Leaders
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#FFFDF8] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-[#FFFDF8] transition-colors">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-editorial text-base font-semibold text-[#FFFDF8] mb-4">
              Connect With Us
            </h3>
            <ul className="space-y-3 text-sm text-[#F6F4ED]/85">
              {whatsappUrl && (
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-[#FFFDF8] transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 text-[#A8B8A0]" aria-hidden="true" />
                    <span>WhatsApp Enquiry</span>
                  </a>
                </li>
              )}
              {settings.contact_phone && (
                <li>
                  <a
                    href={`tel:${settings.contact_phone}`}
                    className="inline-flex items-center gap-2 hover:text-[#FFFDF8] transition-colors"
                  >
                    <Phone className="h-4 w-4 text-[#A8B8A0]" aria-hidden="true" />
                    <span>Primary: {settings.contact_phone}</span>
                  </a>
                </li>
              )}
              {settings.secondary_phone && (
                <li>
                  <a
                    href={`tel:${settings.secondary_phone}`}
                    className="inline-flex items-center gap-2 hover:text-[#FFFDF8] transition-colors"
                  >
                    <Phone className="h-4 w-4 text-[#A8B8A0]" aria-hidden="true" />
                    <span>Secondary: {settings.secondary_phone}</span>
                  </a>
                </li>
              )}
              {settings.contact_email && (
                <li>
                  <a
                    href={
                      settings.contact_email.includes("@")
                        ? `mailto:${settings.contact_email}`
                        : `https://${settings.contact_email.replace(/^https?:\/\//, "")}`
                    }
                    target={settings.contact_email.includes("@") ? undefined : "_blank"}
                    rel={settings.contact_email.includes("@") ? undefined : "noopener noreferrer"}
                    className="inline-flex items-center gap-2 hover:text-[#FFFDF8] transition-colors"
                  >
                    <Mail className="h-4 w-4 text-[#A8B8A0]" aria-hidden="true" />
                    <span>{settings.contact_email}</span>
                  </a>
                </li>
              )}
              {settings.instagram_url && (
                <li>
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-[#FFFDF8] transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-[#A8B8A0]" aria-hidden="true" />
                    <span>Instagram</span>
                  </a>
                </li>
              )}
              {settings.google_review_url && (
                <li>
                  <a
                    href={settings.google_review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:text-[#FFFDF8] transition-colors"
                  >
                    <Star className="h-4 w-4 text-[#A8B8A0]" aria-hidden="true" />
                    <span>Google Review</span>
                  </a>
                </li>
              )}
              {!whatsappUrl &&
                !settings.contact_phone &&
                !settings.contact_email &&
                !settings.instagram_url && (
                  <li className="text-xs text-[#A8B8A0]">
                    Configure contact details in Admin → Website Settings, or reach us via the{" "}
                    <Link href="/contact" className="underline text-[#FFFDF8]">
                      Contact page
                    </Link>
                    .
                  </li>
                )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#244B3C] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A8B8A0]">
          <p>
            © {new Date().getFullYear()} {settings.site_name}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-[#FFFDF8] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-[#FFFDF8] transition-colors">
              Terms & Conditions
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center rounded-md border border-[#A8B8A0]/50 bg-[#244B3C] px-3.5 py-1.5 text-xs font-semibold text-[#FFFDF8] hover:bg-[#FFFDF8] hover:text-[#18372D] transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
