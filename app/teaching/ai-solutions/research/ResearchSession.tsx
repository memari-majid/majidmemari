"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LEARNING_ACTIVITIES } from "@/lib/course-kb/learning";
import type { ShiftRunActivity } from "@/lib/course-kb/shift-run";
import type { ShiftSession } from "@/lib/course-kb/shift-session";
import {
  RESEARCH_STAGES,
  type ResearchFeedback,
  type ResearchReceipt,
  type ResearchSessionView,
  type ResearchStatus,
} from "@/lib/research/types";
import { ShiftRun } from "../assistant/ShiftRun";
import {
  ResearchAnswerForm,
  ResearchFeedbackForm,
  type StudyMissingReason,
} from "./ResearchAnswerForm";
import { ResearchEvidenceQuestion } from "./ResearchEvidenceQuestion";
import {
  newRequestId,
  readReceipt,
  readSession,
  readStatus,
  ResearchClientError,
  studyFetch,
  studyJSON,
} from "./client";
import {
  StudyPacket,
  studyButton,
  studyField,
  studySecondary,
} from "./StudyPacket";

const activity = LEARNING_ACTIVITIES.find(
  (value) => value.unit === 4 && value.mode === "shift-run",
) as ShiftRunActivity;
const label = {
  baseline: "First independent task",
  rehearsal: "Guided rehearsal",
  immediate: "Independent task",
  delayed: "Follow-up task",
  feedback: "Experience feedback",
  complete: "Finished",
  withdrawn: "Withdrawn",
  expired: "Session expired",
};
type PendingWrite = { path: string; body: unknown; label: string };
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const when = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export function ResearchSession() {
  const [status, setStatus] = useState<ResearchStatus | null>(null),
    [entry, setEntry] = useState("");
  const [session, setSession] = useState<ResearchSessionView | null>(null),
    [instance, setInstance] = useState("");
  const [busy, setBusy] = useState(false),
    [pending, setPending] = useState<PendingWrite | null>(null);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [receipt, setReceipt] = useState<ResearchReceipt | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false),
    [withdrawAcknowledged, setWithdrawAcknowledged] = useState(false);
  const token = useRef(""),
    epoch = useRef(0),
    active = useRef<AbortController | null>(null);
  const selection = useRef<AbortController | null>(null),
    selectionRequest = useRef("");
  const view = useRef<ResearchSessionView | null>(null),
    pendingRef = useRef<PendingWrite | null>(null);
  const heading = useRef<HTMLHeadingElement>(null),
    errorControl = useRef<HTMLParagraphElement>(null);

  const apply = useCallback((next: ResearchSessionView) => {
    view.current = next;
    setSession(next);
  }, []);
  const lock = useCallback(() => {
    epoch.current += 1;
    active.current?.abort();
    selection.current?.abort();
    active.current = null;
    selection.current = null;
    token.current = "";
    view.current = null;
    pendingRef.current = null;
    selectionRequest.current = "";
    setEntry("");
    setSession(null);
    setPending(null);
    setReceipt(null);
    setBusy(false);
    setWithdrawOpen(false);
    setWithdrawAcknowledged(false);
    setInstance("");
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    studyJSON("session", "", undefined, controller.signal)
      .then((value) => setStatus(readStatus(value)))
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "The study service could not be checked. Collection is not available from this view.",
          );
      });
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) {
        lock();
        setNotice(
          "This view was restored by the browser. Re-enter your private token to fetch the current server step.",
        );
      }
    };
    const hide = () => {
      token.current = "";
      active.current?.abort();
      selection.current?.abort();
    };
    window.addEventListener("pageshow", restored);
    window.addEventListener("pagehide", hide);
    return () => {
      controller.abort();
      active.current?.abort();
      selection.current?.abort();
      window.removeEventListener("pageshow", restored);
      window.removeEventListener("pagehide", hide);
    };
  }, [lock]);
  useEffect(() => {
    if (error) requestAnimationFrame(() => errorControl.current?.focus());
  }, [error]);

  async function openSession() {
    if (active.current || !entry.trim() || !status?.available) return;
    const controller = new AbortController(),
      currentEpoch = ++epoch.current;
    active.current = controller;
    setBusy(true);
    setError("");
    try {
      const next = readSession(
        await studyJSON("session", entry.trim(), undefined, controller.signal),
      );
      if (epoch.current !== currentEpoch) return;
      token.current = entry.trim();
      setEntry("");
      setInstance(newRequestId());
      selectionRequest.current = "";
      pendingRef.current = null;
      setPending(null);
      apply(next);
      setReceipt(null);
      setNotice(
        "Current step loaded from the server. No assessment answer or AI request was submitted by opening it.",
      );
      requestAnimationFrame(() => heading.current?.focus());
    } catch (problem) {
      if (epoch.current === currentEpoch)
        setError(
          problem instanceof Error
            ? problem.message
            : "The session could not be opened.",
        );
    } finally {
      if (epoch.current === currentEpoch) {
        active.current = null;
        setBusy(false);
      }
    }
  }
  const refresh = useCallback(async () => {
    if (active.current || !token.current) return;
    const controller = new AbortController(),
      currentEpoch = epoch.current;
    active.current = controller;
    setBusy(true);
    setError("");
    try {
      const next = readSession(
        await studyJSON("session", token.current, undefined, controller.signal),
      );
      if (epoch.current !== currentEpoch) return;
      apply(next);
      const waiting = pendingRef.current;
      const waitingId =
        waiting && object(waiting.body) ? waiting.body.requestId : undefined;
      const matching = [
        ...next.receipts,
        ...(next.lastCheckpointReceipt ? [next.lastCheckpointReceipt] : []),
      ].find((item) => item.requestId === waitingId);
      if (matching) {
        setReceipt(matching);
        pendingRef.current = null;
        setPending(null);
        setNotice(
          "The server receipt confirms the earlier submission. The current step is restored.",
        );
      } else {
        const action =
          waiting && object(waiting.body) ? waiting.body.action : undefined;
        const transitioned =
          (waiting?.path === "question" &&
            (action === "start"
              ? next.question.status !== "not-started"
              : action === "release"
                ? ["released", "responded"].includes(next.question.status)
                : action === "respond" || action === "skip"
                  ? next.question.status === "responded"
                  : false)) ||
          (waiting?.path === "withdraw" && next.stage === "withdrawn");
        if (transitioned) {
          pendingRef.current = null;
          setPending(null);
          setNotice(
            "The server confirms that this opportunity has advanced. Review its recorded state below; no new request was made.",
          );
        } else
          setNotice(
            "Current server state refreshed. No new answer or selection request was submitted.",
          );
      }
    } catch (problem) {
      if (epoch.current === currentEpoch)
        setError(
          problem instanceof Error
            ? problem.message
            : "The current state could not be refreshed.",
        );
    } finally {
      if (epoch.current === currentEpoch) {
        active.current = null;
        setBusy(false);
      }
    }
  }, [apply]);

  const write = useCallback(
    async (action: PendingWrite): Promise<ResearchSessionView | null> => {
      if (active.current || !token.current) return null;
      const controller = new AbortController(),
        currentEpoch = epoch.current;
      active.current = controller;
      pendingRef.current = action;
      setPending(action);
      setBusy(true);
      setError("");
      try {
        const result = await studyJSON(
          action.path,
          token.current,
          action.body,
          controller.signal,
        );
        if (epoch.current !== currentEpoch) return null;
        if (!object(result) || !("session" in result))
          throw new Error(
            "No checked server state was returned. The save is not confirmed.",
          );
        const next = readSession(result.session),
          received =
            result.receipt === undefined
              ? undefined
              : readReceipt(result.receipt);
        if (
          received &&
          object(action.body) &&
          received.requestId !== action.body.requestId
        )
          throw new Error(
            "The receipt does not match this request. Refresh before continuing.",
          );
        apply(next);
        if (received) {
          setReceipt(received);
          setNotice(
            `Server receipt: ${action.label} received at ${when(received.receivedAt)}.`,
          );
        } else
          setNotice(
            `The server confirmed ${action.label}. The saved state is available when you reopen this session.`,
          );
        pendingRef.current = null;
        setPending(null);
        return next;
      } catch (problem) {
        if (epoch.current !== currentEpoch) return null;
        if (
          problem instanceof ResearchClientError &&
          (problem.status === 401 || problem.status === 403)
        ) {
          lock();
          setError(
            "This private token is no longer accepted. Re-enter a current token from the coordinator.",
          );
        } else
          setError(
            problem instanceof Error
              ? problem.message
              : "The server did not confirm this save. Keep this view open and retry the same request.",
          );
        return null;
      } finally {
        if (epoch.current === currentEpoch) {
          active.current = null;
          setBusy(false);
        }
      }
    },
    [apply, lock],
  );
  function currentVersion(): string {
    const form = view.current?.form;
    if (!form)
      throw new Error(
        "The current task is not available. Refresh before writing.",
      );
    return form.version;
  }
  async function saveRehearsal(snapshot: ShiftSession, complete: boolean) {
    const formVersion = currentVersion();
    const next = await write({
      path: "checkpoint",
      body: {
        version: 1,
        requestId: newRequestId(),
        formVersion,
        session: snapshot,
      },
      label: "rehearsal checkpoint",
    });
    if (next && complete)
      await write({
        path: "response",
        body: {
          version: 1,
          requestId: newRequestId(),
          stage: "rehearsal",
          formVersion,
          response: { completed: true },
        },
        label: "completed rehearsal",
      });
  }
  async function endRehearsal(
    snapshot: ShiftSession,
    reason: StudyMissingReason,
  ) {
    const formVersion = currentVersion();
    if (
      !(await write({
        path: "checkpoint",
        body: {
          version: 1,
          requestId: newRequestId(),
          formVersion,
          session: snapshot,
        },
        label: "incomplete rehearsal checkpoint",
      }))
    )
      return;
    await write({
      path: "response",
      body: {
        version: 1,
        requestId: newRequestId(),
        stage: "rehearsal",
        formVersion,
        response: { completed: false, reason },
      },
      label: "incomplete rehearsal and continuation",
    });
  }
  async function startQuestion(snapshot: ShiftSession, allowAI: boolean) {
    const formVersion = currentVersion();
    if (
      !(await write({
        path: "checkpoint",
        body: {
          version: 1,
          requestId: newRequestId(),
          formVersion,
          session: snapshot,
        },
        label: "first explanation checkpoint",
      }))
    )
      return;
    const next = await write({
      path: "question",
      body: {
        version: 1,
        requestId: newRequestId(),
        formVersion,
        action: "start",
        allowAI,
      },
      label: "evidence-step start",
    });
    if (!next || selectionRequest.current) return;
    const controller = new AbortController();
    selection.current = controller;
    selectionRequest.current = newRequestId();
    // Part of this explicit Start only. No model request is started by reload,
    // and a late background response must not overwrite a released question.
    void studyJSON(
      "question",
      token.current,
      {
        version: 1,
        requestId: selectionRequest.current,
        formVersion,
        action: "select",
      },
      controller.signal,
    )
      .catch(() => {})
      .finally(() => {
        if (selection.current === controller) selection.current = null;
      });
  }
  async function skipQuestion(snapshot: ShiftSession) {
    const formVersion = currentVersion();
    if (
      !(await write({
        path: "checkpoint",
        body: {
          version: 1,
          requestId: newRequestId(),
          formVersion,
          session: snapshot,
        },
        label: "first explanation checkpoint",
      }))
    )
      return;
    await write({
      path: "question",
      body: {
        version: 1,
        requestId: newRequestId(),
        formVersion,
        action: "skip",
      },
      label: "declined evidence opportunity",
    });
  }
  const releaseQuestion = useCallback(
    (inspectionCompleted: boolean) => {
      const form = view.current?.form;
      if (!form || active.current || pendingRef.current) return;
      void write({
        path: "question",
        body: {
          version: 1,
          requestId: newRequestId(),
          formVersion: form.version,
          action: "release",
          inspectionCompleted,
        },
        label: "evidence-question release",
      });
    },
    [write],
  );
  function respondQuestion(answer: string, declined: boolean) {
    void write({
      path: "question",
      body: {
        version: 1,
        requestId: newRequestId(),
        formVersion: currentVersion(),
        action: "respond",
        ...(declined ? { declined: true } : { response: answer }),
      },
      label: "evidence response",
    });
  }
  function answerTask(
    response:
      | { answer: string }
      | { answer: null; missingReason: StudyMissingReason }
      | ResearchFeedback,
  ) {
    const current = view.current;
    if (!current?.form) return;
    void write({
      path: "response",
      body: {
        version: 1,
        requestId: newRequestId(),
        stage: current.stage,
        formVersion: current.form.version,
        response,
      },
      label: label[current.stage],
    });
  }
  async function proposalRequest(
    input: { workflow: string; activityRevision: number },
    signal: AbortSignal,
  ) {
    const current = view.current;
    if (!current?.form || current.stage !== "rehearsal")
      throw new Error("The rehearsal is not the active study step.");
    return studyFetch(
      "proposal",
      token.current,
      {
        version: 1,
        requestId: newRequestId(),
        formVersion: current.form.version,
        run: Math.min(2, (current.checkpoint?.record.runs.length ?? 0) + 1),
        ...input,
      },
      signal,
    );
  }
  const locked = busy || pending !== null;
  const openStage = session?.stage;
  const sequence =
    session?.experiment === "E1"
      ? (["rehearsal", "feedback"] as const)
      : RESEARCH_STAGES;
  const delayedLocked =
    session?.stage === "delayed" &&
    session.availableAt !== null &&
    Date.now() < Date.parse(session.availableAt);
  return (
    <section>
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
          Building AI Solutions
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              ref={heading}
              tabIndex={-1}
              className="font-serif text-3xl leading-tight sm:text-4xl"
            >
              {session ? label[session.stage] : "Study session"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              One current step. Private packets and submissions stay separate
              from course grades, the public chatbot and your personal journal.
            </p>
          </div>
          {session ? (
            <button
              type="button"
              className={studySecondary}
              onClick={() => {
                lock();
                setNotice(
                  "Private session view closed. Confirmed server records remain; unsaved text in this view was removed.",
                );
              }}
            >
              Exit private view
            </button>
          ) : null}
        </div>
      </header>
      {status?.mode === "synthetic" || session?.mode === "synthetic" ? (
        <p className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-7">
          <strong>Synthetic testing only.</strong> Use invented text. This is
          not participant data, institutional approval, real consent or a
          validated research instrument.
        </p>
      ) : null}
      {!session ? (
        <section className="mt-6 max-w-xl">
          <h2 className="text-lg font-semibold">Private entry</h2>
          <p className="mt-3 text-sm leading-7">
            Use the token delivered privately by the independent coordinator
            after the reviewed enrollment process. This page is not a consent
            form. Your token is never put in a URL or browser storage; re-enter
            it after a reload to resume the current server step.
          </p>
          {status ? (
            <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7">
              <strong>
                {status.available
                  ? "Service available for authorized entry."
                  : "Research collection is off."}
              </strong>{" "}
              {status.note}
            </p>
          ) : (
            <p role="status" className="mt-4 text-sm">
              Checking whether the study service is available…
            </p>
          )}
          <form
            className="mt-5"
            onSubmit={(event) => {
              event.preventDefault();
              void openSession();
            }}
          >
            <label
              htmlFor="research-private-token"
              className="block text-sm font-semibold"
            >
              Private participant token
            </label>
            <input
              id="research-private-token"
              className={studyField}
              type="password"
              value={entry}
              maxLength={512}
              autoComplete="off"
              spellCheck={false}
              disabled={busy || !status?.available}
              onChange={(event) => setEntry(event.target.value)}
            />
            <button
              type="submit"
              className={`${studyButton} mt-4`}
              disabled={busy || !status?.available || !entry.trim()}
            >
              {busy ? "Opening current step…" : "Open current step"}
            </button>
          </form>
          <a
            href="/teaching/ai-solutions/research/coordinator"
            className="mt-6 inline-block min-h-11 py-3 text-xs font-semibold text-slate-600 underline"
          >
            Independent coordinator tools
          </a>
        </section>
      ) : (
        <>
          <nav className="mt-5" aria-label="Study sequence">
            <ol className="flex flex-wrap gap-2">
              {sequence.map((stage, index) => (
                <li
                  key={stage}
                  aria-current={stage === openStage ? "step" : undefined}
                  className={`rounded-full border px-3 py-2 text-xs leading-5 ${stage === openStage ? "border-teal-700 bg-teal-50 font-semibold text-teal-950" : "border-slate-200 text-slate-500"}`}
                >
                  {index + 1} · {label[stage]}
                </li>
              ))}
            </ol>
          </nav>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs leading-6 text-slate-600">
            <p>
              Protocol {session.protocolVersion} · private record{" "}
              {session.participantId}
            </p>
            <button
              className={studySecondary}
              disabled={busy}
              onClick={() => void refresh()}
            >
              Refresh server state
            </button>
          </div>
          {receipt ? (
            <section
              className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm leading-7"
              aria-label="Server submission receipt"
            >
              <p className="font-semibold">
                Server receipt · {label[receipt.stage]}
              </p>
              <p>
                Received{" "}
                <time dateTime={receipt.receivedAt}>
                  {when(receipt.receivedAt)}
                </time>
              </p>
              <p className="break-all text-xs">
                Request {receipt.requestId} · form {receipt.formVersion}
              </p>
            </section>
          ) : null}
          {session.outsidePlannedWindow ? (
            <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-7">
              This session is outside its planned timing window. The server
              records the deviation; contact the coordinator if you need help.
              This is not a course grade.
            </p>
          ) : null}
          {delayedLocked ? (
            <section className="mt-6 rounded-xl border border-slate-200 p-5">
              <h2 className="text-xl font-semibold">
                Your follow-up task opens later
              </h2>
              <p className="mt-3 text-sm leading-7">
                Available{" "}
                <time dateTime={session.availableAt!}>
                  {when(session.availableAt!)}
                </time>
                . The packet is not opened in this view before that time.
                Re-enter your private token and refresh at the scheduled time.
              </p>
            </section>
          ) : null}
          {!delayedLocked &&
          session.form &&
          ["baseline", "immediate", "delayed"].includes(session.stage) ? (
            <div className="mt-6">
              <StudyPacket form={session.form} />
              <ResearchAnswerForm
                key={`${session.stage}:${session.form.id}:${session.form.version}`}
                form={session.form}
                locked={locked}
                onSubmit={(answer) => answerTask({ answer })}
                onSkip={(missingReason) =>
                  answerTask({ answer: null, missingReason })
                }
              />
            </div>
          ) : null}
          {session.stage === "rehearsal" && session.form ? (
            <div className="mt-6">
              <StudyPacket form={session.form} />
              <div className="mt-6">
                <ShiftRun
                  key={instance}
                  activity={activity}
                  canvasDelivery
                  study={{
                    instanceKey: instance,
                    initialSession: session.checkpoint ?? undefined,
                    experiment: session.experiment,
                    questionComplete: session.question.status === "responded",
                    saving: locked,
                    onSave: (snapshot, complete) =>
                      void saveRehearsal(snapshot, complete),
                    onEndEarly: (snapshot, reason) =>
                      void endRehearsal(snapshot, reason),
                    proposalRequest,
                    renderEvidenceQuestion: (snapshot) =>
                      session.experiment === "E1" ? null : (
                        <ResearchEvidenceQuestion
                          question={session.question}
                          snapshot={snapshot}
                          locked={locked}
                          onStart={(value, allow) =>
                            void startQuestion(value, allow)
                          }
                          onSkip={(value) => void skipQuestion(value)}
                          onRelease={releaseQuestion}
                          onRespond={respondQuestion}
                          onRefresh={() => void refresh()}
                        />
                      ),
                  }}
                />
              </div>
            </div>
          ) : null}
          {session.stage === "feedback" ? (
            <ResearchFeedbackForm locked={locked} onSubmit={answerTask} />
          ) : null}
          {session.stage === "complete" ? (
            <section className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-5">
              <h2 className="font-serif text-2xl">
                Your study path is finished
              </h2>
              <p className="mt-3 text-sm leading-7">
                The server has recorded the required submissions. This does not
                assign a grade or establish mastery. Follow the reviewed
                coordinator debrief and communication plan.
              </p>
            </section>
          ) : null}
          {session.stage === "withdrawn" ? (
            <section className="mt-6 rounded-xl border border-slate-200 p-5">
              <h2 className="text-xl font-semibold">Withdrawal recorded</h2>
              <p className="mt-3 text-sm leading-7">
                This session no longer accepts responses. The server has removed
                response/checkpoint content under the delete-on-request policy
                for this service. Contact the independent coordinator for any
                separate identity or consent records.
              </p>
            </section>
          ) : null}
          {session.stage === "expired" ? (
            <p className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-7">
              This private session is no longer open. Contact the coordinator;
              no new response can be submitted here.
            </p>
          ) : null}
          <details className="mt-6 rounded-lg border border-slate-200 p-4">
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">
              Confirmed assessment receipts
            </summary>
            {session.receipts.length ? (
              <ul className="mt-3 space-y-2 text-xs leading-6">
                {session.receipts.map((item) => (
                  <li key={item.requestId}>
                    {label[item.stage]} · {when(item.receivedAt)} ·{" "}
                    <span className="break-all">{item.requestId}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-7">
                No completed assessment submission is recorded yet. Rehearsal
                checkpoints and question steps are separate.
              </p>
            )}
          </details>
          {session.stage !== "withdrawn" && session.stage !== "expired" ? (
            <section className="mt-8 border-t border-slate-200 pt-5">
              <button
                className="min-h-11 py-2 text-sm font-semibold text-slate-600 underline focus-visible:outline-2 focus-visible:outline-teal-700"
                type="button"
                onClick={() => setWithdrawOpen((value) => !value)}
              >
                Withdrawal and data removal
              </button>
              {withdrawOpen ? (
                <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <p className="text-sm leading-7">
                    Withdrawing stops further study writes and asks this service
                    to delete your stored responses and rehearsal checkpoint. It
                    does not change course grades or ordinary support. Separate
                    coordinator-held records follow the reviewed policy.
                  </p>
                  <label className="mt-3 flex min-h-11 items-start gap-3 py-2 text-sm leading-7">
                    <input
                      className="mt-1 h-5 w-5"
                      type="checkbox"
                      checked={withdrawAcknowledged}
                      onChange={(event) =>
                        setWithdrawAcknowledged(event.target.checked)
                      }
                      disabled={locked}
                    />
                    I choose to withdraw this study record and remove its
                    response/checkpoint content.
                  </label>
                  <button
                    className={`${studySecondary} mt-3`}
                    disabled={locked || !withdrawAcknowledged}
                    onClick={() =>
                      void write({
                        path: "withdraw",
                        body: {
                          version: 1,
                          requestId: newRequestId(),
                          deleteData: true,
                        },
                        label: "withdrawal and content removal",
                      })
                    }
                  >
                    Confirm withdrawal and removal
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}
      {pending && !busy ? (
        <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm leading-7">
            A receipt for {pending.label} has not been confirmed.
            Editing/submitting another answer is paused. Retry the identical
            request, or refresh to check whether the server received it.
          </p>
          <button
            className={`${studySecondary} mt-3`}
            onClick={() => void write(pending)}
          >
            Retry this exact request
          </button>
        </div>
      ) : null}
      {error ? (
        <p
          ref={errorControl}
          tabIndex={-1}
          role="alert"
          className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-7"
        >
          {error}
        </p>
      ) : null}
      <p
        role="status"
        aria-live="polite"
        className="mt-5 text-sm leading-7 text-slate-600"
      >
        {notice}
      </p>
    </section>
  );
}
