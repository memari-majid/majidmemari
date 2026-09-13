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
    "Majid Memari, PhD",
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

/**
 * `interactiveWidget` is deliberately left at the browser default
 * (`resizes-visual`). `resizes-content` would shrink the layout viewport when
 * the on-screen keyboard opens, and every `dvh` length on the site resolves
 * against it: `INLINE_DEMO_BODY_HEIGHT` in `app/components/chat/chat-ui.ts`
 * and the `sm:h-[min(640px,calc(100dvh-2rem))]` panel in `ChatWidget.tsx`.
 * Focusing the contact form would then re-lay-out the whole page behind the
 * keyboard, which is a worse trade than the pan the default does. The chat
 * sheet already clears the keyboard by other means: it is a flex column with
 * one scroller, so the composer is pinned inside whatever height it is given.
 */
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
