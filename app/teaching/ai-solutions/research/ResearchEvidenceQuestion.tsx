"use client";

import { useEffect, useRef, useState } from "react";
import type { ShiftSession } from "@/lib/course-kb/shift-session";
import type { ResearchQuestionView } from "@/lib/research/types";
import { studyButton, studyField, studySecondary } from "./StudyPacket";

export function ResearchEvidenceQuestion({
  question,
  snapshot,
  locked,
  onStart,
  onSkip,
  onRelease,
  onRespond,
  onRefresh,
}: {
  question: ResearchQuestionView;
  snapshot: ShiftSession;
  locked: boolean;
  onStart: (snapshot: ShiftSession, allowAI: boolean) => void;
  onSkip: (snapshot: ShiftSession) => void;
  onRelease: (inspectionCompleted: boolean) => void;
  onRespond: (answer: string, declined: boolean) => void;
  onRefresh: () => void;
}) {
  const [allowAI, setAllowAI] = useState(false),
    [answer, setAnswer] = useState(""),
    [now, setNow] = useState(0);
  const attemptedRelease = useRef(""),
    attemptedRefresh = useRef("");
  useEffect(() => {
    setNow(Date.now());
    if (!["inspecting", "released"].includes(question.status)) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [question.status]);
  useEffect(() => {
    if (
      !locked &&
      question.status === "inspecting" &&
      question.releaseBy &&
      now >= Date.parse(question.releaseBy) &&
      attemptedRelease.current !== question.releaseBy
    ) {
      attemptedRelease.current = question.releaseBy;
      onRelease(false);
    }
    if (
      !locked &&
      question.status === "released" &&
      question.responseBy &&
      now >= Date.parse(question.responseBy) &&
      attemptedRefresh.current !== question.responseBy
    ) {
      attemptedRefresh.current = question.responseBy;
      onRefresh();
    }
  }, [question, now, locked, onRelease, onRefresh]);
  const remaining = (date?: string) =>
    date && now
      ? Math.max(0, Math.ceil((Date.parse(date) - now) / 1000))
      : null;
  return (
    <section
      className="mt-5 rounded-xl border border-slate-300 bg-white p-4 sm:p-5"
      aria-labelledby="research-evidence-question"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-teal-800">
        Common evidence step
      </p>
      <h3
        id="research-evidence-question"
        className="mt-2 text-lg font-semibold"
      >
        Evidence question
      </h3>
      {question.status === "not-started" ? (
        <>
          <p className="mt-3 text-sm leading-7">
            Your first explanation is kept above. Beginning this step saves that
            confirmed rehearsal snapshot to the study server, then opens the
            common source-and-trace inspection. It does not rewrite your
            workflow.
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-600">
            The checkpoint includes workflow/draft, original and accepted
            interpretations, predictions/confidence, simulated traces,
            explanations/next steps and returned model/token metadata. Ordinary
            course history, journals, grades and contact details are excluded.
          </p>
          <label className="mt-4 flex min-h-11 items-start gap-3 py-2 text-sm leading-7">
            <input
              className="mt-1 h-5 w-5 shrink-0"
              type="checkbox"
              checked={allowAI}
              disabled={locked}
              onChange={(event) => setAllowAI(event.target.checked)}
            />
            I allow the optional selector, when used by this protocol, to
            process the accepted workflow, current trace and my explanation/next
            step. Leave unchecked to use the authored alternative without
            penalty.
          </label>
          <button
            type="button"
            className={`${studyButton} mt-3`}
            disabled={locked}
            onClick={() => onStart(snapshot, allowAI)}
          >
            Save checkpoint and begin evidence step
          </button>
        </>
      ) : null}
      {question.status === "inspecting" ? (
        <>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
            {question.inspectionInstructions}
          </p>
          <p className="mt-3 text-xs leading-6 text-slate-600" aria-live="off">
            Inspection time remaining: {remaining(question.releaseBy) ?? "—"}{" "}
            seconds. You may finish early. The evidence step continues at the
            same release rule.
          </p>
          <button
            type="button"
            className={`${studyButton} mt-4`}
            disabled={locked}
            onClick={() => onRelease(true)}
          >
            I have finished inspecting the source and trace
          </button>
          <p className="mt-3 text-xs leading-6 text-slate-600">
            Reloading resumes the existing server opportunity. It does not start
            another selection request.
          </p>
        </>
      ) : null}
      {(question.status === "released" || question.status === "responded") &&
      question.question ? (
        <>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7">
            {question.question.grounding}
          </p>
          <p className="mt-4 text-base font-semibold leading-7">
            {question.question.question}
          </p>
          <p className="mt-2 text-xs leading-6 text-slate-600">
            Source tags:{" "}
            {question.question.sourceIds.join(", ") || "Current recorded trace"}
            .
          </p>
        </>
      ) : null}
      {question.status === "released" ? (
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!locked && answer.trim()) onRespond(answer, false);
          }}
        >
          <label
            htmlFor="research-question-answer"
            className="block text-sm font-semibold"
          >
            Your response
          </label>
          <textarea
            id="research-question-answer"
            maxLength={1500}
            rows={4}
            value={answer}
            disabled={locked || remaining(question.responseBy) === 0}
            onChange={(event) => setAnswer(event.target.value)}
            className={studyField}
          />
          <p className="mt-1 text-xs leading-6 text-slate-600" aria-live="off">
            {answer.length}/1,500 characters · response opportunity remaining:{" "}
            {remaining(question.responseBy) ?? "—"} seconds. Text is not
            submitted automatically.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              className={studyButton}
              type="submit"
              disabled={
                locked || !answer.trim() || remaining(question.responseBy) === 0
              }
            >
              Save response and continue
            </button>
            <button
              className={studySecondary}
              type="button"
              disabled={locked || remaining(question.responseBy) === 0}
              onClick={() => onRespond("", true)}
            >
              Decline this response and continue
            </button>
          </div>
        </form>
      ) : null}
      {["not-started", "inspecting"].includes(question.status) ? (
        <div className="mt-4 border-t border-slate-200 pt-3">
          <p className="text-xs leading-6 text-slate-600">
            You may skip this optional opportunity. The server records that it
            was declined; no question, inspection completion or written answer
            is invented.
          </p>
          <button
            type="button"
            className={`${studySecondary} mt-2`}
            disabled={locked}
            onClick={() => onSkip(snapshot)}
          >
            Skip this question opportunity and continue
          </button>
        </div>
      ) : null}
      {question.status === "responded" ? (
        <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4">
          <p className="text-sm font-semibold">
            Evidence opportunity recorded by the server
          </p>
          {question.response ? (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7">
              {question.response}
            </p>
          ) : (
            <p className="mt-2 text-sm leading-7">
              {question.responseStatus === "timed-out"
                ? "The response opportunity ended without an automatic text submission."
                : "No written response was recorded for this opportunity."}{" "}
              This is not a learning score.
            </p>
          )}
          <p className="mt-2 text-sm leading-7">
            Continue with your revision below. Your assigned path remains
            unchanged.
          </p>
        </div>
      ) : null}
    </section>
  );
}
