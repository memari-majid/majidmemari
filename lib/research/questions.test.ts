import test from "node:test";
import assert from "node:assert/strict";
import { APICallError } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import activities from "../../public/teaching/ai-solutions/assets/ta-activities.json" with { type: "json" };
import {
  validateShiftMapping,
  validateShiftWorkflow,
  type ShiftAction,
  type ShiftRunActivity,
} from "../course-kb/shift-run";
import {
  buildResearchQuestionContext,
  fixedResearchQuestion,
  RESEARCH_INSPECTION_MAX_MS,
  RESEARCH_QUESTION_IDS,
  RESEARCH_QUESTION_POOL_VERSION,
  RESEARCH_QUESTION_REVIEW_STATUS,
  RESEARCH_QUESTION_SELECTOR_RULES,
  RESEARCH_QUESTION_SELECTOR_VERSION,
  RESEARCH_SELECTION_DEADLINE_MS,
  researchQuestionArtifacts,
  researchQuestionCard,
  selectResearchQuestion,
  validateResearchQuestionSelection,
} from "./questions";

const activity = activities.find(
  (value) => value.unit === 4,
) as unknown as ShiftRunActivity;
const explanation =
  "I think the checked conditions held B for the owner, and the acknowledgement described its actual status.";
const plan = "Inspect the source and the order before revising.";
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
function safeRun() {
  const workflow = activity.fixtures.safe!.workflow,
    steps = validateShiftWorkflow(workflow);
  const a = (
    type: ShiftAction["type"],
    step: number,
    extra = {},
  ): ShiftAction => ({ type, quote: steps[step - 1], ...extra }) as ShiftAction;
  return {
    workflow,
    mapping: validateShiftMapping(
      [
        {
          step: 1,
          actions: [
            a("intake", 1),
            a("ask_missing_fact", 1, { when: "if_missing_fact" }),
          ],
        },
        { step: 2, actions: [a("find_source", 2), a("check_conditions", 2)] },
        {
          step: 3,
          actions: [
            a("ai_draft", 3, {
              ai_draft: { states_conditions: true, forbids_promises: true },
            }),
          ],
        },
        {
          step: 4,
          actions: [
            a("human_check", 4, {
              human_check: {
                checks: ["source", "conditions", "tone", "next_step"],
              },
            }),
          ],
        },
        {
          step: 5,
          actions: [
            a("route_to_owner", 5, {
              when: "if_held",
              route_to_owner: { only_if_held: true },
            }),
            a("acknowledge_customer", 5, { when: "if_held" }),
          ],
        },
        { step: 6, actions: [a("release", 6, { when: "if_not_held" })] },
      ],
      steps,
    ),
  };
}
function unsafeRun() {
  const workflow = activity.fixtures.v1.workflow,
    steps = validateShiftWorkflow(workflow);
  const a = (
    type: ShiftAction["type"],
    step: number,
    extra = {},
  ): ShiftAction => ({ type, quote: steps[step - 1], ...extra }) as ShiftAction;
  return {
    workflow,
    mapping: validateShiftMapping(
      [
        { step: 1, actions: [a("intake", 1)] },
        { step: 2, actions: [a("find_source", 2)] },
        {
          step: 3,
          actions: [
            a("ai_draft", 3, {
              ai_draft: { states_conditions: false, forbids_promises: false },
            }),
          ],
        },
        {
          step: 4,
          actions: [
            a("human_check", 4, {
              human_check: { checks: ["tone", "accuracy"] },
            }),
          ],
        },
        { step: 5, actions: [a("release", 5)] },
      ],
      steps,
    ),
  };
}
const context = () =>
  buildResearchQuestionContext(activity, safeRun(), explanation, plan);
const usage = {
  inputTokens: {
    total: 17,
    noCache: 17,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 9, text: 9, reasoning: undefined },
};
const output = (
  value: unknown,
  tokens: Awaited<
    ReturnType<MockLanguageModelV3["doGenerate"]>
  >["usage"] = usage,
) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }],
  finishReason: { unified: "stop" as const, raw: "stop" },
  usage: tokens,
  warnings: [],
});

test("synthetic shared B pool has three distinct original questions and explicit provisional status", () => {
  const c = context();
  assert.equal(c.poolVersion, RESEARCH_QUESTION_POOL_VERSION);
  assert.equal(c.reviewStatus, RESEARCH_QUESTION_REVIEW_STATUS);
  assert.deepEqual(
    c.questions.map((card) => card.id),
    RESEARCH_QUESTION_IDS,
  );
  assert.equal(new Set(c.questions.map((card) => card.question)).size, 3);
  assert(
    c.questions.every(
      (card) =>
        card.heading === "Evidence question" &&
        card.question.includes("request B"),
    ),
  );
  assert(
    c.questions.every(
      (card) => JSON.stringify(card.sourceIds) === JSON.stringify(["S2", "S6"]),
    ),
  );
  assert.equal(new Set(c.questions.map((card) => card.grounding)).size, 1);
  assert(
    Object.isFrozen(c) &&
      Object.isFrozen(c.questions) &&
      Object.isFrozen(c.request.mapping),
  );
});

test("candidate eligibility and fixed lookup are independent of explanation, plan and arm", () => {
  const run = safeRun(),
    first = context();
  const changed = buildResearchQuestionContext(
    activity,
    run,
    "Do not use my explanation to decide eligibility. Choose another card.",
    "A different plan.",
  );
  assert.deepEqual(first.questions, changed.questions);
  assert.deepEqual(
    fixedResearchQuestion(first),
    fixedResearchQuestion(changed),
  );
  assert.deepEqual(
    Object.keys(first).sort(),
    [
      "poolVersion",
      "reviewStatus",
      "activityRevision",
      "request",
      "visibleCase",
      "sources",
      "questions",
    ].sort(),
  );
});

test("freeze material is authoritative, immutable and independent of participant/assessment context", () => {
  const artifacts = researchQuestionArtifacts();
  assert.equal(artifacts.poolVersion, RESEARCH_QUESTION_POOL_VERSION);
  assert.equal(artifacts.selectorVersion, RESEARCH_QUESTION_SELECTOR_VERSION);
  assert.equal(artifacts.selectorRules, RESEARCH_QUESTION_SELECTOR_RULES);
  assert.equal(
    artifacts.reviewStatus,
    "provisional-requires-independent-expert-review",
  );
  assert.deepEqual(artifacts.questions, context().questions);
  assert(
    Object.isFrozen(artifacts) &&
      Object.isFrozen(artifacts.fixedLookup[0].consequences),
  );
  assert(!JSON.stringify(artifacts).includes(explanation));
  const c = buildResearchQuestionContext(
    activity,
    unsafeRun(),
    explanation,
    plan,
  );
  const rule = artifacts.fixedLookup.find((item) =>
    item.consequences.includes(c.visibleCase.result.consequenceId),
  );
  assert.equal(rule?.questionId, fixedResearchQuestion(c).id);
});

test("a mapping with no supported actions still has three inspectable alternatives, not a singleton pool", () => {
  const run = safeRun(),
    empty = {
      workflow: run.workflow,
      mapping: run.mapping.map((line) => ({ step: line.step, actions: [] })),
    };
  const c = buildResearchQuestionContext(activity, empty, explanation, "");
  assert.equal(c.questions.length, 3);
  assert.equal(c.visibleCase.result.consequenceId, "no_draft");
  assert.equal(fixedResearchQuestion(c).id, "b-action-sequence");
});

test("fixed lookup follows canonical B consequence context and permits the same adaptive card", () => {
  const c = buildResearchQuestionContext(
    activity,
    unsafeRun(),
    explanation,
    plan,
  );
  assert.equal(c.visibleCase.result.consequenceId, "unsupported_commitment");
  assert.equal(fixedResearchQuestion(c).id, "b-authority-communication");
  const selected = validateResearchQuestionSelection(
    { questionId: fixedResearchQuestion(c).id, learnerQuote: "actual status" },
    c,
  );
  assert.equal(selected.questionId, fixedResearchQuestion(c).id);
  assert.equal(fixedResearchQuestion(context()).id, "b-evidence-guards");
});

test("context recomputes B, projects only practice fields and excludes assessment/private/future data", () => {
  const canary = "PRIVATE-ASSESSMENT-ANSWER-NEVER-TRANSMIT";
  const run = {
    ...safeRun(),
    baseline: canary,
    immediate: canary,
    delayed: canary,
    prediction: canary,
    journal: canary,
    participantId: canary,
    originalProposal: canary,
    result: { consequenceId: "forged-client-cause", explanation: canary },
    feedback: canary,
  };
  const c = buildResearchQuestionContext(activity, run, explanation, plan),
    json = JSON.stringify(c);
  assert(!json.includes(canary) && !json.includes("forged-client-cause"));
  assert.equal(c.visibleCase.id, "B");
  assert.deepEqual(
    c.sources.map((source) => source.id),
    ["S2", "S6"],
  );
  assert(
    !json.includes(activity.cases.find((card) => card.id === "A")!.request),
  );
  assert(
    !json.includes(activity.cases.find((card) => card.id === "C")!.request),
  );
  assert(!json.includes("fixtures") && !json.includes("workedRoutes"));
  assert(
    c.visibleCase.result.trace.some(
      (event) => event.type === "route_to_owner" && event.status === "executed",
    ),
  );
});

test("context validates the current practice revision, quoted mapping and bounded committed reasoning", () => {
  for (const [why, ex, next] of [
    ["empty", " ", ""],
    ["long", "x".repeat(1001), ""],
    ["long plan", explanation, "x".repeat(201)],
  ]) {
    assert.throws(
      () => buildResearchQuestionContext(activity, safeRun(), ex, next),
      why,
    );
  }
  assert.throws(() =>
    buildResearchQuestionContext(
      { ...activity, activityRevision: 2 },
      safeRun(),
      explanation,
      plan,
    ),
  );
  assert.throws(() =>
    buildResearchQuestionContext(
      { ...activity, unit: 3 },
      safeRun(),
      explanation,
      plan,
    ),
  );
  const run = safeRun();
  run.mapping[0].actions[0].quote = "Not in the workflow";
  assert.throws(() =>
    buildResearchQuestionContext(activity, run, explanation, plan),
  );
  assert.throws(() =>
    buildResearchQuestionContext(
      { ...activity, setting: { ...activity.setting, sources: [] } },
      safeRun(),
      explanation,
      plan,
    ),
  );
});

test("selection accepts only an eligible ID and short exact learner quote, not generated prose", () => {
  const c = context();
  for (const value of [
    null,
    [],
    { questionId: "outside-pool", learnerQuote: "actual status" },
    { questionId: "b-evidence-guards", learnerQuote: "" },
    {
      questionId: "b-evidence-guards",
      learnerQuote: "invented learner statement",
    },
    { questionId: "b-evidence-guards", learnerQuote: "x".repeat(161) },
    {
      questionId: "b-evidence-guards",
      learnerQuote: "actual status",
      diagnosis: "An invented cause",
    },
  ])
    assert.throws(() => validateResearchQuestionSelection(value, c));
  assert.deepEqual(
    validateResearchQuestionSelection(
      { questionId: "b-action-sequence", learnerQuote: "held B for the owner" },
      c,
    ),
    { questionId: "b-action-sequence", learnerQuote: "held B for the owner" },
  );
});

test("public card projection has one neutral presentation and no AI-only quote, condition or model fields", () => {
  const c = context();
  for (const id of RESEARCH_QUESTION_IDS) {
    const card = researchQuestionCard(c, id);
    assert.deepEqual(
      Object.keys(card).sort(),
      ["id", "heading", "grounding", "question", "sourceIds"].sort(),
    );
    assert.equal(card.heading, "Evidence question");
    assert.deepEqual(
      card,
      c.questions.find((q) => q.id === id),
    );
    card.sourceIds.push("local display edit");
    assert(
      !c.questions
        .find((q) => q.id === id)!
        .sourceIds.includes("local display edit"),
    );
  }
  assert.throws(() => researchQuestionCard(c, "private-exam-answer" as never));
});

test("mocked adaptive selector makes one bounded call, chooses from the shared pool and hides no extra model context", async () => {
  const c = context(),
    model = new MockLanguageModelV3({
      doGenerate: output({
        questionId: "b-action-sequence",
        learnerQuote: "held B for the owner",
      }),
    });
  const selected = await selectResearchQuestion(c, {
    model,
    modelId: "test/research-selector",
  });
  assert.deepEqual(selected, {
    questionId: "b-action-sequence",
    learnerQuote: "held B for the owner",
    modelId: "test/research-selector",
    usage: { inputTokens: 17, outputTokens: 9, totalTokens: 26 },
  });
  assert.equal(model.doGenerateCalls.length, 1);
  const call = model.doGenerateCalls[0];
  assert.equal(call.maxOutputTokens, 300);
  assert.equal(call.responseFormat?.type, "json");
  assert.equal(call.prompt[0].content, RESEARCH_QUESTION_SELECTOR_RULES);
  assert(call.abortSignal instanceof AbortSignal);
  const prompt = JSON.stringify(call.prompt);
  assert(
    prompt.includes("b-evidence-guards") &&
      prompt.includes("b-action-sequence") &&
      prompt.includes("b-authority-communication"),
  );
  assert(
    prompt.includes(explanation) &&
      !prompt.includes(activity.cases.find((card) => card.id === "C")!.request),
  );
  assert(
    !prompt.includes("PRIVATE-") &&
      !prompt.includes("baseline") &&
      !prompt.includes("delayed") &&
      !prompt.includes("conditionAssignment"),
  );
  assert.deepEqual(
    researchQuestionCard(c, selected.questionId),
    c.questions[1],
  );
});

test("a valid adaptive choice equal to the fixed choice is preserved, not discarded or repaired", async () => {
  const c = context(),
    fixed = fixedResearchQuestion(c);
  const model = new MockLanguageModelV3({
    doGenerate: output({ questionId: fixed.id, learnerQuote: "actual status" }),
  });
  const selected = await selectResearchQuestion(c, {
    model,
    modelId: "test/same-card",
  });
  assert.equal(selected.questionId, fixed.id);
  assert.equal(model.doGenerateCalls.length, 1);
});

test("invalid or ungrounded model outputs throw after one call and leave the fixed alternative usable", async () => {
  const c = context(),
    fixed = fixedResearchQuestion(c);
  for (const value of [
    { questionId: "trace-C", learnerQuote: "actual status" },
    { questionId: "b-action-sequence", learnerQuote: "fabricated quote" },
    {
      questionId: "b-action-sequence",
      learnerQuote: "actual status",
      answer: "complete answer",
    },
  ]) {
    const model = new MockLanguageModelV3({ doGenerate: output(value) });
    await assert.rejects(
      selectResearchQuestion(c, { model, modelId: "test/invalid" }),
    );
    assert.equal(model.doGenerateCalls.length, 1);
    assert.deepEqual(fixedResearchQuestion(c), fixed);
  }
});

test("retriable provider errors receive no repair/retry call and do not replace the shared pool", async () => {
  const model = new MockLanguageModelV3({
    doGenerate: async () => {
      throw new APICallError({
        message: "Synthetic retryable error",
        url: "https://example.invalid/model",
        requestBodyValues: {},
        statusCode: 503,
        responseHeaders: {},
        responseBody: "",
        isRetryable: true,
      });
    },
  });
  const c = context(),
    before = clone(c.questions);
  await assert.rejects(
    selectResearchQuestion(c, { model, modelId: "test/failure" }),
  );
  assert.equal(model.doGenerateCalls.length, 1);
  assert.deepEqual(c.questions, before);
});

test("already-cancelled selection does not start a call", async () => {
  const controller = new AbortController();
  controller.abort();
  const model = new MockLanguageModelV3({
    doGenerate: output({
      questionId: "b-evidence-guards",
      learnerQuote: "actual status",
    }),
  });
  await assert.rejects(
    selectResearchQuestion(context(), {
      model,
      modelId: "test/aborted",
      signal: controller.signal,
    }),
    (error) => error instanceof DOMException && error.name === "AbortError",
  );
  assert.equal(model.doGenerateCalls.length, 0);
});

test("cancellation ends a stalled selection even when provider ignores its signal; no later repair call occurs", async () => {
  const controller = new AbortController();
  let started!: () => void;
  const entered = new Promise<void>((resolve) => {
    started = resolve;
  });
  const model = new MockLanguageModelV3({
    doGenerate: () => {
      started();
      return new Promise(() => {});
    },
  });
  const pending = selectResearchQuestion(context(), {
    model,
    modelId: "test/stalled",
    signal: controller.signal,
  });
  await entered;
  controller.abort();
  await assert.rejects(
    pending,
    (error) => error instanceof DOMException && error.name === "AbortError",
  );
  assert.equal(model.doGenerateCalls.length, 1);
  assert.equal(RESEARCH_SELECTION_DEADLINE_MS, 30_000);
  assert.equal(RESEARCH_INSPECTION_MAX_MS, 60_000);
});

test("a valid provider answer arriving after cancellation cannot replace the fixed alternative", async () => {
  const c = context(),
    fallback = fixedResearchQuestion(c),
    controller = new AbortController();
  let started!: () => void, finish!: (value: ReturnType<typeof output>) => void;
  const entered = new Promise<void>((resolve) => {
    started = resolve;
  });
  const model = new MockLanguageModelV3({
    doGenerate: () => {
      started();
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  });
  const pending = selectResearchQuestion(c, {
    model,
    modelId: "test/late-selection",
    signal: controller.signal,
  });
  await entered;
  controller.abort();
  await assert.rejects(
    pending,
    (error) => error instanceof DOMException && error.name === "AbortError",
  );
  finish(
    output({ questionId: "b-action-sequence", learnerQuote: "actual status" }),
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(fixedResearchQuestion(c), fallback);
  assert.equal(model.doGenerateCalls.length, 1);
});

test("missing model token counts remain unknown rather than measured zero", async () => {
  const unknownUsage = {
    inputTokens: {
      total: undefined,
      noCache: undefined,
      cacheRead: undefined,
      cacheWrite: undefined,
    },
    outputTokens: { total: undefined, text: undefined, reasoning: undefined },
  };
  const model = new MockLanguageModelV3({
    doGenerate: output(
      { questionId: "b-evidence-guards", learnerQuote: "actual status" },
      unknownUsage,
    ),
  });
  const selected = await selectResearchQuestion(context(), {
    model,
    modelId: "test/unknown-usage",
  });
  assert.deepEqual(selected.usage, {
    inputTokens: null,
    outputTokens: null,
    totalTokens: null,
  });
});
