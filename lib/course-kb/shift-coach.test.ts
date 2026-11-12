import test from 'node:test';
import assert from 'node:assert/strict';
import { MockLanguageModelV3 } from 'ai/test';
import { APICallError } from 'ai';
import activities from '../../public/teaching/ai-solutions/assets/ta-activities.json' with { type: 'json' };
import { createCourseAccess } from './access';
import { createCourseChatHandler } from './chat';
import { buildCourseSystemPrompt } from './prompt';
import { COURSE_LIMITS, CourseRequestError } from './validation';
import { emptyShiftRecord, recordNextRequest, recordShiftRun, runNextRequest, runShift, validateShiftMapping, validateShiftWorkflow, type ShiftAction, type ShiftRunActivity } from './shift-run';
import { asksAboutUnsharedShiftResult, readShiftCoachSession, SHIFT_TRACE_NOT_SHARED, shiftCoachContext, shiftCoachExport, shiftCoachRequest, shiftCoachStorageIdentity, validateShiftCoachAnswer, validateShiftCoachRequest, validateShiftCoachSelection, writtenShiftCoachAnswer, type ShiftCoachPurpose, type ShiftCoachSession } from './shift-coach';
import { SHIFT_DIAGNOSTIC_RULES } from './shift-coach-model';

const a = activities.find(value => value.unit === 4) as unknown as ShiftRunActivity;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const explanation = 'I think the human review kept a promise from leaving.';
function input() {
  const workflow = a.fixtures.safe!.workflow, steps = validateShiftWorkflow(workflow);
  const action = (type: ShiftAction['type'], step: number, extra = {}): ShiftAction => ({ type, quote: steps[step - 1], ...extra }) as ShiftAction;
  const mapping = validateShiftMapping([
    { step: 1, actions: [action('intake', 1), action('ask_missing_fact', 1, { when: 'if_missing_fact' })] },
    { step: 2, actions: [action('find_source', 2), action('check_conditions', 2)] },
    { step: 3, actions: [action('ai_draft', 3, { ai_draft: { states_conditions: true, forbids_promises: true } })] },
    { step: 4, actions: [action('human_check', 4, { human_check: { checks: ['source', 'conditions', 'tone', 'next_step'] } })] },
    { step: 5, actions: [action('route_to_owner', 5, { when: 'if_held', route_to_owner: { only_if_held: true } }), action('acknowledge_customer', 5, { when: 'if_held' })] },
    { step: 6, actions: [action('release', 6, { when: 'if_not_held' })] },
  ], steps);
  return { workflow, mapping, classifiedBy: 'student' as const, acceptance: { confirmed: true as const, origin: 'student' as const, prediction: { text: 'PRIVATE-PREDICTION-DO-NOT-SHARE', confidence: 'low' as const } } };
}
function record() { return recordShiftRun(a, emptyShiftRecord(a), input()); }
function snapshot(purpose: ShiftCoachPurpose = 'trace') { return shiftCoachRequest(a, record(), 'run-1', explanation, 'Check the recorded action.', purpose); }
const usage = { inputTokens: { total: 11, noCache: 11, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 7, text: 7, reasoning: undefined } };
const unknownUsage = { inputTokens: { total: undefined, noCache: undefined, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: undefined, text: undefined, reasoning: undefined } };
const output = (value: unknown, tokens: Awaited<ReturnType<MockLanguageModelV3['doGenerate']>>['usage'] = usage) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value) }], finishReason: { unified: 'stop' as const, raw: 'stop' }, usage: tokens, warnings: [] });
const request = (body: unknown = { lesson: a.page, delivery: 'canvas', shiftCoach: snapshot() }, headers: Record<string, string> = {}, signal?: AbortSignal) => new Request('https://example.test/api/course-chat', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal });
function setup(value: unknown = { questionId: 'trace-A', learnerQuote: 'the human review' }, code?: string) {
  const model = new MockLanguageModelV3({ doGenerate: output(value) }); let resolutions = 0;
  const handler = createCourseChatHandler({ model: () => { resolutions++; return model; }, access: createCourseAccess({ perClient: 100, global: 100 }), config: () => ({ model: 'test/diagnostic', code }) });
  return { model, handler, resolutions: () => resolutions };
}

test('diagnostic sharing is minimal and strips proposal, prediction and unselected phases', () => {
  const first = input(), modelId = 'PRIVATE-PROPOSAL-DO-NOT-SHARE';
  const saved = recordShiftRun(a, emptyShiftRecord(a), { ...first, classifiedBy: 'ai', modelId, acceptance: { ...first.acceptance, origin: 'ai-proposal', proposal: { mapping: first.mapping, modelId } } });
  const shared = shiftCoachRequest(a, saved, 'run-1', explanation, '', 'trace');
  assert.deepEqual(Object.keys(shared).sort(), ['version', 'activityRevision', 'target', 'confirmed', 'workflow', 'mapping', 'explanation', 'revisionPlan', 'purpose'].sort());
  assert(!JSON.stringify(shared).includes('PRIVATE-')); assert(!JSON.stringify(shared).includes('result'));
  assert.throws(() => shiftCoachRequest(a, saved, 'run-2', explanation, '', 'trace'));
  assert.throws(() => shiftCoachRequest(a, saved, 'C', explanation, '', 'trace'));
  const missing = clone(saved); delete missing.runs[0].acceptance;
  assert.throws(() => shiftCoachRequest(a, missing, 'run-1', explanation, '', 'trace'));
});

test('only current confirmed snapshots, exact fields and bounded learner reasoning are accepted', () => {
  const good = snapshot(); assert.deepEqual(validateShiftCoachRequest(good, a), good);
  for (const bad of [null, [], { ...good, confirmed: false }, { ...good, purpose: 'grade' }, { ...good, target: 'exam' }, { ...good, explanation: ' ' }, { ...good, explanation: 'x'.repeat(1001) }, { ...good, revisionPlan: 'x'.repeat(201) }, { ...good, workflow: '' }, { ...good, mapping: [{ step: 1, actions: [{ type: 'intake', quote: 'not in workflow' }] }] }]) assert.throws(() => validateShiftCoachRequest(bad, a));
  for (const field of ['journal', 'prediction', 'proposal', 'messages', 'trace', 'results', 'grade']) assert.throws(() => validateShiftCoachRequest({ ...good, [field]: 'do not accept' }, a));
  assert.throws(() => validateShiftCoachRequest({ ...good, activityRevision: 2 }, a), error => error instanceof CourseRequestError && error.status === 409);
});

test('the server recomputes actual traces and cause text, never generic failure mechanisms', () => {
  const context = shiftCoachContext(a, snapshot()), actual = runShift(a, input().mapping).results;
  assert.deepEqual(context.cases.map(card => card.result.trace), actual.map(result => result.trace));
  assert.deepEqual(context.cases.map(card => card.result.explanation), actual.map(result => result.explanation));
  assert(context.cases[0].result.trace.some(event => event.type === 'human_check' && event.status === 'executed' && event.detail.includes('coverage is present')));
  assert(context.cases[0].result.trace.some(event => event.type === 'route_to_owner' && event.status === 'skipped'));
  assert(context.cases[1].result.trace.some(event => event.type === 'route_to_owner' && event.status === 'executed'));
  for (const card of context.questions) assert.equal(card.grounding, context.cases.find(item => card.id === `trace-${item.id}`)?.result.explanation);
});

test('A/B diagnostic context excludes unopened C and all worked-answer routes', () => {
  const context = shiftCoachContext(a, snapshot()), raw = JSON.stringify(context);
  assert.deepEqual(context.cases.map(card => card.id), ['A', 'B']);
  assert.deepEqual(context.sources.map(source => source.id).sort(), ['S2', 'S3', 'S6']);
  assert(!raw.includes(a.cases.find(card => card.id === 'C')!.request)); assert(!raw.includes('trace-C')); assert(!raw.includes('workedRoutes')); assert(!raw.includes('fixtures'));
  const two = recordShiftRun(a, record(), { ...input(), reason: 'Keep the reviewed route.' });
  assert.throws(() => shiftCoachRequest(a, two, 'C', explanation, '', 'trace'));
  const next = recordNextRequest(a, two), c = shiftCoachContext(a, shiftCoachRequest(a, next, 'C', explanation, '', 'trace'));
  assert.deepEqual(c.cases.map(card => card.id), ['C']); assert.deepEqual(c.cases[0].result.trace, runNextRequest(a, input().mapping).trace);
  assert.deepEqual(c.sources.map(source => source.id).sort(), ['S2', 'S4', 'S6']); assert(!JSON.stringify(c).includes(a.cases[0].request));
});

test('every focus has an authored no-AI question, with visible step or source grounding', () => {
  for (const purpose of ['trace', 'interpretation', 'source'] as const) {
    const context = shiftCoachContext(a, snapshot(purpose)), answer = writtenShiftCoachAnswer(context);
    assert.equal(answer.selectedBy, 'written'); assert.equal(answer.learnerQuote, ''); assert.equal(answer.question.purpose, purpose); assert(answer.question.grounding);
    assert.deepEqual(validateShiftCoachAnswer(answer, context), answer);
  }
  assert(shiftCoachContext(a, snapshot('source')).questions.some(card => card.id === 'source-S6'));
});

test('selection cannot invent a cause, question, later case or learner quote', () => {
  const context = shiftCoachContext(a, snapshot());
  for (const bad of [{ questionId: 'trace-C', learnerQuote: 'the human review' }, { questionId: 'trace-A', learnerQuote: 'I forgot to review' }, { questionId: 'trace-A', learnerQuote: '' }, { questionId: 'trace-A', learnerQuote: 'the human review', cause: 'Your check happened too late' }]) assert.throws(() => validateShiftCoachSelection(bad, context));
  assert.deepEqual(validateShiftCoachSelection({ questionId: 'trace-A', learnerQuote: 'the human review' }, context), { question: context.questions[0], learnerQuote: 'the human review' });
});

test('one structured SDK call chooses an authored card; no model-written mechanism is returned', async () => {
  const { model, handler } = setup(), response = await handler(request());
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json(), context = shiftCoachContext(a, snapshot());
  assert.deepEqual(body.question, context.questions[0]); assert.equal(body.learnerQuote, 'the human review'); assert.equal(body.modelId, 'test/diagnostic');
  assert.deepEqual(body.usage, { inputTokens: 11, outputTokens: 7, totalTokens: 18 }); assert.equal(model.doGenerateCalls.length, 1);
  const call = model.doGenerateCalls[0]; assert.equal(call.responseFormat?.type, 'json'); assert.equal(call.maxOutputTokens, 300); assert.equal(call.prompt[0].content, SHIFT_DIAGNOSTIC_RULES); assert(call.abortSignal instanceof AbortSignal);
  const prompt = JSON.stringify(call.prompt); assert(prompt.includes('acceptedInterpretationHypothesis')); assert(prompt.includes('serverRecomputedCases')); assert(!prompt.includes('PRIVATE-')); assert(!prompt.includes(a.cases[2].request));
  assert.match(SHIFT_DIAGNOSTIC_RULES, /not proof/); assert.match(SHIFT_DIAGNOSTIC_RULES, /do not generate/); assert.deepEqual(validateShiftCoachAnswer(body, context), body);
});

test('unknown measured usage remains null', async () => {
  const model = new MockLanguageModelV3({ doGenerate: output({ questionId: 'trace-A', learnerQuote: 'the human review' }, unknownUsage) });
  const handler = createCourseChatHandler({ model: () => model, access: createCourseAccess(), config: () => ({ model: 'test/diagnostic' }) });
  assert.deepEqual((await (await handler(request())).json()).usage, { inputTokens: null, outputTokens: null, totalTokens: null });
});

test('sharing mode rejects additional messages, journal, client traces, stale revisions and wrong lessons before a model is resolved', async () => {
  const { handler, resolutions } = setup();
  for (const body of [{ lesson: a.page, shiftCoach: snapshot(), messages: [] }, { lesson: a.page, shiftCoach: snapshot(), journal: 'secret' }, { lesson: a.page, shiftCoach: { ...snapshot(), trace: 'invented' } }, { lesson: 'unit-05.html', shiftCoach: snapshot() }, { lesson: a.page, delivery: 'standalone', shiftCoach: snapshot() }]) assert.equal((await handler(request(body))).status, 400);
  assert.equal((await handler(request({ lesson: a.page, shiftCoach: { ...snapshot(), activityRevision: 2 } }))).status, 409); assert.equal(resolutions(), 0);
});

test('same endpoint keeps origin, code, lease and actual byte guards for diagnostic mode', async () => {
  const { handler, model, resolutions } = setup(undefined, 'private-access-code');
  assert.equal((await handler(request(undefined, { origin: 'https://evil.example', 'x-course-code': 'private-access-code' }))).status, 403);
  assert.equal((await handler(request())).status, 401); assert.equal(resolutions(), 0);
  const huge = new Request('https://example.test/api/course-chat', { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '1', 'x-course-code': 'private-access-code' }, body: JSON.stringify({ lesson: a.page, shiftCoach: snapshot(), junk: '短'.repeat(COURSE_LIMITS.bodyBytes) }) });
  assert.equal((await handler(huge)).status, 413); assert.equal(model.doGenerateCalls.length, 0);
  assert.equal((await handler(request(undefined, { origin: 'https://example.test', 'x-course-code': 'private-access-code' }))).status, 200);
  const limited = createCourseChatHandler({ model: () => model, access: createCourseAccess({ perClient: 1 }), config: () => ({ model: 'test/diagnostic' }) });
  assert.equal((await limited(request())).status, 200); const denied = await limited(request()); assert.equal(denied.status, 429); assert.equal(denied.headers.get('retry-after'), '600');
});

test('invalid model selection and fabricated learner quote fail once without a repair call', async () => {
  for (const value of [{ questionId: 'trace-C', learnerQuote: 'the human review' }, { questionId: 'trace-A', learnerQuote: 'fabricated learner error' }, { questionId: 'trace-A', learnerQuote: 'the human review', cause: 'wrong mechanism' }]) {
    const { handler, model } = setup(value), response = await handler(request());
    assert.equal(response.status, 422); assert(!JSON.stringify(await response.json()).includes('wrong mechanism')); assert.equal(model.doGenerateCalls.length, 1);
  }
});

test('provider errors are sanitized, are not retried, and leave the authored question available', async () => {
  const model = new MockLanguageModelV3({ doGenerate: async () => { throw new APICallError({ message: 'private-provider-error', url: 'https://private.invalid', requestBodyValues: { secret: 'student-data' }, statusCode: 503, isRetryable: true }); } });
  const handler = createCourseChatHandler({ model: () => model, access: createCourseAccess(), config: () => ({ model: 'test/diagnostic' }) });
  const response = await handler(request()); assert.equal(response.status, 503); assert(!JSON.stringify(await response.json()).includes('private-provider-error')); assert.equal(model.doGenerateCalls.length, 1);
  assert(writtenShiftCoachAnswer(shiftCoachContext(a, snapshot())).question.question);
});

test('abort releases the shared lease even when a model ignores its signal', async () => {
  const controller = new AbortController(), access = createCourseAccess({ concurrent: 1 });
  const model = new MockLanguageModelV3({ doGenerate: () => new Promise(() => {}) });
  const handler = createCourseChatHandler({ model: () => model, access, config: () => ({ model: 'test/diagnostic' }) });
  const pending = handler(request(undefined, {}, controller.signal));
  const keepAlive = setTimeout(() => controller.abort(), 10);
  const response = await pending; clearTimeout(keepAlive); assert.equal(response.status, 499); assert.equal(model.doGenerateCalls.length, 1);
  const lease = access.acquire('after-abort'); assert(lease); lease();
});

test('generic course questions cannot diagnose a Unit 4 run without a deliberately shared snapshot', async () => {
  const { handler, resolutions } = setup();
  for (const question of ['Why did my rehearsal fail even though I checked S6?', 'Explain why this workflow was held.', 'What went wrong with Request B?']) {
    const body = { lesson: a.page, messages: [{ role: 'user', parts: [{ type: 'text', text: question }] }] };
    const response = await handler(request(body)); assert.equal(response.status, 200); assert((await response.text()).includes(SHIFT_TRACE_NOT_SHARED));
  }
  assert.equal(resolutions(), 0);
  assert(!asksAboutUnsharedShiftResult(a.page, 'Why should a person check a reply before it leaves the service?'));
  assert(!asksAboutUnsharedShiftResult('unit-05.html', 'Why did my workflow fail?'));
  const prompt = buildCourseSystemPrompt([], a.page, true);
  assert.match(prompt, /no learner-confirmed workflow interpretation or actual execution trace/); assert.match(prompt, /Do not diagnose a run-specific cause/); assert.match(prompt, /not automatically included/);
  assert(!buildCourseSystemPrompt([], 'unit-05.html').includes('UNIT 4 EXECUTION BOUNDARY'));
});

test('the local request budget survives focus/reasoning edits and preserved records cannot inject advice', () => {
  const shared = snapshot(), context = shiftCoachContext(a, shared), identity = shiftCoachStorageIdentity(a, shared);
  for (const changed of [{ ...shared, purpose: 'source' as const }, { ...shared, explanation: 'My revised explanation.', revisionPlan: 'A later plan.' }]) assert.deepEqual(shiftCoachStorageIdentity(a, changed), identity);
  assert.notEqual(shiftCoachStorageIdentity(a, { ...shared, target: 'run-2' }).key, identity.key);
  const answer = { version: 1 as const, selectedBy: 'ai' as const, question: context.questions[0], learnerQuote: 'the human review', modelId: 'test/diagnostic', usage: { inputTokens: null, outputTokens: null, totalTokens: null } };
  const saved: ShiftCoachSession = { version: 1, signature: identity.signature, request: shared, status: 'complete', answer };
  assert.deepEqual(readShiftCoachSession(JSON.stringify(saved), a, identity).session, saved);
  for (const invalid of [{ ...saved, signature: 'different snapshot' }, { ...saved, answer: { ...answer, question: { ...answer.question, grounding: 'Invented engine cause' } } }, { ...saved, request: { ...shared, journal: 'private' } }, { ...saved, answer: { ...answer, usage: { inputTokens: -1, outputTokens: null, totalTokens: null } } }]) {
    const raw = JSON.stringify(invalid), parsed = readShiftCoachSession(raw, a, identity); assert.equal(parsed.session, null); assert.equal(parsed.preservedRaw, raw);
  }
  assert.equal(readShiftCoachSession('older unrecognized text', a, identity).preservedRaw, 'older unrecognized text');
  const exported = shiftCoachExport(a, shared, answer); assert(exported.includes(shared.explanation)); assert(exported.includes(shared.workflow)); assert(exported.includes(answer.question.question)); assert(exported.includes('not a grade')); assert(!exported.includes('PRIVATE-'));
});
