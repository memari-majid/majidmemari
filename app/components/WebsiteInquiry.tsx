"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";

export function WebsiteInquiry({ initialMessage = "" }: { initialMessage?: string }) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/contact", { signal: controller.signal })
      .then(response => response.json())
      .then(data => setAvailable(data.available === true))
      .catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => controller.abort();
  }, []);

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || !available) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setSending(true);
    setStatus("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.get("name"), email: data.get("reply"), message: data.get("message"), website: data.get("website") }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Your inquiry was not delivered. Please try again later.");
      setStatus("Your inquiry was sent to Majid.");
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Your inquiry was not delivered.");
    } finally {
      setSending(false);
    }
  }

  const fieldClass = "mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900";
  return (
    <form onSubmit={send} className="mt-6 space-y-5">
      <label className="block text-sm font-medium">Your name<input name="name" required maxLength={120} autoComplete="name" className={fieldClass} /></label>
      <label className="block text-sm font-medium">Reply email<input name="reply" type="email" required maxLength={254} autoComplete="email" className={fieldClass} /></label>
      <label className="block text-sm font-medium">Message<textarea name="message" required minLength={10} maxLength={4000} rows={4} defaultValue={initialMessage} className={fieldClass} /></label>
      <input name="website" aria-hidden="true" tabIndex={-1} autoComplete="off" className="hidden" />
      <p className="text-xs leading-relaxed text-slate-600">This form sends your details to Majid. Please leave out confidential records.</p>
      {available === false && <p role="status" className="text-sm text-slate-600">Inquiry delivery is temporarily unavailable. You can <a href={SITE.linkedin} className="text-teal-800 underline underline-offset-4">connect on LinkedIn</a>.</p>}
      <button disabled={sending || available !== true} type="submit" className="min-h-11 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-950 disabled:opacity-50">{sending ? "Sending…" : available === null ? "Checking delivery…" : "Send inquiry"}</button>
      {status && <p role="status" className="text-sm leading-relaxed">{status}</p>}
    </form>
  );
}
