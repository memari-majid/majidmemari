import test from 'node:test';
import assert from 'node:assert/strict';
import activities from '../../public/teaching/ai-solutions/assets/ta-activities.json' with { type: 'json' };
import { SHIFT_ACTION_TYPES, SHIFT_CONSEQUENCE_IDS, SHIFT_LIMITS, ShiftValidationError, emptyShiftRecord, exportShiftRecord, recordNextRequest, recordShiftRun, restoreShiftRecord, runNextRequest, runShift, validateShiftMapping, validateShiftRecord, validateShiftWorkflow, type ShiftAction, type ShiftActionType, type ShiftMapping, type ShiftRecord, type ShiftRunActivity } from './shift-run';

const a = activities.find(value => value.unit === 4) as unknown as ShiftRunActivity;
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
function act(type: ShiftActionType, attributes: Record<string, unknown> = {}): ShiftAction { return { type, quote: '', ...attributes } as ShiftAction; }
const draft = (conditional = false) => act('ai_draft', { ai_draft: { states_conditions: conditional, forbids_promises: conditional } });
const check = (commitments = false) => act('human_check', { human_check: { checks: commitments ? ['tone', 'accuracy', 'commitments', 'confirmations'] : ['tone', 'accuracy'] } });
const owner = (only_if_held = true) => act('route_to_owner', { route_to_owner: { only_if_held } });
function fixture(workflow: string, actions: ShiftAction[][]): ShiftMapping {
  const steps = validateShiftWorkflow(workflow);
  return validateShiftMapping(steps.map((line, i) => ({ step: i + 1, actions: actions[i].map(value => ({ ...value, quote: line })) })), steps);
}
function make(actions: ShiftAction[]) {
  const workflow = actions.map((value, index) => `Step ${index + 1}: ${value.type}.`).join('\n');
  return { workflow, mapping: fixture(workflow, actions.map(value => [value])) };
}
const v1 = fixture(a.fixtures.v1.workflow, [[act('intake')], [act('find_source')], [draft()], [check()], [act('release')]]);
const v2 = fixture(a.fixtures.v2.workflow, [[act('intake')], [act('find_source')], [draft(true)], [check(true)], [owner()], [act('release')]]);
const labels = (input: ShiftMapping) => runShift(a, input).results.map(value => a.consequences[value.consequenceId].label);
function twoRuns() {
  const first = recordShiftRun(a, emptyShiftRecord(a), { workflow: a.fixtures.v1.workflow, mapping: v1, classifiedBy: 'student' });
  return recordShiftRun(a, first, { workflow: a.fixtures.v2.workflow, mapping: v2, reason: a.fixtures.v2.reason, classifiedBy: 'ai', modelId: 'test/fictional-classifier', usage: { inputTokens: 100, outputTokens: 40, totalTokens: 140 } });
}

test('workflow limits count nonempty lines and preserve the exact text used for mapping', () => {
  assert.deepEqual(validateShiftWorkflow('  Read.\n\n Send. '), ['Read.', 'Send.']);
  assert.equal(validateShiftWorkflow('x'.repeat(1200))[0].length, 1200);
  assert.equal(validateShiftWorkflow('a\nb\nc\nd\ne\nf').length, 6);
  for (const invalid of [null, 42, '', ' \n ', 'x'.repeat(1201), 'a\nb\nc\nd\ne\nf\ng']) assert.throws(() => validateShiftWorkflow(invalid), ShiftValidationError);
  assert.equal(SHIFT_LIMITS.runs, 2);
});

test('mapping strictly validates own-step quotes, action order, allowed attributes and zero-to-three actions', () => {
  const one = ['Read then send'];
  const valid = [{ step: 1, actions: [{ type: 'intake', quote: 'Read' }, { type: 'release', quote: 'send' }] }];
  assert.deepEqual(validateShiftMapping(valid, one), valid);
  assert.deepEqual(validateShiftMapping([{ step: 1, actions: [] }], one), [{ step: 1, actions: [] }]);
  const invalid = [
    [], [{ step: 2, actions: [] }], [{ step: 1, actions: [], score: 1 }],
    [{ step: 1, actions: [{ type: 'release', quote: '' }] }],
    [{ step: 1, actions: [{ type: 'release', quote: 'not in this step' }] }],
    [{ step: 1, actions: [{ type: 'send_email', quote: 'send' }] }],
    [{ step: 1, actions: [{ type: 'release', quote: 'send', passed: true }] }],
    [{ step: 1, actions: [{ type: 'release', quote: 'send' }, { type: 'intake', quote: 'Read' }] }],
    [{ step: 1, actions: [{ type: 'intake', quote: 'Read' }, { type: 'intake', quote: 'Read' }] }],
    [{ step: 1, actions: Array.from({ length: 4 }, () => ({ type: 'intake', quote: 'Read' })) }],
    [{ step: 1, actions: [{ type: 'ai_draft', quote: 'Read', ai_draft: { states_conditions: 'yes', forbids_promises: false } }] }],
    [{ step: 1, actions: [{ type: 'human_check', quote: 'Read', human_check: { checks: ['tone', 'tone'] } }] }],
    [{ step: 1, actions: [{ type: 'human_check', quote: 'Read', human_check: { checks: ['readiness'] } }] }],
    [{ step: 1, actions: [{ type: 'route_to_owner', quote: 'Read', route_to_owner: { only_if_held: 1 } }] }],
  ];
  for (const value of invalid) assert.throws(() => validateShiftMapping(value, one), ShiftValidationError);
  assert.throws(() => validateShiftMapping([{ step: 1, actions: [] }, { step: 2, actions: [{ type: 'release', quote: 'Read' }] }], ['Read', 'Send']), /Step 2/);
  for (const type of SHIFT_ACTION_TYPES) {
    const value = type === 'ai_draft' ? draft() : type === 'human_check' ? check() : type === 'route_to_owner' ? owner() : act(type);
    assert.equal(make([value]).mapping[0].actions[0].type, type);
  }
});

test('the three authored episode fixtures produce the required labels and actual handoff tallies', () => {
  assert.deepEqual(labels(v1), ['False confirmation', 'Unsupported commitment released']);
  assert.deepEqual(labels(v2), ['Sent with conditions', 'Routed, customer told nothing']);
  assert.equal(a.consequences[runNextRequest(a, v2).consequenceId].label, 'Routine case escalated');
  assert.deepEqual(runShift(a, v1).tally, { sent: 2, routed: 0, held: 0, asked: 0, stopped: 0 });
  assert.deepEqual(runShift(a, v2).tally, { sent: 1, routed: 1, held: 0, asked: 0, stopped: 0 });
});

test('every authored consequence has an independently inspectable engine route', () => {
  const seen = new Set(runShift(a, v1).results.map(value => value.consequenceId));
  const scenarios = [
    [act('find_source'), draft(true), check(true), owner(), act('acknowledge_customer')],
    [act('find_source'), draft(), check(true), act('release')],
    [act('find_source'), draft(true), check(), act('release')],
    [act('find_source'), act('ask_missing_fact'), draft(), act('release')],
    [act('find_source'), draft(), act('release')],
    [act('find_source'), draft(true), check()],
    [act('find_source'), draft(true), act('release')],
    [act('intake'), act('release')],
    [draft(true), check(), act('release')],
  ];
  for (const actions of scenarios) {
    const input = make(actions).mapping;
    for (const value of [...runShift(a, input).results, runNextRequest(a, input)]) seen.add(value.consequenceId);
  }
  for (const value of [...runShift(a, v2).results, runNextRequest(a, v2)]) seen.add(value.consequenceId);
  assert.deepEqual([...seen].sort(), [...SHIFT_CONSEQUENCE_IDS].sort());
});

test('ordered execution does not let later checks, sources or questions repair an earlier release', () => {
  const laterCheck = make([act('find_source'), draft(), act('release'), check(true), owner()]).mapping;
  assert.deepEqual(labels(laterCheck), ['False confirmation', 'Unsupported commitment released']);
  const checkBeforeDraft = make([act('find_source'), check(), draft(true), act('release')]).mapping;
  assert.equal(runShift(a, checkBeforeDraft).results[0].consequenceId, 'unreviewed_release');
  const sourceAfterDraft = make([draft(true), act('find_source'), check(), act('release')]).mapping;
  assert.equal(runShift(a, sourceAfterDraft).results[0].consequenceId, 'source_missing');
  const releaseBeforeQuestion = make([act('release'), act('ask_missing_fact'), act('find_source'), draft()]).mapping;
  assert.equal(runNextRequest(a, releaseBeforeQuestion).consequenceId, 'no_draft');
  const earlyQuestion = make([act('find_source'), act('ask_missing_fact'), draft(), act('release')]).mapping;
  assert.equal(runNextRequest(a, earlyQuestion).consequenceId, 'asked_missing_time');
  const lateQuestion = make([act('find_source'), draft(), act('ask_missing_fact'), act('release')]).mapping;
  assert.equal(runNextRequest(a, lateQuestion).consequenceId, 'held_no_owner');
});

test('owner guards distinguish routine conditional replies from held exceptional requests', () => {
  assert.equal(runShift(a, v2).results[0].consequenceId, 'sent_conditions');
  const routeAll = make([act('find_source'), draft(true), check(true), owner(false), act('release')]).mapping;
  assert.equal(runShift(a, routeAll).results[0].consequenceId, 'routine_escalated');
  const routeBeforeHold = make([act('find_source'), draft(true), owner(), check(true), act('release')]).mapping;
  assert.equal(runShift(a, routeBeforeHold).results[1].consequenceId, 'held_no_owner');
  const explicitConfirmation = make([act('find_source'), draft(true), check(), act('release'), act('confirm_change')]).mapping;
  assert(runShift(a, explicitConfirmation).results.every(value => value.consequenceId === 'false_confirmation'));
  assert.equal(runNextRequest(a, explicitConfirmation).consequenceId, 'false_confirmation');
});

test('acknowledgement review is captured when the message leaves, not retroactively at the end', () => {
  const unsafe = make([act('find_source'), draft(true), act('acknowledge_customer'), check(true), owner()]).mapping;
  const b = runShift(a, unsafe).results[1];
  assert.equal(b.consequenceId, 'unreviewed_release'); assert.equal(b.triggerStep, 3);
  assert.equal(b.sent, true); assert.equal(b.ownerRouted, true);
  const safe = make([act('find_source'), draft(true), check(true), owner(), act('acknowledge_customer')]).mapping;
  const safeB = runShift(a, safe).results[1];
  assert.equal(safeB.consequenceId, 'exception_acknowledged'); assert.equal(safeB.sent, true); assert.equal(safeB.ownerRouted, true);
  assert.equal(runShift(a, safe).tally.routed, 1);
});

test('good releases require source consultation and a post-draft tone plus accuracy check', () => {
  const unchecked = make([act('find_source'), draft(true), act('release')]).mapping;
  assert.equal(runShift(a, unchecked).results[0].consequenceId, 'unreviewed_release');
  const toneOnly = make([act('find_source'), draft(true), act('human_check', { human_check: { checks: ['tone'] } }), act('release')]).mapping;
  assert.equal(runShift(a, toneOnly).results[0].consequenceId, 'unreviewed_release');
  const splitChecks = make([act('find_source'), draft(true), act('human_check', { human_check: { checks: ['tone'] } }), act('human_check', { human_check: { checks: ['accuracy'] } }), act('release')]).mapping;
  assert.equal(runShift(a, splitChecks).results[0].consequenceId, 'sent_conditions');
});

test('two workflow snapshots and one frozen next request form a finite browser practice record', () => {
  const empty = emptyShiftRecord(a);
  assert.throws(() => recordNextRequest(a, empty), ShiftValidationError);
  const first = recordShiftRun(a, empty, { workflow: a.fixtures.v1.workflow, mapping: v1, classifiedBy: 'student' });
  assert.equal(empty.runs.length, 0); assert.equal(first.runs.length, 1);
  assert.throws(() => recordShiftRun(a, first, { workflow: a.fixtures.v2.workflow, mapping: v2, classifiedBy: 'student' }), /reason/);
  assert.throws(() => recordShiftRun(a, first, { workflow: a.fixtures.v2.workflow, mapping: v2, reason: 'x'.repeat(201), classifiedBy: 'student' }), /reason/);
  const complete = twoRuns(); const before = JSON.stringify(complete.runs[1].mapping);
  assert.throws(() => recordShiftRun(a, complete, { workflow: a.fixtures.v1.workflow, mapping: v1, reason: 'Another attempt', classifiedBy: 'student' }), /two workflow runs/);
  const next = recordNextRequest(a, complete);
  assert.equal(next.nextRequest?.consequenceId, 'routine_escalated'); assert.equal(JSON.stringify(next.runs[1].mapping), before);
  assert.equal(complete.nextRequest, null); assert.throws(() => recordNextRequest(a, next), /once/);
  assert.equal(next.runs.length, 2); assert.equal(Object.isFrozen(next.runs[1].mapping), true);
  assert.equal(Object.isFrozen(next.runs[1].mapping[0].actions), true);
});

test('record restoration rejects forged outcomes, altered mappings and premature C while preserving a valid snapshot', () => {
  const record = recordNextRequest(a, twoRuns());
  assert.deepEqual(restoreShiftRecord(JSON.stringify(record), a), record);
  const changes: ((value: ShiftRecord) => void)[] = [
    value => { value.runs[0].result.results[0].consequenceId = 'sent_conditions'; },
    value => { value.nextRequest!.consequenceId = 'asked_missing_time'; },
    value => { value.runs[1].reason = ''; },
    value => { value.runs[0].number = 2; },
    value => { value.runs[0].steps[0] = 'An invented step'; },
    value => { value.runs[0].mapping[0].actions[0].quote = 'A quotation from another workflow'; },
    value => { value.runs.splice(1, 1); },
    value => { value.activityRevision = 1; },
    value => { value.page = 'unit-05.html'; },
  ];
  for (const change of changes) { const modified = copy(record); change(modified); assert.throws(() => validateShiftRecord(modified, a), ShiftValidationError); }
  assert.throws(() => validateShiftRecord({ ...copy(record), grade: 100 }, a), ShiftValidationError);
  assert.deepEqual(restoreShiftRecord('{broken', a), emptyShiftRecord(a));
  assert.deepEqual(restoreShiftRecord('x'.repeat(SHIFT_LIMITS.recordBytes + 1), a), emptyShiftRecord(a));
});

test('classification provenance and measured token metadata cannot masquerade as manual classification', () => {
  const record = twoRuns(); assert.equal(record.runs[1].modelId, 'test/fictional-classifier');
  for (const invalid of [{ modelId: '' }, { modelId: 'x'.repeat(201) }, { usage: { inputTokens: -1, outputTokens: 2, totalTokens: 1 } }, { usage: { inputTokens: 1.5, outputTokens: 2, totalTokens: 3 } }]) {
    const value = copy(record); Object.assign(value.runs[1], invalid); assert.throws(() => validateShiftRecord(value, a), ShiftValidationError);
  }
  const manual = copy(record); manual.runs[0].modelId = 'invented/model'; assert.throws(() => validateShiftRecord(manual, a), ShiftValidationError);
  const tokens = copy(record); tokens.runs[0].usage = { inputTokens: 1, outputTokens: 1, totalTokens: 2 }; assert.throws(() => validateShiftRecord(tokens, a), ShiftValidationError);
  const unknown = copy(record); unknown.runs[1].usage = null; assert.equal(validateShiftRecord(unknown, a).runs[1].usage, null);
});

test('exports retain each version, reason, reading, case outcome and authored simulated boundary', () => {
  const record = recordNextRequest(a, twoRuns()), exported = exportShiftRecord(a, record);
  for (const value of [a.exportStamp, a.stamp, a.fixtures.v1.workflow, a.fixtures.v2.workflow, a.fixtures.v2.reason, 'Steps classified by the student.', 'test/fictional-classifier']) assert(exported.includes(value), value);
  for (const id of ['false_confirmation', 'unsupported_commitment', 'sent_conditions', 'routed_no_ack', 'routine_escalated'] as const) assert(exported.includes(a.consequences[id].label));
  assert(exported.includes(a.cases[1].reactions!.routed_no_ack!));
  assert(exported.includes(a.consequences.routine_escalated.question));
  assert.equal((exported.match(/Workflow [12]/g) ?? []).length, 2);
  assert(exported.startsWith('Simulated rehearsal'));
});

test('a confirmation override retains an owner route that actually preceded it', () => {
  const input = make([act('find_source'), draft(true), check(true), owner(), act('confirm_change')]).mapping;
  const results = runShift(a, input);
  assert(results.results.every(value => value.consequenceId === 'false_confirmation'));
  assert.equal(results.results[0].ownerRouted, false, 'Routine conditional A was not held, so its conditional owner step was skipped');
  assert.equal(results.results[1].ownerRouted, true, 'B was already held and routed before the additional unsupported confirmation');
  assert.equal(results.tally.sent, 2); assert.equal(results.tally.routed, 1);
});
