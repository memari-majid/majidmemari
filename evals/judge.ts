/**
 * Scores the bake-off replies against the published rubric.
 *
 * It does not generate a reply of its own. It reads the replies
 * `evals/bakeoff.ts --json` wrote to `evals/results/bakeoff-transcripts.json`
 * and, for each one, asks a judge model that did not write it to score it from
 * 1 to 5 on the five rubric criteria in `lib/evals.ts`.
 *
 *   npx tsx evals/judge.ts --json
 *   npx tsx evals/judge.ts --json anthropic/claude-opus-5 anthropic/claude-sonnet-5
 *
 * With no model slugs it scores every model in the transcript. With `--json`
 * it writes `evals/results/judge-latest.json`, the second of the three
 * artifacts the site reads. A score exists only because this ran. Each verdict
 * in that file carries `model`, the `judgeModel` and `judgeLabel` that scored
 * it, the five scores, the total and one sentence; the file itself carries no
 * judge field, because no single model scored the table.
 *
 * Rules this script exists to keep:
 *
 * 1. **One row, one generation.** Generating a fresh reply here and scoring
 *    that would publish a score from one sample beside a cost and a latency
 *    from another, in the same row, which a visitor reads as one measurement.
 *    So the score is of the exact reply the published numbers were measured
 *    on, and the script refuses to run when the transcript does not belong to
 *    the published artifact (same commit, same prompt hash, same scenario).
 * 2. **A score exists only if someone measured it.** Nothing here invents a
 *    number. A model with no transcript, no final reply, no eligible judge or
 *    no usable verdict is left unscored and the page says so, and a run that
 *    scored nothing at all writes no file and exits non-zero.
 * 3. **No model scores its own reply.** The judge is picked per row, by
 *    `pickJudgeModel([row's model])`, so the only model ruled out of judging a
 *    reply is the one that wrote it. That is what lets a bake-off race the
 *    whole allowlist and still be scored: picking one judge for the table
 *    needed a model nobody had entered, and with four contestants out of four
 *    allowlisted models there is no such model. Different rows are therefore
 *    judged by different models, and every verdict records which.
 * 4. **The judge is blind.** It sees one reply and never a model name, so it
 *    scores the writing rather than the brand.
 * 5. A judge score is a judgement, not a measurement. It is published beside
 *    the cost and latency numbers, labelled, and never merged into them.
 *
 * `generateObject` is deprecated in this SDK version, so this uses
 * `generateText` with `Output.object`. No tools are ever attached: `output`
 * throws `NoOutputGeneratedError` when the last step finishes with tool calls
 * or produces no text, which is guarded below.
 *
 * Needs AI_GATEWAY_API_KEY (`vercel env pull .env.local`, then
 * `set -a; source .env.local; set +a`). Run it from the repo root.
 */

import { readFileSync, writeFileSync } from "node:fs";
import {
  NoObjectGeneratedError,
  NoOutputGeneratedError,
  Output,
  gateway,
  generateText,
} from "ai";
import { z } from "zod";
import { renderedPrompt } from "../lib/assistant";
import { EVAL_SCENARIO, RUBRIC, judgeVerdictSchema, promptHash, rubricTotal } from "../lib/evals";
import { EVAL_JUDGE_OUTPUT_TOKENS, pickJudgeModel } from "../lib/chat-limits";
import type { ChatModel } from "../lib/chat-models";

const KEY = process.env.AI_GATEWAY_API_KEY;
if (!KEY) throw new Error("AI_GATEWAY_API_KEY is not set");

const args = process.argv.slice(2);
const WRITE_JSON = args.includes("--json");
const WANTED = args.filter((arg) => !arg.startsWith("--"));

const TRANSCRIPTS_PATH = "evals/results/bakeoff-transcripts.json";
const BAKEOFF_PATH = "evals/results/bakeoff-latest.json";
const OUT_PATH = "evals/results/judge-latest.json";
const JUDGE_TIMEOUT_MS = 60_000;

/** Only the fields this script reads. The bake-off owns the rest. */
const provenanceSchema = z.object({
  generatedAt: z.string(),
  gitSha: z.string().min(7),
  promptHash: z.string().min(1),
  scenarioId: z.string().min(1),
});

const transcriptsSchema = provenanceSchema.extend({
  runs: z
    .array(
      z.object({
        model: z.string().min(1),
        label: z.string().optional(),
        turns: z.array(z.object({ user: z.string(), assistant: z.string() })).min(1),
      }),
    )
    .min(1),
});

function readArtifact<T>(path: string, schema: z.ZodType<T>, what: string): T {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    console.error(
      `Cannot read ${path}. Run \`npx tsx evals/bakeoff.ts --json <models>\` first: this script scores the replies that run measured, it does not generate its own.`,
    );
    process.exit(1);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    console.error(`${path} does not match the shape ${what} expects:`, parsed.error.message);
    process.exit(1);
  }
  return parsed.data;
}

const transcripts = readArtifact(TRANSCRIPTS_PATH, transcriptsSchema, "the judge");
const published = readArtifact(BAKEOFF_PATH, provenanceSchema, "the judge");

for (const [field, a, b] of [
  ["gitSha", transcripts.gitSha, published.gitSha],
  ["promptHash", transcripts.promptHash, published.promptHash],
  ["scenarioId", transcripts.scenarioId, published.scenarioId],
  ["generatedAt", transcripts.generatedAt, published.generatedAt],
] as const) {
  if (a !== b) {
    console.error(
      `${TRANSCRIPTS_PATH} and ${BAKEOFF_PATH} disagree on ${field} (${a} against ${b}), so these replies are not the ones behind the published numbers. Rerun evals/bakeoff.ts --json; it writes both files together.`,
    );
    process.exit(1);
  }
}

const currentHash = promptHash(renderedPrompt());
if (currentHash !== transcripts.promptHash) {
  console.warn(
    `Warning: the prompt has changed since this bake-off (${transcripts.promptHash} against ${currentHash}). The scores will be honest about these replies but the replies are not what the site sends today. Rerun evals/bakeoff.ts --json.`,
  );
}

const available = new Set(transcripts.runs.map((run) => run.model));
for (const model of WANTED) {
  if (!available.has(model)) {
    console.error(
      `${model} has no transcript in ${TRANSCRIPTS_PATH}. Include it in the bake-off run, or leave the model list empty to score everything that was measured.`,
    );
    process.exit(1);
  }
}
const contestants = transcripts.runs.filter((run) => WANTED.length === 0 || WANTED.includes(run.model));

const criteria = RUBRIC.map((r) => `- ${r.key} (${r.label}): ${r.question}`).join("\n");

async function score(
  judge: ChatModel,
  question: string,
  text: string,
): Promise<z.infer<typeof judgeVerdictSchema> | undefined> {
  const result = await generateText({
    model: gateway(judge.id),
    system:
      "You are scoring one AI assistant reply against a fixed rubric. You do not know which model wrote it and you must not guess. Return only the structured verdict.",
    prompt: `An AI consulting assistant answered this question from a prospective client:

${question}

Criteria, scored 1 (poor) to 5 (excellent):
${criteria}

The reply:
${text}

Score honestly. A short, specific answer beats a long, generic one. Invented prices, partners, or course titles are a serious failure on "grounded". Give one sentence of verdict, plain text, no markdown and no long dashes.`,
    output: Output.object({ schema: judgeVerdictSchema }),
    maxOutputTokens: EVAL_JUDGE_OUTPUT_TOKENS,
    timeout: { totalMs: JUDGE_TIMEOUT_MS },
  });
  try {
    return result.output;
  } catch (err) {
    // Two errors mean the same thing here: no parseable verdict. The step
    // produced no text at all (`NoOutputGeneratedError`), or text came back
    // that did not fit the schema (`NoObjectGeneratedError`), which is what a
    // reasoning judge truncated at its output cap throws. Either way the row
    // is left unscored rather than given a made-up number.
    if (!NoOutputGeneratedError.isInstance(err) && !NoObjectGeneratedError.isInstance(err)) {
      throw err;
    }
    return undefined;
  }
}

type Verdict = {
  model: string;
  /** The model that scored this reply. Never the model named above it. */
  judgeModel: string;
  judgeLabel: string;
  scores: z.infer<typeof judgeVerdictSchema>["scores"];
  total: number;
  verdict: string;
};

/** Wrapped in a function because this repo is CommonJS: no top-level await. */
async function main() {
  const verdicts: Verdict[] = [];
  console.log(
    `Scoring ${contestants.length} replies measured on ${transcripts.generatedAt} at commit ${transcripts.gitSha.slice(0, 7)}. Each reply is scored by a model that did not write it, so the judge is named per row below.`,
  );

  for (const run of contestants) {
    // The final reply is what the published row's numbers were measured on,
    // and the last user turn is what it was answering.
    const last = run.turns[run.turns.length - 1];
    if (!last.assistant.trim()) {
      console.log(`${run.model}: the transcript has no final reply, so this model is left unscored.`);
      continue;
    }
    // One row, one judge. Only the model that wrote this reply is ruled out,
    // so a bake-off of the whole allowlist still has a judge for every row.
    const judge = pickJudgeModel([run.model]);
    if (!judge) {
      console.log(
        `${run.model}: no allowlisted model other than this one is available to score it, so this model is left unscored.`,
      );
      continue;
    }
    const verdict = await score(judge, last.user, last.assistant);
    if (!verdict) {
      console.log(
        `${run.model}: ${judge.id} returned no usable verdict, so this model is left unscored.`,
      );
      continue;
    }
    const total = rubricTotal(verdict.scores);
    verdicts.push({
      model: run.model,
      judgeModel: judge.id,
      judgeLabel: judge.label,
      scores: verdict.scores,
      total,
      verdict: verdict.verdict,
    });
    console.log(
      `${run.model}: ${total}/${RUBRIC.length * 5} by ${judge.id} ${RUBRIC.map((r) => `${r.key} ${verdict.scores[r.key]}`).join(" ")} | ${verdict.verdict}`,
    );
  }

  if (verdicts.length === 0) {
    console.error(
      "Nothing was scored, so nothing was written. Rerun the bake-off with --json and try again rather than publishing a table of empty Score cells as a scored run.",
    );
    process.exitCode = 1;
    return;
  }

  if (!WRITE_JSON) return;
  const artifact = {
    // 2 is the per-row judge shape: every verdict names its own judge and
    // there is no top-level judge field, because there is no single judge.
    schemaVersion: 2,
    site: "majidmemari",
    generatedAt: new Date().toISOString(),
    // The run these scores belong to, so the page can refuse to join a score
    // to metrics from a different generation.
    gitSha: transcripts.gitSha,
    promptHash: transcripts.promptHash,
    bakeoffGeneratedAt: transcripts.generatedAt,
    scenarioId: transcripts.scenarioId,
    verdicts,
  };
  writeFileSync(OUT_PATH, `${JSON.stringify(artifact, null, 2)}\n`);
  const pairs = verdicts.map((v) => `${v.model} by ${v.judgeModel}`).join("; ");
  console.log(`\nWrote ${OUT_PATH} (${verdicts.length} verdicts of ${EVAL_SCENARIO.id}): ${pairs}.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
