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
  const VERSION = '1.2.0';
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

  function resourceModel(extraRevision = false) {
    const extra = extraRevision === true, allowance = 180, cashExpense = 12, hours = 4.5 + (extra ? 1 : 0), hourValue = 24, timeValue = hours * hourValue, remainingAllowance = allowance - cashExpense - timeValue, capacityHours = 15, releases = Math.floor(capacityHours / hours);
    return { extra, allowance, cashExpense, hours, hourValue, timeValue, remainingAllowance, capacityHours, releases, unusedHours: capacityHours - releases * hours };
  }

  function funnelModel(stage = 0, completed = 3, basis = 'all') {
    stage = clamp(stage, 0, 3, 0); completed = Number(completed) === 5 ? 5 : 3; basis = basis === 'previous' ? 'previous' : 'all';
    const all = [{ label: 'Reached', count: 100 }, { label: 'Conversations', count: 20 }, { label: 'Pilot agreements', count: 5 }, { label: completed === 5 ? 'Hypothetical successful first tasks' : 'Observed successful first tasks', count: completed }];
    const rows = all.slice(0, stage + 1).map((row, i) => ({ ...row, denominator: basis === 'previous' && i > 0 ? all[i - 1].count : 100, rate: row.count / (basis === 'previous' && i > 0 ? all[i - 1].count : 100) }));
    return { stage, completed, basis, rows, current: rows[rows.length - 1], resourceValue: 270, cashExpense: 150, supportHours: 5, costPerCompletion: stage === 3 ? 270 / completed : null };
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

  // Presentation models keep stable identities without changing the calculations.
  function packingModel(extraRevision = false) {
    const result = resourceModel(extraRevision);
    return { ...result, slots: [0, 1, 2].map(index => ({ id: `release-${index + 1}`, label: `Release ${index + 1}`, start: index * result.hours, end: (index + 1) * result.hours, hours: result.hours, fits: (index + 1) * result.hours <= result.capacityHours, originalStart: index * 4.5, originalEnd: (index + 1) * 4.5 })) };
  }
  function queueTokenModel(days = 0, policy = 'standard') {
    const result = queueModel(days, policy), positions = { reviewed: 0, waiting: 0, deferred: 0 };
    const tokens = Array.from({ length: 25 }, (_, index) => {
      const day = Math.floor(index / 5) + 1, batch = index % 5 + 1, arrived = day <= result.days;
      const deferred = result.policy === 'intake' && batch === 5;
      const status = !arrived ? 'future' : deferred ? 'deferred' : result.policy !== 'standard' || index < result.reviewed / 6 ? 'reviewed' : 'waiting';
      const rank = status === 'future' ? batch - 1 : positions[status]++;
      const origin = status === 'reviewed' ? 207 : status === 'waiting' ? 426 : status === 'deferred' ? 580 : 31;
      const columns = status === 'reviewed' ? 8 : 5;
      return { id: `day-${day}-batch-${batch}`, day, batch, count: 6, status, x: origin + (rank % columns) * 23, y: 118 + Math.floor(rank / columns) * 36 };
    });
    return { ...result, tokens, requestsPerToken: 6 };
  }

  // The same finite steps drive manual and timed playback. Old callbacks cannot
  // advance a reset/restarted demonstration, even if cancellation races a tick.
  function createPlayback(options) {
    const schedule = options.schedule || setTimeout, cancel = options.cancel || clearTimeout;
    let playing = false, disposed = false, timer = null, generation = 0;
    const notify = () => { if (!disposed) options.onChange?.(); };
    function pause(notifyChange = true) {
      generation += 1; playing = false;
      if (timer !== null) { cancel(timer); timer = null; }
      if (notifyChange) notify();
    }
    function tick(token) {
      if (disposed || !playing || token !== generation) return;
      timer = null;
      if (options.isBlocked?.()) { pause(); return; }
      if (!options.isComplete()) options.advance();
      if (options.isComplete()) { pause(false); notify(); }
      else { notify(); timer = schedule(() => tick(token), options.delay || 1700); }
    }
    return {
      isPlaying: () => playing,
      play() {
        if (disposed || playing || options.isComplete() || options.isBlocked?.()) return false;
        playing = true; const token = ++generation; notify();
        timer = schedule(() => tick(token), options.delay || 1700); return true;
      },
      pause,
      step() { if (disposed) return; pause(false); if (!options.isComplete()) options.advance(); notify(); },
      finish() { if (disposed) return; pause(false); let count = 0; while (!options.isComplete() && count++ < 10) options.advance(); notify(); },
      reset() { if (disposed) return; pause(false); options.reset(); notify(); },
      dispose() { if (disposed) return; pause(false); disposed = true; }
    };
  }
  function playbackControls(unit, state) {
    if (![3, 9, 11].includes(unit)) return '';
    const complete = unit === 3 ? state.stage >= 3 : unit === 9 ? state.extra : state.day >= 5;
    return `${button('play', state.playing ? 'Pause' : 'Play steps', !!state.reduced || complete, !!state.playing)}${button('finish', 'Finish demonstration', complete)}<span class="lesson-figure-playback-note">${state.reduced ? 'Reduced motion: use the step control or Finish; every result remains available.' : 'Starts only when you choose Play. Movement traces a change; the table shows the completed step.'}</span>`;
  }

  function chartModel(axis = 0) {
    axis = Number(axis) === 80 ? 80 : 0;
    return { axis, manual: 96, assisted: 84, reduction: 12 / 96, visibleManual: 96 - axis, visibleAssisted: 84 - axis, visibleReduction: 1 - (84 - axis) / (96 - axis), range: 100 - axis };
  }

  function table(caption, headers, rows) {
    return `<div class="lesson-figure-table" tabindex="0" role="region" aria-label="${esc(caption)}"><table><caption>${esc(caption)}</caption><thead><tr>${headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, i) => i === 0 ? `<th scope="row">${esc(cell)}</th>` : `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function svg(id, title, description, body, height = 200) {
    return `<div class="lesson-figure-chart${/-(packing|flow)$/.test(id) ? ' lf-large-labels' : ''}" data-lf-key="chart-${id}" tabindex="0" role="region" aria-label="${esc(title)}; matching data table follows"><svg viewBox="0 0 720 ${height}" role="img" aria-labelledby="${id}-svg-title ${id}-svg-description"><title id="${id}-svg-title">${esc(title)}</title><desc id="${id}-svg-description">${esc(description)}</desc>${body}</svg></div>`;
  }
  const button = (action, label, disabled = false, pressed) => `<button type="button" data-lf-key="control-${action}" data-lf-action="${action}"${disabled ? ' disabled' : ''}${pressed === undefined ? '' : ` aria-pressed="${pressed}"`}>${esc(label)}</button>`;
  const insight = (text, tone = 'supported') => `<p class="lesson-figure-insight${tone === 'caution' ? ' lf-caution' : ''}"><strong>${tone === 'caution' ? 'Evidence limit' : 'Interpretation'}.</strong> ${esc(text)}</p>`;
  const status = text => `<p data-lf-status-message hidden>${esc(text)}</p>`;
  const reset = () => button('reset', 'Reset figure');
  const legend = items => `<div class="lesson-figure-legend">${items.map(([tone, text]) => `<span><i class="lf-bg-${tone}" aria-hidden="true"></i>${esc(text)}</span>`).join('')}</div>`;

  function renderEffort(state, id) {
    const r = effortModel(state.stage, state.checking), x = 185, scale = 50;
    let cursor = x;
    const segments = r.components.map((component, index) => {
      const visible = index <= r.stage, start = cursor, width = visible ? component.minutes * scale : 0;
      if (visible) cursor += width;
      return `<g data-lf-key="effort-${index}" class="lf-moving-mark" style="transform:translate(${start}px,0px)"><rect x="0" y="94" width="${width}" height="36" style="width:${width}px" class="lf-moving-size lf-fill-${component.tone}"/><text x="${width / 2}" y="117" text-anchor="middle" class="lf-on-${component.tone}" style="opacity:${visible ? 1 : 0}">${component.minutes}</text></g>`;
    }).join('');
    const grid = [0, 2, 4, 6, 8].map(v => `<line x1="${x + v * scale}" x2="${x + v * scale}" y1="25" y2="145" class="lf-grid"/><text x="${x + v * scale}" y="165" text-anchor="middle">${v}</text>`).join('');
    const ghost = `<g data-lf-key="effort-previous" style="opacity:${r.complete && r.checking === 2 ? 1 : 0}" aria-hidden="true"><rect x="${x}" y="88" width="400" height="48" class="lf-previous-outline"/><text x="${x + 400}" y="84" text-anchor="end">Previous full task: 8 min</text></g>`;
    const chart = svg(id, 'Complete effort per reply', `Manual task: 8 minutes. Assisted components revealed: ${r.visible.map(c => `${c.label} ${c.minutes} minutes`).join(', ')}. ${r.complete ? `Complete assisted effort ${r.full} minutes.` : `${r.shown} minutes shown so far; the assisted task is incomplete.`}`, `${grid}<text x="12" y="59">Manual · complete</text><rect x="${x}" y="35" width="400" height="36" class="lf-fill-reference"/><text x="600" y="59">8 min</text><text x="12" y="117">Assisted · ${r.complete ? 'complete' : 'partial'}</text>${ghost}${segments}<text x="${cursor + 12}" y="117">${r.shown} min${r.complete ? '' : ' so far'}</text><text x="385" y="192" text-anchor="middle">Minutes per reply · zero baseline</text>`);
    const labels = ['Reveal source checking', 'Reveal correction', 'Reveal handoff'];
    return `<div class="lesson-figure-controls">${state.stage < 3 ? button('next', labels[state.stage]) : button('check', state.checking === 3 ? 'Suppose checking takes 2 minutes' : 'Restore 3-minute checking')}${playbackControls(3, state)}${reset()}</div>${chart}${legend([['blue','Draft'],['teal','Source checking'],['amber','Correction'],['navy','Handoff']])}<p class="lesson-figure-small">Follow the same stacked task as each missing component enters. A dashed outline retains the earlier eight-minute total when the checking assumption changes.</p>${table('Same components as the figure', ['Work', 'Minutes'], [['Manual complete task', 8], ...r.visible.map(c => [c.label, c.minutes]), [r.complete ? 'Assisted complete task' : 'Assisted subtotal — incomplete', r.shown]])}${status(r.complete ? `Complete assisted effort: ${r.full} minutes. Reduction versus 8 minutes: ${percent(r.reduction)}.` : `${r.shown} minutes are visible, but not all work is shown. Predict the next component.`)}${insight(r.complete ? r.checking === 3 ? 'The 2-minute draft needs 6 more minutes around it. Draft speed alone has produced no complete-task gain.' : 'This is a hypothetical one-minute saving, only if shorter checking preserves quality. Measure that assumption; the control does not establish it.' : 'Do not compare a partial assisted subtotal with the complete manual task. The missing work must remain visible.')}`;
  }

  function renderRepair(state) {
    const r = repairModel(state.stage);
    const steps = ['Initial prototype:refund eligibility for every input.', 'Repair1:ask for missing timing before choosing a policy.', 'Repair2:route under24-hour exceptions to the owner.', 'New test:exactly24hours belongs to the credit window.', 'Repair3:use90-day credit from24to under72hours.'];
    const next = ['Require the missing time', 'Add the late-exception rule', 'Reveal a new boundary case', 'Add the credit-window rule'];
    const matrix = `<div class="lesson-figure-table" tabindex="0" role="region" aria-label="Supplied prototype tests and repair results"><table><caption>Supplied prototype tests · ${r.passed}/${r.total} pass</caption><thead><tr><th scope="col">Test input</th><th scope="col">Expected</th><th scope="col">Prototype output</th><th scope="col">Result</th></tr></thead><tbody>${r.cases.map(c => `<tr class="${c.pass ? 'lf-pass' : 'lf-fail'}"><th scope="row">${esc(c.label)}</th><td>${esc(c.expected)}</td><td>${esc(c.output)}</td><td><span class="lesson-figure-result">${c.pass ? '✓ Pass' : '× Needs repair'}</span></td></tr>`).join('')}</tbody></table></div>`;
    return `<div class="lesson-figure-controls">${state.stage < 4 ? button('next', next[state.stage]) : button('next', 'All four supplied cases checked', true)}${reset()}</div><p class="lesson-figure-rule"><strong>Current rule:</strong> ${esc(steps[state.stage])}</p>${matrix}${status(`${r.passed} of${r.total} supplied cases pass. ${state.stage === 3 ? 'The denominator increased because a fourth case was added.' : ''}`)}${insight(state.stage === 2 ? 'Three passes do not mean every boundary is covered. Predict what happens at exactly24hours before revealing it.' : state.stage === 3 ? 'The earlier cases still pass. The newly tested24-hour boundary exposes a missing credit rule; do not hide it in the old3/3 score.' : state.stage === 4 ? 'Retesting confirms these four supplied cases after the repair. It does not establish universal reliability or replace your actual reviewer’s test record.' : 'A repair should address a specific defect while preserving the cases that already work. Follow the source condition rather than adding a confident sentence.')}`;
  }

  function renderResources(state, id) {
    const r = packingModel(state.extra), pieces = [{ label: 'Cash expense', value: r.cashExpense, tone: 'amber' }, { label: 'Preparation/review/handoff time value', value: r.timeValue, tone: 'navy' }, { label: 'Unallocated resource value', value: r.remainingAllowance, tone: 'teal' }];
    let x = 60;
    const bars = pieces.map((piece, index) => {
      const start = x; x += piece.value * 3.2;
      return `<g data-lf-key="allowance-${index}" class="lf-moving-mark" style="transform:translate(${start}px,0px)"><rect x="0" y="58" width="${piece.value * 3.2}" style="width:${piece.value * 3.2}px" height="48" class="lf-moving-size lf-fill-${piece.tone}"/>${piece.value > 20 ? `<text x="${piece.value * 1.6}" y="88" text-anchor="middle" class="lf-on-${piece.tone}">${dollars(piece.value)}</text>` : ''}</g>`;
    }).join('');
    const chart = svg(id, 'Allocating a 180-dollar resource-value allowance', `Resource-value allowance 180 dollars: 12 cash expense, ${r.timeValue} valued preparation/review/handoff time, ${r.remainingAllowance} unallocated resource value. This is not a cash balance or profit.`, `<text x="60" y="27">Fixed resource-value allowance: $180</text>${bars}<text x="60" y="135">$12 cash expense · unchanged</text><text x="60" y="170">${r.hours} hours/release → ${r.releases} complete releases within 15 support hours</text>`, 190);
    const origin = 50, scale = 34, y = 90;
    const ticks = [0, 3, 6, 9, 12, 15, 18].map(hour => `<line x1="${origin + hour * scale}" x2="${origin + hour * scale}" y1="62" y2="145" class="lf-grid"/><text x="${origin + hour * scale}" y="167" text-anchor="middle">${hour}</text>`).join('');
    const ghosts = `<g data-lf-key="previous-packing" style="opacity:${state.extra ? 1 : 0}" aria-hidden="true">${r.slots.map(slot => `<rect x="${origin + slot.originalStart * scale}" y="${y - 8}" width="${4.5 * scale}" height="54" class="lf-previous-outline"/>`).join('')}</g>`;
    const slots = r.slots.map(slot => `<g data-lf-key="${slot.id}" class="lf-moving-mark" style="transform:translate(${origin + slot.start * scale}px,0px)"><rect x="0" y="${y}" width="${slot.hours * scale}" style="width:${slot.hours * scale}px" height="38" class="lf-moving-size ${slot.fits ? 'lf-release-fits' : 'lf-release-overflow'}"/><text x="${slot.hours * scale / 2}" y="${y + (slot.fits ? 24 : 15)}" text-anchor="middle" class="${slot.fits ? 'lf-release-label' : 'lf-overflow-label'}">${slot.label}: ${slot.hours} h${slot.fits ? '' : `<tspan x="${slot.hours * scale / 2}" dy="16">does not fit</tspan>`}</text></g>`).join('');
    const packing = svg(`${id}-packing`, 'Fit complete supported releases into the same 15 hours', `${r.releases} whole releases fit at ${r.hours} hours each; ${r.unusedHours} hours are unused. ${state.extra ? 'Dashed outlines retain the earlier three 4.5-hour releases. A third 5.5-hour release would end at 16.5 hours, exceeding the fixed limit by 1.5 hours.' : 'Three 4.5-hour releases end at 13.5 hours.'}`, `${ticks}${ghosts}${slots}<line x1="${origin + 15 * scale}" x2="${origin + 15 * scale}" y1="43" y2="147" class="lf-capacity-boundary"/><text x="${origin + 15 * scale}" y="29" text-anchor="middle">15-hour limit</text><text x="50" y="199">${r.releases} complete releases · ${r.unusedHours} hours unused${state.extra ? ' · third release needs 1.5 more hours' : ''}</text><text x="356" y="230" text-anchor="middle">Support hours · fixed scale from 0 to 18</text>`, 245);
    return `<div class="lesson-figure-controls">${button('revision', r.extra ? 'Return to the planned scope' : 'Include an additional revision', false, r.extra)}${playbackControls(9, state)}${reset()}</div>${chart}${legend([['amber','Incremental cash expense'],['navy','Preparation/review/handoff time valued at $24/hour'],['teal','Unallocated resource value']])}<h4>Watch what still fits in the same support time</h4>${packing}<p class="lesson-figure-small">A filled release fits completely. A dashed amber release exceeds the limit; it is not a completed release. Gray dashed outlines retain the planned allocation. These hour lengths are separate from the dollar allowance above.</p>${table('Supported-release resource comparison', ['Measure', 'Current scenario'], [['Resource-value allowance', dollars(r.allowance)], ['Incremental cash expense', dollars(r.cashExpense)], ['Preparation/review/handoff time', `${r.hours} hours; ${dollars(r.timeValue)} assigned value`], ['Unallocated resource value', dollars(r.remainingAllowance)], ['Complete supported releases within 15 hours', `${r.releases}; ${r.unusedHours} hours unused`]])}${status(r.extra ? 'An extra hour reduces unallocated resource value from $60 to $36 and complete-release capacity from 3 to 2.' : 'At the planned scope, $60 of resource value is unallocated. Capacity is 3 complete supported releases.')} ${insight('The allowance combines cash expense and valued time. Its remainder is neither cash remaining nor profit. The additional revision is beyond the revision already planned. Setup and recurring costs outside this narrow scenario need separate estimates, and actual successful use still needs observation.')}`;
  }

  function renderFunnel(state) {
    const r = funnelModel(state.stage, state.completed, state.basis);
    const stages = ['Reveal conversations', 'Reveal pilot agreements', 'Reveal successful first tasks'];
    const dots = Array.from({ length: 100 }, (_, i) => `<span class="lesson-figure-dot ${i < r.current.count ? 'is-current' : 'is-remaining'}" aria-hidden="true"></span>`).join('');
    const ledger = r.stage === 3 ? `<p class="lesson-figure-rule"><strong>${r.completed === 5 ? 'Hypothetical: ' : ''}${dollars(r.costPerCompletion)} resource cost per ${r.completed === 5 ? 'hypothetical' : 'observed'} successful first task</strong> = $270 outreach/support resources ÷${r.completed} completions. The$270 includes$150 cash plus5 hours valued at$24/hour.</p>` : '<p class="lesson-figure-rule">Outreach/support resources total$270 including valued time. A completed-use denominator is not established yet.</p>';
    return `<div class="lesson-figure-controls">${state.stage < 3 ? button('next', stages[state.stage]) : button('completions', r.completed === 3 ? 'Suppose all 5 complete a first task' : 'Return to 3 completed first tasks')}${reset()}</div><label class="lesson-figure-select">Rates compared with<select data-lf-control="basis"><option value="all"${r.basis === 'all' ? ' selected' : ''}>All100 reached people</option><option value="previous"${r.basis === 'previous' ? ' selected' : ''}>Each preceding stage</option></select></label><figure class="lesson-figure-cohort"><div class="lesson-figure-dots" role="img" aria-label="${esc(`${r.current.count} of the original100 people are in the current stage:${r.current.label}. All100 positions remain visible.`)}">${dots}</div><figcaption><strong>${r.current.count}/100</strong> original people at this stage. Blue marks the current group; outlined positions keep the rest of the cohort visible.</figcaption></figure>${table(r.stage === 3 && r.completed === 5 ? 'Hypothetical adoption comparison · same 30-day cohort' : 'Adoption trial · unique people at day 30', ['Stage', 'People', r.basis === 'all' ? 'Rate of100 reached' : 'Rate of preceding stage'], r.rows.map(row => [row.label, row.count, `${row.count}/${row.denominator} =${percent(row.rate)}`]))}${ledger}${status(`${r.current.label}:${r.current.count} people. Selected denominator:${r.current.denominator}; rate:${percent(r.current.rate)}. Changing the denominator does not change the people.`)}${insight(r.stage === 3 ? `${r.completed === 5 ? 'Five successful first tasks are a hypothetical comparison, not observed outcomes. This comparison assumes the same$270 resources; extra support could change that cost.' : 'Three successful first tasks are supplied fictional observations, not your own collected evidence.'} First use does not establish continued use or broad effectiveness.` : 'A conversation is not a pilot agreement, and an agreement is not successful use. Keep every stage and denominator named. Define the acceptance task before observing it.')}`;
  }

  function renderQueue(state, id, previous) {
    const r = queueTokenModel(state.day, state.policy), old = queueTokenModel(previous?.day ?? Math.max(0, state.day - 1), previous?.policy ?? state.policy);
    const prior = new Map(old.tokens.map(token => [token.id, token]));
    const moving = r.tokens.filter(token => token.status !== 'future' && (prior.get(token.id).x !== token.x || prior.get(token.id).y !== token.y || prior.get(token.id).status !== token.status));
    const ghosts = moving.map(token => {
      const before = prior.get(token.id);
      return `<g data-lf-key="ghost-${token.id}"><line x1="${before.x}" x2="${token.x}" y1="${before.y}" y2="${token.y}" class="lf-token-route"/><circle cx="${before.x}" cy="${before.y}" r="9" class="lf-previous-outline"/></g>`;
    }).join('');
    const tokens = r.tokens.map(token => `<g data-lf-key="${token.id}" class="lf-moving-mark lf-task-token lf-token-${token.status}" style="transform:translate(${token.x}px,${token.y}px);opacity:${token.status === 'future' ? 0 : 1}"><title>Day ${token.day}, batch ${token.batch}: 6 requests; ${token.status === 'future' ? 'not arrived in this comparison' : token.status}.</title><circle r="9"/><text x="0" y="4" text-anchor="middle">6</text></g>`).join('');
    const chart = svg(`${id}-flow`, 'Follow the same request batches through the human review step', `Each numbered chip is six requests. After ${r.days} days, ${r.arriving} arrived: ${r.reviewed} reviewed, ${r.queued} waiting, ${r.deferred} deferred. Gray outlines show prior positions; dashed connectors trace where the same batch goes.`, `<text x="76" y="28" text-anchor="middle">Arrive</text><text x="76" y="56" text-anchor="middle">30 each day</text><text x="286" y="28" text-anchor="middle">Reviewed</text><text x="286" y="56" text-anchor="middle">${r.reviewed}</text><text x="472" y="28" text-anchor="middle">Waiting</text><text x="472" y="56" text-anchor="middle">${r.queued}</text><text x="626" y="28" text-anchor="middle">Deferred</text><text x="626" y="56" text-anchor="middle">${r.deferred}</text><path d="M 143 76 H 184 M 395 76 H 414 M 548 76 H 566" class="lf-token-route"/><g data-lf-key="queue-routes">${ghosts}</g><g data-lf-key="queue-batches">${tokens}</g><text x="25" y="275">One chip = 6 requests · same batch identities across steps and policy comparisons</text>`, 295);
    const narrative = r.policy === 'capacity' ? `Review capacity is 150 minutes/day, 30 more than baseline. Across ${r.days} days, added review time has ${dollars(r.extraTimeValue)} of value at $24/hour. This becomes cash expense only if additional time is paid.` : r.policy === 'intake' ? 'Accepted demand is capped at 24/day. An empty internal queue does not mean every request was served: 6 arrivals are deferred each day.' : 'Thirty arrivals need 150 review minutes/day. Only 120 minutes are available, so six requests join the queue each day.';
    return `<div class="lesson-figure-controls">${button('day', state.day < 5 ? `Run working day ${state.day + 1}` : 'Five-day case complete', state.day >= 5)}${playbackControls(11, state)}${reset()}</div><label class="lesson-figure-select">Compare an operating policy<select data-lf-control="policy"><option value="standard"${r.policy === 'standard' ? ' selected' : ''}>Review 24/day · accept 30/day</option><option value="capacity"${r.policy === 'capacity' ? ' selected' : ''}>Add 30 review minutes/day · review 30/day</option><option value="intake"${r.policy === 'intake' ? ' selected' : ''}>Accept 24/day · defer 6 arrivals/day</option></select></label><p class="lesson-figure-small">Changing policy starts a new comparison at day 0 with the same arrival plan and an empty queue. Use the working-day step, Play, or Finish to run that comparison. It does not clear or undo a real review backlog. Counts show the completed working day; moving chips trace destinations, not measured processing speed.</p>${chart}${legend([['teal','Reviewed request batches'],['amber','Waiting or deferred · named separately'],['navy','Prior position and route · dashed outline']])}<p class="lesson-figure-rule">After ${r.days} working days: <strong>${r.arriving} arrived = ${r.reviewed} reviewed + ${r.queued} waiting + ${r.deferred} deferred.</strong> No request disappears when intake is limited.</p>${table('Daily review-capacity ledger', ['Day', 'Arrived', 'Reviewed', 'Waiting at close', 'Deferred that day'], r.rows.map(row => [row.day, row.arriving, row.reviewed, row.queued, row.deferred]))}${status(`Day ${r.days}: ${r.reviewed} reviewed, ${r.queued} waiting, ${r.deferred} deferred, from ${r.arriving} arrivals.`)}${insight(narrative)}<p class="lesson-figure-small">This original five-day model assumes 5 minutes per review. Its additional staff-time value is separate from the course’s $60 monthly support expense. Counts show capacity, not observed quality or a measured customer waiting time.</p>`;
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

  function initialState() { return { stage: 0, checking: 3, extra: false, completed: 3, basis: 'all', day: 0, policy: 'standard', axis: 0, claim: null }; }
  function controlState(unit, state, control, value) {
    if (control === 'basis') return {...state,basis:value === 'previous' ? 'previous' : 'all'};
    if (control === 'policy') return {...state,policy:['standard','capacity','intake'].includes(value) ? value : 'standard',...(unit === 11 ? {day:0} : {})};
    return null;
  }
  const renderers = {3:renderEffort,5:renderRepair,9:renderResources,10:renderFunnel,11:renderQueue,12:renderChart};
  function renderFigure(unit, state = initialState(), id = 'lesson-figure-preview', previous) {
    return renderers[unit] ? renderers[unit]({...initialState(),...state},id,previous) : '';
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
  function patchMarkup(parent, markup) {
    const template = parent.ownerDocument.createElement('template'); template.innerHTML = markup;
    function patchChildren(target, incoming) {
      const nextNodes = [...incoming.childNodes];
      nextNodes.forEach((next, index) => {
        let current = target.childNodes[index];
        const key = next.nodeType === 1 ? next.getAttribute('data-lf-key') : null;
        if (key && !(current?.nodeType === 1 && current.getAttribute('data-lf-key') === key)) {
          const found = [...target.childNodes].find(node => node.nodeType === 1 && node.getAttribute('data-lf-key') === key);
          if (found) { target.insertBefore(found, current || null); current = found; }
        }
        if (!current || current.nodeType !== next.nodeType || (next.nodeType === 1 && (current.nodeName !== next.nodeName || current.getAttribute('data-lf-key') !== next.getAttribute('data-lf-key')))) {
          const added = next.cloneNode(true); if (current) target.replaceChild(added, current); else target.appendChild(added); return;
        }
        if (next.nodeType === 3) { if (current.nodeValue !== next.nodeValue) current.nodeValue = next.nodeValue; return; }
        if (next.nodeType !== 1) return;
        for (const attribute of [...current.attributes]) if (!next.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
        for (const attribute of [...next.attributes]) if (current.getAttribute(attribute.name) !== attribute.value) current.setAttribute(attribute.name, attribute.value);
        patchChildren(current, next);
        // The retained select may have dirty selectedness from user interaction.
        // Synchronize its live value with the freshly rendered state, including Reset.
        if (next.nodeName === 'SELECT') current.value = next.value;
      });
      while (target.childNodes.length > nextNodes.length) target.lastChild.remove();
    }
    patchChildren(parent, template.content);
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
    const view = element.ownerDocument.defaultView, document = element.ownerDocument;
    const motion = view.matchMedia?.('(prefers-reduced-motion: reduce)') || { matches: false };
    let state = initialState(), previous = null, disposed = false, inViewport = true, intersection = null, mutation = null;
    const animated = [3, 9, 11].includes(unit);
    const complete = () => unit === 3 ? state.stage >= 3 : unit === 9 ? state.extra : state.day >= 5;
    const hidden = () => document.hidden || !inViewport || !element.isConnected || !!element.closest('[hidden],[aria-hidden="true"]');
    function advance() { previous = {...state}; if (unit === 3) state.stage = Math.min(3, state.stage + 1); else if (unit === 9) state.extra = true; else if (unit === 11) state.day = Math.min(5, state.day + 1); }
    const playback = createPlayback({ advance, isComplete: complete, isBlocked: () => motion.matches || hidden(), reset: () => { state = initialState(); previous = null; }, onChange: () => render() });
    function render(focusAction) {
      if (disposed) return;
      const active = document.activeElement;
      const control = enhanced.contains(active) ? active?.dataset?.lfControl : null;
      const action = focusAction || (enhanced.contains(active) ? active?.dataset?.lfAction : null);
      patchMarkup(content, renderFigure(unit,{...state,playing:playback.isPlaying(),reduced:motion.matches},id,previous));
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
      if (animated && action === 'play') { if (playback.isPlaying()) playback.pause(); else playback.play(); return; }
      if (animated && action === 'finish') { playback.finish(); return; }
      if (animated && action === 'reset') { playback.reset(); return; }
      if (animated && ((unit === 3 && action === 'next') || (unit === 9 && action === 'revision' && !state.extra) || (unit === 11 && action === 'day'))) { playback.step(); return; }
      playback.pause(false); previous = {...state};
      if (action === 'reset') state = initialState();
      else if (action === 'next') state.stage = Math.min(unit === 5 ? 4 : 3,state.stage+1);
      else if (action === 'check') state.checking = state.checking === 3 ? 2 : 3;
      else if (action === 'revision') state.extra = !state.extra;
      else if (action === 'completions') state.completed = state.completed === 3 ? 5 : 3;
      else if (action === 'day') state.day = Math.min(5,state.day+1);
      else if (action === 'axis') state.axis = state.axis === 0 ? 80 : 0;
      else if (/^claim-[0-2]$/.test(action)) state.claim = Number(action.slice(-1));
      else return;
      render(action === 'next' && state.stage === 3 && unit !== 5 ? unit === 3 ? 'check' : 'completions' : action);
    }
    function change(event) {
      const target = event.target, control = target.dataset.lfControl;
      const next = controlState(unit,state,control,target.value);
      if (!next) return;
      playback.pause(false);
      previous = unit === 11 && control === 'policy' ? null : {...state};
      state = next;
      render();
    }
    try { render(); } catch (_) { return null; }
    element.insertBefore(enhanced, fallback);
    fallback.hidden = true; element.dataset.lfMounted = 'true';
    enhanced.addEventListener('click',click); enhanced.addEventListener('change',change);
    const visibility = () => { if (hidden() && playback.isPlaying()) playback.pause(); };
    const pagehide = () => playback.pause();
    const reduce = () => { playback.pause(); render(); };
    document.addEventListener('visibilitychange',visibility); view.addEventListener('pagehide',pagehide);
    motion.addEventListener?.('change',reduce);
    if (animated && view.IntersectionObserver) { intersection = new view.IntersectionObserver(entries => { inViewport = entries[0].isIntersecting; visibility(); }, {threshold:0.05}); intersection.observe(element); }
    if (animated && view.MutationObserver) { mutation = new view.MutationObserver(visibility); let ancestor = element; while (ancestor) { mutation.observe(ancestor,{attributes:true,attributeFilter:['hidden','aria-hidden']}); ancestor = ancestor.parentElement; } }
    return { getState: () => ({...state}), pause: () => playback.pause(), dispose: () => { if (disposed) return; disposed=true; playback.dispose(); intersection?.disconnect(); mutation?.disconnect(); document.removeEventListener('visibilitychange',visibility); view.removeEventListener('pagehide',pagehide); motion.removeEventListener?.('change',reduce); enhanced.removeEventListener('click',click); enhanced.removeEventListener('change',change); enhanced.remove(); fallback.hidden=false; delete element.dataset.lfMounted; } };
  }
  function mountAll(scope = document) { return [...scope.querySelectorAll('[data-lesson-figure]')].map(mount).filter(Boolean); }
  return { VERSION, effortModel, repairModel, resourceModel, funnelModel, queueModel, packingModel, queueTokenModel, createPlayback, chartModel, initialState, controlState, readableText, renderFigure, mount, mountAll };
});
