/** Pure, bounded Cedar Desk rehearsal. No model, network, storage, or grading. */
export const SHIFT_ACTION_TYPES = ['intake', 'find_source', 'check_conditions', 'ask_missing_fact', 'ai_draft', 'human_check', 'route_to_owner', 'acknowledge_customer', 'release', 'confirm_change'] as const;
export type ShiftActionType = typeof SHIFT_ACTION_TYPES[number];
export type ShiftStepType = ShiftActionType;
export const SHIFT_CHECKS = ['tone', 'accuracy', 'commitments', 'confirmations'] as const;
export type ShiftCheck = typeof SHIFT_CHECKS[number];
type SimpleType = Exclude<ShiftActionType, 'ai_draft' | 'human_check' | 'route_to_owner'>;
export type ShiftAction = { type: SimpleType; quote: string }
  | { type: 'ai_draft'; quote: string; ai_draft: { states_conditions: boolean; forbids_promises: boolean } }
  | { type: 'human_check'; quote: string; human_check: { checks: ShiftCheck[] } }
  | { type: 'route_to_owner'; quote: string; route_to_owner: { only_if_held: boolean } };
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
  fixtures: { v1: { workflow: string; mapping?: ShiftMapping }; v2: { workflow: string; reason: string; mapping?: ShiftMapping } };
  workedRoutes?: { version: number; case: ShiftCaseId; consequence: ShiftConsequenceId }[];
};
export type ShiftUsage = { inputTokens: number | null; outputTokens: number | null; totalTokens: number | null };
export type ShiftCaseResult = { caseId: ShiftCaseId; draftId: string | null; consequenceId: ShiftConsequenceId; path: ShiftPath; triggerStep: number | null; sent: boolean; ownerRouted: boolean };
export type ShiftEpisodeResult = { results: ShiftCaseResult[]; tally: { sent: number; routed: number; held: number; asked: number; stopped: number } };
export type ShiftRunEntry = { number: 1 | 2; workflow: string; steps: string[]; mapping: ShiftMapping; reason: string; classifiedBy: 'ai' | 'student'; modelId?: string; usage?: ShiftUsage | null; result: ShiftEpisodeResult };
export type ShiftRecord = { version: 1; mode: 'shift-run'; activityRevision: number; page: string; runs: ShiftRunEntry[]; nextRequest: ShiftCaseResult | null };
export type ShiftRunInput = { workflow: string; mapping: ShiftMapping; reason?: string; classifiedBy: 'ai' | 'student'; modelId?: string; usage?: ShiftUsage | null };
export const SHIFT_LIMITS = { steps: 6, workflowCharacters: 1200, reasonCharacters: 200, actionsPerStep: 3, runs: 2, recordBytes: 48 * 1024 } as const;
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
function action(value: unknown, source: string | undefined, step: number): ShiftAction {
  if (!object(value) || typeof value.type !== 'string' || !(SHIFT_ACTION_TYPES as readonly string[]).includes(value.type)) fail('Choose a supported action type.', step);
  const type = value.type as ShiftActionType;
  const extra = ['ai_draft', 'human_check', 'route_to_owner'].includes(type) ? [type] : [];
  keys(value, ['type', 'quote', ...extra], undefined, step);
  if (typeof value.quote !== 'string' || !value.quote.trim() || value.quote.length > 1200 || (source !== undefined && !source.includes(value.quote))) fail('The quote must match this step exactly.', step);
  if (type === 'ai_draft') {
    if (!object(value.ai_draft)) fail('Give both drafting attributes.', step);
    keys(value.ai_draft, ['states_conditions', 'forbids_promises'], undefined, step);
    if (typeof value.ai_draft.states_conditions !== 'boolean' || typeof value.ai_draft.forbids_promises !== 'boolean') fail('Draft attributes must be true or false.', step);
    return { type, quote: value.quote, ai_draft: { states_conditions: value.ai_draft.states_conditions, forbids_promises: value.ai_draft.forbids_promises } };
  }
  if (type === 'human_check') {
    if (!object(value.human_check)) fail('Name the human checks.', step);
    keys(value.human_check, ['checks'], undefined, step);
    const checks = value.human_check.checks;
    if (!Array.isArray(checks) || checks.length > 4 || checks.some(check => !(SHIFT_CHECKS as readonly unknown[]).includes(check)) || new Set(checks).size !== checks.length) fail('Use each supported human check at most once.', step);
    return { type, quote: value.quote, human_check: { checks: [...checks] as ShiftCheck[] } };
  }
  if (type === 'route_to_owner') {
    if (!object(value.route_to_owner)) fail('State when the owner receives the request.', step);
    keys(value.route_to_owner, ['only_if_held'], undefined, step);
    if (typeof value.route_to_owner.only_if_held !== 'boolean') fail('The owner-route condition must be true or false.', step);
    return { type, quote: value.quote, route_to_owner: { only_if_held: value.route_to_owner.only_if_held } };
  }
  return { type, quote: value.quote };
}
function mapping(value: unknown, steps?: readonly string[]): ShiftMapping {
  if (!Array.isArray(value) || !value.length || value.length > SHIFT_LIMITS.steps || (steps && value.length !== steps.length)) fail('Return one mapping entry per step.');
  return value.map((item, index) => {
    const step = index + 1;
    if (!object(item)) fail('A step reading is invalid.', step);
    keys(item, ['step', 'actions'], undefined, step);
    if (item.step !== step || !Array.isArray(item.actions) || item.actions.length > SHIFT_LIMITS.actionsPerStep) fail('Keep steps in order with zero to three actions each.', step);
    const actions = item.actions.map(value => action(value, steps?.[index], step));
    if (new Set(actions.map(value => JSON.stringify(value))).size !== actions.length) fail('Do not repeat the same mapped action.', step);
    if (steps) {
      let last = -1;
      for (const value of actions) { const offset = steps[index].indexOf(value.quote); if (offset < last) fail('Keep quoted actions in their written order.', step); last = offset; }
    }
    return { step, actions };
  });
}
export function validateShiftMapping(value: unknown, steps: readonly string[]): ShiftMapping { return mapping(value, steps); }
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
function runCase(a: ShiftRunActivity, input: ShiftMapping, caseId: ShiftCaseId): ShiftCaseResult {
  activityIdentity(a);
  const actions = mapping(input).flatMap(line => line.actions.map(value => ({ ...value, step: line.step })));
  const confirmationIndex = actions.findIndex(value => value.type === 'confirm_change');
  if (confirmationIndex >= 0) {
    // The authored confirmation override does not erase an earlier owner route.
    // Inspect only the prefix; later actions cannot repair the released claim.
    let index = 0;
    const prefix = input.map(line => ({ step: line.step, actions: line.actions.filter(() => index++ < confirmationIndex) }));
    const earlier = runCase(a, prefix, caseId);
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
function entry(a: ShiftRunActivity, value: unknown, expected: 1 | 2): ShiftRunEntry {
  if (!object(value)) fail('A saved shift run is invalid.');
  keys(value, ['number', 'workflow', 'steps', 'mapping', 'reason', 'classifiedBy', 'modelId', 'usage', 'result'], ['number', 'workflow', 'steps', 'mapping', 'reason', 'classifiedBy', 'result']);
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
  return { number: expected, workflow: value.workflow as string, steps, mapping: parsed, reason: value.reason, classifiedBy: value.classifiedBy, ...(value.modelId !== undefined ? { modelId: value.modelId as string } : {}), ...(tokenUsage !== undefined ? { usage: tokenUsage } : {}), result };
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
  const candidate = { number, workflow: input.workflow, steps, mapping: parsed, reason: input.reason ?? '', classifiedBy: input.classifiedBy, ...(input.modelId !== undefined ? { modelId: input.modelId } : {}), ...(input.usage !== undefined ? { usage: input.usage } : {}), result: runShift(a, parsed) };
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
    lines.push(card?.reactions?.[result.consequenceId] || consequence.reaction, consequence.debrief, consequence.question);
  }
  for (const run of record.runs) {
    lines.push(a.stamp, `Workflow ${run.number}`, run.workflow, `Reason: ${run.reason}`, run.classifiedBy === 'student' ? 'Steps classified by the student.' : `Steps classified by AI: ${run.modelId}`);
    for (const line of run.mapping) lines.push(`Step ${line.step}: ${run.steps[line.step - 1]}`, JSON.stringify(line.actions));
    for (const result of run.result.results) describe(result);
    lines.push(`Shift tally: ${run.result.tally.sent} sent; ${run.result.tally.routed} to the owner.`);
  }
  if (record.nextRequest) describe(record.nextRequest);
  return lines.join('\n\n');
}
