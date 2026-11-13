/** HTTP boundaries for the separately gated study. No request bodies/tokens are logged. */
import {
  exact,
  researchConfig,
  researchStatus,
  ResearchError,
  tokenMatches,
  type ResearchConfig,
} from "./config";
import { configuredResearchStore } from "./store";
import { ResearchService } from "./service";
import { liveResearchDependencies } from "./runtime";

const LIMIT = 320 * 1024;
const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, private, max-age=0",
  Pragma: "no-cache",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers });
/** Next dev can normalize a loopback request URL to localhost even when the
 * visible browser host is 127.0.0.1. Only local synthetic mode permits aliases. */
export function researchOriginAllowed(
  origin: string,
  url: URL,
  mode: ResearchConfig["mode"],
): boolean {
  if (origin === url.origin) return true;
  if (mode !== "synthetic") return false;
  try {
    const incoming = new URL(origin),
      loopback = (host: string) =>
        ["localhost", "127.0.0.1", "[::1]"].includes(host);
    return (
      incoming.origin === origin &&
      !incoming.username &&
      !incoming.password &&
      incoming.pathname === "/" &&
      !incoming.search &&
      !incoming.hash &&
      loopback(incoming.hostname) &&
      loopback(url.hostname) &&
      incoming.protocol === url.protocol &&
      incoming.port === url.port
    );
  } catch {
    return false;
  }
}
function bearer(request: Request): string | null {
  const value = request.headers.get("authorization");
  if (!value) return null;
  const match = /^Bearer ([A-Za-z0-9_-]{32,256})$/.exec(value);
  if (!match)
    throw new ResearchError(401, "A valid research access token is required.");
  return match[1];
}
async function body(request: Request): Promise<unknown> {
  if (
    !/^application\/json(?:\s*;|$)/i.test(
      request.headers.get("content-type") ?? "",
    )
  )
    throw new ResearchError(415, "Use a JSON request.");
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > LIMIT))
    throw new ResearchError(413, "The study request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new ResearchError(400, "A JSON body is required.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      length += next.value.byteLength;
      if (length > LIMIT) {
        await reader.cancel();
        throw new ResearchError(413, "The study request is too large.");
      }
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(length);
    let at = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, at);
      at += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof ResearchError) throw error;
    throw new ResearchError(400, "The study request is not valid JSON.");
  } finally {
    reader.releaseLock();
  }
}

export type ResearchHttpFactory = (
  config: ResearchConfig,
) => Promise<ResearchService>;
const defaultFactory: ResearchHttpFactory = async (config) =>
  new ResearchService(
    config,
    await configuredResearchStore(config),
    liveResearchDependencies(config),
  );

export async function handleResearchRequest(
  request: Request,
  action: string,
  options: { env?: NodeJS.ProcessEnv; factory?: ResearchHttpFactory } = {},
): Promise<Response> {
  try {
    if (
      ![
        "session",
        "response",
        "checkpoint",
        "question",
        "proposal",
        "withdraw",
        "admin",
      ].includes(action)
    )
      return reply({ error: "Not found." }, 404);
    if (
      !["GET", "POST"].includes(request.method) ||
      (request.method === "GET" && action !== "session")
    )
      return reply({ error: "Method not allowed." }, 405);
    const url = new URL(request.url);
    if (url.search)
      throw new ResearchError(
        400,
        "Research access uses authorization headers, never URL parameters.",
      );
    const config = researchConfig(options.env ?? process.env, request.url);
    if (!config)
      return request.method === "GET" && action === "session"
        ? reply({ status: researchStatus(null) })
        : reply({ error: "Research collection is off." }, 404);
    const token = bearer(request);
    if (request.method === "GET" && !token)
      return reply({ status: researchStatus(config) });
    if (!token)
      throw new ResearchError(401, "A research access token is required.");
    const origin = request.headers.get("origin");
    if (
      request.method === "POST" &&
      origin &&
      !researchOriginAllowed(origin, url, config.mode)
    )
      throw new ResearchError(
        403,
        "Use the study interface on its own origin.",
      );
    const isCoordinator = tokenMatches(token, config.coordinatorToken);
    const isScorer = tokenMatches(token, config.scorerToken);
    const isAnalyst = tokenMatches(token, config.analystToken);
    const isPurger = tokenMatches(token, config.purgeToken);
    if (action === "session" && request.method === "POST" && !isCoordinator)
      throw new ResearchError(403, "Coordinator access is required.");
    if (
      action === "admin" &&
      !isCoordinator &&
      !isScorer &&
      !isAnalyst &&
      !isPurger
    )
      throw new ResearchError(
        403,
        "The required research role is unavailable.",
      );
    if (
      !(
        action === "admin" ||
        (action === "session" && request.method === "POST")
      ) &&
      !token.startsWith("rp_")
    )
      throw new ResearchError(401, "Use the coded participant access token.");
    const service = await (options.factory ?? defaultFactory)(config);
    if (request.method === "GET") return reply(await service.session(token));
    const input = await body(request);
    if (action === "session")
      return reply(await service.enrollment(input), 201);
    if (action === "response")
      return reply(await service.response(token, input));
    if (action === "checkpoint")
      return reply(await service.checkpoint(token, input));
    if (action === "question")
      return reply(await service.question(token, input));
    if (action === "proposal")
      return reply(await service.proposal(token, input));
    if (action === "withdraw")
      return reply(await service.withdraw(token, input));
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new ResearchError(400, "A bounded admin request is required.");
    const operation = (input as Record<string, unknown>).action;
    if (operation === "export-scoring" || operation === "export-analysis") {
      exact(input, ["version", "action"]);
      if (input.version !== 1)
        throw new ResearchError(400, "Unknown request version.");
      if (operation === "export-scoring" && isScorer)
        return reply(await service.export("scoring"));
      if (operation === "export-analysis" && isAnalyst)
        return reply(await service.export("analysis"));
    } else if (operation === "rotate-token" && isCoordinator)
      return reply(await service.rotate(input));
    else if (operation === "observation" && isCoordinator)
      return reply(await service.observation(input));
    else if (
      ["purge-expired", "delete-participant"].includes(String(operation)) &&
      isPurger
    )
      return reply(await service.purge(input));
    throw new ResearchError(
      403,
      "This operation requires a different research role.",
    );
  } catch (error) {
    if (error instanceof ResearchError)
      return reply({ error: error.message }, error.status);
    return reply(
      {
        error:
          "The research service is unavailable. Keep your response and retry the same request or contact the independent coordinator.",
      },
      503,
    );
  }
}
