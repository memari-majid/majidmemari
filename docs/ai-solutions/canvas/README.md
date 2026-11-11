# Canvas handoff artifacts

This is a documentation and artifact mirror from canonical course commit `0ffb052`, maintained at `/Users/majid/Documents/GitHub/uvu_courses/courses/cs4720R/integrations/canvas/`. It is not an active input to the personal website build, public course snapshot, or TA knowledge base.

- [Reusable Canvas integration guide](../canvas-integration.md): delivery structure, assessment policy, import and validation.
- [Cartridge](building-ai-solutions-canvas.imscc) and [mapping](mapping.json): portable lesson wrappers, native check-ins, milestones/rubrics, discussion and module requirements. The cartridge contains no enrolled student records, grades, credentials, or institution-specific identity.
- [Builder source reference](build_package.py): byte-for-byte copy of the canonical builder. It imports `../../site/course_content.py` from the canonical course layout; that dependency is not bundled here. Run the builder in the canonical integration directory, not this mirror. Do not maintain a second generator by editing this copy.
- [Live installation record](../canvas-live-integration.md) and [verification metadata](live-verification.json): destination-specific operational evidence, distinct from the portable package.
- [Installed home HTML](canvas-home.html) and [syllabus HTML](canvas-syllabus.html): destination-specific course links and policies; adapt before reuse. They are outside the cartridge.
- Screenshots of the course and our test session: [home](evidence/canvas-home.jpg), [embedded TA](evidence/canvas-embedded-ta.jpg), [native check-in](evidence/canvas-check-in.jpg). They contain no student submission or grade evidence.

The mirrored cartridge SHA-256 is `8ebd1cc93cb3dbdba386fe12225e5962547262d4be2b55e3d8af9737f5e4dbac`. Use the current canonical source and receiving-course verification before another import. Opening a lesson and submitting a check-in are progress events, not proof of mastery. No test assignment was submitted or graded in the recorded UI verification.
