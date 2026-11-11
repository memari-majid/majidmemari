# Forecast: a mechanism-first learning sequence

Source: [reference forecast simulation](https://simulations-6620.vercel.app/c/mktg-6620/forecast). Inspected through the authenticated learner interface on November 10, 2026. This is original analysis of the experience, not an export of its lesson or question bank.

## Coverage and limits

Both top-level parts, all eight concept sections, all five optional mathematical disclosures, all six inline checks, and all 23 practice cards were inspected. All 23 practice explanations were revealed with a mixture of correct and incorrect selections. The major control families were exercised: trend reveal, linked month/lag sliders, AR/MA switch and coefficient, three differencing settings, ACF/PACF cutoffs and reset, both model presets, and all six order selectors. Boundary samples included the first available decomposition month, lag 24, negative MA coefficient, high positive AR coefficient, and both model selectors set to zero terms.

This is finite-section and interaction-family coverage, not every coefficient, every model combination, every answer option, a numerical reproduction of the reference, or proof of instructional effectiveness. No backend, build configuration, source code, or complete dataset was inspected. Responsive checks are recorded separately in the study index.

## Experience map

Unlike the other five cases, this route has two parts: a long hands-on sequence and an ungraded practice area. The learner can switch either way. The page says state lasts while the page stays open; returning from practice preserved earlier choices and revealed feedback in the observed session.

| Concept | Learner action | Coordinated representations | Instructional purpose |
|---|---|---|---|
| 1. Anatomy of a series | Reveal trend; choose a month | Full history, four aligned decomposition panels, four numeric tiles, additive identity, monthly seasonal bars | Name components, then demonstrate that they reconstruct one observation |
| 2. Autocorrelation | Increase lag from 1 through 24 | Lag scatterplot, pair count, correlation, progressively filled correlogram, highlighted lag, changing explanation | Build the summary statistic from visible pairs instead of introducing an unexplained ACF chart |
| 3. AR and MA memory | Switch generator; vary signed coefficient | Fixed-shock generated series, formula with current coefficient, ACF and count of bars beyond its band | Hold random input constant to isolate the effect of the parameter |
| 4. Differencing | Choose zero, one, or two differences | Relabeled series, mean line, test statistic, p-value, null-decision language, explanation | Compare transformation, visual behavior, and diagnostic evidence |
| 5. Identification | Set ACF/PACF cutoffs; restore suggested reading | Highlighted cutoff, faded later bars, count of crossings after cutoff, current model order beside suggested order | Expose ambiguity rather than presenting chart reading as exact pattern recognition |
| 6. Model comparison | Pick two sets of orders or a preset pair | Coefficient/standard-error tables, information-criterion values, common-axis dot comparison, gap and winner annotation | Connect model complexity to a comparison with a visible scale |
| 7. Diagnostics and forecast | Read plots; answer checks | Residual correlogram, diagnostic tiles, history/forecast boundary, nested uncertainty bands | Separate explaining past data from planning with uncertain future values |
| 8. Automated choice and tool fit | Compare manual/automatic alternatives; answer checks | Coefficient table, four models on one axis, caveats, scenario choices | Treat automation as a candidate-generating aid with assumptions |

Each concept uses a numbered eyebrow, a descriptive heading, a small amount of narrative, local definitions, chart-reading instructions, the figure/control, numeric interpretation, and a short implication. Optional formulas sit after the visual intuition. The sequence uses no programming task, although it discusses statistical software and displays model notation.

## Concrete interaction observations

- **Decomposition cursor:** moving to the earliest supported month changed all four readouts and the explanatory identity together. The observed result reconstructed 0.96 from 2.50, −0.10, and −1.44. The UI explained why a centered smoothing window leaves missing components near the ends. The slider avoids those unsupported months.
- **Lag construction:** at lag 1 the view reported 200 pairs and correlation 0.98. At lag 24 it reported 177 pairs and 0.38. The scatter axes, caption, selected bar, and progress statement updated consistently. Intermediate lag 14 was also observed. The teaching move is the reduction in available pairs as lag grows, not just a changing chart shape.
- **Fixed randomness:** the generator explicitly states that the shocks remain fixed. Switching to MA changed the coefficient label, formula, plot and narrative. At a sampled negative coefficient the lag-one correlation was −0.50 and later bars stayed within the displayed band; switching back to AR with a high positive coefficient produced a longer-memory explanation. This is a controlled comparison, not decorative animation.
- **Differencing states:** zero differences displayed an upward level and a non-rejection result; one difference showed a roughly constant change; two differences showed change-in-change and warned against unnecessary transformation. Axis titles changed with the meaning of the plotted quantity.
- **Cutoff disagreement:** choosing q = 0 and p = 3 produced a different candidate order, counted what remained beyond the cutoffs, and exposed a restore button. The reference openly acknowledges that a second PACF spike makes an alternative plausible.
- **Model comparison:** changing the preset updated the gap from a near tie to a much larger separation. Setting both candidates to all-zero orders removed the comparison plot and presented an explanation instead of NaN or fabricated values. This particular restriction belongs to this interface; it is not a general statistical rule that a white-noise/mean model cannot be fitted.
- **Feedback:** a wrong inline answer marked the chosen option with a cross and explanatory text, marked the correct option with a check, disabled the options, and exposed reasoning. Correct responses also revealed reasoning. Switching parts retained these states. No retry control was observed for the locked cards.
- **Optional depth:** five disclosures cover decomposition arithmetic, model-memory formulas, differencing, borderline ACF/PACF readings, and information-criterion arithmetic. The first disclosure explains endpoint loss and the final one connects parameter count to a displayed score.

## Practice architecture

There are eight topical groups and 23 ungraded questions. Their distribution is 3, 3, 3, 3, 3, 2, 3, and 3 across decomposition, autocorrelation, model memory, stationarity, identification, model comparison, diagnostics/uncertainty, and automated/tool choice. Six stimuli are placed above their related cards: five plots and one model-comparison table. This revisits the same visual language used during learning.

All cards reveal an explanation after a commitment; no visible aggregate grade was observed. A capability recap appeared after all 23 cards had been answered, despite the deliberately mixed correctness of those answers. It therefore indicates completion of the practice opportunity, not demonstrated mastery. The page explicitly describes the practice as unrecorded and unscored. That statement was read, not independently verified against a server. The docs preserve the assessment pattern and topic inventory, not the original questions or answer key.

## What to transfer to Building AI Solutions

Use the **linked representation pattern**, not the full ARIMA syllabus, for business learners. A useful adaptation is a demand-and-capacity decision in which a learner chooses a horizon, reads a baseline forecast and uncertainty, commits staffing or stock, sees the cost of shortage versus unused capacity, and writes a conditional operating rule. Add a simple benchmark and a held-out period. Keep advanced model identification optional.

An original small-data implementation can have:

```text
forecastCase = {
  version, syntheticDataDisclosure, periods, observedDemand,
  trainingEnd, evaluationEnd, forecastHorizon,
  candidates: [{id, method, fittedValues, forecasts, lower, upper}],
  costs: {unusedUnit, missedDemand},
  decisions: {capacity, reviewDate},
  explanationRules
}
```

Derive chart geometry, tables and captions from the same selected candidate and horizon. Show units, dates, training/evaluation boundaries and uncertainty meaning. Store a decision before revealing outcomes. Explain that a scenario result is not a claim about a real business.

## Accuracy review before reuse

Some reference wording is stronger than its evidence. Preserve its pedagogical mechanics while correcting these points:

1. An ADF test specifically tests a unit-root null under a chosen specification; it is not a universal proof of stationarity or a test for every kind of trend. See [statsmodels ADF documentation](https://www.statsmodels.org/stable/generated/statsmodels.tsa.stattools.adfuller.html).
2. The reference compares AIC across different differencing orders while also warning about comparability. A safer teaching design chooses differencing separately and compares like-for-like candidates; see the information-criteria discussion in [Forecasting: Principles and Practice](https://otexts.com/fpp3/arima.html).
3. Uncorrelated residuals are a diagnostic check, not proof that a model is best or deployable. Include evaluation on future-held-out data and a baseline. See [the forecasting diagnostics and evaluation chapter](https://otexts.com/fpp3/toolbox.html).
4. The reference's claim that Prophet cannot take additional predictors should not be transferred: Prophet documents additional regressors. See [Prophet's official documentation](https://meta.github.io/prophet/docs/seasonality,_holiday_effects,_and_regressors.html).
5. Do not infer that a small seasonal coefficient proves which part caused an AIC improvement; that requires a controlled comparison. Do not teach one method as universally superior for a broad business category.

These are review cautions, not a comprehensive statistical audit of the reference.
