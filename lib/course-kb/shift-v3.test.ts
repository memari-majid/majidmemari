import test from 'node:test';
import assert from 'node:assert/strict';
import activities from '../../public/teaching/ai-solutions/assets/ta-activities.json' with { type: 'json' };
import { emptyShiftRecord, exportShiftRecord, formatShiftMapping, recordNextRequest, recordShiftRun, runNextRequest, runShift, SHIFT_LIMITS, validateShiftMapping, validateShiftMappingDraft, validateShiftRecord, validateShiftWorkflow, type ShiftAction, type ShiftAcceptanceInput, type ShiftMapping, type ShiftRunActivity } from './shift-run';
import { validateShiftClassification } from './shift-classifier';

const activity = activities.find(value => value.unit === 4) as unknown as ShiftRunActivity;
const a = { ...activity, activityRevision: 3 };
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const s6 = 'A person checks the source, conditions, tone, and next step before the reply leaves the service.';
const base = (type: ShiftAction['type'], attributes = {}): ShiftAction => ({ type, quote: '', ...attributes }) as ShiftAction;
const review = () => base('human_check', { human_check: { checks: ['source', 'conditions', 'tone', 'next_step'] } });
const draft = () => base('ai_draft', { ai_draft: { states_conditions: true, forbids_promises: true } });
const route = (when: ShiftAction['when'] = 'if_held') => base('route_to_owner', { when, route_to_owner: { only_if_held: true } });
function mapped(workflow: string, rows: ShiftAction[][]): ShiftMapping {
  const steps = validateShiftWorkflow(workflow);
  return validateShiftMapping(rows.map((actions, index) => ({ step: index + 1, actions: actions.map(action => ({ ...action, quote: action.quote || steps[index] })) })), steps);
}
function safe() {
  const workflow = a.fixtures.safe!.workflow;
  const mapping = mapped(workflow, [
    [base('intake'), base('ask_missing_fact', { when: 'if_missing_fact' })],
    [base('find_source'), base('check_conditions')], [draft()], [review()],
    [route(), base('acknowledge_customer', { when: 'if_held' })], [base('release', { when: 'if_not_held' })],
  ]);
  return { workflow, mapping };
}
const accepted: ShiftAcceptanceInput = { confirmed: true, origin: 'student', prediction: { text: 'A receives conditions, B gets an owner handoff, C waits for its missing time.', confidence: 'medium' } };

test('revision 3 has a six-line positive route for A, B and C without inventing an approval', () => {
  const input = safe();
  assert(input.workflow.length <= 1200); assert.equal(validateShiftWorkflow(input.workflow).length, 6);
  assert.deepEqual(runShift(a, input.mapping).results.map(result => result.consequenceId), ['sent_conditions', 'exception_acknowledged']);
  assert.equal(runNextRequest(a, input.mapping).consequenceId, 'asked_missing_time');
  for (const result of [...runShift(a, input.mapping).results, runNextRequest(a, input.mapping)]) {
    assert(result.explanation); assert(result.trace!.length > 0);
    assert(!result.explanation!.includes('without checking confirmations'));
  }
  assert.equal(runShift(a, input.mapping).results[0].ownerRouted, false);
  assert.equal(runShift(a, input.mapping).results[1].ownerRouted, true);
  assert.equal(runNextRequest(a, input.mapping).ownerRouted, false);
});

test('the original worked v1/v2 outcomes remain aligned under revision 3', () => {
  const v1 = mapped(a.fixtures.v1.workflow, [[base('intake')], [base('find_source')], [base('ai_draft', { ai_draft: { states_conditions: false, forbids_promises: false } })], [base('human_check', { human_check: { checks: ['tone', 'accuracy'] } })], [base('release')]]);
  const v2 = mapped(a.fixtures.v2.workflow, [[base('intake')], [base('find_source')], [draft()], [base('human_check', { human_check: { checks: ['tone', 'accuracy', 'commitments', 'confirmations'] } })], [route()], [base('release', { when: 'if_not_held' })]]);
  assert.deepEqual(runShift(a, v1).results.map(result => result.consequenceId), ['false_confirmation', 'unsupported_commitment']);
  assert.deepEqual(runShift(a, v2).results.map(result => result.consequenceId), ['sent_conditions', 'routed_no_ack']);
  assert.equal(runNextRequest(a, v2).consequenceId, 'routine_escalated');
});

test('a guarded confirmation waits for supplied approval, and a later unguarded claim cannot override an earlier release', () => {
  const input = safe(), guarded = clone(input.mapping);
  guarded[5].actions.push({ type: 'confirm_change', quote: validateShiftWorkflow(input.workflow)[5], when: 'if_approved' });
  const b = runShift(a, guarded).results[1];
  assert.equal(b.consequenceId, 'exception_acknowledged');
  assert(b.trace!.some(event => event.type === 'confirm_change' && event.status === 'skipped' && event.detail.includes('No authorized approval')));
  const later = clone(input.mapping); later[5].actions.push(base('confirm_change', { quote: validateShiftWorkflow(input.workflow)[5] }));
  assert.equal(runShift(a, later).results[0].consequenceId, 'sent_conditions');
  assert(!runShift(a, later).results[0].trace!.some(event => event.type === 'confirm_change'));
  assert.equal(runShift(a, later).results[1].consequenceId, 'false_confirmation');
});

test('the exact S6 sentence is a complete review rather than a tone-only reading', () => {
  const mapping = [{ step: 1, actions: [{ type: 'human_check', quote: s6, human_check: { checks: ['source', 'conditions', 'tone', 'next_step'] } }] }];
  assert.deepEqual(validateShiftClassification({ mapping }, [s6]), mapping);
  for (const actions of [[], [{ type: 'human_check', quote: s6, human_check: { checks: ['tone'] } }], [...mapping[0].actions, { type: 'release', quote: 'the reply leaves the service' }]]) assert.throws(() => validateShiftClassification({ mapping: [{ step: 1, actions }] }, [s6]));
  assert.throws(() => validateShiftClassification({ mapping: [{ step: 1, actions: [{ ...mapping[0].actions[0], quote: 'tone' }] }] }, [s6]));
  const input = safe();
  assert(runShift(a, input.mapping).results[0].trace!.some(event => event.type === 'human_check' && event.detail.includes('coverage is present')));
});

test('review-report conditional exception and approval clauses cannot silently become unconditional actions', () => {
  const exception = 'If the request needs an exception, send it to the owner and tell the customer it is being reviewed';
  const correct = [{ step: 1, actions: [base('route_to_owner', { quote: exception, when: 'if_exception', route_to_owner: { only_if_held: false } }), base('acknowledge_customer', { quote: exception, when: 'if_exception' })] }];
  assert.deepEqual(validateShiftClassification({ mapping: correct }, [exception]), correct);
  const wrong = clone(correct); delete wrong[0].actions[0].when;
  assert.throws(() => validateShiftClassification({ mapping: wrong }, [exception]));
  const confirmation = 'Only after the owner approves, confirm the change to the customer';
  assert.throws(() => validateShiftClassification({ mapping: [{ step: 1, actions: [{ type: 'confirm_change', quote: confirmation }] }] }, [confirmation]));
  assert.equal(validateShiftClassification({ mapping: [{ step: 1, actions: [{ type: 'confirm_change', quote: confirmation, when: 'if_approved' }] }] }, [confirmation])[0].actions[0].when, 'if_approved');
});

test('acknowledgements never claim a handoff which has not happened', () => {
  const input = safe(), mapping = clone(input.mapping);
  mapping[4].actions = [base('acknowledge_customer', { quote: validateShiftWorkflow(input.workflow)[4], when: 'if_held' })];
  const b = runShift(a, mapping).results[1];
  assert.equal(b.ownerRouted, false); assert.equal(b.sent, true);
  assert.equal(b.draftId, 'acknowledgement-pending');
  assert(!a.drafts[b.draftId!].includes('sent it to the owner'));
  assert(b.trace!.some(event => event.type === 'acknowledge_customer' && event.detail.includes('makes no claim')));
  assert.equal(b.consequenceId, 'held_no_owner');
});

test('intake, source-condition checking, and exception-only routing have inspectable consequences', () => {
  const input = safe(), missingIntake = clone(input.mapping); missingIntake[0].actions = [];
  const result = runShift(a, missingIntake).results[0];
  assert.equal(result.consequenceId, 'stopped'); assert.match(result.explanation!, /no intake/);
  const skipped = clone(input.mapping); skipped[1].actions.reverse();
  const b = runShift(a, skipped).results[1];
  assert(b.trace!.some(event => event.type === 'check_conditions' && event.status === 'skipped'));
  const conditional = clone(input.mapping); conditional[4].actions[0] = { ...route('if_exception'), quote: validateShiftWorkflow(input.workflow)[4] };
  assert.equal(runShift(a, conditional).results[0].ownerRouted, false);
  assert.equal(runShift(a, conditional).results[1].ownerRouted, true);
  assert.equal(runNextRequest(a, conditional).ownerRouted, false);
});

test('common editor drafts preserve blank, unmatched and temporarily duplicate quotes without allowing execution', () => {
  const steps = ['Read the request and the source.'];
  const partial = [{ step: 1, actions: [base('intake'), base('intake')] }];
  assert.deepEqual(validateShiftMappingDraft(partial, steps), partial);
  assert.throws(() => validateShiftMapping(partial, steps));
  partial[0].actions[0].quote = 'An unfinished selection';
  assert.equal(validateShiftMappingDraft(partial, steps)[0].actions[0].quote, 'An unfinished selection');
  assert.throws(() => validateShiftMapping(partial, steps));
  assert.throws(() => validateShiftMappingDraft([{ step: 1, actions: [base('intake', { when: 'if_magic' })] }], steps));
});

test('revision 3 requires explicit acceptance and retains original AI proposal separately from corrected interpretation', () => {
  const input = safe();
  assert.throws(() => recordShiftRun(a, emptyShiftRecord(a), { ...input, classifiedBy: 'student' }), /explicitly accept/);
  const proposal = clone(input.mapping); proposal[3].actions = [base('human_check', { quote: validateShiftWorkflow(input.workflow)[3], human_check: { checks: ['tone'] } })];
  const usage = { inputTokens: 13, outputTokens: 7, totalTokens: 20 };
  const record = recordShiftRun(a, emptyShiftRecord(a), { ...input, classifiedBy: 'ai', modelId: 'test/fictional-model', usage, acceptance: { ...accepted, origin: 'ai-proposal', proposal: { mapping: proposal, modelId: 'test/fictional-model', usage } } });
  assert.equal(record.runs[0].acceptance!.corrected, true);
  assert.deepEqual(record.runs[0].acceptance!.proposal!.mapping, proposal);
  assert.deepEqual(record.runs[0].mapping, input.mapping);
  const forged = clone(record); forged.runs[0].acceptance!.corrected = false;
  assert.throws(() => validateShiftRecord(forged, a), /correction marker/);
  const exported = exportShiftRecord(a, record);
  assert(exported.includes('Original AI proposal (not automatically executed)'));
  assert(exported.includes('Learner-accepted interpretation'));
  assert(exported.includes('Prediction before this run'));
  assert(exported.includes('Accepted workflow execution trace'));
  assert(!formatShiftMapping(input.mapping).includes('"type"'));
});

test('accepted snapshots and actual traces are recomputed, while revision-2 results are not silently migrated', () => {
  const input = safe();
  const first = recordShiftRun(a, emptyShiftRecord(a), { ...input, classifiedBy: 'student', acceptance: accepted });
  const second = recordShiftRun(a, first, { ...input, reason: 'Keep the safe boundaries and communication.', classifiedBy: 'student', acceptance: accepted });
  const completed = recordNextRequest(a, second);
  assert.deepEqual(validateShiftRecord(clone(completed), a), completed);
  assert.equal(completed.nextRequest!.consequenceId, 'asked_missing_time');
  const forged = clone(completed); forged.runs[0].result.results[0].trace![0].detail = 'The owner approved the change.';
  assert.throws(() => validateShiftRecord(forged, a), /authored engine/);
  assert.throws(() => validateShiftRecord({ ...clone(completed), activityRevision: 2 }, a), /another activity/);
  assert.throws(() => recordShiftRun(a, second, { ...input, reason: 'Third try', classifiedBy: 'student', acceptance: accepted }), /two workflow runs/);
});

test('maximum-size Unicode and JSON-escaped accepted records stay inside a bounded restore/export ceiling', t => {
  for (const character of ['界', '\u0000']) {
    const lines = Array.from({ length: 6 }, () => character.repeat(195)); lines[0] += character.repeat(25);
    const workflow = lines.join('\n'); assert.equal(workflow.length, 1200);
    const mapping = mapped(workflow, [[base('intake'), base('find_source'), base('check_conditions')], ...Array.from({ length: 5 }, () => [draft(), review(), route()])]);
    const proposal = { mapping, modelId: 'm'.repeat(200), usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 } };
    const acceptance = { confirmed: true as const, origin: 'ai-proposal' as const, proposal, prediction: { text: character.repeat(500), confidence: 'low' as const } };
    const input = { workflow, mapping, classifiedBy: 'ai' as const, modelId: proposal.modelId, usage: proposal.usage, acceptance };
    const first = recordShiftRun(a, emptyShiftRecord(a), input);
    const second = recordShiftRun(a, first, { ...input, reason: character.repeat(200) });
    const completed = recordNextRequest(a, second), bytes = new TextEncoder().encode(JSON.stringify(completed)).byteLength;
    t.diagnostic(`${character === '界' ? 'Unicode' : 'JSON-escaped control'} fixture: ${bytes} bytes including two proposals, accepted mappings and all traces.`);
    assert(bytes > 48 * 1024, `The old 48KiB limit would have lost this valid record (${bytes} bytes)`);
    assert(bytes <= SHIFT_LIMITS.recordBytes, `${bytes} bytes exceeds the new bounded ceiling`);
    assert.deepEqual(validateShiftRecord(JSON.parse(JSON.stringify(completed)), a), completed);
  }
});
