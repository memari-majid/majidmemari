/**
 * The consulting brief, emailed to the visitor's own address with the founder
 * copied. A fixed template: the only variables are the visitor's first name
 * and the schema-validated brief, both scrubbed of links, addresses, and
 * phone numbers so a prompt-injected brief cannot carry a payload out from a
 * verified sending domain.
 *
 * Server-only.
 */

import { ASSISTANT_NAME, FOUNDER_CHAT_NAME } from "@/lib/chat-persona";
import { briefToText, ENGAGEMENT_LABEL, type ConsultingBrief } from "@/lib/consulting-brief";
import { cleanSubject, escapeHtml, renderEmail, scrubForEmail } from "@/lib/email";
import { SITE } from "@/lib/site";

export const BRIEF_EMAIL_SUBJECT = "Your AI consulting brief";

export function briefEmail(input: { name: string; brief: ConsultingBrief }): {
  subject: string;
  text: string;
  html: string;
} {
  const name = scrubForEmail(input.name).slice(0, 80) || "there";
  const briefText = scrubForEmail(briefToText(input.brief));
  const intro = `Hi ${name}, here is the brief the ${ASSISTANT_NAME} drafted with you on ${SITE.name}'s site. It is a starting point, not a proposal: correct anything that is wrong and it gets more useful.`;
  const outro = `${FOUNDER_CHAT_NAME} is copied on this email. Reply to it if you want him to pick the conversation up.`;

  const text = [
    intro,
    "",
    briefText,
    "",
    `Suggested first engagement: ${ENGAGEMENT_LABEL[input.brief.engagement]}.`,
    "",
    outro,
  ].join("\n");

  const bodyHtml = [
    `<p style="margin:0 0 14px;">${escapeHtml(intro)}</p>`,
    `<pre style="white-space:pre-wrap;font:inherit;margin:0 0 14px;padding:12px 14px;background:#f4f4f5;border-radius:8px;">${escapeHtml(briefText)}</pre>`,
    `<p style="margin:0 0 10px;">Suggested first engagement: ${escapeHtml(ENGAGEMENT_LABEL[input.brief.engagement])}.</p>`,
    `<p style="margin:0;">${escapeHtml(outro)}</p>`,
  ].join("");

  return {
    subject: cleanSubject(BRIEF_EMAIL_SUBJECT),
    text,
    html: renderEmail({ heading: BRIEF_EMAIL_SUBJECT, bodyHtml }),
  };
}
