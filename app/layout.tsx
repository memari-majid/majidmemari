import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Majid Memari — AI Teaching, Workshops & Mentorship",
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
    "Building AI Solutions",
    "AI education",
    "AI workshops",
    "AI mentorship",
    "AI for business",
    "NVIDIA DLI",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Majid Memari — AI Teaching, Workshops & Mentorship",
    description: SITE.description,
    url: SITE_URL,
    siteName: "Majid Memari",
    type: "profile",
    locale: "en_US",
    images: [
      {
        url: "/majid-memari.png",
        width: 1200,
        height: 1200,
        alt: SITE.fullName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Majid Memari — AI Teaching, Workshops & Mentorship",
    description: SITE.description,
    images: ["/majid-memari.png"],
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
