/** Pure, bounded Cedar Desk rehearsal. No model, network, storage, or grading. */
export const SHIFT_ACTION_TYPES = ['intake', 'find_source', 'check_conditions', 'ask_missing_fact', 'ai_draft', 'human_check', 'route_to_owner', 'acknowledge_customer', 'release', 'confirm_change'] as const;
export type ShiftActionType = typeof SHIFT_ACTION_TYPES[number];
export type ShiftStepType = ShiftActionType;
export const SHIFT_CHECKS = ['source', 'conditions', 'tone', 'next_step', 'accuracy', 'commitments', 'confirmations'] as const;
export type ShiftCheck = typeof SHIFT_CHECKS[number];
export const SHIFT_GUARDS = ['always', 'if_missing_fact', 'if_exception', 'if_held', 'if_not_held', 'if_approved'] as const;
export type ShiftGuard = typeof SHIFT_GUARDS[number];
type SimpleType = Exclude<ShiftActionType, 'ai_draft' | 'human_check' | 'route_to_owner'>;
export type ShiftAction = ({ type: SimpleType; quote: string }
  | { type: 'ai_draft'; quote: string; ai_draft: { states_conditions: boolean; forbids_promises: boolean } }
  | { type: 'human_check'; quote: string; human_check: { checks: ShiftCheck[] } }
  | { type: 'route_to_owner'; quote: string; route_to_owner: { only_if_held: boolean } }) & { when?: ShiftGuard };
export const SHIFT_ACTION_LABELS: Record<ShiftActionType, string> = { intake: 'Read the incoming request', find_source: 'Consult an approved source', check_conditions: 'Check the deciding conditions', ask_missing_fact: 'Ask for a missing fact', ai_draft: 'Prepare an AI draft', human_check: 'Human review', route_to_owner: 'Route to the owner', acknowledge_customer: 'Acknowledge receipt to the customer', release: 'Release a reply', confirm_change: 'Claim that a change is confirmed' };
export const SHIFT_GUARD_LABELS: Record<ShiftGuard, string> = { always: 'Whenever this action is reached', if_missing_fact: 'Only if the deciding fact is missing', if_exception: 'Only if the policy requires an exception decision', if_held: 'Only if the case is held', if_not_held: 'Only if the case is not held', if_approved: 'Only after an authorized approval is supplied' };
export const SHIFT_CHECK_LABELS: Record<ShiftCheck, string> = { source: 'Approved source', conditions: 'Deciding conditions', tone: 'Tone', next_step: 'Next step and authority', accuracy: 'Accuracy against the approved source and conditions', commitments: 'Unsupported commitments', confirmations: 'Claims that an action already happened' };
export type ShiftMapping = { step: number; actions: ShiftAction[] }[];
export type ShiftCaseId = 'A' | 'B' | 'C';
export const SHIFT_CONSEQUENCE_IDS = ['sent_conditions', 'false_confirmation', 'unsupported_commitment', 'routine_escalated', 'held_no_owner', 'exception_acknowledged', 'routed_no_ack', 'unreceived_review', 'asked_missing_time', 'wrong_branch_sent', 'stopped', 'unreviewed_release', 'no_draft', 'source_missing'] as const;
export type ShiftConsequenceId = typeof SHIFT_CONSEQUENCE_IDS[number];
export type ShiftPath = 'sent' | 'routed' | 'held' | 'asked' | 'stopped';
export type ShiftConsequence = { label: string; tone: 'good' | 'warn' | 'bad'; path: ShiftPath; reaction: string; debrief: string; question: string };
export type ShiftRunActivity = {
  mode: 'shift-run'; unit: number; page: string; title: string; role: string; goal: string; activityRevision: number;
  stamp: string; exportStamp: string; projectQuestion?: string;
  setting: { ownerNote: string; sources: { id: string; label: string; text: string }[] };
  cases: { id: ShiftCaseId; sourceCase: number; request: string; received: string; policy: string; reactions?: Partial<Record<ShiftConsequenceId, string>> }[];
  drafts: Record<string, string>; consequences: Record<ShiftConsequenceId, ShiftConsequence>;
  fixtures: { v1: { workflow: string; mapping?: ShiftMapping }; v2: { workflow: string; reason: string; mapping?: ShiftMapping }; safe?: { workflow: string; mapping?: ShiftMapping } };
  workedRoutes?: { version: number; case: ShiftCaseId; consequence: ShiftConsequenceId }[];
};
export type ShiftUsage = { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null };
export type ShiftTraceEvent = { step: number; action: number; type: ShiftActionType; when: ShiftGuard; status: 'executed' | 'skipped'; detail: string };
export type ShiftCaseResult = { caseId: ShiftCaseId; draftId: string | null; consequenceId: ShiftConsequenceId; path: ShiftPath; triggerStep: number | null; sent: boolean; ownerRouted: boolean; trace?: ShiftTraceEvent[]; explanation?: string };
export type ShiftEpisodeResult = { results: ShiftCaseResult[]; tally: { sent: number; routed: number; held: number; asked: number; stopped: number } };
export type ShiftPrediction = { text: string; confidence: 'low' | 'medium' | 'high' };
export type ShiftProposal = { mapping: ShiftMapping; modelId: string; usage?: ShiftUsage | null };
export type ShiftAcceptanceInput = { confirmed: true; origin: 'ai-proposal' | 'student'; proposal?: ShiftProposal; prediction?: ShiftPrediction };
export type ShiftAcceptance = ShiftAcceptanceInput & { corrected: boolean };
export type ShiftRunEntry = { number: 1 | 2; workflow: string; steps: string[]; mapping: ShiftMapping; reason: string; classifiedBy: 'ai' | 'student'; modelId?: string; usage?: ShiftUsage | null; acceptance?: ShiftAcceptance; result: ShiftEpisodeResult };
export type ShiftRecord = { version: 1; mode: 'shift-run'; activityRevision: number; page: string; runs: ShiftRunEntry[]; nextRequest: ShiftCaseResult | null };
export type ShiftRunInput = { workflow: string; mapping: ShiftMapping; reason?: string; classifiedBy: 'ai' | 'student'; modelId?: string; usage?: ShiftUsage | null; acceptance?: ShiftAcceptanceInput };
// Includes two accepted mappings, their original proposals, traces and learner
// predictions, including worst-case UTF-8 / JSON-escaped bounded input text.
export const SHIFT_LIMITS = { steps: 6, workflowCharacters: 1200, reasonCharacters: 200, actionsPerStep: 3, runs: 2, recordBytes: 192 * 1024 } as const;
export class ShiftValidationError extends Error {
  code: string; step?: number;
  constructor(code: string, step?: number) { super(`${step ? `Step ${step}: ` : ''}${code}`); this.name = 'ShiftValidationError'; this.code = code; this.step = step; }
}
function fail(code: string, step?: number): never { throw new ShiftValidationError(code, step); }
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function keys(value: Record<string, unknown>, allowed: readonly string[], required = allowed, step?: number) {
  if (Object.keys(value).some(key => !allowed.includes(key)) || required.some(key => !Object.hasOwn(value, key))) fail('Unexpected or missing fields.', step);
}
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function frozen<T>(value: T): T { if (value && typeof value === 'object') { Object.values(value).forEach(frozen); Object.freeze(value); } return value; }
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => same(x, b[i]));
  if (object(a) && object(b)) { const aa = Object.keys(a).sort(), bb = Object.keys(b).sort(); return same(aa, bb) && aa.every(key => same(a[key], b[key])); }
  return false;
}
export function validateShiftWorkflow(value: unknown): string[] {
  if (typeof value !== 'string' || value.length > SHIFT_LIMITS.workflowCharacters) fail('Keep the workflow within 1,200 characters.');
  const steps = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!steps.length || steps.length > SHIFT_LIMITS.steps) fail('Write one to six nonempty steps, one per line.');
  return steps;
}
function action(value: unknown, source: string | undefined, step: number, draft = false): ShiftAction {
  if (!object(value) || typeof value.type !== 'string' || !(SHIFT_ACTION_TYPES as readonly string[]).includes(value.type)) fail('Choose a supported action type.', step);
  const type = value.type as ShiftActionType;
  const extra = ['ai_draft', 'human_check', 'route_to_owner'].includes(type) ? [type] : [];
  keys(value, ['type', 'quote', 'when', ...extra], ['type', 'quote', ...extra], step);
  if (value.when !== undefined && !(SHIFT_GUARDS as readonly unknown[]).includes(value.when)) fail('Choose a supported action condition.', step);
  const guard = value.when && value.when !== 'always' ? { when: value.when as ShiftGuard } : {};
  if (typeof value.quote !== 'string' || value.quote.length > 1200 || (!draft && (!value.quote.trim() || (source !== undefined && !source.includes(value.quote))))) fail('The quote must match this step exactly.', step);
  if (type === 'ai_draft') {
    if (!object(value.ai_draft)) fail('Give both drafting attributes.', step);
    keys(value.ai_draft, ['states_conditions', 'forbids_promises'], undefined, step);
    if (typeof value.ai_draft.states_conditions !== 'boolean' || typeof value.ai_draft.forbids_promises !== 'boolean') fail('Draft attributes must be true or false.', step);
    return { type, quote: value.quote, ...guard, ai_draft: { states_conditions: value.ai_draft.states_conditions, forbids_promises: value.ai_draft.forbids_promises } };
  }
  if (type === 'human_check') {
    if (!object(value.human_check)) fail('Name the human checks.', step);
    keys(value.human_check, ['checks'], undefined, step);
    const checks = value.human_check.checks;
    if (!Array.isArray(checks) || checks.length > SHIFT_CHECKS.length || checks.some(check => !(SHIFT_CHECKS as readonly unknown[]).includes(check)) || new Set(checks).size !== checks.length) fail('Use each supported human check at most once.', step);
    return { type, quote: value.quote, ...guard, human_check: { checks: [...checks] as ShiftCheck[] } };
  }
  if (type === 'route_to_owner') {
    if (!object(value.route_to_owner)) fail('State when the owner receives the request.', step);
    keys(value.route_to_owner, ['only_if_held'], undefined, step);
    if (typeof value.route_to_owner.only_if_held !== 'boolean') fail('The owner-route condition must be true or false.', step);
    return { type, quote: value.quote, ...guard, route_to_owner: { only_if_held: value.route_to_owner.only_if_held } };
  }
  return { type, quote: value.quote, ...guard };
}
function mapping(value: unknown, steps?: readonly string[], draft = false): ShiftMapping {
  if (!Array.isArray(value) || !value.length || value.length > SHIFT_LIMITS.steps || (steps && value.length !== steps.length)) fail('Return one mapping entry per step.');
  return value.map((item, index) => {
    const step = index + 1;
    if (!object(item)) fail('A step reading is invalid.', step);
    keys(item, ['step', 'actions'], undefined, step);
    if (item.step !== step || !Array.isArray(item.actions) || item.actions.length > SHIFT_LIMITS.actionsPerStep) fail('Keep steps in order with zero to three actions each.', step);
    const actions = item.actions.map(value => action(value, steps?.[index], step, draft));
    if (!draft && new Set(actions.map(value => JSON.stringify(value))).size !== actions.length) fail('Do not repeat the same mapped action.', step);
    if (steps && !draft) {
      let last = -1;
      for (const value of actions) { const offset = steps[index].indexOf(value.quote); if (offset < last) fail('Keep quoted actions in their written order.', step); last = offset; }
    }
    return { step, actions };
  });
}
export function validateShiftMapping(value: unknown, steps: readonly string[]): ShiftMapping { return mapping(value, steps); }
/** Unsaved editor state may contain an empty/unmatched quote. It can never run
 * until strict validateShiftMapping succeeds. Attributes and bounds stay shared. */
export function validateShiftMappingDraft(value: unknown, steps: readonly string[]): ShiftMapping { return mapping(value, steps, true); }
const EXPECTED_PATH: Record<ShiftConsequenceId, ShiftPath> = {
  sent_conditions: 'sent', false_confirmation: 'sent', unsupported_commitment: 'sent', routine_escalated: 'routed', held_no_owner: 'held', exception_acknowledged: 'routed', routed_no_ack: 'routed', unreceived_review: 'sent', asked_missing_time: 'asked', wrong_branch_sent: 'sent', stopped: 'stopped', unreviewed_release: 'sent', no_draft: 'stopped', source_missing: 'stopped',
};
function activityIdentity(a: ShiftRunActivity) {
  if (a.mode !== 'shift-run' || a.unit !== 4 || a.page !== 'unit-04.html' || !Number.isInteger(a.activityRevision) || a.activityRevision < 2 || a.activityRevision > 100) fail('Choose the current Unit 4 shift run.');
}
function outcome(a: ShiftRunActivity, caseId: ShiftCaseId, id: ShiftConsequenceId, draftId: string | null, step: number | null, ownerRouted = false, sent = EXPECTED_PATH[id] === 'sent' || EXPECTED_PATH[id] === 'asked'): ShiftCaseResult {
  if (!a.consequences[id] || a.consequences[id].path !== EXPECTED_PATH[id] || (draftId !== null && typeof a.drafts[draftId] !== 'string')) fail('The authored shift data is incomplete.');
  return { caseId, draftId, consequenceId: id, path: EXPECTED_PATH[id], triggerStep: step, sent, ownerRouted };
}
/** This is an authored rehearsal, not a general workflow executor. First release
 * is consequential; later checks cannot retroactively repair what left the desk. */
function runCaseLegacy(a: ShiftRunActivity, input: ShiftMapping, caseId: ShiftCaseId): ShiftCaseResult {
  activityIdentity(a);
  const actions = mapping(input).flatMap(line => line.actions.map(value => ({ ...value, step: line.step })));
  const confirmationIndex = actions.findIndex(value => value.type === 'confirm_change');
  if (confirmationIndex >= 0) {
    // The authored confirmation override does not erase an earlier owner route.
    // Inspect only the prefix; later actions cannot repair the released claim.
    let index = 0;
    const prefix = input.map(line => ({ step: line.step, actions: line.actions.filter(() => index++ < confirmationIndex) }));
    const earlier = runCaseLegacy(a, prefix, caseId);
    return outcome(a, caseId, 'false_confirmation', 'confirmation', actions[confirmationIndex].step, earlier.ownerRouted, true);
  }
  let source = false, drafted = false, conditional = false, held = false, routed = false, acknowledgement = false;
  let draftId: string | null = null, routeStep: number | null = null, checkStep: number | null = null, unsafeAckStep: number | null = null;
  const checks = new Set<ShiftCheck>();
  const fullCheck = () => checks.has('tone') && checks.has('accuracy');
  const commitmentCheck = () => checks.has('commitments') || checks.has('confirmations');
  for (const value of actions) {
    if (value.type === 'find_source') source = true;
    else if (value.type === 'ai_draft') {
      if (!source) return outcome(a, caseId, 'source_missing', null, value.step, routed, false);
      drafted = true; conditional = value.ai_draft.states_conditions || value.ai_draft.forbids_promises;
      draftId = caseId === 'A' ? conditional ? 'a-conditional' : 'a-unqualified' : caseId === 'B' ? conditional ? 'b-conditional' : 'b-promise' : 'c-wrong-branch';
      checks.clear(); held = false;
    } else if (value.type === 'human_check' && drafted) {
      value.human_check.checks.forEach(check => checks.add(check)); checkStep = value.step;
      if (commitmentCheck() && (caseId !== 'A' || !conditional)) held = true;
    } else if (value.type === 'ask_missing_fact' && caseId === 'C') {
      if (!drafted) return outcome(a, caseId, routed ? 'routine_escalated' : 'asked_missing_time', 'ask-time', value.step, routed, true);
      held = true; checkStep = value.step;
    } else if (value.type === 'route_to_owner' && (!value.route_to_owner.only_if_held || held)) {
      routed = true; routeStep = value.step;
    } else if (value.type === 'acknowledge_customer') {
      acknowledgement = true;
      if (!fullCheck() && unsafeAckStep === null) unsafeAckStep = value.step;
    } else if (value.type === 'release') {
      if (unsafeAckStep !== null) return outcome(a, caseId, 'unreviewed_release', 'acknowledgement', unsafeAckStep, routed, true);
      if (!drafted) return outcome(a, caseId, 'no_draft', null, value.step, routed, false);
      if (routed || held) continue;
      if (caseId === 'A' && !conditional) return outcome(a, caseId, 'false_confirmation', draftId, value.step);
      if (caseId === 'B' && !conditional) return outcome(a, caseId, 'unsupported_commitment', draftId, value.step);
      if (caseId === 'C') return outcome(a, caseId, 'wrong_branch_sent', draftId, value.step);
      if (!fullCheck()) return outcome(a, caseId, 'unreviewed_release', draftId, value.step);
      return outcome(a, caseId, caseId === 'A' ? 'sent_conditions' : 'unreceived_review', draftId, value.step);
    }
  }
  if (unsafeAckStep !== null) return outcome(a, caseId, 'unreviewed_release', 'acknowledgement', unsafeAckStep, routed, true);
  if (!drafted) return outcome(a, caseId, 'no_draft', null, null, routed, false);
  if (routed) {
    if (caseId !== 'B') return outcome(a, caseId, 'routine_escalated', draftId, routeStep, true, false);
    return outcome(a, caseId, acknowledgement ? 'exception_acknowledged' : 'routed_no_ack', draftId, routeStep, true, acknowledgement);
  }
  if (held) return outcome(a, caseId, 'held_no_owner', draftId, checkStep, false, false);
  return outcome(a, caseId, 'stopped', draftId, null, false, false);
}
/** Revision 3 keeps language interpretation separate from execution. Every event
 * below names the accepted action actually reached, including skipped guards.
 * No case supplies owner/coordinator approval or a completed real-world change. */
function runCaseCurrent(a: ShiftRunActivity, input: ShiftMapping, caseId: ShiftCaseId): ShiftCaseResult {
  activityIdentity(a);
  const actions = mapping(input).flatMap(line => line.actions.map((value, index) => ({ value, step: line.step, action: index + 1 })));
  const trace: ShiftTraceEvent[] = [];
  let intake = false, source = false, conditionsChecked = false, drafted = false, conditional = false, held = false, routed = false, acknowledged = false;
  let draftId: string | null = null, acknowledgementDraft: string | null = null, routeStep: number | null = null, checkStep: number | null = null;
  const checks = new Set<ShiftCheck>();
  const authorityChecked = () => checks.has('next_step') || checks.has('commitments') || checks.has('confirmations');
  const missingChecks = () => [
    ...(!source || !(checks.has('source') || checks.has('accuracy')) ? ['source'] : []),
    ...(!conditionsChecked || !(checks.has('conditions') || checks.has('accuracy')) ? ['conditions'] : []),
    ...(!checks.has('tone') ? ['tone'] : []),
    ...(!authorityChecked() ? ['next step / authority'] : []),
  ];
  const emit = (item: typeof actions[number], status: ShiftTraceEvent['status'], detail: string) => trace.push({ step: item.step, action: item.action, type: item.value.type, when: item.value.when ?? 'always', status, detail });
  const finish = (id: ShiftConsequenceId, supplied: string | null, step: number | null, explanation: string, sent = false): ShiftCaseResult => ({ ...outcome(a, caseId, id, supplied, step, routed, sent), trace: clone(trace), explanation });
  function guardAllows(guard: ShiftGuard): boolean {
    if (guard === 'always') return true;
    if (guard === 'if_missing_fact') return intake && caseId === 'C';
    if (guard === 'if_exception') return intake && source && conditionsChecked && caseId === 'B';
    if (guard === 'if_held') return held;
    if (guard === 'if_not_held') return !held;
    return false; // No authored approval is supplied; never fabricate one.
  }
  for (const item of actions) {
    const value = item.value, when = value.when ?? 'always';
    if (!guardAllows(when)) {
      emit(item, 'skipped', when === 'if_approved' ? 'No authorized approval or completed change is supplied in this request; the guarded action did not happen.' : `The condition “${SHIFT_GUARD_LABELS[when]}” was not met at this point.`);
      continue;
    }
    if (value.type === 'intake') { intake = true; emit(item, 'executed', caseId === 'C' ? 'The incoming cancellation request was read; its deciding session time is missing.' : 'The supplied incoming request and time were read.'); }
    else if (value.type === 'find_source') { source = true; emit(item, 'executed', `The approved ${caseId === 'A' ? 'S3 rescheduling' : 'S2 cancellation'} source was consulted; consulting it does not authorize a change.`); }
    else if (value.type === 'check_conditions') {
      if (!intake || !source) { emit(item, 'skipped', 'Conditions could not be evaluated before both the incoming request and approved source were read.'); continue; }
      conditionsChecked = true;
      if (caseId !== 'A') held = true;
      emit(item, 'executed', caseId === 'A' ? 'The 60-hour request meets the 48-hour timing condition, but space and coordinator confirmation remain unknown.' : caseId === 'B' ? 'The 8-hour request is under 24 hours, so no automatic refund or credit is authorized; an exception needs the owner.' : 'The session time is missing, so no cancellation branch can be selected. The case is held for that fact, not classified as an exception.');
    } else if (value.type === 'ask_missing_fact') {
      if (!intake || caseId !== 'C') { emit(item, 'skipped', !intake ? 'The request has not been read, so no deciding missing fact has been identified.' : 'The deciding time is already supplied; no missing-time question is sent.'); continue; }
      emit(item, 'executed', 'The customer is asked only for the missing session time. No policy conclusion or owner exception is invented.');
      return finish(routed ? 'routine_escalated' : 'asked_missing_time', 'ask-time', item.step, `Step ${item.step}, action ${item.action} asked for the deciding session time.${routed ? ' The owner had already been routed a routine missing-information case.' : ' This case now waits for the customer; later actions were not executed.'}`, true);
    } else if (value.type === 'ai_draft') {
      if (!intake) { emit(item, 'skipped', 'Drafting stopped because the workflow had not read the incoming request.'); return finish('stopped', null, item.step, `Drafting at step ${item.step} had no intake action before it; the rehearsal did not infer an unstated reading step.`); }
      if (!source) { emit(item, 'skipped', 'Drafting stopped because no approved policy had been consulted.'); return finish('source_missing', null, item.step, `Drafting at step ${item.step} was reached before source consultation. No draft was invented.`); }
      drafted = true; conditional = value.ai_draft.states_conditions || value.ai_draft.forbids_promises; checks.clear();
      draftId = caseId === 'A' ? conditional ? 'a-conditional' : 'a-unqualified' : caseId === 'B' ? conditional ? 'b-conditional' : 'b-promise' : 'c-wrong-branch';
      emit(item, 'executed', `The authored ${draftId} draft was prepared. Existing holds remain in force, and a new draft still needs human review.`);
    } else if (value.type === 'human_check') {
      if (!drafted) { emit(item, 'skipped', 'No draft exists yet; this review does not approve a future draft.'); continue; }
      value.human_check.checks.forEach(check => checks.add(check)); checkStep = item.step;
      if (intake && source && (checks.has('conditions') || checks.has('accuracy'))) conditionsChecked = true;
      if (authorityChecked() && (caseId !== 'A' || !conditional)) held = true;
      emit(item, 'executed', `Human review covered: ${value.human_check.checks.map(check => SHIFT_CHECK_LABELS[check]).join(', ') || 'no named aspects'}.${held ? caseId === 'C' ? ' The missing session time prevents a policy conclusion.' : caseId === 'B' ? ' The exception remains held for owner authorization.' : ' The draft implies an unapproved change and is held.' : ''}${missingChecks().length ? ` Required coverage still missing: ${missingChecks().join(', ')}.` : ' The required source, conditions, tone and next-step coverage is present.'}`);
    } else if (value.type === 'route_to_owner') {
      if (value.route_to_owner.only_if_held && !held) { emit(item, 'skipped', 'This owner route applies only to held work; the case is not held.'); continue; }
      routed = true; routeStep = item.step; emit(item, 'executed', caseId === 'B' ? 'The exceptional request was actually routed to the owner. No approval has been returned.' : 'The owner received this ordinary or missing-information request; routing is not approval.');
    } else if (value.type === 'acknowledge_customer') {
      acknowledgementDraft = routed ? 'acknowledgement' : 'acknowledgement-pending';
      if (typeof a.drafts[acknowledgementDraft] !== 'string') fail('The authored acknowledgement data is incomplete.');
      const missing = missingChecks();
      emit(item, 'executed', `${routed ? 'An acknowledgement truthfully states that the owner received the request.' : 'A receipt/pending acknowledgement makes no claim that the owner received the request.'}${missing.length ? ` It was sent without required coverage: ${missing.join(', ')}.` : ' It was sent after the required review.'}`);
      if (missing.length) return finish('unreviewed_release', acknowledgementDraft, item.step, `The acknowledgement at step ${item.step}, action ${item.action} was the outgoing message. At that moment the accepted mapping lacked: ${missing.join(', ')}. Later actions were not executed.`, true);
      acknowledged = true;
    } else if (value.type === 'confirm_change') {
      emit(item, 'executed', 'An affirmative completed-change claim was sent although the packet supplies no authorized approval or completed change.');
      return finish('false_confirmation', 'confirmation', item.step, `Step ${item.step}, action ${item.action} affirmatively claimed a completed change. No supplied fact authorizes that claim; a human review elsewhere cannot create approval.`, true);
    } else if (value.type === 'release') {
      if (!drafted) { emit(item, 'skipped', 'No draft exists to release.'); return finish('no_draft', null, item.step, `Release at step ${item.step} had no earlier draft. Nothing was sent.`); }
      if (held) { emit(item, 'skipped', 'The case is held; this release does not authorize an exception or fill a missing fact.'); continue; }
      emit(item, 'executed', 'The current authored draft was released; later workflow actions were not executed.');
      if (caseId === 'A' && !conditional) return finish('false_confirmation', draftId, item.step, `Release at step ${item.step} sent the unqualified draft implying a change despite the unknown space and coordinator confirmation.`, true);
      if (caseId === 'B' && !conditional) return finish('unsupported_commitment', draftId, item.step, `Release at step ${item.step} sent a refund/credit commitment without owner authorization.`, true);
      if (caseId === 'C') return finish('wrong_branch_sent', draftId, item.step, `Release at step ${item.step} selected a cancellation conclusion without the deciding session time.`, true);
      const missing = missingChecks();
      if (missing.length) return finish('unreviewed_release', draftId, item.step, `The draft left at step ${item.step}. Required review coverage missing at that point: ${missing.join(', ')}.`, true);
      return finish(caseId === 'A' ? 'sent_conditions' : 'unreceived_review', draftId, item.step, caseId === 'A' ? `Step ${item.step} released the reviewed conditional policy reply. No booking change was claimed; no owner route was needed or performed.` : `Step ${item.step} sent only a policy explanation, but no earlier action actually routed the exception to the owner.`, true);
    }
  }
  if (routed) return finish(caseId === 'B' ? acknowledged ? 'exception_acknowledged' : 'routed_no_ack' : 'routine_escalated', acknowledged ? acknowledgementDraft : draftId, routeStep, `${caseId === 'B' ? 'The owner received the exception' : 'The owner received a routine/missing-information case'} at step ${routeStep}.${acknowledged ? ' A reviewed acknowledgement was sent without claiming approval.' : ' No acknowledgement was sent to the customer.'} No change was authorized.`, acknowledged);
  if (held) return finish('held_no_owner', acknowledged ? acknowledgementDraft : draftId, checkStep, `${caseId === 'C' ? 'The deciding time remains missing' : 'An unsupported commitment remains held'}, but no action routed the unresolved case to the owner or completed a clarifying question.${acknowledged ? ' A receipt was sent, without claiming an owner handoff.' : ' Nothing was sent.'}`, acknowledged);
  if (!drafted) return finish('no_draft', null, null, 'No drafting action was executed, so no policy reply exists to release.');
  return finish('stopped', acknowledged ? acknowledgementDraft : draftId, null, `The workflow ended without releasing the policy draft or routing the request.${acknowledged ? ' A receipt/pending message was sent; it did not claim an owner handoff.' : ' Nothing was sent.'}`, acknowledged);
}
function runCase(a: ShiftRunActivity, input: ShiftMapping, caseId: ShiftCaseId): ShiftCaseResult { return a.activityRevision === 2 ? runCaseLegacy(a, input, caseId) : runCaseCurrent(a, input, caseId); }
export function shiftResultExplanation(a: ShiftRunActivity, result: ShiftCaseResult): string { return result.explanation ?? a.consequences[result.consequenceId].debrief; }
export function formatShiftMapping(input: ShiftMapping): string {
  return mapping(input).map(line => `Step ${line.step}:\n${line.actions.length ? line.actions.map((value, index) => `${index + 1}. ${SHIFT_ACTION_LABELS[value.type]} — ${SHIFT_GUARD_LABELS[value.when ?? 'always']}\nQuoted wording: ${value.quote}${value.type === 'human_check' ? `\nReview: ${value.human_check.checks.map(check => SHIFT_CHECK_LABELS[check]).join(', ') || 'none named'}` : value.type === 'route_to_owner' ? `\nOnly held work: ${value.route_to_owner.only_if_held ? 'yes' : 'no'}` : value.type === 'ai_draft' ? `\nState conditions: ${value.ai_draft.states_conditions ? 'yes' : 'no'}; forbid unsupported promises: ${value.ai_draft.forbids_promises ? 'yes' : 'no'}` : ''}`).join('\n') : 'No listed action.'}`).join('\n\n');
}
export function runShift(a: ShiftRunActivity, input: ShiftMapping): ShiftEpisodeResult {
  const results = (['A', 'B'] as const).map(caseId => runCase(a, input, caseId));
  return { results, tally: { sent: results.filter(value => value.sent).length, routed: results.filter(value => value.ownerRouted).length, held: results.filter(value => value.path === 'held').length, asked: results.filter(value => value.path === 'asked').length, stopped: results.filter(value => value.path === 'stopped').length } };
}
export function runNextRequest(a: ShiftRunActivity, input: ShiftMapping): ShiftCaseResult { return runCase(a, input, 'C'); }
export function emptyShiftRecord(a: ShiftRunActivity): ShiftRecord { activityIdentity(a); return frozen({ version: 1, mode: 'shift-run', activityRevision: a.activityRevision, page: a.page, runs: [], nextRequest: null }); }
function usage(value: unknown): ShiftUsage | null | undefined {
  if (value === undefined || value === null) return value;
  if (!object(value)) fail('Token usage is invalid.');
  keys(value, ['inputTokens', 'outputTokens', 'totalTokens']);
  for (const count of Object.values(value)) if (count !== null && (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0)) fail('Token usage is invalid.');
  return value as ShiftUsage;
}
function acceptance(value: unknown, steps: string[], acceptedMapping: ShiftMapping, classifiedBy: 'ai' | 'student', modelId: unknown, tokenUsage: ShiftUsage | null | undefined, saved: boolean): ShiftAcceptance {
  if (!object(value)) fail('Inspect and explicitly accept the interpretation before running the cases.');
  keys(value, ['confirmed', 'origin', 'proposal', 'prediction', ...(saved ? ['corrected'] : [])], ['confirmed', 'origin', ...(saved ? ['corrected'] : [])]);
  if (value.confirmed !== true || !['ai-proposal', 'student'].includes(value.origin as string) || (classifiedBy === 'ai') !== (value.origin === 'ai-proposal')) fail('The accepted interpretation needs truthful proposal provenance.');
  let proposal: ShiftProposal | undefined;
  if (value.origin === 'ai-proposal') {
    if (!object(value.proposal)) fail('Keep the original AI proposal separate from the accepted mapping.');
    keys(value.proposal, ['mapping', 'modelId', 'usage'], ['mapping', 'modelId']);
    const proposed = validateShiftMapping(value.proposal.mapping, steps), measured = usage(value.proposal.usage);
    if (typeof value.proposal.modelId !== 'string' || !value.proposal.modelId.trim() || value.proposal.modelId.length > 200 || value.proposal.modelId !== modelId || !same(measured, tokenUsage)) fail('Keep the original proposal model and measured usage unchanged.');
    proposal = { mapping: proposed, modelId: value.proposal.modelId, ...(measured !== undefined ? { usage: measured } : {}) };
  } else if (value.proposal !== undefined) fail('A student-origin interpretation must not claim an AI proposal.');
  let prediction: ShiftPrediction | undefined;
  if (value.prediction !== undefined) {
    if (!object(value.prediction)) fail('The prediction is invalid.');
    keys(value.prediction, ['text', 'confidence']);
    if (typeof value.prediction.text !== 'string' || !value.prediction.text.trim() || value.prediction.text.length > 500 || !['low', 'medium', 'high'].includes(value.prediction.confidence as string)) fail('Keep the prediction within 500 characters and choose a listed confidence.');
    prediction = { text: value.prediction.text, confidence: value.prediction.confidence as ShiftPrediction['confidence'] };
  }
  const corrected = !!proposal && !same(proposal.mapping, acceptedMapping);
  if (saved && value.corrected !== corrected) fail('The correction marker must match the original proposal and accepted mapping.');
  return { confirmed: true, origin: value.origin as ShiftAcceptanceInput['origin'], ...(proposal ? { proposal } : {}), ...(prediction ? { prediction } : {}), corrected };
}
function entry(a: ShiftRunActivity, value: unknown, expected: 1 | 2): ShiftRunEntry {
  if (!object(value)) fail('A saved shift run is invalid.');
  keys(value, ['number', 'workflow', 'steps', 'mapping', 'reason', 'classifiedBy', 'modelId', 'usage', 'acceptance', 'result'], ['number', 'workflow', 'steps', 'mapping', 'reason', 'classifiedBy', 'result']);
  const steps = validateShiftWorkflow(value.workflow);
  if (value.number !== expected || !same(value.steps, steps)) fail('Saved shift runs must retain their original ordered steps.');
  if (typeof value.reason !== 'string' || value.reason.length > SHIFT_LIMITS.reasonCharacters || (expected === 2 && !value.reason.trim())) fail('Add a reason of 1–200 characters before the second run.');
  if (value.classifiedBy !== 'ai' && value.classifiedBy !== 'student') fail('Name how the steps were classified.');
  if (value.classifiedBy === 'ai' && (typeof value.modelId !== 'string' || !value.modelId.trim() || value.modelId.length > 200)) fail('An AI-classified run needs its model identifier.');
  if (value.classifiedBy === 'student' && value.modelId !== undefined) fail('Student classification must not claim an AI model.');
  const parsed = validateShiftMapping(value.mapping, steps), result = runShift(a, parsed);
  if (!same(value.result, result)) fail('A saved consequence does not match the authored engine.');
  const tokenUsage = usage(value.usage);
  if (value.classifiedBy === 'student' && tokenUsage !== undefined && tokenUsage !== null) fail('Student classification must not claim model token use.');
  const accepted = a.activityRevision >= 3 ? acceptance(value.acceptance, steps, parsed, value.classifiedBy, value.modelId, tokenUsage, true) : undefined;
  if (a.activityRevision === 2 && value.acceptance !== undefined) fail('Revision 2 is a preserved record, not a revision 3 interpretation.');
  return { number: expected, workflow: value.workflow as string, steps, mapping: parsed, reason: value.reason, classifiedBy: value.classifiedBy, ...(value.modelId !== undefined ? { modelId: value.modelId as string } : {}), ...(tokenUsage !== undefined ? { usage: tokenUsage } : {}), ...(accepted ? { acceptance: accepted } : {}), result };
}
export function validateShiftRecord(value: unknown, a: ShiftRunActivity): ShiftRecord {
  activityIdentity(a);
  if (!object(value)) fail('The saved shift record is invalid.');
  keys(value, ['version', 'mode', 'activityRevision', 'page', 'runs', 'nextRequest']);
  if (value.version !== 1 || value.mode !== 'shift-run' || value.activityRevision !== a.activityRevision || value.page !== a.page || !Array.isArray(value.runs) || value.runs.length > 2) fail('The saved shift record is for another activity or has too many runs.');
  const runs = value.runs.map((item, index) => entry(a, item, (index + 1) as 1 | 2));
  let nextRequest: ShiftCaseResult | null = null;
  if (value.nextRequest !== null) {
    if (runs.length !== 2) fail('Request C follows the second frozen workflow.');
    nextRequest = runNextRequest(a, runs[1].mapping);
    if (!same(value.nextRequest, nextRequest)) fail('The saved next-request outcome does not match workflow two.');
  }
  return frozen({ version: 1, mode: 'shift-run', activityRevision: a.activityRevision, page: a.page, runs, nextRequest });
}
export function restoreShiftRecord(raw: string | null, a: ShiftRunActivity): ShiftRecord {
  if (!raw || new TextEncoder().encode(raw).byteLength > SHIFT_LIMITS.recordBytes) return emptyShiftRecord(a);
  try { return validateShiftRecord(JSON.parse(raw), a); } catch { return emptyShiftRecord(a); }
}
export function recordShiftRun(a: ShiftRunActivity, current: ShiftRecord, input: ShiftRunInput): ShiftRecord {
  const record = validateShiftRecord(current, a);
  if (record.runs.length >= SHIFT_LIMITS.runs || record.nextRequest) fail('The two workflow runs are complete; request C uses the frozen second workflow.');
  const steps = validateShiftWorkflow(input.workflow), parsed = validateShiftMapping(input.mapping, steps), number = (record.runs.length + 1) as 1 | 2;
  const accepted = a.activityRevision >= 3 ? acceptance(input.acceptance, steps, parsed, input.classifiedBy, input.modelId, usage(input.usage), false) : undefined;
  const candidate = { number, workflow: input.workflow, steps, mapping: parsed, reason: input.reason ?? '', classifiedBy: input.classifiedBy, ...(input.modelId !== undefined ? { modelId: input.modelId } : {}), ...(input.usage !== undefined ? { usage: input.usage } : {}), ...(accepted ? { acceptance: accepted } : {}), result: runShift(a, parsed) };
  const added = entry(a, candidate, number);
  return frozen({ ...clone(record), runs: [...record.runs.map(clone), added] });
}
export function recordNextRequest(a: ShiftRunActivity, current: ShiftRecord): ShiftRecord {
  const record = validateShiftRecord(current, a);
  if (record.runs.length !== 2 || record.nextRequest) fail('Open request C once, after the two workflow runs.');
  return frozen({ ...clone(record), nextRequest: runNextRequest(a, record.runs[1].mapping) });
}
export function exportShiftRecord(a: ShiftRunActivity, current: ShiftRecord): string {
  const record = validateShiftRecord(current, a), lines = [a.exportStamp, a.stamp, a.title];
  function describe(result: ShiftCaseResult) {
    const card = a.cases.find(value => value.id === result.caseId), consequence = a.consequences[result.consequenceId];
    lines.push(a.stamp, `${result.caseId}: ${card?.request ?? result.caseId}`, consequence.label);
    if (result.draftId) lines.push(a.drafts[result.draftId]);
    lines.push(card?.reactions?.[result.consequenceId] || consequence.reaction, shiftResultExplanation(a, result), consequence.question);
    if (result.trace) lines.push('Accepted workflow execution trace:', ...result.trace.map(event => `Step ${event.step}, action ${event.action}: ${SHIFT_ACTION_LABELS[event.type]} — ${event.status}. ${event.detail}`));
  }
  for (const run of record.runs) {
    lines.push(a.stamp, `Workflow ${run.number}`, run.workflow, `Reason: ${run.reason}`, run.classifiedBy === 'student' ? 'Steps classified by the student.' : `Steps classified by AI: ${run.modelId}`);
    if (run.acceptance) {
      lines.push(run.acceptance.origin === 'ai-proposal' ? `AI proposed an interpretation; the learner explicitly accepted ${run.acceptance.corrected ? 'an edited interpretation' : 'the unchanged proposal'}.` : 'The learner constructed and explicitly accepted the interpretation.');
      if (run.acceptance.prediction) lines.push(`Prediction before this run: ${run.acceptance.prediction.text}`, `Self-reported confidence: ${run.acceptance.prediction.confidence}; not a checked learning result.`);
      if (run.acceptance.proposal) lines.push('Original AI proposal (not automatically executed):', formatShiftMapping(run.acceptance.proposal.mapping));
      lines.push('Learner-accepted interpretation:', formatShiftMapping(run.mapping));
    } else for (const line of run.mapping) lines.push(`Step ${line.step}: ${run.steps[line.step - 1]}`, JSON.stringify(line.actions));
    for (const result of run.result.results) describe(result);
    lines.push(`Shift tally: ${run.result.tally.sent} sent; ${run.result.tally.routed} to the owner.`);
  }
  if (record.nextRequest) describe(record.nextRequest);
  return lines.join('\n\n');
}
