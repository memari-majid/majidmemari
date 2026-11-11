"""Original formative and individual assessment content for Building AI Solutions.

Choice prompts, choices, feedback, and rationales are plain text. Evidence,
discussion, and final-exam instructions are HTML. Final-exam model answers and
marking allocations live only in the ignored private instructor guide, never
in FINAL_EXAM or the student cartridge. All examples below are fictional.
"""


def _question(prompt, choices, correct_index, rationale, section="Learn and Try"):
    return {
        "prompt": prompt,
        "choices": [{"text": text, "feedback": feedback} for text, feedback in choices],
        "correct_index": correct_index,
        "rationale": rationale,
        "section": section,
    }


UNIT_PRACTICE = {
    1: [
        _question(
            "A draft correctly states the policy but says a booking has been changed. No action occurred. What is the best revision?",
            [
                ("Keep it because the policy is accurate.", "The policy and the action claim need separate checks. Accurate policy wording cannot make an unperformed booking change true."),
                ("Remove the false confirmation and state the actual next step.", "Correct. Remove the unsupported action claim and explain who must check or confirm the request next."),
                ("Add a general disclaimer and keep the confirmation.", "A disclaimer does not repair the specific false confirmation. Rewrite that claim so it matches what actually happened."),
            ], 1,
            "Check material claims individually: the source may support a policy while no evidence supports an action. State the known status and the responsible person's next step.", "Finish"),
        _question(
            "A source says a rescheduling request made at least 48 hours before a session can be considered, subject to space and coordinator confirmation. A request arrives 60 hours before the session. No destination session or availability is supplied. Which draft is supported?",
            [
                ("Your new place is confirmed because 60 is greater than 48.", "The timing condition is met, but available space and coordinator confirmation are still unknown. Passing one condition does not satisfy the others."),
                ("The request must be refused because availability is unknown.", "Unknown availability calls for a check, not an unsupported refusal. The source permits consideration when all conditions can be checked."),
                ("The change can be considered; ask which session to check and explain that availability and coordinator confirmation are required.", "Correct. This preserves the source's conditions and asks for the missing fact without inventing a completed change."),
            ], 2,
            "A useful draft distinguishes eligibility to consider a request from confirmation that the request has been fulfilled. Source conditions remain attached to the claim."),
        _question(
            "A project uses AI to draft replies from approved sources. Only a coordinator is authorized to send replies or change bookings. Which instruction gives the AI a useful bounded role?",
            [
                ("Prepare a draft and source table; flag missing facts and exceptions for the coordinator, and do not send or change anything.", "Correct. The task, source boundary, output, reviewer, and stop condition are explicit."),
                ("Do whatever creates the happiest customer, including booking changes.", "Customer satisfaction is not authority to act. This instruction removes the stated coordinator boundary and makes the task difficult to verify."),
                ("Send the reply whenever the AI reports high confidence.", "The assistant's confidence is not the coordinator's approval or evidence that the action is authorized."),
            ], 0,
            "AI assistance can produce a useful draft without being given authority to make commitments. Define what the tool may prepare and what a person must decide."),
    ],
    2: [
        _question(
            "In the same eight-record wait sample, only the longest wait increases. The median stays at 6 minutes while the total rises from 72 to 88 minutes. What should you conclude?",
            [
                ("The service cannot have worsened because the median is unchanged.", "The median describes the middle, not every observation. The unchanged middle can coexist with a worse long exception and a higher total."),
                ("Every customer now waits two extra minutes.", "The mean rises by (88 − 72) ÷ 8 = 2 minutes, but only the longest record changed. A change in the mean is not an equal change for everyone."),
                ("The middle experience is unchanged, but the total burden and long exception increased.", "Correct. The middle positions are stable while the longer tail increases the total and mean."),
            ], 2,
            "Mean, median, and total answer different questions. Here the mean changes from 72 ÷ 8 = 9 to 88 ÷ 8 = 11 minutes; the median stays 6 minutes.", "Finish"),
        _question(
            "You want to understand delays in replying to requests before proposing a tool. Which question best starts a neutral discovery conversation?",
            [
                ("Would an impressive AI assistant solve your delays?", "This introduces the solution and encourages agreement before learning how the current task works."),
                ("Tell me about the last reply that took longer than expected. What happened, and what did you try?", "Correct. A recent event and the person's actual actions provide a better starting point than a reaction to your proposed tool."),
                ("How much would you pay for my AI assistant next year?", "A hypothetical price response is not a description of a recent problem or evidence of a real purchase. Start with the work and its consequences."),
            ], 1,
            "Investigate events, current alternatives, consequences, and contrary examples. Do not treat polite interest in a proposed tool as proof of need."),
        _question(
            "In eight fictional convenience-case records, six people report repeated delay and three say they would try a pilot. Their overlap is not supplied, and nobody has paid. Which statement is defensible?",
            [
                ("Three of eight, or 37.5%, say they would try; that is not purchase evidence or a population forecast.", "Correct. The count and denominator are known, while overlap, payment, and population demand are not established."),
                ("Six-eighths multiplied by three-eighths proves that 28.125% of the market will buy.", "The overlap is unknown and willingness to try is not payment. Multiplication cannot turn these different convenience-sample answers into market demand."),
                ("The three people willing to try must be among the six reporting repeated delay.", "That overlap is plausible, but the records do not identify who is in both groups. Do not present an assumed overlap as an observed fact."),
            ], 0,
            "Three ÷ eight × 100 = 37.5%. Keep the claim attached to the measured question, sample, and evidence limit."),
    ],
    3: [
        _question(
            "The existing complete task takes 8 minutes. AI drafting takes 2 minutes, and checking, correction, and handoff add 6 minutes. What claim is supported?",
            [
                ("The complete task still takes 8 minutes; a net saving is not yet shown.", "Correct. The assisted total is 2 + 6 = 8 minutes, equal to the complete baseline."),
                ("The organization saves 75% of its labor expense.", "Only drafting fell from 8 to 2 in this comparison. Full effort remains 8 minutes, and neither payroll nor cash expense was measured as reduced."),
                ("The AI option should launch because drafting is faster.", "A faster subtask does not establish a complete-task gain, acceptable quality, user need, or readiness to launch."),
            ], 0,
            "Compare complete processes on the same basis. A useful subtask change may still have no net effort benefit after checking and handoff.", "Finish"),
        _question(
            "A source-card/template option meets a required no-unauthorized-commitment boundary. An AI candidate has made one unauthorized commitment in a test, but receives a higher convenience score. What is the sound next decision?",
            [
                ("Choose the AI candidate because a high average score offsets any failed boundary.", "A mandatory quality boundary is not canceled by convenience points. The failure requires correction and retest before the affected use."),
                ("Treat both options as equally ready because both have a numerical score.", "Scores record judgments; they do not erase the observed boundary failure or establish readiness."),
                ("Keep the acceptable option available and correct/retest the AI candidate before considering it for the bounded use.", "Correct. Apply the quality boundary first, then compare viable alternatives using evidence and complete effort."),
            ], 2,
            "Feasibility and consequential quality conditions screen options. A weighted score is not permission to bypass a required condition."),
        _question(
            "A learner has two weeks, approved policy documents, an available AI assistant, and one reviewer. Which initial scope is most feasible and testable?",
            [
                ("Automate every customer interaction, payment, refund, and exception across the organization.", "This scope exceeds the stated information, time, access, and authority. It is too broad to evaluate responsibly in the available period."),
                ("Support one coordinator in preparing a checked reply or exception note for one policy, excluding live sending and booking changes.", "Correct. The user, task, output, reviewer, and exclusions are bounded enough to build and test."),
                ("Make a presentation saying AI will improve all operations, without selecting a task.", "A broad presentation does not identify an observable intended task or a usable solution to evaluate."),
            ], 1,
            "A small complete task is more useful than a broad feature promise. Bound the output and the authority needed to use it."),
    ],
    4: [
        _question(
            "The assistant cites the correct cancellation policy but promises a refund that the policy does not authorize. What should happen?",
            [
                ("Release it because it includes a citation.", "A citation is not enough: the material claim must follow the source's conditions. This refund promise does not."),
                ("Hold the draft and prepare an owner handoff with the relevant facts.", "Correct. The draft is held while the authorized person reviews the exception; the handoff is not itself approval."),
                ("Ask the same assistant whether its answer sounds confident.", "A confidence judgment does not supply authorization or correct the source mismatch. Check the policy and named decision owner."),
            ], 1,
            "Source grounding and authority are separate checks. A human exception decision cannot be replaced by a citation or confident wording.", "Finish"),
        _question(
            "A policy provides refund eligibility at least 72 hours before a session, 90-day credit from 24 hours up to but not including 72 hours, and no automatic refund or credit under 24 hours. A cancellation arrives exactly 24 hours before the session. Which branch applies?",
            [
                ("The credit branch applies; 24 hours is included, without claiming a payment or credit action was already processed.", "Correct. The interval includes exactly 24 hours and excludes 72. Explaining eligibility is different from processing the action."),
                ("The under-24-hours exception branch applies.", "Under 24 means less than 24. The exact 24-hour boundary belongs to the stated credit interval."),
                ("The refund branch applies because the request is not late.", "The refund condition is at least 72 hours. General impressions of lateness cannot replace the policy's numerical boundaries."),
            ], 0,
            "Check inclusive and exclusive boundaries explicitly. A correct branch still does not prove that an operational action occurred."),
        _question(
            "A workflow produces a complete exception note containing the question, sources, missing facts, and proposed next step. The owner has not yet reviewed it. What status should the delivery record show?",
            [
                ("The owner approved the request because the note is complete.", "A complete note prepares the decision; it is not evidence that the owner made it."),
                ("The customer's requested action has been completed.", "No such action is supplied. The delivery record must report observed status rather than an intended result."),
                ("The exception note is prepared and awaiting the owner's decision; no customer commitment is authorized yet.", "Correct. This distinguishes preparation, review, authorization, and action."),
            ], 2,
            "Workflow outputs and human decisions need separate status labels. An inspectable handoff is useful even while the decision remains pending."),
    ],
    5: [
        _question(
            "Your attractive prototype screen has no usable output, source card, or manual process behind it. Which addition most directly meets the implementation goal?",
            [
                ("A longer presentation about future features.", "A presentation can explain an idea, but it does not let another person perform the intended task."),
                ("An animation of a successful result.", "An animation represents a result; it does not demonstrate a reviewer completing the actual bounded task."),
                ("A working kit that a reviewer uses to complete the bounded task.", "Correct. The usable artifact, instructions, task, output or handoff, and observed use provide implementation evidence."),
            ], 2,
            "Implementation is demonstrated by usable work. A document-based service can qualify without programming when another person can operate it.", "Finish"),
        _question(
            "You are preparing three first bench tests for a policy-grounded reply kit. Which set best checks varied behavior?",
            [
                ("Three differently worded ordinary questions that all use the same policy branch.", "Wording variation is useful, but this set may miss missing-information and exception behavior."),
                ("One ordinary question, one question missing a necessary fact, and one exception requiring a human handoff, each with expected and actual behavior recorded.", "Correct. These cases test the ordinary path, clarification, and the boundary of automated assistance."),
                ("Three screenshots of the welcome screen with no task inputs or expected results.", "Screenshots can document appearance, but they do not test whether the task or its exception handling works."),
            ], 1,
            "Vary consequential conditions and record expected versus actual behavior. An attractive screen is not a substitute for a bench test."),
        _question(
            "A test reveals an unsupported refund promise. Which revision/retest record most directly addresses the defect?",
            [
                ("Change the source/authority instruction, rerun the failed exception, and check an ordinary case for unintended effects.", "Correct. The change addresses the failure mechanism and tests both the affected path and transfer to another case."),
                ("Change the heading color and label the version fixed without rerunning the case.", "A decorative change does not address the unsupported commitment, and no retest supports the fixed label."),
                ("Delete the failed result so the test record includes only successful examples.", "Deleting the failure conceals the reason for revision and prevents a reviewer from checking what changed."),
            ], 0,
            "Keep the defect, consequential change, and actual retest together. A useful revision improves behavior, not just the presentation of results."),
    ],
    6: [
        _question(
            "Extra rework increases the reviewed total from 84 to 90 minutes against a 96-minute baseline. The predeclared effort target is a reduction of at least 10%. What is the new reduction?",
            [
                ("6.25%, and the 10% effort target is missed.", "Correct. (96 − 90) ÷ 96 × 100 = 6.25%, below the stated target."),
                ("12.5%, because the original draft is unchanged.", "The earlier 12.5% used an 84-minute total. Complete effort is now 90 minutes, so the comparison must change."),
                ("93.75%, so the process is almost completely automated.", "90 ÷ 96 = 93.75% is the effort remaining, not the reduction. It does not establish automation or acceptable quality."),
            ], 0,
            "Use the baseline in the denominator and include rework in the assisted total. Check the quality condition separately from the effort target.", "Finish"),
        _question(
            "You will compare a manual process with a reviewed AI process. Which plan produces the most interpretable classroom comparison?",
            [
                ("Give the AI process only easy cases and the manual process only exceptions.", "Case difficulty would be confounded with the process. A difference could reflect the cases rather than the method."),
                ("Time only AI drafting, but time every manual step.", "Different timing boundaries create an unfair comparison. Preparation, checking, rework, and handoff must be treated consistently."),
                ("Use the same agreed cases and complete timing boundaries, record quality and assistance, and vary or document order to consider practice effects.", "Correct. Matching cases and measurement definitions improves interpretability; recording order and assistance exposes important limits."),
            ], 2,
            "A small classroom test is not automatically causal evidence, but a defined comparison makes its observations more useful and its limits clearer."),
        _question(
            "A reviewed AI process produces 12 acceptable replies with no material errors in 12 supplied cases. Which reliability statement is justified?",
            [
                ("The process cannot make an error on any future input.", "Zero errors in this small test set do not establish zero future risk or coverage of all inputs."),
                ("All 12 tested cases met the stated criterion; inspect coverage and test new consequential cases before making a broader claim.", "Correct. The claim stays within the observed set and identifies what further evidence is needed."),
                ("No more source checking is needed because the sample is perfect.", "The result was achieved with review. Removing that review changes the tested process and cannot be justified by the reviewed result alone."),
            ], 1,
            "Name the tested version, cases, criteria, and limits. A favorable result is evidence about those conditions, not a guarantee."),
    ],
    7: [
        _question(
            "During the 14 days after invitation, 6 of 12 supplied-case invitees complete a task, and 4 of those 6 return for another task. Which claim is precise?",
            [
                ("Two-thirds of all invitees returned.", "Four of six completers is two-thirds; four of twelve invitees is one-third. Name the denominator correctly."),
                ("Four of six completers returned within 14 days after invitation.", "Correct. This describes return among completers in the stated observation window, without changing the cohort."),
                ("Half of future customers will buy the product.", "Completion in a fictional cohort is neither payment evidence nor a forecast for future customers."),
            ], 1,
            "The same four returns can be described as 4/6 among completers or 4/12 among invitees. Neither ratio measures a purchase rate.", "Finish"),
        _question(
            "A learner reads a supplied successful test example and then checks their own kit alone. No other person has tried that version. How should the evidence be labeled?",
            [
                ("Supplied example and self-review; an actual other-person task attempt is still pending.", "Correct. Both activities support preparation, but neither is an observation of another person using this version."),
                ("A successful customer pilot with two observed users.", "Neither a real customer nor two observed users is supplied. This label invents events."),
                ("An actual other-person test because the AI can role-play a user.", "An AI role-play can reveal questions, but it is not another person's observed attempt and cannot replace that evidence."),
            ], 0,
            "Distinguish supplied data, self-review, role-play, and actual events. Mark a required attempt pending until it happens."),
        _question(
            "A reviewer needed help finding a required intake field. You moved the field before drafting. Which next record most strongly supports learning from the revision?",
            [
                ("A statement that the new layout looks cleaner, with no task attempt.", "Appearance alone does not show whether the reviewer can now complete the task without the earlier assistance."),
                ("The original failed observation removed from the record.", "Removing the failure hides the evidence that motivated the change and makes the claimed improvement harder to inspect."),
                ("An actual retest using the revised version, recording whether the field is found, assistance, task result, and a changed case or remaining limitation.", "Correct. This directly tests the intended correction and preserves what the observation can and cannot show."),
            ], 2,
            "A revision becomes evidence-backed when the changed behavior is observed again and the result is interpreted honestly."),
    ],
    8: [
        _question(
            "The base scenario releases $240 of assigned time value and adds $240 of recurring cash expense. Payroll and other spending are unchanged. What is correct?",
            [
                ("Cash profit increases by $240.", "Assigned value for released time is not a cash receipt or avoided spending. The new recurring expense still reduces cash."),
                ("The project breaks even in cash because the two values match.", "The two quantities match only in the capacity-value estimate. Cash spending rises by $240 when payroll and other spending do not fall."),
                ("Net capacity value is $0, while recurring cash change is −$240.", "Correct. $240 capacity value − $240 expense = $0 net capacity value; $0 avoided spending − $240 expense = −$240 cash change."),
            ], 2,
            "Keep cash and assigned time value separate. Released time may be useful, but its value and intended use need evidence.", "Finish"),
        _question(
            "A monthly planning case has 1,200 eligible replies, 30% adoption, one minute released per assisted reply, $24/hour assigned capacity value, and $240 recurring cash expense. Payroll and other spending are unchanged. Which calculation is correct?",
            [
                ("360 assisted replies release 360 hours, so net capacity value is $8,400.", "360 replies × one minute = 360 minutes, not hours. Convert to six hours before valuing the time."),
                ("360 assisted replies release six hours worth $144; net capacity value is −$96 and cash change is −$240.", "Correct. 1,200 × 30% = 360; 360 ÷ 60 = 6 hours; 6 × $24 = $144; $144 − $240 = −$96."),
                ("Adoption is 30%, so the fixed recurring expense must also fall to 30% of $240.", "The prompt states a $240 recurring expense, not a per-use cost. Changing adoption does not change that fixed input."),
            ], 1,
            "Changing one assumption should change only the quantities that depend on it. This is a conditional planning scenario, not observed adoption."),
        _question(
            "Each assisted reply releases $0.40 of assigned capacity value. Recurring expense is $240/month and eligible volume is 1,200 replies/month. Payroll is unchanged. Which threshold is correctly named?",
            [
                ("600 assisted replies, or 50% adoption, is the capacity-value break-even threshold; it is not cash break-even.", "Correct. $240 ÷ $0.40 = 600 replies; 600 ÷ 1,200 = 50%. Unchanged payroll means time value is not avoided cash spending."),
                ("240 assisted replies is guaranteed cash break-even because the cost is $240.", "The dollar cost must be divided by dollars of assigned value per reply. A reply count cannot be copied from a dollar amount."),
                ("Any positive adoption produces cash profit because AI releases time.", "Time value is not automatically cash, and positive adoption does not necessarily cover recurring expense even in the capacity model."),
            ], 0,
            "A threshold must name the modeled quantity and assumptions. A favorable arithmetic threshold is not a forecast that users will adopt."),
    ],
    9: [
        _question(
            "A package is priced at $180. Delivery uses $108 of valued owner time and $12 cash expense, before acquisition and fixed costs. What does $60 represent?",
            [
                ("Contribution after valuing delivery time, before omitted acquisition and fixed costs.", "Correct. $180 − $108 − $12 = $60, with acquisition and fixed costs still excluded."),
                ("Guaranteed cash profit from every new customer.", "This figure includes a time valuation and excludes other costs. It is neither complete profit nor a guaranteed result."),
                ("The maximum price a buyer will pay.", "The cost calculation does not measure willingness to pay or a buyer's alternatives."),
            ], 0,
            "Name what is included in the margin and what remains excluded. Cash left before compensating owner time is a different quantity.", "Finish"),
        _question(
            "A provider has 15 delivery hours available per month. Each complete package takes 4.5 hours, with no additional delivery capacity. How many whole packages can be completed within that limit?",
            [
                ("3.33 completed packages, because 15 ÷ 4.5 is approximately 3.33.", "The ratio is a capacity calculation, but the deliverable is a whole package. A fraction cannot be counted as a completed package under these terms."),
                ("4 completed packages by rounding to the nearest whole number.", "Four packages require 18 hours, exceeding the available 15. Rounding up creates an unsupported delivery promise."),
                ("3 complete packages, using 13.5 hours, with 1.5 hours remaining.", "Correct. Three × 4.5 = 13.5 hours; a fourth would exceed the limit."),
            ], 2,
            "Respect the unit of delivery and the capacity boundary. More interest does not create additional hours."),
        _question(
            "Your only performance evidence is a small reviewed classroom test. You can supply a source card, an intake/review kit, one training session, and one revision. Which offer is truthful?",
            [
                ("Guaranteed 75% labor-cost savings with unlimited automatic service.", "The supplied evidence does not establish guaranteed labor-cost savings, automatic authority, or unlimited delivery capacity."),
                ("A bounded reviewed kit with the listed files, training and revision, an agreed test, exclusions, and a clearly stated resource request.", "Correct. This promise describes what can be delivered and how it will be reviewed, without turning a classroom result into a guarantee."),
                ("A promise that every interested person will become a paying customer.", "Interest is not payment evidence. Such a promise is outside the supplied performance evidence and the provider's control."),
            ], 1,
            "An offer should connect a useful task to scope, acceptance, resources, and limits. It should not outgrow the evidence or delivery capacity."),
    ],
    10: [
        _question(
            "A campaign costs $270 including valued time, produces 20 qualified conversations and 5 pilot agreements, but only 3 new paying customers. What is acquisition cost per new paying customer?",
            [
                ("$54, because every pilot agreement is a customer.", "$270 ÷ 5 = $54 is cost per pilot agreement. A pilot agreement is not necessarily a new paying customer."),
                ("$90, using the 3 actual new paying customers.", "Correct. $270 ÷ 3 = $90 per new paying customer for the defined campaign and cost boundary."),
                ("$13.50, using the 20 qualified conversations.", "$270 ÷ 20 = $13.50 is cost per qualified conversation, a different measure with a different denominator."),
            ], 1,
            "Use the denominator named by the metric. Include the stated valued time consistently and do not relabel earlier funnel stages as customers.", "Finish"),
        _question(
            "In one campaign, 100 people are reached, 20 have a qualified conversation, and 5 agree to a pilot next step. Which pair of rates is correct?",
            [
                ("Pilot agreement is 5% of people reached and 25% of qualified conversations.", "Correct. 5 ÷ 100 = 5% and 5 ÷ 20 = 25%. Both describe the same five agreements with named denominators."),
                ("Pilot agreement is 25% of all people reached and 5% of qualified conversations.", "The denominators are reversed. Divide by 100 for all reached and by 20 for qualified conversations."),
                ("Pilot agreement is 20% because that is the conversation rate.", "20 ÷ 100 = 20% describes conversations, not pilot agreements. Keep funnel stages distinct."),
            ], 0,
            "A conversion rate is incomplete without its stage, denominator, and observation period. An agreement is still not evidence of use or payment."),
        _question(
            "Five prospects want delivery this month, but your verified capacity is three whole packages. Which next step fits a truthful offer?",
            [
                ("Promise immediate delivery to all five and decide later how to cover the work.", "This exceeds known capacity and creates a commitment unsupported by the operating plan."),
                ("Treat all five as completed sales and ignore delivery until the next report.", "Interest, agreement, delivery, and payment are different states. This records outcomes that have not happened."),
                ("Explain the capacity limit, agree realistic start dates or narrower scope, and record the actual next commitment.", "Correct. The conversation connects demand to deliverable capacity and preserves honest status labels."),
            ], 2,
            "A useful route to users includes delivery and onboarding, not just an attractive funnel count."),
    ],
    11: [
        _question(
            "The policy may have changed, but the approved replacement is unavailable. What is the sound operating response?",
            [
                ("Let an AI infer a likely new rule.", "A plausible generated rule is not an approved source and cannot authorize a consequential response."),
                ("Use the old rule without mentioning uncertainty.", "That hides a known source-validity problem. The affected output should not be released as if the source were current."),
                ("Hold affected outputs, obtain the approved source, and retest the changed path.", "Correct. This preserves the review boundary and checks the consequences of the eventual source update."),
            ], 2,
            "Source maintenance is part of operation. A source change may require both a workflow change and a retest before release.", "Finish"),
        _question(
            "A review queue starts with 2 waiting requests. During the period, 8 new requests arrive and 6 are completed. There are no other arrivals, removals, or cancellations. How many requests remain waiting?",
            [
                ("2, because 8 − 6 = 2.", "That counts only the net new work and forgets the two requests already waiting at the start."),
                ("4, because 2 + 8 − 6 = 4.", "Correct. Reconcile the starting queue, arrivals, and completed work over the same period."),
                ("0, because completing six requests means the queue was productive.", "Productivity does not imply the queue is empty. The arrival and starting-work counts still have to be reconciled."),
            ], 1,
            "A throughput count can look favorable while waiting work grows. State what remains and what operating decision follows."),
        _question(
            "Which handoff most supports continued responsible use after a project ends?",
            [
                ("Current files and source version, operating steps, named owner, review/exception rules, support limits, and update or stopping conditions.", "Correct. These let the recipient locate, operate, review, maintain, or close the actual service."),
                ("A demonstration link with no source files or named person responsible for updates.", "A demonstration can explain a result but does not establish maintainable access, ownership, or source control."),
                ("A promise of unlimited support forever, without confirming available time or responsibility.", "An unsupported support promise can make the handoff less dependable. State the actual boundary and owner."),
            ], 0,
            "A handoff transfers usable instructions and accountability, not just presentation material."),
    ],
    12: [
        _question(
            "Your classroom test succeeds, but demand and review cost remain uncertain. Which final recommendation best matches the evidence?",
            [
                ("Recommend a bounded next step, show the actual test and economics, and name the unresolved assumptions.", "Correct. This preserves what the test established while identifying the next evidence needed for a broader decision."),
                ("Claim product-market fit because the task worked once.", "A task result does not establish demand, willingness to pay, repeat use, or sustainable delivery."),
                ("Remove the unfavorable scenario to keep the pitch confident.", "Removing relevant uncertainty makes the recommendation less defensible. Show how a changed condition affects the decision."),
            ], 0,
            "Need, performance, and adoption are separate evidence questions. A credible recommendation includes what remains unresolved.", "Finish"),
        _question(
            "A complete-process benchmark falls from 96 to 84 minutes. A bar chart starts its axis at 80, so the visible bar lengths are 16 and 4. Which statement correctly interprets the change?",
            [
                ("The task takes 75% less time because the visible bar length falls from 16 to 4.", "That 75% describes truncated bar lengths, not the actual 96-minute baseline. The restricted axis exaggerates the apparent magnitude."),
                ("The task takes 87.5% less time because 84 ÷ 96 = 87.5%.", "84 ÷ 96 is the proportion of effort remaining. The reduction is the difference divided by the original baseline."),
                ("The reduction is (96 − 84) ÷ 96 = 12.5%; disclose the restricted axis and provide the actual values.", "Correct. Calculate from the data and baseline, not from the lengths created by a truncated chart."),
            ], 2,
            "A figure should clarify the same comparison as its table. For these magnitude bars, a zero baseline avoids this misleading length effect."),
        _question(
            "A team's final demonstration is polished. Which evidence best establishes a learner's individual understanding?",
            [
                ("Giving every team member the same judgment score solely because the slides look professional.", "Shared presentation quality does not show what each learner understands or contributed."),
                ("The learner explains a relevant calculation under a changed assumption, identifies their own inspectable contribution, and defends a design choice and evidence limit.", "Correct. These observations connect individual quantitative reasoning, ownership, judgment, and transfer."),
                ("Counting how often the learner says that AI was useful.", "A frequency count of a claim does not establish a correct calculation, design reasoning, contribution, or evidence limit."),
            ], 1,
            "Shared artifacts and individual understanding require related but distinct evidence. The final individual component should assess reasoning rather than repeat the team presentation score."),
    ],
}


UNIT_EVIDENCE = {
    1: "<p>In 3–5 sentences, name your user and bounded task. Identify one claim you corrected in a draft, its approved source, and what a person must check or authorize. State one uncertainty and your next step. Use Cedar Desk if you have no approved project yet.</p>",
    2: "<p>Update the same project record with one neutral discovery question, one evidence item and its source, and a contrary observation. Explain a baseline using its count, units, denominator, and period where relevant. Label supplied case analysis, role-play, or an actual event accurately; leave an unobserved event pending. State the next question that could change the problem statement.</p>",
    3: "<p>Summarize the current process, one simpler improvement, and one bounded AI candidate using the same comparison criteria. State your chosen user, task, output, quality boundary, and one exclusion. Identify the next test and any scope feedback still pending. Link the relevant charter section instead of rewriting background.</p>",
    4: "<p>Trace one input through source checking, drafting, human review, exception handling, and delivery. Name who can authorize a consequential action, and distinguish a prepared handoff from a completed decision. Identify a missing fact or failure condition and the manual fallback.</p>",
    5: "<p>Identify the version and reviewer-accessible files for your usable kit, service, or no-code experience. Summarize an ordinary, incomplete, and exception bench case, one defect, its revision, and retest status. Record who actually tried the version and any assistance; label an unperformed attempt pending. You may link the existing test table rather than copy it.</p>",
    6: "<p>State your pilot question, comparison, quality boundary, complete-process timing definition, and decision or stop rule before observing results. Explain one calculation with units and denominator. Identify a possible order, assistance, or case-selection effect and how you will record it. Use supplied figures only as labeled examples.</p>",
    7: "<p>Identify the actual user-task attempt, version, assistance, result, defect, revision, and retest, linking your observation table. Distinguish supplied benchmarks from your observations. Explain one rate with its cohort and time window, then recommend a proportionate next step. If another person has not attempted the task, record that as pending and request the arranged reviewer route.</p>",
    8: "<p>Link or summarize your cost/value and capacity table. State volume, adoption, complete effort, recurring expense, units, and period, labeling observations separately from assumptions. Distinguish cash change from assigned capacity value. Describe one less favorable scenario and the correctly named threshold that changes your decision.</p>",
    9: "<p>Provide a concise offer or internal-adoption card: user and buyer/sponsor, useful promise, included work, exclusions, price or resource request, and acceptance check. Explain contribution and one delivery-capacity limit, identifying omitted costs. State which promise still needs evidence rather than presenting it as guaranteed.</p>",
    10: "<p>Name one route to users and its next conversation or approval step. Report any funnel counts with named stages, denominators, and period; distinguish interest, agreement, actual use, and payment. Label a sales/adoption role-play honestly. Explain how your proposed commitment fits delivery capacity and onboarding, and identify the next evidence needed.</p>",
    11: "<p>Identify the current operating files, approved source version, owner, review/exception rules, support boundary, and update or stopping condition. Explain one queue, effort, or repeat-use measure with its period and limits. State what a new operator could do now and what still requires confirmation or repair.</p>",
    12: "<p>Summarize your evidence-backed recommendation and next request. Link the usable artifact, actual test/retest record, economics, figure/table, and handoff section. Identify your own inspectable contribution, one calculation under a changed assumption, a consequential design choice, and an evidence limit. State what should continue, change, or stop without inventing demand or outcomes.</p>",
}

# The exchange precedes the quiz in these units. One evidence field records
# either route; neither a live peer nor a second response paper is required.
for _exchange_unit in (3, 7, 12):
    UNIT_EVIDENCE[_exchange_unit] += (
        "<p><strong>Project exchange:</strong> after reading this unit's exchange, "
        "name or link your Canvas post and feedback and briefly state what you changed. "
        "Alternatively, include an individual critique of its provided fictional sample "
        "here: one specific observation, one useful question, and one proposed next test, "
        "following the exchange criteria. You do not need to wait for another person "
        "to be online or write a separate paper. A sample critique does not replace "
        "the required actual other-person user-task attempt in your project; label "
        "that attempt pending until it happens.</p>"
    )

del _exchange_unit


DISCUSSIONS = [
    {
        "unit": 3,
        "title": "Project exchange: a need worth solving",
        "prompt_html": """<p><strong>Purpose:</strong> improve the same capstone's problem statement and scope. This exchange is formative and contributes 0% to the course grade.</p>
<ol><li>Post a concise problem statement, user and buyer/sponsor, one supporting evidence item, one contrary observation, and the proposed bounded task. Label observations, supplied facts, role-play, and assumptions.</li><li>Reply to a peer with one specific evidence question and one practical scope improvement. Explain why each could change the decision.</li><li>If a peer is unavailable, critique the fictional sample below instead. End by stating one change you will make to your own charter or why the evidence supports keeping it.</li></ol>
<h3>Fictional sample for an asynchronous critique</h3><p>“All workshop customers need automated refunds. Six of eight supplied Cedar Desk records describe repeated reply delays, and three of eight say they would try a pilot. We will let AI decide and process every cancellation automatically.” The packet also includes two records without repeated delay; one customer prefers a clear policy page. No purchase, permission to process refunds, or measurement of the refund task is supplied.</p>
<p>When critiquing the sample, identify one claim the evidence does not support, ask one neutral discovery question, and propose one feasible task with a human authority boundary. Do not invent a new interview or authorization.</p>
<p><strong>Effort:</strong> about 10–15 minutes, using the charter you are already preparing. No peer has to be online at the same time. Share only fictional or approved information. Private feedback and individual circumstances use Canvas Inbox.</p>""",
    },
    {
        "unit": 7,
        "title": "Project exchange: what the pilot actually shows",
        "prompt_html": """<p><strong>Purpose:</strong> improve the interpretation, revision, and retest in the same project. This exchange is formative and contributes 0% to the course grade.</p>
<ol><li>Post a small evidence table or concise summary identifying the tested version, actual task, assistance, quality, complete effort, one defect, revision/retest status, and one limitation. Keep supplied benchmarks separate from your observations; label unperformed events pending.</li><li>Give a peer one specific comparison or denominator check and one useful next-test suggestion.</li><li>If a peer is unavailable, critique the fictional sample below. State how the critique affects your own pilot claim or next test.</li></ol>
<h3>Fictional sample for an asynchronous critique</h3><p>“In twelve supplied cases the manual process took 96 minutes; reviewed AI took 84 minutes. Therefore our version saves 12.5% on every future task. We have not asked another person to use our version. In the supplied 14-day cohort, six of twelve invitees completed a task and four of those six returned, so two-thirds of all invitees are retained customers.”</p>
<p>Identify the supplied-versus-observed problem, correct the return claim using its denominator and observation window, and propose a bounded actual task/retest that would improve the evidence. A supplied critique is preparation, not a replacement for another person's required user-task attempt.</p>
<p><strong>Effort:</strong> about 10–15 minutes, reusing your pilot table. Share only fictional or approved information. Request an arranged reviewer through Canvas if no other person is available for the required actual task.</p>""",
    },
    {
        "unit": 12,
        "title": "Project exchange: defend the next decision",
        "prompt_html": """<p><strong>Purpose:</strong> strengthen the final recommendation, communication, and handoff. This exchange is formative and contributes 0% to the course grade.</p>
<ol><li>Post your recommendation, one readable figure/table with units and baseline, the strongest evidence and limitation, and the next request. Link a safe view of the existing artifact or brief instead of writing another report.</li><li>Give a peer one supported strength and one consequential changed-assumption challenge. Suggest the next evidence or handoff improvement that challenge calls for.</li><li>If a peer is unavailable, critique the fictional sample below. Record one final revision you will make or an evidence-backed reason to retain your decision.</li></ol>
<h3>Fictional sample for an asynchronous critique</h3><p>“Our supplied twelve-case benchmark falls from 96 to 84 minutes. A chart starts at 80, giving visible bar lengths of 16 and 4, so the project guarantees 75% less work. At the supplied monthly base assumptions, assigned time value is $240 and recurring cash expense is $240, with unchanged payroll. We describe that as $240 cash profit. Our handoff has a demonstration link but no current sources or named owner.”</p>
<p>Correct the chart interpretation and cash/capacity statement, identify a missing handoff element, and propose a truthful next recommendation. State what would still require actual project evidence.</p>
<p><strong>Effort:</strong> about 10–15 minutes, using your existing final materials. No live presentation or simultaneous peer attendance is required. A written, accessible contribution is sufficient.</p>""",
    },
]


FINAL_EXAM = {
    "title": "Individual case exam: evidence, decisions, and responsible handoff",
    "max": 40,
    "brief_html": """<p><strong>Individual asynchronous assessment:</strong> 40 points within the existing 25% Milestone 5 group. The 60-point demonstration/handoff and this 40-point exam together form that group's 100 points. This exam is the final individual component; the earlier formative individual explanation is not graded a second time.</p>
<p><strong>Materials and format:</strong> use the course, this packet, a calculator, and disclosed AI assistance. Author your own reasoning, identify what you checked or corrected, and remain responsible for the claims. Do not fabricate project observations. This is an open-materials assessment of documented individual judgment, not a proctored claim of unaided performance. Submit one clearly labeled response through Canvas using text, an accessible file, or a reviewer-accessible document link. No video, programming, paid tool, or live meeting is required. Plan about 45–60 minutes; this is an estimate, not a forced timer.</p>
<h3>New fictional case: Meadow Resource Library</h3>
<p>A community equipment library lends activity kits. Its coordinators answer loan and renewal questions. The proposed <strong>LoanNote</strong> kit uses approved sources to draft a reply or prepare a human handoff. The coordinator is the user; the library supervisor is the sponsor and decision owner. The AI cannot extend a loan or send a reply. All records below are fictional teaching inputs, not your project results.</p>
<table><caption>Approved Meadow source card, version 1</caption><thead><tr><th scope="col">Source</th><th scope="col">Approved fact or boundary</th></tr></thead><tbody>
<tr><th scope="row">M1 — Renewal</th><td>A renewal request received at least 24 hours before the due time may be considered for one three-day extension, only if there is no reservation and a coordinator confirms it. Availability and reservation status are not supplied.</td></tr>
<tr><th scope="row">M2 — Exceptions</th><td>A request received under 24 hours before the due time, a second extension, or an exception requires supervisor review. Do not promise approval or a fee waiver.</td></tr>
<tr><th scope="row">M3 — Release</th><td>A person checks source conditions, missing facts, status, and next step before any reply is sent. Only the authorized person may approve an exception or record an extension.</td></tr>
</tbody></table>
<table><caption>Supplied complete-process benchmark on the same twelve cases</caption><thead><tr><th scope="col">Process/version</th><th scope="col">Total preparation, checking, correction, and handoff</th><th scope="col">Acceptable replies</th></tr></thead><tbody>
<tr><th scope="row">Manual baseline</th><td>120 minutes</td><td>12 of 12</td></tr>
<tr><th scope="row">Reviewed LoanNote version 1</th><td>105 minutes</td><td>12 of 12</td></tr>
</tbody></table>
<p>The supplied acceptability review found no unauthorized commitment in either process. The predeclared pilot rule requires <strong>at least a 10% reduction in complete effort and no unauthorized commitment</strong> in the tested cases. A changed-condition exercise adds <strong>nine minutes of correction</strong> to the reviewed version's total; acceptable replies remain 12 of 12 and the no-unauthorized-commitment finding is held fixed. This is a supplied hypothetical sensitivity change, not a new observed pilot.</p>
<table><caption>Separate monthly planning assumptions; not observed adoption or cash savings</caption><thead><tr><th scope="col">Input</th><th scope="col">Assumption</th></tr></thead><tbody>
<tr><th scope="row">Eligible questions</th><td>800 per month</td></tr>
<tr><th scope="row">Base adoption</th><td>60% of eligible questions</td></tr>
<tr><th scope="row">Lower-adoption scenario</th><td>30% of eligible questions</td></tr>
<tr><th scope="row">Released effort assumed to transfer from the original benchmark</th><td>1.25 minutes per assisted question; use this stated input for Prompt 2, not the changed-condition exercise</td></tr>
<tr><th scope="row">Assigned capacity value</th><td>$18 per hour</td></tr>
<tr><th scope="row">Recurring cash expense</th><td>$120 tools plus $60 support each month</td></tr>
<tr><th scope="row">Cash boundary</th><td>Payroll and other spending do not fall; no new revenue is established. No other cash change is supplied.</td></tr>
</tbody></table>
<h3>Your four prompts</h3>
<ol>
<li><strong>Quantitative reasoning: complete effort and pilot rule.</strong> Calculate the original effort reduction and the reduction after the extra correction, using the same baseline. Show units and denominator. Explain whether each version meets the stated effort rule, what the unchanged quality count does show, and one conclusion it cannot support about future reliability.</li>
<li><strong>Quantitative reasoning: monthly capacity and cash.</strong> For both adoption scenarios, calculate assisted questions, released hours, assigned capacity value, net capacity value after recurring expense, and recurring cash change. Use the stated 1.25-minute planning input, show the period and units, and explain why cash and capacity value can differ. Name an assumption that needs actual evidence before relying on the forecast.</li>
<li><strong>Design judgment: source and authority.</strong> A request arrives 20 hours before a kit is due. The draft says: “Your loan is extended by three days, and any fee is waived. M1 confirms the extension.” Review the material claims against M1–M3. Propose a corrected reply or handoff with the necessary next step and status. State who must decide, what is unknown, and one consequential case you would retest after revising the instruction.</li>
<li><strong>Ownership and transfer to your own capstone.</strong> Identify one inspectable contribution you personally made and link or name its evidence in your Canvas project record. Explain a consequential design choice, compare it with a plausible simpler alternative, and identify an evidence limit. Use the Meadow case or a changed condition in your own project to defend one next test or bounded recommendation, including a human owner and a stopping or handoff condition. If an event is pending, state that honestly rather than inventing a result.</li>
</ol>
<h3>Submission and feedback</h3>
<p>Label Prompts 1–4 and show enough working for another person to inspect the reasoning. Add a brief AI/tool-use note identifying any assistance and the checks or corrections you made. The rubric allocates 20 points to quantitative understanding across Prompts 1–2 and 20 to design judgment/ownership across Prompts 3–4. The instructor reviews the evidence and gives feedback; no automatic exam score is promised. Use the offering's published feedback and revision arrangements. A defensible recommendation to narrow, revise, or stop can earn strong credit when the evidence supports it.</p>""",
    "checklist": [
        "Prompts 1–4 are labeled and answered individually, with calculations, units, denominators, and periods shown.",
        "Supplied benchmark, hypothetical change, monthly assumptions, and actual project evidence are distinguished.",
        "Source conditions, unknown facts, human authority, next action, and actual status are explicit.",
        "My own inspectable contribution, alternative, evidence limit, and bounded next test or recommendation are identified.",
        "The response is accessible to the reviewer and includes an honest AI/tool-use and checking note.",
    ],
    "rubric": [
        {
            "criterion": "Individual quantitative understanding",
            "weight": 20,
            "meets": "Explains the complete-effort reductions and pilot rule; calculates both monthly scenarios with correct units, denominators, and periods; distinguishes capacity value from cash and names an evidence limit.",
            "strong": "Reconciles the sensitivity and planning assumptions, identifies a consequential alternative interpretation or misleading metric, and connects the corrected reasoning to a proportionate decision.",
        },
        {
            "criterion": "Individual design judgment and ownership",
            "weight": 20,
            "meets": "Checks material claims against the source conditions, preserves human authority and truthful status, proposes a relevant retest, and explains a personal contribution, alternative, evidence limit, and bounded next action.",
            "strong": "Defends a consequential revision against a plausible alternative, transfers the reasoning to a changed condition, and makes the evidence-to-decision chain and operating responsibility inspectable.",
        },
    ],
}
