// Original, deterministic teaching models. All values are fictional assumptions.
export const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)));

export function marketing(v) {
  const baselineOrders = v.audience * .02;
  const extraOrders = baselineOrders * v.lift / 100;
  const gross = extraOrders * 50;
  const review = v.review * 30;
  const cost = v.spend + review + 100;
  return { baselineOrders, extraOrders, gross, review, cost, net: gross - cost,
    breakEvenLift: baselineOrders ? cost / (baselineOrders * 50) * 100 : null };
}

export function support(v) {
  const automated = 1000 * v.eligible / 100;
  const reviewed = automated * v.review / 100;
  const errors = automated * v.error / 100 * (1 - v.review / 100 * .8);
  const aiCost = automated * .4;
  const reviewCost = reviewed * v.reviewCost;
  const harmCost = errors * v.impact;
  const humanCost = (1000 - automated) * 6;
  const total = aiCost + reviewCost + harmCost + humanCost;
  return { automated, reviewed, errors, aiCost, reviewCost, harmCost, humanCost, total,
    savings: 6000 - total, errorRate: errors / 1000 * 100 };
}

export function product(v) {
  const buyersAt = price => Math.max(0, 200 * v.market / 100 - v.sensitivity * (price - 20));
  const profitAt = price => buyersAt(price) * (price - v.unitCost) - v.fixed;
  const buyers = buyersAt(v.price);
  const revenue = buyers * v.price;
  const cost = buyers * v.unitCost + v.fixed;
  const bestPrice = v.sensitivity > 0
    ? clamp((200 * v.market / 100 + v.sensitivity * (20 + v.unitCost)) / (2 * v.sensitivity), 5, 50)
    : 50;
  return { buyers, revenue, cost, profit: revenue - cost, bestPrice,
    bestProfit: profitAt(bestPrice), curve: Array.from({ length: 46 }, (_, i) => ({ x: i + 5, y: profitAt(i + 5) })) };
}

export function adoption(v) {
  const potentialHours = v.tasks * v.minutes / 60;
  const realizedHours = potentialHours * v.realization / 100;
  const benefit = realizedHours * 35;
  const recurring = v.software + 500;
  const monthlyNet = benefit - recurring;
  const annualCost = v.upfront + 12 * recurring;
  const annualNet = 12 * monthlyNet - v.upfront;
  return { potentialHours, realizedHours, benefit, recurring, monthlyNet, annualCost, annualNet,
    roi: annualCost > 0 ? annualNet / annualCost * 100 : null,
    payback: monthlyNet > 0 ? v.upfront / monthlyNet : null,
    curve: Array.from({ length: 13 }, (_, i) => ({ x: i, y: i * monthlyNet - v.upfront })) };
}

export const opportunities = [
  { id: 'support', name: 'Service triage assistant', cost: 14, impact: 5, readiness: 3, evidence: 3, risk: 3 },
  { id: 'marketing', name: 'Marketing draft studio', cost: 7, impact: 3, readiness: 5, evidence: 3, risk: 2 },
  { id: 'knowledge', name: 'Internal knowledge guide', cost: 18, impact: 5, readiness: 3, evidence: 4, risk: 3 },
  { id: 'inventory', name: 'Inventory insight service', cost: 22, impact: 5, readiness: 2, evidence: 2, risk: 4 },
  { id: 'proposal', name: 'Proposal-writing assistant', cost: 10, impact: 4, readiness: 4, evidence: 4, risk: 2 },
  { id: 'concierge', name: 'Product discovery concierge', cost: 12, impact: 4, readiness: 3, evidence: 2, risk: 4 }
];

export function portfolio(v, selected = []) {
  const weight = v.impact + v.readiness + v.evidence;
  const items = opportunities.map(o => ({ ...o,
    score: weight > 0 ? (o.impact * v.impact + o.readiness * v.readiness + o.evidence * v.evidence) / weight : 0,
    eligible: o.risk <= v.risk }));
  let best = { ids: [], cost: 0, score: 0 };
  for (let mask = 1; mask < (1 << items.length); mask++) {
    const pick = items.filter((_, i) => mask & (1 << i));
    if (pick.length > 3 || pick.some(o => !o.eligible)) continue;
    const cost = pick.reduce((n, o) => n + o.cost, 0);
    const score = pick.reduce((n, o) => n + o.score, 0);
    if (cost > v.budget) continue;
    if (score > best.score + 1e-10 || (Math.abs(score - best.score) < 1e-10 && cost < best.cost)) {
      best = { ids: pick.map(o => o.id), cost, score };
    }
  }
  const manualItems = items.filter(o => selected.includes(o.id));
  const manual = { cost: manualItems.reduce((n, o) => n + o.cost, 0),
    score: manualItems.reduce((n, o) => n + o.score, 0),
    valid: manualItems.length <= 3 && manualItems.every(o => o.eligible) && manualItems.reduce((n, o) => n + o.cost, 0) <= v.budget };
  return { items, best, manual, weight };
}

export function wilsonInterval(successes, trials) {
  if (!Number.isInteger(successes) || !Number.isInteger(trials) || trials < 1 || successes < 0 || successes > trials) throw new RangeError('Use whole counts with 0 ≤ successes ≤ trials and trials ≥ 1.');
  const z = 1.96, p = successes / trials, denominator = 1 + z * z / trials;
  const center = (p + z * z / (2 * trials)) / denominator;
  const half = z * Math.sqrt(p * (1 - p) / trials + z * z / (4 * trials * trials)) / denominator;
  return { low: Math.max(0, center - half), high: Math.min(1, center + half) };
}

export function normalizeStatistics(v) {
  const controlN = clamp(Math.round(v.controlN), 20, 2000), campaignN = clamp(Math.round(v.campaignN), 20, 2000);
  return { ...v, statView: clamp(Math.round(v.statView), 1, 3), tail: clamp(v.tail, 9, 90), controlN, campaignN,
    controlOrders: clamp(Math.round(v.controlOrders), 0, controlN), campaignOrders: clamp(Math.round(v.campaignOrders), 0, campaignN), policy: clamp(Math.round(v.policy), 1, 3) };
}

export const reviewPolicies = [
  { name: 'Broad review', flaggedNeed: 18, flaggedRoutine: 24, missedNeed: 2, unflaggedRoutine: 56 },
  { name: 'Balanced review', flaggedNeed: 15, flaggedRoutine: 8, missedNeed: 5, unflaggedRoutine: 72 },
  { name: 'Strict review', flaggedNeed: 10, flaggedRoutine: 2, missedNeed: 10, unflaggedRoutine: 78 }
];

export function statistics(input) {
  const v = normalizeStatistics(input);
  const waits = [4, 5, 5, 6, 6, 7, 8, 9, v.tail];
  const sorted = [...waits].sort((a, b) => a - b);
  const mean = waits.reduce((a, b) => a + b, 0) / waits.length, median = sorted[4];
  const controlRate = v.controlOrders / v.controlN, campaignRate = v.campaignOrders / v.campaignN;
  const policies = reviewPolicies.map(p => ({ ...p, reviewed: p.flaggedNeed + p.flaggedRoutine,
    staffCost: (p.flaggedNeed + p.flaggedRoutine) * v.reviewUnit,
    missedCost: p.missedNeed * v.missedUnit, frictionCost: p.flaggedRoutine * v.frictionUnit,
    cost: (p.flaggedNeed + p.flaggedRoutine) * v.reviewUnit + p.missedNeed * v.missedUnit + p.flaggedRoutine * v.frictionUnit,
    correctShare: (p.flaggedNeed + p.unflaggedRoutine) / 100 }));
  return { view: v.statView, waits, mean, median, longest: sorted.at(-1), overTen: waits.filter(x => x > 10).length,
    controlN: v.controlN, campaignN: v.campaignN, controlOrders: v.controlOrders, campaignOrders: v.campaignOrders,
    controlRate, campaignRate, pointChange: 100 * (campaignRate - controlRate),
    relativeChange: controlRate === 0 ? null : 100 * (campaignRate - controlRate) / controlRate,
    controlInterval: wilsonInterval(v.controlOrders, v.controlN), campaignInterval: wilsonInterval(v.campaignOrders, v.campaignN),
    policies, policy: policies[v.policy - 1], bestPolicy: policies.reduce((best, p) => p.cost < best.cost ? p : best), noReviewCost: 20 * v.missedUnit };
}

// A bounded one-assumption change; the original decision is never mutated.
export function stressScenario(id, values) {
  if (id === 'statistics') {
    const v = normalizeStatistics(values);
    if (v.statView === 1) { const tail = Math.min(90, v.tail + 15); return { values: { ...v, tail }, key: 'tail', changed: tail !== v.tail }; }
    if (v.statView === 2) {
      const controlN = Math.min(2000, v.controlN * 5), campaignN = Math.min(2000, v.campaignN * 5);
      return { values: { ...v, controlN, campaignN, controlOrders: Math.round(v.controlOrders / v.controlN * controlN), campaignOrders: Math.round(v.campaignOrders / v.campaignN * campaignN) }, key: 'sample size', changed: controlN !== v.controlN || campaignN !== v.campaignN };
    }
    const policy = Math.min(3, v.policy + 1); return { values: { ...v, policy }, key: 'policy', changed: policy !== v.policy };
  }
  const changes = {
    marketing: ['lift', -10, 0, 80],
    support: ['review', 10, 0, 100],
    product: ['price', 1, 5, 50],
    adoption: ['realization', -10, 0, 100],
    portfolio: ['budget', -5, 0, 80]
  };
  const [key, amount, min, max] = changes[id];
  const next = { ...values, [key]: clamp(values[key] + amount, min, max) };
  return { values: next, key, changed: next[key] !== values[key] };
}

export function decisionMetrics(id, r) {
  const metric = (label, value, unit) => ({ label, value, unit });
  if (id === 'statistics') {
    if (r.view === 1) return [metric('Mean service wait', r.mean, 'minutes'), metric('Median service wait', r.median, 'minutes'), metric('Longest service wait', r.longest, 'minutes')];
    if (r.view === 2) return [metric('Control conversion rate', r.controlRate * 100, 'percent'), metric('New-campaign conversion rate', r.campaignRate * 100, 'percent'), metric('Change in percentage points', r.pointChange, 'points'), metric('Relative rate change', r.relativeChange, 'percent')];
    return [metric('Routine requests flagged', r.policy.flaggedRoutine, 'number'), metric('Requests needing attention missed', r.policy.missedNeed, 'number'), metric('Modeled total cost', r.policy.cost, 'money')];
  }
  if (id === 'marketing') return [metric('Net contribution', r.net, 'money'), metric('Extra expected orders', r.extraOrders, 'number'), metric('Break-even relative lift', r.breakEvenLift, 'percent')];
  if (id === 'support') return [metric('Monthly service cost', r.total, 'money'), metric('Residual erroneous answers', r.errors, 'number'), metric('Monthly saving vs baseline', r.savings, 'money')];
  if (id === 'product') return [metric('Monthly operating profit', r.profit, 'money'), metric('Expected subscribers', r.buyers, 'number'), metric('Best price under assumptions', r.bestPrice, 'money')];
  if (id === 'adoption') return [metric('Monthly net value', r.monthlyNet, 'money'), metric('First-year ROI', r.roi, 'percent'), metric('Payback', r.payback, 'months')];
  return [metric('Recommended portfolio score', r.best.score, 'number'), metric('Recommended spend', r.best.cost * 1000, 'money'), metric('Recommended pilot count', r.best.ids.length, 'number')];
}
