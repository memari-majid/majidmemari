'use client';

import { useState } from 'react';

// The fixed Unit 3 example in assets/lesson-figures.js: effortModel(0|3, 3).
// This preview changes the view, not the supplied task times or a learner record.
const MANUAL_MINUTES = 8;
const COMPONENTS = [
  { label: 'Draft', minutes: 2, color: '#2563eb' },
  { label: 'Source checking', minutes: 3, color: '#007f7a' },
  { label: 'Correction', minutes: 2, color: '#a6640b' },
  { label: 'Handoff', minutes: 1, color: '#182a46' },
] as const;

export function CourseEffortPreview() {
  const [complete, setComplete] = useState(false);
  const visible = COMPONENTS.filter((_, index) => complete || index === 0);
  const total = visible.reduce((sum, component) => sum + component.minutes, 0);

  return (
    <figure className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="course-effort-title">
      <figcaption>
        <p className="text-xs font-semibold uppercase tracking-widest text-teal-800">Try a course figure</p>
        <h4 id="course-effort-title" className="mt-2 text-xl font-semibold leading-snug text-slate-900">A faster draft. A faster task?</h4>
        <p className="mt-2 text-xs leading-5 text-slate-600">Illustrative case · minutes per reply</p>
      </figcaption>

      <div className="mt-5 space-y-4" aria-hidden="true">
        <div>
          <div className="mb-2 flex justify-between gap-3 text-sm"><span>Manual · complete task</span><strong>{MANUAL_MINUTES} min</strong></div>
          <div className="h-8 rounded bg-slate-100"><div className="h-full rounded bg-slate-500" /></div>
        </div>
        <div>
          <div className="mb-2 flex justify-between gap-3 text-sm"><span>With AI · {complete ? 'complete task' : 'draft only'}</span><strong>{total} min{complete ? '' : ' so far'}</strong></div>
          <div className="flex h-8 overflow-hidden rounded border border-dashed border-slate-300 bg-slate-50">
            {COMPONENTS.map((component, index) => (
              <div key={component.label} className="flex h-full shrink-0 items-center justify-center overflow-hidden text-xs font-semibold text-white transition-[width] duration-500 motion-reduce:transition-none" style={{ backgroundColor: component.color, width: `${index === 0 || complete ? component.minutes / MANUAL_MINUTES * 100 : 0}%` }}>
                {index === 0 || complete ? component.minutes : null}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500">Both bars use the same scale: 0–8 minutes.</p>
      </div>

      <button type="button" aria-controls="course-effort-reading" onClick={() => setComplete(value => !value)} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
        {complete ? 'Show draft only' : 'Include the whole task'}
      </button>

      <div id="course-effort-reading" className="mt-4">
        <table className="w-full border-collapse text-left text-xs leading-5 text-slate-600">
          <caption className="sr-only">The same task components and minutes as the figure</caption>
          <thead><tr className="border-b border-slate-200"><th scope="col" className="py-2 font-medium">Work counted</th><th scope="col" className="py-2 text-right font-medium">Minutes</th></tr></thead>
          <tbody>
            <tr className="border-b border-slate-100"><th scope="row" className="py-2 font-normal">Manual · complete task</th><td className="py-2 text-right tabular-nums">{MANUAL_MINUTES}</td></tr>
            {visible.map(component => (
              <tr key={component.label} className="border-b border-slate-100"><th scope="row" className="py-2 font-normal"><span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: component.color }} />{component.label}</th><td className="py-2 text-right tabular-nums">{component.minutes}</td></tr>
            ))}
            <tr><th scope="row" className="py-2 font-semibold text-slate-900">AI {complete ? 'complete task' : 'subtotal · incomplete'}</th><td className="py-2 text-right font-semibold tabular-nums text-slate-900">{total}</td></tr>
          </tbody>
        </table>
        <p role="status" aria-live="polite" className="mt-3 text-sm leading-relaxed text-slate-700">
          {complete ? 'The 2-minute draft needs 6 more minutes of checking, correction and handoff. Both complete tasks take 8 minutes in this example.' : 'Only drafting is counted so far. Reveal the surrounding work before judging whether AI saves time.'}
        </p>
      </div>
      <a href="/teaching/ai-solutions/unit-03.html#lesson-figure-3-title" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">Explore the complete figure →</a>
    </figure>
  );
}
