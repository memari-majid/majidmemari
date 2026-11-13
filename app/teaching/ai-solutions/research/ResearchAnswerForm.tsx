"use client";

import { useId, useState } from "react";
import type { ResearchFeedback, ResearchForm } from "@/lib/research/types";
import { studyButton, studyField, studySecondary } from "./StudyPacket";

export type StudyMissingReason =
  | "declined"
  | "time-limit"
  | "technical"
  | "other";

export function ResearchAnswerForm({
  form,
  locked,
  onSubmit,
  onSkip,
}: {
  form: ResearchForm;
  locked: boolean;
  onSubmit: (answer: string) => void;
  onSkip: (reason: StudyMissingReason) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [skipOpen, setSkipOpen] = useState(false),
    [reason, setReason] = useState<StudyMissingReason | "">("");
  const id = useId();
  return (
    <form
      className="mt-5 rounded-xl border border-slate-200 p-4 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!locked && answer.trim()) onSubmit(answer);
      }}
    >
      <label htmlFor={id} className="block text-base font-semibold">
        {form.responsePrompt}
      </label>
      <p className="mt-2 text-xs leading-6 text-slate-600">
        Use only the task packet and the reviewed assistance rules. This page
        has no AI chat. Write your own reasoning; do not include names, student
        numbers or confidential information. Your answer stays in this view
        until you submit it.
      </p>
      <textarea
        id={id}
        rows={10}
        maxLength={4000}
        value={answer}
        disabled={locked}
        onChange={(event) => setAnswer(event.target.value)}
        className={studyField}
        required
        aria-describedby={`${id}-count`}
      />
      <p id={`${id}-count`} className="mt-1 text-xs text-slate-500">
        {answer.length}/4,000 characters. Submission is frozen after a server
        receipt.
      </p>
      <button
        type="submit"
        className={`${studyButton} mt-4`}
        disabled={locked || !answer.trim()}
      >
        Submit this task
      </button>
      <details
        className="mt-4 border-t border-slate-200 pt-3"
        open={skipOpen}
        onToggle={(event) => setSkipOpen(event.currentTarget.open)}
      >
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-slate-600">
          Leave this task unanswered
        </summary>
        <p className="mt-2 text-sm leading-7">
          You may continue without inventing an answer. The server records a
          missing response and the selected reason; it is not scored as zero or
          treated as a course grade. Any text above is not submitted through
          this control.
        </p>
        <label
          htmlFor={`${id}-missing`}
          className="mt-3 block text-sm font-semibold"
        >
          Reason
        </label>
        <select
          id={`${id}-missing`}
          className={studyField}
          disabled={locked}
          value={reason}
          onChange={(event) =>
            setReason(event.target.value as StudyMissingReason | "")
          }
        >
          <option value="">Choose a reason</option>
          <option value="declined">I prefer not to answer</option>
          <option value="time-limit">
            The available time was insufficient
          </option>
          <option value="technical">A technical or access problem</option>
          <option value="other">Another reason / no details</option>
        </select>
        <button
          type="button"
          className={`${studySecondary} mt-3`}
          disabled={locked || !reason}
          onClick={() => reason && onSkip(reason)}
        >
          Record missing response and continue
        </button>
      </details>
    </form>
  );
}

export function ResearchFeedbackForm({
  locked,
  onSubmit,
}: {
  locked: boolean;
  onSubmit: (response: ResearchFeedback) => void;
}) {
  const [clarity, setClarity] = useState<number | null>(null),
    [helpfulness, setHelpfulness] = useState<number | null>(null);
  const [issueCategory, setIssue] =
    useState<ResearchFeedback["issueCategory"]>("none");
  const prefix = useId();
  const rating = (value: string) => (value ? Number(value) : null);
  return (
    <form
      className="mt-5 rounded-xl border border-slate-200 p-4 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!locked) onSubmit({ clarity, helpfulness, issueCategory });
      }}
    >
      <h2 className="font-serif text-2xl">Optional experience feedback</h2>
      <p className="mt-3 text-sm leading-7">
        These custom ratings describe your experience. They are not a validated
        learning test or a grade. Leave either rating unanswered if you prefer.
      </p>
      <label
        htmlFor={`${prefix}-clarity`}
        className="mt-5 block text-sm font-semibold"
      >
        How clear was the study path?
      </label>
      <select
        id={`${prefix}-clarity`}
        className={studyField}
        disabled={locked}
        value={clarity ?? ""}
        onChange={(event) => setClarity(rating(event.target.value))}
      >
        <option value="">Prefer not to answer</option>
        {[1, 2, 3, 4, 5].map((value) => (
          <option key={value} value={value}>
            {value}
            {value === 1
              ? " · very unclear"
              : value === 5
                ? " · very clear"
                : ""}
          </option>
        ))}
      </select>
      <label
        htmlFor={`${prefix}-helpful`}
        className="mt-5 block text-sm font-semibold"
      >
        How helpful did you find the rehearsal?
      </label>
      <select
        id={`${prefix}-helpful`}
        className={studyField}
        disabled={locked}
        value={helpfulness ?? ""}
        onChange={(event) => setHelpfulness(rating(event.target.value))}
      >
        <option value="">Prefer not to answer</option>
        {[1, 2, 3, 4, 5].map((value) => (
          <option key={value} value={value}>
            {value}
            {value === 1
              ? " · not helpful"
              : value === 5
                ? " · very helpful"
                : ""}
          </option>
        ))}
      </select>
      <label
        htmlFor={`${prefix}-issue`}
        className="mt-5 block text-sm font-semibold"
      >
        Was there a problem you want to identify?
      </label>
      <select
        id={`${prefix}-issue`}
        className={studyField}
        disabled={locked}
        value={issueCategory}
        onChange={(event) =>
          setIssue(event.target.value as ResearchFeedback["issueCategory"])
        }
      >
        <option value="none">No issue to report / prefer not to answer</option>
        <option value="navigation">Finding the next step</option>
        <option value="interpretation">Understanding an interpretation</option>
        <option value="access">Access or accessibility</option>
        <option value="storage">Saving or restoring work</option>
        <option value="other">Another issue</option>
      </select>
      <button className={`${studyButton} mt-5`} type="submit" disabled={locked}>
        Submit feedback and finish
      </button>
    </form>
  );
}
