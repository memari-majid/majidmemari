/**
 * The contact form's server side: validate, classify, deliver.
 *
 * The classification is a model call started by an anonymous visitor, so it
 * passes through the same two gates every other model call on this site does:
 * the per-minute rate limiter and `reserveBudget`, which owns the only global
 * hard cap there is. An unmetered model call behind a public form is a hole in
 * that cap, however cheap the model is.
 *
 * Both halves of that accounting use one set of rates for the classifier
 * (`CONTACT_CLASSIFY_RATES`, in the environment or in `lib/chat-limits.ts`),
 * and the pessimistic rates are kept for a slug nothing prices. Pricing the
 * two halves differently, which is what this route used to do, left most of
 * every reservation standing and made a public form the cheapest way to close
 * the chat for the whole site. Every exit path settles: a classification that
 * fails settles at the floor for the tokens it sent, because a visitor who
 * controls the prompt can choose to make the call fail, and a success whose
 * usage comes back zero or unparsable settles at that same floor.
 *
 * Delivery never depends on the model. When the visitor is over the per-minute
 * rate, when the budget is spent, when the limiter store is unreachable, or
 * when the provider fails, the form falls back to the fixed acknowledgment and
 * the message still reaches the inbox: the point of the form is the email, and
 * the classification is a convenience on top of it.
 */

import { NextResponse } from "next/server";
import {
  CONTACT_CLASSIFY_MESSAGE_CHARS,
  CONTACT_CLASSIFY_NAME_CHARS,
  UNPRICED_MODEL_RATES,
  contactClassifyCostUsd,
  contactClassifyFloorUsd,
  contactClassifyPrechargeUsd,
  contactClassifyRates,
  contactClassifyResolvedRates,
  parseClassifyRates,
} from "@/lib/chat-limits";
import { findModel, round6 } from "@/lib/chat-models";
import { EMAIL_RE, founderInbox, isEmailConfigured, sendEmail } from "@/lib/email";
import {
  classifyInquiry,
  fallbackInquiryResponse,
  inquiryPromptChars,
  type InquiryCategory,
} from "@/lib/inquiry-ai";
import { getRateLimiter, ipHash } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Smaller / cheaper model for classification (override with CONTACT_CLASSIFY_MODEL).
 *  Routed through Vercel AI Gateway; use a `provider/model` slug. */
const CLASSIFY_MODEL = process.env.CONTACT_CLASSIFY_MODEL ?? "openai/gpt-oss-20b";

/**
 * What that model costs, in USD per 1M tokens, `"input,output"`.
 *
 * The default classifier is not on the chat allowlist, so nothing published
 * prices it. Without a figure here the settle would correct the real token
 * counts at `UNPRICED_MODEL_RATES`, which are Opus rates and roughly two
 * orders of magnitude too high for this model, and every anonymous form post
 * would leave most of its reservation standing against the daily caps.
 *
 * The reservation, the failure floor and the settle all read this, so one
 * post cannot be reserved at one price and settled at another. Env first so a
 * price change is an env edit, then the table in `lib/chat-limits.ts`, then
 * nothing, which prices the call pessimistically and warns.
 *
 * An explicit price here wins over the allowlist price even when the slug is a
 * picker model, because that is what setting the variable means. Resolving the
 * allowlist first, which is what `contactClassifyCostUsd` used to do, made
 * this override silently unreachable for exactly the slugs an operator is most
 * likely to be repricing.
 */
const CLASSIFY_RATES =
  parseClassifyRates(process.env.CONTACT_CLASSIFY_RATES) ?? contactClassifyRates(CLASSIFY_MODEL);

if (!findModel(CLASSIFY_MODEL) && !CLASSIFY_RATES) {
  console.warn(
    `[contact] No rates known for CONTACT_CLASSIFY_MODEL="${CLASSIFY_MODEL}". Classifications will be reserved and settled at $${UNPRICED_MODEL_RATES.inputPerM}/$${UNPRICED_MODEL_RATES.outputPerM} per 1M, which over-states a small model badly. Set CONTACT_CLASSIFY_RATES="input,output" or add the slug to CONTACT_CLASSIFY_RATES in lib/chat-limits.ts.`,
  );
}

/**
 * How the one metered classification for this submission ended.
 *
 * Five values, not four: `classified` is a success the gateway measured,
 * `unmeasured` is a success it did not, and the two are charged the same but
 * are worth telling apart in the logs, because a run of `unmeasured` lines is a
 * provider that stopped reporting usage rather than a cheap day.
 */
type ClassifyOutcome = "classified" | "unmeasured" | "failed" | "refused" | "rate-limited";

/** Same derivation as the chat and eval routes, so one visitor buckets the same everywhere. */
function clientIp(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for") ?? req.headers.get("x-real-ip");
  if (vercel) return vercel.split(",")[0]?.trim() || "unknown";
  const xff = req.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  // Only the parse is guarded here. Everything after it reports its own
  // failure honestly rather than being flattened into "invalid request body".
  let body: Record<string, unknown>;
  try {
    const raw: unknown = await request.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("not an object");
    body = raw as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const source = typeof body.source === "string" ? body.source : "contact-form";

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const ip = clientIp(request);
  const limiter = getRateLimiter();

  const fallback = fallbackInquiryResponse();
  let category: InquiryCategory = fallback.category;
  let autoReply = fallback.autoReply;

  // Only the classifier's view of the message is bounded. The email below
  // carries the visitor's full text.
  const forModel = {
    name: name.slice(0, CONTACT_CLASSIFY_NAME_CHARS),
    message: message.slice(0, CONTACT_CLASSIFY_MESSAGE_CHARS),
  };
  const classifyModel = findModel(CLASSIFY_MODEL);
  const classifyRates = contactClassifyResolvedRates({
    model: classifyModel,
    rates: CLASSIFY_RATES,
  });
  const promptChars = inquiryPromptChars(forModel);
  const estimateUsd = contactClassifyPrechargeUsd({
    model: classifyModel,
    rates: CLASSIFY_RATES,
    promptChars,
  });

  let billedUsd = 0;
  let outcome: ClassifyOutcome = "rate-limited";
  let refusedBy: "ip-budget" | "hard-budget" | undefined;

  // Why a rate-limited or budget-refused visitor still gets delivery, where the
  // chat route answers 429 and stops: the email is the product here and it
  // costs no model money, so refusing it would drop a real inquiry to protect a
  // convenience. The cap belongs on the model call, and that is exactly where
  // it is: a refused submission skips the classifier, spends nothing, is logged
  // with its outcome, and reaches the inbox with the fixed acknowledgment. The
  // visitor is never told to try again, because a retry would send a second
  // copy of a message that already arrived.
  const rate = await limiter.checkRate(ip);
  if (!rate.limited) {
    const reservation = await limiter.reserveBudget(ip, estimateUsd);
    if (!reservation.ok) {
      outcome = "refused";
      refusedBy = reservation.reason;
    } else {
      try {
        const classified = await classifyInquiry({ ...forModel, modelId: CLASSIFY_MODEL });
        category = classified.category;
        autoReply = classified.autoReply;
        const measured = contactClassifyCostUsd({
          model: classifyModel,
          rates: CLASSIFY_RATES,
          inputTokens: classified.inputTokens,
          outputTokens: classified.outputTokens,
        });
        // A call that reports no usage is not a free call. `tokenBreakdown`
        // reads an absent or unparsable usage block as all zeros, and
        // `settle` reads a zero as "spend nothing" and hands the whole
        // reservation back, so a provider that answers without one would make
        // every classification free and take the form back out of the cap it
        // was just put inside. An unmeasured call is charged the same floor a
        // failed one is. Same rule the chat route states as "a step with no
        // reported usage is charged at the precharge estimate, never free".
        const measuredOk = Number.isFinite(measured) && measured > 0;
        billedUsd = measuredOk
          ? measured
          : contactClassifyFloorUsd({
              model: classifyModel,
              rates: CLASSIFY_RATES,
              promptChars,
            });
        outcome = measuredOk ? "classified" : "unmeasured";
        await reservation.settle(billedUsd);
      } catch (err) {
        console.error("[contact] classifyInquiry:", err);
        outcome = "failed";
        // The prompt may already have reached the gateway, so a failure is
        // charged, not refunded: every input token it sent plus the whole
        // output cap, at the same rates a success settles at. Settling at zero
        // here would make a message the visitor can shape into a failure the
        // cheapest call on the site; leaving the reservation untouched would
        // make it the most expensive one.
        billedUsd = contactClassifyFloorUsd({
          model: classifyModel,
          rates: CLASSIFY_RATES,
          promptChars,
        });
        await reservation.settle(billedUsd);
      }
    }
  }

  console.log(
    JSON.stringify({
      event: "contact.usage",
      site: "majidmemari",
      outcome,
      ip: ipHash(ip),
      model: CLASSIFY_MODEL,
      estimateUsd,
      // The rates this post was priced at, from the same resolver the
      // reservation and the settle used, so a line in the logs can be
      // rechecked against the gateway bill instead of being taken on faith.
      ratesPerM: [classifyRates.inputPerM, classifyRates.outputPerM],
      costUsd: round6(billedUsd),
      category,
      limiter: limiter.backend,
      ...(refusedBy ? { refusedBy } : {}),
    }),
  );

  // One delivery path for the whole site (`lib/email.ts`). Not configured:
  // the message is logged server-side and `dev: true` tells the form so.
  const sent = await sendEmail({
    to: founderInbox(),
    replyTo: email,
    subject: `[majidmemari.com] [${category}] Message from ${name}`,
    text: `From: ${name} <${email}>\nSource: ${source}\nAI category: ${category}\n\n${message}`,
  });
  if (!sent.ok) {
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    dev: !isEmailConfigured(),
    delivered: sent.delivered,
    category,
    autoReply,
  });
}
