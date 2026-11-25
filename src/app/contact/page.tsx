import type { Metadata } from "next";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import { getWebsiteSettings } from "@/lib/services/public-data";
import { ContactEnquiryForm } from "@/components/forms/EnquiryForms";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Kaggadu Adventures for trek enquiries, custom group departures, kids programs, or volunteer opportunities.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getWebsiteSettings();

  return (
    <div className="pt-28 pb-20 bg-[#F6F4ED]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8C735A]">
            Get in Touch
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[#18372D]">
            Contact Us
          </h1>
          <p className="text-base text-[#262B27]/80 leading-relaxed">
            Have a question about an upcoming trek, camping trip, kids’ program, or group departure? Reach out using the form or connect with us directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl bg-[#FFFDF8] border border-[#E9E9E2] p-6 sm:p-8 space-y-5">
              <h2 className="font-editorial text-2xl font-semibold text-[#18372D]">
                Direct Contact
              </h2>
              <ul className="space-y-4 text-sm text-[#262B27]/85">
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-[#8C735A] mt-0.5" aria-hidden="true" />
                  <span>{settings.office_location}</span>
                </li>
                {settings.contact_phone && (
                  <li className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#8C735A]" aria-hidden="true" />
                    <a href={`tel:${settings.contact_phone}`} className="hover:underline">
                      {settings.contact_phone}
                    </a>
                  </li>
                )}
                {settings.contact_email && (
                  <li className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-[#8C735A]" aria-hidden="true" />
                    <a href={`mailto:${settings.contact_email}`} className="hover:underline">
                      {settings.contact_email}
                    </a>
                  </li>
                )}
                {settings.instagram_url && (
                  <li className="flex items-center gap-3">
                    <ExternalLink className="h-4 w-4 text-[#8C735A]" aria-hidden="true" />
                    <a
                      href={settings.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Instagram
                    </a>
                  </li>
                )}
              </ul>

              <div className="pt-4 border-t border-[#E9E9E2]">
                <WhatsAppButton
                  whatsappNumber={settings.whatsapp_number}
                  label="CHAT ON WHATSAPP"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ContactEnquiryForm />
          </div>
        </div>
      </div>
    </div>
  );
}
