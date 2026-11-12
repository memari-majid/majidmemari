import test from 'node:test';
import assert from 'node:assert/strict';
import { clearReflectionStorage, COMPANION_PROMPT_CHIPS, emptyReflection, exportReflection, prefillCompanionPrompt, readReflectionStorage, reflectionAllowedForLesson, reflectionStorageKey, REFLECTION_EXPORT_STAMP, REFLECTION_INSTRUMENT_VERSION, REFLECTION_MAX_BYTES, REFLECTION_RESEARCH_MODE, restoreReflection, saveReflectionStorage, validateReflection, validateReflectionContext, type ReflectionContext, type ReflectionStorage } from './reflection';

const context: ReflectionContext = { unit: 4, page: 'unit-04.html', activityRevision: 2, activityMode: 'shift-run' };
function storage(initial: Map<string, string> = new Map()) {
  const calls: [string, string][] = [];
  const io: ReflectionStorage = {
    getItem(key) { calls.push(['read', key]); return initial.get(key) ?? null; },
    setItem(key, value) { calls.push(['write', key]); initial.set(key, value); },
    removeItem(key) { calls.push(['remove', key]); initial.delete(key); },
  };
  return { initial, io, calls };
}

test('the personal journal does not enable research and accepts a fully skipped reflection', () => {
  assert.equal(REFLECTION_RESEARCH_MODE, false);
  const record = emptyReflection(context);
  assert.deepEqual(validateReflection(record, context), record);
  assert.equal(record.instrumentVersion, REFLECTION_INSTRUMENT_VERSION);
  assert.deepEqual(Object.keys(record).sort(), ['version', 'instrumentVersion', 'context', 'clarity', 'helpfulness', 'whatHelped', 'selfExplanation', 'issueCategory', 'comment'].sort());
  assert.deepEqual(Object.keys(record.context).sort(), ['unit', 'page', 'activityRevision', 'activityMode'].sort());
});

test('reflection context accepts only current numbered units and keeps versions and modes separate', () => {
  for (const invalid of [null, {}, { ...context, unit: 0 }, { ...context, unit: 13 }, { ...context, page: 'milestone-4.html' }, { ...context, page: 'individual-exam.html' }, { ...context, activityMode: 'exam' }, { ...context, unit: 3, page: 'unit-03.html' }, { ...context, activityRevision: 1 }, { ...context, learnerId: 'anything' }]) assert.throws(() => validateReflectionContext(invalid));
  assert.notEqual(reflectionStorageKey(context), reflectionStorageKey({ ...context, activityRevision: 3 }));
  assert.notEqual(reflectionStorageKey(context), reflectionStorageKey({ ...context, activityMode: 'decision-lab' }));
  assert.notEqual(reflectionStorageKey(context), reflectionStorageKey({ ...context, unit: 6, page: 'unit-06.html', activityMode: 'decision-lab' }));
});

test('unknown lessons, support pages and assessments cannot enable the journal by normalizing to Unit 1', () => {
  for (const value of ['individual-exam.html', 'final-exam.html', 'milestone-5.html', 'resources.html', 'assessment-09.html', 'unit-00.html', 'unit-13.html', 'UNIT-04.HTML', 'unit-04.html?exam=1', '/unit-04.html', null, 4]) assert.equal(reflectionAllowedForLesson(value), false);
  for (const value of [undefined, '', 'unit-01.html', 'unit-04.html', 'unit-12.html']) assert.equal(reflectionAllowedForLesson(value), true);
});

test('valid optional responses round-trip without creating a timestamp, identity or performance score', () => {
  const record = { ...emptyReflection(context), clarity: 'partly' as const, helpfulness: 'notused' as const, whatHelped: ['figures', 'manual'] as ('figures' | 'manual')[], selfExplanation: 'A draft time is only part of the task.', issueCategory: 'possibleerror' as const, comment: 'I want to check the denominator.' };
  const raw = JSON.stringify(record), restored = restoreReflection(raw, context);
  assert.deepEqual(restored.record, record);
  assert.equal(restored.preservedRaw, null);
  assert.equal(restored.hasSavedRecord, true);
  assert.equal(restored.storageAvailable, true);
  assert(!Object.hasOwn(restored.record, 'timestamp'));
  assert(!Object.hasOwn(restored.record, 'score'));
});

test('unrecognized fields, enum changes, duplicate choices and overlong text are rejected', () => {
  const record = emptyReflection(context);
  for (const bad of [
    { ...record, email: 'not-collected@example.test' }, { ...record, rawChat: [] }, { ...record, workbook: {} }, { ...record, consent: true },
    { ...record, instrumentVersion: 'validated-scale-v1' }, { ...record, clarity: 'mastered' }, { ...record, helpfulness: '5' }, { ...record, issueCategory: 'diagnosis' },
    { ...record, whatHelped: ['manual', 'manual'] }, { ...record, whatHelped: ['grade'] }, { ...record, whatHelped: 'source' },
    { ...record, selfExplanation: 'x'.repeat(1001) }, { ...record, comment: 'x'.repeat(1001) }, { ...record, context: { ...context, activityRevision: 3 } },
  ]) assert.throws(() => validateReflection(bad, context));
  assert.doesNotThrow(() => validateReflection({ ...record, selfExplanation: 'x'.repeat(1000), comment: 'x'.repeat(1000) }, context));
});

test('corrupt, legacy, oversized or foreign-context saved text remains losslessly copyable and is not treated as answers', () => {
  const raws = ['not JSON', '', '{"version":1,"answers":"legacy"}', JSON.stringify(emptyReflection(context), null, 2), JSON.stringify(emptyReflection(context)).replace('\"comment\":\"\"', '\"comment\":\"earlier\",\"comment\":\"later\"'), JSON.stringify({ ...emptyReflection(context), context: { ...context, activityRevision: 3 } }), ' '.repeat(REFLECTION_MAX_BYTES) + JSON.stringify(emptyReflection(context))];
  for (const raw of raws) {
    const restored = restoreReflection(raw, context);
    assert.equal(restored.preservedRaw, raw);
    assert.deepEqual(restored.record, emptyReflection(context));
    assert.equal(restored.hasSavedRecord, false);
  }
});

test('reading an untouched journal is read-only and never creates an empty participation record', () => {
  const store = storage();
  const state = readReflectionStorage(context, store.io);
  assert.equal(state.hasSavedRecord, false);
  assert.equal(store.initial.size, 0);
  assert.deepEqual(store.calls, [['read', reflectionStorageKey(context)]]);
});

test('save and clear touch only the dedicated current journal key, leaving chat, workbook and other units unchanged', () => {
  const other = reflectionStorageKey({ ...context, unit: 6, page: 'unit-06.html', activityMode: 'decision-lab' });
  const store = storage(new Map([['course-chat-session', 'private conversation'], ['course-workbook', 'private notes'], [other, 'another journal']]));
  const before = new Map(store.initial);
  assert.deepEqual(saveReflectionStorage({ ...emptyReflection(context), comment: 'A local note.' }, context, store.io), { ok: true });
  assert.equal(store.initial.size, before.size + 1);
  for (const [key, raw] of before) assert.equal(store.initial.get(key), raw);
  assert(clearReflectionStorage(context, store.io));
  assert.deepEqual(store.initial, before);
  assert(store.calls.every(([, key]) => key === reflectionStorageKey(context)));
});

test('saving never overwrites unfamiliar raw data, including an empty string stored at the current key', () => {
  for (const raw of ['{ damaged but important', '']) {
    const key = reflectionStorageKey(context), store = storage(new Map([[key, raw]]));
    assert.deepEqual(saveReflectionStorage(emptyReflection(context), context, store.io), { ok: false, reason: 'unrecognized', preservedRaw: raw });
    assert.equal(store.initial.get(key), raw);
    assert(!store.calls.some(([action]) => action === 'write'));
  }
});

test('blocked storage preserves the editable in-memory record and its copyable export', () => {
  const blocked: ReflectionStorage = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); }, removeItem() { throw new Error('Blocked'); } };
  const record = { ...emptyReflection(context), selfExplanation: 'Keep my own reasoning.' };
  const restored = readReflectionStorage(context, blocked);
  assert.equal(restored.storageAvailable, false);
  assert.deepEqual(saveReflectionStorage(record, context, blocked), { ok: false, reason: 'storage' });
  assert.equal(clearReflectionStorage(context, blocked), false);
  assert.equal(record.selfExplanation, 'Keep my own reasoning.');
  assert.match(exportReflection(record, context), /Keep my own reasoning/);
});

test('export clearly identifies self-report and instrument/activity version without implying consent, sharing or a learning gain', () => {
  const record = { ...emptyReflection(context), clarity: 'clear' as const, helpfulness: 'useful' as const };
  const result = exportReflection(record, context);
  assert(result.startsWith(REFLECTION_EXPORT_STAMP));
  assert.match(result, /not evidence of learning, a grade, or research consent/);
  assert.match(result, /research data collection through this journal are OFF/);
  assert.match(result, /not a validated measurement scale/);
  const decoded = JSON.parse(result.split('\n\n').at(-1)!);
  assert.deepEqual(decoded, record);
  assert.equal(decoded.context.activityMode, 'shift-run');
  assert.equal(decoded.context.activityRevision, 2);
});

test('message starters only produce editable drafts, preserve existing text and never fabricate a sent request', () => {
  const original = 'My original reasoning.';
  for (const chip of COMPANION_PROMPT_CHIPS) {
    assert.equal(prefillCompanionPrompt('', chip.id), chip.prompt);
    assert.equal(prefillCompanionPrompt(original, chip.id), `${original}\n\n${chip.prompt}`);
  }
  assert.throws(() => prefillCompanionPrompt('x'.repeat(4000), 'question'), /draft has not changed/);
  assert.equal(original, 'My original reasoning.');
  assert.throws(() => prefillCompanionPrompt('', 'unknown' as 'question'));
});


test('the optional native disclosure is absent from server markup until its client storage read, avoiding browser-open restoration during hydration', async () => {
  const { createElement } = await import('react');
  const { renderToString } = await import('react-dom/server');
  const { ReflectionJournal } = await import('../../app/teaching/ai-solutions/assistant/ReflectionJournal');
  assert.equal(renderToString(createElement(ReflectionJournal, { context })), '');
});
