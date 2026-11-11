export function ComputationMethods({ methods }: { methods?: readonly string[] }) {
  return methods && methods.length > 0 ? <ul aria-label="Computational methods" className="mt-3 flex flex-wrap gap-2">{methods.map((method) => <li key={method} className="rounded-full border border-teal-800/20 px-3 py-1 text-xs text-teal-800">{method}</li>)}</ul> : null;
}
