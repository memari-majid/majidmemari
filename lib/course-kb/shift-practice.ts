/** Local Unit 4 reasoning prompts. These custom practice records are not research data or grades. */
import type { ShiftRecord, ShiftRunActivity } from './shift-run';
export const SHIFT_PRACTICE_VERSION = 'unit4-reasoning-v1';
export const SHIFT_PRACTICE_STAMP = 'Personal practice expectation and explanation — self-report, not a validated learning measure, grade, user test or research consent.';
export type ShiftPracticeTarget = 'run-1' | 'run-2' | 'C';
export type ShiftPrediction = { text: string; confidence: 'low' | 'medium' | 'high' };
export type ShiftPredictionDraft = { text: string; confidence: '' | ShiftPrediction['confidence'] };
export type ShiftExplanation = { explanation: string; revisionPlan: string };
export type ShiftExplanationDraft = ShiftExplanation & { committed: ShiftExplanation | null };
export type ShiftPractice = { version: typeof SHIFT_PRACTICE_VERSION; activityRevision: number; page: string; responses: Partial<Record<ShiftPracticeTarget, ShiftExplanationDraft>>; nextPredictionDraft: ShiftPredictionDraft; nextPrediction: ShiftPrediction | null };
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function exact(value: Record<string, unknown>, fields: readonly string[]) { if (Object.keys(value).length !== fields.length || !fields.every(field => Object.hasOwn(value, field))) throw new Error('Unfamiliar local reasoning fields.'); }
function text(value: unknown, max: number, required = false): string { if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error(`Keep the written response within ${max} characters${required ? ' and add your own reasoning' : ''}.`); return value; }
export function validateShiftPrediction(value: unknown, required = true): ShiftPredictionDraft {
  if (!object(value)) throw new Error('Record a short expectation and confidence before running.');
  exact(value, ['text', 'confidence']);
  const prediction = text(value.text, 500, required);
  if (!['low', 'medium', 'high', ...(required ? [] : [''])].includes(value.confidence as string)) throw new Error('Choose low, medium or high confidence for your prediction.');
  return { text: prediction, confidence: value.confidence as ShiftPredictionDraft['confidence'] };
}
/** Leaving both fields blank skips this optional prediction without a score. */
export function optionalShiftPrediction(value: unknown): ShiftPrediction | undefined {
  const draft = validateShiftPrediction(value, false);
  if (!draft.text.trim() && !draft.confidence) return undefined;
  return validateShiftPrediction(draft) as ShiftPrediction;
}
export function emptyShiftPractice(activity: ShiftRunActivity): ShiftPractice {
  return { version: SHIFT_PRACTICE_VERSION, activityRevision: activity.activityRevision, page: activity.page, responses: {}, nextPredictionDraft: { text: '', confidence: '' }, nextPrediction: null };
}
function targetAvailable(record: ShiftRecord, target: ShiftPracticeTarget): boolean { return target === 'C' ? !!record.nextRequest : record.runs.length >= (target === 'run-1' ? 1 : 2); }
export function validateShiftPractice(value: unknown, activity: ShiftRunActivity, record: ShiftRecord): ShiftPractice {
  if (!object(value)) throw new Error('The local reasoning record could not be read.');
  exact(value, ['version', 'activityRevision', 'page', 'responses', 'nextPredictionDraft', 'nextPrediction']);
  if (value.version !== SHIFT_PRACTICE_VERSION || value.activityRevision !== activity.activityRevision || value.page !== activity.page || !object(value.responses) || Object.keys(value.responses).some(key => !['run-1', 'run-2', 'C'].includes(key))) throw new Error('This reasoning record belongs to a different activity.');
  const responses: ShiftPractice['responses'] = {};
  for (const [key, draft] of Object.entries(value.responses)) {
    const target = key as ShiftPracticeTarget;
    if (!targetAvailable(record, target) || !object(draft)) throw new Error('Explain an existing confirmed run.');
    exact(draft, ['explanation', 'revisionPlan', 'committed']);
    const explanation = text(draft.explanation, 1000), revisionPlan = text(draft.revisionPlan, 200);
    let committed: ShiftExplanation | null = null;
    if (draft.committed !== null) {
      if (!object(draft.committed)) throw new Error('The committed explanation is invalid.');
      exact(draft.committed, ['explanation', 'revisionPlan']);
      committed = { explanation: text(draft.committed.explanation, 1000, true), revisionPlan: text(draft.committed.revisionPlan, 200, true) };
      if (committed.explanation !== explanation || committed.revisionPlan !== revisionPlan) throw new Error('Keep the original committed explanation unchanged.');
    }
    responses[target] = { explanation, revisionPlan, committed };
  }
  const nextPredictionDraft = validateShiftPrediction(value.nextPredictionDraft, false);
  let nextPrediction: ShiftPrediction | null = null;
  if (value.nextPrediction !== null) {
    if (!record.nextRequest) throw new Error('A frozen C prediction belongs to a completed new-request run.');
    nextPrediction = validateShiftPrediction(value.nextPrediction) as ShiftPrediction;
    if (nextPrediction.text !== nextPredictionDraft.text || nextPrediction.confidence !== nextPredictionDraft.confidence) throw new Error('Keep the original C prediction unchanged.');
  }
  if (record.nextRequest && !nextPrediction && (nextPredictionDraft.text.trim() || nextPredictionDraft.confidence)) throw new Error('Keep the skipped C prediction empty, or preserve its original frozen prediction.');
  return { version: SHIFT_PRACTICE_VERSION, activityRevision: activity.activityRevision, page: activity.page, responses, nextPredictionDraft, nextPrediction };
}
export function updateShiftExplanation(practice: ShiftPractice, target: ShiftPracticeTarget, value: ShiftExplanation, activity: ShiftRunActivity, record: ShiftRecord): ShiftPractice {
  if (!targetAvailable(record, target)) throw new Error('Run this case before explaining its consequences.');
  const current = practice.responses[target];
  if (current?.committed) throw new Error('Your original pre-feedback explanation is already saved.');
  const updated = { ...practice, responses: { ...practice.responses, [target]: { explanation: text(value.explanation, 1000), revisionPlan: text(value.revisionPlan, 200), committed: null } } };
  return validateShiftPractice(updated, activity, record);
}
export function commitShiftExplanation(practice: ShiftPractice, target: ShiftPracticeTarget, activity: ShiftRunActivity, record: ShiftRecord): ShiftPractice {
  const draft = practice.responses[target];
  if (!targetAvailable(record, target) || !draft) throw new Error('Write your own explanation and next step before saving.');
  if (draft.committed) throw new Error('The original explanation is already saved.');
  const committed = { explanation: text(draft.explanation, 1000, true), revisionPlan: text(draft.revisionPlan, 200, true) };
  return validateShiftPractice({ ...practice, responses: { ...practice.responses, [target]: { ...committed, committed } } }, activity, record);
}
export function exportShiftPractice(practice: ShiftPractice, activity: ShiftRunActivity, record: ShiftRecord): string {
  const valid = validateShiftPractice(practice, activity, record);
  return [SHIFT_PRACTICE_STAMP, 'Research collection is off. These are the learner’s own expectations and explanations, not checked performance or consent. No journal text is included.', JSON.stringify(valid, null, 2)].join('\n\n');
}
