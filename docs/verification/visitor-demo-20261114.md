# Public visitor demo verification — November 14, 2026

**Result: pass.** Opened the personal homepage, followed its teaching card's “Try the 3-minute simulation” link, and completed the live public demo on desktop and at 390px width. Runtime source tested: `c470f8b`. No runtime defect found and no account required.

## Live checks

- Opened source cards S2/S3/S4/S6; chose B only. First-run feedback recalled that prediction and explained why both A and B need checks.
- Inspected both first outcomes: A false confirmation; B unsupported commitment released. Expanded the actual action trace.
- Ran the revision and inspected A sent with conditions and B routed, customer told nothing. Labels and trace match.
- Read both complete C workflows. Workflow A produced routine case escalated; Compare the other choice produced asked for missing time. The next-step debrief is visible.
- Replay returned to the initial prediction/workflow; refresh also starts over as the no-storage note promises. Open source disclosures can remain expanded on Replay because they are not learner-response state.
- At390px, completed the path using keyboard Enter; document width remained 390px with no page overflow. Restored default viewport.
- Open the full simulation loaded Unit 4's working Learning Companion. Explore the course loaded the twelve-unit learning path. Returned to the demo and left it ready to start.
- No captured console errors. The visitor demo calls the shared authored engine locally; it needs no model/API secret, enrollment or research collector.

## Regression coverage improvement

The existing `visitor-demo.test.ts` was not imported by normal `scripts/test-*.mjs`. Added its import to `scripts/test-shift-run.mjs` so future full tests include the demo fixture paths. Focused suite: **57/57**. Full suite: **218/218**, zero failures/skips. Only test coverage and verification documentation changed; application behavior is unchanged.

[Structured checks](visitor-demo-20261114/checks.json), [desktop evidence](visitor-demo-20261114/desktop-demo.jpg), [mobile evidence](visitor-demo-20261114/mobile-demo.jpg).

This is Chromium and responsive-emulation verification, not physical-device, Safari/Firefox, screen-reader or learning-effectiveness evidence. No real customer, booking or research participant was affected.
