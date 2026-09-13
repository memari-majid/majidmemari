/**
 * Every owner-tunable number that bounds what the chat may cost or accept.
 * Budgets are in USD so cached input (a tenth of the price) and cheaper
 * picker models count for what they actually cost, not a flat token figure.
 *
 * Client-safe: constants and pure functions only.
 */

import {
  CACHE_READ_MULTIPLIER,
  CHAT_MODELS,
  findModel,
  type ChatModel,
} from "@/lib/chat-models";

/** Per-IP requests per rolling minute. */
export const RATE_LIMIT_PER_MINUTE = 20;

/**
 * Per-IP spend per UTC day. Raised from the 60k-token equivalent ($0.30 at
 * Opus input price) to $1.00 because cached reads count at a tenth and a
 * whole company behind one NAT shares the allowance.
 */
export const IP_DAILY_BUDGET_USD = 1.0;

/** Site-wide spend per UTC day beyond which replies route to the fallback model. */
export const GLOBAL_SOFT_BUDGET_USD = 3.0;

/** Site-wide spend per UTC day beyond which the chat politely closes for the day. */
export const GLOBAL_HARD_BUDGET_USD = 10.0;

/**
 * Raw request text, before JSON parsing. Echoed tool inputs and outputs are
 * the bulk of it: a project estimate input is about 3.5k characters and an
 * outreach draft about 1.5k, and the transcript carries every one of them on
 * every turn. The tool budget below is the real bound; this is the outer wall.
 */
export const MAX_BODY_CHARS = 96_000;

/**
 * Serialized tool inputs plus outputs kept in one request. Only visible text
 * is measured against `MAX_CHARS_TOTAL`, so without this the ten tools would
 * be bounded by the raw body cap alone. Over the cap the route trims the
 * oldest tool outputs first, so the conversation keeps working and the newest
 * cards stay intact.
 */
export const MAX_TOOL_CHARS_TOTAL = 24_000;

/** Visible text characters across the whole transcript. */
export const MAX_CHARS_TOTAL = 12_000;
export const MAX_CHARS_PER_TEXT_PART = 4_000;
export const MAX_MESSAGES = 40;
export const MAX_PARTS_PER_MESSAGE = 50;

/** The SDK aborts first so `onAbort` runs and accounting completes before the function is killed. */
export const STREAM_TIMEOUT_MS = 150_000;

/**
 * Upper bound on one Upstash REST round trip. A slow or hung store throws
 * after this and the limiter degrades to its in-memory fallback for that
 * call; without it undici waits up to 300 s, past the function's maxDuration,
 * and chat availability would depend on Upstash latency.
 */
export const LIMITER_TIMEOUT_MS = 1_500;

/** Function duration for the chat route (Fluid compute). */
export const MAX_DURATION_SECONDS = 180;

/** Output tokens assumed when reserving budget before the model runs. */
export const PRECHARGE_OUTPUT_TOKENS = 1_200;

/** Hand-off and other outbound emails started from chat, per IP per UTC day. */
export const EMAIL_PER_IP_PER_DAY = 3;
/** Outbound emails started from chat, site-wide per UTC day. */
export const EMAIL_SITE_PER_DAY = 40;

/** Rough chars-per-token used only for the precharge estimate. */
export const CHARS_PER_TOKEN = 4;

/**
 * What one request will probably cost, reserved before the model runs and
 * settled against actual usage afterwards. The system prompt is assumed to
 * be a cache read on models that support caching; conversation text is
 * charged at the full input price.
 */
export function prechargeEstimateUsd(args: {
  model: ChatModel;
  systemChars: number;
  conversationChars: number;
  outputTokens?: number;
}): number {
  const { model } = args;
  const systemTokens = Math.ceil(args.systemChars / CHARS_PER_TOKEN);
  const conversationTokens = Math.ceil(args.conversationChars / CHARS_PER_TOKEN);
  const systemRate = model.promptCache ? CACHE_READ_MULTIPLIER : 1;
  const inputUsd =
    (systemTokens * systemRate + conversationTokens) * (model.inputPerM / 1_000_000);
  const outputUsd = (args.outputTokens ?? PRECHARGE_OUTPUT_TOKENS) * (model.outputPerM / 1_000_000);
  return Math.round((inputUsd + outputUsd) * 1_000_000) / 1_000_000;
}

/* ------------------------------------------------------------------------ */
/* Contact form classification                                               */
/* ------------------------------------------------------------------------ */

/**
 * The contact form asks a model to sort one message into a category and write
 * the acknowledgment the visitor reads. It is small, but it is a model call
 * started by an anonymous visitor, so it goes through the same per-minute
 * limiter and the same daily budget as the chat: the global hard cap only
 * means something if every model call on the site passes through it.
 */

/** Output tokens reserved for one classification; also the cap passed to the call. */
export const CONTACT_CLASSIFY_OUTPUT_TOKENS = 400;

/**
 * Message characters the classifier is allowed to read. The form accepts a
 * longer message and the founder receives all of it; only the model call is
 * bounded, so a very long paste cannot turn one form submission into an
 * unbounded reservation against the daily budget.
 */
export const CONTACT_CLASSIFY_MESSAGE_CHARS = 4_000;

/** Name characters the classifier is allowed to read, for the same reason. */
export const CONTACT_CLASSIFY_NAME_CHARS = 120;

/** One classification is a single short call: it never needs longer than this. */
export const CONTACT_CLASSIFY_TIMEOUT_MS = 20_000;

export type Rates = { inputPerM: number; outputPerM: number };

/**
 * Rates assumed when nothing prices the slug in `CONTACT_CLASSIFY_MODEL`: it is
 * not on the chat allowlist, not in the table below, and no env override names
 * a price. They match the most expensive model on the allowlist, so an unknown
 * model over-reserves rather than under-reserving.
 *
 * The last resort, for both halves of the accounting. Using them for a slug
 * that is priced was the hole this group of functions used to have. Settling a
 * known model here never brought the reservation down toward the real cost;
 * reserving a known model here left the difference standing on any path that
 * did not settle at all. Either way an anonymous form post held roughly a
 * hundred times what it spent, a hundred or so posts walked one IP through
 * `IP_DAILY_BUDGET_USD`, and a couple of thousand walked the site through
 * `GLOBAL_HARD_BUDGET_USD` and closed the chat for everyone.
 */
export const UNPRICED_MODEL_RATES = { inputPerM: 5, outputPerM: 25 } as const;

/**
 * USD per 1M tokens for the classifier models, keyed by gateway slug.
 *
 * They need their own table because `CHAT_MODELS` is the picker's allowlist,
 * not a price list: the classifier is deliberately a model no visitor can
 * select, so `findModel` returns nothing for it and there is no published
 * price to settle against.
 *
 * Where the numbers came from: the gateway's published list price for each
 * slug, recorded here on 2026-09-13, cross-checked against the bake-off
 * published on the company site. That bake-off
 * (`evals/results/bakeoff-latest.json` in nexus-website) prices GPT-OSS 20B at
 * $0.0004 for a two-turn conversation of roughly 10k input and 1k output
 * tokens, against $0.0758 for Opus on the same conversation. These rates put
 * that conversation at $0.0006, so the two readings differ by about half a
 * ten-thousandth of a dollar and the higher one is kept on purpose: a settle
 * that over-states costs the budget a rounding error, and a settle that
 * under-states is how a gateway bill outruns the books. Recheck them when the
 * gateway reprices; the env override exists so that is not a deploy.
 *
 * A slug that neither this table nor the picker prices is both reserved and
 * settled at `UNPRICED_MODEL_RATES`. Correct it with `CONTACT_CLASSIFY_RATES`
 * in the environment rather than leaving it to that fallback.
 */
export const CONTACT_CLASSIFY_RATES: Readonly<Record<string, Rates | undefined>> = {
  "openai/gpt-oss-20b": { inputPerM: 0.04, outputPerM: 0.16 },
  "anthropic/claude-haiku-4-5": { inputPerM: 1, outputPerM: 5 },
};

/** The rates we assume for one classifier slug, or undefined when it is unknown. */
export function contactClassifyRates(modelId: string | undefined): Rates | undefined {
  const wanted = modelId?.trim();
  if (!wanted || !Object.hasOwn(CONTACT_CLASSIFY_RATES, wanted)) return undefined;
  return CONTACT_CLASSIFY_RATES[wanted];
}

/**
 * Parses an owner override of those rates, `"inputPerM,outputPerM"` in USD per
 * 1M tokens (for example `"0.04,0.16"`), so a price change or a new classifier
 * slug is an env edit rather than a deploy.
 *
 * Pure: the caller reads the environment. Anything malformed, negative,
 * non-finite, or free on both sides returns undefined, so a typo falls back to
 * the table and then to the pessimistic rates instead of settling a real call
 * at zero.
 *
 * `"0,0"` is the case worth naming: both halves parse as finite and
 * non-negative, so an early version of this guard accepted them and priced
 * every classification at exactly $0.00 while the caller's startup warning
 * stayed quiet, because rates had been returned. A free pair is not a price,
 * it is a typo, and a metered call that costs nothing is an unmetered call.
 * One side free is still a price and is kept.
 */
export function parseClassifyRates(raw: string | undefined): Rates | undefined {
  const parts = raw?.trim().split(",");
  if (!parts || parts.length !== 2) return undefined;
  const [rawInput, rawOutput] = parts.map((part) => part.trim());
  // `Number("")` is 0, so an empty field would otherwise read as a free side.
  if (!rawInput || !rawOutput) return undefined;
  const inputPerM = Number(rawInput);
  const outputPerM = Number(rawOutput);
  if (!Number.isFinite(inputPerM) || !Number.isFinite(outputPerM)) return undefined;
  if (inputPerM < 0 || outputPerM < 0) return undefined;
  if (inputPerM === 0 && outputPerM === 0) return undefined;
  return { inputPerM, outputPerM };
}

/**
 * The rates one classification is priced at, resolved once so the reservation,
 * the floor and the settle can never disagree about what the call costs.
 *
 * Order, most specific first:
 *
 * 1. `rates`, which only an explicit `CONTACT_CLASSIFY_RATES` override or the
 *    `CONTACT_CLASSIFY_RATES` table above ever sets. An operator who writes a
 *    price in the environment means that price, even for a slug the picker
 *    also prices, so this wins rather than being silently ignored.
 * 2. The allowlisted model's own published price, when the classifier happens
 *    to be a model the picker offers.
 * 3. `UNPRICED_MODEL_RATES`, the answer for a slug nothing prices.
 */
export function contactClassifyResolvedRates(args: {
  model: ChatModel | undefined;
  rates?: Rates | undefined;
}): Rates {
  return args.rates ?? args.model ?? UNPRICED_MODEL_RATES;
}

/**
 * The least one classification can be allowed to cost the budget once the
 * prompt has been handed to the gateway: every input token the prompt sends,
 * plus the whole output cap, at the resolved rates.
 *
 * This is the failure path's settle. A failed call is not a free call. The
 * tokens are billed whether or not the object validated, and failure is not
 * only something the gateway does to us: the visitor controls
 * `CONTACT_CLASSIFY_MESSAGE_CHARS` of the prompt, and `generateObject` throws
 * when the object does not validate or when the JSON is truncated at
 * `CONTACT_CLASSIFY_OUTPUT_TOKENS`. Charging the ceiling of what that call
 * could have spent is what keeps a chosen failure from being cheaper than a
 * success, which is how the failure path becomes the cheap way through
 * `IP_DAILY_BUDGET_USD` and then `GLOBAL_HARD_BUDGET_USD`.
 */
export function contactClassifyFloorUsd(args: {
  model: ChatModel | undefined;
  rates?: Rates | undefined;
  promptChars: number;
}): number {
  const rates = contactClassifyResolvedRates(args);
  const inputTokens = Math.ceil(args.promptChars / CHARS_PER_TOKEN);
  const usd =
    (inputTokens * rates.inputPerM + CONTACT_CLASSIFY_OUTPUT_TOKENS * rates.outputPerM) /
    1_000_000;
  return Math.max(Math.round(usd * 1_000_000) / 1_000_000, 0);
}

/**
 * What one classification will probably cost, reserved before the model runs.
 *
 * The same ceiling as the floor above, at the same rates, with a minimum so a
 * reservation is never rounded away to nothing. Pessimism belongs in the rates
 * for a slug nothing prices, not in the arithmetic: a priced slug reserved at
 * Opus rates holds about a hundred times what it spends, and any path that
 * does not settle, the failure path above all, keeps that difference.
 */
export function contactClassifyPrechargeUsd(args: {
  model: ChatModel | undefined;
  rates?: Rates | undefined;
  promptChars: number;
}): number {
  return Math.max(contactClassifyFloorUsd(args), 0.0001);
}

/**
 * What the classification cost: the real token counts the call reported, at
 * the rates we assume for that model.
 *
 * Not the real cost. The gateway hands back tokens, not a price, so this is a
 * measurement multiplied by an assumption, and the assumption is the caller's
 * to supply through `contactClassifyResolvedRates` above.
 *
 * Zero out of here is not a free call, it is a call nobody measured: an absent
 * or unparsable usage block reads as zero tokens. A caller settling a
 * reservation must read a zero as "unmeasured" and charge
 * `contactClassifyFloorUsd` instead, the same as a failure, because a settle of
 * zero refunds the whole reservation and takes the call back out of the cap.
 */
export function contactClassifyCostUsd(args: {
  model: ChatModel | undefined;
  rates?: Rates | undefined;
  inputTokens: number;
  outputTokens: number;
}): number {
  const rates = contactClassifyResolvedRates(args);
  const usd = (args.inputTokens * rates.inputPerM + args.outputTokens * rates.outputPerM) / 1_000_000;
  return Math.max(Math.round(usd * 1_000_000) / 1_000_000, 0);
}

/* ------------------------------------------------------------------------ */
/* Live evaluation run                                                       */
/* ------------------------------------------------------------------------ */

/**
 * A live run is two contestant replies plus one judge call, started by a
 * visitor tapping a button. It is the most expensive thing on the site per
 * tap, so it gets its own allowance on top of, never instead of, the chat
 * budgets: every model call still passes through `reserveBudget`, which is
 * the only global hard cap there is.
 */

/**
 * Live runs one client IP may start per UTC day. Enforced by a counter the
 * route reserves before anything is called (`reserveEvalRun`), not by the
 * replay cache: a run that fails or is abandoned still spent its models, so
 * the count is never given back.
 */
export const EVAL_RUNS_PER_IP_PER_DAY = 2;

/** Site-wide spend on live runs per UTC day, inside the global soft budget. */
export const GLOBAL_EVAL_USD_PER_DAY = 1.0;

/**
 * One prospect turn, not the two-turn conversation the published table
 * measured, and a short answer. The two measurements have different shapes
 * and are rendered in separate blocks; a live number never overwrites a
 * published cell.
 */
export const EVAL_OUTPUT_TOKENS = 600;
/**
 * The judge writes five scores, a winner and one line of verdict, which is
 * about 150 tokens of text. The cap sits far above that because a reasoning
 * model spends this same budget thinking first: measured on
 * `google/gemini-3.8-flash`, the default judge, one verdict took 619 reasoning
 * tokens and left 66 for the answer, so the object came back truncated and the
 * score was lost. The script and the live run both read this, so a cap set to
 * the size of the answer means a visitor's run reports no score nearly every
 * time. Raise it before lowering it, and remember it also sets the judge's
 * share of the eval precharge.
 */
export const EVAL_JUDGE_OUTPUT_TOKENS = 1_500;

/**
 * Two bounded legs. Contestants run in parallel and settle first, then the
 * judge, so the function can never reach `EVAL_MAX_DURATION_SECONDS` with
 * money reserved and unreconciled.
 */
export const EVAL_CONTESTANT_TIMEOUT_MS = 40_000;
export const EVAL_JUDGE_TIMEOUT_MS = 30_000;
export const EVAL_MAX_DURATION_SECONDS = 120;

/** How long a completed run is replayed from cache instead of being rerun. */
export const EVAL_CACHE_TTL_SECONDS = 24 * 60 * 60;

/**
 * Judge preference, cheapest first. A model never scores its own reply: the
 * first entry that is not in the set handed in does the scoring, and the panel
 * names it. With Gemini Flash ruled out the judge is Claude Sonnet 5.
 *
 * Both callers pass the models that must not judge, and they rule out
 * different sets. A live run has two contestants and one judge for the pair,
 * so it passes both. `evals/judge.ts` scores one reply at a time and passes
 * only the model that wrote that reply, so a bake-off of the whole allowlist
 * still has a judge for every row and different rows get different judges.
 */
export const JUDGE_PREFERENCE: readonly string[] = [
  "google/gemini-3.8-flash",
  "anthropic/claude-sonnet-5",
  "openai/gpt-5.6-sol",
  "anthropic/claude-opus-5",
];

/** Picks a judge that is none of `contestantIds`, or undefined when they leave nothing. */
export function pickJudgeModel(contestantIds: readonly string[]): ChatModel | undefined {
  const running = new Set(contestantIds);
  for (const id of JUDGE_PREFERENCE) {
    if (running.has(id)) continue;
    const model = findModel(id);
    if (model) return model;
  }
  return CHAT_MODELS.find((m) => !running.has(m.id));
}

/** What one whole live run is charged before it starts; settled against usage afterwards. */
export function evalPrechargeUsd(args: {
  contestants: readonly ChatModel[];
  judge: ChatModel;
  promptChars: number;
}): number {
  const promptTokens = Math.ceil(args.promptChars / CHARS_PER_TOKEN);
  let usd = 0;
  for (const model of args.contestants) {
    usd +=
      (promptTokens * model.inputPerM + EVAL_OUTPUT_TOKENS * model.outputPerM) / 1_000_000;
  }
  // The judge reads both replies on top of the scenario.
  const judgeInputTokens = promptTokens + args.contestants.length * EVAL_OUTPUT_TOKENS;
  usd +=
    (judgeInputTokens * args.judge.inputPerM +
      EVAL_JUDGE_OUTPUT_TOKENS * args.judge.outputPerM) /
    1_000_000;
  return Math.max(Math.round(usd * 1_000_000) / 1_000_000, 0.0001);
}
