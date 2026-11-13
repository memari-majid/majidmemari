'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { SHIFT_ACTION_LABELS, shiftResultExplanation, type ShiftCaseResult, type ShiftEpisodeResult } from '@/lib/course-kb/shift-run';
import { runVisitorChanged, runVisitorFirst, runVisitorRevised, VISITOR_ACTIVITY } from '@/lib/course-kb/visitor-demo';

type Phase = 'start' | 'first' | 'revised' | 'changed';
type CaseId = 'A' | 'B';
const CASES = VISITOR_ACTIVITY.cases;
const SOURCES = VISITOR_ACTIVITY.setting.sources;
const activity = VISITOR_ACTIVITY;

const toneClass = {
  good: 'border-teal-200 bg-teal-50 text-teal-900',
  warn: 'border-amber-200 bg-amber-50 text-amber-950',
  bad: 'border-rose-200 bg-rose-50 text-rose-950',
} as const;

function Outcome({ result, compact = false }: { result: ShiftCaseResult; compact?: boolean }) {
  const consequence = activity.consequences[result.consequenceId];
  const reaction = CASES.find(value => value.id === result.caseId)?.reactions?.[result.consequenceId] ?? consequence.reaction;
  return (
    <div className={`rounded-2xl border p-5 ${toneClass[consequence.tone]}`}>
      <p className="text-xs font-bold uppercase tracking-[0.16em]">{consequence.tone === 'good' ? 'Appropriate next step' : consequence.tone === 'bad' ? 'Unsafe result' : 'Needs another revision'}</p>
      <h4 className="mt-2 text-lg font-bold leading-snug">{consequence.label}</h4>
      <p className="mt-3 text-sm leading-6">{shiftResultExplanation(activity, result)}</p>
      {!compact ? <p className="mt-4 border-t border-current/20 pt-3 text-sm italic leading-6">{reaction}</p> : null}
      {result.draftId && !compact ? <details className="mt-4 rounded-lg border border-current/20 p-3 text-sm"><summary className="cursor-pointer font-semibold">See the draft or reply</summary><p className="mt-3 whitespace-pre-line leading-6">{activity.drafts[result.draftId]}</p></details> : null}
    </div>
  );
}

function Trace({ result }: { result: ShiftCaseResult }) {
  const events = result.trace ?? [];
  const executed = events.filter(event => event.status === 'executed');
  const colorFor = (type: string) => {
    if (type === 'find_source' || type === 'check_conditions' || type === 'ask_missing_fact') return 'border-sky-200 bg-sky-50 text-sky-900';
    if (type === 'ai_draft') return 'border-amber-200 bg-amber-50 text-amber-950';
    if (type === 'human_check' || type === 'acknowledge_customer') return 'border-teal-200 bg-teal-50 text-teal-900';
    if (type === 'release' || type === 'confirm_change') return result.consequenceId === 'sent_conditions' || result.consequenceId === 'asked_missing_time' ? 'border-teal-200 bg-teal-50 text-teal-900' : 'border-rose-200 bg-rose-50 text-rose-950';
    return 'border-slate-200 bg-slate-50 text-slate-800';
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">What the workflow did</p>
      <ol aria-label="Executed workflow path" className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {executed.map((event, index) => (
          <li key={`${event.step}-${event.action}-${index}`} className={`visitor-step-enter rounded-xl border p-3 text-xs font-semibold leading-5 ${colorFor(event.type)}`} style={{ animationDelay: `${Math.min(index * 110, 550)}ms` }}>
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/75 text-[11px]">{index + 1}</span>{SHIFT_ACTION_LABELS[event.type]}
          </li>
        ))}
      </ol>
      <details className="mt-3 border-t border-slate-200 pt-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Inspect the full action trace ({events.length} actions)</summary>
        <ol className="mt-4 space-y-3 border-l-2 border-slate-200 pl-5">
          {events.map((event, index) => (
            <li key={`${event.step}-${event.action}-${index}`} className="relative text-sm leading-6 text-slate-700">
              <span className={`absolute -left-[1.75rem] top-2 h-2.5 w-2.5 rounded-full ${event.status === 'executed' ? 'bg-teal-700' : 'bg-slate-300'}`} aria-hidden="true" />
              <span className="font-semibold text-slate-900">{SHIFT_ACTION_LABELS[event.type]}</span> <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{event.status}</span>
              <p>{event.detail}</p>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

export function VisitorSimulationDemo() {
  const [phase, setPhase] = useState<Phase>('start');
  const [first, setFirst] = useState<ShiftEpisodeResult | null>(null);
  const [revised, setRevised] = useState<ShiftEpisodeResult | null>(null);
  const [changed, setChanged] = useState<ShiftCaseResult | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseId>('A');
  const [prediction, setPrediction] = useState<'both' | 'a' | 'b' | null>(null);
  const [changedChoice, setChangedChoice] = useState<'route' | 'ask' | null>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const changedHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (phase === 'changed') changedHeading.current?.focus();
    else if (phase === 'first' || phase === 'revised') resultsHeading.current?.focus();
  }, [phase]);

  function replay() {
    setFirst(null); setRevised(null); setChanged(null); setPrediction(null); setChangedChoice(null); setSelectedCase('A'); setPhase('start');
  }
  function firstRun() { setFirst(runVisitorFirst()); setPhase('first'); }
  function revisedRun() { setRevised(runVisitorRevised()); setPhase('revised'); }
  function changedRun(choice: 'route' | 'ask') { setChanged(runVisitorChanged(choice)); setChangedChoice(choice); setPhase('changed'); }

  const current = phase === 'first' ? first : revised;
  const currentResult = current?.results.find(result => result.caseId === selectedCase);
  const firstResult = first?.results.find(result => result.caseId === selectedCase);

  return (
    <div className="min-w-0">
      <Link href="/#teaching" className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-800 underline underline-offset-4">← Teaching</Link>
      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(270px,.75fr)] lg:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-800">Building AI Solutions · Interactive preview</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">A small AI workflow. Real decisions to make.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">You are designing a reply process for Cedar Desk. Run it on two requests, repair what goes wrong, and test a request the workflow has not seen.</p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">About 3 minutes · No account or coding · All requests, policies, and reactions are fictional teaching material.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">How this works</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-sky-100 px-3 py-2 text-sky-900">1 · Inspect evidence</span><span aria-hidden="true">→</span>
            <span className="rounded-full bg-amber-100 px-3 py-2 text-amber-950">2 · Run a decision</span><span aria-hidden="true">→</span>
            <span className="rounded-full bg-teal-100 px-3 py-2 text-teal-900">3 · Improve</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">The same authored rule engine powers the full course rehearsal. Results come from the actions and policy conditions, not from an AI writing a plausible outcome.</p>
        </div>
      </div>

      <section aria-labelledby="desk-heading" className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-950 px-5 py-6 text-white sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">The fictional workplace</p>
          <h2 id="desk-heading" className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">Cedar Desk · Tuesday shift</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">An AI can draft a reply. A person still decides what can be promised, what requires approval, and when a customer should hear back.</p>
        </div>
        <div className="grid gap-5 p-5 sm:p-8 lg:grid-cols-2">
          {CASES.filter(value => value.id !== 'C').map(value => (
            <article key={value.id} className="rounded-2xl border border-slate-200 bg-[#f7f6f2] p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Request {value.id} · {value.received}</p>
              <p className="mt-3 text-base font-semibold leading-7 text-slate-900">“{value.request}”</p>
              <p className="mt-3 text-sm text-slate-600">Relevant source: {value.policy}</p>
            </article>
          ))}
        </div>
        <div className="border-t border-slate-200 bg-sky-50/70 p-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-800">Source evidence · Open before deciding</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {SOURCES.filter(value => ['S2', 'S3', 'S4', 'S6'].includes(value.id)).map(value => (
              <details key={value.id} className="rounded-xl border border-sky-200 bg-white p-3 text-sm text-slate-700">
                <summary className="cursor-pointer font-semibold text-sky-900">{value.label}</summary>
                <p className="mt-2 leading-6">{value.text}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="experiment-heading" className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-800">The simulation</p>
            <h2 id="experiment-heading" className="mt-2 font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">Run → notice → revise</h2>
          </div>
          {phase !== 'start' ? <button type="button" onClick={replay} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-teal-700 hover:text-teal-800">Replay from the start</button> : null}
        </div>

        {phase === 'start' ? (
          <div className="mt-7 grid gap-7 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <p className="text-sm font-bold text-slate-900">First, make a prediction.</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Which requests need more than a friendly AI draft before anyone can make a promise?</p>
              <div role="group" aria-label="Prediction" className="mt-4 grid gap-2">
                {([['a', 'A only'], ['b', 'B only'], ['both', 'Both requests']] as const).map(([id, label]) => (
                  <button key={id} type="button" aria-pressed={prediction === id} onClick={() => setPrediction(id)} className={`min-h-12 rounded-xl border px-4 text-left text-sm font-semibold transition ${prediction === id ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-400'}`}>{label}</button>
                ))}
              </div>
              {prediction ? <p className="mt-3 text-sm leading-6 text-slate-600">Keep that prediction in mind while the workflow runs. The evidence will show where it holds up.</p> : null}
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-900">Authored first workflow</p>
              <ol className="mt-3 list-inside list-decimal space-y-1 text-sm leading-6 text-slate-800">{activity.fixtures.v1.workflow.split('\n').map(line => <li key={line}>{line}</li>)}</ol>
              <button type="button" onClick={firstRun} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-teal-800">Run this workflow →</button>
            </div>
          </div>
        ) : null}

        {first ? (
          <div className="mt-7">
            <div className="flex flex-wrap items-center gap-3">
              <h3 ref={resultsHeading} tabIndex={-1} className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{phase === 'first' ? 'First-run results' : 'Compare the two runs'}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Authored example · simulated outcomes</span>
            </div>
            <div role="group" aria-label="Choose a request to inspect" className="mt-4 flex gap-2">
              {(['A', 'B'] as const).map(id => <button key={id} type="button" onClick={() => setSelectedCase(id)} aria-pressed={selectedCase === id} className={`min-h-11 rounded-lg border px-5 text-left text-sm font-bold ${selectedCase === id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-700'}`}>Request {id}<span className="block text-xs font-medium opacity-80">{activity.consequences[first.results.find(result => result.caseId === id)!.consequenceId].label}</span></button>)}
            </div>
            <div className={`mt-5 grid gap-4 ${revised ? 'lg:grid-cols-2' : ''}`}>
              {firstResult ? <div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">First workflow</p><Outcome result={firstResult} /></div> : null}
              {revised && currentResult ? <div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Revised workflow</p><Outcome result={currentResult} /></div> : null}
            </div>
            {currentResult ? <div className="mt-4"><Trace result={currentResult} /></div> : null}
            {phase === 'first' ? (
              <div className="mt-7 rounded-2xl border border-teal-200 bg-teal-50 p-5 sm:p-6">
                <p className="text-sm font-bold text-teal-900">What would you change?</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">The first check looked at tone and accuracy, but did not block an unapproved confirmation or credit. This revision adds a promise check and routes held messages to the owner.</p>
                <button type="button" onClick={revisedRun} className="mt-4 min-h-12 rounded-xl bg-teal-800 px-5 text-sm font-bold text-white transition hover:bg-teal-700">Run the revised workflow →</button>
              </div>
            ) : null}
          </div>
        ) : null}

        {revised && phase !== 'changed' ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-900">A new request arrives</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">Request C: “Please cancel my booking.”</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">The session time is missing. Which complete workflow should handle it?</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">The safer authored workflow also checks source conditions and tells customers when a real exception is under review.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={() => changedRun('route')} className="min-h-12 rounded-xl border border-amber-700 bg-white px-5 text-sm font-semibold text-amber-950 hover:bg-amber-100">Keep the revised workflow · route</button>
              <button type="button" onClick={() => changedRun('ask')} className="min-h-12 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-teal-800">Try the safer workflow · ask first</button>
            </div>
          </div>
        ) : null}

        {changed ? (
          <div className="mt-8">
            <h3 ref={changedHeading} tabIndex={-1} className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Changed-case result · Request C · {changedChoice === 'ask' ? 'safer workflow' : 'revised workflow'}</h3>
            <Outcome result={changed} />
            <div className="mt-4"><Trace result={changed} /></div>
            <p className="mt-5 text-sm leading-7 text-slate-700">The first revision fixed A, but B still received no acknowledgment and C could be escalated unnecessarily. A strong workflow checks missing facts before drafting, routes actual exceptions, and communicates the status without promising approval.</p>
            <button type="button" onClick={() => changedRun(changed.consequenceId === 'asked_missing_time' ? 'route' : 'ask')} className="mt-3 min-h-11 text-sm font-semibold text-teal-800 underline underline-offset-4">Compare the other choice →</button>
          </div>
        ) : null}
      </section>

      <div className="mt-10 grid gap-5 rounded-3xl bg-slate-950 p-6 text-white sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
        <div><p className="text-xs font-bold uppercase tracking-widest text-teal-200">Continue learning</p><h2 className="mt-2 font-serif text-2xl font-semibold">Design and test your own solution</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">The complete Unit 4 rehearsal lets you write a workflow, inspect and correct its interpretation, and use the Learning Companion to reason through your choices.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row md:flex-col"><a href="/teaching/ai-solutions/assistant?lesson=unit-04.html" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-center text-sm font-bold text-slate-950 hover:bg-teal-50">Open the full simulation →</a><a href="/teaching/ai-solutions/index.html" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-500 px-5 text-center text-sm font-bold text-white hover:bg-slate-800">Explore the course</a></div>
      </div>
      <p className="mt-5 text-xs leading-6 text-slate-600">This public preview saves no responses and sends no data to the study collector. The authored outcomes are for practice; no real booking or customer is affected.</p>
    </div>
  );
}
