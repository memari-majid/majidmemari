/**
 * A short note from a visitor to the founder's inbox, composed in the chat
 * and approved on screen before it is sent.
 *
 * A fixed template like every other email the assistant can send: the
 * visitor's name, address, and message go into named fields and nothing else
 * changes. The message is scrubbed of links, addresses, and phone numbers,
 * because it reaches a real inbox from a verified sending domain and the text
 * came out of a model.
 *
 * Server-only.
 */

import { EMAIL_ORIGIN_NOTE, cleanSubject, escapeHtml, renderEmail, scrubForEmail } from "@/lib/email";

export type NoteEmailInput = {
  name: string;
  email: string;
  organization?: string;
  subject: string;
  message: string;
  model?: string;
};

export function noteEmail(input: NoteEmailInput): { subject: string; text: string; html: string } {
  const name = scrubForEmail(input.name).slice(0, 120) || "Visitor";
  const organization = input.organization ? scrubForEmail(input.organization).slice(0, 160) : "";
  const topic = scrubForEmail(input.subject).slice(0, 160) || "A note from the chat";
  const message = scrubForEmail(input.message).slice(0, 2_000);

  const subject = cleanSubject(`[majidmemari.com] ${topic}, from ${name}`);

  const text = [
    EMAIL_ORIGIN_NOTE,
    "",
    `Name: ${name}`,
    `Email: ${input.email}`,
    `Organization: ${organization || "not given"}`,
    `Subject: ${topic}`,
    "",
    "Their message, as they approved it on screen:",
    "",
    message,
    "",
    "Reply to this email to reach them directly.",
    input.model ? `Assistant model: ${input.model}` : "",
  ]
    .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
    .join("\n")
    .trim();

  const p = (s: string) => `<p style="margin:0 0 10px;">${escapeHtml(s)}</p>`;
  const bodyHtml = [
    `<p style="margin:0 0 14px;font-size:12px;color:#71717a;">${escapeHtml(EMAIL_ORIGIN_NOTE)}</p>`,
    p(`Name: ${name}`),
    p(`Email: ${input.email}`),
    p(`Organization: ${organization || "not given"}`),
    p(`Subject: ${topic}`),
    `<p style="margin:16px 0 6px;font-weight:600;">Their message</p>`,
    `<pre style="white-space:pre-wrap;font:inherit;margin:0 0 10px;padding:12px 14px;background:#f4f4f5;border-radius:8px;">${escapeHtml(message)}</pre>`,
    p("Reply to this email to reach them directly."),
    input.model ? `<p style="margin:0;font-size:12px;color:#71717a;">Assistant model: ${escapeHtml(input.model)}</p>` : "",
  ].join("");

  return { subject, text, html: renderEmail({ heading: `Note from ${name}`, bodyHtml }) };
}
