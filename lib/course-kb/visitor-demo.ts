import { LEARNING_ACTIVITIES, isShiftRunActivity } from './learning';
import { runNextRequest, runShift, validateShiftMapping, validateShiftWorkflow, type ShiftAction, type ShiftMapping } from './shift-run';

const unitFour = LEARNING_ACTIVITIES[3];
if (!isShiftRunActivity(unitFour)) throw new Error('The visitor demo needs the current Unit 4 rehearsal.');
export const VISITOR_ACTIVITY = unitFour;

function action(type: ShiftAction['type'], attributes: object = {}): ShiftAction {
  return { type, quote: '', ...attributes } as ShiftAction;
}

function acceptedMapping(workflow: string, rows: ShiftAction[][]): ShiftMapping {
  const steps = validateShiftWorkflow(workflow);
  return validateShiftMapping(rows.map((actions, index) => ({
    step: index + 1,
    actions: actions.map(value => ({ ...value, quote: steps[index] })),
  })), steps);
}

/** Authored interpretations of the published examples. The visitor is not asked
 * to classify prose, and no model, research collector, or browser storage runs. */
export const VISITOR_MAPPINGS = {
  first: acceptedMapping(VISITOR_ACTIVITY.fixtures.v1.workflow, [
    [action('intake')], [action('find_source')],
    [action('ai_draft', { ai_draft: { states_conditions: false, forbids_promises: false } })],
    [action('human_check', { human_check: { checks: ['tone', 'accuracy'] } })],
    [action('release')],
  ]),
  revised: acceptedMapping(VISITOR_ACTIVITY.fixtures.v2.workflow, [
    [action('intake')], [action('find_source')],
    [action('ai_draft', { ai_draft: { states_conditions: true, forbids_promises: true } })],
    [action('human_check', { human_check: { checks: ['tone', 'accuracy', 'commitments', 'confirmations'] } })],
    [action('route_to_owner', { when: 'if_held', route_to_owner: { only_if_held: true } })],
    [action('release', { when: 'if_not_held' })],
  ]),
  safer: acceptedMapping(VISITOR_ACTIVITY.fixtures.safe!.workflow, [
    [action('intake'), action('ask_missing_fact', { when: 'if_missing_fact' })],
    [action('find_source'), action('check_conditions')],
    [action('ai_draft', { ai_draft: { states_conditions: true, forbids_promises: true } })],
    [action('human_check', { human_check: { checks: ['source', 'conditions', 'tone', 'next_step'] } })],
    [action('route_to_owner', { when: 'if_held', route_to_owner: { only_if_held: true } }), action('acknowledge_customer', { when: 'if_held' })],
    [action('release', { when: 'if_not_held' })],
  ]),
} as const;

export function runVisitorFirst() { return runShift(VISITOR_ACTIVITY, VISITOR_MAPPINGS.first); }
export function runVisitorRevised() { return runShift(VISITOR_ACTIVITY, VISITOR_MAPPINGS.revised); }
export function runVisitorChanged(choice: 'route' | 'ask') {
  return runNextRequest(VISITOR_ACTIVITY, VISITOR_MAPPINGS[choice === 'ask' ? 'safer' : 'revised']);
}
