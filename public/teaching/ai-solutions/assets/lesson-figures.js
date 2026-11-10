/* Original compact visual explanations. No network, storage, or grading. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.AISolutionsFigures = api;
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', () => api.mountAll(), { once: true });
    else api.mountAll();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '1.0.0';
  const clamp = (value, low, high, fallback) => { const n = Number(value); return Number.isFinite(n) ? Math.max(low, Math.min(high, Math.round(n))) : fallback; };
  const esc = value => readableText(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const number = value => Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const dollars = value => `${value < 0 ? '−' : ''}$${number(Math.abs(value))}`;
  const percent = value => `${number(value * 100)}%`;

  function effortModel(stage = 0, checking = 3) {
    stage = clamp(stage, 0, 3, 0); checking = Number(checking) === 2 ? 2 : 3;
    const components = [{ label: 'Draft', minutes: 2, tone: 'blue' }, { label: 'Source checking', minutes: checking, tone: 'teal' }, { label: 'Correction', minutes: 2, tone: 'amber' }, { label: 'Handoff', minutes: 1, tone: 'navy' }];
    const visible = components.slice(0, stage + 1), full = components.reduce((s, x) => s + x.minutes, 0), shown = visible.reduce((s, x) => s + x.minutes, 0);
    return { stage, checking, components, visible, full, shown, manual: 8, complete: stage === 3, reduction: (8 - full) / 8 };
  }

  const REPAIR_CASES = [
    { label: 'Ordinary · 96 hours', expected: 'Refund eligibility', code: 'refund' },
    { label: 'Incomplete · timing absent', expected: 'Ask for timing', code: 'ask' },
    { label: 'Exception · 8 hours', expected: 'Owner review', code: 'owner' },
    { label: 'New boundary · exactly 24 hours', expected: '90-day credit', code: 'credit' }
  ];
  function repairModel(stage = 0) {
    stage = clamp(stage, 0, 4, 0);
    const cases = REPAIR_CASES.slice(0, stage >= 3 ? 4 : 3).map((c, i) => {
      const actual = i === 1 && stage >= 1 ? 'ask' : i === 2 && stage >= 2 ? 'owner' : i === 3 && stage >= 4 ? 'credit' : 'refund';
      return { ...c, actual, output: ({ refund: 'Refund eligibility', ask: 'Ask for timing', owner: 'Owner review', credit: '90-day credit' })[actual], pass: actual === c.code };
    });
    return { stage, cases, total: cases.length, passed: cases.filter(c => c.pass).length };
  }

  function offerModel(extraRevision = false) {
    const extra = extraRevision === true, price = 180, cashExpense = 12, hours = 4.5 + (extra ? 1 : 0), hourValue = 24, timeValue = hours * hourValue, contribution = price - cashExpense - timeValue, capacityHours = 15, packages = Math.floor(capacityHours / hours);
    return { extra, price, cashExpense, hours, hourValue, timeValue, contribution, cashBeforeOwnerTime: price - cashExpense, capacityHours, packages, unusedHours: capacityHours - packages * hours };
  }

  function funnelModel(stage = 0, paying = 3, basis = 'all') {
    stage = clamp(stage, 0, 3, 0); paying = Number(paying) === 5 ? 5 : 3; basis = basis === 'previous' ? 'previous' : 'all';
    const all = [{ label: 'Reached', count: 100 }, { label: 'Qualified conversations', count: 20 }, { label: 'Agreed pilot next steps', count: 5 }, { label: 'New paying customers', count: paying }];
    const rows = all.slice(0, stage + 1).map((row, i) => ({ ...row, denominator: basis === 'previous' && i > 0 ? all[i - 1].count : 100, rate: row.count / (basis === 'previous' && i > 0 ? all[i - 1].count : 100) }));
    return { stage, paying, basis, rows, current: rows[rows.length - 1], acquisitionValue: 270, acquisitionCash: 150, acquisitionHours: 5, cac: stage === 3 ? 270 / paying : null, contribution: stage === 3 ? 60 - 270 / paying : null };
  }

  function queueModel(days = 0, policy = 'standard') {
    days = clamp(days, 0, 5, 0); policy = ['standard', 'capacity', 'intake'].includes(policy) ? policy : 'standard';
    const arriving = 30, accepted = policy === 'intake' ? 24 : 30, capacity = policy === 'capacity' ? 30 : 24, reviewMinutes = 5, rows = [];
    let queued = 0, reviewed = 0, deferred = 0;
    for (let day = 1; day <= days; day += 1) {
      const completed = Math.min(queued + accepted, capacity); queued += accepted - completed; reviewed += completed; deferred += arriving - accepted;
      rows.push({ day, arriving, accepted, reviewed: completed, queued, deferred: arriving - accepted });
    }
    const extraMinutes = policy === 'capacity' ? 30 * days : 0;
    return { days, policy, rows, arriving: arriving * days, accepted: accepted * days, reviewed, queued, deferred, capacity, reviewMinutes, dailyReviewMinutes: capacity * reviewMinutes, extraMinutes, extraTimeValue: extraMinutes / 60 * 24 };
  }

  function chartModel(axis = 0) {
    axis = Number(axis) === 80 ? 80 : 0;
    return { axis, manual: 96, assisted: 84, reduction: 12 / 96, visibleManual: 96 - axis, visibleAssisted: 84 - axis, visibleReduction: 1 - (84 - axis) / (96 - axis), range: 100 - axis };
  }

  function table(caption, headers, rows) {
    return `<div class="lesson-figure-table" tabindex="0" role="region" aria-label="${esc(caption)}"><table><caption>${esc(caption)}</caption><thead><tr>${headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, i) => i === 0 ? `<th scope="row">${esc(cell)}</th>` : `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function svg(id, title, description, body, height = 200) {
    return `<div class="lesson-figure-chart" tabindex="0" role="region" aria-label="${esc(title)}; matching data table follows"><svg viewBox="0 0 720 ${height}" role="img" aria-labelledby="${id}-svg-title ${id}-svg-description"><title id="${id}-svg-title">${esc(title)}</title><desc id="${id}-svg-description">${esc(description)}</desc>${body}</svg></div>`;
  }
  const button = (action, label, disabled = false, pressed) => `<button type="button" data-lf-action="${action}"${disabled ? ' disabled' : ''}${pressed === undefined ? '' : ` aria-pressed="${pressed}"`}>${esc(label)}</button>`;
  const insight = (text, tone = 'supported') => `<p class="lesson-figure-insight${tone === 'caution' ? ' lf-caution' : ''}">${esc(text)}</p>`;
  const status = text => `<p data-lf-status-message hidden>${esc(text)}</p>`;
  const reset = () => button('reset', 'Reset figure');
  const legend = items => `<div class="lesson-figure-legend">${items.map(([tone, text]) => `<span><i class="lf-bg-${tone}" aria-hidden="true"></i>${esc(text)}</span>`).join('')}</div>`;

  function renderEffort(state, id) {
    const r = effortModel(state.stage, state.checking), x = 185, scale = 50;
    let cursor = x;
    const segments = r.visible.map(c => { const start = cursor; cursor += c.minutes * scale; return `<rect x="${start}" y="94" width="${c.minutes * scale}" height="36" class="lf-fill-${c.tone}"/><text x="${start + c.minutes * scale / 2}" y="117" text-anchor="middle" class="lf-on-${c.tone}">${c.minutes}</text>`; }).join('');
    const grid = [0, 2, 4, 6, 8].map(v => `<line x1="${x + v * scale}" x2="${x + v * scale}" y1="25" y2="145" class="lf-grid"/><text x="${x + v * scale}" y="165" text-anchor="middle">${v}</text>`).join('');
    const chart = svg(id, 'Complete effort per reply', `Manual task:8 minutes. Assisted components revealed:${r.visible.map(c => `${c.label} ${c.minutes} minutes`).join(', ')}. ${r.complete ? `Complete assisted effort ${r.full} minutes.` : `${r.shown} minutes shown so far; the assisted task is incomplete.`}`, `${grid}<text x="12" y="59">Manual · complete</text><rect x="${x}" y="35" width="400" height="36" class="lf-fill-reference"/><text x="600" y="59">8 min</text><text x="12" y="117">Assisted · ${r.complete ? 'complete' : 'partial'}</text>${segments}<text x="${cursor + 12}" y="117">${r.shown} min${r.complete ? '' : ' so far'}</text><text x="385" y="192" text-anchor="middle">Minutes per reply · zero baseline</text>`);
    const labels = ['Reveal source checking', 'Reveal correction', 'Reveal handoff'];
    return `<div class="lesson-figure-controls">${state.stage < 3 ? button('next', labels[state.stage]) : button('check', state.checking === 3 ? 'Suppose checking takes 2 minutes' : 'Restore 3-minute checking')}${reset()}</div>${chart}${legend([['blue','Draft'],['teal','Source checking'],['amber','Correction'],['navy','Handoff']])}${table('Same components as the figure', ['Work', 'Minutes'], [['Manual complete task', 8], ...r.visible.map(c => [c.label, c.minutes]), [r.complete ? 'Assisted complete task' : 'Assisted subtotal — incomplete', r.shown]])}${status(r.complete ? `Complete assisted effort:${r.full} minutes. Reduction versus8 minutes:${percent(r.reduction)}.` : `${r.shown} minutes are visible, but not all work is shown. Predict the next component.`)}${insight(r.complete ? r.checking === 3 ? 'The2-minute draft needs6more minutes around it. Draft speed alone has produced no complete-task gain.' : 'This is a hypothetical one-minute saving, only if shorter checking preserves quality. Measure that assumption; the control does not establish it.' : 'Do not compare a partial assisted subtotal with the complete manual task. The missing work must remain visible.')}`;
  }

  function renderRepair(state) {
    const r = repairModel(state.stage);
    const steps = ['Initial prototype:refund eligibility for every input.', 'Repair1:ask for missing timing before choosing a policy.', 'Repair2:route under24-hour exceptions to the owner.', 'New test:exactly24hours belongs to the credit window.', 'Repair3:use90-day credit from24to under72hours.'];
    const next = ['Require the missing time', 'Add the late-exception rule', 'Reveal a new boundary case', 'Add the credit-window rule'];
    const matrix = `<div class="lesson-figure-table" tabindex="0" role="region" aria-label="Supplied prototype tests and repair results"><table><caption>Supplied prototype tests · ${r.passed}/${r.total} pass</caption><thead><tr><th scope="col">Test input</th><th scope="col">Expected</th><th scope="col">Prototype output</th><th scope="col">Result</th></tr></thead><tbody>${r.cases.map(c => `<tr class="${c.pass ? 'lf-pass' : 'lf-fail'}"><th scope="row">${esc(c.label)}</th><td>${esc(c.expected)}</td><td>${esc(c.output)}</td><td><span class="lesson-figure-result">${c.pass ? '✓ Pass' : '× Needs repair'}</span></td></tr>`).join('')}</tbody></table></div>`;
    return `<div class="lesson-figure-controls">${state.stage < 4 ? button('next', next[state.stage]) : button('next', 'All four supplied cases checked', true)}${reset()}</div><p class="lesson-figure-rule"><strong>Current rule:</strong> ${esc(steps[state.stage])}</p>${matrix}${status(`${r.passed} of${r.total} supplied cases pass. ${state.stage === 3 ? 'The denominator increased because a fourth case was added.' : ''}`)}${insight(state.stage === 2 ? 'Three passes do not mean every boundary is covered. Predict what happens at exactly24hours before revealing it.' : state.stage === 3 ? 'The earlier cases still pass. The newly tested24-hour boundary exposes a missing credit rule; do not hide it in the old3/3 score.' : state.stage === 4 ? 'Retesting confirms these four supplied cases after the repair. It does not establish universal reliability or replace your actual reviewer’s test record.' : 'A repair should address a specific defect while preserving the cases that already work. Follow the source condition rather than adding a confident sentence.')}`;
  }

  function renderOffer(state, id) {
    const r = offerModel(state.extra), pieces = [{ label: 'Cash expense', value: r.cashExpense, tone: 'amber' }, { label: 'Owner time value', value: r.timeValue, tone: 'navy' }, { label: 'Contribution', value: r.contribution, tone: 'teal' }];
    let x = 60;
    const bars = pieces.map(p => { const start = x; x += p.value * 3.2; return `<rect x="${start}" y="58" width="${p.value * 3.2}" height="48" class="lf-fill-${p.tone}"/>${p.value > 20 ? `<text x="${start + p.value * 1.6}" y="88" text-anchor="middle" class="lf-on-${p.tone}">${dollars(p.value)}</text>` : ''}`; }).join('');
    const chart = svg(id, 'Where the 180-dollar price goes', `Price 180 dollars: 12 cash expense, ${r.timeValue} valued owner time, ${r.contribution} contribution before acquisition and fixed cost.`, `<text x="60" y="27">Fixed proposed price:$180</text>${bars}<text x="60" y="135">$12 cash expense</text><text x="60" y="170">${r.hours} hours/package → ${r.packages} whole packages within15 delivery hours</text>`, 190);
    return `<div class="lesson-figure-controls">${button('revision', r.extra ? 'Return to the agreed scope' : 'Include an unpriced second revision', false, r.extra)}${reset()}</div>${chart}${legend([['amber','Incremental cash expense'],['navy','Owner time valued at$24/hour'],['teal','Contribution after valued time']])}${table('Provider-side scope comparison', ['Measure', 'Current scenario'], [['Price', dollars(r.price)], ['Incremental cash expense', dollars(r.cashExpense)], ['Owner time', `${r.hours} hours;${dollars(r.timeValue)} assigned value`], ['Contribution before acquisition/fixed cost', dollars(r.contribution)], ['Cash before compensating owner time', dollars(r.cashBeforeOwnerTime)], ['Whole packages within15 hours', `${r.packages};${r.unusedHours} hours unused`]])}${status(r.extra ? 'An extra hour reduces contribution from$60 to$36 and whole-package capacity from3 to2.' : 'At the agreed scope, contribution is$60 after valued time. Capacity is3 whole packages, assuming sufficient demand.')} ${insight('These are provider-side planning figures, not customer willingness-to-pay evidence or a sales forecast. The second revision is additional to the revision already included in the offer. Acquisition and fixed costs remain excluded.')}`;
  }

  function renderFunnel(state) {
    const r = funnelModel(state.stage, state.paying, state.basis);
    const stages = ['Reveal qualified conversations', 'Reveal pilot agreements', 'Reveal payment scenario'];
    const dots = Array.from({ length: 100 }, (_, i) => `<span class="lesson-figure-dot ${i < r.current.count ? 'is-current' : 'is-remaining'}" aria-hidden="true"></span>`).join('');
    const ledger = r.stage === 3 ? `<p class="lesson-figure-rule"><strong>${dollars(r.cac)} per new paying customer</strong> = $270 acquisition effort ÷${r.paying} payers. Contribution after delivery and acquisition:${dollars(r.contribution)} each, before fixed cost.</p>` : '<p class="lesson-figure-rule">Acquisition effort is$270 including valued time. A paying-customer denominator is not established yet.</p>';
    return `<div class="lesson-figure-controls">${state.stage < 3 ? button('next', stages[state.stage]) : button('payers', r.paying === 3 ? 'Suppose all 5 become paying customers' : 'Return to the 3-payer scenario')}${reset()}</div><label class="lesson-figure-select">Rates compared with<select data-lf-control="basis"><option value="all"${r.basis === 'all' ? ' selected' : ''}>All100 reached people</option><option value="previous"${r.basis === 'previous' ? ' selected' : ''}>Each preceding stage</option></select></label><figure class="lesson-figure-cohort"><div class="lesson-figure-dots" role="img" aria-label="${esc(`${r.current.count} of the original100 people are in the current stage:${r.current.label}. All100 positions remain visible.`)}">${dots}</div><figcaption><strong>${r.current.count}/100</strong> original people at this stage. Blue marks the current group; outlined positions keep the rest of the cohort visible.</figcaption></figure>${table('Acquisition funnel · unique people at day 30', ['Stage', 'People', r.basis === 'all' ? 'Rate of100 reached' : 'Rate of preceding stage'], r.rows.map(row => [row.label, row.count, `${row.count}/${row.denominator} =${percent(row.rate)}`]))}${ledger}${status(`${r.current.label}:${r.current.count} people. Selected denominator:${r.current.denominator}; rate:${percent(r.current.rate)}. Changing the denominator does not change the people.`)}${insight(r.stage === 3 ? `${r.paying} paying customers is a hypothetical outcome, not observed demand. Payment is not completed delivery. At3 packages/month,${r.paying === 5 ? 'five orders require at least two delivery months' : 'three orders fill the example monthly delivery capacity'}. State scheduling before making a promise.` : 'A conversation is not a pilot agreement, and a pilot agreement is not payment. Keep every stage and the denominator named; do not count an earlier stage as a sale.')}`;
  }

  function renderQueue(state) {
    const r = queueModel(state.day, state.policy);
    const queueCards = Array.from({ length: Math.ceil(r.queued / 6) }, () => '<span class="lesson-figure-queue-card">6 waiting</span>').join('');
    const narrative = r.policy === 'capacity' ? `Review capacity is150 minutes/day,30 more than baseline. Across${r.days} days, added review time has${dollars(r.extraTimeValue)} of value at$24/hour. This becomes cash expense only if additional time is paid.` : r.policy === 'intake' ? 'Accepted demand is capped at24/day. An empty internal queue does not mean every request was served:6 arrivals are deferred each day.' : 'Thirty arrivals need150 review minutes/day. Only120 minutes are available, so six requests join the queue each day.';
    return `<div class="lesson-figure-controls">${button('day', state.day < 5 ? `Run working day ${state.day + 1}` : 'Five-day case complete', state.day >= 5)}${reset()}</div><label class="lesson-figure-select">Compare an operating policy<select data-lf-control="policy"><option value="standard"${r.policy === 'standard' ? ' selected' : ''}>Review24/day · accept30/day</option><option value="capacity"${r.policy === 'capacity' ? ' selected' : ''}>Add30 review minutes/day · review30/day</option><option value="intake"${r.policy === 'intake' ? ' selected' : ''}>Accept24/day · defer6 arrivals/day</option></select></label><p class="lesson-figure-small">Changing policy replays the same elapsed days from an empty queue. It does not magically clear an existing live backlog.</p><figure class="lesson-figure-queue"><div class="lesson-figure-flow"><div><span>Arrived</span><strong>${r.arriving}</strong></div><span class="lesson-figure-arrow" aria-hidden="true">→</span><div><span>Reviewed</span><strong>${r.reviewed}</strong></div><span class="lesson-figure-arrow" aria-hidden="true">+</span><div><span>Waiting</span><strong>${r.queued}</strong></div><span class="lesson-figure-arrow" aria-hidden="true">+</span><div><span>Deferred</span><strong>${r.deferred}</strong></div></div><div class="lesson-figure-queue-cards" aria-hidden="true">${queueCards || '<span class="lesson-figure-empty">No internal queue</span>'}</div><figcaption>After${r.days} working days:arrivals =reviewed +waiting +deferred. Each waiting card represents6 reply requests.</figcaption></figure>${table('Daily review-capacity ledger', ['Day', 'Arrived', 'Reviewed', 'Waiting at close', 'Deferred that day'], r.rows.map(row => [row.day, row.arriving, row.reviewed, row.queued, row.deferred]))}${status(`Day${r.days}:${r.reviewed} reviewed,${r.queued} waiting,${r.deferred} deferred, from${r.arriving} arrivals.`)}${insight(narrative)}<p class="lesson-figure-small">This original five-day model assumes5 minutes per review. Its additional staff-time value is separate from the course’s$60 monthly support expense. Counts show capacity, not observed quality or a measured customer waiting time.</p>`;
  }

  function renderChart(state, id) {
    const r = chartModel(state.axis), x = 185, width = 440, scale = width / r.range;
    const ticks = r.axis ? [80, 85, 90, 95, 100] : [0, 20, 40, 60, 80, 100];
    const grid = ticks.map(v => `<line x1="${x + (v - r.axis) * scale}" x2="${x + (v - r.axis) * scale}" y1="28" y2="145" class="lf-grid"/><text x="${x + (v - r.axis) * scale}" y="165" text-anchor="middle">${v}</text>`).join('');
    const chart = svg(id, 'Same benchmark, different chart origin', `Axis starts at ${r.axis}. Manual 96 minutes, reviewed AI 84 minutes. Actual reduction 12.5 percent. ${r.axis ? 'The truncated bars have visible lengths 16 and 4 minutes, creating an apparent 75 percent reduction in their drawn lengths.' : 'The zero baseline preserves proportional bar lengths.'}`, `${grid}<text x="15" y="59">Manual</text><rect x="${x}" y="35" width="${r.visibleManual * scale}" height="36" class="lf-fill-reference"/><text x="${x + r.visibleManual * scale + 10}" y="59">96</text><text x="15" y="119">Reviewed AI</text><rect x="${x}" y="95" width="${r.visibleAssisted * scale}" height="36" class="lf-fill-blue"/><text x="${x + r.visibleAssisted * scale + 10}" y="119">84</text>${r.axis ? `<path d="M${x - 7} 143 l7 -8 l7 8 l7 -8" class="lf-axis-break"/><text x="16" y="185" class="lf-warning">Truncated origin:80, not zero</text>` : '<text x="16" y="185">Zero origin</text>'}<text x="410" y="198" text-anchor="middle">Complete effort in minutes · same12 supplied cases</text>`, 215);
    const claims = [
      { label: '12.5% less complete effort in these supplied cases', feedback: 'Supported:(96−84)/96 =12.5%. Include the12-case setting, the quality result, and the evidence limit.' },
      { label: '75% less complete effort', feedback: 'Unsupported. 75% describes the visible-length change only when the axis begins at 80. The actual data remain 96 and 84.' },
      { label: 'Guaranteed cash savings and future reliability', feedback: 'Unsupported. Payroll, future cases, and demand are not established by this comparison. Both methods produced12 acceptable replies in the supplied set.' }
    ];
    return `<div class="lesson-figure-controls">${button('axis', r.axis === 0 ? 'Start the chart axis at80' : 'Restore the zero baseline', false, r.axis === 80)}${reset()}</div>${chart}${table('Unchanged evidence', ['Policy', 'Complete effort', 'Acceptable replies'], [['Manual','96 minutes','12/12'],['Reviewed AI','84 minutes','12/12']])}${status(`Actual effort reduction: ${percent(r.reduction)}. Difference in drawn bar lengths: ${percent(r.visibleReduction)}. The numbers did not change. ${state.claim === null ? '' : claims[state.claim].feedback}`)}<fieldset class="lesson-figure-claims"><legend>Which statement can the evidence support?</legend>${claims.map((claim,i) => `<button type="button" data-lf-action="claim-${i}" aria-pressed="${state.claim === i}">${esc(claim.label)}</button>`).join('')}</fieldset>${insight(state.claim === null ? 'Choose a claim, then explain the population, baseline, units, and limits. A dramatic shape does not create stronger evidence.' : claims[state.claim].feedback, state.claim !== null && state.claim !== 0 ? 'caution' : 'supported')}`;
  }

  function initialState() { return { stage: 0, checking: 3, extra: false, paying: 3, basis: 'all', day: 0, policy: 'standard', axis: 0, claim: null }; }
  const renderers = {3:renderEffort,5:renderRepair,9:renderOffer,10:renderFunnel,11:renderQueue,12:renderChart};
  function renderFigure(unit, state = initialState(), id = 'lesson-figure-preview') {
    return renderers[unit] ? renderers[unit]({...initialState(),...state},id) : '';
  }
  function readableText(value) {
    return String(value).replace(/([a-z])(?=\d|\$)/g, '$1 ').replace(/(\d)(?=[A-Za-z])/g, '$1 ').replace(/([:;])(?=\S)/g, '$1 ').replace(/,\$(?=\d)/g, ', $');
  }
  function improveTextNodes(element) {
    const view = element.ownerDocument.defaultView;
    const walker = element.ownerDocument.createTreeWalker(element, view.NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) node.nodeValue = readableText(node.nodeValue);
  }
  let mounted = 0;
  function mount(element) {
    const unit = Number(element.dataset.lessonFigure);
    if (![3,5,9,10,11,12].includes(unit) || element.dataset.lfMounted) return null;
    const fallback = element.querySelector('[data-lf-fallback]');
    if (!fallback) return null;
    const id = `lesson-figure-${unit}-${++mounted}`, enhanced = element.ownerDocument.createElement('div');
    enhanced.className = 'lesson-figure-enhancement';
    const content = element.ownerDocument.createElement('div');
    const liveStatus = element.ownerDocument.createElement('p');
    liveStatus.className = 'lesson-figure-status';
    liveStatus.setAttribute('role','status'); liveStatus.setAttribute('aria-live','polite'); liveStatus.setAttribute('aria-atomic','true');
    enhanced.append(content,liveStatus);
    let state = initialState(), disposed = false;
    function render(focusAction) {
      const active = element.ownerDocument.activeElement;
      const control = enhanced.contains(active) ? active?.dataset?.lfControl : null;
      const action = focusAction || (enhanced.contains(active) ? active?.dataset?.lfAction : null);
      content.innerHTML = renderFigure(unit,state,id);
      improveTextNodes(content);
      const message = content.querySelector('[data-lf-status-message]');
      liveStatus.textContent = message?.textContent || '';
      message?.remove();
      const selector = control ? `[data-lf-control="${control}"]` : action ? `[data-lf-action="${action}"]` : null;
      const target = selector ? enhanced.querySelector(selector) : null;
      if (target && !target.disabled) target.focus({preventScroll:true});
      else if (action) enhanced.querySelector('[data-lf-action="reset"]')?.focus({preventScroll:true});
    }
    function click(event) {
      const target = event.target.closest?.('[data-lf-action]');
      if (!target || !enhanced.contains(target)) return;
      const action = target.dataset.lfAction;
      if (action === 'reset') state = initialState();
      else if (action === 'next') state.stage = Math.min(unit === 5 ? 4 : 3,state.stage+1);
      else if (action === 'check') state.checking = state.checking === 3 ? 2 : 3;
      else if (action === 'revision') state.extra = !state.extra;
      else if (action === 'payers') state.paying = state.paying === 3 ? 5 : 3;
      else if (action === 'day') state.day = Math.min(5,state.day+1);
      else if (action === 'axis') state.axis = state.axis === 0 ? 80 : 0;
      else if (/^claim-[0-2]$/.test(action)) state.claim = Number(action.slice(-1));
      else return;
      render(action === 'next' && state.stage === 3 && unit !== 5 ? unit === 3 ? 'check' : 'payers' : action);
    }
    function change(event) {
      const target = event.target;
      if (target.dataset.lfControl === 'basis') state.basis = target.value === 'previous' ? 'previous' : 'all';
      else if (target.dataset.lfControl === 'policy') state.policy = ['standard','capacity','intake'].includes(target.value) ? target.value : 'standard';
      else return;
      render();
    }
    try { render(); } catch (_) { return null; }
    element.insertBefore(enhanced, fallback);
    fallback.hidden = true; element.dataset.lfMounted = 'true';
    enhanced.addEventListener('click',click); enhanced.addEventListener('change',change);
    return { getState: () => ({...state}), dispose: () => { if (disposed) return; disposed=true; enhanced.removeEventListener('click',click); enhanced.removeEventListener('change',change); enhanced.remove(); fallback.hidden=false; delete element.dataset.lfMounted; } };
  }
  function mountAll(scope = document) { return [...scope.querySelectorAll('[data-lesson-figure]')].map(mount).filter(Boolean); }
  return { VERSION, effortModel, repairModel, offerModel, funnelModel, queueModel, chartModel, initialState, readableText, renderFigure, mount, mountAll };
});
