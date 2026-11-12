import test from 'node:test';
import assert from 'node:assert/strict';
import activities from '../../public/teaching/ai-solutions/assets/ta-activities.json' with { type: 'json' };
import { recordNextRequest, type ShiftMapping, type ShiftRunActivity } from './shift-run';
import { addShiftProposal, blankShiftSession, confirmShiftDraft, newShiftDraft, readShiftSession, requestShiftProposalAfterMarker, validateShiftDraft, validateShiftSession, type ShiftSession } from './shift-session';
import { commitShiftExplanation, exportShiftPractice, updateShiftExplanation, validateShiftPractice } from './shift-practice';
const activity = activities[3] as unknown as ShiftRunActivity;
const workflow = activity.fixtures.v1.workflow, steps = workflow.split('\n');
const mapping: ShiftMapping = [
  { step: 1, actions: [{ type: 'intake', quote: steps[0] }] },
  { step: 2, actions: [{ type: 'find_source', quote: steps[1] }] },
  { step: 3, actions: [{ type: 'ai_draft', quote: steps[2], ai_draft: { states_conditions: false, forbids_promises: false } }] },
  { step: 4, actions: [{ type: 'human_check', quote: steps[3], human_check: { checks: ['tone', 'accuracy'] } }] },
  { step: 5, actions: [{ type: 'release', quote: steps[4] }] },
];
function pending(ai = false) {
  const session = { ...blankShiftSession(activity), workflow };
  const empty = newShiftDraft(session);
  const draft = ai ? addShiftProposal(empty, { mapping, modelId: 'injected-test-model', usage: null }) : { ...empty, mapping: JSON.parse(JSON.stringify(mapping)) as ShiftMapping };
  return { ...session, draft };
}
function reviewed(ai = false): ShiftSession {
  const session = pending(ai);
  return { ...session, draft: { ...session.draft, reviewed: steps.map((_, index) => index + 1), prediction: { text: 'I expect two unsupported replies because commitments were not checked.', confidence: 'medium' } } };
}
function completedOne(): ShiftSession { return confirmShiftDraft(activity, reviewed(), true); }
function ownExplanation(session: ShiftSession, target: 'run-1' | 'run-2' | 'C') {
  const draft = updateShiftExplanation(session.practice, target, { explanation: 'The accepted trace shows a released unsupported promise.', revisionPlan: 'Check the deciding conditions and authority before sending.' }, activity, session.record);
  return { ...session, practice: commitShiftExplanation(draft, target, activity, session.record) };
}

test('receiving an AI proposal never runs, freezes or consumes a workflow version', () => {
  assert.equal(activity.activityRevision, 3);
  const session = pending(true);
  assert.equal(session.record.runs.length, 0);
  assert.equal(session.record.nextRequest, null);
  assert.equal(session.draft.origin, 'ai-proposal');
  assert.deepEqual(session.draft.mapping, mapping);
  session.draft.mapping[0].actions[0].quote = 'Read the';
  assert.equal(session.draft.proposal!.mapping[0].actions[0].quote, steps[0], 'The original proposal remains separate from editable accepted actions');
});

test('confirmation requires line review and explicit acceptance; optional predictions are complete or skipped', () => {
  assert.throws(() => confirmShiftDraft(activity, reviewed(true), false), /explicitly confirm/);
  assert.throws(() => confirmShiftDraft(activity, pending(true), true), /Review each line/);
  const session = reviewed();
  assert.throws(() => confirmShiftDraft(activity, { ...session, draft: { ...session.draft!, prediction: { text: '', confidence: 'low' } } }, true));
  assert.throws(() => confirmShiftDraft(activity, { ...session, draft: { ...session.draft!, prediction: { text: 'A short expectation.', confidence: '' } } }, true));
  const skipped = confirmShiftDraft(activity, { ...session, draft: { ...session.draft!, prediction: { text: '', confidence: '' } } }, true);
  assert.equal(skipped.record.runs[0].acceptance!.prediction, undefined);
  const confirmed = confirmShiftDraft(activity, session, true);
  assert.equal(confirmed.record.runs.length, 1);
  assert.equal(confirmed.draft, null);
  assert.equal(confirmed.record.runs[0].acceptance!.prediction!.confidence, 'medium');
  assert(Object.isFrozen(confirmed.record.runs[0].acceptance!.prediction));
});

test('both proposal and learner routes can accept an identical quote-level mapping and get identical consequences', () => {
  const manual = confirmShiftDraft(activity, reviewed(), true), ai = confirmShiftDraft(activity, reviewed(true), true);
  assert.deepEqual(manual.record.runs[0].mapping, ai.record.runs[0].mapping);
  assert.deepEqual(manual.record.runs[0].result, ai.record.runs[0].result);
  assert.equal(manual.record.runs[0].acceptance!.origin, 'student');
  assert.equal(ai.record.runs[0].acceptance!.origin, 'ai-proposal');
  assert.equal(ai.record.runs[0].acceptance!.corrected, false);
  assert.equal(ai.record.runs[0].usage, null, 'Unmeasured provider use must not become a claimed zero');
});

test('learner corrections preserve the original AI proposal and truthful origin', () => {
  const session = reviewed(true), draft = session.draft!;
  const action = draft.mapping[2].actions[0]; assert.equal(action.type, 'ai_draft');
  if (action.type === 'ai_draft') action.ai_draft.forbids_promises = true;
  const confirmed = confirmShiftDraft(activity, session, true), run = confirmed.record.runs[0];
  assert.equal(run.acceptance!.corrected, true);
  assert.equal(run.classifiedBy, 'ai');
  assert.equal(run.modelId, 'injected-test-model');
  const original = run.acceptance!.proposal!.mapping[2].actions[0];
  assert.equal(original.type, 'ai_draft');
  if (original.type === 'ai_draft') assert.equal(original.ai_draft.forbids_promises, false);
  assert.throws(() => validateShiftDraft({ ...draft, origin: 'student' }), /provenance/);
});

test('unfinished manual or corrected proposal quotes, guards and action order survive a reload without executing', () => {
  const session = pending(true);
  session.draft.mapping[0].actions = [{ type: 'intake', quote: '' }, { type: 'intake', quote: '' }];
  session.draft.mapping[1].actions[0].quote = 'A temporarily unmatched edit';
  session.draft.mapping[1].actions[0].when = 'if_exception';
  const raw = JSON.stringify(session), restored = readShiftSession(raw, activity);
  assert.equal(restored.unrecognized, null);
  assert.deepEqual(restored.session.draft, session.draft);
  assert.equal(restored.session.record.runs.length, 0);
  assert.throws(() => confirmShiftDraft(activity, { ...restored.session, draft: { ...restored.session.draft!, reviewed: [1, 2, 3, 4, 5], prediction: { text: 'Expectation', confidence: 'low' } } }, true), /quote|wording/i);
});

test('corrupt, previous-revision and forged local records remain raw read-only material, never current outcomes', () => {
  const valid = completedOne();
  const badResult = JSON.parse(JSON.stringify(valid)); badResult.record.runs[0].result.results[0].sent = false;
  for (const raw of ['{ damaged saved work', JSON.stringify({ ...valid, activityRevision: 2 }), JSON.stringify({ ...valid, version: 1 }), JSON.stringify({ ...valid, learnerId: 'not-permitted' }), JSON.stringify(badResult)]) {
    const restored = readShiftSession(raw, activity);
    assert.equal(restored.unrecognized, raw);
    assert.equal(restored.session.record.runs.length, 0);
  }
});

test('own explanations must follow a confirmed run, are bounded, and remain fixed before optional AI feedback', () => {
  const empty = blankShiftSession(activity);
  assert.throws(() => updateShiftExplanation(empty.practice, 'run-1', { explanation: 'Guess', revisionPlan: 'Next' }, activity, empty.record), /Run this case/);
  const session = completedOne();
  assert.throws(() => newShiftDraft(session), /Explain the previous run/);
  assert.throws(() => updateShiftExplanation(session.practice, 'run-1', { explanation: 'x'.repeat(1001), revisionPlan: 'Next' }, activity, session.record));
  const kept = ownExplanation(session, 'run-1');
  assert(kept.practice.responses['run-1']!.committed);
  assert.throws(() => updateShiftExplanation(kept.practice, 'run-1', { explanation: 'Replace after feedback', revisionPlan: 'New' }, activity, kept.record), /original pre-feedback/);
  assert.doesNotThrow(() => newShiftDraft({ ...kept, reason: 'Now I will check the source conditions.' }));
});

test('C retains a separate frozen expectation and the same accepted version-2 mapping', () => {
  let session = ownExplanation(completedOne(), 'run-1');
  session = { ...session, reason: 'Check the next step before release.', draft: null };
  const draft = newShiftDraft(session);
  session = confirmShiftDraft(activity, { ...session, draft: { ...draft, mapping, reviewed: [1, 2, 3, 4, 5], prediction: { text: 'I expect the same outcome while I keep the same workflow.', confidence: 'low' } } }, true);
  session = ownExplanation(session, 'run-2');
  const record = recordNextRequest(activity, session.record);
  const prediction = { text: 'The missing session time will matter.', confidence: 'medium' as const };
  const complete = validateShiftSession({ ...session, record, practice: { ...session.practice, nextPredictionDraft: prediction, nextPrediction: prediction } }, activity);
  const skipped = validateShiftSession({ ...session, record, practice: { ...session.practice, nextPredictionDraft: { text: '', confidence: '' }, nextPrediction: null } }, activity);
  assert.equal(skipped.practice.nextPrediction, null, 'C also permits an explicit blank optional prediction');
  assert.equal(complete.record.nextRequest!.caseId, 'C');
  assert.deepEqual(complete.record.runs[1].mapping, mapping);
  assert.throws(() => validateShiftPractice({ ...complete.practice, nextPredictionDraft: { ...prediction, text: 'Rewrite after seeing C' } }, activity, complete.record), /original C prediction/);
  assert.match(exportShiftPractice(complete.practice, activity, complete.record), /not a validated learning measure/);
  assert(!Object.hasOwn(complete.practice, 'journal'));
  assert(!Object.hasOwn(complete.practice, 'learnerId'));
});


test('an online proposal never starts when the device-local attempt marker cannot be persisted', async () => {
  const events: string[] = [];
  let requests = 0;
  const blocked = await requestShiftProposalAfterMarker(() => { events.push('save blocked'); return false; }, async () => { requests += 1; events.push('network'); return 'proposal'; });
  assert.deepEqual(blocked, { started: false });
  assert.equal(requests, 0);
  assert.deepEqual(events, ['save blocked']);
  const accepted = await requestShiftProposalAfterMarker(() => { events.push('saved'); return true; }, async () => { requests += 1; events.push('network'); return 'proposal'; });
  assert.deepEqual(accepted, { started: true, value: 'proposal' });
  assert.equal(requests, 1);
  assert.deepEqual(events, ['save blocked', 'saved', 'network']);
});
