"use client";

import { useEffect, useRef, useState } from "react";
import type { ResearchStatus } from "@/lib/research/types";
import { newRequestId, readSession, readStatus, studyJSON } from "../client";
import { studyButton, studyField, studySecondary } from "../StudyPacket";

export function ResearchCoordinator() {
  const [status, setStatus] = useState<ResearchStatus | null>(null),
    [access, setAccess] = useState("");
  const [consentVersion, setConsentVersion] = useState(""),
    [reference, setReference] = useState(""),
    [fixture, setFixture] = useState("");
  const [attested, setAttested] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [issued, setIssued] = useState<{
    token: string;
    participantId: string;
    protocol: string;
  } | null>(null);
  const [recovery, setRecovery] = useState<{
    participantId: string;
    protocol: string;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const pending = useRef<{
    requestId: string;
    consentVersion: string;
    reference: string;
    fixture: string;
  } | null>(null);
  const tokenControl = useRef<HTMLTextAreaElement>(null);
  const active = useRef<AbortController | null>(null),
    epoch = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    studyJSON("session", "", undefined, controller.signal)
      .then((value) => setStatus(readStatus(value)))
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "Study configuration is unavailable. Enrollment is not enabled.",
          );
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const clearPrivateView = () => {
      epoch.current += 1;
      active.current?.abort();
      active.current = null;
      setBusy(false);
      setAccess("");
      setIssued(null);
      setRecovery(null);
      pending.current = null;
      setAttested(false);
    };
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) clearPrivateView();
    };
    window.addEventListener("pagehide", clearPrivateView);
    window.addEventListener("pageshow", restored);
    return () => {
      active.current?.abort();
      window.removeEventListener("pagehide", clearPrivateView);
      window.removeEventListener("pageshow", restored);
    };
  }, []);
  async function enroll() {
    if (
      busy ||
      !status?.available ||
      !attested ||
      !access.trim() ||
      !consentVersion.trim() ||
      !reference.trim()
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    const snapshot = pending.current ?? {
      requestId: newRequestId(),
      consentVersion,
      reference,
      fixture,
    };
    pending.current = snapshot;
    const controller = new AbortController(),
      currentEpoch = epoch.current;
    active.current = controller;
    try {
      const result = await studyJSON(
        "session",
        access.trim(),
        {
          version: 1,
          requestId: snapshot.requestId,
          ...(snapshot.fixture.trim()
            ? { syntheticId: snapshot.fixture.trim() }
            : {}),
          attestation: {
            consentVersion: snapshot.consentVersion,
            consentRecorded: true,
            eligibleAdult: true,
            coordinatorReference: snapshot.reference,
          },
        },
        controller.signal,
      );
      if (epoch.current !== currentEpoch) return;
      if (
        !result ||
        typeof result !== "object" ||
        !("participantToken" in result) ||
        !("session" in result)
      )
        throw new Error("No enrollment receipt was received.");
      const session = readSession(result.session);
      if (
        result.participantToken === null &&
        "replayed" in result &&
        result.replayed === true
      ) {
        setRecovery({
          participantId: session.participantId,
          protocol: session.protocolVersion,
        });
        pending.current = null;
        setNotice(
          "The server confirms this enrollment already exists. Its original token cannot be displayed again; no second participant was created.",
        );
        return;
      }
      if (typeof result.participantToken !== "string")
        throw new Error(
          "The private token was not received. Keep this request for a retry.",
        );
      setIssued({
        token: result.participantToken,
        participantId: session.participantId,
        protocol: session.protocolVersion,
      });
      pending.current = null;
      setAccess("");
      setNotice(
        "Enrollment was confirmed by the server. The private token is shown for handoff below; it is not stored in this browser.",
      );
    } catch (problem) {
      if (epoch.current === currentEpoch)
        setError(
          problem instanceof Error
            ? problem.message
            : "Enrollment was not confirmed. Keep the same request for a retry.",
        );
    } finally {
      if (epoch.current === currentEpoch) {
        active.current = null;
        setBusy(false);
      }
    }
  }
  async function reissue() {
    if (!recovery || busy || !access.trim()) return;
    setBusy(true);
    setError("");
    const controller = new AbortController(),
      currentEpoch = epoch.current;
    active.current = controller;
    try {
      const result = await studyJSON(
        "admin",
        access.trim(),
        {
          version: 1,
          action: "rotate-token",
          participantId: recovery.participantId,
        },
        controller.signal,
      );
      if (epoch.current !== currentEpoch) return;
      if (
        !result ||
        typeof result !== "object" ||
        !("participantToken" in result) ||
        typeof result.participantToken !== "string"
      )
        throw new Error(
          "A replacement token was not received. Do not use the previous token.",
        );
      setIssued({ token: result.participantToken, ...recovery });
      setRecovery(null);
      setAccess("");
      setNotice(
        "The server issued a replacement private token. The old token is invalid.",
      );
    } catch (problem) {
      if (epoch.current === currentEpoch)
        setError(
          problem instanceof Error
            ? problem.message
            : "Replacement was not confirmed.",
        );
    } finally {
      if (epoch.current === currentEpoch) {
        active.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-widest text-teal-800">
        Building AI Solutions · coordinator tools
      </p>
      <h1 className="mt-3 font-serif text-3xl">Independent enrollment</h1>
      <p className="mt-4 text-sm leading-7">
        Use this only as the authorized independent coordinator. Institutional
        approval, consent and adult eligibility are established outside this
        website. This page does not provide consent, decide eligibility, or
        activate research. Do not enter names, emails, student numbers or
        assessment answers.
      </p>
      {status ? (
        <p
          className={`mt-5 rounded-lg border p-4 text-sm leading-7 ${status.mode === "synthetic" ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"}`}
        >
          <strong>
            {status.mode === "synthetic"
              ? "Synthetic test mode · no participant data"
              : status.available
                ? "Configured study service"
                : "Collection is off"}
            .
          </strong>
          {status.available ? ` ${status.note}` : null}
        </p>
      ) : (
        <p className="mt-5 text-sm">Checking service configuration…</p>
      )}
      {!issued ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void enroll();
          }}
        >
          <label className="block text-sm font-semibold">
            Coordinator access token
            <input
              type="password"
              value={access}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setAccess(event.target.value)}
              className={studyField}
              disabled={busy}
            />
          </label>
          <label className="block text-sm font-semibold">
            Reviewed consent-version identifier
            <input
              value={consentVersion}
              maxLength={120}
              onChange={(event) => setConsentVersion(event.target.value)}
              className={studyField}
              disabled={busy || !!pending.current || !!recovery}
            />
          </label>
          <label className="block text-sm font-semibold">
            External consent-record reference · no identifying text
            <input
              value={reference}
              maxLength={100}
              placeholder="coord_ followed by an opaque record reference"
              onChange={(event) => setReference(event.target.value)}
              className={studyField}
              disabled={busy || !!pending.current || !!recovery}
            />
          </label>
          {status?.mode === "synthetic" ? (
            <label className="block text-sm font-semibold">
              Synthetic fixture label
              <input
                value={fixture}
                maxLength={60}
                placeholder="synthetic-interface-test-01"
                onChange={(event) => setFixture(event.target.value)}
                className={studyField}
                disabled={busy || !!pending.current || !!recovery}
              />
            </label>
          ) : null}
          <label className="flex min-h-11 items-start gap-3 py-2 text-sm leading-7">
            <input
              type="checkbox"
              checked={attested}
              onChange={(event) => setAttested(event.target.checked)}
              className="mt-1 h-5 w-5"
              disabled={busy}
            />
            {status?.mode === "synthetic"
              ? "This is an invented test record. No person, real consent or real eligibility is represented."
              : "I confirm that the institutionally reviewed consent and adult-eligibility process is complete, and I am authorized to record enrollment independently of grading."}
          </label>
          {!recovery ? (
            <button
              type="submit"
              disabled={
                busy ||
                !status?.available ||
                !access.trim() ||
                !consentVersion.trim() ||
                !reference.trim() ||
                !attested ||
                (status?.mode === "synthetic" && !fixture.trim())
              }
              className={studyButton}
            >
              {busy
                ? "Confirming enrollment…"
                : pending.current
                  ? "Retry the same enrollment request"
                  : status?.mode === "synthetic"
                    ? "Create synthetic test session"
                    : "Record reviewed enrollment"}
            </button>
          ) : (
            <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm leading-7">
                Existing record {recovery.participantId}. Issuing a replacement
                invalidates the prior token, including any copy already
                delivered. Use this only to recover an undelivered/lost token
                through the approved process.
              </p>
              <button
                type="button"
                className={`${studySecondary} mt-3`}
                disabled={busy || !access.trim()}
                onClick={() => void reissue()}
              >
                Invalidate old token and issue replacement
              </button>
            </section>
          )}
        </form>
      ) : (
        <section className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-5">
          <h2 className="font-semibold">
            Private handoff · {issued.participantId}
          </h2>
          <p className="mt-2 text-sm leading-7">
            Protocol {issued.protocol}. Deliver this token only through the
            approved private channel. Keep it out of URLs, chat, screenshots and
            shared documents. It will disappear when this page closes.
          </p>
          <label className="mt-4 block text-sm font-semibold">
            Participant token
            <textarea
              ref={tokenControl}
              readOnly
              rows={3}
              value={issued.token}
              className={studyField}
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              className={studySecondary}
              onClick={() => {
                tokenControl.current?.focus();
                tokenControl.current?.select();
                setNotice(
                  "Token selected. Use your device’s Copy command and the approved private handoff.",
                );
              }}
            >
              Select token to copy
            </button>
            <button
              className={studySecondary}
              onClick={() => {
                setIssued(null);
                setAttested(false);
                setReference("");
                setFixture("");
                setNotice("Token removed from this view.");
              }}
            >
              Remove token from this view
            </button>
          </div>
        </section>
      )}
      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-7"
        >
          {error}
        </p>
      ) : null}
      <p role="status" aria-live="polite" className="mt-4 text-sm leading-7">
        {notice}
      </p>
      <a
        href="/teaching/ai-solutions/research"
        className="mt-5 inline-block min-h-11 py-3 text-sm font-semibold text-teal-900 underline"
      >
        Open the participant entry page
      </a>
    </section>
  );
}
