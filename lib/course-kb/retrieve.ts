import { COURSE_CHUNKS } from "./generated";
import type { CourseChunk, CourseSource, CourseTurn } from "./types";

const STOP = new Set("a an and are as at be been but by can could course do does for from give have help how i in into is it its me my of on or our please should show some student students that the their them there these they this to use using want was we what when where which who why will with would you your ai business solution solutions explain tell about more also just need know".split(" "));
export function tokens(text: string): string[] {
  return [...new Set((text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(t => t.length > 1 && !STOP.has(t)).map(t => t.length > 5 && t.endsWith("s") ? t.slice(0, -1) : t))];
}
const indexed = COURSE_CHUNKS.map(chunk => ({ chunk, body: new Set(tokens(chunk.body)), title: new Set(tokens(chunk.title)), section: new Set(tokens(chunk.section)) }));
const frequencies = new Map<string, number>();
for (const item of indexed) for (const term of new Set([...item.body, ...item.title, ...item.section])) frequencies.set(term, (frequencies.get(term) ?? 0) + 1);

/** Recent context resolves short follow-ups; an explicit new topic does not inherit old hits. */
export function courseRetrievalQuery(turns: readonly CourseTurn[]): string {
  const latest = turns.at(-1)?.content ?? "";
  const followup = /\b(that|those|this|it|they|same|example|another|more|instead|why|what if)\b/i.test(latest) || tokens(latest).length < 3;
  if (!followup || turns.length < 2) return latest;
  const previous = turns.slice(-4, -1).map(turn => turn.content.slice(0, 1000)).join(" ");
  return `${latest}\nPrevious discussion: ${previous}`;
}

export function retrieveCourseChunks(query: string, maxChunks = 6): CourseChunk[] {
  // Explicit course-navigation intents get useful local context. This is not a
  // fallback for unrelated queries and does not assert any outside knowledge.
  if (/^(hi|hello|hey)[!. ]*$/i.test(query.trim()) || /\b(where (?:do|should) i start|what is (?:this|the) course about|course overview)\b/i.test(query)) query += " module 00 orientation capstone learning";
  if (/\b(what is ai|how does ai work|define ai)\b/i.test(query)) query += " artificial intelligence machine learning generative predictive";
  if (/\b(coding|programming|prerequisites?)\b/i.test(query)) query += " no programming required usable no-code experience guide";
  const terms = tokens(query);
  if (!terms.length) return [];
  const explicit = query.match(/\b(module|assessment)\s*0?(\d{1,2})\b/i);
  const selectedPage = explicit ? `${explicit[1].toLowerCase()}-${explicit[2].padStart(2, "0")}.html` : undefined;
  const scored = indexed.map((entry, index) => {
    let score = 0, matches = 0;
    for (const term of terms) {
      const idf = Math.log(1 + COURSE_CHUNKS.length / (1 + (frequencies.get(term) ?? 0)));
      const weight = entry.title.has(term) ? 3 : entry.section.has(term) ? 3.5 : entry.body.has(term) ? 1 : 0;
      if (weight) { score += idf * weight; matches += 1; }
    }
    if (selectedPage && entry.chunk.page === selectedPage) score += 18;
    if (selectedPage && entry.chunk.page !== selectedPage) score *= 0.4;
    return { ...entry, score, matches, index };
  }).filter(entry => entry.score >= 3.4 && (entry.matches >= Math.min(2, terms.length) || (entry.matches === 1 && entry.score >= 7) || entry.chunk.page === selectedPage))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const picked: CourseChunk[] = [], perPage = new Map<string, number>(); let size = 0;
  for (const entry of scored) {
    if (picked.length >= Math.min(6, Math.max(1, maxChunks))) break;
    const group = entry.chunk.page === "labs/index.html" ? entry.chunk.url : entry.chunk.page;
    if ((perPage.get(group) ?? 0) >= (selectedPage ? 4 : 3)) continue;
    if (size + entry.chunk.body.length > 14500) continue;
    picked.push(entry.chunk); size += entry.chunk.body.length; perPage.set(group, (perPage.get(group) ?? 0) + 1);
  }
  // No unconditional fallback: unrelated questions must not receive invented grounding.
  return picked;
}

export function courseSources(chunks: readonly CourseChunk[]): CourseSource[] {
  const unique = new Map<string, CourseSource>();
  for (const chunk of chunks) if (!unique.has(chunk.url)) unique.set(chunk.url, { sourceId: chunk.id, title: `${chunk.title} — ${chunk.section}`, url: chunk.url });
  return [...unique.values()];
}
