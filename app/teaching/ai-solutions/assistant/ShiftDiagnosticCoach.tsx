'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { formatShiftMapping, type ShiftRecord, type ShiftRunActivity } from '@/lib/course-kb/shift-run';
import { readShiftCoachSession, shiftCoachContext, shiftCoachExport, shiftCoachRequest, shiftCoachStorageIdentity, validateShiftCoachAnswer, writtenShiftCoachAnswer, type ShiftCoachAnswer, type ShiftCoachPurpose, type ShiftCoachSession, type ShiftCoachTarget } from '@/lib/course-kb/shift-coach';

const button = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50';
const field = 'mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:outline-2 focus:outline-offset-2 focus:outline-teal-700';

/** Optional one-question selection after the parent freezes the learner's explanation.
 * The local attempt marker is a practice budget, not authenticated history or research logging. */
export function ShiftDiagnosticCoach({ activity, record, target, studentExplanation, revisionPlan, canvasDelivery }: {
  activity: ShiftRunActivity; record: ShiftRecord; target: ShiftCoachTarget; studentExplanation: string; revisionPlan: string; canvasDelivery: boolean;
}) {
  const [purpose, setPurpose] = useState<ShiftCoachPurpose | ''>('');
  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState<ShiftCoachSession | null>(null);
  const [preserved, setPreserved] = useState<string | null>(null);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [written, setWritten] = useState<ShiftCoachAnswer | null>(null);
  const [codeNeeded, setCodeNeeded] = useState(false);
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [exportText, setExportText] = useState<string | null>(null);
  const requestState = useRef<{ sequence: number; controller: AbortController | null }>({ sequence: 0, controller: null });
  const alive = useRef(false);
  const copyControl = useRef<HTMLTextAreaElement>(null);
  const prefix = useId();
  const current = useMemo(() => {
    try { return shiftCoachContext(activity, shiftCoachRequest(activity, record, target, studentExplanation, revisionPlan, purpose || 'trace')); }
    catch { return null; }
  }, [activity, record, target, studentExplanation, revisionPlan, purpose]);
  const identity = useMemo(() => current ? shiftCoachStorageIdentity(activity, current.request) : null, [activity, current]);
  const key = identity?.key, signature = identity?.signature;

  useEffect(() => {
    const pending = requestState.current;
    alive.current = true; setReady(false); setSaved(null); setPreserved(null); setWritten(null); setShared(false); setExportText(null); setBusy(false); setStorageAvailable(true);
    if (key && signature) {
      try {
        const restored = readShiftCoachSession(sessionStorage.getItem(key), activity, { key, signature });
        setSaved(restored.session); setPreserved(restored.preservedRaw);
        setCodeNeeded(restored.session?.status === 'access-denied');
        setNotice(restored.session ? 'Restored a practice record for this same accepted workflow and visible phase. Nothing was sent on reload.' : 'Nothing has been sent. The written question works without an AI account.');
      } catch { setStorageAvailable(false); }
    }
    setReady(true);
    return () => { alive.current = false; pending.sequence += 1; pending.controller?.abort(); pending.controller = null; };
  }, [activity, key, signature]);

  function persist(next: ShiftCoachSession): boolean {
    if (!key) return false;
    try { sessionStorage.setItem(key, JSON.stringify(next)); setSaved(next); return true; }
    catch { setStorageAvailable(false); setNotice('Browser storage is unavailable. Use the written question and keep a copy; no AI request was started.'); return false; }
  }
  async function ask() {
    if (!current || !identity || !purpose || !shared || !ready || busy || requestState.current.controller || !storageAvailable || preserved !== null) return;
    try {
      const existing = readShiftCoachSession(sessionStorage.getItem(identity.key), activity, identity);
      if (existing.preservedRaw !== null) { setPreserved(existing.preservedRaw); return; }
      if (existing.session && existing.session.status !== 'access-denied') { setSaved(existing.session); setNotice('This accepted workflow and phase already used its AI request. Use the saved or written question.'); return; }
    } catch { setStorageAvailable(false); return; }
    const snapshot = current;
    const marker: ShiftCoachSession = { version: 1, signature: identity.signature, request: snapshot.request, status: 'attempted' };
    if (!persist(marker)) return;
    const controller = new AbortController(), sequence = ++requestState.current.sequence;
    requestState.current.controller = controller; setBusy(true); setWritten(null); setNotice('Selecting one authored question from your explanation. No workflow is being rewritten.');
    try {
      const headers = new Headers({ 'content-type': 'application/json' });
      if (code.trim()) headers.set('x-course-code', code.trim());
      const response = await fetch('/api/course-chat', { method: 'POST', headers, signal: controller.signal, body: JSON.stringify({ lesson: activity.page, ...(canvasDelivery ? { delivery: 'canvas' } : {}), shiftCoach: snapshot.request }) });
      const body: unknown = await response.json();
      if (!alive.current || requestState.current.sequence !== sequence) return;
      if (response.status === 401) { persist({ ...marker, status: 'access-denied' }); setCodeNeeded(true); setNotice('Enter the course access code and choose Send again. This rejected request did not reach the model.'); return; }
      if (!response.ok) { setNotice(response.status === 409 ? 'The activity changed. Reopen the current lesson; use the written question for this saved record.' : 'The AI question is unavailable. No repeat request will be made for this workflow and phase. Use the written question.'); return; }
      const answer = validateShiftCoachAnswer(body, snapshot);
      if (answer.selectedBy !== 'ai') throw new Error('Unexpected response');
      if (!persist({ ...marker, status: 'complete', answer })) { setSaved({ ...marker, status: 'complete', answer }); setNotice('The question is visible, but its save failed. Keep a copy now.'); }
      else setNotice('One authored question was selected. Compare its grounding with your explanation; this is practice, not a diagnosis or grade.');
    } catch {
      if (alive.current && requestState.current.sequence === sequence) setNotice('The request was interrupted or could not be checked. No automatic retry was made. Use the written question.');
    } finally {
      if (requestState.current.sequence === sequence) { requestState.current.controller = null; if (alive.current) setBusy(false); }
    }
  }
  if (!current || !identity) return <p className="mt-4 text-sm leading-6 text-slate-600">Save your own explanation for this confirmed run before opening its optional diagnostic question.</p>;
  const answer = written ?? saved?.answer;
  const answerRequest = written ? current.request : saved?.request ?? current.request;
  const alreadyAttempted = saved !== null && saved.status !== 'access-denied';
  const reasoningChanged = saved !== null && (saved.request.explanation !== current.request.explanation || saved.request.revisionPlan !== current.request.revisionPlan);
  return <details className="mt-5 rounded-xl border border-slate-300 bg-white text-slate-900">
    <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">Optional · inspect your reasoning with one question</summary>
    <div className="border-t border-slate-200 p-4 sm:p-5">
      <p className="text-sm leading-6">Your explanation comes first. Choose a focus, inspect the shared snapshot, then choose a written question or one AI-selected question. The AI selects from authored questions; it does not explain a cause or decide whether you are correct.</p>
      <label htmlFor={`${prefix}-purpose`} className="mt-4 block text-sm font-semibold">What would help you inspect your reasoning?</label>
      <select id={`${prefix}-purpose`} className={field} value={purpose} disabled={busy} onChange={event => { setPurpose(event.target.value as ShiftCoachPurpose | ''); setWritten(null); setShared(false); }}>
        <option value="">Choose one focus</option><option value="trace">Compare my explanation with the recorded execution</option><option value="interpretation">Inspect how my wording was interpreted</option><option value="source">Check my reasoning against an approved source</option>
      </select>
      <section className="mt-4 rounded-lg border border-slate-200 p-4" aria-label="Diagnostic sharing preview">
        <h4 className="text-sm font-semibold">Snapshot you choose to share · {target}</h4>
        <p className="mt-2 text-xs leading-6 text-slate-600">Activity revision {activity.activityRevision}; focus: {purpose || 'not selected'}. Only the workflow, accepted interpretation, explanation and next-step plan below are sent. The server reconstructs the currently visible trace and approved sources shown here. The accepted interpretation is a learner-confirmed hypothesis about your words.</p>
        <dl className="mt-3 space-y-3 text-sm leading-6"><div><dt className="font-semibold">Your workflow</dt><dd className="whitespace-pre-wrap break-words">{current.request.workflow}</dd></div><div><dt className="font-semibold">Accepted interpretation</dt><dd className="whitespace-pre-wrap break-words">{formatShiftMapping(current.request.mapping)}</dd></div><div><dt className="font-semibold">Your saved explanation</dt><dd className="whitespace-pre-wrap break-words">{current.request.explanation}</dd></div><div><dt className="font-semibold">Your next step</dt><dd className="whitespace-pre-wrap break-words">{current.request.revisionPlan || 'None recorded'}</dd></div></dl>
        <details className="mt-3"><summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-teal-700">Inspect the actual execution and approved sources</summary>
          {current.cases.map(card => <section key={card.id} className="mt-3 border-t border-slate-200 pt-3 text-sm leading-6"><h5 className="font-semibold">Request {card.id} · {card.result.consequence}</h5><p className="mt-1">{card.request}</p><p className="mt-2">{card.result.explanation}</p><ol className="mt-2 list-decimal space-y-2 pl-5">{card.result.trace.map(event => <li key={`${event.step}-${event.action}`}><span className="font-semibold">Step {event.step}, action {event.action} · {event.status}.</span> {event.detail}</li>)}</ol></section>)}
          {current.sources.map(source => <p key={source.id} className="mt-3 text-sm leading-6"><strong>{source.id} · {source.label}:</strong> {source.text}</p>)}
        </details>
        <p className="mt-3 text-xs leading-6 text-slate-600">Your journal, prediction, confidence, original AI proposal, workbook, chat and Canvas records are not included. This creates no research submission or grade. Do not share confidential information.</p>
      </section>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" disabled={!purpose || busy} className={button} onClick={() => { setWritten(writtenShiftCoachAnswer(current)); setNotice('Opened the written question without another AI request.'); }}>Use the written question · no AI</button></div>
      {codeNeeded ? <label htmlFor={`${prefix}-code`} className="mt-4 block text-sm font-semibold">Course access code<input id={`${prefix}-code`} type="password" autoComplete="off" value={code} onChange={event => setCode(event.target.value)} className={field} /></label> : null}
      <label className="mt-4 flex min-h-11 items-start gap-3 py-2 text-sm leading-6"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0 focus-visible:outline-2 focus-visible:outline-teal-700" disabled={busy || alreadyAttempted || preserved !== null || !storageAvailable} checked={shared} onChange={event => setShared(event.target.checked)} />Share only this snapshot for one AI-selected question.</label>
      <button type="button" className={button} disabled={!purpose || !shared || !ready || busy || alreadyAttempted || preserved !== null || !storageAvailable} onClick={ask}>{busy ? 'Selecting one question…' : alreadyAttempted ? 'AI request already used for this workflow' : 'Send snapshot · one AI question'}</button>
      {answer ? <section className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4" aria-label="Diagnostic question">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-900">{answer.selectedBy === 'ai' ? 'AI selected an authored question' : 'Written diagnostic route'}</p>
        <p className="mt-1 text-xs leading-6">Selected focus: {answerRequest.purpose === 'trace' ? 'recorded execution' : answerRequest.purpose === 'source' ? 'approved source' : 'accepted interpretation'}.</p>
        {reasoningChanged && answer.selectedBy === 'ai' ? <p className="mt-2 text-sm leading-6">This restored same-workflow practice used your earlier shared explanation, below. Later edits were not shared.</p> : null}
        {answer.selectedBy === 'ai' ? <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6"><strong>Explanation shared:</strong> {answerRequest.explanation}</p> : null}
        {answer.learnerQuote ? <p className="mt-3 text-sm leading-6"><strong>Your words in focus:</strong> “{answer.learnerQuote}”</p> : null}
        <h4 className="mt-3 text-sm font-semibold">{answer.question.heading}</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{answer.question.grounding}</p><p className="mt-3 text-base font-semibold leading-7">{answer.question.question}</p>
        {answer.question.sourceIds.length ? <p className="mt-2 text-xs leading-6">Approved source tags: {answer.question.sourceIds.join(', ')}. Inspect their text above.</p> : null}
        <button type="button" className={`${button} mt-4`} onClick={() => setExportText(shiftCoachExport(activity, answerRequest, answer))}>Prepare a copy of this question</button>
      </section> : null}
      {exportText !== null ? <div className="mt-4"><label htmlFor={`${prefix}-copy`} className="text-sm font-semibold">Practice record to copy</label><textarea id={`${prefix}-copy`} ref={copyControl} className={field} readOnly rows={8} value={exportText} /><button type="button" className={`${button} mt-2`} onClick={() => { copyControl.current?.focus(); copyControl.current?.select(); }}>Select record to copy</button></div> : null}
      {preserved !== null ? <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3"><p className="text-sm leading-6">An unfamiliar saved record was preserved. AI sending is blocked so it will not be overwritten; you can still use the written route. Keep a copy if needed.</p><label htmlFor={`${prefix}-preserved`} className="mt-2 block text-sm font-semibold">Preserved original local record</label><textarea id={`${prefix}-preserved`} readOnly rows={5} value={preserved} className={field} /></div> : null}
      {!storageAvailable ? <p className="mt-3 text-sm leading-6 text-amber-950">Browser storage is unavailable. Use the written question and export a copy. AI sending is paused so the one-request marker cannot be lost.</p> : null}
      {saved?.status === 'attempted' && !busy ? <p className="mt-3 text-sm leading-6">An AI request was attempted for this workflow and phase, but no completed AI-selected question is saved. Continue with the written question.</p> : null}
      <p role="status" aria-live="polite" className="mt-4 text-sm leading-6 text-slate-700">{notice}</p>
      <p className="mt-2 text-xs leading-6 text-slate-500">Practice is kept in this browser tab. {canvasDelivery ? 'Use the existing Canvas submission for assessed work.' : 'Keep a copy if you want this practice beyond the tab.'} A question or completed practice marker does not show learning or mastery.</p>
    </div>
  </details>;
}
