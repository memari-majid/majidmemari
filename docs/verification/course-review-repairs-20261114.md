# November 14 course interface repair checks

Local source branch: `fix/unit4-rehearsal-recovery-20261114`, based on site commit `2e07a2d`. This record describes local checks before the parent release process; it does not establish production behavior or learning.

- The mapping editor distinguishes exact-quote validation from the AI's additional semantic checks.
- The Unit 4 code map now documents revision 3, inspect/correct/accept behavior, diagnostic question, bounded classroom recovery and separate research behavior.
- Visitor predictions are recalled with source-linked reasons after the first run. Request C offers neutral Workflow A/B labels and inspectable complete processes before selecting.
- The demo calls its generic accuracy-check failure an authored fictional assumption.
- The course-question prompt permits general source explanations while withholding an unsupported diagnosis of a particular run.
- The copied/exported practice reasoning uses prose headings for saved and unfinished explanations and predictions, replacing the raw JSON tail. Historical mapping exports also use the human-readable mapping formatter.

## Checks

`node --test scripts/test-shift-run.mjs scripts/test-shift-ui-state.mjs scripts/test-course-kb.mjs`: 116 passed. TypeScript `--noEmit` and `git diff --check` passed.

A fresh headless Chrome context at 390×844 with reduced motion verified the demo from prediction through first/revised runs, both C choices and debrief. Keyboard Enter selected the prediction. The rendered page had 390px scroll width and no browser errors.

A second fresh context intercepted only the classifier endpoint with fictional 422 responses. It verified retained valid-line suggestions, no recorded run before confirmation, reload, edit wording, exactly one classroom retry, disabled third request, and a readable export without practice JSON. It sent zero research requests, had no browser errors and no horizontal overflow. No live AI provider was called. Screenshots were visually inspected from the temporary QA folder `/private/tmp/ai-course-browser-qa-20261114/`.

These checks do not establish screen-reader behavior, all browser coverage, live model understanding, scientific validity or participant readiness. The parent release process will rebuild after syncing the final course-source edits and verify the deployed version separately.
