/**
 * Single email delivery path for the site: the contact form and the chat
 * hand-off both go through `sendEmail`, so one place owns the Resend client,
 * the not-configured fallback, and the honesty contract.
 *
 * `delivered` means Resend accepted the message. With `RESEND_FROM_EMAIL`
 * unset the From would be `onboarding@resend.dev`, which Resend delivers only
 * to the account owner, so `isEmailConfigured()` requires both variables and
 * every caller must treat `delivered: false` as "not sent", never as sent.
 *
 * Server-only (imports the Resend SDK). Env is read per call, not at import.
 */

import { Resend } from "resend";
import { ASSISTANT_NAME } from "@/lib/chat-persona";
import { SITE } from "@/lib/site";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** First line of every email that originates from a chat conversation. */
export const EMAIL_ORIGIN_NOTE = `Sent by the ${ASSISTANT_NAME}, the AI agent on majidmemari.com, after the visitor approved this send on screen. The fields below were typed or confirmed by the visitor; anything the agent drafted is labelled as drafted.`;

export type SendEmailArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  cc?: string[];
};

export type SendEmailResult =
  | { ok: true; delivered: true; id?: string }
  | { ok: true; delivered: false; reason: "not-configured" }
  | { ok: false; delivered: false; error: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

/** The only inbox that receives site mail. `info@` style aliases have no inbound MX here. */
export function founderInbox(): string {
  return process.env.CONTACT_TO_EMAIL?.trim() || SITE.email;
}

/** Header injection guard: subjects are one line. */
export function cleanSubject(subject: string): string {
  return subject.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, 200);
}

/**
 * Best-effort send that never throws. Not configured: logs a preview and
 * reports `delivered: false`. Configured: reports what Resend said.
 */
export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const subject = cleanSubject(args.subject);

  if (!key || !from) {
    console.info("[email] not configured (RESEND_API_KEY and RESEND_FROM_EMAIL are both required); logged only:", {
      to: args.to,
      cc: args.cc,
      replyTo: args.replyTo,
      subject,
      preview: args.text.slice(0, 300),
    });
    return { ok: true, delivered: false, reason: "not-configured" };
  }

  try {
    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from,
      to: [args.to],
      subject,
      text: args.text,
      ...(args.html ? { html: args.html } : {}),
      ...(args.replyTo ? { replyTo: args.replyTo } : {}),
      ...(args.cc && args.cc.length > 0 ? { cc: args.cc } : {}),
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, delivered: false, error: "Email send failed." };
    }
    return { ok: true, delivered: true, ...(data?.id ? { id: data.id } : {}) };
  } catch (err) {
    console.error("[email] Resend threw:", err);
    return { ok: false, delivered: false, error: "Email send failed." };
  }
}

/** Escapes `& < >` only. Never place visitor text inside a quoted attribute. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi;
/**
 * Spelled-out dots: "bit (dot) ly", "example[dot]com", "example dot com".
 * The bracketed forms are unambiguous; the bare "dot" form needs a TLD-shaped
 * last label so prose like "the dot on the chart" survives.
 */
const OBFUSCATED_DOMAIN_RE =
  /\b[a-z0-9-]{2,}(?:\s*(?:\(dot\)|\[dot\]|\{dot\})\s*[a-z0-9-]{2,})+(?:\/\S*)?|\b[a-z0-9-]{2,}(?:\s+dot\s+[a-z0-9-]{2,})*\s+dot\s+(?:com|net|org|io|ai|co|ly|to|me|us|uk|de|info|biz|xyz|link|site|click|online|app|dev|gg|tv|cc|in|ru|cn|eu|ca|au|edu|gov)\b(?:\/\S*)?/gi;
/**
 * Any bare domain with a TLD-shaped last label, no closed list: short links
 * (bit.ly), new TLDs (.link, .site, .click), and country codes all match.
 * The text around a brief has no legitimate need for a domain.
 */
const DOMAIN_RE = /\b(?:[a-z0-9-]+\.)+[a-z]{2,63}\b(?:\/[^\s<>"')]*)?/gi;
/** File and framework names that look like domains but are not links (Next.js, app.py, notes.md). */
const NOT_A_LINK_RE = /^(?:[a-z0-9-]+\.)+(?:js|jsx|ts|tsx|py|md|txt|csv|json|ya?ml|css|html?|sh|env)$/i;
const EMAIL_IN_TEXT_RE = /[^\s@<>()[\]]+@[^\s@<>()[\]]+\.[^\s@<>()[\]]+/g;
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;

/**
 * Strips links, addresses, and phone numbers from text that came from the
 * model or the visitor before it is placed in an email, so a prompt-injected
 * brief cannot carry a phishing payload from a verified sending domain.
 */
export function scrubForEmail(text: string): string {
  return text
    .replace(URL_RE, "[link removed]")
    .replace(EMAIL_IN_TEXT_RE, "[address removed]")
    .replace(OBFUSCATED_DOMAIN_RE, "[link removed]")
    .replace(DOMAIN_RE, (match) => (NOT_A_LINK_RE.test(match) ? match : "[link removed]"))
    .replace(PHONE_RE, "[number removed]")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Minimal, email-client-safe wrapper: light background, inline styles, one
 * accent. `bodyHtml` is trusted HTML built by our own code; escape anything
 * interpolated into it with `escapeHtml`.
 */
export function renderEmail({ heading, bodyHtml }: { heading: string; bodyHtml: string }): string {
  return `<!doctype html>
<html><body style="margin:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:20px 28px;border-bottom:1px solid #e4e4e7;">
          <span style="font-size:16px;font-weight:700;">${escapeHtml(SITE.name)}</span>
          <span style="font-size:12px;color:#71717a;"> · majidmemari.com</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 14px;font-size:19px;font-weight:600;">${escapeHtml(heading)}</h1>
          <div style="font-size:15px;line-height:1.6;color:#3f3f46;">${bodyHtml}</div>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #e4e4e7;font-size:12px;line-height:1.6;color:#71717a;">
          ${escapeHtml(SITE.name)} · ${escapeHtml(SITE.addressLocality)}, ${escapeHtml(SITE.addressRegion)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
