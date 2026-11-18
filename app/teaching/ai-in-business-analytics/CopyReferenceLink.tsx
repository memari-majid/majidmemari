"use client";

import { useState } from "react";

export function CopyReferenceLink({ path }: { path: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "unavailable">("idle");

  async function copyLink() {
    try {
      const url = new URL(path, window.location.origin);
      url.hash = window.location.hash;
      await navigator.clipboard.writeText(url.href);
      setStatus("copied");
    } catch {
      setStatus("unavailable");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={copyLink}
        className="min-h-10 rounded-md px-1 text-sm font-semibold text-teal-800 underline decoration-teal-800/35 underline-offset-4 hover:decoration-teal-800"
      >
        Copy link
      </button>
      <span role="status" className="text-sm text-slate-600">
        {status === "copied" && "Link copied"}
        {status === "unavailable" && "Copy the address from your browser."}
      </span>
    </div>
  );
}
