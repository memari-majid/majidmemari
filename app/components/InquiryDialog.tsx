"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { WebsiteInquiry } from "./WebsiteInquiry";

const TOPICS = {
  general: { title: "Contact Majid", message: "" },
  mentorship: { title: "Ask about mentorship", message: "I'd like to discuss mentorship for an AI idea or project." },
  workshop: { title: "Discuss a workshop", message: "I'd like to discuss an AI workshop for my team or learners." },
  research: { title: "Discuss research", message: "I'd like to discuss an AI project or research collaboration." },
} as const;

export function InquiryDialog() {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const value = search.get("inquiry");
  const topic = value && Object.hasOwn(TOPICS, value) ? value as keyof typeof TOPICS : null;

  useEffect(() => {
    const element = dialog.current;
    if (!topic || !element) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [topic]);

  function close() {
    const params = new URLSearchParams(search.toString());
    params.delete("inquiry");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}${window.location.hash}`, { scroll: false });
  }

  return (
    <dialog ref={dialog} onCancel={event => { event.preventDefault(); close(); }} aria-labelledby="inquiry-title" className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-[#f7f6f2] p-6 text-slate-900 backdrop:bg-slate-950/40 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <h2 id="inquiry-title" className="pt-1 text-2xl font-semibold">{topic ? TOPICS[topic].title : "Contact Majid"}</h2>
        <button type="button" onClick={close} className="-mr-2 -mt-2 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200" aria-label="Close inquiry">×</button>
      </div>
      {topic && <WebsiteInquiry key={topic} initialMessage={TOPICS[topic].message} />}
    </dialog>
  );
}
