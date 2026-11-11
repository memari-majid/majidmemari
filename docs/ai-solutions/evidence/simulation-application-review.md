# Simulation application: independent source and model review

Reviewed November 10, 2026, against the implementation that applies the [simulation design study](../reference-study/README.md) to the five existing guided practices. The [application plan](../simulation-application-plan.md) defines the learning contracts. This report records source inspection and executed model checks; it does not substitute for the release owner's browser checks or a learner pilot.

## Conclusion

No unresolved material defect was found within this review's scope after corrections. The implementation preserves the twelve-unit course path and uses the reference patterns inside existing lessons: an initial prediction, linked evidence, an explicit decision, a fixed worked challenge, a retained or revised recommendation, and transfer to the capstone.

The original prediction and decision/settings are preserved when learners explore later. Revision can be written in the learner's own words, which permits realistic responses such as keeping the manual process while narrowing and retesting an AI workflow. Recording a response is explicitly not a judgment that it is correct.

## Evidence inspected

- [Practice state, models, rendering, and export](../course-source/assets/practice.js), including schema version 3 and the `cedar-desk-1` dataset identifier.
- [Practice styles](../course-source/assets/practice.css), [authored lesson content](../course-source/course_content.py), and [lesson assembly](../course-source/build_core.py).
- [Structural checker](../course-source/check_site.py), plus the existing print handlers in [site.js](../course-source/assets/site.js).
- The authored and executable challenge contracts for Units 2, 4, 6, 7, and 8.

| Unit | Independently checked comparison | Interpretation boundary |
|---|---|---|
| 2 | Longest wait 31 → 47 minutes; total 72 → 88; mean 9 → 11; median remains 6; eight records remain. | A changed teaching assumption is not a new observation, population estimate, or demand claim. Waiting time is not staff labor. |
| 4 | Same 8-hour emergency: unchecked draft releases one unsupported promise; source/authority review releases none. | This is one fictional case, not an error-rate estimate. A prepared owner handoff is not an owner decision, completed handoff, or refund. |
| 6 | Reviewed effort 84 → 90 minutes, compared with 96 manually. Reductions are 12.5% and 6.25%; the 10% rule requires at most 86.4 minutes. | The same twelve cases and quality counts are held fixed; added rework is hypothetical. Zero errors in this set does not prove future safety. |
| 7 | Six completions divided by twelve invitees = 50%; divided by nine starters ≈ 66.7%. | The people, completions, and 14-day window do not change. A larger percentage is not an improvement in behavior. |
| 8 | Planned adoption 50% → 30% gives net capacity value $0 → −$96 per month. Recurring cash change remains −$240. | The comparison holds volume, effort gain, costs, and period fixed. Capacity value does not establish cash savings. |

## Executed independent checks

A Node.js assertion script loaded the maintained practice module and exercised all five unit/family pairs. It checked:

1. All three initial answer choices in each activity: **15 initial-choice paths**, each followed by a freeform revision and a retained recommendation. Wrong initial choices did not prevent recording a revised response.
2. Preservation of the first prediction/reason and original decision/settings after later choices, changed numerical inputs, policy changes, case changes, and denominator changes.
3. Serialized JSON round trips through `restoreState`, with original and final records retained in readable exports.
4. Five version-2 migrations, preserving notes and transfer text without inventing an earlier commitment. Unit 4 clears old numeric answers because its questions changed, preserving the old answer wording separately instead of presenting it as an answer to the new authority question.
5. A known schema with an unmatched dataset identifier: safe text remains, while an old commitment is not accepted as current evidence.
6. Freeform recommendation/reason HTML escaping and 1,800-character bounds. A test string containing HTML/script markup remained escaped in rendered markup; it was not executable content.
7. Exact scenario values, shared chart/table column counts, finite in-domain figure values, and zero-width bars for exact zero. Percentage comparisons use a numerical tolerance for ordinary floating-point rounding.
8. Explicit fixed-challenge feedback wording and the statement that a written recommendation is not automatically judged.

The script completed successfully. `python3 check_site.py` also reported: **PASS: 60 HTML pages; 12 units, 5 rubrics, 5 inline practice/worked comparisons, links/anchors, branding, portable archive.** These independent checks complement the maintained test suite; the release record reports its final test count.

## Corrections made during review

- An initial comparison renderer imposed a minimum bar width even for zero. Exact zeros now render with zero width, avoiding an apparent positive amount for Unit 4's reviewed promise count and Unit 8's base net capacity value.
- Saved response feedback initially used “your setting” for a fixed challenge. It now identifies the fixed worked challenge, preventing confusion when the learner's exploration inputs differ.
- Unit 4's earlier stored answer indices could otherwise have acquired a different meaning under its new questions. The migration now preserves their old wording separately and requires a fresh current answer.

The release owner also requested freeform revisions in place of reusing the original three answer options. This review checked the resulting restore, export, escaping, and no-automatic-grading behavior.

## Static reading and review boundaries

Source inspection confirms that each interactive practice precedes its optional **Worked explanation and evidence limits** disclosure inside Try. The ordinary HTML retains complete calculations, interpretation limits, and a capstone transfer. The no-JavaScript message directs learners to write a recommendation before opening that explanation. The existing print handler opens disclosures and restores their prior state afterward.

Those source facts do not establish visual rendering, keyboard usability, screen-reader behavior, reduced-motion behavior, actual browser downloads, or successful production deployment. The release owner verifies those relevant runtime boundaries separately. Unknown future schema versions are not claimed to be compatible. Neither these checks nor a completed practice marker establishes learner mastery, actual partner outcomes, or course effectiveness.
