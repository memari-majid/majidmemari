'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { clearReflectionStorage, emptyReflection, exportReflection, readReflectionStorage, readPreviousReflectionStorage, REFLECTION_EXPORT_STAMP, REFLECTION_MAX_TEXT, REFLECTION_RESEARCH_MODE, saveReflectionStorage, validateReflectionContext, type ReflectionContext, type ReflectionRecord } from '@/lib/course-kb/reflection';

const field = 'mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 focus:outline-2 focus:outline-offset-2 focus:outline-teal-700 disabled:bg-slate-100';
const secondary = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-teal-700 disabled:opacity-50';
const helpedChoices = [{ value: 'source', label: 'Source material' }, { value: 'figures', label: 'Figures or simulations' }, { value: 'worked', label: 'Worked example or reading route' }, { value: 'companion', label: 'Learning Companion conversation' }, { value: 'manual', label: 'Working without AI' }] as const;

/** Personal reflection only. No network, background events, learner identifiers or study enrollment. */
export function ReflectionJournal({ context, onUnsavedChange }: { context: ReflectionContext; onUnsavedChange?: (dirty: boolean) => void }) {
  const current = useMemo(() => validateReflectionContext({ unit: context.unit, page: context.page, activityRevision: context.activityRevision, activityMode: context.activityMode }), [context.unit, context.page, context.activityRevision, context.activityMode]);
  const [record, setRecord] = useState<ReflectionRecord>(() => emptyReflection(current));
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [preservedRaw, setPreservedRaw] = useState<string | null>(null);
  const [previous, setPrevious] = useState<{ activityRevision: 2; raw: string }[]>([]);
  const previousControl = useRef<HTMLTextAreaElement>(null);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState('');
  const [exportText, setExportText] = useState<string | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [clearAcknowledged, setClearAcknowledged] = useState(false);
  const copyControl = useRef<HTMLTextAreaElement>(null);
  const preservedControl = useRef<HTMLTextAreaElement>(null);
  const prefix = useId();
  const disabled = !ready || preservedRaw !== null;

  useEffect(() => {
    try {
      const saved = readReflectionStorage(current, sessionStorage);
      setRecord(saved.record); setPreservedRaw(saved.preservedRaw); setStorageAvailable(saved.storageAvailable);
      setPrevious(readPreviousReflectionStorage(current, sessionStorage));
      if (saved.hasSavedRecord) setNotice('Your previously saved personal reflection is ready. Nothing was sent.');
    } catch { setStorageAvailable(false); }
    setReady(true);
  }, [current]);

  function update<K extends keyof Pick<ReflectionRecord, 'clarity' | 'helpfulness' | 'whatHelped' | 'selfExplanation' | 'issueCategory' | 'comment'>>(key: K, value: ReflectionRecord[K]) {
    setRecord(previous => ({ ...previous, [key]: value })); setDirty(true); onUnsavedChange?.(true); setNotice('Edited on this page. Choose Save in this tab or export a copy before leaving.');
  }
  function save() {
    try {
      const result = saveReflectionStorage(record, current, sessionStorage);
      if (!result.ok) {
        if (result.reason === 'unrecognized') { setPreservedRaw(result.preservedRaw ?? ''); setNotice('An unfamiliar saved record was found. Keep a copy below before choosing whether to clear it.'); }
        else { setStorageAvailable(false); setNotice('Browser storage is unavailable. Your reflection remains on this page; export or copy it before leaving.'); }
        return;
      }
      setDirty(false); onUnsavedChange?.(false); setStorageAvailable(true); setNotice('Saved only in this browser tab. Nothing was sent to Majid or a research database.');
    } catch { setStorageAvailable(false); setNotice('Could not save in this browser tab. Keep an export or copy before leaving.'); }
  }
  function showExport() {
    setExportText(exportReflection(record, current)); setNotice('A copyable snapshot is available below. Export again after further edits. Nothing was sent or submitted.');
  }
  function clearCurrent() {
    if (!clearAcknowledged) return;
    let removed = false;
    try { removed = clearReflectionStorage(current, sessionStorage); } catch { /* The local page can still be reset. */ }
    if (!removed) { setStorageAvailable(false); setNotice('Storage could not be cleared. Any saved copy has not been changed; reload may restore it. You can keep using or copying this page.'); setClearOpen(false); return; }
    setRecord(emptyReflection(current)); setPreservedRaw(null); setExportText(null); setDirty(false); onUnsavedChange?.(false); setClearOpen(false); setClearAcknowledged(false);
    setNotice('Only this unit and activity version’s personal reflection was cleared from this browser tab. Other course work and conversations were left alone.');
  }

  // Browsers may restore a native details element's open attribute before
  // hydration. Create only this optional disclosure after the existing client
  // restore has finished, so it starts closed without a hydration mismatch.
  // No journal record is written by this initial read.
  if (!ready) return null;

  return <details className="mt-7 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
    <summary className="min-h-11 cursor-pointer text-sm font-semibold leading-6 text-slate-900">Reflect &amp; improve · optional personal journal</summary>
    <div className="mt-3 min-w-0">
      <p className="text-sm leading-6 text-slate-700">Pause to explain what you understand and what you want to try next. Every question is optional. You can skip or close this section without affecting your course work.</p>
      <p className="mt-3 text-xs leading-6 text-slate-600">Saved only in this browser tab; nothing is sent to Majid or a research database. Export a copy only if you choose to keep it or share it yourself. These custom prompts are for reflection, not a validated measurement scale.</p>
      <p className="mt-2 text-xs leading-6 text-slate-600">{REFLECTION_RESEARCH_MODE ? 'Research collection would require a separate approved study and consent; this journal does not enroll you.' : 'Research data collection through this journal is off. This journal does not enroll you in research and is not a Canvas submission or a grade.'} Do not enter names, confidential partner information or personal records.</p>
      {previous.length ? <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Earlier Unit 4 journal · revision 2 · read-only</summary><p className="mt-2 text-xs leading-6 text-slate-600">The rehearsal changed. Your earlier journal remains its original text and is not used as answers, predictions or AI context for this version. Clearing the current journal does not remove it.</p><label htmlFor={`${prefix}-previous`} className="mt-3 block text-xs font-semibold">Earlier original journal text</label><textarea ref={previousControl} id={`${prefix}-previous`} readOnly rows={6} value={previous[0].raw} className={field} /><button type="button" className={`${secondary} mt-3`} onClick={() => { previousControl.current?.focus(); previousControl.current?.select(); setNotice('Earlier journal text selected. Use your device’s Copy command. Nothing was sent or converted.'); }}>Select earlier journal to copy</button></details> : null}
      {preservedRaw !== null ? <section className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4" aria-label="Preserved unfamiliar journal data">
        <h3 className="text-sm font-semibold text-amber-950">Your saved text has been preserved</h3>
        <p className="mt-2 text-xs leading-6 text-amber-950">This record could not be read as the current journal. It has not been rewritten or interpreted as your answers. Select and copy the exact original text before using Clear this journal if you want to start again.</p>
        <label htmlFor={`${prefix}-preserved`} className="mt-3 block text-xs font-semibold">Original saved text · read-only</label>
        <textarea id={`${prefix}-preserved`} ref={preservedControl} readOnly rows={5} value={preservedRaw} className={field} />
        <button type="button" className={`${secondary} mt-3`} onClick={() => { preservedControl.current?.focus(); preservedControl.current?.select(); setNotice('Original text selected. Use your device’s Copy command. Nothing was sent.'); }}>Select original text to copy</button>
      </section> : null}
      <fieldset disabled={disabled} className="mt-5 min-w-0 space-y-5 disabled:opacity-60">
        <legend className="text-sm font-semibold text-slate-900">Unit {current.unit} · your reflection</legend>
        <div><label htmlFor={`${prefix}-clarity`} className="block text-sm font-medium">How clear does this idea feel to you?</label><select id={`${prefix}-clarity`} value={record.clarity} onChange={event => update('clarity', event.target.value as ReflectionRecord['clarity'])} className={field}><option value="">Skip this question</option><option value="clear">Clear</option><option value="partly">Partly clear</option><option value="unclear">Unclear</option></select></div>
        <div><label htmlFor={`${prefix}-helpfulness`} className="block text-sm font-medium">If you used the Learning Companion, how useful did it feel?</label><select id={`${prefix}-helpfulness`} value={record.helpfulness} onChange={event => update('helpfulness', event.target.value as ReflectionRecord['helpfulness'])} className={field}><option value="">Skip this question</option><option value="useful">Useful</option><option value="partly">Partly useful</option><option value="notuseful">Not useful</option><option value="notused">I did not use it</option></select></div>
        <fieldset className="min-w-0"><legend className="text-sm font-medium">What helped you think? · choose any, or skip</legend>{helpedChoices.map(choice => <label key={choice.value} className="mt-3 flex min-h-7 items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1" checked={record.whatHelped.includes(choice.value)} onChange={event => update('whatHelped', event.target.checked ? [...record.whatHelped, choice.value] : record.whatHelped.filter(value => value !== choice.value))} />{choice.label}</label>)}</fieldset>
        <div><label htmlFor={`${prefix}-explanation`} className="block text-sm font-medium">Explain the idea in your own words, or name your next step · optional</label><textarea id={`${prefix}-explanation`} rows={4} maxLength={REFLECTION_MAX_TEXT} value={record.selfExplanation} onChange={event => update('selfExplanation', event.target.value)} className={field} /><p className="mt-1 text-xs text-slate-500">{record.selfExplanation.length}/1,000 characters. Your own explanation is not a checked learning result.</p></div>
        <div><label htmlFor={`${prefix}-issue`} className="block text-sm font-medium">Anything you want to inspect or improve? · optional</label><select id={`${prefix}-issue`} value={record.issueCategory} onChange={event => update('issueCategory', event.target.value as ReflectionRecord['issueCategory'])} className={field}><option value="">Skip this question</option><option value="confusion">Something was confusing</option><option value="possibleerror">A possible error</option><option value="accessibility">An accessibility issue</option><option value="technical">A technical issue</option><option value="other">Something else</option></select></div>
        <div><label htmlFor={`${prefix}-comment`} className="block text-sm font-medium">Note what happened or what you would change · optional</label><textarea id={`${prefix}-comment`} rows={3} maxLength={REFLECTION_MAX_TEXT} value={record.comment} onChange={event => update('comment', event.target.value)} className={field} /><p className="mt-1 text-xs text-slate-500">{record.comment.length}/1,000 characters. This is a private note, not a bug report sent to Majid.</p></div>
      </fieldset>
      <div className="mt-5 flex flex-wrap gap-3"><button type="button" disabled={disabled} onClick={save} className={secondary}>Save in this tab</button><button type="button" disabled={!ready} onClick={showExport} className={secondary}>Export / show copyable reflection</button><button type="button" disabled={!ready} onClick={() => { setClearOpen(true); setClearAcknowledged(false); }} className="min-h-11 px-2 text-sm font-semibold text-slate-600 underline underline-offset-4">Clear this journal</button></div>
      {exportText !== null ? <section className="mt-4 rounded-lg border border-slate-200 p-4"><label htmlFor={`${prefix}-export`} className="block text-sm font-semibold">Personal reflection to copy</label><p className="mt-2 text-xs leading-6 text-slate-600">{REFLECTION_EXPORT_STAMP} This snapshot includes your current visible answers, whether saved or not.</p><textarea id={`${prefix}-export`} ref={copyControl} readOnly rows={10} value={exportText} className={field} /><button type="button" className={`${secondary} mt-3`} onClick={() => { copyControl.current?.focus(); copyControl.current?.select(); setNotice('Reflection selected. Use your device’s Copy command. You choose whether to share it.'); }}>Select reflection to copy</button></section> : null}
      {clearOpen ? <section className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4" aria-label="Confirm clearing this personal journal"><h3 className="text-sm font-semibold">Keep a copy before clearing</h3><p className="mt-2 text-xs leading-6">Only this unit and activity version’s journal will be removed. If you want it later, copy the reflection or preserved original text first. Workbook notes, conversations and practice records are separate.</p><label className="mt-3 flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1" checked={clearAcknowledged} onChange={event => setClearAcknowledged(event.target.checked)} />I have kept any copy I want and choose to clear only this journal.</label><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={!clearAcknowledged} className={secondary} onClick={clearCurrent}>Clear only this journal</button><button type="button" className={secondary} onClick={() => setClearOpen(false)}>Keep journal</button></div></section> : null}
      <p role="status" aria-live="polite" className="mt-4 text-sm leading-6 text-slate-700">{notice}</p>
      <p className={`mt-2 text-xs leading-6 ${storageAvailable ? 'text-slate-500' : 'text-amber-950'}`}>{storageAvailable ? dirty ? 'Your edits are on this page only until you choose Save in this tab. Keep an export beyond this tab.' : 'This journal has its own local storage key. No course completion or research record is created.' : 'Browser storage is blocked or unavailable. You can still write and export or copy this journal while the page stays open.'}</p>
    </div>
  </details>;
}
