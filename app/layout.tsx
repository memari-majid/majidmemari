import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { OG_IMAGE } from "@/lib/seo";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Majid Memari: AI Scientist & Solution Architect",
    template: "%s | Majid Memari",
  },
  description: SITE.description,
  authors: [{ name: SITE.fullName, url: SITE_URL }],
  creator: SITE.fullName,
  publisher: SITE.fullName,
  keywords: [
    "Majid Memari",
    "Majid MJ Memari",
    "Dr. Majid Memari",
    "Utah Valley University",
    "AI Scientist",
    "Solution Architect",
    "applied AI",
    "Gen AI",
    "PhD in Gen AI",
    "AI Utah 100",
    "AI Entrepreneurship",
    "Build and Launch AI-Powered Businesses",
    "wind-turbine UAV",
    "GridEye",
    "DataGovAI",
    "NVIDIA Ambassador",
    "Nexus AI Solutions",
    "AI consulting United States",
    "AI team training United States",
    "onsite AI workshops",
    "online AI training",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Majid Memari: AI Scientist & Solution Architect",
    description: SITE.description,
    url: SITE_URL,
    siteName: "Majid Memari",
    type: "profile",
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Majid Memari: AI Scientist & Solution Architect",
    description: SITE.description,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-w-0 overflow-x-hidden antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
