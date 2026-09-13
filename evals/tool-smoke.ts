/**
 * Tool-schema smoke test across the picker models.
 *
 * zod 4 turns `.email()` into `format: "email"` plus a lookahead `pattern`,
 * and every vendor validates function schemas differently, so a schema that
 * works on one model can 400 on another. This forces one call to each
 * non-sending tool per model with the FULL ten-tool set attached, so every
 * schema is sent to every provider on every run. The three sending tools are
 * never forced and never execute: they need on-screen approval, and this
 * script must never put mail in flight.
 *
 *   npx tsx evals/tool-smoke.ts                        # every picker model
 *   npx tsx evals/tool-smoke.ts --json                 # and write the artifact
 *   npx tsx evals/tool-smoke.ts anthropic/claude-sonnet-5
 *
 * Needs AI_GATEWAY_API_KEY (`vercel env pull .env.local`, then
 * `set -a; source .env.local; set +a`).
 *
 * The context passes a fixed `ip` of "eval" on purpose: nothing here reserves
 * a quota, but a server-side port of this script must pass the real hashed IP
 * or limiter counters land under a bogus key.
 */

import { writeFileSync } from "node:fs";
import { gateway, generateText } from "ai";
import { renderedPrompt } from "../lib/assistant";
import { CHAT_MODELS } from "../lib/chat-models";
import { chatTools } from "../lib/chat-tools";

const KEY = process.env.AI_GATEWAY_API_KEY;
if (!KEY) throw new Error("AI_GATEWAY_API_KEY is not set");

const args = process.argv.slice(2);
const WRITE_JSON = args.includes("--json");
const ids = args.filter((a) => !a.startsWith("--"));
const MODELS = ids.length ? ids : CHAT_MODELS.map((m) => m.id);
const OUT_PATH = "evals/results/tool-smoke-latest.json";

/** Enough context for a grounded brief, snapshot, estimate, and note in one shot. */
const PROMPT =
  "We are a 40-person logistics company. Our ops team keeps asking ChatGPT about our own SOPs and getting wrong answers. The SOPs live in about 300 Word docs on SharePoint, one ops manager owns them, and we have two developers who know Python. Leadership wants something in a quarter, and I have to write to my director about it. Please structure this.";

/** Every tool that does not send email. The senders are approval gated and stay untouched. */
const FORCED = [
  "lookupSiteFacts",
  "recommendWorkshop",
  "draftConsultingBrief",
  "assessReadiness",
  "estimateProject",
  "draftOutreachNote",
  "offerOfficeHours",
] as const;

const SYSTEM = renderedPrompt();

type SmokeResult = { model: string; tool: string; ok: boolean; ms: number; note: string };

/** Wrapped in a function because this repo is CommonJS: no top-level await. */
async function main() {
  const results: SmokeResult[] = [];
  let failures = 0;

  for (const id of MODELS) {
    for (const toolName of FORCED) {
      const t0 = Date.now();
      try {
        const r = await generateText({
          model: gateway(id),
          system: SYSTEM,
          prompt: PROMPT,
          tools: chatTools,
          toolChoice: { type: "tool", toolName },
          maxOutputTokens: 2_000,
          experimental_context: { ip: "eval", model: id, requestId: "tool-smoke" },
        });
        const call = r.toolCalls.find((c) => c.toolName === toolName);
        const ms = Date.now() - t0;
        if (!call) {
          failures += 1;
          results.push({ model: id, tool: toolName, ok: false, ms, note: `no call, finish=${r.finishReason}` });
          console.log(`${id}  ${toolName}  NO CALL  ${ms}ms  finish=${r.finishReason}`);
          continue;
        }
        const keys = Object.keys(call.input as Record<string, unknown>).join(",");
        results.push({ model: id, tool: toolName, ok: true, ms, note: `input keys: ${keys}` });
        console.log(`${id}  ${toolName}  ok  ${ms}ms  ${r.usage.totalTokens ?? 0} tokens  input keys: ${keys}`);
      } catch (err) {
        failures += 1;
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ model: id, tool: toolName, ok: false, ms: Date.now() - t0, note: msg.slice(0, 300) });
        console.log(`${id}  ${toolName}  FAILED  ${msg.slice(0, 300)}`);
      }
    }
  }

  console.log(failures === 0 ? "all tool schemas accepted" : `${failures} failure(s)`);

  if (WRITE_JSON) {
    writeFileSync(
      OUT_PATH,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          site: "majidmemari",
          generatedAt: new Date().toISOString(),
          models: MODELS,
          tools: FORCED,
          failures,
          results,
        },
        null,
        2,
      )}\n`,
    );
    console.log(`Wrote ${OUT_PATH}.`);
  }

  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
