"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { label: "Courses", href: "/teaching" },
  { label: "Workshops", href: "/#workshops" },
  { label: "Mentorship", href: "/#mentorship" },
  { label: "About", href: "/about" },
];

export function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [menuOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-[#faf8f3]/95 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Majid Memari home" className="inline-flex min-h-11 items-center gap-3 font-semibold tracking-tight text-slate-900">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold tracking-wider text-white">MM</span>
          <span className="text-lg">Majid Memari</span>
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center text-sm font-medium text-slate-600 transition hover:text-teal-800">
              {item.label}
            </Link>
          ))}
          <Link href="/#contact" className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-blue-900">Get in touch</Link>
        </div>
        <button
          ref={menuButton}
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 text-slate-800 md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M3.75 7h16.5m-16.5 5h16.5m-16.5 5h16.5"} />
          </svg>
        </button>
      </nav>
      {menuOpen ? (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="max-h-[70dvh] overflow-y-auto border-t border-slate-200 bg-[#faf8f3] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex min-h-12 items-center text-sm font-medium text-slate-700 hover:text-teal-800">
              {item.label}
            </Link>
          ))}
          <Link href="/#contact" onClick={() => setMenuOpen(false)} className="mt-2 flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white">Get in touch</Link>
        </nav>
      ) : null}
    </header>
  );
}
