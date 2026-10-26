import { WORKSHOP_CHUNKS } from "./chunks";
import type { WorkshopChunk } from "./chunks";

export type RetrievedChunk = {
  id: string;
  title: string;
  body: string;
};

const FALLBACK_IDS = ["overview", "troubleshooting", "environment"] as const;
const MIN_CHUNKS = 2;
const MAX_CHUNKS = 4;

function hasTerm(query: string, term: string): boolean {
  const needle = term.toLowerCase();
  if (!needle) return false;
  const haystack = query.toLowerCase();
  let from = 0;
  while (from <= haystack.length - needle.length) {
    const at = haystack.indexOf(needle, from);
    if (at < 0) return false;
    const before = at === 0 ? " " : haystack[at - 1];
    const afterIndex = at + needle.length;
    const after = afterIndex >= haystack.length ? " " : haystack[afterIndex];
    const boundary = (char: string) => !/[a-z0-9]/i.test(char);
    if (boundary(before) && boundary(after)) return true;
    from = at + 1;
  }
  return false;
}

function scoreChunk(query: string, chunk: WorkshopChunk): number {
  let score = 0;
  if (hasTerm(query, chunk.id)) score += 28;
  const spacedId = chunk.id.replaceAll("_", " ");
  if (spacedId !== chunk.id && hasTerm(query, spacedId)) score += 28;
  for (const alias of chunk.aliases) {
    if (hasTerm(query, alias.term)) score += alias.weight;
  }
  return score;
}

function toRetrieved(chunk: WorkshopChunk): RetrievedChunk {
  return { id: chunk.id, title: chunk.title, body: chunk.body };
}

export function retrieveChunks(query: string): RetrievedChunk[] {
  const ranked = WORKSHOP_CHUNKS.map((chunk, index) => ({
    chunk,
    index,
    score: scoreChunk(query, chunk),
  })).sort((a, b) => b.score - a.score || a.index - b.index);

  const picked = ranked.filter((entry) => entry.score > 0).slice(0, MAX_CHUNKS);
  const seen = new Set(picked.map((entry) => entry.chunk.id));
  const result = picked.map((entry) => toRetrieved(entry.chunk));

  for (const id of FALLBACK_IDS) {
    if (result.length >= MIN_CHUNKS) break;
    if (seen.has(id)) continue;
    const chunk = WORKSHOP_CHUNKS.find((entry) => entry.id === id);
    if (!chunk) continue;
    result.push(toRetrieved(chunk));
    seen.add(id);
  }

  return result.slice(0, MAX_CHUNKS);
}
