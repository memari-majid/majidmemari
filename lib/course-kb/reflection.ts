/** Optional personal reflection. Browser-local only; this module has no network or analytics. */
export const REFLECTION_INSTRUMENT_VERSION = 'personal-reflection-v1';
export const REFLECTION_RESEARCH_MODE = false;
export const REFLECTION_MAX_TEXT = 1000;
export const REFLECTION_MAX_BYTES = 16 * 1024;
export const REFLECTION_EXPORT_STAMP = 'Learner reflection — self-report, not evidence of learning, a grade, or research consent.';
export const REFLECTION_CLARITY = ['clear', 'partly', 'unclear'] as const;
export const REFLECTION_HELPFULNESS = ['useful', 'partly', 'notuseful', 'notused'] as const;
export const REFLECTION_HELPED = ['source', 'figures', 'worked', 'companion', 'manual'] as const;
export const REFLECTION_ISSUES = ['confusion', 'possibleerror', 'accessibility', 'technical', 'other'] as const;
export type ReflectionContext = { unit: number; page: string; activityRevision: number; activityMode: 'decision-lab' | 'shift-run' };
export type ReflectionRecord = {
  version: 1;
  instrumentVersion: typeof REFLECTION_INSTRUMENT_VERSION;
  context: ReflectionContext;
  clarity: '' | typeof REFLECTION_CLARITY[number];
  helpfulness: '' | typeof REFLECTION_HELPFULNESS[number];
  whatHelped: (typeof REFLECTION_HELPED[number])[];
  selfExplanation: string;
  issueCategory: '' | typeof REFLECTION_ISSUES[number];
  comment: string;
};
export type ReflectionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type ReflectionRestore = { record: ReflectionRecord; preservedRaw: string | null; storageAvailable: boolean; hasSavedRecord: boolean };
export type ReflectionWrite = { ok: true } | { ok: false; reason: 'storage' | 'unrecognized'; preservedRaw?: string };
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function exactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  if (Object.keys(value).length !== keys.length || !keys.every(key => Object.hasOwn(value, key))) throw new Error('Unexpected reflection fields.');
}
function inList<T extends string>(value: unknown, values: readonly T[], allowEmpty = false): value is T | '' {
  return typeof value === 'string' && ((allowEmpty && value === '') || values.includes(value as T));
}
export function validateReflectionContext(value: unknown): ReflectionContext {
  if (!object(value)) throw new Error('Choose a current unit for this reflection.');
  exactKeys(value, ['unit', 'page', 'activityRevision', 'activityMode']);
  if (typeof value.unit !== 'number' || !Number.isInteger(value.unit) || value.unit < 1 || value.unit > 12 || value.page !== `unit-${String(value.unit).padStart(2, '0')}.html` || typeof value.activityRevision !== 'number' || !Number.isInteger(value.activityRevision) || value.activityRevision < 1 || value.activityRevision > 100 || !inList(value.activityMode, ['decision-lab', 'shift-run'])) throw new Error('Choose a current unit for this reflection.');
  if (value.activityMode === 'shift-run' && (value.unit !== 4 || value.activityRevision < 2)) throw new Error('The workflow reflection needs its current Unit 4 context.');
  return { unit: value.unit, page: value.page, activityRevision: value.activityRevision, activityMode: value.activityMode as ReflectionContext['activityMode'] };
}
/** Unknown assessment/support URLs must not turn into a default unit journal. */
export function reflectionAllowedForLesson(value: unknown): boolean {
  return value === undefined || value === '' || (typeof value === 'string' && /^unit-(?:0[1-9]|1[0-2])\.html$/.test(value));
}
export function reflectionStorageKey(context: ReflectionContext): string {
  const current = validateReflectionContext(context);
  return `course-personal-reflection:v1:${current.page}:activity-${current.activityRevision}:${current.activityMode}`;
}
export function emptyReflection(context: ReflectionContext): ReflectionRecord {
  return { version: 1, instrumentVersion: REFLECTION_INSTRUMENT_VERSION, context: validateReflectionContext(context), clarity: '', helpfulness: '', whatHelped: [], selfExplanation: '', issueCategory: '', comment: '' };
}
export function validateReflection(value: unknown, context: ReflectionContext): ReflectionRecord {
  const expected = validateReflectionContext(context);
  if (!object(value)) throw new Error('The saved journal has an unfamiliar format.');
  exactKeys(value, ['version', 'instrumentVersion', 'context', 'clarity', 'helpfulness', 'whatHelped', 'selfExplanation', 'issueCategory', 'comment']);
  const current = validateReflectionContext(value.context);
  if (value.version !== 1 || value.instrumentVersion !== REFLECTION_INSTRUMENT_VERSION || Object.keys(expected).some(key => expected[key as keyof ReflectionContext] !== current[key as keyof ReflectionContext])) throw new Error('The saved journal belongs to a different activity or instrument version.');
  if (!inList(value.clarity, REFLECTION_CLARITY, true) || !inList(value.helpfulness, REFLECTION_HELPFULNESS, true) || !inList(value.issueCategory, REFLECTION_ISSUES, true)) throw new Error('Choose one of the listed reflection options.');
  if (!Array.isArray(value.whatHelped) || value.whatHelped.length > REFLECTION_HELPED.length || value.whatHelped.some(item => !inList(item, REFLECTION_HELPED)) || new Set(value.whatHelped).size !== value.whatHelped.length) throw new Error('Choose each listed resource at most once.');
  for (const key of ['selfExplanation', 'comment'] as const) if (typeof value[key] !== 'string' || value[key].length > REFLECTION_MAX_TEXT) throw new Error('Keep each written reflection within 1,000 characters.');
  const result: ReflectionRecord = { version: 1, instrumentVersion: REFLECTION_INSTRUMENT_VERSION, context: current, clarity: value.clarity, helpfulness: value.helpfulness, whatHelped: [...value.whatHelped] as ReflectionRecord['whatHelped'], selfExplanation: value.selfExplanation as string, issueCategory: value.issueCategory, comment: value.comment as string };
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > REFLECTION_MAX_BYTES) throw new Error('The personal reflection is too large to save.');
  return result;
}
export function restoreReflection(raw: string | null, context: ReflectionContext): ReflectionRestore {
  const empty = emptyReflection(context);
  if (raw === null) return { record: empty, preservedRaw: null, storageAvailable: true, hasSavedRecord: false };
  try {
    if (new TextEncoder().encode(raw).byteLength > REFLECTION_MAX_BYTES) throw new Error('Oversized saved record');
    const parsed: unknown = JSON.parse(raw);
    // Only our compact saved format is interpreted. Preserve duplicate keys or
    // unfamiliar formatting rather than silently losing part of the raw text.
    if (JSON.stringify(parsed) !== raw) throw new Error('Unfamiliar saved serialization');
    return { record: validateReflection(parsed, context), preservedRaw: null, storageAvailable: true, hasSavedRecord: true };
  } catch { return { record: empty, preservedRaw: raw, storageAvailable: true, hasSavedRecord: false }; }
}
export function readReflectionStorage(context: ReflectionContext, storage: ReflectionStorage): ReflectionRestore {
  const key = reflectionStorageKey(context);
  try { return restoreReflection(storage.getItem(key), context); }
  catch { return { record: emptyReflection(context), preservedRaw: null, storageAvailable: false, hasSavedRecord: false }; }
}
/** A fresh read guards against silently replacing unfamiliar data at this key. */
export function saveReflectionStorage(record: ReflectionRecord, context: ReflectionContext, storage: ReflectionStorage): ReflectionWrite {
  const valid = validateReflection(record, context), key = reflectionStorageKey(context);
  try {
    const previous = restoreReflection(storage.getItem(key), context);
    if (previous.preservedRaw !== null) return { ok: false, reason: 'unrecognized', preservedRaw: previous.preservedRaw };
    storage.setItem(key, JSON.stringify(valid));
    return { ok: true };
  } catch { return { ok: false, reason: 'storage' }; }
}
/** The caller must first offer a copy and obtain an explicit clear choice. */
export function clearReflectionStorage(context: ReflectionContext, storage: ReflectionStorage): boolean {
  const key = reflectionStorageKey(context);
  try { storage.removeItem(key); return true; } catch { return false; }
}
export function exportReflection(record: ReflectionRecord, context: ReflectionContext): string {
  const valid = validateReflection(record, context);
  return [REFLECTION_EXPORT_STAMP, 'Personal journal. Research enrollment and research data collection through this journal are OFF. This export is not a report sent to Majid.', 'The questions are custom reflection prompts, not a validated measurement scale.', JSON.stringify(valid, null, 2)].join('\n\n');
}

export const COMPANION_PROMPT_CHIPS = [
  { id: 'question', label: 'Ask one guiding question', prompt: 'Ask one guiding question about my current course step. Help me reason from what I have shared without giving away a later worked answer.' },
  { id: 'explain', label: 'Explain another way', prompt: 'Explain the idea from my current course step another way, using a small example. Keep any later worked answer within its current activity phase.' },
  { id: 'numbers', label: 'Help me inspect the numbers', prompt: 'Help me inspect the numbers in this course step. Ask me to name the units and assumptions, then give one hint. Do not invent missing values.' },
] as const;
/** Editing help only: preserve the learner's draft and never send a request. */
export function prefillCompanionPrompt(draft: string, id: typeof COMPANION_PROMPT_CHIPS[number]['id']): string {
  const selected = COMPANION_PROMPT_CHIPS.find(chip => chip.id === id);
  if (!selected || typeof draft !== 'string') throw new Error('Choose one of the listed writing prompts.');
  const next = draft ? `${draft}\n\n${selected.prompt}` : selected.prompt;
  if (next.length > 4000) throw new Error('Keep the message within 4,000 characters before adding a prompt. Your draft has not changed.');
  return next;
}
