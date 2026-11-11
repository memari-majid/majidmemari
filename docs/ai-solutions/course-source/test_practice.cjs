const test = require('node:test');
const assert = require('node:assert/strict');
const p = require('./assets/practice.js');
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} should equal ${expected}`);

test('discovery record totals, mean, median, and independent denominators agree', () => {
  const r = p.evidence();
  assert.equal(r.records.length, 8); assert.equal(r.total, 72); assert.equal(r.mean, 9); assert.equal(r.median, 6);
  assert.equal(r.count, 8); near(r.needRate, .75); near(r.pilotRate, .375); assert.equal(r.pilotAmongNeed, undefined);
});
test('changing or excluding the tail does not silently change discovery interview denominators', () => {
  const lower = p.evidence({ tail: 9 }), excluded = p.evidence({ includeTail: false });
  assert.equal(lower.total, 50); assert.equal(lower.mean, 6.25); assert.equal(lower.median, 6);
  assert.equal(excluded.total, 41); assert.equal(excluded.count, 7); near(excluded.mean, 41 / 7); assert.equal(excluded.median, 6);
  assert.equal(excluded.interviewed, 8); assert.equal(excluded.pilotRate, .375);
  assert.equal(p.evidence({ tail: 55 }).median, 6); assert.equal(p.evidence().records[7].minutes, 31);
});
test('same twelve cases reconcile every time and quality total', () => {
  const r = p.quality();
  assert.equal(r.cases.length, 12); assert.deepEqual(r.cases.filter(c => c.materialError).map(c => c.id), ['case-3', 'case-7', 'case-11']); assert.equal(r.cases.filter(c => c.materialError).length, 3);
  assert.deepEqual(r.policies.map(x => [x.minutes, x.acceptable, x.errors]), [[96, 12, 0], [24, 9, 3], [84, 12, 0]]);
  r.policies.forEach(x => assert.equal(x.acceptable + x.errors, 12));
  assert.equal(r.savedMinutes, 12); assert.equal(r.percentReduction, 12.5); near(r.capacityValue, 4.8); assert.equal(r.demonstratedCashSaving, 0);
});
test('six minutes of rework yields the exact plan example, not invented quality observations', () => {
  const r = p.quality({ rework: 6 });
  assert.equal(r.policies[2].minutes, 90); assert.equal(r.savedMinutes, 6); assert.equal(r.percentReduction, 6.25); near(r.capacityValue, 2.4);
  assert.equal(r.policies[2].acceptable, 12); assert.equal(r.policies[2].errors, 0);
});
test('review advantage disappears at twelve extra minutes and reverses after that', () => {
  assert.equal(p.quality({ rework: 12 }).savedMinutes, 0);
  const worse = p.quality({ rework: 24 });
  assert.equal(worse.savedMinutes, -12); assert.equal(worse.percentReduction, -12.5); near(worse.capacityValue, -4.8);
  assert.match(p.decisionFeedback('quality', 2, { rework: 24 }), /more than the manual/);
  assert.match(p.decisionFeedback('quality', 2, { rework: 12 }), /remove the time advantage/);
});
test('monthly defaults reconcile capacity, full recurring cost, and cash separately', () => {
  const r = p.value();
  assert.equal(r.assistedReplies, 600); assert.equal(r.minutesPerReply, 1); assert.equal(r.hours, 10); assert.equal(r.capacityValue, 240);
  assert.equal(r.toolCost, 180); assert.equal(r.supportCost, 60); assert.equal(r.recurringCost, 240);
  assert.equal(r.netCapacityValue, 0); assert.equal(r.cashChange, -240); assert.equal(r.breakEvenAdoption, 50);
});
test('zero adoption leaves the recurring cash cost in place', () => {
  const r = p.value({ adoption: 0 }); assert.equal(r.hours, 0); assert.equal(r.netCapacityValue, -240); assert.equal(r.cashChange, -240);
  const full = p.value({ adoption: 100 }); assert.equal(full.capacityValue, 480); assert.equal(full.netCapacityValue, 240); assert.equal(full.cashChange, -240);
});
test('break-even is conditional; slower work cannot become a positive time benefit by adoption', () => {
  const six = p.value({ rework: 6 }); assert.equal(six.hours, 5); assert.equal(six.capacityValue, 120); assert.equal(six.netCapacityValue, -120); assert.equal(six.breakEvenAdoption, 100);
  assert.equal(p.value({ rework: 12 }).breakEvenAdoption, null);
  assert.equal(p.value({ rework: 24, adoption: 100 }).hours, -20);
  assert.match(p.decisionFeedback('value', 2, { rework: 12 }), /No feasible adoption/);
  assert.ok(p.value({ toolCost: 600 }).breakEvenAdoption > 100);
});
test('adoption funnel preserves counts, invited denominator, and conditional rates', () => {
  const r = p.value();
  assert.deepEqual(r.funnel.map(x => x.count), [12, 9, 6, 4]);
  near(r.funnel[2].rate, .5); near(r.funnel[3].rate, 1 / 3); near(r.funnel[2].conditionalRate, 2 / 3); near(r.funnel[3].conditionalRate, 2 / 3);
  assert.equal(p.value({ adoption: 100 }).funnel[3].count, 4);
});
test('bad or extreme inputs remain finite and bounded', () => {
  assert.equal(p.evidence({ tail: Infinity }).tail, 31); assert.equal(p.evidence({ tail: -400 }).tail, 9);
  assert.equal(p.quality({ rework: 'no' }).rework, 0); assert.equal(p.quality({ rework: 999 }).rework, 24);
  const r = p.value({ volume: 99999, adoption: -50, rework: NaN, toolCost: Infinity });
  assert.equal(r.volume, 2400); assert.equal(r.adoption, 0); assert.equal(r.rework, 0); assert.equal(r.toolCost, 180);
  ['hours', 'capacityValue', 'recurringCost', 'netCapacityValue', 'cashChange'].forEach(key => assert.ok(Number.isFinite(r[key])));
});
test('restoring drafts validates the version, numeric inputs, choices, text bounds, and scene bounds', () => {
  const initial = p.initialState('quality'); assert.deepEqual(p.restoreState('quality', { version: 1, rework: 20 }), initial);
  const r = p.restoreState('quality', { version: 2, stage: 99, frame: -4, prediction: 400, decision: 1, inputs: { rework: 200 }, reason: 'x'.repeat(2000), transfer: { bad: 'object' }, policy: '__proto__', caseId: 'fake', complete: 'true' });
  assert.equal(r.stage, 3); assert.equal(r.frame, 0); assert.equal(r.prediction, null); assert.equal(r.decision, 1); assert.equal(r.inputs.rework, 24); assert.equal(r.reason.length, 1800); assert.equal(r.transfer, ''); assert.equal(r.policy, 'reviewed'); assert.equal(r.caseId, 'case-1'); assert.equal(r.complete, false);
  assert.deepEqual(p.restoreState('evidence', null), p.initialState('evidence'));
});
test('unit and family persistence keys are isolated from old course versions', () => {
  assert.notEqual(p.storageKey('quality', 4), p.storageKey('quality', 6)); assert.notEqual(p.storageKey('value', 7), p.storageKey('quality', 7));
  assert.equal(p.storageKey('quality', 6), 'ai-solutions:v2:practice:6:quality');
  assert.equal(p.storageKey('quality', '<script>'), 'ai-solutions:v2:practice:script:quality');
});
test('every visual fits its declared scale throughout allowed controls', () => {
  for (const family of ['evidence', 'quality', 'value']) for (const extremes of [false, true]) {
    const s = p.initialState(family);
    s.inputs = family === 'evidence' ? { tail: extremes ? 55 : 9, includeTail: !extremes } : family === 'quality' ? { rework: extremes ? 24 : 0 } : { volume: 2400, adoption: 100, rework: extremes ? 24 : 0, toolCost: 600 };
    for (let frame = 0; frame <= 3; frame++) { s.frame = frame; const v = p.visualModel(family, s, family === 'quality' ? '6' : '8'); v.rows.forEach(row => { assert.ok(row.amount >= v.domain[0] && row.amount <= v.domain[1], `${family} frame${frame}: ${row.amount} beyond ${v.domain}`); assert.ok(Number.isFinite(row.amount)); }); }
  }
});
test('workflow trace exposes the unsupported promise and the chosen human handoff', () => {
  const s = p.initialState('quality'); s.caseId = 'case-3'; s.frame = 5;
  let v = p.visualModel('quality', s, '4'); assert.equal(v.rows.length, 6); assert.match(v.rows[2].note, /automatically qualifies for a full refund/); assert.match(v.rows[4].note, /owner/); assert.match(v.rows[5].note, /unsupported promise is removed/);
  s.policy = 'unchecked'; v = p.visualModel('quality', s, '4'); assert.match(v.rows[3].note, /skips/); assert.match(v.rows[5].note, /material error reaches/); assert.equal(v.rows[5].role, 'error');
});
test('linked quality comparison progressively reveals the same three policies', () => {
  const s = p.initialState('quality'); s.inputs.rework = 6;
  const counts = []; for (let i = 0; i < 4; i++) { s.frame = i; counts.push(p.visualModel('quality', s, '6').rows.length); }
  assert.deepEqual(counts, [1, 2, 3, 3]);
  const v = p.visualModel('quality', s, '6'); assert.equal(v.rows[2].amount, 90); assert.equal(v.rows[2].acceptable, 12); assert.equal(v.rows[2].errors, 0);
});
test('export carries changed inputs, evidence limits, reasoning, and project transfer', () => {
  const s = p.initialState('value'); s.inputs.adoption = 0; s.prediction = 1; s.decision = 2; s.reason = 'Payroll is fixed.'; s.transfer = 'Track actual use before a wider pilot.';
  const output = p.exportRecord('value', '8', s);
  assert.match(output, /Changed inputs are scenarios/); assert.match(output, /adoption: 0/); assert.match(output, /Recurring cash change: −\$240/); assert.match(output, /Payroll is fixed/); assert.match(output, /Track actual use/); assert.match(output, /Separate from processing cases/);
});
test('published teaching anchors agree with the executable calculations', () => {
  const e = p.PRACTICE_EVIDENCE;
  assert.equal(e.evidence.total, p.evidence().total); assert.equal(e.evidence.mean, p.evidence().mean);
  assert.deepEqual(e.quality.policies, p.quality().policies); near(e.quality.capacityValue, p.quality().capacityValue);
  assert.equal(e.value.netCapacityValue, p.value().netCapacityValue); assert.equal(e.value.cashChange, p.value().cashChange);
});

test('Unit 7 keeps the 14-day cohort separate from monthly economics', () => {
  const state = p.initialState('value'); state.frame = 1;
  const invited = p.visualModel('value', state, '7');
  assert.equal(invited.rows[1].amount, 50); assert.match(invited.rows[1].note, /6\/12/); assert.match(invited.rows[1].note, /14 days/);
  state.cohortBasis = 'previous';
  const conditional = p.visualModel('value', state, '7');
  near(conditional.rows[1].amount, 100 * 6 / 9); assert.match(conditional.rows[1].note, /6\/9/);
  state.frame = 2;
  const groups = p.visualModel('value', state, '7'); assert.equal(groups.rows.reduce((a, r) => a + r.amount, 0), 12);
  assert.deepEqual(groups.rows.map(r => r.amount), [3, 3, 2, 4]);
  const output = p.exportRecord('value', '7', state);
  assert.match(output, /14 days after invitation/); assert.match(output, /only the displayed denominator changes/);
  assert.doesNotMatch(output, /toolCost:|Recurring cash change:|Capacity:|Assisted replies:/);
  assert.doesNotMatch(p.decisionFeedback('value', 2, state.inputs, '7'), /\$|break-even/i);
  assert.equal(p.value().observationWindowDays, 14);
});
test('excluding an inconvenient discovery wait preserves its original figure record', () => {
  const state = p.initialState('evidence'); state.inputs.includeTail = false;
  const figure = p.visualModel('evidence', state, '2');
  assert.equal(figure.rows[7].amount, 31); assert.equal(figure.rows[7].excluded, true); assert.match(figure.rows[7].note, /Excluded/);
  assert.ok(figure.metrics.some(([label]) => label === 'Total waiting time'));
});

test('explicit numeric commits update a complete model without mutating the previous input', () => {
  const prior = { tail: 32, includeTail: true };
  const next = p.commitNumericInput('evidence', prior, 'tail', '47');
  assert.equal(next.tail, 47); assert.equal(prior.tail, 32);
  assert.equal(p.evidence(next).total, 88); assert.equal(p.evidence(next).mean, 11);
  assert.equal(p.commitNumericInput('quality', { rework: 0 }, 'rework', '6').rework, 6);
  assert.equal(p.commitNumericInput('value', p.initialState('value').inputs, 'adoption', '47').adoption, 45);
});
test('empty or invalid numeric commits preserve the last valid value for display resynchronization', () => {
  const prior = { tail: 47, includeTail: true };
  for (const raw of ['', ' ', '-', '1e', 'not a number', Infinity]) assert.deepEqual(p.commitNumericInput('evidence', prior, 'tail', raw), prior);
  assert.equal(p.commitNumericInput('evidence', prior, 'tail', '1000').tail, 55);
  assert.equal(p.commitNumericInput('evidence', prior, 'tail', '-3').tail, 9);
  assert.deepEqual(p.commitNumericInput('evidence', prior, 'not-a-control', '3'), prior);
});

test('dot distribution preserves every record and identifies the correct median positions', () => {
  const baseline = p.distributionData(p.evidence());
  assert.deepEqual(baseline.middleIds, ['wait-4', 'wait-5']);
  const changed = p.distributionData(p.evidence({ tail: 47 }));
  assert.equal(changed.total, 88); assert.equal(changed.mean, 11); assert.equal(changed.median, 6); assert.equal(changed.originalMean, 9);
  assert.deepEqual(p.distributionData(p.evidence({ includeTail: false })).middleIds, ['wait-4']);
  for (const width of [260, 366, 700, 1000]) {
    const dots = p.dotPositions(p.evidence().records, width);
    assert.equal(dots.length, 8); assert.equal(new Set(dots.map(x => x.id)).size, 8);
    dots.forEach(dot => { assert.ok(dot.x >= 10 && dot.x <= width - 10); assert.ok(dot.y >= 60 && dot.y <= 230); });
    for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) assert.ok(Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y) >= 20, 'Numbered dots must not overlap');
  }
});
test('quality matrix, added rework, and the effort target remain distinct', () => {
  const state = p.initialState('quality'); state.frame = 3; state.inputs.rework = 6;
  const model = p.visualModel('quality', state, '6');
  assert.equal(model.kind, 'quality'); assert.equal(model.quality.targetMinutes, 86.4);
  const reviewed = model.quality.policies.find(x => x.id === 'reviewed');
  assert.equal(reviewed.baseMinutes, 84); assert.equal(reviewed.extraMinutes, 6); assert.equal(reviewed.minutes, 90); assert.equal(reviewed.errors, 0); assert.ok(reviewed.minutes > model.quality.targetMinutes);
  assert.equal(model.linkedRecords.length, 12); assert.match(model.linkedRecords.find(x => x.id === 'case-3').case.fact, /Under 24/);
  assert.deepEqual(model.quality.cases.filter(x => x.materialError).map(x => x.id), ['case-3', 'case-7', 'case-11']);
});
test('human authority is independent of whether the draft contains a material error', () => {
  assert.deepEqual(p.CASES.filter(c => c.requiresOwnerReview).map(c => c.id), ['case-3', 'case-6', 'case-7', 'case-11', 'case-12']);
  const state = p.initialState('quality'); state.frame = 5;
  for (const id of ['case-6', 'case-12']) {
    state.caseId = id; const model = p.visualModel('quality', state, '4');
    assert.equal(model.case.materialError, false); assert.match(model.rows[4].note, /owner handoff/); assert.match(model.rows[5].note, /no exception has been authorized/);
  }
  state.caseId = 'case-1'; state.policy = 'unchecked';
  assert.match(p.visualModel('quality', state, '4').rows[5].note, /no source check was performed/);
});
test('cohort geometry keeps the same people and makes conditional denominators explicit', () => {
  const all = p.cohortData('invited'), previous = p.cohortData('previous');
  assert.deepEqual(all.stages.map(x => x.denominator), [12, 12, 12, 12]);
  assert.deepEqual(previous.stages.map(x => x.denominator), [12, 12, 9, 6]);
  assert.deepEqual(all.stages.map(x => x.count), previous.stages.map(x => x.count));
  assert.equal(previous.windowDays, 14); assert.equal(previous.groups.reduce((a, g) => a + g.count, 0), 12);
  const positions = previous.groups.flatMap(g => Array.from({ length: g.count }, (_, i) => g.start + i));
  assert.equal(new Set(positions).size, 12); assert.deepEqual([...positions].sort((a, b) => a - b), Array.from({ length: 12 }, (_, i) => i));
});
test('the waterfall reconciles cumulative balances without adding cash to capacity', () => {
  const visual = p.valueVisualData(p.value());
  assert.deepEqual(visual.segments.map(x => [x.id, x.start, x.end]), [['capacity', 0, 240], ['tools', 240, 60], ['support', 60, 0], ['net', 0, 0]]);
  assert.equal(visual.cashChange, -240); assert.equal(visual.segments.some(x => x.id === 'cash'), false);
  assert.equal(visual.curve.find(x => x.adoption === 75).net, 120);
  assert.equal(visual.curve.find(x => x.adoption === 50).net, 0); assert.equal(visual.breakEvenVisible, true);
});
test('sensitivity uses the same model at every point and a stable scale across adoption changes', () => {
  for (const rework of [0, 6, 12, 24]) for (const toolCost of [0, 180, 600]) {
    const first = p.valueVisualData(p.value({ rework, toolCost, adoption: 0 }));
    const last = p.valueVisualData(p.value({ rework, toolCost, adoption: 100 }));
    assert.deepEqual(first.dollarDomain, last.dollarDomain);
    first.curve.forEach(point => near(point.net, p.value({ rework, toolCost, adoption: point.adoption }).netCapacityValue));
    const [low, high] = first.dollarDomain;
    assert.ok(first.curve.every(point => point.net >= low && point.net <= high));
    assert.ok(first.cashChange >= low && first.cashChange <= high);
    if (rework >= 12) assert.equal(first.breakEvenVisible, false);
  }
});
test('specialized renderers produce labeled unique SVGs with linked case and value data', () => {
  const specs = [['evidence', '2', 2], ['quality', '4', 5], ['quality', '6', 3], ['value', '7', 1], ['value', '8', 3]];
  const ids = [];
  for (const [family, unit, frame] of specs) {
    const state = p.initialState(family); state.frame = frame;
    const model = p.visualModel(family, state, unit), markup = p.chart(model, `test-${family}-${unit}`, null, 366);
    assert.match(markup, /<svg/); assert.match(markup, /<title id=/); assert.match(markup, /<desc id=/);
    assert.doesNotMatch(markup, /NaN|Infinity/);
    for (const match of markup.matchAll(/(?:^|\s)id="([^"]+)"/g)) ids.push(match[1]);
    if (unit === '6') { assert.match(markup, /86\.4 min/); assert.match(markup, /data-record="case-3"/); assert.match(markup, /data-policy-id="reviewed"/); }
    if (unit === '8') { assert.match(markup, /data-table-row="adoption-75"/); assert.match(markup, /\$0 demonstrated expense avoided/); assert.match(markup, /−\$240/); }
  }
  assert.equal(new Set(ids).size, ids.length, 'SVG ids must not collide across the five embedded activities');
});
test('the capacity chain links the same quantities and units to its figure data', () => {
  const state = p.initialState('value'); state.frame = 2;
  const model = p.visualModel('value', state, '8');
  assert.deepEqual(model.displayRows.map(r => [r.id, r.amount, r.valueUnit]), [['monthly-volume', 1200, 'replies / month'], ['assisted-count', 600, 'replies / month'], ['released-hours', 10, 'hours / month']]);
  assert.equal(model.displayRows.every(r => model.linkedRecords.some(x => x.id === r.id)), true);
});

test('unrevealed policies are explanations, not inoperative keyboard buttons', () => {
  const state = p.initialState('quality'); state.frame = 0;
  const markup = p.chart(p.visualModel('quality', state, '6'), 'placeholder-check', null, 366);
  assert.match(markup, /data-record="manual"/);
  assert.doesNotMatch(markup, /data-record="unchecked"|data-record="reviewed"/);
  assert.match(markup, /placeholder-unchecked/);
});

test('prediction is recorded only on reveal, survives later edits, and supports an explicit skip', () => {
  const draft = p.initialState('quality'); draft.prediction = 2; draft.reason = 'Check the full process.';
  assert.equal(draft.predictionRecord, null);
  const revealed = p.revealPrediction('quality', draft, '6');
  assert.deepEqual(revealed.predictionRecord, { choice: 2, reason: 'Check the full process.', skipped: false, fromEarlierDraft: false });
  revealed.prediction = 0; revealed.reason = 'Hindsight';
  const revisited = p.revealPrediction('quality', revealed, '6');
  assert.equal(revisited.predictionRecord.choice, 2); assert.equal(revisited.predictionRecord.reason, 'Check the full process.');
  const skipped = p.revealPrediction('evidence', p.initialState('evidence'), '2');
  assert.equal(skipped.predictionRecord.skipped, true); assert.match(p.recordStatus(skipped), /prediction skipped/);
});

test('committing freezes the original settings and reason independently of later exploration', () => {
  const draft = p.initialState('value'); draft.inputs.adoption = 75; draft.decision = 2; draft.decisionReason = 'Use a bounded pilot.';
  const committed = p.commitDecision('value', draft, '8');
  assert.equal(draft.commitment, null); assert.equal(committed.challengeRevealed, true);
  draft.inputs.adoption = 0; committed.inputs.adoption = 30; committed.decision = 0; committed.decisionReason = 'Changed';
  const again = p.commitDecision('value', committed, '8');
  assert.equal(again.commitment.settings.inputs.adoption, 75); assert.equal(again.commitment.choice, 2); assert.equal(again.commitment.reason, 'Use a bounded pilot.');
  const none = p.commitDecision('value', p.initialState('value'), '8'); assert.equal(none.commitment, null); assert.equal(none.challengeRevealed, false);
});

test('each new worked contrast reconciles its figure values, exact totals and evidence boundary', () => {
  const discovery = p.challengeModel('evidence', '2');
  assert.deepEqual(discovery.rows.map(r => r.value), [9, 11]);
  assert.deepEqual(discovery.rows.map(r => r.cells), [['72 min', '9 min', '6 min', '8/8'], ['88 min', '11 min', '6 min', '8/8']]);
  const workflow = p.challengeModel('quality', '4'); assert.deepEqual(workflow.rows.map(r => r.value), [1, 0]); assert.match(workflow.limit, /does not estimate a future error rate/);
  const quality = p.challengeModel('quality', '6'); assert.deepEqual(quality.rows.map(r => r.value), [84, 90]); assert.equal(quality.target.value, 86.4);
  assert.deepEqual(quality.rows.map(r => r.cells[1]), ['12.5%', '6.25%']); assert.ok(quality.rows.every(r => r.cells[2] === '0 / 12'));
  const cohort = p.challengeModel('value', '7'); assert.equal(cohort.rows[0].value, 50); near(cohort.rows[1].value, 100 * 6 / 9); assert.deepEqual(cohort.rows.map(r => r.cells[1]), ['12', '9']);
  const economics = p.challengeModel('value', '8'); assert.deepEqual(economics.rows.map(r => r.value), [0, -96]);
  assert.deepEqual(economics.rows.map(r => r.cells), [['600', '10 h', '$0', '−$240'], ['360', '6 h', '−$96', '−$240']]);
});

test('zero comparison results have zero bar width and figures retain their matching table', () => {
  for (const [family, unit] of [['quality', '4'], ['value', '8']]) {
    const markup = p.challengeMarkup(p.challengeModel(family, unit), `zero-${unit}`, null);
    assert.match(markup, /width:0%/); assert.match(markup, /<table>/);
    assert.equal([...markup.matchAll(/data-challenge-row=/g)].length, 2);
    assert.equal([...markup.matchAll(/data-challenge-select=/g)].length, 4);
    assert.doesNotMatch(markup, /NaN|Infinity/);
  }
});

test('retaining a wrong recommendation gets an explanation without blocking study progress', () => {
  const draft = p.initialState('quality'); draft.decision = 0;
  let state = p.commitDecision('quality', draft, '6'); state.revisionMode = 'retain'; state.revisionReason = 'I still favor speed.';
  state = p.saveRevision('quality', state, '6');
  assert.equal(state.finalDecision.choice, 0); assert.match(p.challengeFeedback('quality', '6', 0), /material errors/);
  assert.match(p.recordStatus(state), /study marker, not a grade or proof of mastery/);
  assert.match(p.recordStatus(state), /project transfer not drafted/);
});

test('revision permits a new operating decision rather than another multiple-choice distractor', () => {
  const draft = p.initialState('quality'); draft.decision = 2;
  let state = p.commitDecision('quality', draft, '6');
  state.revisionMode = 'revise'; state.revisionRecommendation = 'Keep manual processing while we narrow the scope and retest the reviewed workflow.';
  assert.equal(p.saveRevision('quality', state, '6').finalDecision, null, 'A recommendation without an evidence reason remains a draft');
  state.revisionReason = '90 minutes misses the predeclared 86.4-minute effort boundary.';
  state = p.saveRevision('quality', state, '6');
  assert.equal(state.finalDecision.choice, null); assert.equal(state.finalDecision.recommendation, state.revisionRecommendation); assert.equal(state.commitment.choice, 2);
  assert.match(p.challengeFeedback('quality', '6', state.finalDecision.choice), /not automatically judged/);
  const restored = p.restoreState('quality', JSON.parse(JSON.stringify(state)), '6'); assert.deepEqual(restored.finalDecision, state.finalDecision);
  const output = p.exportRecord('quality', '6', restored); assert.match(output, /Keep manual processing/); assert.match(output, /90 minutes misses/); assert.match(output, /ORIGINAL COMMITTED DECISION/);
});

test('legacy Unit 4 choice indices are preserved as old text, never relabeled as authority answers', () => {
  const old = { version: 2, stage: 2, prediction: 1, decision: 2, reason: 'Original note', transfer: 'Keep the reviewer visible.', complete: true };
  const migrated = p.restoreState('quality', old, '4');
  assert.equal(migrated.prediction, null); assert.equal(migrated.decision, null);
  assert.match(migrated.legacyChoices.prediction, /manual process/); assert.match(migrated.legacyChoices.decision, /bounded reviewed pilot/);
  assert.equal(migrated.reason, 'Original note'); assert.equal(migrated.transfer, 'Keep the reviewer visible.'); assert.equal(migrated.complete, true);
  assert.equal(migrated.commitment, null); assert.equal(migrated.predictionRecord, null); assert.equal(migrated.finalDecision, null);
  const reloaded = p.restoreState('quality', JSON.parse(JSON.stringify(migrated)), '4'); assert.deepEqual(reloaded.legacyChoices, migrated.legacyChoices);
  assert.match(p.exportRecord('quality', '4', reloaded), /DIFFERENT QUESTIONS, NOT MAPPED/);
});

test('other legacy drafts and changed-dataset notes survive without synthesized commitments', () => {
  for (const [family, unit] of [['evidence', '2'], ['quality', '6'], ['value', '7'], ['value', '8']]) {
    const state = p.restoreState(family, { version: 2, prediction: 1, decision: 2, reason: 'Saved reasoning', transfer: 'Saved project note' }, unit);
    assert.equal(state.prediction, 1); assert.equal(state.decision, 2); assert.equal(state.reason, 'Saved reasoning'); assert.equal(state.commitment, null);
    const changed = p.commitDecision(family, state, unit); changed.datasetVersion = 'unrecognized'; changed.decisionReason = 'Still keep this note';
    const safe = p.restoreState(family, changed, unit); assert.equal(safe.commitment, null); assert.equal(safe.finalDecision, null); assert.equal(safe.transfer, 'Saved project note'); assert.equal(safe.decisionReason, 'Still keep this note');
  }
});

test('restored commitments and revisions bound text, validate meaning, and escape HTML on rendering', () => {
  const draft = p.initialState('quality'); draft.decision = 1; draft.decisionReason = '<img src=x onerror=alert(1)>';
  let state = p.commitDecision('quality', draft, '4'); state.revisionMode = 'revise'; state.revisionRecommendation = 'x'.repeat(2000); state.revisionReason = '<script>alert(1)</script>';
  state = p.saveRevision('quality', state, '4'); assert.equal(state.finalDecision.recommendation.length, 1800);
  let markup = p.decisionStageMarkup('quality', '4', state, 'escape'); assert.doesNotMatch(markup, /<img src=x|<script>/); assert.match(markup, /&lt;img/);
  state.finalDecision = { mode: 'retain', choice: 2, reason: 'Tampered' };
  assert.equal(p.restoreState('quality', state, '4').finalDecision, null, 'Retain cannot silently switch the committed choice');
});

test('fixed challenge feedback does not mislabel challenge assumptions as live exploration', () => {
  const state = p.initialState('value'); state.inputs.adoption = 100; state.decision = 2;
  const committed = p.commitDecision('value', state, '8'); committed.revisionMode = 'retain'; committed.revisionReason = 'We need stronger adoption evidence.';
  const saved = p.saveRevision('value', committed, '8');
  const feedback = p.challengeFeedback('value', '8', saved.finalDecision.choice);
  assert.match(feedback, /fixed worked challenge/); assert.match(feedback, /−\$96/); assert.doesNotMatch(feedback, /Your scenario|At your setting/);
  assert.equal(saved.inputs.adoption, 100); assert.equal(saved.commitment.settings.inputs.adoption, 100);
});

test('captions and next-action guidance describe the current rework and adoption state', () => {
  const quality = p.initialState('quality'); quality.frame = 3; quality.inputs.rework = 12;
  assert.match(p.visualModel('quality', quality, '6').caption, /12 extra minutes/); assert.match(p.visualModel('quality', quality, '6').caption, /96 minutes/);
  assert.match(p.explorationHint('quality', quality, '6'), /boundary is missed/);
  const economics = p.initialState('value'); economics.frame = 3; economics.inputs.adoption = 30;
  assert.match(p.explorationHint('value', economics, '8'), /30%/); assert.match(p.explorationHint('value', economics, '8'), /−\$96/);
  const discovery = p.initialState('evidence'); discovery.inputs.tail = 47;
  assert.match(p.explorationHint('evidence', discovery, '2'), /total 88 minutes/); assert.doesNotMatch(p.explorationHint('evidence', discovery, '2'), /Change the tail to 47/);
});
