import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkpointCourseConversation } from './conversation-checkpoint';
import { parseCourseSession, serializeCourseSession } from './session';
import type { CourseChatMessage, CourseLearningPhase } from './types';

const user = (phase?: CourseLearningPhase): CourseChatMessage => ({ id: 'question', role: 'user', parts: [{ type: 'text', text: 'Coach my recorded attempt.' }], ...(phase ? { metadata: { learningPhase: phase } } : {}) });
const assistant = (phase?: CourseLearningPhase): CourseChatMessage => ({ id: 'reply', role: 'assistant', parts: [{ type: 'text', text: 'A partial explanation' }], ...(phase ? { metadata: { learningPhase: phase } } : {}) });

test('saved coaching messages retain their original phase, independently of the current step', () => {
  for (const phase of ['decide', 'investigate', 'revise', 'transfer'] as const) {
    const restored = parseCourseSession(serializeCourseSession([user(phase), assistant(phase)], 'unit-01.html'));
    assert.deepEqual(restored.messages.map(message => message.metadata?.learningPhase), [phase, phase]);
  }
  const legacy = parseCourseSession(serializeCourseSession([user(), assistant()], 'unit-01.html'));
  assert(legacy.messages.every(message => message.metadata?.learningPhase === undefined), 'Never guess a phase for legacy coaching');
});

test('restore allowlists phase and interruption metadata without accepting arbitrary fields', () => {
  const restored = parseCourseSession(JSON.stringify({ version: 2, lesson: 'unit-01.html', messages: [
    { ...user(), metadata: { learningPhase: 'submit-grade', requestInterrupted: 'yes', secret: 'discard' } },
    { ...assistant(), metadata: { learningPhase: 'revise', finishReason: 'stop', requestInterrupted: true, secret: 'discard' } },
  ] }));
  assert.equal(restored.messages[0].metadata, undefined);
  assert.deepEqual(restored.messages[1].metadata, { learningPhase: 'revise', finishReason: 'stop' });
});

test('a pending question survives closing before any response text arrives', () => {
  const sourceOnly: CourseChatMessage = { id: 'source-only', role: 'assistant', parts: [{ type: 'source-url', sourceId: 'one', url: '/teaching/ai-solutions/unit-01.html', title: 'Unit 1' }], metadata: { learningPhase: 'decide' } };
  const restored = parseCourseSession(serializeCourseSession([user('decide'), sourceOnly], 'unit-01.html', new Set(), true));
  assert.equal(restored.messages.length, 1, 'Do not fabricate an answer for a source-only response');
  assert.deepEqual(restored.messages[0].metadata, { learningPhase: 'decide', requestInterrupted: true });
});

test('closing a streaming conversation saves the question and partial response before stopping', () => {
  const order: string[] = []; let raw = '';
  const result = checkpointCourseConversation({ sessionReady: true, lesson: 'unit-01.html', messages: [user('investigate'), assistant('investigate')], interrupted: new Set(), busy: true }, value => { raw = value; order.push('saved'); }, () => { order.push('stopped'); });
  assert.deepEqual(order, ['saved', 'stopped']);
  assert.equal(result.saved, true);
  const restored = parseCourseSession(raw).messages;
  assert.equal(restored[0].metadata?.requestInterrupted, true);
  assert.deepEqual(restored[1].metadata, { learningPhase: 'investigate', finishReason: 'error' });
  assert.deepEqual(result.messages, restored);
});

test('blocked storage does not leave generation running, and an unhydrated cleanup never overwrites saved history', () => {
  let stops = 0;
  const state = { sessionReady: true, lesson: 'unit-01.html', messages: [user('decide')], interrupted: new Set<string>(), busy: true };
  const blocked = checkpointCourseConversation(state, () => { throw new Error('Storage blocked'); }, () => { stops++; });
  assert.equal(blocked.saved, false);
  assert.equal(stops, 1);
  assert.equal(blocked.messages[0].metadata?.requestInterrupted, true);
  let writes = 0;
  checkpointCourseConversation({ ...state, sessionReady: false }, () => { writes++; }, () => { stops++; });
  assert.equal(writes, 0);
  assert.equal(stops, 1);
});

test('closing an idle completed reply preserves its completion and does not abort it', () => {
  let stopped = false;
  const complete = { ...assistant('revise'), metadata: { learningPhase: 'revise' as const, finishReason: 'stop' as const } };
  const result = checkpointCourseConversation({ sessionReady: true, lesson: 'unit-01.html', messages: [user('revise'), complete], interrupted: new Set(), busy: false }, () => {}, () => { stopped = true; });
  assert.equal(stopped, false);
  assert.equal(result.messages[0].metadata?.requestInterrupted, undefined);
  assert.equal(result.messages[1].metadata?.finishReason, 'stop');
});


test('closing after a failed request preserves a retryable question without aborting an idle request', () => {
  let stopped = false;
  const result = checkpointCourseConversation({ sessionReady: true, lesson: 'unit-01.html', messages: [user('decide')], interrupted: new Set(), busy: false, failed: true }, () => {}, () => { stopped = true; });
  assert.equal(stopped, false);
  assert.equal(result.messages[0].metadata?.requestInterrupted, true);
});
