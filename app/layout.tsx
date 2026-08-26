import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/app/components/ThemeProvider";
import { SITE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Majid Memari — Assistant Professor of Computer Science, UVU & NVIDIA Ambassador",
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
    "Assistant Professor Computer Science",
    "NVIDIA Ambassador",
    "Gary R. Herbert Institute",
    "Nexus AI Solutions",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Majid Memari — Assistant Professor of Computer Science at UVU",
    description:
      "Assistant Professor of Computer Science at Utah Valley University. AI consultant and trainer. NVIDIA University Ambassador.",
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
    title: "Majid Memari — Assistant Professor & NVIDIA Ambassador",
    description:
      "Academia, industry, and community work in applied AI. Assistant Professor at UVU. AI consulting and team training. NVIDIA DLI instructor.",
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
