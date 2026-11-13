import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Study session — Building AI Solutions",
  description:
    "Gated study infrastructure. Research participation requires institutional review and independent enrollment.",
  referrer: "no-referrer",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};
export default function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main data-research-session className="min-h-dvh bg-white text-[#182a46]">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </div>
    </main>
  );
}
