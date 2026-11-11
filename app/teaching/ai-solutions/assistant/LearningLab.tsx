'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { emptyLearningRecord, learningSummary, restoreLearningRecord, type LearningActivity, type LearningPhase, type LearningRecord, type LearningRequest } from '@/lib/course-kb/learning';

const STEPS: { id: LearningPhase; title: string; verb: string }[] = [
  { id: 'decide', title: 'Decide', verb: 'Make your first call' },
  { id: 'investigate', title: 'Investigate', verb: 'Let the evidence challenge you' },
  { id: 'revise', title: 'Revise', verb: 'Keep or change your decision' },
  { id: 'transfer', title: 'Apply', verb: 'Take it into your project' },
];
const button = 'min-h-11 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40';
const field = 'mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-950 focus:outline-2 focus:outline-offset-2 focus:outline-teal-700';

export function LearningLab({ activity: a, canvasDelivery, renderCoach }: { activity: LearningActivity; canvasDelivery: boolean; renderCoach: (context: LearningRequest) => ReactNode }) {
  const [record, setRecord] = useState<LearningRecord>(emptyLearningRecord);
  const [ready, setReady] = useState(false);
  const [storage, setStorage] = useState(true);
  const [showCoach, setShowCoach] = useState(false);
  const [notice, setNotice] = useState('');
  const [exportText, setExportText] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const exportRecord = useRef<HTMLTextAreaElement>(null);
  const key = `course-decision-lab:v1:${a.page}`;
  const phase = STEPS.findIndex(s => s.id === record.phase);
  const choice = a.choices.find(c => c.id === record.choice);
  const openCards = record.reviewedEvidence;
  useEffect(() => {
    try { setRecord(restoreLearningRecord(sessionStorage.getItem(key), a.page)); }
    catch { setStorage(false); }
    setReady(true);
  }, [key, a.page]);
  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem(key, JSON.stringify(record)); }
    catch { setStorage(false); }
  }, [record, ready, key]);
  function update(patch: Partial<LearningRecord>) { setRecord(r => ({ ...r, ...patch, complete: false })); }
  function go(step: LearningPhase) {
    setRecord(r => ({ ...r, phase: step, committed: r.committed || step !== 'decide' }));
    setNotice('');
    requestAnimationFrame(() => heading.current?.focus());
  }
  function download() {
    // Keep an exact, visible snapshot even if an embedded browser blocks downloads.
    const snapshot = learningSummary(a, record);
    setExportText(snapshot);
    let url: string | undefined;
    try {
      url = URL.createObjectURL(new Blob([snapshot], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = `unit-${String(a.unit).padStart(2, '0')}-decision-lab.txt`;
      document.body.appendChild(link);
      try { link.click(); } finally { link.remove(); }
      setNotice('Download requested. If no file appears, use the reasoning record below to copy your work.');
    } catch {
      setNotice('A download could not be requested. Use the reasoning record below to copy your work.');
    } finally {
      if (url) { const requestedUrl = url; setTimeout(() => URL.revokeObjectURL(requestedUrl), 1000); }
    }
  }
  function selectExport() {
    exportRecord.current?.focus();
    exportRecord.current?.select();
    setNotice('Record selected. Use your device’s Copy command, then paste relevant reasoning into your existing project update.');
  }
  if (!ready) return <p role="status" className="p-5 text-sm text-slate-600">Opening your decision lab…</p>;
  return <section aria-label={`Unit ${a.unit} decision lab`} className="min-w-0 [overflow-wrap:anywhere]">
    <header className="rounded-2xl bg-slate-950 p-5 text-white sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-teal-200">Unit {String(a.unit).padStart(2, '0')} · Decision lab</p>
      <h2 className="mt-3 text-2xl leading-tight text-white sm:text-3xl">{a.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-200">{a.goal}</p>
      <p className="mt-4 inline-block rounded-full border border-teal-300/40 px-3 py-1 text-xs text-teal-100">Your role: {a.role}</p>
    </header>
    <p className="my-4 text-xs leading-5 text-slate-600">A fictional teaching scenario. Your first answer is a starting point; the work is in explaining what the evidence changes. No points or grades.</p>
    <ol aria-label="Learning steps" className="mb-5 grid grid-cols-4 gap-1.5">
      {STEPS.map((step, i) => <li key={step.id}><button type="button" aria-current={record.phase === step.id ? 'step' : undefined} disabled={i > phase && !(record.committed && i === 1) && !record.revision.trim()} onClick={() => go(step.id)} className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg border p-1 text-[11px] font-semibold sm:text-sm ${record.phase === step.id ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-200 text-slate-500'} disabled:opacity-40`}><span aria-hidden="true">{i + 1}</span>{step.title}</button></li>)}
    </ol>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <h3 ref={heading} tabIndex={-1} className="text-xl outline-none focus-visible:ring-2 focus-visible:ring-teal-700">{STEPS[phase].verb}</h3>
      {record.phase === 'decide' && <>
        <p className="mt-3 text-sm leading-7 text-slate-700">{a.scenario}</p>
        <fieldset className="mt-5 space-y-2"><legend className="mb-2 text-sm font-semibold">What would you do first?</legend>{a.choices.map(c => <label key={c.id} className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-6 ${record.choice === c.id ? 'border-teal-700 bg-teal-50' : 'border-slate-200 hover:border-teal-600'}`}><input className="mt-1 accent-teal-800" type="radio" name={`decision-${a.unit}`} value={c.id} disabled={record.committed} checked={record.choice === c.id} onChange={() => update({ choice: c.id })} /><span>{c.label}</span></label>)}</fieldset>
        <label htmlFor="lab-attempt" className="mt-5 block text-sm font-semibold">Why this choice? What are you assuming?</label>
        <textarea id="lab-attempt" readOnly={record.committed} rows={3} maxLength={2000} className={field} value={record.attempt} onChange={e => update({ attempt: e.target.value })} placeholder="I would choose this because… I am assuming…" />
        <p className="mt-2 text-xs text-slate-500">Your initial choice and reason are kept when you uncover the evidence. Use Revise to explain a changed decision.</p>
        <button type="button" disabled={!choice || !record.attempt.trim()} className={`${button} mt-5`} onClick={() => go('investigate')}>Commit & uncover evidence →</button>
      </>}
      {record.phase === 'investigate' && <>
        <div className="mt-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 text-sm leading-6"><p className="font-semibold">Your call: {choice?.label}</p><p className="mt-2">{choice?.consequence}</p><p className="mt-2 text-amber-950">Your reason: {record.attempt}</p></div>
        <p className="mt-5 text-sm text-slate-600">Open each evidence card. Look for the fact that most challenges your reasoning.</p>
        <div className="mt-3 space-y-2">{a.evidence.map((e, i) => <div key={e.label} className="overflow-hidden rounded-xl border border-slate-200"><button type="button" aria-expanded={openCards.includes(i)} aria-controls={`evidence-${i}`} onClick={() => setRecord(old => old.reviewedEvidence.includes(i) ? old : { ...old, reviewedEvidence: [...old.reviewedEvidence, i] })} className="flex min-h-12 w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left text-sm font-semibold"><span><span className="mr-2 text-teal-800">0{i + 1}</span>{e.label}</span><span aria-hidden="true">{openCards.includes(i) ? '✓' : '+'}</span></button>{openCards.includes(i) && <p id={`evidence-${i}`} className="p-4 text-sm leading-7 text-slate-700">{e.detail}</p>}</div>)}</div>
        <button type="button" disabled={openCards.length < a.evidence.length} className={`${button} mt-5`} onClick={() => go('revise')}>Use the evidence to revise →</button>
        {openCards.length < a.evidence.length && <p className="mt-2 text-xs text-slate-500">Open all {a.evidence.length} evidence cards to continue.</p>}
      </>}
      {record.phase === 'revise' && <>
        <p className="mt-3 text-sm leading-7 text-slate-700">{a.challenge}</p>
        <details className="mt-4 rounded-xl bg-slate-50 p-4 text-sm"><summary className="min-h-6 cursor-pointer font-semibold">Review the evidence and your first call</summary><p className="mt-3">{choice?.label} — {record.attempt}</p><ul className="mt-3 space-y-3">{a.evidence.map(e => <li key={e.label}><strong>{e.label}:</strong> {e.detail}</li>)}</ul></details>
        <label htmlFor="lab-revision" className="mt-5 block text-sm font-semibold">Keep or revise your decision. Cite a fact and explain why.</label>
        <textarea id="lab-revision" rows={4} maxLength={2000} value={record.revision} onChange={e => update({ revision: e.target.value })} className={field} placeholder="I would keep/change my decision because the evidence shows… This still does not tell us…" />
        <details className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-7"><summary className="cursor-pointer font-semibold text-teal-950">Compare with the worked reasoning</summary><p className="mt-3 text-teal-950">{a.worked}</p><p className="mt-3 text-xs text-teal-900">Use this as feedback. Explain your own reasoning before applying it to your project.</p></details>
        <button type="button" disabled={!record.revision.trim()} className={`${button} mt-5`} onClick={() => go('transfer')}>Carry the lesson into my project →</button>
      </>}
      {record.phase === 'transfer' && <>
        <p className="mt-3 text-sm leading-7 text-slate-700">{a.transfer}</p>
        <label htmlFor="lab-transfer" className="mt-5 block text-sm font-semibold">My next project action</label><textarea id="lab-transfer" rows={4} maxLength={2000} value={record.transfer} onChange={e => update({ transfer: e.target.value })} className={field} placeholder="For my project, I will… I will check… The uncertainty is…" />
        <p className="mt-3 text-xs leading-5 text-slate-600">Self-check: Is your action specific? Does your reason use evidence? Have you named a remaining uncertainty? Recording a response does not establish correctness.</p>
        <button type="button" disabled={!record.transfer.trim() || record.complete} className={`${button} mt-5`} onClick={() => { setRecord(r => ({ ...r, complete: true })); setNotice('Reasoning cycle recorded. Review your record, then return to Build.'); }}>{record.complete ? 'Reasoning cycle recorded' : 'Save my practice record'}</button>
        {record.complete && <div className="mt-5 rounded-xl border border-teal-300 bg-teal-50 p-4 text-sm leading-7"><p className="font-semibold text-teal-950">You have a decision to carry forward.</p><pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-slate-700">{learningSummary(a, record)}</pre><p className="mt-4">{canvasDelivery ? 'Return to the interactive lesson above and choose Build. Use relevant reasoning in your existing Canvas project update; submit it there.' : <a href={`/teaching/ai-solutions/${a.page}#step-2`} target="_top" className="font-semibold text-teal-900 underline underline-offset-4">Return to this unit’s Build step →</a>}</p></div>}
      </>}
      <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">{phase > 0 && <button type="button" onClick={() => go(STEPS[phase - 1].id)} className="min-h-11 px-2 text-sm text-slate-600 underline underline-offset-4">← Previous step</button>}<button type="button" onClick={download} className="min-h-11 px-2 text-sm text-teal-900 underline underline-offset-4">Export my reasoning</button></div>
      {exportText !== null && <section className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4" aria-label="Copy your reasoning record">
        <label htmlFor="lab-export-record" className="block text-sm font-semibold text-teal-950">Reasoning record to copy</label>
        <p id="lab-export-instructions" className="mt-2 text-xs leading-5 text-slate-700">This is the snapshot from your latest export request. If you change your responses, choose Export my reasoning again to refresh it. Select the record, use your device’s Copy command, and paste relevant reasoning into your existing project update. This does not submit work or require another upload.</p>
        <textarea ref={exportRecord} id="lab-export-record" aria-describedby="lab-export-instructions" readOnly rows={12} value={exportText} className={field} />
        <button type="button" onClick={selectExport} className="mt-3 min-h-11 rounded-lg border border-teal-800 bg-white px-4 py-2 text-sm font-semibold text-teal-950">Select record to copy</button>
      </section>}
    </div>
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <button type="button" aria-expanded={showCoach} onClick={() => setShowCoach(s => !s)} className="min-h-11 w-full text-left text-sm font-semibold text-teal-900">{showCoach ? '−' : '+'} Work with the AI coach on this step</button>
      <p className="text-xs leading-5 text-slate-600">Ask for a hint or feedback on your reasoning. Sending a coaching question shares this unit’s selected choice and written lab responses with the AI service. The worked route above is always available.</p>
      {showCoach && renderCoach({ phase: record.phase, choice: record.choice, attempt: record.attempt, revision: record.revision, transfer: record.transfer })}
    </div>
    <p role="status" aria-live="polite" className="mt-3 text-sm text-teal-900">{notice}</p>
    <p className={`mt-2 text-xs leading-5 ${storage ? 'text-slate-500' : 'text-amber-900'}`}>{storage ? 'Lab responses stay in this browser tab. Export or copy your reasoning to keep it beyond this tab. They are separate from workbook backups and Canvas records.' : 'Browser storage is blocked. Keep this page open and export or copy your reasoning before leaving.'}</p>
  </section>;
}
