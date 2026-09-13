"use client";

/**
 * Every tool that can send something. Nothing leaves the browser until the
 * visitor taps Send on the card, and the card then reports what actually
 * happened: production has no mail key, so a send comes back "not sent" and
 * the copy says exactly that. Never claim an email went out when it did not.
 *
 * The card is deliberately tool-agnostic: it reads the streamed input rather
 * than one tool's schema, so a new approval-gated send tool gets a working,
 * honest approval card the moment the server exposes it.
 */

import {
  inputRows,
  isDeliveryOutput,
  isHandOffOutput,
  phaseOf,
  stepTitle,
  toolNameOf,
  type ChatToolPart,
  type Phase,
} from "@/app/components/chat/chat-ui";
import { CardShell, ContactFallback, Row } from "@/app/components/chat/primitives";
import { FOUNDER_CHAT_NAME } from "@/lib/chat-persona";
import type { SendFailure } from "@/lib/chat-tools";
import { SITE } from "@/lib/site";

/** What the hand-off email will carry; the server picks the latest brief and snapshot from the transcript. */
export type Attachments = { brief: boolean; readiness: boolean };

/**
 * One honest line per reason the server can return. Typed as a full record
 * over `SendFailure`, so a reason added on the server fails the build here
 * until its sentence exists: a send can never report a bare "nothing was
 * sent" for a reason we already know.
 */
const NOT_SENT_REASON: Record<SendFailure, string> = {
  "not-configured":
    "Email is not switched on for this site yet, so your request was noted on the server but no email went out.",
  "invalid-email": "That email address did not look valid, so nothing was sent.",
  "invalid-input": "The approved message did not pass validation on the server, so nothing was sent.",
  quota: "This connection has used today's send allowance, so nothing was sent.",
  "send-failed": "The email service did not accept the message, so nothing was sent.",
  "no-brief": "There was no brief to attach any more, so nothing was sent.",
};

/** Outputs echo back from the client, so an unknown reason still reads honestly. */
function notSentLine(reason: string | undefined): string {
  return (reason && NOT_SENT_REASON[reason as SendFailure]) || "Nothing was sent.";
}

/** Fields the card shows as a heading or not at all, rather than as a plain row. */
const HIDDEN_FIELDS = ["briefToolCallId", "readinessToolCallId", "toolCallId"];

function recipientLine(name: string, input: unknown): string {
  const email =
    input && typeof input === "object" && typeof (input as { email?: unknown }).email === "string"
      ? ((input as { email: string }).email ?? "")
      : "";
  if (name === "emailBriefToVisitor") return email ? `You (${email})` : "You";
  return `${FOUNDER_CHAT_NAME} (${SITE.email})`;
}

function sendLabel(name: string): string {
  if (name === "emailBriefToVisitor") return "Send it to me";
  return `Send to ${FOUNDER_CHAT_NAME}`;
}

export function DeliveryCard({
  part,
  attachments,
  busy,
  onRespond,
  onRetry,
}: {
  part: ChatToolPart;
  attachments: Attachments;
  busy: boolean;
  onRespond: (id: string, approved: boolean) => void;
  onRetry: () => void;
}) {
  const name = toolNameOf(part);
  const input: unknown = part.input;
  const handOff = part.state === "output-available" && isHandOffOutput(part.output) ? part.output : undefined;
  const delivery =
    part.state === "output-available" && isDeliveryOutput(part.output) ? part.output : undefined;

  // The dot, the title and the body must agree: a send that came back
  // undelivered (or unreadable) is a failed step, never a green "done".
  const notSent = part.state === "output-available" && !delivery?.delivered;
  // Approved, but the request that carries the approval to the server did not
  // run or failed (rate limit, body cap, network, Stop). Nothing is being sent
  // now. Retry re-posts the transcript unchanged, which is the only request
  // the server will execute the approval from; a new message would deny it.
  const stalled = part.state === "approval-responded" && part.approval.approved && !busy;
  const phase: Phase = notSent ? "failed" : stalled ? "waiting" : phaseOf(part);
  const done = stepTitle(name, "done");
  const title = notSent ? `${done}: not sent` : stalled ? `${done}: not sent yet` : stepTitle(name, phase);

  const attached = [
    (attachments.brief || (!!input && typeof input === "object" && "briefToolCallId" in input)) &&
      "your consulting brief",
    attachments.readiness && "your readiness snapshot",
  ].filter((s): s is string => typeof s === "string");
  const showAttachments = name === "handOffToMajid" && attached.length > 0;

  if (part.state === "approval-requested") {
    return (
      <CardShell title={title} phase={phase}>
        <p>Send this? Nothing goes out until you say so.</p>
        <dl className="space-y-1 text-xs">
          <Row label="To" value={recipientLine(name, input)} />
          {inputRows(input, HIDDEN_FIELDS).map((r) => (
            <Row key={r.label} label={r.label} value={r.value} />
          ))}
          {showAttachments && <Row label="Attached" value={attached.join(" and ")} />}
        </dl>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => onRespond(part.approval.id, true)}
            className="btn-primary btn-compact text-xs disabled:opacity-50"
          >
            {sendLabel(name)}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRespond(part.approval.id, false)}
            className="btn-secondary btn-compact text-xs disabled:opacity-50"
          >
            Not now
          </button>
        </div>
      </CardShell>
    );
  }

  if (part.state === "approval-responded") {
    return (
      <CardShell title={title} phase={phase}>
        <p>
          {!part.approval.approved
            ? "Not sent. Nothing was shared."
            : stalled
              ? "Approved, but the send did not go through. Nothing has been shared yet."
              : "Sending now."}
        </p>
        {stalled && (
          <button type="button" onClick={onRetry} className="btn-secondary btn-compact text-xs">
            Retry
          </button>
        )}
      </CardShell>
    );
  }

  if (part.state === "output-denied") {
    return (
      <CardShell title={title} phase={phase}>
        <p>Not sent. Nothing was shared. Say the word if you change your mind.</p>
      </CardShell>
    );
  }

  if (part.state === "output-error") {
    return (
      <CardShell title={title} phase={phase}>
        <p>This step failed, so nothing was sent.</p>
        <ContactFallback emailOff={false} />
      </CardShell>
    );
  }

  if (part.state === "output-available") {
    if (!delivery) {
      return (
        <CardShell title={title} phase={phase}>
          <p>The step finished, but the result could not be read, so treat it as not sent.</p>
          <ContactFallback emailOff={false} />
        </CardShell>
      );
    }
    if (delivery.delivered) {
      return (
        <CardShell title={title} phase={phase}>
          <p>
            {name === "emailBriefToVisitor"
              ? "Sent to your inbox."
              : `Sent to ${FOUNDER_CHAT_NAME} at ${SITE.email}. He will follow up with you by email.`}
          </p>
          {handOff?.briefAttached && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Your consulting brief was attached.</p>
          )}
        </CardShell>
      );
    }
    return (
      <CardShell title={title} phase={phase}>
        <p>Not sent. {notSentLine(delivery.reason)}</p>
        <ContactFallback emailOff={delivery.reason === "not-configured"} />
      </CardShell>
    );
  }

  // input-streaming or input-available: the model is still filling in the fields.
  return (
    <CardShell title={title} phase={phase}>
      <dl className="space-y-1 text-xs">
        {inputRows(input, [...HIDDEN_FIELDS, "name", "email"]).map((r) => (
          <Row key={r.label} label={r.label} value={r.value} />
        ))}
      </dl>
    </CardShell>
  );
}
