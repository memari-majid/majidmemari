import { marketing, support, product, adoption, portfolio, statistics, normalizeStatistics, opportunities, clamp, stressScenario, decisionMetrics } from './calc.mjs';

const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const num = (n, d = 1) => new Intl.NumberFormat('en-US', { maximumFractionDigits: d }).format(n);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const control = (id, label, min, max, step, value, unit, hint) => ({ id, label, min, max, step, value, unit, hint });
const valueDescription = (c, value) => c.unit === '$1,000' ? `${value * 1000} US dollars` : c.unit === '$' ? `${value} US dollars` : c.unit === '%' ? `${value} percent` : c.unit === '/ 5' ? `${value} out of 5` : `${value} ${c.unit}`;

const labs = [
  {
    id: 'marketing', short: 'Marketing', detail: 'Spend · lift · contribution', title: 'Is this campaign worth funding?', duration: '25–30 minutes', icon: 'JT',
    organization: 'Juniper Trail Outfitters', type: 'Fictional outdoor retailer',
    intro: 'Separate an impressive AI-generated campaign from a campaign that creates business value.',
    scenario: 'Juniper Trail wants to promote its hiking starter kit using an AI-assisted campaign. The current purchase rate is 2% of the reachable audience. Each extra order contributes $50 after product and fulfillment costs. The team must fund campaign distribution, human review, and a $100 correction reserve.',
    decision: 'Recommend a pilot, revise the plan, or decline it. Judge the incremental contribution compared with doing no new campaign.',
    concept: 'Revenue is not the same as incremental value.',
    explanation: 'A lift of 20% is relative: a 2% purchase rate becomes 2.4%, not 22%. Only additional orders belong in the benefit estimate. AI does not establish that the lift will occur; a controlled pilot would be needed to estimate it.',
    controls: [control('audience', 'Reachable audience', 1000, 15000, 500, 5000, 'people', 'People reached, not website visits or impressions.'), control('lift', 'Assumed relative conversion lift', 0, 80, 1, 20, '%', 'A hypothesis to test; not a guaranteed AI effect.'), control('spend', 'Campaign distribution cost', 0, 4000, 50, 1000, '$', 'One campaign period; paid channels and production.'), control('review', 'Human review time', 0, 40, 1, 8, 'hours', 'Valued at $30/hour; quality effects are not modeled.')],
    calc: marketing,
    quiz: { question: 'At the starting settings, the team expects $1,000 of extra contribution. What is the strongest decision?', options: ['Approve it because extra orders always mean profit.', 'Rework or test it: the $1,340 incremental cost exceeds the assumed contribution.', 'Count all existing customer orders as the new campaign’s benefit.'], correct: 1,
      feedback: 'Correct. The starting net contribution is −$340. Existing orders would occur in the baseline, so counting them again would inflate the case. A stronger lift assumption must be supported by evidence.', retry: 'Compare additional contribution with all additional costs. Existing baseline orders are not a benefit created by the new campaign.' },
    challenge: ['Keep distribution spending at or below $1,000 and retain at least 8 hours of review.', 'Find a combination with positive expected net contribution. Then reduce your lift assumption by 10 percentage points.', 'Explain what evidence would justify the original lift and whether your recommendation survives the change.'],
    check: (v, r) => r.net > 0 && v.spend <= 1000 && v.review >= 8,
    challengeText: 'Current goal: positive net contribution, spending ≤ $1,000, and review ≥ 8 hours.',
    formulas: ['Additional orders = audience × 2% × relative lift', 'Incremental contribution = additional orders × $50', 'Incremental costs = distribution + review hours × $30 + $100', 'Net contribution = incremental contribution − incremental costs'],
    assumptions: 'One campaign period. The baseline purchase rate and per-order contribution are fixed. Audience reach is an independent assumption: increasing it does not establish that the selected spend can reach those people. Audience quality, repeat purchases, channel saturation, and the effect of review on quality are not modeled. The $100 reserve is an explicit assumption, not a complete estimate of brand risk.'
  },
  {
    id: 'support', short: 'Customer service', detail: 'Quality · review · cost', title: 'How much human review is enough?', duration: '30–35 minutes', icon: 'HL',
    organization: 'Harbor Lane Home Goods', type: 'Fictional online homeware store',
    intro: 'Balance a lower service cost with the burden of unresolved customer errors.',
    scenario: 'Harbor Lane handles 1,000 support tickets per month. Human-only handling costs $6 per ticket. Eligible tickets can receive an AI-assisted answer for $0.40 each. A human review catches 80% of errors in the reviewed answers. Uncaught errors carry an assumed remediation cost.',
    decision: 'Set an automation scope and review policy. The manager wants no more than 30 residual erroneous answers per month and a cost below the $6,000 human-only baseline.',
    concept: 'Quality is a business constraint, not a free side effect.',
    explanation: 'Review costs money but can prevent errors from reaching customers. Low expected cost alone does not mean acceptable service. Review catches a fraction of errors, so even reviewing every AI answer does not guarantee perfect quality. The model excludes errors in human-only handling.',
    controls: [control('eligible', 'Tickets eligible for AI assistance', 0, 100, 5, 60, '%', 'The remaining tickets stay with the human-only process.'), control('review', 'AI answers reviewed by a human', 0, 100, 5, 30, '%', 'Review catches 80% of errors in reviewed answers.'), control('error', 'Assumed pre-review error rate', 0, 30, 1, 12, '%', 'Share of AI answers with an error before review.'), control('impact', 'Cost per residual error', 0, 100, 5, 30, '$', 'Correction, refund, and support burden; not all possible harm.'), control('reviewCost', 'Cost per reviewed answer', 0, 8, .25, 3, '$', 'Additional cost beyond the $0.40 AI-assisted answer.')],
    calc: support,
    quiz: { question: 'If you review 100% of AI answers and the reviewer catches 80% of their errors, what follows?', options: ['No incorrect answer can reach a customer.', 'Some original errors can still remain, so the business needs monitoring and escalation.', 'The review automatically proves that automation caused better service.'], correct: 1,
      feedback: 'Correct. A 12% initial error rate with 80% detection leaves 2.4% of AI-assisted answers erroneous. Review improves this assumed model, but residual risk and real evaluation remain.', retry: 'Detection is imperfect. Think about the 20% of errors the review does not catch, even when every answer is reviewed.' },
    challenge: ['Keep the initial 60% eligible scope and 12% pre-review error assumption.', 'Find a review policy with no more than 30 residual erroneous answers and total cost below $6,000.', 'Double the residual-error cost. Explain whether your quality target or business recommendation changes.'],
    check: (v, r) => v.eligible === 60 && v.error === 12 && r.errors <= 30 && r.total < 6000,
    challengeText: 'Current goal: eligible = 60%, initial error = 12%, residual errors ≤ 30, total cost < $6,000.',
    formulas: ['AI-assisted tickets = 1,000 × eligible share', 'Reviewed tickets = AI-assisted tickets × review share', 'Residual errors = AI-assisted tickets × error rate × (1 − review share × 80%)', 'Total cost = remaining human tickets × $6 + AI tickets × $0.40 + reviewed tickets × review cost + residual errors × error cost'],
    assumptions: 'One month with 1,000 tickets. Ticket mix and reviewer effectiveness are fixed. Error detection is independent of error severity. Fractional counts represent expected values, not parts of a real ticket. Human-only error rates, implementation costs, reputational harm, and response times are outside this model.'
  },
  {
    id: 'product', short: 'Digital product', detail: 'Price · demand · margin', title: 'What should this product cost?', duration: '30–40 minutes', icon: 'BM',
    organization: 'Bright Market Studio', type: 'Fictional AI-assisted content subscription',
    intro: 'Explore a digital product’s price without confusing a demand assumption with market evidence.',
    scenario: 'Bright Market proposes an AI-assisted monthly content-planning package for small shops. The planning assumption is 200 subscribers at $20 per month. For every $1 increase above $20, demand falls by a chosen number of subscribers. Service and quality review cost $4 per subscriber at the starting settings.',
    decision: 'Recommend a price to test, a customer hypothesis, and the evidence you would gather before launch.',
    concept: 'The best price in a model may be the wrong price in the market.',
    explanation: 'Higher prices improve contribution per subscriber but may reduce demand. The curve shows a hypothetical tradeoff, not real willingness to pay. Compare profit and customer reach, then test the assumption driving the result.',
    controls: [control('price', 'Monthly subscription price', 5, 50, .5, 20, '$', 'A proposed price for the same service package.'), control('sensitivity', 'Demand loss per $1 price increase', 0, 20, 1, 8, 'people', 'A linear teaching assumption, not an estimated elasticity.'), control('market', 'Demand level at the $20 reference price', 40, 160, 5, 100, '%', '100% means 200 expected subscribers at $20.'), control('unitCost', 'Monthly cost per subscriber', 0, 15, .5, 4, '$', 'Includes delivery and human quality review.'), control('fixed', 'Monthly fixed operating costs', 0, 5000, 100, 1200, '$', 'Costs paid regardless of subscriber count.')],
    calc: product,
    quiz: { question: 'The curve identifies a profit-maximizing price under your assumptions. What should you do next?', options: ['Present that price as proven customer willingness to pay.', 'Treat it as a hypothesis and test price, demand, and product value with customer evidence.', 'Ignore demand because a digital product has no costs.'], correct: 1,
      feedback: 'Correct. The curve is a consequence of your inputs. A manual concept test, interview evidence, or a well-designed pricing experiment can challenge the assumptions before a launch decision.', retry: 'This is fictional demand. The model can organize your reasoning, but it cannot supply missing customer evidence.' },
    challenge: ['Set demand sensitivity to 16 people per $1 and the reference demand level to 80%.', 'Find a price with positive monthly operating profit and at least 150 expected subscribers.', 'Describe a simple product mockup and a customer question that could challenge this demand model.'],
    check: (v, r) => v.sensitivity === 16 && v.market === 80 && r.profit > 0 && r.buyers >= 150,
    challengeText: 'Current goal: sensitivity = 16, reference demand = 80%, profit > $0, and expected subscribers ≥ 150.',
    formulas: ['Expected subscribers = max(0, 200 × demand-level share − sensitivity × (price − $20))', 'Monthly revenue = price × expected subscribers', 'Monthly operating profit = (price − cost per subscriber) × expected subscribers − fixed costs', 'The chart searches prices from $5 to $50 under the same demand assumptions.'],
    assumptions: 'One month and one unchanged service package. Demand is linear and clipped at zero. Fractional demand represents an expectation. Customer acquisition costs, churn, taxes, capacity limits, and competitor responses are not included. The displayed optimum is confined to the $5–$50 range.'
  },
  {
    id: 'adoption', short: 'Adoption & ROI', detail: 'Realization · cost · payback', title: 'Will saved time become business value?', duration: '30–35 minutes', icon: 'PS',
    organization: 'Pine Street Services', type: 'Fictional professional-services firm',
    intro: 'Distinguish theoretical time savings from value an organization can actually realize.',
    scenario: 'Pine Street processes 2,000 routine work items a month. An AI-assisted process might save 6 minutes per item. Time is valued at $35/hour, but only a share of that time becomes useful capacity or avoidable cost. The firm also pays recurring software costs, $500/month for training and review, and an upfront adoption investment.',
    decision: 'Recommend whether to pilot the change. Explain the realization assumption, payback period, and the measure you would monitor.',
    concept: 'A faster task does not automatically create cash savings.',
    explanation: 'The realization factor represents the share of potential time value converted into useful capacity or avoided expense. It is not a causal estimate of productivity. A credible case identifies how that value will be captured and includes training, review, and change costs.',
    controls: [control('tasks', 'Monthly work items', 500, 5000, 100, 2000, 'items', 'Stable volume throughout the 12-month model.'), control('minutes', 'Potential time saved per item', 0, 15, .5, 6, 'minutes', 'An assumption requiring measurement in a pilot.'), control('realization', 'Share of time value actually realized', 0, 100, 5, 50, '%', 'Useful capacity or avoidable cost, not automatic cash savings.'), control('software', 'Monthly software cost', 0, 4000, 100, 1000, '$', 'The model adds $500/month for training and review.'), control('upfront', 'Upfront adoption investment', 0, 40000, 1000, 12000, '$', 'Initial training, planning, and transition costs.')],
    calc: adoption,
    quiz: { question: 'Why is the starting first-year ROI 40%, even though monthly net value is $2,000?', options: ['ROI divides net first-year value by all modeled first-year costs, including upfront and recurring costs.', 'The model assumes every saved minute immediately reduces payroll.', 'ROI and payback measure the same quantity.'], correct: 0,
      feedback: 'Correct. Annual gross realized value is $42,000. Total first-year cost is $30,000, leaving $12,000 net value; $12,000 ÷ $30,000 = 40%. Payback instead asks how long monthly net value takes to recover the upfront investment.', retry: 'Use the full first-year cost denominator: upfront investment plus twelve months of recurring cost. Payback is measured in months, not percent.' },
    challenge: ['Lower realization to 30% or less while keeping monthly work volume at 2,000.', 'Find a plausible plan with positive monthly net value and payback within 12 months.', 'Identify one assumption you would measure before accepting the result, and explain how a capacity benefit differs from a cash saving.'],
    check: (v, r) => v.realization <= 30 && v.tasks === 2000 && r.payback !== null && r.payback <= 12,
    challengeText: 'Current goal: realization ≤ 30%, work items = 2,000, positive monthly net value, and payback ≤ 12 months.',
    formulas: ['Potential saved hours = monthly items × minutes saved ÷ 60', 'Realized monthly value = potential saved hours × realization share × $35', 'Monthly net value = realized value − software cost − $500', 'First-year ROI = (12 × monthly net value − upfront cost) ÷ (upfront cost + 12 × recurring cost)', 'Payback months = upfront cost ÷ positive monthly net value'],
    assumptions: 'Twelve months with constant task volume, time savings, realization, and recurring cost. Upfront cost occurs at month 0. The model does not discount future value or include a ramp-up period. A negative or zero monthly net value has no modeled payback. Capacity value is not necessarily a cash-flow saving.'
  },
  {
    id: 'portfolio', short: 'Opportunity portfolio', detail: 'Priorities · budget · risk', title: 'Which opportunities deserve a pilot?', duration: '35–40 minutes', icon: 'RC',
    organization: 'Riverbend Commerce', type: 'Fictional regional services company',
    intro: 'Make resource tradeoffs across six promising ideas instead of approving every AI proposal.',
    scenario: 'Riverbend can run at most three pilots. Each opportunity has a fixed pilot cost and fictional ratings for business impact, readiness, evidence, and risk. Impact, readiness, and evidence use a 1–5 scale with higher values better; risk uses 1–5 with higher values riskier.',
    decision: 'Set priorities, a budget, and a risk limit. Compare the model’s highest-scoring feasible portfolio with your own selection.',
    concept: 'A weighted score makes priorities explicit; it does not prove value.',
    explanation: 'The model normalizes your three weights, scores each opportunity, and checks all combinations of up to three pilots. Budget and risk are constraints. Scores are assumed additive, so the model ignores overlap, dependencies, and competition for the same staff.',
    controls: [control('budget', 'Pilot budget', 0, 80, 1, 35, '$1,000', 'A value of 35 means a $35,000 total pilot budget.'), control('impact', 'Business impact weight', 0, 100, 5, 50, 'points', 'Weights are normalized; they need not total 100.'), control('readiness', 'Organizational readiness weight', 0, 100, 5, 30, 'points', 'Ability to execute and adopt the pilot.'), control('evidence', 'Evidence strength weight', 0, 100, 5, 20, 'points', 'Confidence in the problem and proposed value.'), control('risk', 'Maximum acceptable risk rating', 1, 5, 1, 3, '/ 5', 'An opportunity above this limit is ineligible.')],
    calc: portfolio,
    quiz: { question: 'A portfolio has the highest feasible total score. Which conclusion is justified?', options: ['It guarantees the greatest financial return.', 'It is the strongest portfolio under these weights, ratings, budget, and independence assumptions.', 'The unused budget should always be spent on another AI project.'], correct: 1,
      feedback: 'Correct. This ranking organizes judgment; it does not replace it. Revisit weak evidence, shared dependencies, and overlapping benefits before allocating real money. Leaving funds unspent can be sensible.', retry: 'Scores are fictional judgments, not dollars. The recommendation is conditional on the assumptions and constraints in this model.' },
    challenge: ['Reduce the budget to $25,000 or less and cap risk at 2.', 'Select your own nonempty portfolio of up to three pilots. Check that it satisfies both constraints.', 'Explain why leaving money unspent may be better than relaxing the risk limit. Name one dependency the model ignores.'],
    check: (v, r, s) => v.budget <= 25 && v.risk <= 2 && s.selected.length > 0 && r.manual.valid,
    challengeText: 'Current goal: budget ≤ $25,000, risk cap ≤ 2, and a nonempty feasible manual portfolio.',
    formulas: ['Normalized score = (impact rating × impact weight + readiness rating × readiness weight + evidence rating × evidence weight) ÷ total weight', 'Feasible portfolio: total cost ≤ budget, every risk rating ≤ risk cap, and at most 3 pilots', 'Recommendation = feasible combination with the greatest sum of scores; ties favor lower cost.'],
    assumptions: 'Costs are in thousands of dollars. Ratings are fictional instructor-provided judgments. The model assumes independent projects, additive scores, no shared resource constraints, and no minimum budget spend. If all weights are zero, it recommends no projects until you define priorities.'
  }
];

const statControl = (view, ...args) => ({ ...control(...args), view });
labs.push({
  id: 'statistics', short: 'Business statistics', detail: 'Data · percentages · decisions', title: 'What do the numbers actually tell us?', duration: '35–45 minutes', icon: 'AC',
  organization: 'Alder & Co. Retail', type: 'Fictional service, campaign, and returns data',
  intro: 'Read a table, interpret a figure, and make a business decision without writing code.',
  scenario: 'Alder & Co. needs three short management briefings: describe customer waits, interpret a campaign comparison, and choose a returns-review policy. The data are deliberately small and fictional so you can inspect every number. None of the examples is a forecast or a real study.',
  decision: 'Work through all three views. For each, state what the numbers support, what they leave uncertain, and which additional information a manager needs.',
  concept: 'The useful statistic depends on the business question.',
  explanation: 'A mean can reveal the burden of long waits while a median describes the middle customer. A percentage needs a denominator, and a percentage-point change differs from a relative change. A policy with more correct decisions can still have a higher business cost. Read the distribution, counts, and consequences together.',
  controls: [{ ...control('statView', 'Statistics view', 1, 3, 1, 1, 'view', '1 = service waits; 2 = campaign rates; 3 = review tradeoffs'), hidden: true },
    statControl(1, 'tail', 'Longest service wait', 9, 90, 1, 30, 'minutes', 'The other eight waits stay at 4, 5, 5, 6, 6, 7, 8, and 9 minutes.'),
    statControl(2, 'controlN', 'People in the control group', 20, 2000, 1, 40, 'people', 'Whole counts. Changing group size keeps order count fixed unless it exceeds group size.'),
    statControl(2, 'controlOrders', 'Control-group purchasers', 0, 2000, 1, 4, 'people', 'Cannot exceed the control-group size.'),
    statControl(2, 'campaignN', 'People in the new-campaign group', 20, 2000, 1, 40, 'people', 'Compare the denominator as well as the number of purchasers.'),
    statControl(2, 'campaignOrders', 'New-campaign purchasers', 0, 2000, 1, 6, 'people', 'Cannot exceed the new-campaign group size.'),
    statControl(3, 'policy', 'Review policy', 1, 3, 1, 2, 'policy', '1 = broad review; 2 = balanced review; 3 = strict review. A stricter rule flags fewer requests.'),
    statControl(3, 'reviewUnit', 'Staff cost per reviewed request', 0, 10, .5, 3, '$', 'Applies to every flagged request, whether the concern was justified or not.'),
    statControl(3, 'missedUnit', 'Cost per missed issue', 0, 100, 5, 40, '$', 'Assumed avoidable service loss when a request needing attention is missed.'),
    statControl(3, 'frictionUnit', 'Extra friction cost per unnecessary review', 0, 20, 1, 5, '$', 'Customer inconvenience beyond staff time; applies only to routine requests flagged.')],
  calc: statistics,
  quiz: { question: 'Which management summary uses statistics most responsibly?', options: ['Report one impressive percentage without its underlying counts.', 'Show the relevant counts and distribution, distinguish observed differences from causes, and explain the consequences of errors.', 'Choose whichever summary makes the proposed AI solution look strongest.'], correct: 1,
    feedback: 'Correct. Business statistics supports a decision by exposing denominators, variation, uncertainty, and costs. It should make the case more transparent, not merely more persuasive.', retry: 'Choose the summary that lets a reader inspect the underlying evidence and understand its limits.' },
  challenge: ['Service waits: raise the longest wait to at least 45 minutes. Explain why the mean moves while the median stays fixed.', 'Campaign rates: compare 4/40 with 6/40, then use the sample-size stress test. Explain why more observations narrow sampling uncertainty without proving causation.', 'Review policy: set the missed-issue cost to $80 and choose the lowest-cost policy. Explain whether and why your choice differs from the starting case.'],
  check: (v, r) => v.statView === 1 ? v.tail >= 45 : v.statView === 2 ? v.controlN >= 200 && v.campaignN >= 200 : v.missedUnit === 80 && Math.abs(r.policy.cost - r.bestPolicy.cost) < 1e-8,
  challengeText: 'Explore all three views, then support your recommendation with counts, a figure, and one limitation.',
  formulas: ['Mean = sum of waits ÷ 9; median = the fifth sorted wait.', 'Conversion rate = purchasers ÷ people in that group.', 'Percentage-point change = 100 × (new rate − control rate).', 'Relative rate change = 100 × (new rate − control rate) ÷ control rate; undefined when the control rate is zero.', 'Rate intervals use the Wilson method with z = 1.96. They describe each rate separately; interval overlap is not a formal test of a difference.', 'Review cost = flagged requests × staff cost + missed issues × missed-issue cost + routine requests flagged × extra friction cost.'],
  assumptions: 'Every observation and policy table is fictional. The wait sample has nine cases and cannot establish population service performance. Rate intervals assume independent, representative Bernoulli observations; they do not fix convenience sampling, selection bias, different audiences, or seasonal effects. Separate rate intervals and their overlap do not establish a statistical test of campaign differences or campaign causality. The review cohort has 100 requests: 20 need attention and 80 are routine. Their supplied labels and policy counts are fixed; costs are adjustable assumptions. Review flags requests for staff attention, not automatic customer eligibility or entitlement decisions.'
});
const statViews = [null, { title: 'Describe service waits', short: 'Mean & median', question: 'One long wait rises from 30 to 45 minutes. Which summary is correct?', options: ['The median must rise by 15 minutes.', 'The mean rises, the median remains 6 minutes, and the longest wait still deserves attention.', 'The extreme wait should be deleted because it makes the average look worse.'], correct: 1, feedback: 'The mean uses every value, so 15 extra minutes increases it by 15 ÷ 9 ≈ 1.67 minutes. The fifth sorted observation remains 6. A valid long wait is meaningful service evidence; the median does not make it disappear.' },
  { title: 'Compare campaign rates', short: 'Rates & uncertainty', question: 'Control: 4 purchasers out of 40 people. New campaign: 6 out of 40. What is the change?', options: ['5 percentage points and 50% relative increase; the small counts do not establish a causal campaign effect.', '50 percentage points and a proven campaign effect.', '2%, because there were two more purchasers.'], correct: 0, feedback: 'The rates are 10% and 15%. The absolute difference is 5 percentage points; the relative change is 5 ÷ 10 = 50%. Both descriptions need the counts and study context. These fictional, small groups do not prove a real effect.' },
  { title: 'Compare review errors and costs', short: 'Error tradeoffs', question: 'At the starting costs, strict review has 88% correct decisions while balanced review has 87%. Which policy costs less?', options: ['Strict review must cost less because its accuracy is higher.', 'Balanced review costs $309 versus $446 for strict review, because it misses fewer costly issues.', 'Both policies must have the same cost.'], correct: 1, feedback: 'Strict review misses 10 issues while balanced review misses 5. At $40 per missed issue, that difference outweighs the smaller review burden. Overall accuracy treats errors alike; the cost table makes their different consequences visible.' }];
const activeControls = lab => lab.controls.filter(c => !c.hidden && (c.view === undefined || c.view === state[lab.id].values.statView));
const evidenceQuestions = {
  statistics: { question: 'A small convenience sample shows a higher campaign conversion rate. What is the best next statement?', options: ['The new campaign caused the increase because the sample rate is higher.', 'The sample difference is descriptive; investigate how the groups were chosen and use an appropriate comparable or randomized study before making a causal claim.', 'Overlapping individual rate intervals prove the rates are identical.'], correct: 1, explanation: 'Sampling uncertainty is only one issue. Selection, independence, time period, and representativeness matter. Separate Wilson intervals describe the two rates; visual overlap or non-overlap is not a formal test of their difference and does not establish causality.' },
  marketing: { question: 'Which evidence would most directly test the campaign’s assumed conversion lift?', options: ['A large number of likes on the AI-generated advertisement.', 'A comparable control group and campaign group, with purchase rates tracked over the same period.', 'A persuasive explanation written by the same AI tool.'], correct: 1, explanation: 'Comparable groups and a defined purchase outcome help distinguish campaign effects from baseline demand. A randomized pilot, where practical, is stronger than comparing unlike audiences or different seasons. Likes and persuasive copy do not establish incremental purchases.' },
  support: { question: 'Which pilot evidence would best challenge this review policy?', options: ['The vendor’s average accuracy claim alone.', 'The team’s impressions after reading two good answers.', 'A representative ticket sample, independently checked for errors before and after review, with handling time recorded.'], correct: 2, explanation: 'Use the same error definition on representative cases. Estimate initial errors, reviewer detection, residual severity, and review effort. Include difficult cases; a favorable average can hide an unacceptable failure type. This case supplies assumptions, not measured support results.' },
  product: { question: 'Which next step offers useful evidence about this product and its price?', options: ['Show a concrete service mockup to target customers, test comprehension and alternatives, and evaluate a clearly stated price with appropriate behavioral evidence.', 'Ask friends whether an AI business sounds exciting.', 'Accept the model’s optimum as a measured market price.'], correct: 0, explanation: 'A concrete concept lets target customers evaluate what they would receive. Separate interest, stated willingness to pay, and actual behavior; they are not equivalent evidence. A classroom mockup and simulated feedback can rehearse the method, but must be labeled as simulated.' },
  adoption: { question: 'Which observation would most strengthen the realization assumption?', options: ['Adding up every minute the tool says it saved.', 'Measured task time and quality on comparable work, plus evidence that the released capacity was used or an expense was avoided.', 'Assuming a 50% realization factor because it is the starting value.'], correct: 1, explanation: 'Measure the work, including review and rework, then show how released time becomes useful capacity or an avoided expense. A pilot can challenge both time savings and realization. A faster isolated task is insufficient evidence of payroll savings.' },
  portfolio: { question: 'What would best improve this portfolio decision before real funding?', options: ['Replace all human judgment with the largest total score.', 'Raise the scores until every project can be justified.', 'Review the evidence behind each rating, check shared dependencies and overlapping benefits, and update ratings using small comparable pilots.'], correct: 2, explanation: 'The model makes assumptions visible; it does not validate them. Calibrate the rating definitions, challenge weak evidence, and check whether projects compete for the same people or count the same benefit twice. A high score with weak evidence is a reason to investigate, not a guarantee.' }
};
const stressTitles = { marketing: 'What if the campaign lift is 10 points lower?', support: 'What if 10 percentage points more answers are reviewed?', product: 'What if the monthly price rises by $1?', adoption: 'What if realization is 10 percentage points lower?', portfolio: 'What if the pilot budget falls by $5,000?' };
const stressTitle = (lab, v) => lab.id !== 'statistics' ? stressTitles[lab.id] : v.statView === 1 ? 'What if one customer waits 15 minutes longer?' : v.statView === 2 ? 'What if we observed up to five times as many people?' : 'What if the returns-review rule becomes stricter?';
const steps = [{ id: 'understand', label: 'Understand' }, { id: 'explore', label: 'Explore' }, { id: 'check', label: 'Check' }, { id: 'decide', label: 'Decide' }];
const initialValues = lab => Object.fromEntries(lab.controls.map(c => [c.id, c.value]));
const state = Object.fromEntries(labs.map(l => [l.id, { values: initialValues(l), selected: [], reflections: ['', ''], choice: null, checked: false, evidenceChoice: null, evidenceChecked: false, prediction: '', predictionReview: '', lastStress: null, viewAnswers: {}, viewHistory: {}, reference: { values: initialValues(l), selected: [], label: 'Starting assumptions' } }]));
let current = labs[0];
let latestResult;
let exportRows = [];
let comparisonExport = [];
const nav = document.getElementById('lab-nav');
const labEl = document.getElementById('lab');

function controlMaximum(c, lab) { return c.id === 'controlOrders' ? state[lab.id].values.controlN : c.id === 'campaignOrders' ? state[lab.id].values.campaignN : c.max; }
function controlsHTML(lab) {
  return activeControls(lab).map(c => `<div class="control"><div class="control-top"><label for="${c.id}-range">${esc(c.label)}</label><div class="value-wrap"><input class="number-input" type="number" id="${c.id}-number" data-control="${c.id}" min="${c.min}" max="${controlMaximum(c, lab)}" step="${c.step}" value="${state[lab.id].values[c.id]}" aria-label="${esc(c.label)} numeric value in ${esc(c.unit)}" aria-describedby="${c.id}-hint"><span>${esc(c.unit)}</span></div></div><input type="range" id="${c.id}-range" data-control="${c.id}" aria-valuetext="${esc(valueDescription(c, state[lab.id].values[c.id]))}" min="${c.min}" max="${controlMaximum(c, lab)}" step="${c.step}" value="${state[lab.id].values[c.id]}" aria-describedby="${c.id}-hint"><div class="range-ends"><span>${c.min} ${esc(c.unit)}</span><span id="${c.id}-max-label">${controlMaximum(c, lab)} ${esc(c.unit)}</span></div><div class="control-hint" id="${c.id}-hint">${esc(c.hint)}</div></div>`).join('');
}

function renderLab(lab, focus = false) {
  current = lab;
  const s = state[lab.id];
  nav.innerHTML = labs.map((l, i) => `<button type="button" data-lab="${l.id}" aria-current="${l.id === lab.id}"><span class="nav-number">LAB 0${i + 1}</span><span class="nav-title">${l.short}</span><span class="nav-detail">${l.detail}</span></button>`).join('');
  labEl.innerHTML = `<div class="lab-heading"><div><p class="eyebrow">LAB 0${labs.indexOf(lab) + 1} / ${lab.short.toUpperCase()}</p><h2 id="lab-title" tabindex="-1">${lab.title}</h2><p>${lab.intro}</p></div><span class="badge">${lab.duration} · individual or pairs</span></div>
    <nav class="step-nav" aria-label="Learning sections for ${lab.short}"><div class="step-context"><span>LAB 0${labs.indexOf(lab) + 1} · ${lab.short}</span><span id="step-context">Step 1 of 4 · Understand</span><a href="#${lab.id}" class="step-overview">↑ Overview</a></div><div class="step-links">${steps.map((step, i) => `<a href="#${lab.id}-${step.id}" data-step="${step.id}" ${i === 0 ? 'aria-current="step"' : ''}><span class="step-number">0${i + 1}</span><span>${step.label}</span></a>`).join('')}</div></nav>
    <div class="case-grid lab-section" id="${lab.id}-understand" tabindex="-1" role="region" aria-label="Understand the business case"><article class="card"><span class="step-label">01 / Understand the case</span><div class="case-name"><span class="case-icon" aria-hidden="true">${lab.icon}</span><div><strong>${lab.organization}</strong><span>${lab.type}</span></div></div><p>${lab.scenario}</p><p><strong>Your decision:</strong> ${lab.decision}</p></article><article class="card concept"><span class="step-label">The business idea</span><h3 style="margin-top:12px">${lab.concept}</h3><p>${lab.explanation}</p><p class="takeaway">Change one assumption at a time. Record what changes—and what does not.</p></article></div>
    <div class="workspace lab-section" id="${lab.id}-explore" tabindex="-1" role="region" aria-label="Explore the assumptions and outcomes"><section class="card controls-panel" aria-labelledby="controls-title"><span class="step-label">02 / Explore the assumptions</span><h3 id="controls-title" style="margin-top:9px">Make a change</h3><p class="mini-caption">${lab.id === 'statistics' ? 'Sliders update immediately. Press Enter or leave a number field to apply it.' : 'Use a slider or enter a value. Results update immediately.'}</p>${lab.id === 'statistics' ? `<div class="statistics-views" role="group" aria-label="Business statistics views">${statViews.slice(1).map((view, i) => `<button type="button" data-stat-view="${i + 1}" aria-pressed="${s.values.statView === i + 1}"><span>0${i + 1}</span>${view.short}</button>`).join('')}</div><p class="mini-caption">Three views, one management briefing. Each view keeps its own decision comparison and prediction.</p><p class="mini-caption" id="statistics-note" role="status" ${s.values.statView === 2 ? '' : 'hidden'}>${s.values.statView === 2 ? 'Counts are whole people. Each purchaser count is limited to its group size.' : ''}</p>` : ''}<div class="controls-grid">${controlsHTML(lab)}</div><button class="button secondary reset-button" id="reset" type="button">Reset this lab’s assumptions</button><p class="mini-caption">Reset preserves decision A, your prediction, reflection, and checkpoint answers.</p></section>
    <section class="card" aria-labelledby="results-title"><div class="results-top"><h3 id="results-title">See the tradeoffs</h3><span class="live-tag">Live model</span></div><div id="results"></div><details class="data-detail"><summary>Understand the model and its limits</summary><div class="formula">${lab.formulas.map(f => esc(f)).join('<br>')}</div><p class="formula-note">${lab.assumptions}</p></details></section></div>
    <section class="card comparison-card" aria-labelledby="comparison-title"><div class="comparison-heading"><div><span class="step-label">Compare two decisions</span><h3 id="comparison-title" tabindex="-1">Is the change an improvement?</h3></div><div class="comparison-actions"><button class="button secondary" id="save-reference" type="button">Save current as decision A</button><button class="button secondary" id="restore-reference" type="button">Use starting assumptions as A</button></div></div><p class="mini-caption">Decision A is your reference; decision B is the current model. A positive difference simply means B is larger—it is not always better.</p><div id="comparison"></div><div id="comparison-status" class="export-status" role="status"></div></section>
    <div class="practice-grid lab-section" id="${lab.id}-check" tabindex="-1" role="region" aria-label="Check your reasoning and evidence"><section class="card"><span class="step-label">03 / Check your reasoning</span><fieldset class="question"><legend>${lab.quiz.question}</legend>${lab.quiz.options.map((o, i) => `<label class="answer"><input type="radio" name="checkpoint" value="${i}" ${s.choice === i ? 'checked' : ''}><span>${o}</span></label>`).join('')}</fieldset><button class="button secondary" id="check-answer" type="button">Check my reasoning</button><div id="feedback" role="status" aria-live="polite"></div></section><section class="card"><span class="step-label">Change the assumption</span><h3 style="margin-top:9px">Now stress-test your decision</h3><ol class="challenge-list">${lab.challenge.map(x => `<li>${x}</li>`).join('')}</ol><p class="challenge-status" id="challenge-status"></p><p class="mini-caption">Reaching the target is a starting point for an explanation, not a graded score.</p></section></div>
    <section class="card evidence-card"><div class="evidence-heading"><span class="step-label">From a model to evidence</span><h3>What would you need to know before a real decision?</h3><p class="mini-caption">No measured business results are supplied here. Decide which evidence would test the assumptions rather than merely repeat them.</p></div><fieldset class="question"><legend>${evidenceQuestions[lab.id].question}</legend>${evidenceQuestions[lab.id].options.map((o, i) => `<label class="answer"><input type="radio" name="evidence-checkpoint" value="${i}" ${s.evidenceChoice === i ? 'checked' : ''}><span>${o}</span></label>`).join('')}</fieldset><button class="button secondary" id="check-evidence" type="button">Check my evidence plan</button><div id="evidence-feedback" role="status" aria-live="polite"></div></section>
    <section class="card reflection lab-section" id="${lab.id}-decide" tabindex="-1" aria-label="Decide and export your recommendation"><span class="step-label">04 / Make a recommendation</span><h3 style="margin-top:9px">What would you tell the decision-maker?</h3><div class="reflection-grid"><div><label for="recommendation">Your recommendation and two supporting model results</label><textarea id="recommendation" data-reflection="0" placeholder="I recommend… Under these assumptions…">${esc(s.reflections[0])}</textarea></div><div><label for="evidence">The weakest assumption, needed evidence, and what would change your mind</label><textarea id="evidence" data-reflection="1" placeholder="The result depends most on… I would test this by…">${esc(s.reflections[1])}</textarea></div></div><div class="reflection-bottom"><p>Your export includes both decisions, all current assumptions and results, checkpoint responses, formulas, and your reflection. Do not enter personal or confidential information. Nothing is saved automatically.</p><button class="button" id="export" type="button">Export reflection .txt <span aria-hidden="true">↓</span></button></div><div id="export-status" class="export-status" role="status"></div></section>`;
  updateResults();
  if (s.checked) showFeedback();
  if (s.evidenceChecked) showEvidenceFeedback();
  if (focus) document.getElementById('lab-title').focus({ preventScroll: true });
}

const metric = (label, value, detail, negative = false) => `<div class="metric ${negative ? 'negative' : ''}"><span>${label}</span><strong>${value}</strong><small>${detail}</small></div>`;
function table(rows, headers = ['Measure', 'Modeled result'], label = 'Data table; scroll horizontally if needed') {
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="${esc(label)}"><table><thead><tr>${headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((x, i) => i === 0 ? `<th scope="row">${esc(x)}</th>` : `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function barChart(rows, label, unit = '$', maxOverride) {
  const width = 620, left = 175, right = 55, top = 16, rowHeight = 44, bottom = 25;
  const lo = Math.min(0, ...rows.map(r => r.value));
  const hi = maxOverride ?? Math.max(1, ...rows.map(r => r.value));
  const range = Math.max(1, hi - lo);
  const x = v => left + (v - lo) / range * (width - left - right);
  const height = top + rows.length * rowHeight + bottom;
  const format = v => unit === '$' ? money(v) : num(v, 2);
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">${esc(label)}</title><desc id="chart-desc">${rows.map(r => `${esc(r.label)}: ${esc(format(r.value))}`).join('. ')}</desc><line x1="${x(0)}" y1="4" x2="${x(0)}" y2="${height - bottom}" stroke="#BBC9DA"/>${rows.map((r, i) => { const y = top + i * rowHeight; return `<text x="0" y="${y + 17}" fill="#455A79" font-size="11">${esc(r.label)}</text><rect x="${Math.min(x(0), x(r.value))}" y="${y}" width="${Math.max(1, Math.abs(x(r.value) - x(0)))}" height="25" rx="4" fill="${r.color || (r.value < 0 ? '#A53C32' : '#007F7A')}"/><text x="${width - 2}" text-anchor="end" y="${y + 17}" fill="#182A46" font-size="11" font-weight="650">${esc(format(r.value))}</text>`; }).join('')}<text x="${left}" y="${height - 2}" fill="#596A82" font-size="10">${unit === '$' ? 'US dollars' : 'Weighted score (0–5)'}</text></svg>`;
}
function lineChart(points, label, xLabel, marker) {
  const width = 620, height = 270, pad = { left: 58, top: 22, right: 28, bottom: 44 };
  let low = Math.min(0, ...points.map(p => p.y)), high = Math.max(1, ...points.map(p => p.y));
  const gap = Math.max(1, high - low) * .1; low -= gap; high += gap;
  const xmin = points[0].x, xmax = points.at(-1).x;
  const x = v => pad.left + (v - xmin) / (xmax - xmin) * (width - pad.left - pad.right);
  const y = v => pad.top + (high - v) / (high - low) * (height - pad.top - pad.bottom);
  const ticks = Array.from({ length: 5 }, (_, i) => low + i * (high - low) / 4);
  const xTicks = [xmin, xmin + (xmax - xmin) / 4, xmin + (xmax - xmin) / 2, xmin + (xmax - xmin) * 3 / 4, xmax];
  return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">${esc(label)}</title><desc id="chart-desc">${esc(label)}. The data table below lists the chart values. ${marker ? `Current point: ${num(marker.x)} ${esc(xLabel)}, ${money(marker.y)}.` : ''}</desc>${ticks.map(t => `<line x1="${pad.left}" y1="${y(t)}" x2="${width - pad.right}" y2="${y(t)}" stroke="#E1E8F1"/><text x="${pad.left - 9}" y="${y(t) + 3}" text-anchor="end" fill="#596A82" font-size="9">${money(t)}</text>`).join('')}<line x1="${pad.left}" y1="${y(0)}" x2="${width - pad.right}" y2="${y(0)}" stroke="#C98316" stroke-dasharray="5 4"/>${xTicks.map(t => `<text x="${x(t)}" y="${height - pad.bottom + 21}" text-anchor="middle" fill="#596A82" font-size="10">${num(t, 1)}</text>`).join('')}<path d="${points.map((p, i) => `${i ? 'L' : 'M'}${x(p.x)},${y(p.y)}`).join(' ')}" fill="none" stroke="#007F7A" stroke-width="3.5" stroke-linecap="round"/>${marker ? `<line x1="${x(marker.x)}" x2="${x(marker.x)}" y1="${y(marker.y)}" y2="${height - pad.bottom}" stroke="#C98316" stroke-dasharray="3 3"/><circle cx="${x(marker.x)}" cy="${y(marker.y)}" r="6" fill="#C98316" stroke="#182A46" stroke-width="2"/>` : ''}<text x="${width / 2}" y="${height - 1}" text-anchor="middle" fill="#596A82" font-size="10">${esc(xLabel)}</text></svg>`;
}

function waitFigure(r) {
  const x = value => 70 + value / 90 * 510;
  return `<svg viewBox="0 0 620 330" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">Nine individual service waits, with mean and median</title><desc id="chart-desc">Waits: ${r.waits.join(', ')} minutes. Mean ${num(r.mean, 2)} and median ${num(r.median, 2)} minutes. The horizontal scale remains zero to 90 minutes.</desc><text x="70" y="15" font-size="10" fill="#805110">Amber dashed line: mean</text><text x="310" y="15" font-size="10" fill="#007F7A">Teal dashed line: median</text><line x1="${x(r.mean)}" x2="${x(r.mean)}" y1="28" y2="286" stroke="#C98316" stroke-dasharray="6 3"/><line x1="${x(r.median)}" x2="${x(r.median)}" y1="28" y2="286" stroke="#007F7A" stroke-dasharray="2 4"/>${r.waits.map((v, i) => `<text x="0" y="${48 + i * 28}" fill="#58677B" font-size="10">Wait ${i + 1}</text><line x1="70" x2="${x(v)}" y1="${44 + i * 28}" y2="${44 + i * 28}" stroke="#D7E3F0" stroke-width="3"/><circle cx="${x(v)}" cy="${44 + i * 28}" r="5" fill="${i === 8 ? '#C98316' : '#007F7A'}"/><text x="${Math.min(594, x(v) + 10)}" y="${48 + i * 28}" font-size="10" fill="#182A46">${num(v)}</text>`).join('')}<line x1="70" x2="580" y1="290" y2="290" stroke="#A9BBD1"/>${[0, 15, 30, 45, 60, 75, 90].map(v => `<text x="${x(v)}" y="310" text-anchor="middle" font-size="10" fill="#596A82">${v}</text>`).join('')}<text x="330" y="328" text-anchor="middle" font-size="10" fill="#596A82">Service wait (minutes)</text></svg>`;
}

function rateFigure(r) {
  const x = value => 35 + value * 545;
  const groups = [{ name: 'Control', rate: r.controlRate, interval: r.controlInterval, n: r.controlN, k: r.controlOrders }, { name: 'New campaign', rate: r.campaignRate, interval: r.campaignInterval, n: r.campaignN, k: r.campaignOrders }];
  return `<svg class="rate-figure" viewBox="0 0 620 235" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">Individual conversion rates and illustrative 95% Wilson intervals</title><desc id="chart-desc">${groups.map(g => `${g.name}: ${g.k} of ${g.n}, rate ${num(g.rate * 100, 2)} percent, interval ${num(g.interval.low * 100, 2)} to ${num(g.interval.high * 100, 2)} percent.`).join(' ')} These individual intervals are not a formal comparison test.</desc>${groups.map((g, i) => { const y = 60 + 85 * i; return `<text x="35" y="${y - 23}" fill="#182A46" font-size="12" font-weight="650">${g.name}</text><text x="580" y="${y - 23}" text-anchor="end" fill="#58677B" font-size="11">${g.k}/${g.n} = ${num(g.rate * 100, 2)}%</text><line x1="35" x2="580" y1="${y}" y2="${y}" stroke="#E3E8F0"/><line x1="${x(g.interval.low)}" x2="${x(g.interval.high)}" y1="${y}" y2="${y}" stroke="#5F9B99" stroke-width="9" stroke-linecap="round"/><line x1="${x(g.interval.low)}" x2="${x(g.interval.low)}" y1="${y - 9}" y2="${y + 9}" stroke="#007F7A"/><line x1="${x(g.interval.high)}" x2="${x(g.interval.high)}" y1="${y - 9}" y2="${y + 9}" stroke="#007F7A"/><circle cx="${x(g.rate)}" cy="${y}" r="6" fill="#182A46" stroke="white" stroke-width="2"/>`; }).join('')}${[0, .2, .4, .6, .8, 1].map(v => `<text x="${x(v)}" y="199" text-anchor="middle" font-size="10" fill="#596A82">${v * 100}%</text>`).join('')}<text x="310" y="224" text-anchor="middle" font-size="10" fill="#596A82">Conversion rate (dots) · Individual 95% intervals (bars)</text></svg>`;
}

function statisticsQuestionHTML(view) {
  const q = statViews[view], answer = state.statistics.viewAnswers[view] || { choice: null, checked: false };
  return `<div class="statistics-check"><h4>Read this view’s numbers</h4><fieldset class="question"><legend>${q.question}</legend>${q.options.map((o, i) => `<label class="answer"><input type="radio" name="statistics-checkpoint" value="${i}" ${answer.choice === i ? 'checked' : ''}><span>${o}</span></label>`).join('')}</fieldset><button type="button" class="button secondary" id="check-statistics">Check this interpretation</button><div id="statistics-feedback" class="${answer.checked ? `feedback ${answer.choice === q.correct ? '' : 'retry'}` : ''}" role="status">${answer.checked ? `${answer.choice === q.correct ? 'Correct. ' : 'Reconsider the counts. '}${q.feedback}` : ''}</div></div>`;
}

function metricText(value, unit, signed = false) {
  if (value === null) return unit === 'months' ? 'No modeled payback' : 'Not defined';
  const rounded = Math.abs(value) < 1e-8 ? 0 : value;
  const prefix = signed && rounded > 0 ? '+' : '';
  if (unit === 'money') return prefix + new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(rounded);
  return `${prefix}${num(rounded, 2)}${unit === 'percent' ? '%' : unit === 'months' ? ' months' : unit === 'minutes' ? ' min' : unit === 'points' ? ' percentage points' : ''}`;
}

function metricDifference(before, after, unit) {
  if (before === null || after === null) return 'Not comparable';
  return metricText(after - before, unit === 'percent' ? 'points' : unit, true);
}

function renderComparison(lab, r) {
  const s = state[lab.id];
  const referenceResult = lab.calc(s.reference.values, s.reference.selected);
  const a = decisionMetrics(lab.id, referenceResult), b = decisionMetrics(lab.id, r);
  const rows = a.map((m, i) => [m.label, metricText(m.value, m.unit), metricText(b[i].value, m.unit), metricDifference(m.value, b[i].value, m.unit)]);
  const assumptionRows = activeControls(lab).map(c => [c.label, `${s.reference.values[c.id]} ${c.unit}`, `${s.values[c.id]} ${c.unit}`, s.reference.values[c.id] === s.values[c.id] ? 'Unchanged' : 'Changed']);
  const changed = assumptionRows.filter(row => row[3] === 'Changed').length;
  let manual = '';
  if (lab.id === 'portfolio') {
    const names = ids => opportunities.filter(o => ids.includes(o.id)).map(o => o.name).join('; ') || 'None selected';
    manual = `<p class="mini-caption"><strong>Manual selection A:</strong> ${esc(names(s.reference.selected))}<br><strong>Manual selection B:</strong> ${esc(names(s.selected))}</p>`;
  }
  const debrief = `<div class="prediction-debrief"><h4>Compare the result with your expectation</h4>${s.lastStress ? `<p class="mini-caption"><strong>Last applied stress test:</strong> ${esc(s.lastStress.title)} These results were recorded when you applied the change; later slider changes do not rewrite this record.</p><p class="prediction-quote"><strong>Your prediction:</strong> ${s.lastStress.prediction ? esc(s.lastStress.prediction) : 'No prediction entered (optional).'}</p><ul class="stress-outcome">${s.lastStress.before.map((m, i) => `<li>${esc(m.label)}: ${metricText(m.value, m.unit)} → ${metricText(s.lastStress.after[i].value, m.unit)}</li>`).join('')}</ul>` : '<p class="mini-caption">Make an optional prediction in the stress-test panel, then apply the change. Its result will be recorded here for comparison. You can still explore and reflect without a prediction.</p>'}<label for="prediction-review">What matched your expectation? What surprised you, and why?</label><textarea id="prediction-review" data-prediction-review placeholder="I expected… The model showed… The difference comes from…">${esc(s.predictionReview)}</textarea><p class="mini-caption">Revise this explanation if you apply another change. It is included in your reflection export.</p></div>`;
  document.getElementById('comparison').innerHTML = `<p class="comparison-label"><span class="pill">A · ${s.reference.label}</span><span class="pill">B · Current decision</span><span>${changed} of ${activeControls(lab).length} assumptions changed</span></p>${table(rows, ['Business measure', 'Decision A', 'Decision B', 'B minus A'])}${manual}<details class="data-detail"><summary>Compare every assumption</summary>${table(assumptionRows, ['Assumption', 'Decision A', 'Decision B', 'Change'])}</details>${debrief}`;
  comparisonExport = [`Decision A: ${s.reference.label}`, ...assumptionRows.map(row => `${row[0]} | A: ${row[1]} | B: ${row[2]}`), ...rows.map(row => `${row[0]} | A: ${row[1]} | B: ${row[2]} | difference: ${row[3]}`)];
  if (lab.id === 'portfolio') comparisonExport.push(`A manual selections: ${s.reference.selected.join(', ') || 'None'}`, `B manual selections: ${s.selected.join(', ') || 'None'}`);
}

function tradeoffHTML(lab, v, r, selected) {
  const scenario = stressScenario(lab.id, v);
  const next = lab.calc(scenario.values, selected);
  let text;
  if (lab.id === 'statistics') {
    if (v.statView === 1) text = `The mean would become ${num(next.mean, 2)} minutes; the median would remain ${num(next.median)}. The single changed wait affects the overall time burden even though the middle customer is unchanged.`;
    else if (v.statView === 2) text = `The groups would contain ${next.controlN} and ${next.campaignN} people, with counts scaled to approximately preserve the current rates (rounded to whole purchasers; maximum 2,000 people per group). The control interval would span ${num(next.controlInterval.low * 100, 2)}%–${num(next.controlInterval.high * 100, 2)}%; the campaign interval ${num(next.campaignInterval.low * 100, 2)}%–${num(next.campaignInterval.high * 100, 2)}%. This illustrates sampling precision, not a new experiment, a test of the difference, or proof of causality.`;
    else text = `${next.policy.name} would flag ${next.policy.reviewed} requests, miss ${next.policy.missedNeed} issues, and cost ${money(next.policy.cost)}. Compare which errors were reduced and which became more common before choosing a policy.`;
  } else if (lab.id === 'marketing') text = `At ${scenario.values.lift}% relative lift, expected net contribution would be ${money(next.net)} (${metricText(next.net - r.net, 'money', true)} versus now). At the current audience, each percentage point of relative lift changes modeled contribution by ${metricText(v.audience * .02 * .01 * 50, 'money')}. The purchase-rate assumption needs evidence.`;
  else if (lab.id === 'support') text = `At ${scenario.values.review}% review, residual expected errors would be ${num(next.errors, 2)}, a change of ${metricText(next.errors - r.errors, 'number', true)}. Total monthly cost would change by ${metricText(next.total - r.total, 'money', true)}. Review adds handling cost while avoiding some modeled error costs; decide whether the quality gain is worth the net change.`;
  else if (lab.id === 'product') text = `At $${num(scenario.values.price, 2)}, expected subscribers would change by ${metricText(next.buyers - r.buyers, 'number', true)} and monthly profit by ${metricText(next.profit - r.profit, 'money', true)}. The tradeoff depends entirely on the demand assumptions. Decide what customer evidence could contradict it.`;
  else if (lab.id === 'adoption') text = `At ${scenario.values.realization}% realization, monthly net value would be ${money(next.monthlyNet)} and payback would be ${metricText(next.payback, 'months')}. This change affects captured value without changing the task-time saving. Explain how the organization would use the released capacity.`;
  else text = `With a ${money(scenario.values.budget * 1000)} budget, the model recommends ${next.best.ids.length} pilots, spends ${money(next.best.cost * 1000)}, and scores ${num(next.best.score, 2)}. The ratings and weights stay the same. A tighter budget changes the feasible combinations, not the evidence for each opportunity.`;
  return `<div class="stress-test"><span class="step-label">${lab.id === 'statistics' && v.statView === 2 ? 'A sample-size comparison' : 'A one-assumption stress test'}</span><h4>${stressTitle(lab, v)}</h4><label for="stress-prediction">What do you expect to change? <span>(optional)</span></label><textarea id="stress-prediction" data-prediction placeholder="Before applying the change, I expect… because…">${esc(state[lab.id].prediction)}</textarea><p class="mini-caption">Predict the direction and the tradeoff before you look at the result. A short sentence is enough.</p><button class="button secondary" id="apply-stress" type="button" ${scenario.changed ? '' : 'disabled'}>${scenario.changed ? 'Save A and compare this change' : 'Already at this control’s limit'}</button><details class="data-detail"><summary>Preview the modeled effect (optional)</summary><p>${text}</p></details><p class="mini-caption">This stores the current model as decision A, then applies the change to decision B. Your prediction and reflection are preserved.</p></div>`;
}

function updateResults() {
  const lab = current, s = state[lab.id], v = s.values;
  const r = lab.calc(v, s.selected); latestResult = r;
  let metrics = '', chart = '', caption = '', insight = '', rows = [], extra = '';
  document.getElementById('results-title').textContent = lab.id === 'statistics' ? statViews[v.statView].title : 'See the tradeoffs';
  if (lab.id === 'marketing') {
    metrics = metric('Net incremental contribution', money(r.net), 'Per campaign period', r.net < 0) + metric('Additional expected orders', num(r.extraOrders), 'Beyond baseline orders') + metric('Break-even relative lift', `${num(r.breakEvenLift)}%`, 'Assuming all costs stay fixed');
    const bars = [{ label: 'Extra contribution', value: r.gross }, { label: 'Distribution + review', value: v.spend + r.review, color: '#647FA7' }, { label: 'Correction reserve', value: 100, color: '#C98316' }, { label: 'Net contribution', value: r.net }];
    chart = barChart(bars, 'Campaign contribution and incremental costs');
    caption = 'Contribution from additional orders must cover the new costs. The final bar is net contribution, not revenue.';
    insight = `Your assumed lift changes the purchase rate from 2% to ${num(2 * (1 + v.lift / 100), 2)}%. ${r.net > 0 ? 'The model clears break-even, but the lift still needs evidence.' : r.net === 0 ? 'This sits at break-even, leaving no cushion for worse assumptions.' : 'This plan does not cover its incremental costs under the current assumptions.'}`;
    rows = [['Baseline expected orders', num(r.baselineOrders)], ['Additional expected orders', num(r.extraOrders)], ['Extra contribution', money(r.gross)], ['Distribution cost', money(v.spend)], ['Review cost', money(r.review)], ['Correction reserve', money(100)], ['Net contribution', money(r.net)], ['Break-even relative lift', `${num(r.breakEvenLift, 2)}%`]];
  } else if (lab.id === 'support') {
    metrics = metric('Monthly service cost', money(r.total), 'Human + AI + review + errors') + metric('Residual erroneous answers', num(r.errors, 2), `${num(r.errorRate, 2)}% of all 1,000 tickets`, r.errors > 30) + metric('Modeled monthly saving', money(r.savings), 'Compared with $6,000 baseline', r.savings < 0);
    chart = barChart([{ label: 'Human-only baseline', value: 6000, color: '#7D8DA5' }, { label: 'Proposed total', value: r.total }, { label: 'Human handling', value: r.humanCost, color: '#647FA7' }, { label: 'AI + review', value: r.aiCost + r.reviewCost, color: '#2563EB' }, { label: 'Residual-error cost', value: r.harmCost, color: '#C98316' }], 'Monthly customer-service cost comparison');
    caption = 'The proposed total is the sum of human handling, AI assistance, review, and residual-error costs. Lower cost does not establish acceptable quality.';
    insight = `${num(r.automated)} tickets receive AI assistance; ${num(r.reviewed)} of those are reviewed. ${r.errors <= 30 ? 'The current model meets the 30-error quality threshold.' : 'The current model misses the 30-error quality threshold.'} ${r.savings > 0 ? 'Its cost is below the baseline.' : 'Its cost is not below the baseline.'}`;
    rows = [['AI-assisted tickets', num(r.automated)], ['Reviewed AI-assisted tickets', num(r.reviewed)], ['Residual erroneous answers', num(r.errors, 2)], ['Errors as share of all tickets', `${num(r.errorRate, 2)}%`], ['Human handling cost', money(r.humanCost)], ['AI assistance cost', money(r.aiCost)], ['Review cost', money(r.reviewCost)], ['Residual-error cost', money(r.harmCost)], ['Total monthly cost', money(r.total)], ['Modeled saving vs baseline', money(r.savings)]];
  } else if (lab.id === 'product') {
    metrics = metric('Expected subscribers', num(r.buyers), 'Under assumed demand') + metric('Monthly operating profit', money(r.profit), 'After modeled delivery + fixed costs', r.profit < 0) + metric('Model’s best price', `$${num(r.bestPrice, 2)}`, 'Continuous optimum within $5–$50');
    chart = lineChart(r.curve, 'Expected monthly operating profit at different prices', 'Monthly price (US dollars)', { x: v.price, y: r.profit });
    caption = 'The amber point is your chosen price. The teal curve keeps all other assumptions fixed. The dashed horizontal line is break-even.';
    insight = `At $${num(v.price, 2)}, revenue is ${money(r.revenue)} and modeled cost is ${money(r.cost)}. The model’s optimum is $${num(r.bestPrice, 2)}, with ${money(r.bestProfit)} monthly profit. Neither price is validated market evidence.`;
    rows = [['Chosen monthly price', `$${num(v.price, 2)}`], ['Expected subscribers', num(r.buyers, 2)], ['Monthly revenue', money(r.revenue)], ['Monthly cost', money(r.cost)], ['Monthly operating profit', money(r.profit)], ['Best modeled price (continuous)', `$${num(r.bestPrice, 2)}`], ...r.curve.map(p => [`Chart profit at $${p.x}`, money(p.y)])];
  } else if (lab.id === 'adoption') {
    metrics = metric('Monthly net value', money(r.monthlyNet), 'Realized benefit − recurring costs', r.monthlyNet < 0) + metric('Modeled payback', r.payback === null ? 'None' : `${num(r.payback, 1)} mo`, r.payback === null ? 'Monthly net value is not positive' : 'Months to recover upfront cost') + metric('First-year ROI', `${num(r.roi)}%`, 'Net value ÷ all first-year costs', r.roi < 0);
    chart = lineChart(r.curve, 'Cumulative net business value over twelve months', 'Months after adoption');
    caption = 'The curve begins with the upfront investment at month 0. Crossing the dashed zero line indicates modeled payback.';
    insight = `${num(r.potentialHours)} potential hours saved become ${num(r.realizedHours)} realized hours of value each month. First-year net value is ${money(r.annualNet)}. ${r.payback !== null && r.payback > 12 ? 'Payback lies beyond the 12-month chart.' : ''} Identify whether this value is usable capacity, avoided expense, or a mix.`;
    rows = [['Potential saved hours/month', num(r.potentialHours, 2)], ['Realized hours of value/month', num(r.realizedHours, 2)], ['Realized monthly value', money(r.benefit)], ['Recurring monthly cost', money(r.recurring)], ['Monthly net value', money(r.monthlyNet)], ['Total first-year costs', money(r.annualCost)], ['First-year net value', money(r.annualNet)], ['First-year ROI', `${num(r.roi, 2)}%`], ['Payback', r.payback === null ? 'No modeled payback' : `${num(r.payback, 2)} months`], ...r.curve.map(p => [`Cumulative value, month ${p.x}`, money(p.y)])];
  } else if (lab.id === 'statistics') {
    if (v.statView === 1) {
      metrics = metric('Mean wait', `${num(r.mean, 2)} min`, 'Total waiting time ÷ 9') + metric('Median wait', `${num(r.median)} min`, 'The fifth sorted observation') + metric('Longest wait', `${num(r.longest)} min`, `${r.overTen} of 9 waits exceed 10 minutes`);
      chart = waitFigure(r); caption = 'Every point is one fictional customer wait. The unchanged 0–90 minute scale makes the long wait visible. Both the typical experience and long-wait burden matter.';
      insight = `The nine waits total ${num(r.waits.reduce((a, b) => a + b, 0))} minutes. The mean is ${num(r.mean - r.median, 2)} minutes above the median. A low median does not erase the longest customer’s experience; a valid long wait should not be discarded merely to improve a headline.`;
      rows = [...r.waits.map((wait, i) => [`Customer wait ${i + 1}`, `${wait} minutes`]), ['Number of observations', '9'], ['Mean', `${num(r.mean, 4)} minutes`], ['Median', `${r.median} minutes`], ['Waits over 10 minutes', `${r.overTen} / 9 = ${num(r.overTen / 9 * 100, 2)}%`]];
    } else if (v.statView === 2) {
      metrics = metric('Control conversion', `${num(r.controlRate * 100, 2)}%`, `${r.controlOrders} purchasers / ${r.controlN} people`) + metric('New-campaign conversion', `${num(r.campaignRate * 100, 2)}%`, `${r.campaignOrders} purchasers / ${r.campaignN} people`) + metric('Percentage-point change', `${r.pointChange > 0 ? '+' : ''}${num(r.pointChange, 2)} pp`, r.relativeChange === null ? 'Relative change undefined at 0% control' : `${metricText(r.relativeChange, 'percent', true)} relative change`);
      chart = rateFigure(r); caption = 'Each bar is an illustrative 95% Wilson interval for one rate. These are not intervals for the difference. Overlap or non-overlap is not a formal difference test and does not establish a campaign effect.';
      insight = `Denominators matter: ${r.controlOrders}/${r.controlN} and ${r.campaignOrders}/${r.campaignN} produce ${num(r.pointChange, 2)} percentage points of difference. ${Math.min(r.controlN, r.campaignN) < 100 ? 'With small groups, a few purchasers can move the rates substantially.' : 'More observations improve sampling precision under the stated assumptions.'} Convenience sampling, unequal audiences, timing, and other biases remain possible regardless of sample size.`;
      rows = [['Control purchasers / people', `${r.controlOrders} / ${r.controlN}`], ['New-campaign purchasers / people', `${r.campaignOrders} / ${r.campaignN}`], ['Control rate', `${num(r.controlRate * 100, 4)}%`], ['New-campaign rate', `${num(r.campaignRate * 100, 4)}%`], ['Percentage-point change', `${num(r.pointChange, 4)} pp`], ['Relative rate change', r.relativeChange === null ? 'Undefined: control rate is zero' : `${num(r.relativeChange, 4)}%`], ['Control Wilson interval', `${num(r.controlInterval.low * 100, 4)}% to ${num(r.controlInterval.high * 100, 4)}%`], ['New-campaign Wilson interval', `${num(r.campaignInterval.low * 100, 4)}% to ${num(r.campaignInterval.high * 100, 4)}%`]];
      extra = `<details class="data-detail"><summary>What does “95%” mean here?</summary><p class="formula-note">The nominal 95% label describes the interval method’s long-run coverage in repeated sampling under its assumptions. It is not a 95% probability that a fixed population rate lies in this already-calculated interval. Wilson coverage is approximate. Independent and representative observations are assumed; biased or convenience samples are not made representative by an interval.</p><p class="formula-note">Optional method reference: <a href="https://itl.nist.gov/div898/handbook/prc/section2/prc241.htm" target="_blank" rel="noopener">NIST: confidence intervals for a proportion</a>. These individual rate intervals do not test the campaign difference.</p></details>`;
    } else {
      const p = r.policy;
      metrics = metric('Unnecessary reviews', num(p.flaggedRoutine), `${p.flaggedRoutine} of 80 routine requests`) + metric('Issues missed', num(p.missedNeed), `${p.missedNeed} of 20 requests needing attention`) + metric('Modeled total cost', money(p.cost), `${p.reviewed} requests sent for staff review`);
      chart = barChart(r.policies.map(x => ({ label: x.name, value: x.cost, color: x.name === p.name ? '#C98316' : '#007F7A' })), 'Total business cost by review policy');
      caption = 'Amber marks the selected review policy. The same 100 fictional requests and cost assumptions are used for every policy. Requests are flagged for staff attention, not automatically approved or rejected.';
      insight = `${p.name} has ${num(p.correctShare * 100)}% correct flag/no-flag decisions and costs ${money(p.cost)}. At these costs, ${r.bestPolicy.name.toLowerCase()} is least expensive (${money(r.bestPolicy.cost)}). Accuracy counts every error alike; the cost model distinguishes missed issues from unnecessary review.`;
      extra = `<h4 class="statistics-subheading">Read the decision table</h4><div class="table-scroll statistics-matrix" tabindex="0" role="region" aria-label="Returns decision table, with actual need and policy decision"><table><caption>${p.name} · all 100 fictional requests</caption><thead><tr><th scope="col">Policy decision</th><th scope="col">Needs attention<span>20 requests</span></th><th scope="col">Routine<span>80 requests</span></th><th scope="col">Total</th></tr></thead><tbody><tr><th scope="row">Flagged for review</th><td class="matrix-correct"><strong>${p.flaggedNeed}</strong><span>Correct flag</span></td><td class="matrix-error"><strong>${p.flaggedRoutine}</strong><span>Unnecessary flag<br>(false positive)</span></td><td class="matrix-total">${p.reviewed}</td></tr><tr><th scope="row">Not flagged</th><td class="matrix-error"><strong>${p.missedNeed}</strong><span>Missed issue<br>(false negative)</span></td><td class="matrix-correct"><strong>${p.unflaggedRoutine}</strong><span>Correct no flag</span></td><td class="matrix-total">${100 - p.reviewed}</td></tr><tr><th scope="row">Total</th><td class="matrix-total">20</td><td class="matrix-total">80</td><td class="matrix-total">100</td></tr></tbody></table></div><p class="mini-caption">The “actual” labels are supplied fictional case facts. False positive means a routine request was flagged; false negative means a request needing attention was missed. On a narrow screen, scroll the table horizontally to see every column.</p><h4 class="statistics-subheading">Compare the three policies</h4>${table(r.policies.map(x => [x.name, x.flaggedNeed, x.flaggedRoutine, x.missedNeed, x.unflaggedRoutine, `${num(x.correctShare * 100)}%`, money(x.cost)]), ['Policy', 'Correct flags', 'Unneeded flags', 'Missed issues', 'Correct no flag', 'Correct share', 'Cost'], 'Review policy comparison: scroll horizontally to compare counts, accuracy, and cost')}`;
      rows = [['Policy', p.name], ['Requests needing attention', 20], ['Routine requests', 80], ['Correctly flagged', p.flaggedNeed], ['Unnecessarily flagged (false positives)', p.flaggedRoutine], ['Missed issues (false negatives)', p.missedNeed], ['Correctly unflagged', p.unflaggedRoutine], ['Staff-review cost', money(p.staffCost)], ['Missed-issue cost', money(p.missedCost)], ['Additional customer-friction cost', money(p.frictionCost)], ['Total cost', money(p.cost)], ['Lowest-cost supplied policy', `${r.bestPolicy.name}: ${money(r.bestPolicy.cost)}`]];
    }
    extra += statisticsQuestionHTML(v.statView);
  } else {
    metrics = metric('Recommended pilots', `${r.best.ids.length} / 3`, 'Maximum three simultaneous pilots') + metric('Budget used', money(r.best.cost * 1000), `${money((v.budget - r.best.cost) * 1000)} remains`) + metric('Portfolio score', num(r.best.score, 2), 'Sum of selected 0–5 scores');
    const ranked = [...r.items].sort((a, b) => b.score - a.score);
    chart = barChart(ranked.map(o => ({ label: o.name.replace(' assistant', '').replace(' service', ''), value: o.score, color: !o.eligible ? '#A5ADBA' : r.best.ids.includes(o.id) ? '#C98316' : '#007F7A' })), 'Opportunity scores with recommended choices highlighted', 'score', 5);
    caption = 'Amber = recommended; teal = eligible but unselected; gray = above the risk limit. The table gives every input rating and status.';
    insight = r.weight === 0 ? 'Set at least one positive priority weight before choosing a portfolio.' : `Recommended: ${r.best.ids.length ? r.items.filter(o => r.best.ids.includes(o.id)).map(o => o.name).join('; ') : 'no feasible opportunity under these constraints'}. Ratings and total scores are decision aids, not financial returns.`;
    rows = r.items.map(o => [o.name, money(o.cost * 1000), `${o.impact} / ${o.readiness} / ${o.evidence}`, `${o.risk}`, num(o.score, 2), !o.eligible ? 'Above risk limit' : r.best.ids.includes(o.id) ? 'Recommended' : 'Eligible']);
    extra = `<h4 style="font-size:13px;margin:22px 0 6px">Compare your own portfolio</h4><p class="mini-caption">Choose up to three. A recommendation can be challenged, but the constraints still apply.</p><div class="manual-row">${r.items.map(o => `<label><input type="checkbox" data-opportunity="${o.id}" ${s.selected.includes(o.id) ? 'checked' : ''}>${o.name}</label>`).join('')}</div><div class="manual-result ${r.manual.valid ? '' : 'invalid'}">Your selection: ${s.selected.length} pilots · ${money(r.manual.cost * 1000)} · score ${num(r.manual.score, 2)}. ${r.manual.valid ? (s.selected.length ? 'Meets the stated constraints.' : 'Select a pilot to make a comparison.') : 'Not feasible: check budget, risk limit, and the three-pilot maximum.'}</div>`;
  }
  document.getElementById('results').innerHTML = `<div class="metric-grid" role="status" aria-live="polite" aria-atomic="true">${metrics}</div><figure class="chart">${chart}<figcaption>${caption}</figcaption></figure><div class="insight">${insight}</div><details class="data-detail"><summary>Read the figures as a data table</summary>${table(rows, lab.id === 'portfolio' ? ['Opportunity', 'Pilot cost', 'Impact / readiness / evidence', 'Risk', 'Score', 'Status'] : undefined)}</details>${extra}${tradeoffHTML(lab, v, r, s.selected)}`;
  exportRows = [insight, ...rows.map(row => row.join(' | '))];
  if (lab.id === 'portfolio') exportRows.push(`Manual selection: ${s.selected.length ? opportunities.filter(o => s.selected.includes(o.id)).map(o => o.name).join('; ') : 'None'}`, `Manual cost: ${money(r.manual.cost * 1000)}; score: ${num(r.manual.score, 2)}; meets constraints: ${r.manual.valid ? 'yes' : 'no'}`);
  const ready = lab.check(v, r, s);
  document.getElementById('challenge-status').className = `challenge-status ${ready ? 'ready' : ''}`;
  document.getElementById('challenge-status').textContent = `${ready ? 'Target reached. Explain the tradeoff. ' : 'Keep exploring. '}${lab.challengeText}`;
  renderComparison(lab, r);
}

function showFeedback() {
  const s = state[current.id], el = document.getElementById('feedback');
  if (s.choice === null) { el.className = 'feedback retry'; el.textContent = 'Choose a response first, then check your reasoning.'; return; }
  s.checked = true;
  const correct = s.choice === current.quiz.correct;
  el.className = `feedback ${correct ? '' : 'retry'}`;
  el.textContent = correct ? current.quiz.feedback : current.quiz.retry;
}

function showEvidenceFeedback() {
  const s = state[current.id], question = evidenceQuestions[current.id], el = document.getElementById('evidence-feedback');
  if (s.evidenceChoice === null) { el.className = 'feedback retry'; el.textContent = 'Choose an evidence plan first, then check your reasoning.'; return; }
  s.evidenceChecked = true;
  const correct = s.evidenceChoice === question.correct;
  el.className = `feedback ${correct ? '' : 'retry'}`;
  el.textContent = `${correct ? 'Yes. ' : 'Reconsider the evidence source. '}${question.explanation}`;
}

function syncControlValues() {
  activeControls(current).forEach(c => {
    const value = state[current.id].values[c.id];
    document.getElementById(`${c.id}-number`).value = String(value);
    const range = document.getElementById(`${c.id}-range`); range.max = String(controlMaximum(c, current)); document.getElementById(`${c.id}-number`).max = range.max; document.getElementById(`${c.id}-max-label`).textContent = `${range.max} ${c.unit}`; range.value = String(value); range.setAttribute('aria-valuetext', valueDescription(c, value));
  });
}

function showStatisticsFeedback() {
  const view = state.statistics.values.statView, q = statViews[view];
  const a = state.statistics.viewAnswers[view] || { choice: null, checked: false };
  const el = document.getElementById('statistics-feedback');
  if (a.choice === null) { el.className = 'feedback retry'; el.textContent = 'Choose an interpretation first.'; return; }
  a.checked = true; state.statistics.viewAnswers[view] = a;
  el.className = `feedback ${a.choice === q.correct ? '' : 'retry'}`;
  el.textContent = `${a.choice === q.correct ? 'Correct. ' : 'Reconsider the counts. '}${q.feedback}`;
}

function applyStatisticsControl(c, raw) {
  const s = state.statistics, proposed = { ...s.values, [c.id]: clamp(raw, c.min, c.max) };
  s.values = normalizeStatistics(proposed); syncControlValues(); updateResults();
  const adjusted = ['controlOrders', 'campaignOrders'].filter(k => s.values[k] !== proposed[k]);
  document.getElementById('statistics-note').textContent = s.values.statView !== 2 ? '' : adjusted.length ? `Purchaser count adjusted to a valid whole count within its group size: ${adjusted.map(k => `${k === 'controlOrders' ? 'control' : 'new campaign'} = ${s.values[k]}`).join('; ')}.` : 'Counts are whole people. Each purchaser count is limited to its group size.';
}

function exportStatisticsViews(lab, s) {
  return statViews.slice(1).flatMap((view, i) => {
    const viewId = i + 1;
    const history = viewId === s.values.statView ? s : (s.viewHistory[viewId] || {});
    const controls = lab.controls.filter(c => c.view === viewId);
    const currentResult = statistics({ ...s.values, statView: viewId });
    const reference = history.reference || { values: { ...initialValues(lab), statView: viewId }, label: 'Starting assumptions' };
    const referenceResult = statistics({ ...reference.values, statView: viewId });
    const a = decisionMetrics('statistics', referenceResult), b = decisionMetrics('statistics', currentResult);
    const answer = s.viewAnswers[viewId], record = history.lastStress;
    const recordLines = record ? [record.title, `Prediction when applied: ${record.prediction || '(Optional prediction left blank)'}`,
      ...controls.map(c => `${c.label}: ${record.valuesBefore[c.id]} → ${record.valuesAfter[c.id]} ${c.unit}`),
      ...record.before.map((m, j) => `${m.label}: ${metricText(m.value, m.unit)} → ${metricText(record.after[j].value, m.unit)}`)] : ['No stress test applied in this view.'];
    return ['', `STATISTICS VIEW ${viewId}: ${view.title.toUpperCase()}`, 'CURRENT INPUTS AND RESULTS (B)',
      ...controls.map(c => `${c.label}: ${s.values[c.id]} ${c.unit}`), ...b.map(m => `${m.label}: ${metricText(m.value, m.unit)}`),
      `SAVED REFERENCE (A): ${reference.label}`, ...controls.map(c => `${c.label}: ${reference.values[c.id]} ${c.unit}`),
      ...a.map((m, j) => `${m.label} | A: ${metricText(m.value, m.unit)} | B: ${metricText(b[j].value, m.unit)} | B minus A: ${metricDifference(m.value, b[j].value, m.unit)}`),
      'PREDICTION DRAFT', history.prediction || '(Not entered)', 'RECORDED STRESS TEST', ...recordLines,
      'PREDICTION DEBRIEF', history.predictionReview || '(Not entered)', 'VIEW CHECKPOINT', view.question,
      answer?.choice != null ? view.options[answer.choice] : 'No view-checkpoint response selected.', answer?.checked ? view.feedback : 'Response not checked.'];
  });
}

nav.addEventListener('click', e => { const button = e.target.closest('[data-lab]'); if (button) { location.hash = button.dataset.lab; } });
const locationParts = () => {
  const match = location.hash.slice(1).match(/^([a-z]+)(?:-(understand|explore|check|decide))?$/);
  return { lab: match ? (match[1] === 'pricing' ? 'product' : match[1]) : null, step: match?.[2] || null };
};
const labFromHash = () => labs.find(l => l.id === locationParts().lab);
function updateStepContext() {
  const stepNav = document.querySelector('.step-nav');
  if (!stepNav) return;
  const cutoff = Math.max(100, stepNav.getBoundingClientRect().bottom + 24);
  let index = 0;
  steps.forEach((step, i) => { const el = document.getElementById(`${current.id}-${step.id}`); if (el && el.getBoundingClientRect().top <= cutoff) index = i; });
  document.querySelectorAll('[data-step]').forEach(link => { if (link.dataset.step === steps[index].id) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current'); });
  document.getElementById('step-context').textContent = `Step ${index + 1} of 4 · ${steps[index].label}`;
}
function jumpToLocation() {
  const { step } = locationParts();
  const target = step ? document.getElementById(`${current.id}-${step}`) : document.getElementById('lab-title');
  if (target) { target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start' }); }
  updateStepContext();
}
window.addEventListener('hashchange', () => {
  const lab = labFromHash();
  if (lab) { if (lab.id !== current.id) renderLab(lab, true); jumpToLocation(); }
});
window.addEventListener('scroll', updateStepContext, { passive: true });
window.addEventListener('resize', updateStepContext, { passive: true });
labEl.addEventListener('input', e => {
  if (e.target.dataset.control) {
    const c = current.controls.find(x => x.id === e.target.dataset.control);
    if (e.target.value === '' || !Number.isFinite(Number(e.target.value))) return;
    if (current.id === 'statistics') { if (e.target.type === 'range') applyStatisticsControl(c, e.target.value); return; }
    const v = clamp(e.target.value, c.min, c.max);
    state[current.id].values[c.id] = v;
    const other = document.getElementById(`${c.id}-${e.target.type === 'range' ? 'number' : 'range'}`);
    other.value = String(v); document.getElementById(`${c.id}-range`).setAttribute('aria-valuetext', valueDescription(c, v)); updateResults();
  }
  if (e.target.dataset.reflection !== undefined) state[current.id].reflections[Number(e.target.dataset.reflection)] = e.target.value;
  if (e.target.hasAttribute('data-prediction')) state[current.id].prediction = e.target.value;
  if (e.target.hasAttribute('data-prediction-review')) state[current.id].predictionReview = e.target.value;
});
labEl.addEventListener('change', e => {
  if (e.target.dataset.control) {
    const c = current.controls.find(x => x.id === e.target.dataset.control);
    if (current.id === 'statistics') { applyStatisticsControl(c, e.target.value === '' ? c.value : e.target.value); return; }
    const v = clamp(e.target.value === '' ? c.value : e.target.value, c.min, c.max);
    state[current.id].values[c.id] = v;
    syncControlValues();
    updateResults();
  }
  if (e.target.name === 'checkpoint') { state[current.id].choice = Number(e.target.value); if (state[current.id].checked) showFeedback(); }
  if (e.target.name === 'evidence-checkpoint') { state[current.id].evidenceChoice = Number(e.target.value); if (state[current.id].evidenceChecked) showEvidenceFeedback(); }
  if (e.target.name === 'statistics-checkpoint') {
    const view = state.statistics.values.statView;
    const answer = state.statistics.viewAnswers[view] || { choice: null, checked: false };
    answer.choice = Number(e.target.value); state.statistics.viewAnswers[view] = answer;
    if (answer.checked) showStatisticsFeedback();
  }
  if (e.target.dataset.opportunity) {
    const id = e.target.dataset.opportunity;
    const s = state[current.id]; s.selected = e.target.checked ? [...s.selected, id] : s.selected.filter(x => x !== id);
    updateResults(); document.querySelector(`[data-opportunity="${id}"]`).focus({ preventScroll: true });
  }
});
labEl.addEventListener('click', e => {
  if (e.target.closest('[data-stat-view]')) {
    const s = state.statistics, next = Number(e.target.closest('[data-stat-view]').dataset.statView), previous = s.values.statView;
    if (next !== previous) {
      s.viewHistory[previous] = { reference: s.reference, prediction: s.prediction, predictionReview: s.predictionReview, lastStress: s.lastStress };
      s.values.statView = next;
      Object.assign(s, s.viewHistory[next] || { reference: { values: { ...initialValues(current), statView: next }, selected: [], label: 'Starting assumptions' }, prediction: '', predictionReview: '', lastStress: null });
      renderLab(current); document.querySelector(`[data-stat-view="${next}"]`).focus({ preventScroll: true }); updateStepContext();
    }
  }
  if (e.target.closest('#check-statistics')) showStatisticsFeedback();
  if (e.target.closest('#check-answer')) showFeedback();
  if (e.target.closest('#check-evidence')) showEvidenceFeedback();
  if (e.target.closest('#save-reference')) {
    const s = state[current.id]; s.reference = { values: { ...s.values }, selected: [...s.selected], label: 'Your saved decision' };
    renderComparison(current, latestResult); document.getElementById('comparison-status').textContent = 'Current assumptions and selections saved as decision A. Change a control to explore decision B.';
  }
  if (e.target.closest('#restore-reference')) {
    state[current.id].reference = { values: { ...initialValues(current), ...(current.id === 'statistics' ? { statView: state.statistics.values.statView } : {}) }, selected: [], label: 'Starting assumptions' };
    renderComparison(current, latestResult); document.getElementById('comparison-status').textContent = 'Decision A now uses the starting assumptions. Decision B is unchanged.';
  }
  if (e.target.closest('#apply-stress')) {
    const s = state[current.id], scenario = stressScenario(current.id, s.values);
    if (scenario.changed) {
      s.lastStress = { title: stressTitle(current, s.values), prediction: s.prediction, valuesBefore: { ...s.values }, valuesAfter: { ...scenario.values }, selected: [...s.selected], before: decisionMetrics(current.id, current.calc(s.values, s.selected)), after: decisionMetrics(current.id, current.calc(scenario.values, s.selected)) };
      s.reference = { values: { ...s.values }, selected: [...s.selected], label: 'Before the stress test' };
      s.values = scenario.values; syncControlValues(); updateResults();
      document.getElementById('comparison-status').textContent = 'The previous model is saved as A. Decision B now contains the one-assumption change.';
      document.getElementById('comparison-title').focus();
    }
  }
  if (e.target.closest('#reset')) {
    const s = state[current.id];
    if (current.id === 'statistics') activeControls(current).forEach(c => { s.values[c.id] = c.value; });
    else s.values = Object.fromEntries(current.controls.map(c => [c.id, c.value]));
    s.selected = [];
    syncControlValues(); updateResults();
  }
  if (e.target.closest('#export')) {
    const s = state[current.id];
    const evidence = evidenceQuestions[current.id];
    const statisticsExport = current.id === 'statistics' ? exportStatisticsViews(current, s) : [];
    const predictionRecord = s.lastStress ? [s.lastStress.title, `Prediction when applied: ${s.lastStress.prediction || '(Optional prediction left blank)'}`, ...activeControls(current).map(c => `${c.label}: ${s.lastStress.valuesBefore[c.id]} → ${s.lastStress.valuesAfter[c.id]} ${c.unit}`), ...s.lastStress.before.map((m, i) => `${m.label}: ${metricText(m.value, m.unit)} → ${metricText(s.lastStress.after[i].value, m.unit)}`), `Manual selections at application: ${s.lastStress.selected.join(', ') || 'None'}`] : ['No stress test has been applied.'];
    const text = ['Building AI Solutions · Business Decision Lab', 'By Majid Memari', current.title, 'Fictional teaching model; results are conditional on the assumptions below.', '', 'CURRENT ASSUMPTIONS (DECISION B)', ...activeControls(current).map(c => `${c.label}: ${s.values[c.id]} ${c.unit}`), '', 'CURRENT RESULTS', ...exportRows, ...statisticsExport, '', 'DECISION COMPARISON', ...comparisonExport, '', 'PREDICTION AND STRESS-TEST RECORD', `Current prediction draft: ${s.prediction || '(Not entered)'}`, ...predictionRecord, '', 'PREDICTION DEBRIEF', s.predictionReview || '(Not yet written)', '', 'CHECKPOINT', current.quiz.question, s.choice === null ? 'No response selected.' : current.quiz.options[s.choice], s.checked ? (s.choice === current.quiz.correct ? current.quiz.feedback : current.quiz.retry) : 'Response not checked.', '', 'EVIDENCE PLAN CHECKPOINT', evidence.question, s.evidenceChoice === null ? 'No response selected.' : evidence.options[s.evidenceChoice], s.evidenceChecked ? evidence.explanation : 'Response not checked.', '', 'RECOMMENDATION', s.reflections[0] || '(Not yet written)', '', 'EVIDENCE AND UNCERTAINTY', s.reflections[1] || '(Not yet written)', '', 'MODEL FORMULAS', ...current.formulas, '', 'MODEL LIMITS', current.assumptions, '', 'No student identity is requested or included by the application.'].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `building-ai-solutions-${current.id}-reflection.txt`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.getElementById('export-status').textContent = 'Reflection export created. Keep the downloaded file if you want to save this work.';
  }
});
labEl.addEventListener('keydown', e => { if (current.id === 'statistics' && e.key === 'Enter' && e.target.matches('input[type="number"][data-control]')) { e.preventDefault(); const c = current.controls.find(x => x.id === e.target.dataset.control); applyStatisticsControl(c, e.target.value === '' ? c.value : e.target.value); e.target.blur(); } });
labEl.addEventListener('focusout', e => { if (current.id === 'statistics' && e.target.matches('input[type="number"][data-control]')) { const c = current.controls.find(x => x.id === e.target.dataset.control); applyStatisticsControl(c, e.target.value === '' ? c.value : e.target.value); } });

if (location.pathname.includes('/labs/')) {
  const link = document.createElement('a'); link.href = '../index.html'; link.className = 'course-label'; link.textContent = '← Building AI Solutions';
  document.querySelector('.topbar .course-label').replaceWith(link);
}
renderLab(labFromHash() || labs[0]);
if (locationParts().step) jumpToLocation();
else updateStepContext();
