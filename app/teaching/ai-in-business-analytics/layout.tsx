import Link from "next/link";
import type { ReactNode } from "react";
import { NavBar } from "@/app/components/NavBar";
import { analyticsRepositoryUrl } from "@/lib/business-analytics";

export default function AnalyticsReferenceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen min-w-0 text-slate-900">
      <NavBar />
      {children}
      <footer className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 py-6 text-sm text-slate-600">
          <Link href="/" className="font-medium hover:text-teal-800">Majid Memari</Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/teaching" className="hover:text-teal-800">Teaching</Link>
            <a href={analyticsRepositoryUrl} className="hover:text-teal-800">Source repository</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
