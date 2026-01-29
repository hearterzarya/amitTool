import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";
import { brand } from "@/lib/brand";
import { getContactInfo } from "@/lib/app-settings";

import { SessionProvider } from "@/components/providers/session-provider";
import { ContactInfoProvider } from "@/components/providers/contact-info-provider";
import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { AnalyticsScripts } from "@/components/layout/analytics-scripts";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${brand.name} - ${brand.tagline}`,
  description: brand.description,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const contactInfo = await getContactInfo();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${dmSans.variable} font-body`} suppressHydrationWarning>
        <AnalyticsScripts />
        <ContactInfoProvider initialContactInfo={contactInfo}>
          <SessionProvider>
            <ConditionalNavbar />
            {children}
          </SessionProvider>
        </ContactInfoProvider>
      </body>
    </html>
  );
}
