"use client";
import { useEffect, useState } from "react";

export function WebsiteInquiry() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  useEffect(() => { const controller = new AbortController(); fetch("/api/contact", { signal: controller.signal }).then(r => r.json()).then(data => setAvailable(data.available === true)).catch(() => setAvailable(false)); return () => controller.abort(); }, []);
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setSending(true); setStatus("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), email: data.get("reply"), message: data.get("message"), source: "website-chatbot", website: data.get("website") }) });
      const result = await response.json(); if(!response.ok || !result.ok) throw new Error(result.error || "The inquiry was not delivered. Please try again later.");
      setStatus("Your inquiry was sent to Majid. This does not confirm a meeting, booking, or enrollment."); form.reset();
    } catch(error) { setStatus(error instanceof Error ? error.message : "The inquiry was not delivered."); } finally { setSending(false); }
  }
  return <details className="rounded-xl border border-zinc-200 bg-white p-4 text-sm"><summary className="cursor-pointer font-semibold">Send an inquiry to Majid</summary><p className="mt-3 text-xs leading-relaxed text-zinc-600">AI chat messages are not sent to Majid. Use this form inside the chatbot when you want to send an inquiry.</p>{available === null ? <p className="mt-3 text-xs">Checking inquiry delivery…</p> : available ? <form onSubmit={send} className="mt-3 space-y-3"><label className="block text-xs">Your name<input name="name" required maxLength={120} autoComplete="name" className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-base" /></label><label className="block text-xs">Your reply address<input name="reply" type="email" required maxLength={254} autoComplete="email" className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-base" /></label><label className="block text-xs">Your inquiry<textarea name="message" required minLength={10} maxLength={4000} rows={4} className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-base" /></label><input name="website" aria-hidden="true" tabIndex={-1} autoComplete="off" className="hidden" /><p className="text-xs text-zinc-600">Sending shares these details with Majid through the website’s delivery service. Do not include confidential records.</p><button disabled={sending} type="submit" className="min-h-11 rounded-lg bg-slate-950 px-4 text-white disabled:opacity-50">{sending ? "Sending…" : "Send inquiry"}</button></form> : <p className="mt-3 text-xs text-amber-900">Inquiry delivery is temporarily unavailable. You can still ask the website assistant questions; those messages are not delivered to Majid.</p>}{status && <p role="status" className="mt-3 text-xs leading-relaxed">{status}</p>}</details>;
}
