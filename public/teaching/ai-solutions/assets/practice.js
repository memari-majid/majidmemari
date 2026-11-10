/* Building AI Solutions · original Cedar Desk teaching activities.
 * Browser: auto-mount [data-practice]. Node: module.exports exposes the same pure models.
 * All supplied records are fictional. No requests, analytics, or AI calls are made here.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.AISolutionsPractice = api; if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => api.mountAll()); else api.mountAll(); }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 2;
  const WAIT_RECORDS = [4, 5, 5, 6, 6, 7, 8, 31].map((minutes, i) => ({ id: `wait-${i + 1}`, label: `Reply ${i + 1}`, minutes }));
  const CASES = [
    ['Cancel 96 hours before', 'S2: At least 72 hours before the session gives refund eligibility. S4/S6: A draft does not mean a refund was processed.', 'You are eligible for a refund under the cancellation policy; the coordinator must process it. No refund has been processed by this reply.', false, 'S2, S4, S6'],
    ['Cancel 48 hours before', 'S2: From 24 up to, but not including, 72 hours gives credit valid for 90 days.', 'Your timing qualifies for credit valid for 90 days, not an automatic refund.', false, 'S2, S6'],
    ['Emergency cancellation 8 hours before', 'S2: Under 24 hours, no automatic refund or credit; an owner reviews exceptional requests. S6: A person authorizes commitments.', 'Your emergency cancellation automatically qualifies for a full refund.', true, 'S2, S6'],
    ['Cancel with timing missing', 'S4: Ask for the missing fact needed to apply the policy.', 'How many hours remain until the session? I need that timing to identify the applicable policy.', false, 'S2, S4, S6'],
    ['Move booking 60 hours before', 'S3: At least 48 hours permits consideration, subject to space and coordinator confirmation. No availability is supplied.', 'A change can be considered, subject to space and coordinator confirmation. Which session should we check? Your booking has not changed.', false, 'S3, S4, S6'],
    ['Move booking 20 hours before', 'S3: The published rescheduling rule starts at 48 hours. S5/S6: Policy exceptions need owner review.', 'The published rescheduling condition is not met. I will prepare the request for owner review without promising a change.', false, 'S3, S5, S6'],
    ['Booking for a 14-year-old', 'S1: Participants must be at least 16. S5: An age exception requires owner review.', 'A 14-year-old can attend; your booking is accepted.', true, 'S1, S5, S6'],
    ['Duration and materials', 'S1: The Standard Workshop lasts 90 minutes and costs $40 per participant, including materials.', 'The workshop lasts 90 minutes and costs $40 per participant, including materials.', false, 'S1, S6'],
    ['Cancel exactly 72 hours before', 'S2: At least 72 hours gives refund eligibility; the boundary includes exactly 72.', 'Exactly 72 hours meets the refund-eligibility boundary. A coordinator must still process the request.', false, 'S2, S4, S6'],
    ['Cancel exactly 24 hours before', 'S2: The credit period includes exactly 24 hours and is valid for 90 days.', 'Exactly 24 hours falls in the 90-day credit branch, not the refund branch.', false, 'S2, S6'],
    ['Guarantee an access arrangement', 'S5: Accessibility arrangements require owner review; no arrangement is supplied. S6: A person authorizes commitments.', 'The requested access arrangement is guaranteed.', true, 'S5, S6'],
    ['Special price for a group of 20', 'S5: Group prices require owner review; the packet supplies no special price.', 'I can prepare a quotation request for the owner. No group price has been approved yet.', false, 'S5, S6']
  ].map((x, i) => ({ id: `case-${i + 1}`, label: `Case ${i + 1}`, request: x[0], fact: x[1], draft: x[2], materialError: x[3], requiresOwnerReview: [3, 6, 7, 11, 12].includes(i + 1), sources: x[4], manualMinutes: 8, aiMinutes: 2, reviewedMinutes: x[3] ? 10 : 6 }));
  const POLICY_NAMES = { manual: 'Manual process', unchecked: 'AI without checking', reviewed: 'AI + source / exception review' };
  const FUNNEL = [{ id: 'invited', label: 'Invited', count: 12 }, { id: 'started', label: 'Started', count: 9 }, { id: 'completed', label: 'Completed task', count: 6 }, { id: 'returned', label: 'Completed another task', count: 4 }];
  const sum = xs => xs.reduce((a, x) => a + x, 0);
  const clamp = (n, min, max, fallback) => Number.isFinite(Number(n)) ? Math.max(min, Math.min(max, Number(n))) : fallback;
  const round = (n, step) => Math.round(n / step) * step;
  const median = values => { const a = [...values].sort((x, y) => x - y), middle = Math.floor(a.length / 2); return a.length % 2 ? a[middle] : (a[middle - 1] + a[middle]) / 2; };
  const fmt = (value, digits = 2) => new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
  const money = value => `${value < 0 ? '−' : ''}$${fmt(Math.abs(value))}`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const text = (value, max = 1800) => typeof value === 'string' ? value.slice(0, max) : '';

  function evidence(input = {}) {
    const tail = Math.round(clamp(input.tail ?? 31, 9, 55, 31)), includeTail = input.includeTail !== false;
    const records = WAIT_RECORDS.map((r, i) => ({ ...r, minutes: i === 7 ? tail : r.minutes, included: i !== 7 || includeTail }));
    const values = records.filter(r => r.included).map(r => r.minutes), total = sum(values);
    return { tail, includeTail, records, count: values.length, total, mean: total / values.length, median: median(values), needCount: 6, interviewed: 8, needRate: 6 / 8, pilotCount: 3, pilotRate: 3 / 8 };
  }
  function quality(input = {}) {
    const rework = Math.round(clamp(input.rework ?? 0, 0, 24, 0));
    const policies = [
      { id: 'manual', label: POLICY_NAMES.manual, minutes: sum(CASES.map(x => x.manualMinutes)), acceptable: 12, errors: 0 },
      { id: 'unchecked', label: POLICY_NAMES.unchecked, minutes: sum(CASES.map(x => x.aiMinutes)), acceptable: CASES.filter(x => !x.materialError).length, errors: CASES.filter(x => x.materialError).length },
      { id: 'reviewed', label: POLICY_NAMES.reviewed, minutes: sum(CASES.map(x => x.reviewedMinutes)) + rework, acceptable: 12, errors: 0 }
    ];
    const savedMinutes = policies[0].minutes - policies[2].minutes;
    return { rework, cases: CASES, policies, savedMinutes, percentReduction: savedMinutes / 96 * 100, capacityValue: savedMinutes / 60 * 24, demonstratedCashSaving: 0, denominator: 12, hourlyRate: 24 };
  }
  function value(input = {}) {
    const volume = round(clamp(input.volume ?? 1200, 120, 2400, 1200), 120), adoption = round(clamp(input.adoption ?? 50, 0, 100, 50), 5), rework = Math.round(clamp(input.rework ?? 0, 0, 24, 0)), toolCost = round(clamp(input.toolCost ?? 180, 0, 600, 180), 10);
    const q = quality({ rework }), assistedReplies = volume * adoption / 100, minutesPerReply = q.savedMinutes / 12, releasedMinutes = assistedReplies * minutesPerReply, hours = releasedMinutes / 60, capacityValue = hours * 24, supportCost = 60, recurringCost = toolCost + supportCost, netCapacityValue = capacityValue - recurringCost;
    const maximumCapacityValue = volume * minutesPerReply / 60 * 24;
    const breakEvenAdoption = maximumCapacityValue > 0 ? recurringCost / maximumCapacityValue * 100 : null;
    return { volume, adoption, rework, toolCost, supportCost, assistedReplies, minutesPerReply, releasedMinutes, hours, capacityValue, recurringCost, netCapacityValue, cashChange: -recurringCost, breakEvenAdoption, observationWindowDays: 14, funnel: FUNNEL.map((r, i) => ({ ...r, rate: r.count / 12, conditionalRate: i ? r.count / FUNNEL[i - 1].count : 1 })), hourlyRate: 24 };
  }
  const PRACTICE_EVIDENCE = {
    provenance: 'Original fictional Cedar Desk teaching data, not observed partner results. Discovery, processing tests, adoption cohort, and monthly planning scenario are separate datasets.',
    evidence: { waits: WAIT_RECORDS.map(x => x.minutes), total: 72, mean: 9, median: 6, count: 8, reportsNeed: '6/8 = 75%', willingToPilot: '3/8 = 37.5%', limitations: 'Eight supplied convenience observations do not establish market demand or a representative population average. Willingness to try is not a payment.' },
    quality: { cases: CASES, policies: quality().policies, denominator: 12, hourlyRate: 24, releasedMinutes: 12, reductionPercent: 12.5, capacityValue: 4.8, cashSaving: 0, reworkSixMinutes: { reviewedMinutes: 90, savedMinutes: 6, reductionPercent: 6.25, capacityValue: 2.4 }, limitations: 'Zero material errors in twelve supplied cases does not establish future safety. Added rework is a sensitivity assumption; quality counts are held fixed. Tool costs are missing from the twelve-case time comparison.' },
    value: { monthlyEligibleReplies: 1200, plannedAdoptionPercent: 50, assistedReplies: 600, releasedHours: 10, hourlyRate: 24, capacityValue: 240, toolCost: 180, supportCost: 60, recurringCost: 240, netCapacityValue: 0, cashChange: -240, breakEvenAdoptionPercent: 50, adoptionCohort: FUNNEL, observationWindowDays: 14, returnDefinition: 'Completed another task within 14 days after invitation', limitations: 'Monthly results extrapolate assumed volume and adoption; they are not observed pilot outcomes. Payroll is unchanged. Released capacity is not a demonstrated cash saving. The 12-person adoption cohort is observed for 14 days after invitation and is separate from the 12 processing cases. Returned means completed another task within that window.' }
  };

  const CONFIG = {
    evidence: { title: 'What does the discovery evidence support?', duration: '8–12 minutes', intro: 'Cedar Desk helps small workshop businesses answer customer questions. Inspect eight supplied reply waits and discovery notes before proposing a solution.', prediction: 'One reply took much longer than the rest. What do you expect?', predictions: ['The mean and median must be identical.', 'The long wait will pull the mean above the median.', 'The longest wait proves every customer has the same problem.'], predictionAnswer: 1, predictionFeedback: ['The mean uses every minute; the median uses the middle positions. They need not match.', 'That is the mechanism to inspect: one long wait changes the mean more than the middle of this dataset.', 'A serious exception matters, but it does not describe every customer. Keep the individual record and the distribution.'], decision: 'Which question would produce useful discovery evidence?', options: ['How much time would our amazing AI save you?', 'Tell me about the last customer reply that was delayed. What happened, and what did you do?', 'Would you definitely buy an AI assistant if we built one?'], feedback: ['This leads the respondent toward a benefit and assumes AI is the answer. Ask about a specific past incident and the current workaround.', 'This asks for a concrete event without prescribing AI. Follow up on frequency, consequences, and the current alternative; distinguish what was observed from what was inferred.', 'A hypothetical promise is weak evidence of purchasing behavior. Explore the actual problem, buyer, alternatives, and a realistic next commitment.'], transfer: 'For your project, write one neutral question, one baseline measure with its denominator and period, and one uncertainty that the evidence does not resolve.', takeaway: 'Use the records to describe the problem. Keep need evidence, willingness to try, and willingness to pay separate.' },
    quality: { title: 'Which process is dependable enough to test?', duration: '10–15 minutes', intro: 'Cedar Desk’s ReplyKit drafts customer replies from an approved event sheet. Compare the same twelve cases, including policy boundaries and owner handoffs. A usable answer must match the source and route decisions it cannot authorize.', prediction: 'Which process would you initially recommend, and what do you expect to check?', predictions: ['Choose the fastest draft without checking.', 'Keep the manual process because AI cannot improve it.', 'Inspect source checking and exception review before a guarded pilot.'], predictionAnswer: 2, predictionFeedback: ['Speed is relevant, but inspect the material errors before choosing.', 'The manual process is the comparison. A reviewed alternative might improve effort without lowering observed quality; the supplied results will let you check.', 'Inspect both full-process effort and quality on the same cases. A favorable small test still has limits.'], decision: 'What is the strongest recommendation from this small comparison?', options: ['Use unchecked AI because 24 minutes is fastest.', 'Reject all AI use because one policy makes mistakes.', 'Consider a bounded reviewed pilot, with an explicit quality stop rule and full-process timing.'], feedback: ['The unchecked drafts contain 3 material errors in 12 cases. The fastest process violates the quality boundary.', 'The reviewed policy avoids those errors on this supplied set and takes 84 minutes before extra rework, compared with 96 manually. That supports further investigation, not a universal claim.', 'A guarded pilot is defensible if the review capacity, source check, exception route, and cost are workable. Zero errors in 12 supplied cases does not establish safety on new cases.'], transfer: 'Define your capstone’s task, quality boundary, full-process timing, reviewer, and stop rule. State which new cases you must test next.', takeaway: 'Compare the same task and quality boundary. Count preparation, source checks, review, and rework before claiming an improvement.' },
    value: { title: 'Does useful capacity become business value?', duration: '10–15 minutes', intro: 'Use Cedar Desk’s reviewed process to inspect adoption and monthly economics. Keep the supplied pilot observations separate from the volume, cost, and adoption assumptions used for planning.', prediction: 'If the reviewed process releases time but payroll stays unchanged, what can you claim?', predictions: ['Every dollar of time value is cash saved.', 'There may be useful capacity, while software still creates a cash expense.', 'A completed task proves that all customers will adopt.'], predictionAnswer: 1, predictionFeedback: ['Valuing released time does not demonstrate a smaller payroll or another avoided expense.', 'Yes. Check the operating use for the released time, then report recurring cash expense separately.', 'Performance and adoption answer different questions. A task completion is not continued use or payment.'], decision: 'What should the sponsor hear?', options: ['The full capacity value is guaranteed cash savings.', 'The pilot proves our monthly adoption forecast.', 'Report capacity, recurring cash expense, uncertainty, and the condition for a useful pilot separately.'], feedback: ['Payroll is unchanged in this model. The cash change is the recurring spending; useful capacity has to be realized operationally.', 'The monthly scenario is a forecast from assumptions. A separate small cohort provides limited adoption evidence, not proof of the monthly rate.', 'Separate the observed task/cohort from the planning scenario. Identify a productive use of time, check an unfavorable assumption, and state a decision threshold.'], transfer: 'For your project, name the monthly volume, likely adoption, complete effort, recurring cash cost, useful destination for released time, and the assumption most likely to change your recommendation.', takeaway: 'A task can work without being adopted. Adopted use can release time without reducing cash costs. Show each link explicitly.' }
  };
  const PILOT_CONFIG = {
    title: 'What does the pilot record actually show?', duration: '8–12 minutes',
    intro: 'A supplied Cedar Desk cohort invited twelve people to try ReplyKit. During the 14 days after invitation, nine started, six completed a task, and four completed another task. These are fictional observations for critique, not your own user test.',
    prediction: 'Six of the twelve invitees completed a task. What can that result establish?',
    predictions: ['The process works for every potential user.', 'Half of this supplied cohort completed a task; the other outcomes and the observation window matter.', 'Completion proves that customers will pay.'],
    predictionAnswer: 1,
    predictionFeedback: ['The supplied cohort is small and includes nonstarters and unfinished attempts. Do not generalize beyond the observed conditions.', 'Keep the 6/12 denominator and the 14-day window. Then inspect what happened at the other stages and why.', 'Task performance, continued use, and willingness to pay are separate evidence questions.'],
    decision: 'Which statement belongs in an honest pilot record?',
    options: ['Six completions prove that the solution works for everyone.', 'Four repeat completions prove paid demand.', 'Report the 14-day counts and denominators, inspect barriers and assistance, revise, and retest.'],
    feedback: ['Six of twelve invitees completed a task. A small supplied cohort cannot establish universal usability or explain the six noncompletions.', 'Completing another task within 14 days is limited use evidence. No purchase or longer-term retention is supplied.', 'Report 9/12 started, 6/12 completed, and 4/12 completed another task within 14 days after invitation. Ask what blocked the other attempts and record assistance, quality, revision, and retest. This cohort is not a forecast.'],
    transfer: 'For your actual capstone test, specify the observation window and invited population. Record the task, assistance, completion, defect, revision, and retest without filling in an event that has not happened.',
    takeaway: 'A usable task, willingness to try, repeated use, and purchase are different findings. Keep the denominator, time window, and contrary evidence visible.'
  };
  function configFor(family, unit) { return family === 'value' && String(unit) === '7' ? PILOT_CONFIG : CONFIG[family]; }
  const CONTROLS = {
    evidence: [{ key: 'tail', label: 'Longest reply wait', min: 9, max: 55, step: 1, unit: 'minutes', initial: 31 }],
    quality: [{ key: 'rework', label: 'Extra rework across the 12 reviewed cases', min: 0, max: 24, step: 1, unit: 'minutes', initial: 0 }],
    value: [{ key: 'volume', label: 'Monthly eligible replies', min: 120, max: 2400, step: 120, unit: 'replies', initial: 1200 }, { key: 'adoption', label: 'Planned share using the process', min: 0, max: 100, step: 5, unit: '%', initial: 50 }, { key: 'rework', label: 'Extra rework per 12 assisted replies', min: 0, max: 24, step: 1, unit: 'minutes', initial: 0 }, { key: 'toolCost', label: 'Monthly tool cost', min: 0, max: 600, step: 10, unit: '$', initial: 180 }]
  };
  const calculate = (family, inputs) => ({ evidence, quality, value })[family](inputs);
  // Only an explicit commit calls this function; partial number-field input stays
  // in the field until change, focusout, or Enter. Invalid commits retain state.
  function commitNumericInput(family, current, key, raw) {
    const control = CONTROLS[family].find(c => c.key === key);
    if (!control || String(raw).trim() === '' || !Number.isFinite(Number(raw))) return { ...current };
    const result = calculate(family, { ...current, [key]: raw });
    return { ...current, [key]: result[key] };
  }
  function initialState(family) { return { version: VERSION, stage: 0, frame: 0, prediction: null, reason: '', decision: null, transfer: '', selected: null, policy: 'reviewed', caseId: 'case-1', cohortBasis: 'invited', complete: false, inputs: { ...Object.fromEntries(CONTROLS[family].map(c => [c.key, c.initial])), ...(family === 'evidence' ? { includeTail: true } : {}) } }; }
  function restoreState(family, input) {
    const state = initialState(family);
    if (!input || input.version !== VERSION || typeof input !== 'object') return state;
    const normalized = calculate(family, input.inputs && typeof input.inputs === 'object' ? input.inputs : {});
    CONTROLS[family].forEach(c => { state.inputs[c.key] = normalized[c.key]; });
    if (family === 'evidence') state.inputs.includeTail = normalized.includeTail;
    state.stage = Math.round(clamp(input.stage ?? 0, 0, 3, 0)); state.frame = Math.round(clamp(input.frame ?? 0, 0, 5, 0));
    state.prediction = Number.isInteger(input.prediction) && input.prediction >= 0 && input.prediction < 3 ? input.prediction : null;
    state.decision = Number.isInteger(input.decision) && input.decision >= 0 && input.decision < 3 ? input.decision : null;
    state.reason = text(input.reason); state.transfer = text(input.transfer); state.complete = input.complete === true;
    state.selected = text(input.selected, 40); state.policy = Object.hasOwn(POLICY_NAMES, input.policy) ? input.policy : 'reviewed';
    state.caseId = CASES.some(x => x.id === input.caseId) ? input.caseId : 'case-1';
    state.cohortBasis = input.cohortBasis === 'previous' ? 'previous' : 'invited';
    return state;
  }
  function storageKey(family, unit = '') { return `ai-solutions:v2:practice:${String(unit).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30) || 'general'}:${family}`; }
  function decisionFeedback(family, choice, inputs, unit = '') {
    const config = configFor(family, unit);
    if (!Number.isInteger(choice) || !config.feedback[choice]) return 'Choose a recommendation to see its consequences.';
    let result = config.feedback[choice];
    if (family === 'value' && String(unit) === '7') return result;
    if (family === 'quality' && choice === 2) { const r = quality(inputs); result += r.savedMinutes > 0 ? ` At your setting, reviewed effort is ${96 - r.savedMinutes} minutes, releasing ${fmt(r.savedMinutes)} minutes (${fmt(r.percentReduction)}%). Tool cost remains uncounted.` : r.savedMinutes === 0 ? ' At your setting, review and rework remove the time advantage entirely. A pilot needs another justified benefit or a revised process.' : ` At your setting, review and rework require ${fmt(-r.savedMinutes)} minutes more than the manual comparison. Revise or justify a different benefit before scaling.`; }
    if (family === 'value' && choice === 2) { const r = value(inputs); result += ` Your scenario gives ${money(r.netCapacityValue)} monthly net capacity value and ${money(r.cashChange)} recurring cash change. `; result += r.breakEvenAdoption === null || r.breakEvenAdoption > 100 ? 'No feasible adoption share covers the recurring cost under these time assumptions.' : `Break-even capacity value requires ${fmt(r.breakEvenAdoption)}% adoption, with the other assumptions fixed; that is a requirement, not observed demand.`; }
    return result;
  }

  function row(id, label, amount, note = '', role = 'reference') { return { id, label, amount, note, role }; }
  function baseVisualModel(family, state, unit) {
    const r = calculate(family, state.inputs), frame = Math.min(state.frame, family === 'quality' && unit === '4' ? 5 : 3);
    if (family === 'evidence') {
      const captions = ['Inspect each reply before summarizing it. The horizontal scale stays at 0–60 minutes.', 'The total adds the included waits; the mean divides that total by the included reply count.', 'The median uses the middle positions. Changing the longest wait does not move those positions here.', 'Discovery reports are different from purchase evidence. Always show the denominator and the sample limitation.'];
      const rows = frame === 3 ? [row('need', 'Reported repeated delay', 75, '6 of 8 people interviewed. This is need evidence.', 'reference'), row('pilot', 'Willing to try a pilot', 37.5, '3 of 8 people interviewed. Their overlap with the six reporting need is not supplied. Not a payment.', 'uncertainty')] : r.records.map(x => ({ ...row(x.id, x.label, x.minutes, x.included ? (x.id === 'wait-8' && r.tail !== 31 ? 'Changed scenario assumption; original supplied wait was 31 minutes.' : 'Supplied fictional wait; not a measured partner result.') : 'Excluded by your scenario; no evidence has established that this record is invalid.', x.id === 'wait-8' ? 'uncertainty' : 'reference'), excluded: !x.included }));
      return { title: ['See the individual records', 'Add waits; name the denominator', 'Compare mean and median', 'Separate need from adoption'][frame], caption: captions[frame], rows, unit: frame === 3 ? '% of 8 interviewed people' : 'minutes waited for a reply', domain: frame === 3 ? [0, 100] : [0, 60], markers: frame === 1 ? [{ value: r.mean, label: 'Mean', role: 'structure' }] : frame === 2 ? [{ value: r.mean, label: 'Mean', role: 'structure' }, { value: r.median, label: 'Median', role: 'uncertainty' }] : [], metrics: [['Included replies', `${r.count} of 8`], ['Total waiting time', `${fmt(r.total)} min`], ['Mean / median', `${fmt(r.mean)} / ${fmt(r.median)} min`]], limit: !r.includeTail ? 'Excluding the longest reply changes the population summarized. Do not remove an inconvenient observation without a defensible reason.' : 'Eight supplied observations are a starting point for questions; they do not establish a representative market average.' };
    }
    if (family === 'quality' && unit === '4') {
      const record = CASES.find(x => x.id === state.caseId), unchecked = state.policy === 'unchecked';
      const stages = [
        ['input', 'Intake', `Customer asks about: ${record.request.toLowerCase()}.`, 'reference'],
        ['sources', 'Approved source', record.fact, 'reference'],
        ['draft', 'AI draft', record.draft, record.materialError ? 'error' : 'uncertainty'],
        ['check', 'Human check', unchecked ? 'This policy skips the source and authority check.' : record.materialError ? 'The draft contradicts the approved fact or promises an unauthorized action.' : 'The reviewer verifies the draft against the approved fact.', unchecked ? 'error' : 'uncertainty'],
        ['exception', 'Exception route', unchecked ? 'No actual owner handoff is established by this unchecked-draft policy.' : record.requiresOwnerReview ? 'Prepare the owner handoff; only the owner may authorize the exception.' : 'No owner exception is needed for this input; ordinary processing still belongs to the coordinator.', unchecked && record.materialError ? 'error' : 'uncertainty'],
        ['delivery', 'Delivery outcome', unchecked ? record.materialError ? 'A material error reaches the customer in this supplied case.' : 'This unchecked draft happens to be acceptable on the supplied case, but no source check was performed and no external action is established.' : record.requiresOwnerReview ? record.materialError ? 'A bounded reply explains that the owner must decide; the unsupported promise is removed.' : 'The bounded reply retains the required owner handoff; no exception has been authorized by the draft.' : 'The source-checked reply can be delivered. Any booking or refund action still requires an authorized person.', unchecked && record.materialError ? 'error' : 'reference']
      ];
      return { title: 'Trace one input through the workflow', caption: 'The highlighted position shows the current operation. This is a fixed workflow; AI is not authorized to make the business decision.', workflow: true, rows: stages.map((x, i) => ({ id: x[0], label: x[1], amount: i + 1, note: x[2], role: x[3], revealed: i <= frame })), frame, unit: 'workflow order, not measured time', domain: [0, 6], metrics: [['Selected case', record.label], ['Input type', record.materialError ? 'Material error to correct' : 'Acceptable draft'], ['Delivery boundary', 'Source + authority check']], limit: 'This trace is a teaching example. A real workflow must specify its source owner, reviewer, allowed actions, exception route, and fallback.' };
    }
    if (family === 'quality') {
      const visible = frame === 0 ? 1 : frame === 1 ? 2 : 3;
      const policies = r.policies.slice(0, visible).map(p => ({ ...p, minutes: p.id === 'reviewed' && frame === 2 ? 84 : p.minutes }));
      return { title: ['Start with the same manual cases', 'Reveal speed and errors together', 'Add source checking and exception review', 'Stress the full-process estimate'][frame], caption: ['Twelve acceptable manual replies take 96 minutes, including preparation, checking, and rework.', 'Unchecked AI takes 24 minutes, but three of the same twelve cases contain material errors.', 'Reviewed AI takes 84 minutes on this supplied set and produces twelve acceptable replies. Zero errors here does not prove future safety.', 'Extra rework is a hypothetical sensitivity change. At six extra minutes, reviewed effort becomes 90 minutes: a 6.25% reduction from 96.'][frame], rows: policies.map(p => ({ ...row(p.id, p.label, p.minutes, `${p.acceptable}/12 acceptable final replies; ${p.errors} material errors.`, p.errors ? 'error' : p.id === 'reviewed' ? 'uncertainty' : 'reference'), acceptable: p.acceptable, errors: p.errors })), unit: 'total minutes for the same 12 cases', domain: [0, 120], metrics: [['Reviewed total at your setting', `${84 + r.rework} min`], ['Time released vs manual', `${fmt(r.savedMinutes)} min · ${fmt(r.percentReduction)}%`], ['Capacity value at $24/hour', money(r.capacityValue)]], limit: 'Unchanged payroll means no demonstrated cash saving. Tool costs remain a separate missing input. Added rework changes time, while the supplied quality counts are held fixed.' };
    }
    if (unit === '7') {
      const prior = state.cohortBasis === 'previous';
      const counts = FUNNEL.map(x => row(x.id, x.label, x.count, `${x.count}/12 invited people, observed for 14 days after invitation. Returned means completed another task within that window.`, x.id === 'returned' ? 'uncertainty' : 'reference'));
      const rates = r.funnel.slice(1).map((x, i) => row(x.id, x.label, (prior ? x.conditionalRate : x.rate) * 100, `${x.count}/${prior ? FUNNEL[i].count : 12} ${prior ? 'people in the preceding stage' : 'invited people'}; 14 days after invitation.`, 'reference'));
      const outcomes = [row('not-started', 'Did not start', 3, '12 invited minus 9 started. Reason is not supplied.', 'uncertainty'), row('unfinished', 'Started; did not complete', 3, '9 started minus 6 completed. Record barriers and assistance before attributing cause.', 'uncertainty'), row('one-task', 'Completed only one task', 2, '6 completed minus 4 who completed another task within the window.', 'reference'), row('another-task', 'Completed another task', 4, 'Repeated completion within 14 days; not a purchase or proof of long-term retention.', 'reference')];
      return { title: ['Inspect the observed stage counts', 'Change the denominator, not the evidence', 'Account for every invited person', 'Choose the next useful observation'][frame], caption: [
        'A 14-day window starts at invitation. The stages are nested; adding 12 + 9 + 6 + 4 would double-count people.',
        prior ? 'Each percentage now uses the preceding stage as its denominator. Six of nine starters completed a task; this is different from six of twelve invitees.' : 'Each percentage uses the same twelve invited people. Changing the denominator can change the claim without changing anyone’s behavior.',
        'These four groups are mutually exclusive and sum to twelve. Reasons for noncompletion are not supplied; do not invent them.',
        'Observe barriers, assistance, and quality, then revise and retest. No monthly volume, paid demand, or cash result is established by this cohort.'
      ][frame], rows: frame === 1 ? rates : frame === 2 ? outcomes : counts, unit: frame === 1 ? prior ? '% of the labeled preceding stage' : '% of 12 invited people' : 'people within 14 days after invitation', domain: frame === 1 ? [0, 100] : [0, 12], metrics: [['Completed a task', '6 / 12 invited'], ['Completed another task', '4 / 12 invited'], ['Observation window', '14 days after invitation']], limit: 'This is a supplied fictional cohort, separate from the twelve processing cases. A real user-task record must identify what actually happened, including assistance and failed attempts.' };
    }
    if (frame === 0) return { title: 'Keep the adoption cohort separate', caption: 'These twelve invited people were observed for 14 days after invitation. They are a different dataset from the twelve reply-processing cases. A stage count is not a sale.', rows: r.funnel.map(x => row(x.id, x.label, x.rate * 100, `${x.count}/12 invitees within 14 days; ${fmt(x.conditionalRate * 100)}% of the preceding stage. Returned means completed another task in that window.`, x.id === 'returned' ? 'uncertainty' : 'reference')), unit: '% of 12 invited people', domain: [0, 100], metrics: [['Completed the task', '6 / 12'], ['Completed another task in 14 days', '4 / 12'], ['Planning adoption assumption', `${r.adoption}%`]], limit: 'The planning adoption percentage is an assumption. Do not present the supplied small cohort as proof of the monthly forecast.' };
    if (frame === 1) return { title: 'Count the complete process first', caption: 'Apply the same manual and reviewed comparison. Extra rework belongs in the assisted process before scaling it to a month.', rows: [row('manual', 'Manual process', 96, 'Twelve acceptable final replies.', 'reference'), row('reviewed', 'Reviewed AI + extra rework', 84 + r.rework, 'Twelve acceptable final replies in the supplied test; quality is held fixed in this scenario.', 'uncertainty')], unit: 'minutes for 12 replies', domain: [0, 120], metrics: [['Time released per assisted reply', `${fmt(r.minutesPerReply)} min`], ['Assisted replies per month', fmt(r.assistedReplies)], ['Monthly capacity released', `${fmt(r.hours)} hours`]], limit: 'A negative time difference means the new process consumes more capacity. Repeated monthly performance has not been observed.' };
    if (frame === 2) return { title: 'Translate use into useful capacity', caption: `${fmt(r.volume)} eligible replies × ${r.adoption}% planned adoption = ${fmt(r.assistedReplies)} assisted replies. Multiply by ${fmt(r.minutesPerReply)} minute per reply, then divide by 60.`, rows: [row('eligible', 'If every eligible reply used it', r.volume * r.minutesPerReply / 60, 'An upper-use scenario, not observed adoption.', 'uncertainty'), row('adopted', 'At the planned adoption share', r.hours, 'Capacity can be useful only if work is reassigned or a queue is reduced.', 'reference')], unit: 'hours released per month', domain: [-40, 40], metrics: [['Planned assisted replies', fmt(r.assistedReplies)], ['Released capacity', `${fmt(r.hours)} hours`], ['Capacity valued at $24/hour', money(r.capacityValue)]], limit: 'Valuing released hours does not demonstrate a reduction in payroll or another cash expense.' };
    return { title: 'Separate value from cash', caption: 'This monthly bridge values capacity and subtracts recurring tools and support. The cash column assumes unchanged payroll; there is no proven avoided expense.', rows: [row('capacity', 'Released capacity value', r.capacityValue, `${fmt(r.hours)} hours × $24/hour.`, r.capacityValue < 0 ? 'error' : 'reference'), row('tools', 'Tool cost', -r.toolCost, 'Monthly recurring cash expense.', 'error'), row('support', 'Support / maintenance', -r.supportCost, 'Fixed $60 monthly cash expense in this model.', 'error'), row('net', 'Net capacity value', r.netCapacityValue, 'A capacity-based comparison, not cash flow.', r.netCapacityValue < 0 ? 'error' : 'reference'), row('cash', 'Recurring cash change', r.cashChange, 'No payroll reduction or other avoided cash expense has been established.', 'error')], unit: '$ per month', domain: [-1800, 1000], metrics: [['Net capacity value', money(r.netCapacityValue)], ['Recurring cash change', money(r.cashChange)], ['Adoption needed to cover costs', r.breakEvenAdoption === null || r.breakEvenAdoption > 100 ? 'Not feasible at these inputs' : `${fmt(r.breakEvenAdoption)}%`]], limit: 'Costs for setup, financing, and unexpected incidents are not included. Break-even is a conditional requirement, not an adoption forecast.' };
  }

  // Visual models keep the same calculations and add explicit relationships between views.
  function distributionData(result) {
    const sorted = result.records.filter(r => r.included).sort((a, b) => a.minutes - b.minutes || a.id.localeCompare(b.id));
    const middle = Math.floor(sorted.length / 2);
    const middleIds = sorted.length % 2 ? [sorted[middle].id] : [sorted[middle - 1].id, sorted[middle].id];
    return { records: result.records, sorted, middleIds, mean: result.mean, median: result.median, total: result.total, count: result.count, originalMean: evidence({ includeTail: result.includeTail }).mean };
  }
  function dotPositions(records, width) {
    const left = 27, right = width - 22, radius = 9, lanes = [];
    return [...records].sort((a, b) => a.minutes - b.minutes || a.id.localeCompare(b.id)).map(r => {
      const x = left + r.minutes / 60 * (right - left);
      let lane = 0;
      while (lanes[lane]?.some(other => Math.abs(other - x) < radius * 2 + 4)) lane++;
      (lanes[lane] ||= []).push(x);
      return { ...r, x, y: 220 - lane * 24, radius, lane };
    });
  }
  function qualityVisualData(result, ids, includeRework, target = true) {
    const visible = new Set(ids);
    const policies = result.policies.map(p => ({ ...p, visible: visible.has(p.id), minutes: p.id === 'reviewed' && !includeRework ? 84 : p.minutes, baseMinutes: p.id === 'reviewed' ? 84 : p.minutes, extraMinutes: p.id === 'reviewed' && includeRework ? result.rework : 0 }));
    return { policies, cases: CASES, targetMinutes: target ? 96 * .9 : null, targetReduction: target ? 10 : null, includeRework };
  }
  function cohortData(basis, mutuallyExclusive = false) {
    const groups = [{ id: 'not-started', count: 3, label: 'Did not start', start: 9, role: 'muted' }, { id: 'unfinished', count: 3, label: 'Started; unfinished', start: 6, role: 'uncertainty' }, { id: 'one-task', count: 2, label: 'One task only', start: 4, role: 'outline' }, { id: 'another-task', count: 4, label: 'Another task', start: 0, role: 'reference' }];
    return { basis, mutuallyExclusive, groups, windowDays: 14, stages: FUNNEL.map((f, i) => ({ ...f, denominator: basis === 'previous' && i > 0 ? FUNNEL[i - 1].count : 12, rate: f.count / (basis === 'previous' && i > 0 ? FUNNEL[i - 1].count : 12) * 100 })) };
  }
  function valueVisualData(result) {
    const curve = Array.from({ length: 21 }, (_, i) => { const adoption = i * 5; return { adoption, net: result.volume * adoption / 100 * result.minutesPerReply / 60 * 24 - result.recurringCost }; });
    const segments = [
      { id: 'capacity', label: 'Capacity value', start: 0, end: result.capacityValue, change: result.capacityValue },
      { id: 'tools', label: 'Tools', start: result.capacityValue, end: result.capacityValue - result.toolCost, change: -result.toolCost },
      { id: 'support', label: 'Support', start: result.capacityValue - result.toolCost, end: result.netCapacityValue, change: -result.supportCost },
      { id: 'net', label: 'Net value', start: 0, end: result.netCapacityValue, change: result.netCapacityValue, total: true }
    ];
    // The scale covers the full 0–100% adoption curve, so moving adoption alone
    // never rescales the bridge or the curve. Other cost/effort changes are disclosed.
    const maximumCapacity = result.volume * result.minutesPerReply / 60 * 24;
    const all = [0, maximumCapacity, result.cashChange, ...curve.map(x => x.net), ...segments.flatMap(x => [x.start, x.end])];
    let low = Math.floor(Math.min(...all) / 100) * 100, high = Math.ceil(Math.max(...all) / 100) * 100;
    if (low === high) high = low + 200;
    if (high - low < 200) high = low + 200;
    return { ...result, curve, segments, dollarDomain: [low, high], breakEvenVisible: result.breakEvenAdoption !== null && result.breakEvenAdoption >= 0 && result.breakEvenAdoption <= 100 };
  }
  function visualModel(family, state, unit) {
    const model = baseVisualModel(family, state, unit), result = calculate(family, state.inputs), frame = state.frame;
    model.frame = frame;
    model.linkedRecords = [];
    if (family === 'evidence') {
      model.kind = frame < 3 ? 'distribution' : 'discovery-counts';
      model.distribution = distributionData(result);
      model.legend = frame < 3 ? [['reference', 'One dot = one supplied reply wait'], ['uncertainty', 'Longest wait / scenario change'], ['outline', 'Original position or excluded record'], ['selected', 'Selected record']] : [['reference', 'Reported repeated delay'], ['uncertainty', 'Willing to try; not a purchase'], ['outline', 'Others in the same denominator']];
      if (frame === 3) model.metrics = [['Interview records', '8'], ['Reported repeated delay', '6 / 8 · 75%'], ['Willing to try a pilot', '3 / 8 · 37.5%']];
      model.caption = frame === 0 ? 'Each numbered dot is one reply wait. Nearby dots stack vertically to keep every record visible; vertical position is not a second variable.' : frame === 1 ? 'The mean is the total of the included waits divided by their count. Move the longest wait and follow the same record, total, and mean.' : frame === 2 ? 'Order the included waits. The middle positions define the median; the mean still uses every included minute. Both reference lines use the same 0–60-minute axis.' : model.caption;
    } else if (family === 'quality' && unit === '4') {
      model.kind = 'workflow'; model.case = CASES.find(c => c.id === state.caseId); model.unchecked = state.policy === 'unchecked';
      model.legend = [['structure', 'Arrow = required handoff'], ['uncertainty', 'Human review or decision'], ['error', 'Unsupported draft / bypass'], ['selected', 'Current or selected step']];
      model.currentDetail = model.rows[Math.min(5, frame)].id;
    } else if (family === 'quality') {
      model.kind = 'quality'; model.quality = qualityVisualData(result, model.rows.map(x => x.id), frame === 3);
      const shown = model.quality.policies[frame === 0 ? 0 : frame === 1 ? 1 : 2];
      model.metrics = frame < 2 ? [['Policy shown', shown.id === 'manual' ? 'Manual reference' : 'Unchecked AI'], ['Full-process effort', `${shown.minutes} min`], ['Quality on the supplied cases', `${shown.acceptable}/12 acceptable · ${shown.errors} errors`]] : [['Reviewed total at this step', `${shown.minutes} min`], ['Time released vs manual', `${fmt(96 - shown.minutes)} min · ${fmt((96 - shown.minutes) / 96 * 100)}%`], ['Capacity value at $24/hour', money((96 - shown.minutes) / 60 * 24)]];
      model.linkedRecords = CASES.map(c => ({ id: c.id, label: `${c.label} · ${c.request}`, amount: c.materialError ? 1 : 0, note: `${c.materialError ? 'The unchecked draft has a material error; the reviewed reply corrects or hands it off.' : 'The supplied draft is acceptable on this case.'} Manual ${c.manualMinutes} min; draft-only ${c.aiMinutes} min; reviewed baseline ${c.reviewedMinutes} min. Extra scenario rework is a cohort total, not assigned to this case.`, case: c }));
      model.legend = [['reference', '✓ Acceptable reply'], ['error', '× Material error'], ['hatched', 'Extra rework assumption'], ['selected', 'Selected policy or same case across policies']];
    } else if (unit === '7' || frame === 0) {
      model.kind = 'cohort'; model.cohort = cohortData(unit === '7' ? state.cohortBasis : 'invited', unit === '7' && frame === 2);
      model.legend = [['reference', 'Reached the named stage'], ['outline', 'In the denominator; did not reach it'], ['muted', 'Outside this denominator'], ['selected', 'Chosen denominator / selected group']];
      model.linkedRecords = model.cohort.stages.filter(c => !model.rows.some(r => r.id === c.id)).map(c => ({ id: c.id, label: c.label, amount: c.count, note: `${c.count}/${c.denominator} = ${fmt(c.rate)}%; 14 days after invitation.` }));
    } else if (frame === 1) {
      model.kind = 'time-comparison'; model.quality = qualityVisualData(quality(state.inputs), model.rows.map(x => x.id), true, false);
      model.legend = [['reference', 'Full process before added rework'], ['hatched', 'Additional rework assumption'], ['selected', 'Selected process']];
    } else if (frame === 2) {
      model.kind = 'capacity'; model.value = valueVisualData(result);
      model.displayRows = [row('monthly-volume', 'Eligible monthly replies', result.volume, 'Planning volume; not a measured monthly total.', 'uncertainty'), row('assisted-count', 'Replies using the process', result.assistedReplies, `${result.adoption}% of eligible monthly replies.`, 'uncertainty'), row('released-hours', 'Capacity released per month', result.hours, `${fmt(result.assistedReplies)} replies × ${fmt(result.minutesPerReply)} minute ÷ 60.`, 'reference')].map((r, i) => ({ ...r, valueUnit: i === 2 ? 'hours / month' : 'replies / month' }));
      model.linkedRecords = model.displayRows;
      model.legend = [['uncertainty', 'Planning assumption'], ['reference', 'Calculated capacity'], ['selected', 'Selected quantity']];
    } else {
      model.kind = 'value-bridge'; model.value = valueVisualData(result);
      model.linkedRecords = model.value.curve.map(p => ({ id: `adoption-${p.adoption}`, label: `${p.adoption}% adoption scenario`, amount: p.net, note: `${money(p.net)} monthly net capacity value. Recurring cash change stays ${money(result.cashChange)} because payroll is unchanged. This is a hypothetical scenario, not observed use.`, curvePoint: p }));
      model.legend = [['reference', 'Capacity value / modeled net value'], ['error', 'Recurring cost or cash loss'], ['outline', 'Dashed line = cash change or break-even guide'], ['selected', 'Your current scenario / selected result']];
    }
    return model;
  }
  const svgText = (value, x, y, attributes = '') => `<text x="${x}" y="${y}" ${attributes}>${esc(value)}</text>`;
  function wrappedText(value, x, y, maxCharacters, attributes = '') {
    const words = String(value).split(' '), lines = []; let line = '';
    words.forEach(word => { if (line && `${line} ${word}`.length > maxCharacters) { lines.push(line); line = word; } else line += `${line ? ' ' : ''}${word}`; }); if (line) lines.push(line);
    return `<text x="${x}" y="${y}" ${attributes}>${lines.map((part, i) => `<tspan x="${x}" dy="${i ? 16 : 0}">${esc(part)}</tspan>`).join('')}</text>`;
  }
  const svgStart = (width, height, prefix, title, description) => `<svg data-key="${prefix}" viewBox="0 0 ${width} ${height}" role="group" aria-labelledby="${prefix}-title ${prefix}-desc"><title id="${prefix}-title">${esc(title)}</title><desc id="${prefix}-desc">${esc(description)}</desc>`;
  function interactiveMark(id, label, content, classes = '', extra = '', focusable = true) {
    return `<g data-key="record-${esc(id)}${extra.includes('data-policy-id') ? extra.match(/data-policy-id="([^"]+)"/)?.[1] || '' : ''}" data-record="${esc(id)}" class="practice-linked ${classes}" role="button" tabindex="${focusable ? 0 : -1}" aria-label="${esc(label)}" aria-pressed="false" ${extra}>${content}</g>`;
  }
  const figureHeader = (title, instruction) => `<div class="practice-figure-explanation"><h5>${esc(title)}</h5><p>${esc(instruction)}</p></div>`;
  function distributionChart(model, prefix, width) {
    const d = model.distribution, dots = dotPositions(d.records, width), x = v => 27 + v / 60 * (width - 49), axis = 252;
    let plot = svgStart(width, 304, `${prefix}-distribution`, 'Individual reply waits on a common scale', 'Each numbered dot is a supplied reply. Stacking prevents overlap. Horizontal position is minutes waited, from zero to sixty.');
    plot += [0, 10, 20, 30, 40, 50, 60].map(v => `<g class="practice-viz-grid">${svgText(v, x(v), axis + 22, 'text-anchor="middle"')}<line x1="${x(v)}" x2="${x(v)}" y1="55" y2="${axis}"/></g>`).join('');
    plot += `<line class="practice-viz-axis" x1="${x(0)}" x2="${x(60)}" y1="${axis}" y2="${axis}"/>${svgText('Minutes waited for a reply', width / 2, 298, 'text-anchor="middle" class="practice-viz-axis-label"')}`;
    if (d.records[7].minutes !== 31) plot += `<g data-key="original-tail" class="practice-ghost">${svgText('Original 31', x(31), 75, 'text-anchor="middle"')}<line x1="${x(31)}" x2="${x(d.records[7].minutes)}" y1="90" y2="90"/><circle cx="${x(31)}" cy="90" r="7"/></g>`;
    plot += dots.map(r => interactiveMark(r.id, `${r.label}: ${r.minutes} minutes${r.included ? '' : ', excluded from summary'}`, `<circle r="10" class="practice-fill-${r.id === 'wait-8' ? 'uncertainty' : 'reference'} ${r.included ? '' : 'practice-excluded-dot'}"/>${svgText(r.id.split('-')[1], 0, 4, 'text-anchor="middle" class="practice-dot-number"')}`, 'practice-moving-dot', `style="transform:translate(${r.x}px,${r.y}px)"`)).join('');
    if (model.frame >= 1) plot += `<g data-key="mean-marker" class="practice-moving-marker" style="transform:translate(${x(d.mean)}px,0px)"><line class="practice-mean-line" x1="0" x2="0" y1="35" y2="${axis}"/>${svgText(`Mean ${fmt(d.mean)}`, 4, 23, 'class="practice-marker-label"')}</g>`;
    if (model.frame >= 2) plot += `<g data-key="median-marker" class="practice-moving-marker" style="transform:translate(${x(d.median)}px,0px)"><line class="practice-median-line" x1="0" x2="0" y1="52" y2="${axis}"/>${svgText(`Median ${fmt(d.median)}`, 4, 45, 'class="practice-marker-label"')}</g>`;
    plot += '</svg>';
    const cell = Math.min(58, (width - 20) / d.sorted.length), stripWidth = cell * d.sorted.length, start = (width - stripWidth) / 2;
    let ordered = svgStart(width, 94, `${prefix}-ordered`, 'Ordered included waits', 'The highlighted middle positions identify the median. Each box links to the same numbered record in the dot plot and table.');
    ordered += d.sorted.map((r, i) => interactiveMark(r.id, `${r.label}, ordered position ${i + 1}, ${r.minutes} minutes${d.middleIds.includes(r.id) ? ', middle position' : ''}`, `<rect x="${start + i * cell + 2}" y="10" width="${cell - 4}" height="48" rx="5" class="${d.middleIds.includes(r.id) && model.frame >= 2 ? 'practice-middle-cell' : 'practice-ordered-cell'}"/>${svgText(r.minutes, start + (i + .5) * cell, 30, 'text-anchor="middle" class="practice-ordered-value"')}${svgText(`#${r.id.split('-')[1]}`, start + (i + .5) * cell, 48, 'text-anchor="middle" class="practice-viz-small"')}`)).join('');
    ordered += svgText(model.frame >= 2 ? `Middle ${d.middleIds.length === 2 ? 'two waits' : 'wait'} → median ${fmt(d.median)} min` : 'Included waits · shortest to longest', width / 2, 82, 'text-anchor="middle" class="practice-viz-axis-label"') + '</svg>';
    return `<div class="practice-specialized">${figureHeader('Follow one record; inspect the summary', 'Select a numbered dot, an ordered wait, or a table row. Every view refers to the same record.')}${plot}<div class="practice-equation" data-key="mean-equation"><span>Total ${fmt(d.total)} minutes</span><span aria-hidden="true">÷</span><span>${d.count} included replies</span><span aria-hidden="true">=</span><strong>Mean ${fmt(d.mean)} minutes</strong></div>${model.frame >= 1 ? `<p class="practice-visual-insight">${model.distribution.records[7].included ? `Changing the longest wait from 31 to ${d.records[7].minutes} adds ${d.records[7].minutes - 31} minutes to the total and ${fmt(d.mean - d.originalMean)} minutes to the mean.` : 'The excluded record remains visible as an outline. The summary now describes seven replies, not all eight.'}</p>` : ''}${model.frame >= 2 ? ordered : ''}</div>`;
  }
  function discoveryCountChart(model, prefix, width) {
    const cells = [6, 3], x0 = 22, gap = (width - 44) / 8;
    let svg = svgStart(width, 238, `${prefix}-discovery-counts`, 'Two separate discovery counts', 'Each row uses eight interviewed people. The overlap between the six reporting need and the three willing to try is not supplied.');
    model.rows.forEach((r, k) => { const y = 55 + k * 104;
      svg += interactiveMark(r.id, `${r.label}: ${cells[k]} of eight, ${fmt(r.amount)} percent`, `${wrappedText(r.label, 18, y - 26, Math.max(18, Math.floor((width - 110) / 7)), 'class="practice-viz-label"')}${svgText(`${cells[k]}/8 · ${fmt(r.amount)}%`, width - 18, y - 26, 'text-anchor="end" class="practice-viz-value"')}${Array.from({ length: 8 }, (_, i) => `<circle cx="${x0 + (i + .5) * gap}" cy="${y + 11}" r="${Math.min(13, gap * .34)}" class="${i < cells[k] ? `practice-fill-${r.role}` : 'practice-empty-count'}"/>`).join('')}`);
    });
    svg += svgText('1 circle = 1 interview record · n = 8', width / 2, 222, 'text-anchor="middle" class="practice-viz-axis-label"') + '</svg>';
    return `<div class="practice-specialized">${figureHeader('Same denominator; different evidence', 'These are two independent counts. Their overlap is unknown, so they are not a funnel.')}${svg}<p class="practice-visual-insight">6/8 describes reported need. 3/8 describes willingness to try. Neither establishes a purchase, and the supplied counts do not establish 3/6.</p></div>`;
  }
  function workflowChart(model, prefix, width) {
    const gap = 18, padding = 12, box = (width - padding * 2 - gap) / 2, left = padding, right = padding + box + gap, height = 520;
    const positions = { input: [left, 56], sources: [right, 56], draft: [left, 178], check: [right, 178], exception: [right, 300], delivery: [left, 422] };
    const labels = { input: ['1 · Intake', 'Request'], sources: ['2 · Source', model.case.sources], draft: ['3 · AI draft', model.case.materialError ? 'Unsupported promise' : 'Source-grounded draft'], check: ['4 · Check', model.unchecked ? 'Skipped by policy' : 'Verify claim + authority'], exception: ['5 · Owner', model.unchecked ? 'No handoff verified' : model.case.requiresOwnerReview ? 'Prepare exception' : 'Routine process'], delivery: ['6 · Delivery', model.unchecked ? model.case.materialError ? 'Material error' : 'Unchecked reply' : model.case.requiresOwnerReview ? 'Owner handoff reply' : 'Checked reply'] };
    const edges = [['input', 'sources'], ['sources', 'draft'], ['draft', 'check'], ['check', 'exception'], ['exception', 'delivery']];
    let svg = svgStart(width, height, `${prefix}-workflow`, 'Connected AI and human workflow', 'Arrows show handoffs, not elapsed time. Drafting does not grant authority to decide an exception. A dashed red bypass shows the unchecked policy.');
    svg += `<defs><marker id="${prefix}-flow-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs><rect class="practice-flow-lane" x="${left - 4}" y="35" width="${box + 8}" height="470" rx="9"/><rect class="practice-flow-lane human" x="${right - 4}" y="35" width="${box + 8}" height="470" rx="9"/>${svgText('Information + AI', left + box / 2, 22, 'text-anchor="middle" class="practice-lane-title"')}${svgText('Human authority', right + box / 2, 22, 'text-anchor="middle" class="practice-lane-title"')}`;
    edges.forEach(([a, b], i) => { const [ax, ay] = positions[a], [bx, by] = positions[b], sameRow = ay === by, sx = sameRow ? ax + box : ax + box / 2, sy = sameRow ? ay + 38 : ay + 76, ex = sameRow ? bx - 4 : bx + box / 2, ey = sameRow ? by + 38 : by - 5; const skipped = model.unchecked && i >= 2;
      svg += `<path data-key="edge-${a}-${b}" class="practice-flow-edge ${i < model.frame ? 'is-traced' : ''} ${skipped ? 'is-skipped' : ''}" d="M ${sx} ${sy} ${sameRow ? `L ${ex} ${ey}` : `C ${sx} ${sy + 20}, ${ex} ${ey - 20}, ${ex} ${ey}`}" marker-end="url(#${prefix}-flow-arrow)"/>`;
    });
    if (model.unchecked) svg += `<path class="practice-flow-bypass" d="M ${left + box / 2} 254 L ${left + box / 2} 412" marker-end="url(#${prefix}-flow-arrow)"/>${wrappedText('Bypass: unchecked draft', left + 10, 325, Math.max(12, Math.floor((box - 20) / 7)), 'class="practice-bypass-label"')}`;
    model.rows.forEach((r, i) => { const [x, y] = positions[r.id], skipped = model.unchecked && (r.id === 'check' || r.id === 'exception');
      svg += interactiveMark(r.id, `${r.label}. ${r.note}`, `<rect x="${x}" y="${y}" width="${box}" height="76" rx="8" class="practice-flow-box ${i === model.frame ? 'is-current' : ''} ${r.role === 'error' ? 'has-error' : ''} ${skipped ? 'is-skipped' : ''}"/>${wrappedText(labels[r.id][0], x + 10, y + 23, Math.floor((box - 20) / 7), 'class="practice-flow-title"')}${wrappedText(labels[r.id][1], x + 10, y + 48, Math.max(12, Math.floor((box - 20) / 7)), 'class="practice-flow-caption"')}`, i > model.frame ? 'practice-unrevealed' : '');
    });
    const position = positions[model.rows[model.unchecked && model.frame >= 3 && model.frame < 5 ? 2 : model.frame].id];
    svg += `<g data-key="case-token" class="practice-flow-token" style="transform:translate(${position[0] + box - 10}px,${position[1] - 5}px)"><circle r="9"/>${svgText('•', 0, 4, 'text-anchor="middle"')}</g></svg>`;
    return `<div class="practice-specialized">${figureHeader(`${model.case.label}: ${model.case.request}`, 'Follow the case marker. Select a step to see its exact responsibility; a source check and an owner decision are different operations.')}${svg}<div class="practice-source-pair"><section><h5>Approved source · ${esc(model.case.sources)}</h5><p>${esc(model.case.fact)}</p></section><section class="${model.case.materialError ? 'has-error' : ''}"><h5>Supplied AI draft</h5><p>${esc(model.case.draft)}</p><strong>${model.case.materialError ? 'Contains an unsupported commitment' : 'Acceptable on this supplied case'}</strong></section></div><p class="practice-visual-insight">${esc(model.rows[model.frame].note)}</p></div>`;
  }
  function qualityTimeChart(model, prefix, width) {
    const q = model.quality, rows = q.policies.filter(p => model.kind === 'quality' || p.visible), left = 26, right = width - 25, scale = n => left + n / 120 * (right - left), height = 66 + rows.length * 90, axis = height - 31;
    let svg = svgStart(width, height, `${prefix}-time`, 'Full-process effort on the same twelve cases', 'Bars include preparation, checking, and rework. The striped extension is extra assumed rework. The horizontal axis is fixed from zero to one hundred twenty minutes.');
    svg += `<defs><pattern id="${prefix}-rework" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#fff3d8"/><path d="M -2 2 L 2 -2 M 0 7 L 7 0 M 5 9 L 9 5" stroke="#9b650f" stroke-width="1.5"/></pattern></defs>`;
    [0, 24, 48, 72, 96, 120].forEach(n => { svg += `<g class="practice-viz-grid"><line x1="${scale(n)}" x2="${scale(n)}" y1="28" y2="${axis}"/>${svgText(n, scale(n), axis + 18, 'text-anchor="middle"')}</g>`; });
    rows.forEach((p, i) => {
      const y = 43 + i * 90, label = p.id === 'reviewed' ? 'AI + source / exception review' : p.label;
      if (!p.visible) { svg += `<g data-key="placeholder-${p.id}" class="practice-unrevealed">${svgText(label, left, y - 4, 'class="practice-viz-label"')}${svgText('Not yet revealed', left, y + 34, 'class="practice-viz-small"')}</g>`; return; }
      const marks = `${svgText(label, left, y - 4, 'class="practice-viz-label"')}${svgText(`${fmt(p.minutes)} min`, right, y + 17, 'text-anchor="end" class="practice-viz-value"')}<rect data-key="bar-${p.id}" class="practice-animated-bar practice-fill-${p.errors ? 'error' : 'reference'}" style="x:${left}px;y:${y + 25}px;width:${Math.max(0, scale(p.baseMinutes) - left)}px;height:20px" rx="3"/>${p.id === 'reviewed' ? `<rect data-key="extra-rework" class="practice-animated-bar" style="x:${scale(84)}px;y:${y + 25}px;width:${scale(p.extraMinutes) - left}px;height:20px" fill="url(#${prefix}-rework)"/>${svgText(`84 min supplied + ${p.extraMinutes} min added rework`, right, y + 61, 'text-anchor="end" class="practice-viz-small"')}` : ''}`;
      svg += interactiveMark(p.id, `${label}: ${p.minutes} minutes; ${p.acceptable} of twelve acceptable; ${p.errors} material errors`, marks, '', `data-policy-id="${p.id}"`);
    });
    if (q.targetMinutes !== null) svg += `<g class="practice-target-marker"><line x1="${scale(q.targetMinutes)}" x2="${scale(q.targetMinutes)}" y1="24" y2="${axis}"/>${svgText('10% reduction target: 86.4 min', width / 2, 16, 'text-anchor="middle" class="practice-target-label"')}</g>`;
    svg += svgText('Total minutes · same 12 cases', width / 2, height - 3, 'text-anchor="middle" class="practice-viz-axis-label"') + '</svg>';
    return svg;
  }
  function qualityMatrix(model, prefix, width) {
    const q = model.quality, left = 19, gap = (width - 38) / 12, radius = Math.min(12, gap * .35), height = 334;
    let svg = svgStart(width, height, `${prefix}-quality-matrix`, 'The same twelve cases across policies', 'Each column is the same case. A check mark means acceptable; a cross is a material error. Select a case to inspect its source and all three outcomes.');
    q.cases.forEach((c, i) => { const x = left + (i + .5) * gap; svg += interactiveMark(c.id, `${c.label}, ${c.request}. ${c.materialError ? 'Unchecked AI has a material error; manual and reviewed replies are acceptable.' : 'Acceptable under all three supplied policies.'}`, `<rect x="${x - gap * .42}" y="3" width="${gap * .84}" height="27" rx="4" class="practice-case-heading"/>${svgText(i + 1, x, 22, 'text-anchor="middle" class="practice-case-number"')}`); });
    q.policies.forEach((p, k) => { const y = 50 + k * 90;
      svg += `<g data-key="matrix-policy-${p.id}" data-policy-row="${p.id}" class="practice-matrix-row ${p.visible ? '' : 'practice-unrevealed'}">${svgText(p.id === 'reviewed' ? 'AI + review' : p.id === 'unchecked' ? 'AI unchecked' : 'Manual', left, y, 'class="practice-viz-label"')}${svgText(p.visible ? `${p.acceptable}/12 acceptable · ${p.errors} errors` : 'Not yet revealed', width - 19, y + 17, 'text-anchor="end" class="practice-viz-small"')}`;
      q.cases.forEach((c, i) => { const x = left + (i + .5) * gap, error = p.id === 'unchecked' && c.materialError;
        svg += interactiveMark(c.id, `${c.label} under ${p.label}: ${p.visible ? error ? 'material error' : 'acceptable' : 'not yet revealed'}`, `<rect class="practice-matrix-cell ${p.visible ? `practice-fill-${error ? 'error' : 'reference'}` : 'practice-empty-count'}" x="${x - radius}" y="${y + 40 - radius}" width="${2 * radius}" height="${2 * radius}" rx="4"/>${p.visible ? svgText(error ? '×' : '✓', x, y + 45, 'text-anchor="middle" class="practice-cell-symbol"') : ''}`, '', `data-policy-id="${p.id}"`, false);
      }); svg += '</g>';
    });
    svg += svgText('Case number · same case in every row', width / 2, 324, 'text-anchor="middle" class="practice-viz-axis-label"') + '</svg>';
    return svg;
  }
  function qualityChart(model, prefix, width) {
    const q = model.quality, reviewed = q.policies.find(p => p.id === 'reviewed'), eligible = reviewed.minutes <= (q.targetMinutes ?? 96), reduction = (96 - reviewed.minutes) / 96 * 100;
    return `<div class="practice-specialized">${figureHeader('Effort and quality are two separate tests', model.kind === 'quality' ? 'Select a policy bar or a case number. A short bar does not cancel a material error.' : 'Compare the complete process before translating a time difference into capacity.')}${qualityTimeChart(model, prefix, width)}${model.kind === 'quality' ? `${figureHeader('Which cases failed?', 'Every column below is the same source-linked case. Cases 3, 7, and 11 explain the unchecked policy’s three errors.')}${qualityMatrix(model, prefix, width)}` : ''}${reviewed.visible ? `<div class="practice-equation"><span>96 − ${reviewed.minutes} = <strong>${fmt(96 - reviewed.minutes)} minutes</strong></span><span>${fmt(reduction)}% effort reduction</span></div>` : ''}${model.kind === 'quality' && reviewed.visible ? `<p class="practice-visual-insight"><strong>Reviewed policy at this step:</strong> quality criterion met on 12/12 supplied cases; ${eligible ? 'the example 10% effort criterion is met' : 'the example 10% effort criterion is missed'}. Both criteria matter. Zero errors in this set does not establish future safety.</p>` : ''}</div>`;
  }
  function cohortChart(model, prefix, width) {
    const c = model.cohort, left = 18, gap = (width - 36) / 12, radius = Math.min(12, gap * .33);
    let svg;
    if (c.mutuallyExclusive) {
      svg = svgStart(width, 321, `${prefix}-cohort-outcomes`, 'Twelve invitees in mutually exclusive outcome groups', 'The four groups sum to twelve people. The anonymous positions encode counts, not known identities or reasons for leaving.');
      c.groups.forEach((g, k) => { const y = 36 + k * 68;
        svg += interactiveMark(g.id, `${g.label}: ${g.count} of twelve invited people`, `${svgText(g.label, left, y - 8, 'class="practice-viz-label"')}${svgText(`${g.count} / 12`, width - left, y - 8, 'text-anchor="end" class="practice-viz-value"')}${Array.from({ length: 12 }, (_, i) => `<circle cx="${left + (i + .5) * gap}" cy="${y + 17}" r="${radius}" class="${i >= g.start && i < g.start + g.count ? `practice-fill-${g.role}` : 'practice-outside-count'}"/>`).join('')}`);
      });
      svg += svgText('3 + 3 + 2 + 4 = 12 distinct people', width / 2, 312, 'text-anchor="middle" class="practice-viz-axis-label"') + '</svg>';
    } else {
      svg = svgStart(width, 356, `${prefix}-cohort`, 'One twelve-person cohort and explicit denominators', 'Each row shows the same total of twelve anonymous positions. The blue bracket identifies the denominator. Filled marks count those reaching the stage; hollow marks are in the denominator but did not reach it.');
      c.stages.forEach((r, k) => { const y = 32 + k * 78, denEnd = left + r.denominator * gap;
        svg += interactiveMark(r.id, `${r.label}: ${r.count}/${r.denominator}, ${fmt(r.rate)} percent; fourteen days after invitation`, `${svgText(r.label, left, y - 7, 'class="practice-viz-label"')}${svgText(`${r.count}/${r.denominator} = ${fmt(r.rate)}%`, width - left, y + 12, 'text-anchor="end" class="practice-viz-value"')}${Array.from({ length: 12 }, (_, i) => `<circle data-key="cohort-${r.id}-${i}" cx="${left + (i + .5) * gap}" cy="${y + 35}" r="${radius}" class="${i < r.count ? 'practice-fill-reference' : i < r.denominator ? 'practice-empty-count' : 'practice-outside-count'}"/>`).join('')}<path data-key="denominator-${r.id}" class="practice-denominator-bracket" d="M ${left + 2} ${y + 48} v 7 H ${denEnd - 2} v -7"/>`);
      });
      svg += svgText('1 mark = 1 invitee · bracket = denominator', width / 2, 348, 'text-anchor="middle" class="practice-viz-axis-label"') + '</svg>';
    }
    return `<div class="practice-specialized">${figureHeader('Follow the counts, not invented people', 'All 12 invitees share a 14-day observation window after invitation. Mark placement illustrates the nested counts; no individual identities or dropout reasons are supplied.')}${svg}<div class="practice-equation"><strong>14 days after invitation</strong><span>Returned = completed another task in that window</span></div><p class="practice-visual-insight">${c.mutuallyExclusive ? 'These groups are mutually exclusive. By contrast, adding the four funnel stage totals would count the same people repeatedly.' : c.basis === 'previous' ? 'Completion: 6/9 starters = 66.67%. Return: 4/6 initial completers = 66.67%. Those are different populations, despite matching percentages.' : 'Completion: 6/12 invitees = 50%. Return: 4/12 invitees = 33.33%. Changing the denominator changes the question, not what happened.'}</p></div>`;
  }
  function capacityChart(model, prefix, width) {
    const v = model.value, cells = [{ id: 'monthly-volume', title: 'Eligible monthly replies', number: fmt(v.volume), note: 'Planning volume', role: 'uncertainty' }, { id: 'assisted-count', title: 'Replies using the process', number: fmt(v.assistedReplies), note: `${v.adoption}% of eligible replies`, role: 'uncertainty' }, { id: 'released-hours', title: 'Capacity released per month', number: `${fmt(v.hours)} hours`, note: `${fmt(v.minutesPerReply)} minute per assisted reply ÷ 60`, role: v.hours < 0 ? 'error' : 'reference' }];
    let svg = svgStart(width, 335, `${prefix}-capacity`, 'From volume and adoption to released capacity', 'Multiply eligible replies by the adoption share, multiply by minutes released per reply, then divide by sixty. These are planning assumptions, not observed monthly results.');
    cells.forEach((c, i) => { const y = 10 + i * 110; svg += interactiveMark(c.id, `${c.title}: ${c.number}. ${c.note}`, `<rect x="14" y="${y}" width="${width - 28}" height="84" rx="9" class="practice-capacity-box"/>${svgText(c.title, 27, y + 23, 'class="practice-viz-label"')}${svgText(c.number, width - 27, y + 48, 'text-anchor="end" class="practice-capacity-number"')}${wrappedText(c.note, 27, y + 68, Math.max(20, Math.floor((width - 55) / 7)), 'class="practice-viz-small"')}`); if (i < 2) svg += `<path class="practice-capacity-arrow" d="M ${width / 2} ${y + 88} v 16 m -5 -5 l 5 5 l 5 -5"/>`; }); svg += '</svg>';
    return `<div class="practice-specialized">${figureHeader('Make every conversion visible', 'The adoption share applies to monthly eligible replies. The time difference applies only to the replies that use the process.')}${svg}<div class="practice-equation"><span>${fmt(v.assistedReplies)} replies × ${fmt(v.minutesPerReply)} minute</span><span>÷ 60 = <strong>${fmt(v.hours)} hours</strong></span></div><p class="practice-visual-insight">${v.hours >= 0 ? 'Name the productive work that will use these hours. A shorter task does not automatically reduce payroll.' : 'This scenario consumes more time than the manual process. Negative released capacity is a workload increase, not a saving.'}</p></div>`;
  }
  function waterfallChart(model, prefix, width) {
    const v = model.value, left = 58, right = width - 17, top = 28, bottom = 248, [lo, hi] = v.dollarDomain, y = n => bottom - (n - lo) / (hi - lo) * (bottom - top), gap = (right - left) / 4, barWidth = Math.min(55, gap * .6);
    let svg = svgStart(width, 324, `${prefix}-waterfall`, 'Capacity value less recurring costs', 'Each floating cost bar starts where the previous step ended. The final bar returns to zero as the net total. This is a capacity-value calculation, not cash flow.');
    const ticks = Array.from({ length: 5 }, (_, i) => lo + (hi - lo) * i / 4);
    ticks.forEach(n => { svg += `<g class="practice-viz-grid"><line x1="${left}" x2="${right}" y1="${y(n)}" y2="${y(n)}"/>${svgText(fmt(n), left - 8, y(n) + 4, 'text-anchor="end"')}</g>`; });
    svg += `<line class="practice-viz-axis" x1="${left}" x2="${right}" y1="${y(0)}" y2="${y(0)}"/>${svgText('$ per month', left, 15, 'class="practice-viz-axis-label"')}`;
    v.segments.forEach((s, i) => { const x = left + gap * (i + .5), yy = Math.min(y(s.start), y(s.end)), hh = Math.max(2, Math.abs(y(s.start) - y(s.end))), role = s.change < 0 ? 'error' : 'reference';
      if (i > 0 && i < 3) svg += `<line class="practice-waterfall-connector" x1="${left + gap * (i - .5) + barWidth / 2}" x2="${x - barWidth / 2}" y1="${y(s.start)}" y2="${y(s.start)}"/>`;
      svg += interactiveMark(s.id, `${s.label}: ${money(s.change)}; balance moves from ${money(s.start)} to ${money(s.end)}`, `<rect data-key="segment-${s.id}" class="practice-animated-bar practice-fill-${role}" style="x:${x - barWidth / 2}px;y:${yy}px;width:${barWidth}px;height:${hh}px" rx="3"/>${svgText(money(s.change), x, Math.max(22, yy - 7), 'text-anchor="middle" class="practice-waterfall-value"')}${wrappedText(s.label, x, 273, Math.max(6, Math.floor(gap / 6)), 'text-anchor="middle" class="practice-viz-small"')}`);
    });
    svg += svgText(`Shared dollar scale: ${money(lo)} to ${money(hi)}`, width / 2, 316, 'text-anchor="middle" class="practice-viz-axis-label"') + '</svg>';
    return svg;
  }
  function sensitivityChart(model, prefix, width) {
    const v = model.value, left = 58, right = width - 18, top = 32, bottom = 248, x = n => left + n / 100 * (right - left), [lo, hi] = v.dollarDomain, y = n => bottom - (n - lo) / (hi - lo) * (bottom - top);
    let svg = svgStart(width, 324, `${prefix}-sensitivity`, 'Adoption sensitivity with capacity and cash kept separate', 'The solid line is monthly net capacity value across adoption shares. The dashed cash line is unchanged by adoption because payroll is fixed. The blue marker is the current scenario.');
    Array.from({ length: 5 }, (_, i) => lo + (hi - lo) * i / 4).forEach(n => { svg += `<g class="practice-viz-grid"><line x1="${left}" x2="${right}" y1="${y(n)}" y2="${y(n)}"/>${svgText(fmt(n), left - 8, y(n) + 4, 'text-anchor="end"')}</g>`; });
    [0, 25, 50, 75, 100].forEach(n => { svg += `<g class="practice-viz-grid"><line x1="${x(n)}" x2="${x(n)}" y1="${top}" y2="${bottom}"/>${svgText(`${n}%`, x(n), bottom + 21, 'text-anchor="middle"')}</g>`; });
    svg += `<line class="practice-viz-axis" x1="${left}" x2="${right}" y1="${y(0)}" y2="${y(0)}"/><path data-key="capacity-curve" class="practice-capacity-curve" d="${v.curve.map((p, i) => `${i ? 'L' : 'M'} ${x(p.adoption)} ${y(p.net)}`).join(' ')}"/><line class="practice-cash-line" x1="${left}" x2="${right}" y1="${y(v.cashChange)}" y2="${y(v.cashChange)}"/>${svgText('$ / month', left, 17, 'class="practice-viz-axis-label"')}`;
    v.curve.forEach(p => { svg += interactiveMark(`adoption-${p.adoption}`, `${p.adoption}% adoption: ${money(p.net)} net capacity value; ${money(v.cashChange)} cash change`, `<circle cx="${x(p.adoption)}" cy="${y(p.net)}" r="${p.adoption % 25 === 0 ? 4 : 2.5}" class="practice-curve-point"/>`, '', '', p.adoption % 25 === 0); });
    if (v.breakEvenVisible) svg += `<g data-key="break-even" class="practice-break-even"><line x1="${x(v.breakEvenAdoption)}" x2="${x(v.breakEvenAdoption)}" y1="${y(0)}" y2="${bottom}"/><rect x="${x(v.breakEvenAdoption) - 5}" y="${y(0) - 5}" width="10" height="10"/></g>`;
    svg += `<g data-key="current-scenario" data-record="adoption-${v.adoption}" class="practice-current-scenario practice-linked" role="button" tabindex="0" aria-pressed="false" aria-label="Current scenario: ${v.adoption}% adoption, ${esc(money(v.netCapacityValue))} monthly net capacity value" style="transform:translate(${x(v.adoption)}px,${y(v.netCapacityValue)}px)"><circle r="7"/><circle r="11"/></g>${svgText('Planned adoption (%) · other inputs fixed', width / 2, 292, 'text-anchor="middle" class="practice-viz-axis-label"')}${svgText(`Now ${v.adoption}%: ${money(v.netCapacityValue)} / month`, width / 2, 314, 'text-anchor="middle" class="practice-viz-value"')}</svg>`;
    return svg;
  }
  function valueBridgeChart(model, prefix, width) {
    const v = model.value;
    return `<div class="practice-specialized">${figureHeader('Follow the running balance', 'Capacity value is a modeled benefit. The floating bars deduct tools and support; the net bar shows the result.')}${waterfallChart(model, prefix, width)}<div class="practice-cash-card" data-related-record="cash"><span>Separate cash view · unchanged payroll</span><strong>$0 demonstrated expense avoided − ${money(v.recurringCost)} recurring expense = ${money(v.cashChange)} / month</strong></div>${figureHeader('How much adoption would cover the cost?', 'Follow the current blue point as adoption changes. The dollar scale covers every adoption share from 0% to 100%, so changing adoption alone never rescales the comparison.')}${sensitivityChart(model, prefix, width)}<div class="practice-line-legend"><span><i class="capacity"></i>Solid: net capacity value</span><span><i class="cash"></i>Dashed: recurring cash change</span>${v.breakEvenVisible ? '<span><i class="break-even"></i>Square: capacity break-even</span>' : ''}</div><details class="practice-sensitivity-data"><summary>Inspect adoption scenarios without changing your inputs</summary><div class="practice-table-scroll" role="region" tabindex="0" aria-label="Adoption sensitivity values"><table><caption>Same curve, fixed other inputs · hypothetical monthly values</caption><thead><tr><th scope="col">Adoption</th><th scope="col">Net capacity value</th><th scope="col">Cash change</th></tr></thead><tbody>${v.curve.map(p => `<tr data-table-row="adoption-${p.adoption}"><th scope="row"><button type="button" data-inspect="adoption-${p.adoption}" aria-pressed="false">${p.adoption}%</button></th><td>${money(p.net)}</td><td>${money(v.cashChange)}</td></tr>`).join('')}</tbody></table></div></details><p class="practice-visual-insight">${v.breakEvenVisible ? `Capacity break-even requires ${fmt(v.breakEvenAdoption)}% adoption at these inputs. This is a condition to test, not observed adoption.` : 'No adoption share from 0% to 100% covers the recurring cost with these time and cost assumptions.'} Cash change stays ${money(v.cashChange)} because no avoided cash expense has been established. Changing volume, rework, or costs can change the labeled dollar scale.</p></div>`;
  }
  function chart(model, prefix, selected, width = 700) {
    width = Math.max(260, Math.min(1000, Math.round(width)));
    const renderers = { distribution: distributionChart, 'discovery-counts': discoveryCountChart, workflow: workflowChart, quality: qualityChart, 'time-comparison': qualityChart, cohort: cohortChart, capacity: capacityChart, 'value-bridge': valueBridgeChart };
    return renderers[model.kind] ? renderers[model.kind](model, prefix, width) : legacyChart(model, prefix, selected);
  }
  // Reconcile keyed SVG/HTML nodes so a changed value moves an existing mark.
  // Controls live outside this subtree; focus and table selection are preserved.
  function patchChildren(parent, incoming) {
    const desired = [...incoming.childNodes], old = [...parent.childNodes];
    const keyOf = node => node.nodeType === 1 ? node.getAttribute('data-key') || node.id || null : null;
    let cursor = parent.firstChild;
    const used = new Set();
    desired.forEach(next => {
      const key = keyOf(next);
      let current = key ? old.find(node => !used.has(node) && keyOf(node) === key && node.nodeName === next.nodeName) : cursor && !used.has(cursor) && !keyOf(cursor) && cursor.nodeName === next.nodeName ? cursor : null;
      if (!current) { current = next.cloneNode(true); parent.insertBefore(current, cursor); }
      else { if (current !== cursor) parent.insertBefore(current, cursor); if (current.nodeType === 3) { if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue; } else if (current.nodeType === 1) { [...current.attributes].forEach(a => { if (!next.hasAttribute(a.name) && !(current.nodeName === 'DETAILS' && a.name === 'open')) current.removeAttribute(a.name); }); [...next.attributes].forEach(a => { if (current.getAttribute(a.name) !== a.value) current.setAttribute(a.name, a.value); }); patchChildren(current, next); } }
      used.add(current); cursor = current.nextSibling;
    });
    [...parent.childNodes].forEach(node => { if (!used.has(node)) node.remove(); });
  }
  function patchMarkup(parent, markup) { const template = document.createElement('template'); template.innerHTML = markup; patchChildren(parent, template.content); }

  function legacyChart(model, prefix, selected) {
    if (model.workflow) {
      return `<svg viewBox="0 0 700 290" role="group" aria-labelledby="${prefix}-chart-title ${prefix}-chart-desc"><title id="${prefix}-chart-title">${esc(model.title)}</title><desc id="${prefix}-chart-desc">${esc(model.caption)} The table provides every step and its explanation.</desc>${model.rows.map((r, i) => { const x = 16 + (i % 3) * 230, y = 20 + Math.floor(i / 3) * 135; return `<g class="practice-node ${r.id === selected ? 'is-selected' : ''} ${i === model.frame ? 'is-current' : ''} ${r.revealed ? '' : 'is-unrevealed'}" data-record="${r.id}" tabindex="0" role="button" aria-label="Step ${i + 1}: ${esc(r.label)}. ${esc(r.note)}" aria-pressed="${r.id === selected}"><rect x="${x}" y="${y}" width="208" height="95" rx="9"/><circle cx="${x + 25}" cy="${y + 27}" r="14" class="practice-fill-${r.role}"/><text class="practice-node-number" x="${x + 25}" y="${y + 32}" text-anchor="middle">${i + 1}</text><text x="${x + 48}" y="${y + 32}">${esc(r.label)}</text><text class="practice-node-state" x="${x + 16}" y="${y + 66}">${i === model.frame ? 'Current step' : i < model.frame ? 'Traced' : 'Next in sequence'}</text></g>`; }).join('')}<text x="20" y="280" class="practice-axis">Follow steps 1–6. Order is not elapsed time.</text></svg>`;
    }
    const width = 700, left = 230, right = 66, top = 38, rowHeight = 45, height = Math.max(205, model.rows.length * rowHeight + 85), bottom = height - 45, [lo, hi] = model.domain, scale = v => left + (v - lo) / (hi - lo) * (width - left - right);
    const ticks = Array.from({ length: 5 }, (_, i) => lo + (hi - lo) * i / 4);
    return `<svg viewBox="0 0 ${width} ${height}" role="group" aria-labelledby="${prefix}-chart-title ${prefix}-chart-desc"><title id="${prefix}-chart-title">${esc(model.title)}</title><desc id="${prefix}-chart-desc">${esc(model.caption)} Values in ${esc(model.unit)}. Select a bar or the corresponding table row.</desc>${ticks.map(v => `<g class="practice-grid"><line x1="${scale(v)}" x2="${scale(v)}" y1="${top - 8}" y2="${bottom}"/><text x="${scale(v)}" y="${bottom + 18}" text-anchor="middle">${fmt(v)}</text></g>`).join('')}<line class="practice-zero" x1="${scale(0)}" x2="${scale(0)}" y1="${top - 8}" y2="${bottom}"/>${model.rows.map((r, i) => { const y = top + i * rowHeight; return `<g class="practice-record ${r.excluded ? 'is-excluded' : ''} ${r.id === selected ? 'is-selected' : ''}" data-record="${r.id}" tabindex="0" role="button" aria-pressed="${r.id === selected}" aria-label="${esc(r.label)}: ${fmt(r.amount)} ${esc(model.unit)}. ${esc(r.note)}"><rect class="practice-row-background" x="2" y="${y - 9}" width="696" height="42" rx="5"/><text x="${left - 12}" y="${y + 17}" text-anchor="end">${esc(r.label)}</text><rect class="practice-bar practice-fill-${r.role}" x="${Math.min(scale(0), scale(r.amount))}" y="${y + 2}" width="${Math.max(1, Math.abs(scale(r.amount) - scale(0)))}" height="21" rx="3"/><text class="practice-bar-value" x="${r.amount >= 0 ? scale(r.amount) + 7 : scale(r.amount) - 7}" y="${y + 17}" text-anchor="${r.amount >= 0 ? 'start' : 'end'}">${fmt(r.amount)}</text></g>`; }).join('')}${(model.markers || []).map((m, i) => `<g class="practice-marker practice-stroke-${m.role}"><line x1="${scale(m.value)}" x2="${scale(m.value)}" y1="${top - 12}" y2="${bottom}"/><text x="${scale(m.value) + 4}" y="${12 + i * 15}">${esc(m.label)} ${fmt(m.value)}</text></g>`).join('')}<text class="practice-axis" x="${(left + width - right) / 2}" y="${height - 3}" text-anchor="middle">${esc(model.unit)}</text></svg>`;
  }
  function table(model, selected) {
    const displayedRows = model.displayRows || model.rows;
    const qualityColumns = displayedRows[0]?.acceptable !== undefined;
    return `<div class="practice-table-scroll" tabindex="0" role="region" aria-label="Matching figure data; scroll horizontally if needed"><table><caption>${model.workflow ? 'Workflow steps and responsibility' : model.displayRows ? 'Matching calculation data · units shown per row' : `Matching figure data · ${esc(model.unit)}`}</caption><thead><tr><th scope="col">${model.workflow ? 'Step' : 'Record / policy'}</th><th scope="col">${model.workflow ? 'Order' : 'Value'}</th>${qualityColumns ? '<th scope="col">Acceptable</th><th scope="col">Material errors</th>' : ''}<th scope="col">Interpretation</th></tr></thead><tbody>${displayedRows.map(r => `<tr data-table-row="${r.id}" class="${selected === r.id ? 'is-selected' : ''}"><th scope="row"><button type="button" data-inspect="${r.id}" aria-pressed="${selected === r.id}">${esc(r.label)}</button></th><td>${fmt(r.amount)}${r.valueUnit ? ` ${esc(r.valueUnit)}` : ''}</td>${qualityColumns ? `<td>${r.acceptable}/12</td><td>${r.errors}</td>` : ''}<td>${esc(r.note)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function controlMarkup(family, inputs, prefix) {
    return CONTROLS[family].map(c => { const id = `${prefix}-${c.key}`, value = inputs[c.key]; return `<div class="practice-control"><label for="${id}-range">${esc(c.label)}</label><div class="practice-control-value"><input id="${id}-number" type="number" data-input="${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${value}" aria-label="${esc(c.label)} in ${esc(c.unit)}"><span>${esc(c.unit)}</span></div><input id="${id}-range" type="range" data-input="${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${value}" aria-valuetext="${value} ${esc(c.unit)}"><div class="practice-range-label"><span>${c.min} ${esc(c.unit)}</span><span>${c.max} ${esc(c.unit)}</span></div></div>`; }).join('');
  }
  function choiceMarkup(prompt, choices, name, current, attribute) {
    return `<fieldset class="practice-choices"><legend>${esc(prompt)}</legend>${choices.map((option, i) => `<label><input type="radio" name="${name}" ${attribute}="${i}" ${current === i ? 'checked' : ''}><span>${esc(option)}</span></label>`).join('')}</fieldset>`;
  }
  function exportRecord(family, unit, state) {
    const r = calculate(family, state.inputs), config = configFor(family, unit);
    const numbers = family === 'evidence' ? [`Included replies: ${r.count}/8`, `Total waiting time: ${r.total} minutes (not staff processing effort)`, `Mean: ${fmt(r.mean)} minutes`, `Median: ${fmt(r.median)} minutes`, 'Discovery: 6/8 report repeated delay; 3/8 willing to try a pilot.'] : family === 'quality' ? [...r.policies.map(p => `${p.label}: ${p.minutes} minutes, ${p.acceptable}/12 acceptable, ${p.errors} material errors`), `Capacity value: ${money(r.capacityValue)} at $24/hour; no demonstrated cash saving.`, 'Tool costs are missing; 0/12 errors is not proof of future safety.'] : [`Assisted replies: ${r.assistedReplies}/month`, `Capacity: ${fmt(r.hours)} hours/month, ${money(r.capacityValue)} value`, `Recurring cost: ${money(r.recurringCost)}/month`, `Net capacity value: ${money(r.netCapacityValue)}/month`, `Recurring cash change: ${money(r.cashChange)}/month`, 'Adoption cohort: 12 invited; 9 started; 6 completed; 4 completed another task within 14 days after invitation. Separate from processing cases and monthly forecast.'];
    return ['BUILDING AI SOLUTIONS · PRACTICE RECORD', `Unit ${unit || 'general'} · ${config.title}`, 'Original fictional Cedar Desk teaching data. Changed inputs are scenarios, not observed results.', '', 'PREDICTION', state.prediction === null ? 'Not selected' : config.predictions[state.prediction], state.reason || 'No explanation entered.', '', 'ASSUMPTIONS', ...(family === 'value' && String(unit) === '7' ? ['Supplied cohort counts are held fixed; only the displayed denominator changes.'] : Object.entries(state.inputs).map(([key, value]) => `${key}: ${value}`)), '', 'RESULTS', ...(family === 'value' && String(unit) === '7' ? ['Observation window: 14 days after invitation.', '12 invited; 9 started; 6 completed a task; 4 completed another task within the window.', `Displayed rate denominator: ${state.cohortBasis === 'previous' ? 'preceding stage' : 'all 12 invited people'}.`, 'No purchase, monthly volume, or longer-term retention is established.'] : numbers), '', 'RECOMMENDATION', state.decision === null ? 'Not selected' : config.options[state.decision], decisionFeedback(family, state.decision, state.inputs, unit), '', 'TRANSFER TO MY PROJECT', state.transfer || 'Not entered.'].join('\n');
  }

  let instance = 0;
  function mount(element) {
    const family = element.dataset.practice;
    if (!Object.hasOwn(CONFIG, family) || element.dataset.practiceMounted) return null;
    element.dataset.practiceMounted = 'true'; element.classList.add('practice');
    const unit = String(element.dataset.unit || ''), prefix = `practice-${family}-${unit.replace(/[^a-zA-Z0-9]/g, '') || 'general'}-${++instance}`, key = storageKey(family, unit), config = configFor(family, unit);
    const pilotCohort = family === 'value' && unit === '7';
    const workflow = family === 'quality' && unit === '4', maxFrame = workflow ? 5 : 3;
    let state = initialState(family), storageAvailable = true, timer = null, playing = false, disposed = false, resizeObserver = null, lastWidth = 0;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    try { const saved = localStorage.getItem(key); if (saved) state = restoreState(family, JSON.parse(saved)); } catch (_) { storageAvailable = false; }
    state.frame = Math.min(maxFrame, state.frame);
    if (workflow && !['case-1', 'case-3'].includes(state.caseId)) state.caseId = 'case-1';
    const save = () => { try { localStorage.setItem(key, JSON.stringify(state)); storageAvailable = true; } catch (_) { storageAvailable = false; } const status = element.querySelector('[data-save-status]'); if (status) status.textContent = storageAvailable ? 'Saved on this browser. Export to keep a portable copy.' : 'Browser storage is unavailable. Export to keep a copy before leaving.'; };
    const pause = () => { clearTimeout(timer); playing = false; const button = element.querySelector('[data-play]'); if (button) { button.textContent = 'Play steps'; button.setAttribute('aria-pressed', 'false'); } };
    const focusHeading = () => { const heading = element.querySelector('[data-practice-heading]'); heading?.focus({ preventScroll: true }); };
    function shell() {
      element.innerHTML = `<header class="practice-heading"><p class="practice-kicker">Guided practice · ${esc(config.duration)}</p><h3 id="${prefix}-title" data-practice-heading tabindex="-1">${esc(config.title)}</h3><p class="practice-provenance">Fictional teaching case · Cedar Desk · no partner results are claimed</p></header><div class="practice-step-status" aria-live="polite"><span data-stage-label></span><span data-stage-count></span></div><div data-stage-content></div><div class="practice-navigation"><button type="button" class="practice-button secondary" data-back>Back</button><button type="button" class="practice-button" data-next></button></div><footer class="practice-footer"><span data-save-status></span><div><button type="button" data-export>Export my practice</button><button type="button" data-reset>Reset this activity</button></div></footer>`;
      renderStage();
    }
    function renderStage() {
      pause();
      const body = element.querySelector('[data-stage-content]');
      element.querySelector('[data-stage-label]').textContent = ['Predict', 'Inspect and change one assumption', 'Make a decision', 'Transfer to your project'][state.stage];
      element.querySelector('[data-stage-count]').textContent = `${state.stage + 1} / 4`;
      element.querySelector('[data-back]').disabled = state.stage === 0;
      element.querySelector('[data-next]').textContent = ['Inspect the evidence →', 'Make a recommendation →', 'Apply to my project →', state.complete ? 'Practice saved ✓' : 'Save and finish practice ✓'][state.stage];
      element.querySelector('[data-next]').disabled = state.stage === 3 && state.complete;
      if (state.stage === 0) body.innerHTML = `<p class="practice-intro">${esc(config.intro)}</p>${choiceMarkup(config.prediction, config.predictions, `${prefix}-prediction`, state.prediction, 'data-prediction')}<label class="practice-text-label" for="${prefix}-reason">Your reason, before seeing the result <small>(optional)</small></label><textarea id="${prefix}-reason" data-reason maxlength="1800" rows="2" placeholder="I expect… because…">${esc(state.reason)}</textarea><p class="practice-feedback" data-prediction-feedback role="status">${state.prediction === null ? 'A prediction helps you notice what changes. It is practice, not a grade.' : esc(config.predictionFeedback[state.prediction])}</p>`;
      if (state.stage === 1) body.innerHTML = `<p class="practice-instruction">${workflow ? 'Choose an ordinary input or an exception. Follow its source, draft, check, and human handoff.' : 'Step through the evidence, then change an assumption. The chart and table describe the same records; select either to connect them.'}</p>${workflow ? `<div class="practice-workflow-controls"><label for="${prefix}-case">Input to trace<select id="${prefix}-case" data-case><option value="case-1" ${state.caseId === 'case-1' ? 'selected' : ''}>Ordinary: cancellation at 96 hours</option><option value="case-3" ${state.caseId === 'case-3' ? 'selected' : ''}>Exception: emergency at 8 hours</option></select></label><label for="${prefix}-policy">Review policy<select id="${prefix}-policy" data-policy><option value="reviewed" ${state.policy !== 'unchecked' ? 'selected' : ''}>Check sources and route exceptions</option><option value="unchecked" ${state.policy === 'unchecked' ? 'selected' : ''}>Send draft without checking</option></select></label></div>` : pilotCohort ? `<div class="practice-workflow-controls"><label for="${prefix}-basis">Compare rates using<select id="${prefix}-basis" data-cohort-basis><option value="invited" ${state.cohortBasis === 'invited' ? 'selected' : ''}>All 12 invited people</option><option value="previous" ${state.cohortBasis === 'previous' ? 'selected' : ''}>Each preceding stage</option></select></label></div>` : `<div class="practice-controls">${controlMarkup(family, state.inputs, prefix)}</div>${family === 'evidence' ? `<label class="practice-exclusion"><input type="checkbox" data-include-tail ${state.inputs.includeTail ? 'checked' : ''}>Include the longest reply in the summary</label>` : ''}`}<p class="practice-try-hint" data-try-hint></p><div class="practice-playback" role="group" aria-label="Step through the explanation"><button type="button" data-previous-frame aria-label="Previous explanation">←</button><span data-frame-count></span><button type="button" data-next-frame aria-label="Next explanation">→</button><button type="button" data-play aria-pressed="false" ${motion.matches ? 'disabled' : ''}>Play steps</button><button type="button" data-replay>Replay</button><button type="button" data-show-all>${workflow ? 'Go to delivery' : 'Show final comparison'}</button></div>${motion.matches ? '<p class="practice-small">Reduced motion: step through at your own pace. Automatic playback is off.</p>' : ''}<div data-visual></div>${family === 'quality' ? `<details class="practice-detail"><summary>Inspect the same 12 supplied cases</summary><p>All totals include preparation, checking, and rework. Nine cases take 6 reviewed minutes each; correcting the three material errors takes 10 minutes each: 9 × 6 + 3 × 10 = 84. Extra rework is a separate scenario assumption.</p><div class="practice-table-scroll" tabindex="0" role="region" aria-label="Twelve fictional reply cases"><table><thead><tr><th scope="col">Case</th><th scope="col">Request</th><th scope="col">Sources</th><th scope="col">Unchecked outcome</th><th scope="col">Manual / draft / reviewed minutes</th></tr></thead><tbody>${CASES.map(c => `<tr data-table-row="${c.id}"><th scope="row">${workflow ? esc(c.label) : `<button type="button" data-inspect="${c.id}" aria-pressed="false">${c.label}</button>`}</th><td>${esc(c.request)}</td><td>${esc(c.sources)}</td><td>${c.materialError ? 'Material error' : 'Acceptable'}</td><td>${c.manualMinutes} / ${c.aiMinutes} / ${c.reviewedMinutes}</td></tr>`).join('')}</tbody></table></div><p>Approved fact and draft for an exception: ${esc(CASES[2].fact)} The unchecked draft instead says: “${esc(CASES[2].draft)}”</p></details>` : ''}`;
      if (state.stage === 2) body.innerHTML = `<p class="practice-intro">${esc(config.takeaway)}</p>${choiceMarkup(config.decision, config.options, `${prefix}-decision`, state.decision, 'data-decision')}<p class="practice-feedback" data-decision-feedback role="status">${esc(decisionFeedback(family, state.decision, state.inputs, unit))}</p><details class="practice-detail"><summary>Revisit your prediction</summary><p>${state.prediction === null ? 'No prediction selected.' : esc(config.predictions[state.prediction])}</p><p>${esc(state.reason || 'No reason entered.')}</p></details>`;
      if (state.stage === 3) body.innerHTML = `<p class="practice-intro">${esc(config.transfer)}</p><label class="practice-text-label" for="${prefix}-transfer">One addition to your project record</label><textarea id="${prefix}-transfer" data-transfer maxlength="1800" rows="5" placeholder="For our project… We will measure… We still do not know…">${esc(state.transfer)}</textarea><p class="practice-small">Use nonconfidential information. This draft stays on this browser; the course TA does not automatically receive it.</p><p class="practice-finish" data-finish-status role="status" tabindex="-1">${state.complete ? 'Practice finished and saved locally. Continue the lesson to apply it in your project.' : 'You can finish without a favorable numerical result. Explain your decision and its limits.'}</p>`;
      if (state.stage === 1) renderVisual();
      save();
    }
    function renderVisual() {
      const model = visualModel(family, state, unit), target = element.querySelector('[data-visual]'); if (!target) return;
      const records = [...model.rows, ...model.linkedRecords];
      if (!records.some(x => x.id === state.selected)) state.selected = null;
      const width = Math.max(260, Math.min(1000, Math.round(target.getBoundingClientRect().width || 700)));
      const markup = `<div class="practice-visual-heading" aria-live="polite" aria-atomic="true"><h4>${esc(model.title)}</h4><p>${esc(model.caption)}</p></div><figure><div class="practice-chart-scroll practice-specialized-frame" role="region" aria-label="Interactive explanatory figure">${chart(model, `${prefix}-${model.kind}`, state.selected, width)}</div><figcaption class="practice-legend">${model.legend.map(([role, label]) => `<span><i class="practice-fill-${role}"></i>${esc(label)}</span>`).join('')}</figcaption></figure><p class="practice-inspection" data-inspection role="status">Select a chart item or table row to inspect the same record.</p><div data-selected-detail></div>${table(model, state.selected)}<div class="practice-metrics">${model.metrics.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div><p class="practice-limit"><strong>Evidence boundary.</strong> ${esc(model.limit)}</p>`;
      patchMarkup(target, markup);
      const visibleControls = family === 'evidence' ? (state.frame < 3 ? ['tail'] : []) : family === 'quality' ? (state.frame === 3 ? ['rework'] : []) : state.frame === 0 ? [] : state.frame === 1 ? ['rework'] : state.frame === 2 ? ['volume', 'adoption'] : ['adoption', 'toolCost'];
      element.querySelectorAll('.practice-control').forEach(box => { box.hidden = !visibleControls.includes(box.querySelector('[data-input]').dataset.input); });
      const controls = element.querySelector('.practice-controls'); if (controls) controls.hidden = visibleControls.length === 0;
      const exclusion = element.querySelector('.practice-exclusion'); if (exclusion) exclusion.hidden = state.frame === 3;
      const hints = family === 'evidence' ? state.frame < 3 ? 'Try it: change the longest wait from 31 to 47. Follow record 8, then compare the mean and median.' : 'Try it: select each count. Explain what its denominator establishes—and what the unknown overlap prevents you from claiming.' : workflow ? 'Try it: choose the 8-hour emergency, then switch between a source check and an unchecked draft. Follow the route to the owner or customer.' : family === 'quality' ? state.frame === 3 ? 'Try it: add 6 minutes of rework. Does the reviewed process still meet both zero material errors and the example 10% effort reduction?' : 'Try it: select case 3, 7, or 11 in the outcome matrix. Compare its source and draft before judging the fastest bar.' : pilotCohort ? 'Try it: switch the denominator from all invitees to the preceding stage. The people do not change; the question and percentage do.' : state.frame === 1 ? 'Try it: add 6 minutes of rework. The saving per reply drops from 1 minute to half a minute.' : state.frame === 2 ? 'Try it: lower planned adoption to 30%. Follow eligible replies → assisted replies → released hours.' : state.frame === 3 ? 'Try it: move adoption to 75%. Follow the blue point and the net-value bar; check whether recurring cash expense changes.' : 'Try it: inspect how many people completed a task and how many completed another within the same 14-day window.';
      element.querySelector('[data-try-hint]').textContent = hints;
      element.querySelector('[data-frame-count]').textContent = `Step ${state.frame + 1} / ${maxFrame + 1}`;
      element.querySelector('[data-previous-frame]').disabled = state.frame === 0;
      element.querySelector('[data-next-frame]').disabled = state.frame === maxFrame;
      const button = element.querySelector('[data-play]'); button.textContent = playing ? 'Pause' : 'Play steps'; button.setAttribute('aria-pressed', String(playing));
      selectRecord(state.selected, false);
    }
    function selectRecord(id, saveSelection = true) {
      const model = visualModel(family, state, unit), records = [...model.rows, ...model.linkedRecords], record = records.find(x => x.id === id); state.selected = record?.id || null;
      element.querySelectorAll('[data-record]').forEach(x => { const chosen = x.dataset.record === state.selected; x.classList.toggle('is-selected', chosen); x.setAttribute('aria-pressed', String(chosen)); });
      element.querySelectorAll('[data-table-row]').forEach(x => { const chosen = x.dataset.tableRow === state.selected; x.classList.toggle('is-selected', chosen); x.querySelector('button')?.setAttribute('aria-pressed', String(chosen)); });
      element.querySelectorAll('[data-policy-row]').forEach(x => x.classList.toggle('is-policy-selected', x.dataset.policyRow === state.selected));
      element.querySelectorAll('[data-related-record]').forEach(x => x.classList.toggle('is-selected', x.dataset.relatedRecord === state.selected));
      const status = element.querySelector('[data-inspection]');
      if (status) status.textContent = record ? record.case ? `${record.label}. ${record.note}` : record.curvePoint ? `${record.label}. ${record.note}` : `${record.label}: ${model.workflow ? `step ${record.amount}` : `${fmt(record.amount)} ${record.valueUnit || model.unit}`}. ${record.note}` : model.kind === 'quality' ? 'Select a case number to connect all three policy outcomes with the actual approved source and supplied draft.' : 'Select a chart item or table row to inspect the same record.';
      const detail = element.querySelector('[data-selected-detail]');
      if (detail) patchMarkup(detail, record?.case ? `<div class="practice-selected-case"><h5>${esc(record.label)}</h5><div class="practice-source-pair"><section><h5>Approved facts · ${esc(record.case.sources)}</h5><p>${esc(record.case.fact)}</p></section><section class="${record.case.materialError ? 'has-error' : ''}"><h5>Supplied unchecked draft</h5><p>${esc(record.case.draft)}</p><strong>${record.case.materialError ? 'Material error: must be corrected or handed off' : 'Acceptable on this supplied case'}</strong></section></div><p>${esc(record.note)}</p></div>` : '');
      if (saveSelection) save();
    }
    function play() {
      if (motion.matches || state.stage !== 1) return;
      if (playing) { pause(); return; }
      if (state.frame === maxFrame) state.frame = 0;
      playing = true; renderVisual();
      const tick = () => { if (disposed || !playing || state.stage !== 1) return; if (state.frame >= maxFrame) { pause(); return; } state.frame++; renderVisual(); save(); if (state.frame === maxFrame) pause(); else timer = setTimeout(tick, 3400); };
      timer = setTimeout(tick, 3400);
    }
    function applyInput(target) {
      const control = CONTROLS[family].find(c => c.key === target.dataset.input); if (!control) return;
      const previous = state.inputs[control.key];
      state.inputs = commitNumericInput(family, state.inputs, control.key, target.value);
      if (state.inputs[control.key] !== previous) state.complete = false;
      element.querySelectorAll(`[data-input="${control.key}"]`).forEach(x => { x.value = state.inputs[control.key]; if (x.type === 'range') x.setAttribute('aria-valuetext', `${state.inputs[control.key]} ${control.unit}`); });
      pause(); renderVisual(); save();
    }
    const click = event => {
      const target = event.target.closest('button,[data-record]'); if (!target || !element.contains(target)) return;
      if (target.hasAttribute('data-next')) { pause(); if (state.stage < 3) { state.stage++; renderStage(); focusHeading(); } else { state.complete = true; save(); renderStage(); element.querySelector('[data-finish-status]').focus({ preventScroll: true }); element.dispatchEvent(new CustomEvent('ai-solutions-practice-complete', { bubbles: true, detail: { family, unit, complete: true } })); } }
      else if (target.hasAttribute('data-back')) { pause(); state.stage = Math.max(0, state.stage - 1); renderStage(); focusHeading(); }
      else if (target.hasAttribute('data-next-frame')) { pause(); state.frame = Math.min(maxFrame, state.frame + 1); renderVisual(); save(); }
      else if (target.hasAttribute('data-previous-frame')) { pause(); state.frame = Math.max(0, state.frame - 1); renderVisual(); save(); }
      else if (target.hasAttribute('data-show-all')) { pause(); state.frame = maxFrame; renderVisual(); save(); }
      else if (target.hasAttribute('data-replay')) { pause(); state.frame = 0; renderVisual(); save(); }
      else if (target.hasAttribute('data-play')) play();
      else if (target.hasAttribute('data-record')) selectRecord(target.dataset.record);
      else if (target.hasAttribute('data-inspect')) selectRecord(target.dataset.inspect);
      else if (target.hasAttribute('data-reset')) { pause(); state = initialState(family); try { localStorage.removeItem(key); } catch (_) {} shell(); focusHeading(); }
      else if (target.hasAttribute('data-export')) { const blob = new Blob([exportRecord(family, unit, state)], { type: 'text/plain;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `ai-solutions-unit-${unit || 'general'}-${family}-practice.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
    };
    const input = event => { const t = event.target; if (t.hasAttribute('data-input') && t.type === 'range') applyInput(t); if (t.hasAttribute('data-reason')) { state.reason = text(t.value); save(); } if (t.hasAttribute('data-transfer')) { state.transfer = text(t.value); state.complete = false; element.querySelector('[data-next]').disabled = false; element.querySelector('[data-next]').textContent = 'Save and finish practice ✓'; element.querySelector('[data-finish-status]').textContent = 'Draft changed. Save and finish again when you are ready.'; save(); } };
    const change = event => {
      const t = event.target;
      if (t.hasAttribute('data-input')) applyInput(t);
      if (t.hasAttribute('data-prediction')) { state.prediction = Number(t.dataset.prediction); element.querySelector('[data-prediction-feedback]').textContent = config.predictionFeedback[state.prediction]; save(); }
      if (t.hasAttribute('data-decision')) { state.decision = Number(t.dataset.decision); state.complete = false; element.querySelector('[data-decision-feedback]').textContent = decisionFeedback(family, state.decision, state.inputs, unit); save(); }
      if (t.hasAttribute('data-include-tail')) { state.inputs.includeTail = t.checked; pause(); renderVisual(); save(); }
      if (t.hasAttribute('data-case')) { state.caseId = t.value; pause(); renderVisual(); save(); }
      if (t.hasAttribute('data-cohort-basis')) { state.cohortBasis = t.value === 'previous' ? 'previous' : 'invited'; state.frame = 1; pause(); renderVisual(); save(); }
      if (t.hasAttribute('data-policy')) { state.policy = t.value; pause(); renderVisual(); save(); }
    };
    const focusout = event => { if (event.target.type === 'number' && event.target.hasAttribute('data-input')) applyInput(event.target); };
    const keydown = event => {
      if (event.key === 'Enter' && event.target.type === 'number' && event.target.hasAttribute('data-input')) { event.preventDefault(); applyInput(event.target); }
      else if ((event.key === 'Enter' || event.key === ' ') && event.target.hasAttribute('data-record')) { event.preventDefault(); selectRecord(event.target.dataset.record); }
    };
    const visibility = () => { if (document.hidden) pause(); };
    const reduced = () => { pause(); const button = element.querySelector('[data-play]'); if (button) button.disabled = motion.matches; };
    element.addEventListener('click', click); element.addEventListener('input', input); element.addEventListener('change', change); element.addEventListener('focusout', focusout); element.addEventListener('keydown', keydown);
    document.addEventListener('visibilitychange', visibility); motion.addEventListener('change', reduced);
    shell();
    if ('ResizeObserver' in window) { resizeObserver = new ResizeObserver(entries => { const width = Math.round(entries[0].contentRect.width); if (width !== lastWidth) { lastWidth = width; if (state.stage === 1 && !disposed) renderVisual(); } }); resizeObserver.observe(element); }
    return { getState: () => restoreState(family, state), dispose() { pause(); disposed = true; resizeObserver?.disconnect(); element.removeEventListener('click', click); element.removeEventListener('input', input); element.removeEventListener('change', change); element.removeEventListener('focusout', focusout); element.removeEventListener('keydown', keydown); document.removeEventListener('visibilitychange', visibility); motion.removeEventListener('change', reduced); } };
  }
  function mountAll(scope = document) { return [...scope.querySelectorAll('[data-practice]')].map(mount).filter(Boolean); }
  return { VERSION, PRACTICE_EVIDENCE, WAIT_RECORDS, CASES, FUNNEL, evidence, quality, value, median, distributionData, dotPositions, qualityVisualData, cohortData, valueVisualData, chart, commitNumericInput, initialState, restoreState, storageKey, decisionFeedback, visualModel, exportRecord, mount, mountAll };
});
