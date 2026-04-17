import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Majid Memari — AI Engineer, Educator & NVIDIA Ambassador",
    template: "%s | Majid Memari",
  },
  description: SITE.description,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: SITE.name,
    description:
      "AI engineer, educator, and NVIDIA Ambassador. Building LLMs, agents, EdTech, and public-sector AI from Utah.",
    url: SITE_URL,
    siteName: SITE.name,
    type: "website",
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
    title: "Majid Memari — AI Engineer & Educator",
    description:
      "AI engineer, educator, and NVIDIA Ambassador. LLMs, agents, EdTech, and public-sector AI.",
    images: ["/majid-memari.png"],
  },
  robots: {
    index: true,
    follow: true,
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
