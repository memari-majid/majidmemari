/**
 * The structured hand-off Dr. MJ sends to Majid's inbox. A fixed template:
 * the only variables are the scrubbed visitor fields and the schema-validated,
 * scrubbed brief. The visitor's address is validated with `EMAIL_RE` by the
 * tool and used as reply-to; it is never a recipient.
 *
 * Server-only.
 */

import { briefToText, ENGAGEMENT_LABEL, type ConsultingBrief } from "@/lib/consulting-brief";
import { EMAIL_ORIGIN_NOTE, cleanSubject, escapeHtml, renderEmail, scrubForEmail } from "@/lib/email";
import type { ReadinessSnapshot } from "@/lib/readiness";

export type HandOffEmailInput = {
  name: string;
  email: string;
  organization?: string;
  topic: string;
  brief?: ConsultingBrief;
  readiness?: ReadinessSnapshot;
  model?: string;
};

export function handOffEmail(input: HandOffEmailInput): { subject: string; text: string; html: string } {
  const name = scrubForEmail(input.name).slice(0, 120) || "Visitor";
  const organization = input.organization ? scrubForEmail(input.organization).slice(0, 160) : "";
  const topic = scrubForEmail(input.topic).slice(0, 600);
  const briefText = input.brief ? scrubForEmail(briefToText(input.brief)) : "";
  const readiness = input.readiness;

  const subject = cleanSubject(
    `[majidmemari.com] Chat hand-off from ${name}${organization ? ` (${organization})` : ""}`,
  );

  const readinessLines = readiness
    ? [
        `Readiness snapshot: ${readiness.overall}/5, ${readiness.label}.`,
        ...readiness.dimensions.map((d) => `- ${d.label}: ${d.score}/5. ${scrubForEmail(d.note)}`),
        `Suggested next step: ${readiness.nextStep}`,
      ]
    : [];

  const text = [
    EMAIL_ORIGIN_NOTE,
    "",
    `Name: ${name}`,
    `Email: ${input.email}`,
    `Organization: ${organization || "not given"}`,
    `Wants help with: ${topic}`,
    "",
    input.brief
      ? `Consulting brief drafted in chat (${ENGAGEMENT_LABEL[input.brief.engagement]}):\n\n${briefText}`
      : "No consulting brief was drafted before the hand-off.",
    ...(readinessLines.length ? ["", ...readinessLines] : []),
    "",
    "Reply to this email to reach the visitor directly.",
    input.model ? `Assistant model: ${input.model}` : "",
  ]
    .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
    .join("\n")
    .trim();

  const p = (s: string) => `<p style="margin:0 0 10px;">${escapeHtml(s)}</p>`;
  const pre = (s: string) =>
    `<pre style="white-space:pre-wrap;font:inherit;margin:0 0 10px;padding:12px 14px;background:#f4f4f5;border-radius:8px;">${escapeHtml(s)}</pre>`;

  const bodyHtml = [
    `<p style="margin:0 0 14px;font-size:12px;color:#71717a;">${escapeHtml(EMAIL_ORIGIN_NOTE)}</p>`,
    p(`Name: ${name}`),
    p(`Email: ${input.email}`),
    p(`Organization: ${organization || "not given"}`),
    p(`Wants help with: ${topic}`),
    input.brief
      ? `<p style="margin:16px 0 6px;font-weight:600;">Consulting brief drafted in chat (${escapeHtml(ENGAGEMENT_LABEL[input.brief.engagement])})</p>${pre(briefText)}`
      : p("No consulting brief was drafted before the hand-off."),
    readinessLines.length ? pre(readinessLines.join("\n")) : "",
    p("Reply to this email to reach the visitor directly."),
    input.model ? `<p style="margin:0;font-size:12px;color:#71717a;">Assistant model: ${escapeHtml(input.model)}</p>` : "",
  ].join("");

  return { subject, text, html: renderEmail({ heading: `Chat hand-off from ${name}`, bodyHtml }) };
}
