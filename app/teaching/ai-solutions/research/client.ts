/** Browser-only transport. Tokens stay in memory and Authorization headers. */
import type {
  ResearchReceipt,
  ResearchSessionView,
  ResearchStatus,
} from "@/lib/research/types";

export class ResearchClientError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ResearchClientError";
  }
}
export const newRequestId = () => crypto.randomUUID();
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const date = (value: unknown) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));
const stages = ["baseline", "rehearsal", "immediate", "delayed", "feedback"];
export function readReceipt(value: unknown): ResearchReceipt {
  if (
    !object(value) ||
    typeof value.requestId !== "string" ||
    !stages.includes(value.stage as string) ||
    !date(value.receivedAt) ||
    typeof value.protocolVersion !== "string" ||
    typeof value.formVersion !== "string"
  )
    throw new Error(
      "A valid server receipt was not provided. Refresh to check whether the request was received.",
    );
  return value as ResearchReceipt;
}
export function readStatus(value: unknown): ResearchStatus {
  if (object(value) && object(value.status)) value = value.status;
  if (
    !object(value) ||
    value.version !== 1 ||
    !["off", "synthetic", "live"].includes(value.mode as string) ||
    !["off", "synthetic-only", "configured"].includes(value.status as string) ||
    typeof value.available !== "boolean" ||
    typeof value.note !== "string" ||
    (value.mode === "off" && value.available)
  )
    throw new Error(
      "The study configuration could not be checked. Nothing was sent.",
    );
  return value as ResearchStatus;
}
export function readSession(value: unknown): ResearchSessionView {
  if (object(value) && "session" in value) value = value.session;
  const invalid = () => {
    throw new Error(
      "The study response could not be checked. Refresh before continuing.",
    );
  };
  if (
    !object(value) ||
    value.version !== 1 ||
    !["synthetic", "live"].includes(value.mode as string) ||
    !["E1", "E2", "E3"].includes(value.experiment as string) ||
    ![...stages, "complete", "withdrawn", "expired"].includes(
      value.stage as string,
    ) ||
    !Array.isArray(value.receipts) ||
    !object(value.question) ||
    typeof value.participantId !== "string" ||
    typeof value.studyId !== "string" ||
    typeof value.protocolVersion !== "string" ||
    typeof value.outsidePlannedWindow !== "boolean" ||
    !date(value.retentionUntil) ||
    (value.availableAt !== null && !date(value.availableAt))
  )
    return invalid();
  value.receipts.forEach(readReceipt);
  if (value.lastCheckpointReceipt !== null)
    readReceipt(value.lastCheckpointReceipt);
  const form = value.form;
  if (
    form !== null &&
    (!object(form) ||
      !["id", "version", "title", "instructions", "responsePrompt"].every(
        (key) => typeof form[key] === "string",
      ) ||
      !strings(form.trace) ||
      !Array.isArray(form.sources) ||
      !form.sources.every(
        (source) =>
          object(source) &&
          ["id", "label", "text"].every(
            (key) => typeof source[key] === "string",
          ),
      ))
  )
    return invalid();
  const q = value.question;
  if (
    !["not-started", "inspecting", "released", "responded"].includes(
      q.status as string,
    ) ||
    typeof q.inspectionInstructions !== "string" ||
    ["startedAt", "releaseBy", "responseBy"].some(
      (key) => q[key] !== undefined && !date(q[key]),
    ) ||
    (q.response !== undefined && typeof q.response !== "string")
  )
    return invalid();
  const needsCard =
    q.status === "released" ||
    (q.status === "responded" && q.responseStatus !== "declined");
  if (
    (needsCard || q.question !== undefined) &&
    (!object(q.question) ||
      !["id", "heading", "grounding", "question"].every(
        (key) =>
          typeof (q.question as Record<string, unknown>)[key] === "string",
      ) ||
      !strings(q.question.sourceIds))
  )
    return invalid();
  return value as ResearchSessionView;
}
export async function studyFetch(
  path: string,
  token: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<Response> {
  const headers = new Headers({ "content-type": "application/json" });
  if (token) headers.set("authorization", `Bearer ${token}`);
  return fetch(`/api/research/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    cache: "no-store",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    redirect: "error",
  });
}
export async function studyJSON(
  path: string,
  token: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await studyFetch(path, token, body, signal);
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new ResearchClientError(
      response.status,
      "The service response could not be read. A save is not confirmed.",
    );
  }
  if (!response.ok) {
    const message =
      response.status === 401 || response.status === 403
        ? "Access was not accepted. Check the private token with the coordinator."
        : response.status === 409
          ? "This step or request no longer matches the server record. Refresh the session before continuing."
          : response.status === 423
            ? "This task is not open yet. Refresh at the available time."
            : response.status === 429
              ? "The service is busy. Keep this page open and retry the same request shortly."
              : response.status === 503
                ? "Study collection is unavailable. No save receipt was received."
                : "The service did not confirm this request. Keep your answer and retry or refresh.";
    throw new ResearchClientError(response.status, message);
  }
  return value;
}
