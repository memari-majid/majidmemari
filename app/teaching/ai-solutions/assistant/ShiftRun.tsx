'use client';

import { useEffect, useRef, useState } from 'react';
import { learningStorageKeys, previousLearningData, previousLearningExport, type PreviousLearningData, type ShiftRunActivity } from '@/lib/course-kb/learning';
import { SHIFT_ACTION_TYPES, SHIFT_CHECKS, emptyShiftRecord, exportShiftRecord, recordNextRequest, recordShiftRun, validateShiftMapping, validateShiftRecord, validateShiftWorkflow, type ShiftAction, type ShiftCaseResult, type ShiftMapping, type ShiftRecord, type ShiftUsage } from '@/lib/course-kb/shift-run';

const button = 'min-h-11 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40';
const secondary = 'min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-40';
const field = 'mt-2 w-full min-w-0 rounded-lg border border-slate-300 bg-white p-3 text-base leading-relaxed text-slate-950 focus:outline-2 focus:outline-offset-2 focus:outline-teal-700 disabled:bg-slate-50';
const ACTION_LABELS: Record<ShiftAction['type'], string> = {
  intake: 'Read the incoming request', find_source: 'Consult an approved source', check_conditions: 'Check the deciding conditions', ask_missing_fact: 'Ask for a missing fact',
  ai_draft: 'Prepare an AI draft', human_check: 'Human review', route_to_owner: 'Route to the owner', acknowledge_customer: 'Acknowledge receipt to the customer', release: 'Release a reply', confirm_change: 'Claim that a change is confirmed',
};
type ManualDraft = { workflow: string; reason: string; mapping: ShiftMapping; reviewed: number[] };
type ShiftSession = { version: 1; mode: 'shift-run'; activityRevision: number; page: string; record: ShiftRecord; workflow: string; reason: string; manual: ManualDraft | null; aiAttempted: (1 | 2)[] };
type ClassificationResponse = { mapping: ShiftMapping; modelId: string; usage: ShiftUsage | null; classifiedBy: 'ai' };

function blankSession(activity: ShiftRunActivity): ShiftSession {
  return { version: 1, mode: 'shift-run', activityRevision: activity.activityRevision, page: activity.page, record: emptyShiftRecord(activity), workflow: '', reason: '', manual: null, aiAttempted: [] };
}
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function exactKeys(value: Record<string, unknown>, allowed: string[]) { return Object.keys(value).every(key => allowed.includes(key)) && allowed.every(key => Object.hasOwn(value, key)); }
function readSession(raw: string | null, activity: ShiftRunActivity): { session: ShiftSession; unrecognized: string | null } {
  const empty = blankSession(activity);
  if (raw === null) return { session: empty, unrecognized: null };
  try {
    if (raw.length > 250000) throw new Error('Oversized local record');
    const value: unknown = JSON.parse(raw);
    if (!object(value) || !exactKeys(value, ['version', 'mode', 'activityRevision', 'page', 'record', 'workflow', 'reason', 'manual', 'aiAttempted']) || value.version !== 1 || value.mode !== 'shift-run' || value.activityRevision !== activity.activityRevision || value.page !== activity.page) throw new Error('Different activity record');
    if (typeof value.workflow !== 'string' || value.workflow.length > 1200 || typeof value.reason !== 'string' || value.reason.length > 200) throw new Error('Invalid draft');
    if (!Array.isArray(value.aiAttempted) || value.aiAttempted.length > 2 || value.aiAttempted.some(slot => slot !== 1 && slot !== 2) || new Set(value.aiAttempted).size !== value.aiAttempted.length) throw new Error('Invalid classification attempt record');
    const record = validateShiftRecord(value.record, activity);
    let manual: ManualDraft | null = null;
    if (value.manual !== null) {
      const pending = value.manual;
      if (!object(pending) || !exactKeys(pending, ['workflow', 'reason', 'mapping', 'reviewed']) || typeof pending.workflow !== 'string' || typeof pending.reason !== 'string' || pending.reason.length > 200 || !Array.isArray(pending.reviewed)) throw new Error('Invalid self-classification');
      const steps = validateShiftWorkflow(pending.workflow);
      const mapping = validateShiftMapping(pending.mapping, steps);
      if (pending.reviewed.some(step => !Number.isInteger(step) || step < 1 || step > steps.length) || new Set(pending.reviewed).size !== pending.reviewed.length) throw new Error('Invalid reviewed steps');
      manual = { workflow: pending.workflow, reason: pending.reason, mapping, reviewed: pending.reviewed as number[] };
    }
    return { session: { ...empty, record, workflow: value.workflow, reason: value.reason, manual, aiAttempted: value.aiAttempted as (1 | 2)[] }, unrecognized: null };
  } catch { return { session: empty, unrecognized: raw }; }
}
function readableError(error: unknown) { return error instanceof Error ? error.message.slice(0, 350) : 'The run could not be completed. Your written steps remain available.'; }
function actionFlags(action: ShiftAction): string {
  if (action.type === 'ai_draft') return `States source conditions: ${action.ai_draft.states_conditions ? 'yes' : 'not specified'}; forbids unsupported promises: ${action.ai_draft.forbids_promises ? 'yes' : 'not specified'}.`;
  if (action.type === 'human_check') return `Review named: ${action.human_check.checks.join(', ') || 'no listed check specified'}.`;
  if (action.type === 'route_to_owner') return `Route only when held: ${action.route_to_owner.only_if_held ? 'yes' : 'not specified'}.`;
  return '';
}
function newAction(type: ShiftAction['type'], quote: string): ShiftAction {
  if (type === 'ai_draft') return { type, quote, ai_draft: { states_conditions: false, forbids_promises: false } };
  if (type === 'human_check') return { type, quote, human_check: { checks: [] } };
  if (type === 'route_to_owner') return { type, quote, route_to_owner: { only_if_held: false } };
  return { type, quote } as ShiftAction;
}
function requestDownload(text: string, filename: string): boolean {
  let url: string | undefined;
  try {
    url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); try { link.click(); } finally { link.remove(); }
    return true;
  } catch { return false; }
  finally { if (url) { const requested = url; setTimeout(() => URL.revokeObjectURL(requested), 1000); } }
}
function Stamp({ activity }: { activity: ShiftRunActivity }) { return <p className="mb-2 text-xs font-semibold leading-5 text-slate-600">{activity.stamp}</p>; }

function PreservedText({ title, text, filename }: { title: string; text: string; filename: string }) {
  const control = useRef<HTMLTextAreaElement>(null);
  const [notice, setNotice] = useState('');
  const id = `shift-preserved-${filename.replace(/[^a-z0-9]/gi, '-')}`;
  return <details className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
    <summary className="cursor-pointer text-sm font-semibold">{title}</summary>
    <p className="mt-3 text-xs leading-6 text-slate-600">These original data are read-only and are never used as steps, outcomes or coaching context for this activity.</p>
    <label htmlFor={id} className="mt-3 block text-sm font-semibold">Preserved text to copy</label>
    <textarea ref={control} id={id} readOnly rows={7} value={text} className={field} />
    <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={secondary} onClick={() => { control.current?.focus(); control.current?.select(); setNotice('Text selected. Use your device’s Copy command.'); }}>Select text to copy</button><button type="button" className={secondary} onClick={() => setNotice(requestDownload(text, filename) ? 'Download requested. If no file appears, select and copy the text.' : 'Download unavailable. Select and copy the text.')}>Download preserved text</button></div>
    <p role="status" className="mt-2 text-xs text-slate-600">{notice}</p>
  </details>;
}
function ClassificationView({ activity, mapping, steps, classifiedBy, modelId }: { activity: ShiftRunActivity; mapping: ShiftMapping; steps: string[]; classifiedBy: 'ai' | 'student'; modelId?: string }) {
  const found = new Set(mapping.flatMap(item => item.actions.map(action => action.type)));
  const notFound = SHIFT_ACTION_TYPES.filter(type => !found.has(type));
  return <details className="mt-4 rounded-lg border border-slate-200 bg-white p-4" open>
    <summary className="cursor-pointer text-sm font-semibold">How these steps were interpreted</summary>
    <div className="mt-3"><Stamp activity={activity} /><p className="text-sm leading-6">{classifiedBy === 'student' ? 'Steps classified by student.' : 'AI classification of the written steps.'} Check the quoted wording. A category describes an action; it is not a required-step checklist or a score.</p>{modelId ? <p className="mt-1 break-words text-xs text-slate-500">Classification model: {modelId}</p> : null}</div>
    <ol className="mt-4 space-y-4">{mapping.map(item => <li key={item.step} className="min-w-0 border-t border-slate-100 pt-3">
      <p className="text-sm font-semibold">Step {item.step}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{steps[item.step - 1]}</p>
      {item.actions.length ? <ul className="mt-2 space-y-2">{item.actions.map((action, index) => <li key={`${item.step}-${index}`} className="rounded-md bg-slate-50 p-3 text-sm"><strong>{ACTION_LABELS[action.type]}</strong><p className="mt-1 break-words">Quoted wording: “{action.quote}”</p>{actionFlags(action) ? <p className="mt-1 text-xs leading-5 text-slate-600">{actionFlags(action)}</p> : null}</li>)}</ul> : <p className="mt-2 text-sm text-slate-600">No listed action was identified in this line.</p>}
    </li>)}</ol>
    {notFound.length ? <p className="mt-4 border-t border-slate-200 pt-3 text-xs leading-6 text-slate-600">Categories not identified: {notFound.map(type => ACTION_LABELS[type]).join('; ')}. Not every category belongs in every workflow.</p> : null}
  </details>;
}
function CaseOutcome({ activity, result }: { activity: ShiftRunActivity; result: ShiftCaseResult }) {
  const request = activity.cases.find(item => item.id === result.caseId)!;
  const outcome = activity.consequences[result.consequenceId];
  const reaction = request.reactions?.[result.consequenceId] ?? outcome.reaction;
  const tone = outcome.tone === 'bad' ? 'border-red-200' : outcome.tone === 'warn' ? 'border-amber-200' : 'border-teal-200';
  return <article className={`mt-4 min-w-0 rounded-lg border bg-white p-4 ${tone}`} aria-label={`Simulated result for request ${result.caseId}`}>
    <Stamp activity={activity} /><h4 className="font-semibold">Request {result.caseId} · {outcome.label}</h4>
    <p className="mt-2 text-sm leading-6">{request.request}</p><p className="mt-1 text-xs text-slate-500">Received: {request.received}</p>
    <section className="mt-4 rounded-md bg-slate-50 p-3"><Stamp activity={activity} /><h5 className="text-sm font-semibold">Supplied draft / message</h5><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{result.draftId ? activity.drafts[result.draftId] : 'No draft is created on this path.'}</p></section>
    <section className="mt-3 border-l-2 border-slate-300 pl-3"><Stamp activity={activity} /><h5 className="text-sm font-semibold">Reaction in the rehearsal</h5><p className="mt-2 text-sm leading-6">{reaction}</p></section>
    <p className="mt-4 text-xs leading-6 text-slate-600">Recorded path: {result.path}. Reply sent: {result.sent ? 'yes' : 'no'}. Routed to owner: {result.ownerRouted ? 'yes' : 'no'}.</p>
    <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-teal-900">Why this happened</summary><p className="mt-2 text-sm leading-6">{outcome.debrief}</p><p className="mt-2 text-sm font-medium">{outcome.question}</p></details>
  </article>;
}
function ManualClassification({ pending, onChange, onRun, activity, busy }: { pending: ManualDraft; onChange: (value: ManualDraft) => void; onRun: () => void; activity: ShiftRunActivity; busy: boolean }) {
  const steps = validateShiftWorkflow(pending.workflow);
  const complete = pending.mapping.every(item => item.actions.length > 0 || pending.reviewed.includes(item.step));
  function updateAction(step: number, index: number, action: ShiftAction | null) {
    onChange({ ...pending, reviewed: [...new Set([...pending.reviewed, step])], mapping: pending.mapping.map(item => item.step !== step ? item : { ...item, actions: action === null ? item.actions.filter((_, i) => i !== index) : item.actions.map((old, i) => i === index ? action : old).concat(index >= item.actions.length ? [action] : []) }) });
  }
  return <section className="mt-5 rounded-xl border border-slate-300 bg-slate-50 p-4" aria-labelledby="shift-self-classification">
    <h3 id="shift-self-classification" className="font-semibold">Classify your steps without an AI service</h3><p className="mt-2 text-sm leading-6">For each line, name only actions that the wording actually specifies. An action category is a description, not a required ingredient. The record will say <strong>steps classified by student</strong>.</p>
    {pending.mapping.map(item => <fieldset key={item.step} className="mt-5 min-w-0 border-t border-slate-200 pt-4"><legend className="pt-2 text-sm font-semibold">Step {item.step}</legend><p className="text-sm leading-6">{steps[item.step - 1]}</p>
      {(item.actions.length ? item.actions : [null]).map((action, index) => <div key={index} className="mt-3 rounded-lg bg-white p-3">
        <label className="block text-sm font-medium" htmlFor={`shift-type-${item.step}-${index}`}>Action described in this line</label><select id={`shift-type-${item.step}-${index}`} className={field} disabled={busy} value={action?.type ?? ''} onChange={event => updateAction(item.step, index, event.target.value ? newAction(event.target.value as ShiftAction['type'], steps[item.step - 1]) : null)}><option value="">Choose an action, or mark none below</option>{SHIFT_ACTION_TYPES.map(type => <option key={type} value={type} disabled={item.actions.some((old, i) => i !== index && old.type === type)}>{ACTION_LABELS[type]}</option>)}</select>
        {action ? <><p className="mt-3 text-xs font-medium">Quoted source line for this interpretation</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">“{action.quote}”</p>
          {action.type === 'ai_draft' ? <div className="mt-3 space-y-2 text-sm"><label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={action.ai_draft.states_conditions} onChange={event => updateAction(item.step, index, { ...action, ai_draft: { ...action.ai_draft, states_conditions: event.target.checked } })} />The line asks the draft to state source conditions.</label><label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={action.ai_draft.forbids_promises} onChange={event => updateAction(item.step, index, { ...action, ai_draft: { ...action.ai_draft, forbids_promises: event.target.checked } })} />The line forbids unsupported promises or confirmations.</label></div> : null}
          {action.type === 'human_check' ? <fieldset className="mt-3"><legend className="text-sm font-medium">Checks explicitly named</legend>{SHIFT_CHECKS.map(check => <label key={check} className="mt-2 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={action.human_check.checks.includes(check)} onChange={event => updateAction(item.step, index, { ...action, human_check: { checks: event.target.checked ? [...action.human_check.checks, check] : action.human_check.checks.filter(value => value !== check) } })} />{check}</label>)}</fieldset> : null}
          {action.type === 'route_to_owner' ? <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={action.route_to_owner.only_if_held} onChange={event => updateAction(item.step, index, { ...action, route_to_owner: { only_if_held: event.target.checked } })} />The line routes only held requests.</label> : null}
          <button type="button" className="mt-2 min-h-11 text-xs font-semibold text-slate-600 underline" onClick={() => updateAction(item.step, index, null)}>Remove this interpretation</button></> : null}
      </div>)}
      {item.actions.length > 0 && item.actions.length < 3 ? <><label htmlFor={`shift-add-${item.step}`} className="mt-3 block text-xs font-medium">Another action explicitly stated in this line · optional</label><select id={`shift-add-${item.step}`} className={field} value="" disabled={busy} onChange={event => { if (event.target.value) updateAction(item.step, item.actions.length, newAction(event.target.value as ShiftAction['type'], steps[item.step - 1])); }}><option value="">Choose an additional interpretation</option>{SHIFT_ACTION_TYPES.map(type => <option key={type} value={type} disabled={item.actions.some(action => action.type === type)}>{ACTION_LABELS[type]}</option>)}</select></> : null}
      {item.actions.length === 0 ? <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={pending.reviewed.includes(item.step)} onChange={event => onChange({ ...pending, reviewed: event.target.checked ? [...new Set([...pending.reviewed, item.step])] : pending.reviewed.filter(step => step !== item.step) })} />I checked this line; none of the listed actions is specified.</label> : null}
    </fieldset>)}
    <div className="mt-5"><Stamp activity={activity} /><button type="button" className={button} onClick={onRun} disabled={!complete || busy}>Run A and B with my classifications</button></div>
  </section>;
}

export function ShiftRun({ activity, canvasDelivery }: { activity: ShiftRunActivity; canvasDelivery: boolean }) {
  const [session, setSession] = useState<ShiftSession>(() => blankSession(activity));
  const sessionRef = useRef(session);
  const [previous, setPrevious] = useState<PreviousLearningData[]>([]);
  const [unrecognized, setUnrecognized] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [storage, setStorage] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [codeNeeded, setCodeNeeded] = useState(false);
  const [exportText, setExportText] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetAcknowledged, setResetAcknowledged] = useState(false);
  const exportControl = useRef<HTMLTextAreaElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const request = useRef<{ sequence: number; controller: AbortController | null }>({ sequence: 0, controller: null });
  const mounted = useRef(false);
  const key = learningStorageKeys(activity).record;
  const runs = session.record.runs;
  const locked = runs.length >= 2;
  const episodeComplete = !!session.record.nextRequest;
  const currentSlot = (runs.length + 1) as 1 | 2;
  const aiAlreadyAttempted = session.aiAttempted.includes(currentSlot);
  const lines = session.workflow.split(/\r?\n/).filter(line => line.trim()).length;
  useEffect(() => {
    const requestState = request.current;
    mounted.current = true;
    try {
      const restored = readSession(sessionStorage.getItem(key), activity);
      sessionRef.current = restored.session; setSession(restored.session); setUnrecognized(restored.unrecognized);
      setPrevious(previousLearningData(activity, savedKey => sessionStorage.getItem(savedKey)));
    } catch { setStorage(false); }
    setReady(true);
    return () => { mounted.current = false; requestState.sequence += 1; requestState.controller?.abort(); };
  }, [activity, key]);
  function save(next: ShiftSession) {
    sessionRef.current = next; setSession(next);
    try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { setStorage(false); }
  }
  function focusResult() { requestAnimationFrame(() => resultHeading.current?.focus()); }
  function pendingDraft(): ManualDraft {
    const current = sessionRef.current;
    if (current.record.runs.length >= 2) throw new Error('Two versions have already run. Use version 2 for the new request.');
    const steps = validateShiftWorkflow(current.workflow);
    const reason = current.reason.trim();
    if (current.record.runs.length === 1 && (!reason || reason.length > 200)) throw new Error('Before the second run, explain your revision or why you are keeping it in 200 characters or fewer.');
    return { workflow: current.workflow, reason, mapping: steps.map((_, index) => ({ step: index + 1, actions: [] })), reviewed: [] };
  }
  function finishRun(pending: ManualDraft, classified: { mapping: ShiftMapping; classifiedBy: 'ai' | 'student'; modelId?: string; usage?: ShiftUsage | null }) {
    const current = sessionRef.current;
    const record = recordShiftRun(activity, current.record, { workflow: pending.workflow, reason: pending.reason, ...classified });
    save({ ...current, record, workflow: pending.workflow, reason: '', manual: null });
    setNotice(`Version ${record.runs.length} recorded. Its workflow, interpretation and simulated results are frozen below.`); setError(''); focusResult();
  }
  async function runWithAi() {
    if (request.current.controller || !ready || unrecognized !== null) return;
    const slot = (sessionRef.current.record.runs.length + 1) as 1 | 2;
    if (sessionRef.current.aiAttempted.includes(slot)) { setError('This version has already used its online classification request. Use explicit self-classification, or keep a copy before starting a new episode.'); return; }
    let pending: ManualDraft;
    try { pending = pendingDraft(); } catch (problem) { setError(readableError(problem)); return; }
    save({ ...sessionRef.current, manual: pending, aiAttempted: [...sessionRef.current.aiAttempted, slot] });
    setBusy(true); setError(''); setNotice('Classifying the written steps once. The service does not rewrite the workflow.');
    const controller = new AbortController(); const sequence = ++request.current.sequence; request.current.controller = controller;
    try {
      const headers = new Headers({ 'content-type': 'application/json' }); if (code.trim()) headers.set('x-course-code', code.trim());
      const response = await fetch('/api/course-shift', { method: 'POST', headers, signal: controller.signal, body: JSON.stringify({ workflow: pending.workflow, activityRevision: activity.activityRevision }) });
      const body: unknown = await response.json();
      if (!mounted.current || request.current.sequence !== sequence) return;
      if (!response.ok) {
        if (response.status === 401) { setCodeNeeded(true); save({ ...sessionRef.current, aiAttempted: sessionRef.current.aiAttempted.filter(value => value !== slot) }); }
        throw new Error(object(body) && typeof body.error === 'string' ? body.error : 'AI classification is unavailable. Classify the same written steps yourself below.');
      }
      if (!object(body) || body.classifiedBy !== 'ai' || typeof body.modelId !== 'string') throw new Error('The classification could not be read. Use self-classification below.');
      const mapping = validateShiftMapping(body.mapping, validateShiftWorkflow(pending.workflow));
      const result = body as unknown as ClassificationResponse;
      finishRun(pending, { mapping, classifiedBy: 'ai', modelId: result.modelId, usage: result.usage });
    } catch (problem) {
      if (!mounted.current || request.current.sequence !== sequence) return;
      setError(readableError(problem)); setNotice('No simulated run was added. You can explicitly classify the saved steps below without another AI request.');
    } finally {
      if (request.current.sequence === sequence) { request.current.controller = null; if (mounted.current) setBusy(false); }
    }
  }
  function beginManual() {
    try { save({ ...sessionRef.current, manual: pendingDraft() }); setError(''); setNotice('Choose the interpretations yourself. The record will identify student classification.'); }
    catch (problem) { setError(readableError(problem)); }
  }
  function runManual() {
    const pending = sessionRef.current.manual; if (!pending) return;
    try { finishRun(pending, { mapping: validateShiftMapping(pending.mapping, validateShiftWorkflow(pending.workflow)), classifiedBy: 'student' }); }
    catch (problem) { setError(readableError(problem)); }
  }
  function nextRequest() {
    try { save({ ...sessionRef.current, record: recordNextRequest(activity, sessionRef.current.record) }); setNotice('The new request used version 2 exactly as recorded. No model was called.'); setError(''); focusResult(); }
    catch (problem) { setError(readableError(problem)); }
  }
  function exportRecord() {
    const current = sessionRef.current;
    const draft = current.record.runs.length < 2 && current.workflow.trim() ? `\n\n${activity.stamp}\nUnrun workflow draft:\n${current.workflow}\nRevision reason draft: ${current.reason || 'Not recorded'}${current.manual ? `\nPending self-classification (not a run):\n${JSON.stringify(current.manual.mapping, null, 2)}` : ''}` : '';
    const text = exportShiftRecord(activity, current.record) + `\n\n${activity.stamp}\nOnline classification requests attempted for versions: ${current.aiAttempted.join(', ') || 'none'}. An unsuccessful request is not a completed run.` + draft;
    setExportText(text);
    setNotice(requestDownload(text, 'unit-04-workflow-practice.txt') ? 'Download requested. The same record is available below to select and copy.' : 'Download unavailable. Select and copy the complete record below.');
  }
  function newEpisode() {
    request.current.sequence += 1; request.current.controller?.abort(); request.current.controller = null; setBusy(false);
    save(blankSession(activity)); setUnrecognized(null); setResetOpen(false); setResetAcknowledged(false); setError(''); setNotice('A new practice episode is ready. Earlier activity records and conversations were retained.');
  }
  if (!ready) return <p role="status" className="py-8 text-sm text-slate-600">Restoring this activity’s separate practice record…</p>;
  return <section className="min-w-0 text-slate-900" aria-label="Unit 4 workflow run">
    <header className="rounded-xl bg-[#182a46] p-5 text-white"><p className="text-xs uppercase tracking-widest text-teal-200">Unit 04 · Workflow run</p><h2 className="mt-2 font-serif text-2xl">{activity.title}</h2><p className="mt-3 text-sm leading-6 text-slate-100">{activity.goal}</p></header>
    <div className="mt-4"><Stamp activity={activity} /></div><p className="mt-2 text-sm leading-6">{activity.setting.ownerNote}</p><p className="mt-2 text-xs leading-5 text-slate-600">This rehearsal has two workflow versions and one new-request run. It creates no grade, customer evidence, owner decision or Canvas submission.</p>
    {previous.length > 0 ? <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-label="Earlier decision-lab work"><h3 className="font-semibold">Your previous activity is preserved</h3><p className="mt-2 text-sm leading-6">Revision 1 used a different decision lab. Its records and conversations remain separate and read-only; none is copied into this workflow.</p>{previous.map(saved => <PreservedText key={`${saved.activityRevision}-${saved.kind}`} title={`Earlier activity ${saved.kind} · revision ${saved.activityRevision}`} text={previousLearningExport(activity.unit, saved)} filename={`unit-04-previous-activity-${saved.activityRevision}-${saved.kind}.txt`} />)}</section> : null}
    {unrecognized !== null ? <section className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4"><h3 className="font-semibold">A saved record needs a separate copy</h3><p className="mt-2 text-sm leading-6">This current-key record does not match the workflow activity format. It has not been overwritten or interpreted as a new attempt. Copy or download it, then use Start a new practice episode below.</p><PreservedText title="Unrecognized original saved data" text={unrecognized} filename="unit-04-unrecognized-original.txt" /></section> : null}
    <details className="mt-5 rounded-lg border border-slate-200 bg-white p-4"><summary className="cursor-pointer font-semibold">Read the approved source card · S1–S6</summary><div className="mt-4 space-y-4">{activity.setting.sources.map(source => <section key={source.id}><h3 className="text-sm font-semibold">{source.label}</h3><p className="mt-1 text-sm leading-6">{source.text}</p></section>)}</div></details>
    <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">{activity.cases.filter(item => item.id !== 'C').map(item => <section key={item.id} className="min-w-0 rounded-lg border border-slate-200 bg-white p-4"><h3 className="font-semibold">Request {item.id}</h3><p className="mt-2 text-sm leading-6">{item.request}</p><p className="mt-2 text-xs text-slate-500">Received: {item.received}</p></section>)}</div>
    {!locked ? <section className="mt-6 border-t border-slate-200 pt-5" aria-labelledby="shift-workflow-heading"><h3 id="shift-workflow-heading" className="font-semibold">{runs.length === 0 ? 'Write your first workflow' : 'Revise once, or explain why you are keeping it'}</h3><label htmlFor="shift-workflow" className="mt-3 block text-sm font-medium">Workflow · one operation per line, up to six lines</label><textarea id="shift-workflow" rows={6} maxLength={1200} value={session.workflow} disabled={busy || session.manual !== null || unrecognized !== null} onChange={event => save({ ...sessionRef.current, workflow: event.target.value })} className={field} placeholder="Write the process you want Cedar Desk to follow." /><p className="mt-1 text-xs text-slate-500">{session.workflow.length}/1,200 characters · {lines}/6 nonempty lines. Use only fictional or permitted non-sensitive information.</p>
      {runs.length === 1 ? <><label htmlFor="shift-reason" className="mt-4 block text-sm font-medium">Why change or keep this version? · required before run 2</label><textarea id="shift-reason" rows={2} maxLength={200} value={session.reason} disabled={busy || session.manual !== null || unrecognized !== null} onChange={event => save({ ...sessionRef.current, reason: event.target.value })} className={field} /><p className="mt-1 text-xs text-slate-500">{session.reason.length}/200 characters</p></> : null}
      {session.manual === null ? <><p className="mt-3 text-xs leading-6 text-slate-600">Each workflow version permits one online classification request. Run sends only these workflow steps to the AI service for classification. It does not rewrite your process. A local rehearsal then follows the interpreted actions on the supplied requests. You can use self-classification without an AI service.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" className={button} disabled={busy || aiAlreadyAttempted || unrecognized !== null || !session.workflow.trim() || lines > 6} onClick={runWithAi}>Classify once and run A + B</button><button type="button" className={secondary} disabled={busy || unrecognized !== null || !session.workflow.trim() || lines > 6} onClick={beginManual}>Use self-classification</button></div></> : null}
      {codeNeeded ? <div className="mt-4"><label htmlFor="shift-access-code" className="block text-sm font-medium">Course access code, if required</label><input id="shift-access-code" type="password" autoComplete="off" value={code} onChange={event => setCode(event.target.value)} className={field} /><p className="mt-1 text-xs text-slate-600">Kept only while this view is open. To make a new online request, return to your written draft first.</p></div> : null}
    </section> : null}
    {busy ? <p role="status" className="mt-4 text-sm">Classifying the written steps…</p> : null}
    {error ? <p role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm leading-6">{error}</p> : null}
    {session.manual !== null && !busy && unrecognized === null ? <><ManualClassification pending={session.manual} activity={activity} busy={busy} onChange={manual => save({ ...sessionRef.current, manual })} onRun={runManual} /><button type="button" className="mt-2 min-h-11 text-sm font-semibold text-slate-600 underline" onClick={() => { save({ ...sessionRef.current, manual: null }); setError(''); setNotice('Written steps restored. No completed run was removed.'); }}>Return to the written draft</button></> : null}
    <div className="mt-7 border-t border-slate-200 pt-5"><h3 ref={resultHeading} tabIndex={-1} className="text-lg font-semibold">{runs.length ? 'Your recorded workflow versions' : 'Run results will appear here'}</h3>{runs.map(run => <section key={run.number} className="mt-5 min-w-0 border-b border-slate-200 pb-6"><h4 className="font-semibold">Version {run.number} · {run.classifiedBy === 'student' ? 'steps classified by student' : 'steps classified by AI'}</h4><Stamp activity={activity} /><pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 font-sans text-sm leading-6">{run.workflow}</pre>{run.number === 2 ? <p className="mt-3 text-sm leading-6"><strong>Revision reason:</strong> {run.reason}</p> : null}<ClassificationView activity={activity} mapping={run.mapping} steps={run.steps} classifiedBy={run.classifiedBy} modelId={run.modelId} />{run.result.results.map(result => <CaseOutcome key={result.caseId} activity={activity} result={result} />)}<section className="mt-4 rounded-lg border border-slate-200 p-3"><Stamp activity={activity} /><h5 className="text-sm font-semibold">Run tally · counts, not a score</h5><dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">{Object.entries(run.result.tally).map(([name, value]) => <div key={name}><dt className="capitalize text-slate-600">{name}</dt><dd className="font-semibold">{value}</dd></div>)}</dl><p className="mt-2 text-xs leading-6 text-slate-600">Sent and routed counts can overlap when a request is routed and an acknowledgement is released. These are rehearsal events, not observed service results.</p></section></section>)}</div>
    {locked && !episodeComplete ? <section className="mt-6"><h3 className="font-semibold">Now handle a new request</h3><p className="mt-2 text-sm leading-6">Version 2 is frozen. The next request uses exactly its recorded actions and interpretations; it makes no AI call and permits no third rewrite in this episode.</p><button type="button" className={`${button} mt-3`} onClick={nextRequest} disabled={busy || unrecognized !== null}>Run the new request with version 2</button></section> : null}
    {session.record.nextRequest ? <section className="mt-5"><h3 className="font-semibold">New request · frozen version 2</h3><CaseOutcome activity={activity} result={session.record.nextRequest} /><div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4"><Stamp activity={activity} /><h3 className="font-semibold">Take one lesson into your project</h3><p className="mt-2 text-sm leading-6">{activity.projectQuestion}</p><p className="mt-3 text-xs leading-6">Use the same project update already required by your course. Label this practice as simulated; it is not another person trying your project.</p></div><details className="mt-4 rounded-lg border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold">Compare with the authored worked route</summary><Stamp activity={activity} />{(activity.workedRoutes ?? []).map((route, index) => <p key={index} className="mt-3 text-sm leading-6"><strong>Version {route.version}, request {route.case}:</strong> {activity.consequences[route.consequence].debrief}</p>)}</details>{!canvasDelivery ? <a href="/teaching/ai-solutions/unit-04.html#step-2" className="mt-4 inline-block min-h-11 py-3 text-sm font-semibold text-teal-900 underline">Return to this unit’s Build step →</a> : <p className="mt-4 text-sm">Continue in this Canvas lesson and submit relevant reasoning through your existing project update.</p>}</section> : null}
    <footer className="mt-7 border-t border-slate-200 pt-5"><div className="flex flex-wrap gap-3"><button type="button" className={secondary} onClick={exportRecord}>Export or copy this episode</button><button type="button" className="min-h-11 px-2 text-sm font-semibold text-slate-600 underline" disabled={busy} onClick={() => { setResetOpen(true); setResetAcknowledged(false); }}>Start a new practice episode</button></div>
      {exportText !== null ? <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4"><label htmlFor="shift-export" className="block text-sm font-semibold">Practice record to copy</label><p className="mt-2 text-xs leading-6">This is the snapshot from your latest export request. Export again after changing the episode. A download request does not guarantee a received file; the complete text is available here.</p><textarea ref={exportControl} id="shift-export" rows={12} readOnly value={exportText} className={field} /><button type="button" className={`${secondary} mt-3`} onClick={() => { exportControl.current?.focus(); exportControl.current?.select(); setNotice('Record selected. Use your device’s Copy command.'); }}>Select complete record</button></section> : null}
      {resetOpen ? <section className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4"><h3 className="font-semibold">Keep a copy before starting again</h3><p className="mt-2 text-sm leading-6">A new episode replaces only this revision-2 practice record in this tab. Export or copy anything you need first. Earlier revision-1 records and conversations are retained.</p><label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={resetAcknowledged} onChange={event => setResetAcknowledged(event.target.checked)} />I have kept the copy I need and am ready to replace the current episode.</label><div className="mt-3 flex flex-wrap gap-2"><button type="button" className={secondary} onClick={exportRecord}>Export / show copyable record</button><button type="button" className={button} disabled={!resetAcknowledged} onClick={newEpisode}>Start new episode</button><button type="button" className={secondary} onClick={() => setResetOpen(false)}>Keep current episode</button></div></section> : null}
      <p role="status" aria-live="polite" className="mt-4 text-sm leading-6 text-slate-700">{notice}</p><p className={`mt-2 text-xs leading-6 ${storage ? 'text-slate-500' : 'text-amber-900'}`}>{storage ? 'This practice stays in this browser tab and can survive a reload. Keep an export beyond the tab; Canvas does not receive this record automatically.' : 'Browser storage is blocked. Keep this page open and export or copy the record before leaving.'}</p>
    </footer>
  </section>;
}
