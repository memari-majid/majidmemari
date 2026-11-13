import test from 'node:test';
import assert from 'node:assert/strict';
import { runVisitorChanged, runVisitorFirst, runVisitorRevised, VISITOR_ACTIVITY } from './visitor-demo';

test('public preview follows the current authored evidence through its changed case', () => {
  assert.equal(VISITOR_ACTIVITY.activityRevision, 3);
  assert.deepEqual(runVisitorFirst().results.map(result => result.consequenceId), ['false_confirmation', 'unsupported_commitment']);
  assert.deepEqual(runVisitorRevised().results.map(result => result.consequenceId), ['sent_conditions', 'routed_no_ack']);
  assert.equal(runVisitorChanged('route').consequenceId, 'routine_escalated');
  assert.equal(runVisitorChanged('ask').consequenceId, 'asked_missing_time');
  for (const result of [...runVisitorFirst().results, ...runVisitorRevised().results, runVisitorChanged('route'), runVisitorChanged('ask')]) {
    assert(result.trace?.length, `${result.caseId} should have an inspectable trace`);
    assert(result.explanation, `${result.caseId} should explain the result`);
    assert(VISITOR_ACTIVITY.consequences[result.consequenceId]);
  }
});
