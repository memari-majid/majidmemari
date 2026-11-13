'use client';

import { SHIFT_ACTION_TYPES, SHIFT_ACTION_LABELS, SHIFT_CHECKS, SHIFT_CHECK_LABELS, SHIFT_GUARDS, SHIFT_GUARD_LABELS, type ShiftAction, type ShiftGuard, type ShiftMapping } from '@/lib/course-kb/shift-run';

export const SHIFT_EDITOR_FIELD = 'mt-2 min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white p-3 text-base leading-6 text-slate-950 focus:outline-2 focus:outline-offset-2 focus:outline-teal-700 disabled:bg-slate-50';
const smallButton = 'min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-teal-700 disabled:opacity-40';
export function newShiftEditorAction(type: ShiftAction['type']): ShiftAction {
  const common = { quote: '', when: 'always' as const };
  if (type === 'ai_draft') return { type, ...common, ai_draft: { states_conditions: false, forbids_promises: false } };
  if (type === 'human_check') return { type, ...common, human_check: { checks: [] } };
  if (type === 'route_to_owner') return { type, ...common, route_to_owner: { only_if_held: false } };
  return { type, ...common };
}

type Props = { steps: string[]; mapping: ShiftMapping; reviewed: number[]; onChange: (mapping: ShiftMapping, reviewed: number[]) => void; disabled?: boolean };
/** Exactly the same editor is used for an AI proposal and an empty learner mapping. */
export function ShiftMappingEditor({ steps, mapping, reviewed, onChange, disabled = false }: Props) {
  function changed(step: number, actions: ShiftAction[]) {
    onChange(mapping.map(line => line.step === step ? { ...line, actions } : line), reviewed.filter(number => number !== step));
  }
  function update(step: number, index: number, action: ShiftAction | null) {
    const line = mapping.find(item => item.step === step)!;
    changed(step, action === null ? line.actions.filter((_, number) => number !== index) : line.actions.map((old, number) => number === index ? action : old));
  }
  function move(step: number, index: number, delta: -1 | 1) {
    const actions = [...mapping.find(item => item.step === step)!.actions], other = index + delta;
    if (other < 0 || other >= actions.length) return;
    [actions[index], actions[other]] = [actions[other], actions[index]];
    changed(step, actions);
  }
  return <div className="mt-4 space-y-4">
    <p className="text-sm leading-6 text-slate-700">For each line, inspect or add only the actions the words specify. <strong>Action 1 happens before Action 2.</strong> Copy an exact supporting substring for each action, then check its condition and attributes. You can correct any proposal. A category is not a required ingredient or a score.</p>
    {mapping.map(line => <details key={line.step} open={line.step === 1} className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <summary className="min-h-11 cursor-pointer text-sm font-semibold">Line {line.step} · {line.actions.length} action{line.actions.length === 1 ? '' : 's'} · {reviewed.includes(line.step) ? 'reviewed' : 'inspect before running'}</summary>
      <fieldset disabled={disabled} className="mt-3 min-w-0"><legend className="sr-only">Inspect line {line.step} · up to 3 actions</legend>
      <p className="whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-sm leading-6">{steps[line.step - 1]}</p>
      {line.actions.map((action, index) => <section key={index} className="mt-4 min-w-0 border-t border-slate-200 pt-4" aria-label={`Line ${line.step}, action ${index + 1}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Action {index + 1}{index > 0 ? ` · after action ${index}` : ' · first on this line'}</p>
        <label htmlFor={`shift-type-${line.step}-${index}`} className="mt-2 block text-sm font-medium">Action described by the quoted words</label>
        <select id={`shift-type-${line.step}-${index}`} value={action.type} onChange={event => update(line.step, index, { ...newShiftEditorAction(event.target.value as ShiftAction['type']), quote: action.quote, when: action.when ?? 'always' })} className={SHIFT_EDITOR_FIELD}>{SHIFT_ACTION_TYPES.map(type => <option key={type} value={type}>{SHIFT_ACTION_LABELS[type]}</option>)}</select>
        <label htmlFor={`shift-quote-${line.step}-${index}`} className="mt-3 block text-sm font-medium">Exact supporting words from this line</label>
        <input id={`shift-quote-${line.step}-${index}`} maxLength={1200} aria-invalid={!!action.quote && !steps[line.step - 1].includes(action.quote)} aria-describedby={`shift-quote-help-${line.step}-${index}`} value={action.quote} onChange={event => update(line.step, index, { ...action, quote: event.target.value })} className={SHIFT_EDITOR_FIELD} placeholder="Copy the words for this action, not an invented instruction." />
        <p id={`shift-quote-help-${line.step}-${index}`} className={`mt-1 text-xs leading-5 ${action.quote && !steps[line.step - 1].includes(action.quote) ? 'text-red-800' : 'text-slate-600'}`}>{action.quote && !steps[line.step - 1].includes(action.quote) ? 'These words do not match the source line exactly. Copy the supporting substring from that line.' : 'Use a substring with the action and its relevant condition. Both AI and learner mappings follow this same rule.'}</p>
        <label htmlFor={`shift-guard-${line.step}-${index}`} className="mt-3 block text-sm font-medium">When does the wording say this action happens?</label>
        <select id={`shift-guard-${line.step}-${index}`} value={action.when ?? 'always'} onChange={event => update(line.step, index, { ...action, when: event.target.value as ShiftGuard })} className={SHIFT_EDITOR_FIELD}>{SHIFT_GUARDS.map(when => <option key={when} value={when}>{SHIFT_GUARD_LABELS[when]}</option>)}</select>
        {action.when === 'if_approved' ? <p className="mt-2 text-xs leading-6 text-slate-600">These requests supply no owner approval. This condition does not invent one; the trace will show whether the action could run.</p> : null}
        {action.type === 'ai_draft' ? <fieldset className="mt-3"><legend className="text-sm font-medium">What the draft instruction explicitly includes</legend><label className="mt-3 flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1" checked={action.ai_draft.states_conditions} onChange={event => update(line.step, index, { ...action, ai_draft: { ...action.ai_draft, states_conditions: event.target.checked } })} />State the approved policy’s conditions.</label><label className="mt-3 flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1" checked={action.ai_draft.forbids_promises} onChange={event => update(line.step, index, { ...action, ai_draft: { ...action.ai_draft, forbids_promises: event.target.checked } })} />Forbid unsupported promises or claims that a change happened.</label></fieldset> : null}
        {action.type === 'human_check' ? <fieldset className="mt-3"><legend className="text-sm font-medium">Checks explicitly named in this instruction</legend>{SHIFT_CHECKS.map(check => <label key={check} className="mt-3 flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1" checked={action.human_check.checks.includes(check)} onChange={event => update(line.step, index, { ...action, human_check: { checks: event.target.checked ? [...action.human_check.checks, check] : action.human_check.checks.filter(value => value !== check) } })} />{SHIFT_CHECK_LABELS[check]}</label>)}</fieldset> : null}
        {action.type === 'route_to_owner' ? <label className="mt-3 flex items-start gap-3 text-sm leading-6"><input type="checkbox" className="mt-1" checked={action.route_to_owner.only_if_held} onChange={event => update(line.step, index, { ...action, route_to_owner: { only_if_held: event.target.checked } })} />This route also requires the request to be held. Leave unchecked if the wording does not require that.</label> : null}
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" className={smallButton} disabled={disabled || index === 0} onClick={() => move(line.step, index, -1)} aria-label={`Move line ${line.step} action ${index + 1} earlier`}>Move earlier</button><button type="button" className={smallButton} disabled={disabled || index === line.actions.length - 1} onClick={() => move(line.step, index, 1)} aria-label={`Move line ${line.step} action ${index + 1} later`}>Move later</button><button type="button" className={smallButton} onClick={() => update(line.step, index, null)}>Remove action {index + 1}</button></div>
      </section>)}
      {line.actions.length < 3 ? <><label htmlFor={`shift-add-${line.step}`} className="mt-4 block text-sm font-medium">Add an action explicitly stated on line {line.step}</label><select id={`shift-add-${line.step}`} value="" onChange={event => { if (event.target.value) changed(line.step, [...line.actions, newShiftEditorAction(event.target.value as ShiftAction['type'])]); }} className={SHIFT_EDITOR_FIELD}><option value="">Choose an action to add</option>{SHIFT_ACTION_TYPES.map(type => <option key={type} value={type}>{SHIFT_ACTION_LABELS[type]}</option>)}</select></> : null}
      <label className="mt-4 flex items-start gap-3 border-t border-slate-100 pt-3 text-sm leading-6"><input type="checkbox" className="mt-1" checked={reviewed.includes(line.step)} onChange={event => onChange(mapping, event.target.checked ? [...new Set([...reviewed, line.step])] : reviewed.filter(step => step !== line.step))} />{line.actions.length ? `I reviewed line ${line.step}: its quotes, action order, conditions and checks match my wording.` : `I reviewed line ${line.step}: none of the listed actions is specified.`}</label>
      </fieldset>
    </details>)}
  </div>;
}
