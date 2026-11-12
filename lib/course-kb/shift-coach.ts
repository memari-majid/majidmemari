/** Bounded, opt-in diagnostic context. No network, identities, journals or grades. */
import { CourseRequestError } from './validation';
import { runNextRequest, runShift, SHIFT_ACTION_LABELS, SHIFT_CHECK_LABELS, SHIFT_GUARD_LABELS, validateShiftMapping, validateShiftWorkflow, type ShiftCaseResult, type ShiftMapping, type ShiftRecord, type ShiftRunActivity } from './shift-run';

export const SHIFT_COACH_PURPOSES = ['trace', 'interpretation', 'source'] as const;
export type ShiftCoachPurpose = typeof SHIFT_COACH_PURPOSES[number];
export type ShiftCoachTarget = 'run-1' | 'run-2' | 'C';
export type ShiftCoachRequest = {
  version: 1; activityRevision: number; target: ShiftCoachTarget; confirmed: true;
  workflow: string; mapping: ShiftMapping; explanation: string; revisionPlan: string; purpose: ShiftCoachPurpose;
};
export type ShiftCoachQuestion = { id: string; purpose: ShiftCoachPurpose; heading: string; grounding: string; question: string; sourceIds: string[] };
type VisibleTrace = { step: number; action: number; type: string; when: string; status: string; detail: string };
type TracedResult = ShiftCaseResult & { trace?: readonly VisibleTrace[]; explanation?: string };
export type ShiftCoachContext = {
  request: ShiftCoachRequest;
  cases: { id: string; request: string; result: { consequence: string; explanation: string; path: string; sent: boolean; ownerRouted: boolean; trace: readonly VisibleTrace[] } }[];
  sources: { id: string; label: string; text: string }[];
  questions: ShiftCoachQuestion[];
};
export type ShiftCoachAnswer = {
  version: 1; selectedBy: 'ai' | 'written'; question: ShiftCoachQuestion; learnerQuote: string;
  modelId?: string; usage?: { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null };
};
export const SHIFT_TRACE_NOT_SHARED = 'I have not received the accepted workflow interpretation or its execution trace in this course question, so I cannot tell which action produced your result. Return to the recorded rehearsal, write your own explanation, and use its optional diagnostic question to choose whether to share that confirmed interpretation and visible trace. Your reflection journal is not included. You can also compare the accepted action wording with the recorded execution and approved source without AI.';
export function asksAboutUnsharedShiftResult(page: string, question: string): boolean {
  return page === 'unit-04.html' && /\b(?:why|explain|what happened|what went wrong|what.*wrong)\b/i.test(question)
    && /\b(?:my|this|that)\b[^?\n]{0,100}\b(?:workflow|run|rehearsal|result|reply|interpretation)\b|\b(?:false confirmation|unreviewed|unchecked|routed|held)\b|\b(?:request|case)\s*[ABC]\b/i.test(question);
}
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
function invalid(message = 'Share a current confirmed workflow and your own explanation before requesting a diagnostic question.'): never { throw new CourseRequestError(400, message); }

/** This validates a declared practice snapshot, not an authenticated UI history.
 * Every consequence/trace is independently recomputed; client outcomes are not accepted. */
export function validateShiftCoachRequest(value: unknown, a: ShiftRunActivity): ShiftCoachRequest {
  const fields = ['version', 'activityRevision', 'target', 'confirmed', 'workflow', 'mapping', 'explanation', 'revisionPlan', 'purpose'];
  if (!object(value) || Object.keys(value).length !== fields.length || fields.some(key => !Object.hasOwn(value, key))) invalid();
  if (a.mode !== 'shift-run' || a.unit !== 4 || a.activityRevision < 3 || value.version !== 1 || value.activityRevision !== a.activityRevision) throw new CourseRequestError(409, 'This rehearsal changed. Reopen the current activity before sharing a confirmed interpretation.');
  if (!['run-1', 'run-2', 'C'].includes(value.target as string) || value.confirmed !== true || !SHIFT_COACH_PURPOSES.includes(value.purpose as ShiftCoachPurpose)) invalid();
  if (typeof value.explanation !== 'string' || !value.explanation.trim() || value.explanation.length > 1000 || typeof value.revisionPlan !== 'string' || value.revisionPlan.length > 200) invalid('Write your own explanation within 1,000 characters and keep the next-step plan within 200.');
  try {
    const steps = validateShiftWorkflow(value.workflow), mapping = validateShiftMapping(value.mapping, steps);
    return { version: 1, activityRevision: a.activityRevision, target: value.target as ShiftCoachTarget, confirmed: true, workflow: value.workflow as string, mapping, explanation: value.explanation, revisionPlan: value.revisionPlan, purpose: value.purpose as ShiftCoachPurpose };
  } catch { invalid('The accepted interpretation no longer matches the supplied workflow. Reopen the current rehearsal.'); }
}

export function shiftCoachRequest(a: ShiftRunActivity, record: ShiftRecord, target: ShiftCoachTarget, explanation: string, revisionPlan: string, purpose: ShiftCoachPurpose): ShiftCoachRequest {
  const index = target === 'run-1' ? 0 : 1, run = record.runs[index];
  if (!run || !run.acceptance?.confirmed || (target === 'C' && !record.nextRequest)) invalid('Open and finish this confirmed rehearsal before asking about its visible result.');
  return validateShiftCoachRequest({ version: 1, activityRevision: a.activityRevision, target, confirmed: true, workflow: run.workflow, mapping: run.mapping, explanation, revisionPlan, purpose }, a);
}

export function shiftCoachContext(a: ShiftRunActivity, value: unknown): ShiftCoachContext {
  const request = validateShiftCoachRequest(value, a);
  const results: TracedResult[] = request.target === 'C' ? [runNextRequest(a, request.mapping)] : runShift(a, request.mapping).results;
  const cases = results.map(result => {
    const card = a.cases.find(c => c.id === result.caseId);
    if (!card || !result.trace || !result.explanation) invalid('This rehearsal needs its current execution trace before the companion can discuss a cause. Use the written explanation for now.');
    return { id: card.id, request: card.request, result: { consequence: a.consequences[result.consequenceId].label, explanation: result.explanation, path: result.path, sent: result.sent, ownerRouted: result.ownerRouted, trace: result.trace.map(({ step, action, type, when, status, detail }) => ({ step, action, type, when, status, detail })) } };
  });
  const sourceIds = new Set(['S6', ...cases.flatMap(c => { const policy = a.cases.find(item => item.id === c.id)?.policy; return policy ? [policy] : []; }), ...(request.target === 'C' ? ['S4'] : [])]);
  const sources = a.setting.sources.filter(source => sourceIds.has(source.id));
  let questions: ShiftCoachQuestion[];
  if (request.purpose === 'interpretation') questions = request.mapping.map(line => ({
    id: `interpretation-${line.step}`, purpose: 'interpretation', heading: `Accepted reading · step ${line.step}`,
    grounding: line.actions.length ? line.actions.map(action => `${SHIFT_ACTION_LABELS[action.type]} — ${SHIFT_GUARD_LABELS[action.when ?? 'always']}. “${action.quote}”${action.type === 'human_check' ? ` Review: ${action.human_check.checks.map(check => SHIFT_CHECK_LABELS[check]).join(', ') || 'none named'}.` : action.type === 'ai_draft' ? ` State conditions: ${action.ai_draft.states_conditions ? 'yes' : 'no'}; forbid unsupported promises: ${action.ai_draft.forbids_promises ? 'yes' : 'no'}.` : action.type === 'route_to_owner' ? ` Only held work: ${action.route_to_owner.only_if_held ? 'yes' : 'no'}.` : ''}`).join('\n') : 'No supported action was accepted for this line.',
    question: `At step ${line.step}, which words support the accepted interpretation, and what would you clarify if it differs from your intent?`, sourceIds: [],
  }));
  else if (request.purpose === 'source') questions = sources.map(source => ({
    id: `source-${source.id}`, purpose: 'source', heading: source.label, grounding: source.text,
    question: `Which condition in ${source.id} supports your explanation, and what fact would you check before the next action?`, sourceIds: [source.id],
  }));
  else questions = cases.map(card => ({
    id: `trace-${card.id}`, purpose: 'trace', heading: `Request ${card.id} · recorded execution`,
    grounding: card.result.explanation,
    question: `For request ${card.id}, which recorded action supports or challenges the next step in your explanation?`, sourceIds: [...new Set(['S6', a.cases.find(c => c.id === card.id)?.policy].filter((id): id is string => !!id))],
  }));
  const context = { request, cases, sources, questions };
  if (!questions.length || JSON.stringify(context).length > 28000) invalid('This explanation is too large for a bounded diagnostic question. Use the written source and trace to review it.');
  return context;
}

export function writtenShiftCoachAnswer(context: ShiftCoachContext): ShiftCoachAnswer {
  return { version: 1, selectedBy: 'written', question: context.questions[0], learnerQuote: '' };
}

export function validateShiftCoachSelection(value: unknown, context: ShiftCoachContext): Pick<ShiftCoachAnswer, 'question' | 'learnerQuote'> {
  if (!object(value) || Object.keys(value).length !== 2 || !Object.hasOwn(value, 'questionId') || !Object.hasOwn(value, 'learnerQuote')) invalid('The diagnostic focus could not be checked. Use the written question instead.');
  const question = context.questions.find(card => card.id === value.questionId);
  if (!question || typeof value.learnerQuote !== 'string' || !value.learnerQuote.trim() || value.learnerQuote.length > 160 || !context.request.explanation.includes(value.learnerQuote)) invalid('The diagnostic focus could not be checked. Use the written question instead.');
  return { question, learnerQuote: value.learnerQuote };
}

/** Rebuild the answer from authored cards; never display stored/model-written causes. */
export function validateShiftCoachAnswer(value: unknown, context: ShiftCoachContext): ShiftCoachAnswer {
  if (!object(value) || value.version !== 1 || !object(value.question)) invalid('The diagnostic question could not be checked. Use the written question.');
  const selectedBy = value.selectedBy;
  const fields = selectedBy === 'ai' ? ['version', 'selectedBy', 'question', 'learnerQuote', 'modelId', 'usage'] : ['version', 'selectedBy', 'question', 'learnerQuote'];
  if (!['ai', 'written'].includes(selectedBy as string) || Object.keys(value).length !== fields.length || fields.some(key => !Object.hasOwn(value, key))) invalid();
  const question = context.questions.find(card => card.id === (value.question as Record<string, unknown>).id);
  if (!question || JSON.stringify(question) !== JSON.stringify(value.question)) invalid('The diagnostic question does not match the current authored route.');
  if (selectedBy === 'written') {
    if (value.learnerQuote !== '') invalid();
    return { version: 1, selectedBy, question, learnerQuote: '' };
  }
  const selected = validateShiftCoachSelection({ questionId: question.id, learnerQuote: value.learnerQuote }, context);
  if (typeof value.modelId !== 'string' || !value.modelId.trim() || value.modelId.length > 120 || !object(value.usage) || Object.keys(value.usage).sort().join(',') !== 'inputTokens,outputTokens,totalTokens') invalid();
  const counts = value.usage as Record<string, unknown>;
  if (Object.values(counts).some(count => count !== null && (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0))) invalid();
  return { version: 1, selectedBy: 'ai', ...selected, modelId: value.modelId, usage: counts as NonNullable<ShiftCoachAnswer['usage']> };
}

export type ShiftCoachSession = { version: 1; signature: string; request: ShiftCoachRequest; status: 'attempted' | 'access-denied' | 'complete'; answer?: ShiftCoachAnswer };
export function readShiftCoachSession(raw: string | null, a: ShiftRunActivity, identity: ReturnType<typeof shiftCoachStorageIdentity>): { session: ShiftCoachSession | null; preservedRaw: string | null } {
  if (raw === null) return { session: null, preservedRaw: null };
  try {
    if (raw.length > 80000) throw new Error('Oversized local record');
    const value: unknown = JSON.parse(raw);
    if (!object(value) || value.version !== 1 || value.signature !== identity.signature || !['attempted', 'access-denied', 'complete'].includes(value.status as string)) throw new Error('Unrecognized local record');
    const fields = value.status === 'complete' ? ['version', 'signature', 'request', 'status', 'answer'] : ['version', 'signature', 'request', 'status'];
    if (Object.keys(value).length !== fields.length || fields.some(key => !Object.hasOwn(value, key))) throw new Error('Unrecognized local fields');
    const context = shiftCoachContext(a, value.request);
    if (shiftCoachStorageIdentity(a, context.request).signature !== identity.signature) throw new Error('Different practice snapshot');
    const answer = value.status === 'complete' ? validateShiftCoachAnswer(value.answer, context) : undefined;
    if (answer && answer.selectedBy !== 'ai') throw new Error('Unexpected completion');
    return { session: { version: 1, signature: identity.signature, request: context.request, status: value.status as ShiftCoachSession['status'], ...(answer ? { answer } : {}) }, preservedRaw: null };
  } catch { return { session: null, preservedRaw: raw }; }
}

/** Local content key only. It is not a learner identifier or a security boundary.
 * Exclude purpose/explanation so editing them cannot buy another call for this run. */
export function shiftCoachStorageIdentity(a: ShiftRunActivity, request: ShiftCoachRequest) {
  const signature = JSON.stringify({ activityRevision: a.activityRevision, target: request.target, workflow: request.workflow, mapping: request.mapping });
  let first = 2166136261, second = 5381;
  for (let i = 0; i < signature.length; i++) { first = Math.imul(first ^ signature.charCodeAt(i), 16777619); second = Math.imul(second, 33) ^ signature.charCodeAt(i); }
  return { key: `course-shift-diagnostic:v1:${a.page}:${(first >>> 0).toString(16)}${(second >>> 0).toString(16)}`, signature };
}

export function shiftCoachExport(a: ShiftRunActivity, request: ShiftCoachRequest, answer: ShiftCoachAnswer): string {
  return [a.stamp, 'Diagnostic practice — not a grade, user test or research submission.', `Visible rehearsal: ${request.target}`, 'Accepted interpretation is a learner-confirmed hypothesis, not verified intent.', request.workflow, `My explanation: ${request.explanation}`, `My next step: ${request.revisionPlan || 'Not recorded'}`, answer.selectedBy === 'ai' ? `AI selected one authored question (${answer.modelId ?? 'model not recorded'}).` : 'Written diagnostic route; no AI call.', answer.learnerQuote ? `Words in focus: ${answer.learnerQuote}` : '', answer.question.heading, answer.question.grounding, answer.question.question].filter(Boolean).join('\n\n');
}
