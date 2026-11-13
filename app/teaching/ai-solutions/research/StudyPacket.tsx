import type { ResearchForm } from "@/lib/research/types";

export const studyField =
  "mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:bg-slate-50";
export const studyButton =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#182a46] px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50";
export const studySecondary =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:border-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50";

/** Only the current authorized packet is rendered. No answer keys or chat tools. */
export function StudyPacket({ form }: { form: ResearchForm }) {
  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
      aria-labelledby="study-packet-title"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-teal-800">
        Task packet · {form.id} · version {form.version}
      </p>
      <h2
        id="study-packet-title"
        className="mt-2 font-serif text-2xl leading-tight"
      >
        {form.title}
      </h2>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7">
        {form.instructions}
      </p>
      {form.sources.length ? (
        <section className="mt-6" aria-label="Supplied sources">
          <h3 className="font-semibold">Supplied sources</h3>
          <div className="mt-3 space-y-3">
            {form.sources.map((source) => (
              <article
                key={source.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <h4 className="text-sm font-semibold">
                  {source.id} · {source.label}
                </h4>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">
                  {source.text}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {form.trace.length ? (
        <section className="mt-6" aria-label="Supplied execution trace">
          <h3 className="font-semibold">Supplied trace</h3>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-7">
            {form.trace.map((line, index) => (
              <li key={index} className="whitespace-pre-wrap break-words pl-1">
                {line}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </section>
  );
}
