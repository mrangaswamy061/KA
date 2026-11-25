import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getWebsiteSettings } from "@/lib/services/public-data";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { FloatingWhatsAppCta } from "@/components/ui/FloatingWhatsAppCta";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getWebsiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.seo_default_title,
      template: `%s | ${settings.site_name}`,
    },
    description: settings.seo_default_description,
    verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
      : undefined,
    openGraph: {
      type: "website",
      siteName: settings.site_name,
      title: settings.seo_default_title,
      description: settings.seo_default_description,
      images: settings.hero_image_url ? [settings.hero_image_url] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getWebsiteSettings();
  const gaId = settings.google_analytics_id;

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F6F4ED] text-[#262B27]">
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}
            </Script>
          </>
        )}
        <SiteHeader settings={settings} />
        <main className="flex-1">{children}</main>
        <ConditionalFooter settings={settings} />
        <FloatingWhatsAppCta whatsappNumber={settings.whatsapp_number} />
      </body>
    </html>
  );
}
