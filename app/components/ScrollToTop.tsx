"use client";

import { useEffect, useState } from "react";
import { useInlineDemoInView } from "@/app/components/chat/chatStore";

export function ScrollToTop() {
  const [show, setShow] = useState(false);
  // Below `sm` this button sat on the inline demo's Send corner and its third
  // quick-prompt chip whenever the composer was near the bottom of the
  // viewport, so it hides while the demo card is on screen (`chatStore.ts`).
  const demoInView = useInlineDemoInView();

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed z-40 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-zinc-300 bg-white/90 text-sky-600 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-sky-600 hover:text-white dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-sky-400 dark:hover:bg-sky-600 dark:hover:text-white ${demoInView ? "max-sm:hidden" : ""} bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] sm:bottom-[calc(6rem+env(safe-area-inset-bottom))] sm:right-6`}
      aria-label="Scroll to top"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m5 15 7-7 7 7" />
      </svg>
    </button>
  );
}
