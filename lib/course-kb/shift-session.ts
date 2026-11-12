/** Browser-only Unit 4 draft state. Interpretation remains editable until an explicit confirmation. */
import { emptyShiftRecord, recordShiftRun, validateShiftMapping, validateShiftMappingDraft, validateShiftRecord, validateShiftWorkflow, type ShiftMapping, type ShiftProposal, type ShiftRecord, type ShiftRunActivity, type ShiftUsage } from './shift-run';
import { emptyShiftPractice, optionalShiftPrediction, validateShiftPractice, validateShiftPrediction, type ShiftPractice, type ShiftPredictionDraft } from './shift-practice';
export type ShiftMappingDraft = { workflow: string; reason: string; mapping: ShiftMapping; reviewed: number[]; origin: 'ai-proposal' | 'student'; proposal: ShiftProposal | null; prediction: ShiftPredictionDraft };
export type ShiftSession = { version: 2; mode: 'shift-run'; activityRevision: number; page: string; record: ShiftRecord; workflow: string; reason: string; draft: ShiftMappingDraft | null; aiAttempted: (1 | 2)[]; practice: ShiftPractice };
export const SHIFT_SESSION_MAX_BYTES = 256 * 1024;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function exact(value: Record<string, unknown>, fields: readonly string[], optional: readonly string[] = []) { if (Object.keys(value).some(key => !fields.includes(key) && !optional.includes(key)) || !fields.every(key => Object.hasOwn(value, key))) throw new Error('Unfamiliar workflow draft fields.'); }
export function blankShiftSession(activity: ShiftRunActivity): ShiftSession {
  return { version: 2, mode: 'shift-run', activityRevision: activity.activityRevision, page: activity.page, record: emptyShiftRecord(activity), workflow: '', reason: '', draft: null, aiAttempted: [], practice: emptyShiftPractice(activity) };
}
function tokenUsage(value: unknown): ShiftUsage | null | undefined {
  if (value === null || value === undefined) return value;
  if (!object(value)) throw new Error('Unrecognized model usage.');
  exact(value, ['inputTokens', 'outputTokens', 'totalTokens']);
  if (Object.values(value).some(number => number !== null && (typeof number !== 'number' || !Number.isSafeInteger(number) || number < 0))) throw new Error('Unrecognized model usage.');
  return { inputTokens: value.inputTokens as number | null, outputTokens: value.outputTokens as number | null, totalTokens: value.totalTokens as number | null };
}
function proposal(value: unknown, steps: string[]): ShiftProposal {
  if (!object(value)) throw new Error('The AI proposal could not be read.');
  exact(value, ['mapping', 'modelId'], ['usage']);
  if (typeof value.modelId !== 'string' || !value.modelId.trim() || value.modelId.length > 200) throw new Error('The AI proposal needs its original model identifier.');
  const usage = tokenUsage(value.usage);
  return { mapping: validateShiftMapping(value.mapping, steps), modelId: value.modelId, ...(usage !== undefined ? { usage } : {}) };
}
export function validateShiftDraft(value: unknown): ShiftMappingDraft {
  if (!object(value)) throw new Error('The editable interpretation could not be read.');
  exact(value, ['workflow', 'reason', 'mapping', 'reviewed', 'origin', 'proposal', 'prediction']);
  const steps = validateShiftWorkflow(value.workflow);
  if (typeof value.reason !== 'string' || value.reason.length > 200 || !['student', 'ai-proposal'].includes(value.origin as string) || !Array.isArray(value.reviewed) || value.reviewed.some(line => !Number.isInteger(line) || line < 1 || line > steps.length) || new Set(value.reviewed).size !== value.reviewed.length) throw new Error('The editable interpretation has invalid bounds.');
  const original = value.proposal === null ? null : proposal(value.proposal, steps);
  if ((value.origin === 'ai-proposal') !== (original !== null)) throw new Error('Keep the interpretation’s original proposal provenance.');
  return { workflow: value.workflow as string, reason: value.reason, mapping: validateShiftMappingDraft(value.mapping, steps), reviewed: [...value.reviewed] as number[], origin: value.origin as ShiftMappingDraft['origin'], proposal: original, prediction: validateShiftPrediction(value.prediction, false) };
}
export function newShiftDraft(session: ShiftSession): ShiftMappingDraft {
  if (session.record.runs.length >= 2 || (session.record.runs.length === 1 && !session.practice.responses['run-1']?.committed)) throw new Error('Explain the previous run before preparing the next version.');
  const steps = validateShiftWorkflow(session.workflow);
  if (session.record.runs.length === 1 && !session.reason.trim()) throw new Error('Record what you will change or keep before version 2.');
  return { workflow: session.workflow, reason: session.reason, mapping: steps.map((_, index) => ({ step: index + 1, actions: [] })), reviewed: [], origin: 'student', proposal: null, prediction: { text: '', confidence: '' } };
}
/** Receiving an AI proposal only opens the shared editor. It does not execute a case. */
export function addShiftProposal(draft: ShiftMappingDraft, value: unknown): ShiftMappingDraft {
  const original = proposal(value, validateShiftWorkflow(draft.workflow));
  return { ...draft, origin: 'ai-proposal', proposal: original, mapping: JSON.parse(JSON.stringify(original.mapping)) as ShiftMapping, reviewed: [] };
}
export function validateShiftSession(value: unknown, activity: ShiftRunActivity): ShiftSession {
  if (!object(value)) throw new Error('The saved episode could not be read.');
  exact(value, ['version', 'mode', 'activityRevision', 'page', 'record', 'workflow', 'reason', 'draft', 'aiAttempted', 'practice']);
  if (value.version !== 2 || value.mode !== 'shift-run' || value.activityRevision !== activity.activityRevision || value.page !== activity.page || typeof value.workflow !== 'string' || value.workflow.length > 1200 || typeof value.reason !== 'string' || value.reason.length > 200 || !Array.isArray(value.aiAttempted) || value.aiAttempted.length > 2 || value.aiAttempted.some(slot => slot !== 1 && slot !== 2) || new Set(value.aiAttempted).size !== value.aiAttempted.length) throw new Error('The saved episode is for another activity or has invalid bounds.');
  const record = validateShiftRecord(value.record, activity), practice = validateShiftPractice(value.practice, activity, record), draft = value.draft === null ? null : validateShiftDraft(value.draft);
  if (draft && (record.runs.length >= 2 || draft.workflow !== value.workflow || draft.reason !== value.reason)) throw new Error('Keep the editable interpretation attached to its original workflow version.');
  const result: ShiftSession = { version: 2, mode: 'shift-run', activityRevision: activity.activityRevision, page: activity.page, record, workflow: value.workflow, reason: value.reason, draft, aiAttempted: [...value.aiAttempted] as (1 | 2)[], practice };
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > SHIFT_SESSION_MAX_BYTES) throw new Error('This local episode is too large to save.');
  return result;
}
export function readShiftSession(raw: string | null, activity: ShiftRunActivity): { session: ShiftSession; unrecognized: string | null } {
  if (raw === null) return { session: blankShiftSession(activity), unrecognized: null };
  try {
    if (new TextEncoder().encode(raw).byteLength > SHIFT_SESSION_MAX_BYTES) throw new Error('Oversized local episode');
    const parsed: unknown = JSON.parse(raw);
    if (JSON.stringify(parsed) !== raw) throw new Error('Unfamiliar saved serialization');
    return { session: validateShiftSession(parsed, activity), unrecognized: null };
  } catch { return { session: blankShiftSession(activity), unrecognized: raw }; }
}
export function confirmShiftDraft(activity: ShiftRunActivity, session: ShiftSession, confirmed: boolean): ShiftSession {
  if (!confirmed || !session.draft) throw new Error('Inspect and explicitly confirm the interpretation before running.');
  const draft = validateShiftDraft(session.draft), steps = validateShiftWorkflow(draft.workflow);
  if (draft.reviewed.length !== steps.length || steps.some((_, index) => !draft.reviewed.includes(index + 1))) throw new Error('Review each line before confirming its interpretation.');
  if (session.record.runs.length === 1 && !session.practice.responses['run-1']?.committed) throw new Error('Keep your explanation of run 1 before revising.');
  const prediction = optionalShiftPrediction(draft.prediction);
  const mapping = validateShiftMapping(draft.mapping, steps);
  const record = recordShiftRun(activity, session.record, { workflow: draft.workflow, reason: draft.reason, mapping, classifiedBy: draft.origin === 'ai-proposal' ? 'ai' : 'student', ...(draft.proposal ? { modelId: draft.proposal.modelId, usage: draft.proposal.usage } : {}), acceptance: { confirmed: true, origin: draft.origin, ...(draft.proposal ? { proposal: draft.proposal } : {}), ...(prediction ? { prediction } : {}) } });
  return validateShiftSession({ ...session, record, draft: null }, activity);
}

/** Device-local cost guard: never start a proposal request if its attempt marker
 * cannot be saved. This is not an authenticated or distributed quota. */
export async function requestShiftProposalAfterMarker<T>(saveMarker: () => boolean, request: () => Promise<T>): Promise<{ started: false } | { started: true; value: T }> {
  if (!saveMarker()) return { started: false };
  return { started: true, value: await request() };
}
