/**
 * The grounded facts the `lookupSiteFacts` tool may cite.
 *
 * Every entry is derived from a module that already owns the fact: `MAJID`,
 * `SITE`, `FAQS`, `TRAINING_CATALOG`, `CHAT_MODELS`, `lib/chat-limits.ts`, or
 * the measured eval artifact. Never add a fact here that is not in one of
 * them, and never write a number into this file by hand: if a claim has no
 * home in a data module, it does not belong in the assistant's mouth.
 *
 * Every returned string passes through `plainPunctuation()`, because the data
 * modules contain em and en dashes and this text is read aloud by the model.
 *
 * Client-safe: data modules and pure functions.
 */

import { CHAT_MODELS, DEFAULT_MODEL_ID, FALLBACK_MODEL_ID } from "@/lib/chat-models";
import {
  GLOBAL_HARD_BUDGET_USD,
  GLOBAL_SOFT_BUDGET_USD,
  IP_DAILY_BUDGET_USD,
  RATE_LIMIT_PER_MINUTE,
} from "@/lib/chat-limits";
import { FOUNDER_CHAT_NAME } from "@/lib/chat-persona";
import { RUBRIC, RUBRIC_MAX, publishedBakeoff, type PublishedRow } from "@/lib/evals";
import { FAQS } from "@/lib/faq";
import { MAJID } from "@/lib/majid";
import { plainPunctuation } from "@/lib/plain-punctuation";
import { SITE } from "@/lib/site";
import { TRAINING_CATALOG } from "@/lib/training-catalog";

export const FACT_TOPICS = [
  "background",
  "research",
  "teaching",
  "training",
  "consulting",
  "internships",
  "location",
  "contact",
  "assistant",
  "evaluations",
] as const;

export type FactTopic = (typeof FACT_TOPICS)[number];

export type SiteFact = {
  topic: FactTopic;
  /** Short label for the card row. */
  label: string;
  text: string;
  /** Which module the fact came from, shown so the visitor can see it is not invented. */
  source: string;
  url?: string;
};

const usd = (v: number) => `$${v.toFixed(2)}`;

/** Small counts read better spelled out, and this text is read aloud. */
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const spelled = (n: number) => NUMBER_WORDS[n] ?? String(n);

/** "A", "A and B", "A, B and C". Plain text: this is read aloud. */
function nameList(labels: readonly string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/**
 * What the judges found, or an empty string when nothing was scored.
 *
 * A tie is named as a tie. Sorting the rows and reading the first one would
 * report a three-way tie as a single winner, and this sentence exists so the
 * model can cite a measurement instead of asserting one.
 *
 * The judges are named as a list because each reply is scored by a model that
 * did not write it, so one bake-off is scored by more than one model and there
 * is no single judge to name.
 */
function judgeSentence(published: NonNullable<ReturnType<typeof publishedBakeoff>>): string {
  const judged = published.judgedBy;
  if (!judged) return "";
  const scored = published.rows.filter(
    (row): row is PublishedRow & { total: number } => typeof row.total === "number",
  );
  if (scored.length === 0) return "";

  const max = Math.max(...scored.map((row) => row.total));
  const leaders = scored.filter((row) => row.total === max);
  const outOf = RUBRIC.length * RUBRIC_MAX;
  const preamble = `The replies were scored against a ${spelled(RUBRIC.length)}-part rubric by ${nameList(judged.judges.map((j) => j.label))}, never by the model that wrote the reply, and`;

  if (scored.length === 1) {
    // One scored model is not a ranking: say what it scored, not that it won.
    return ` ${preamble} ${scored[0].label} scored ${max} out of ${outOf}. It is the only model scored in this run.`;
  }
  if (leaders.length === 1) {
    return ` ${preamble} ${leaders[0].label} scored highest at ${max} out of ${outOf}.`;
  }
  if (leaders.length === scored.length) {
    return ` ${preamble} all ${spelled(scored.length)} scored models tied at ${max} out of ${outOf}.`;
  }
  return ` ${preamble} ${nameList(leaders.map((row) => row.label))} tied for the highest score at ${max} out of ${outOf}.`;
}

function build(): SiteFact[] {
  const facts: SiteFact[] = [];
  const add = (fact: SiteFact) => {
    facts.push({ ...fact, text: plainPunctuation(fact.text), label: plainPunctuation(fact.label) });
  };

  /* Background ---------------------------------------------------------- */
  add({
    topic: "background",
    label: "Academia",
    text: MAJID.bio.academia,
    source: "site bio",
  });
  add({ topic: "background", label: "Industry", text: MAJID.bio.industry, source: "site bio" });
  add({ topic: "background", label: "Community", text: MAJID.bio.community, source: "site bio" });
  add({
    topic: "background",
    label: "Education",
    text: `${MAJID.education.phd}. ${MAJID.education.ms}. ${MAJID.education.mba}. ${MAJID.education.basc}.`,
    source: "site bio",
  });
  add({
    topic: "background",
    label: "Experience",
    text: `${MAJID.yearsAppliedAiCs} years in applied AI and computer science since ${MAJID.careerStartYear}. ${MAJID.scholarCitations} Google Scholar citations as of ${MAJID.scholarCitationsAsOf}. Those are the only two numbers to quote.`,
    source: "site bio",
    url: MAJID.scholar,
  });
  add({
    topic: "background",
    label: "Recognition",
    text: `${MAJID.aiUtah100.label}. He is a published honoree, not a winner, a rank, or a category.`,
    source: "site bio",
    url: MAJID.aiUtah100.url,
  });

  /* Research ------------------------------------------------------------ */
  for (const paper of MAJID.publications.slice(0, 5)) {
    add({
      topic: "research",
      label: `${paper.year}: ${paper.title}`,
      text: `${paper.authors}. ${paper.venue}. Cite the title and venue exactly; never invent a citation count for it.`,
      source: "publications",
      url: paper.href,
    });
  }
  add({
    topic: "research",
    label: "Applied research areas",
    text: "LLMs, agents and RAG; EdTech (AI-STER, AI-ClassSims); public-sector AI (DataGovAI, privacy-preserving synthetic data); drone RGB and thermal wind-turbine inspection; GridEye aerial inspection of the electrical grid with the University of Utah and PacifiCorp, which is a USHE proposal in development and not a funded award.",
    source: "site FAQ",
  });

  /* Teaching ------------------------------------------------------------ */
  add({
    topic: "teaching",
    label: "Fall 2026 courses",
    text: `He teaches ${MAJID.fall2026Courses.join("; ")}. Never mention catalog numbers or course codes.`,
    source: "teaching data",
  });
  add({
    topic: "teaching",
    label: MAJID.cs4720r.title,
    text: `${MAJID.cs4720r.tagline}. ${MAJID.cs4720r.summary} ${MAJID.cs4720r.catalog}`,
    source: "teaching data",
  });
  add({
    topic: "teaching",
    label: "University role",
    text: `${MAJID.roles.uvu}. ${MAJID.roles.nvidia}.`,
    source: "site bio",
    url: MAJID.uvuDirectory,
  });

  /* Training ------------------------------------------------------------ */
  const taught = TRAINING_CATALOG.find((option) => option.taught);
  if (taught) {
    add({
      topic: "training",
      label: "The workshop he teaches himself",
      text: `${taught.title}. ${taught.blurb} He teaches it in person as an NVIDIA DLI Certified Instructor.`,
      source: "training catalog",
      url: taught.url,
    });
  }
  add({
    topic: "training",
    label: "What else he can arrange",
    text: `Other NVIDIA Deep Learning Institute generative AI courses from the catalog, ${TRAINING_CATALOG.length - 2} of them beyond the one he teaches, plus customized Gen AI training built around a team's own stack when no standard course is the fit. Only name a title that the recommendWorkshop tool returns.`,
    source: "training catalog",
  });
  add({
    topic: "training",
    label: "How sessions run",
    text: FAQS[3].a,
    source: "site FAQ",
  });

  /* Consulting ---------------------------------------------------------- */
  add({ topic: "consulting", label: "What he does for clients", text: FAQS[0].a, source: "site FAQ" });
  add({ topic: "consulting", label: "A typical engagement", text: FAQS[6].a, source: "site FAQ" });
  add({ topic: "consulting", label: "Stacks he works in", text: FAQS[5].a, source: "site FAQ" });
  add({
    topic: "consulting",
    label: "Privacy and compliance",
    text: FAQS[7].a,
    source: "site FAQ",
  });
  add({
    topic: "consulting",
    label: "Who contracts the work",
    text: `Commercial engagements are contracted through Nexus AI Solutions. Mention it only when the visitor asks who they would sign with; it is not the lead.`,
    source: "site bio",
    url: MAJID.nexusSite,
  });

  /* Internships --------------------------------------------------------- */
  add({ topic: "internships", label: "AI Engineer intern", text: FAQS[4].a, source: "site FAQ" });

  /* Location ------------------------------------------------------------ */
  add({
    topic: "location",
    label: "Where he works",
    text: `Based in ${SITE.addressLocality}, ${SITE.addressRegion}, working with teams anywhere in the ${SITE.serviceArea}, on site at their offices or online. Utah is the home base, never a limit on who he takes on.`,
    source: "site data",
  });

  /* Contact ------------------------------------------------------------- */
  add({
    topic: "contact",
    label: "How to reach him",
    text: `Email ${SITE.email} for anything commercial, or ${SITE.uvuEmail} for university matters. The contact form on this site records a message on the server. For students and academic contacts there is a booking page, which the offerOfficeHours tool shows.`,
    source: "site data",
  });

  /* The assistant itself ------------------------------------------------ */
  add({
    topic: "assistant",
    label: "Models it can run on",
    text: `${CHAT_MODELS.map((m) => `${m.label} by ${m.vendor}`).join(", ")}. The visitor picks one in the widget. The default is ${CHAT_MODELS.find((m) => m.id === DEFAULT_MODEL_ID)?.label ?? DEFAULT_MODEL_ID} and the cheaper fallback is ${CHAT_MODELS.find((m) => m.id === FALLBACK_MODEL_ID)?.label ?? FALLBACK_MODEL_ID}.`,
    source: "model allowlist",
  });
  add({
    topic: "assistant",
    label: "What it costs to run",
    text: `Every reply shows the model, time to first token, total time, the token breakdown including cached and reasoning tokens, and what that reply cost. One visitor is limited to ${RATE_LIMIT_PER_MINUTE} messages a minute and ${usd(IP_DAILY_BUDGET_USD)} of model spend a day. Site-wide, past ${usd(GLOBAL_SOFT_BUDGET_USD)} a day every reply routes to the cheaper model, and past ${usd(GLOBAL_HARD_BUDGET_USD)} the chat closes politely until the next day.`,
    source: "chat limits",
  });
  add({
    topic: "assistant",
    label: "What it can do",
    text: `Ten tools: look up grounded facts from this site, recommend training from the real catalog, draft a consulting brief, score AI readiness, size a project, draft a note the visitor can send to their own team, hand off to ${FOUNDER_CHAT_NAME}, send him a note, email the brief to the visitor, and offer office hours to students. The three sends ask for approval on screen first.`,
    source: "tool list",
  });

  /* Evaluations --------------------------------------------------------- */
  const published = publishedBakeoff();
  if (published) {
    add({
      topic: "evaluations",
      label: "Published model bake-off",
      text: `On ${published.generatedAt.slice(0, 10)} the same ${published.turns}-turn prospect conversation was played through the real prompt on ${published.rows.length} models. ${published.rows
        .map((row) => `${row.label}: ${row.totalMs} ms, ${row.outputTokens} output tokens, $${row.costUsd.toFixed(4)}`)
        .join("; ")}.${judgeSentence(published)}`,
      source: "evals/results/bakeoff-latest.json",
    });
  } else {
    add({
      topic: "evaluations",
      label: "Published model bake-off",
      text: "No bake-off has been published at this version of the site yet. Say exactly that if you are asked for numbers; a score only exists if someone measured it.",
      source: "evals/results/bakeoff-latest.json",
    });
  }
  add({
    topic: "evaluations",
    label: "How the evaluation works",
    text: "A script plays a fixed prospect conversation through the real system prompt on each model through the gateway and records time to first token, total time, tokens, and cost. A second script scores those same replies against a five-part rubric: consults before it sells, specific and honest, sounds like a person, grounded, moves forward. Each reply is scored by a model that did not write it, picked one reply at a time, so a bake-off can race every model on the list and no model ever scores itself. The published table names the judge of each row. A visitor can also start a short scored run from the page, which is one turn rather than the full conversation, so the two sets of numbers are shown separately and never merged.",
    source: "evals",
  });

  return facts;
}

let cached: SiteFact[] | undefined;

/** Built once per instance; the data modules are static. */
export function siteFacts(): SiteFact[] {
  if (!cached) cached = build();
  return cached;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "for", "to", "in", "on", "is", "are", "do", "does",
  "what", "how", "who", "your", "you", "his", "he", "with", "about", "can", "tell", "me",
]);

function tokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

export type FactLookup = {
  topic?: FactTopic;
  query?: string;
  limit?: number;
};

/**
 * Topic filter first, then keyword overlap. Deterministic and small: the
 * result is echoed back to the model on every later turn, so it stays short
 * on purpose.
 */
export function lookupFacts({ topic, query, limit = 4 }: FactLookup): SiteFact[] {
  const pool = topic ? siteFacts().filter((fact) => fact.topic === topic) : siteFacts();
  const words = tokens(query ?? "");
  if (words.length === 0) return pool.slice(0, limit);

  const scored = pool.map((fact) => {
    const haystack = `${fact.label} ${fact.text}`.toLowerCase();
    const score = words.reduce((sum, word) => (haystack.includes(word) ? sum + 1 : sum), 0);
    return { fact, score };
  });
  const hits = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  // Nothing matched inside a named topic still returns that topic; nothing
  // matched with no topic returns nothing, so the model says it does not know.
  if (hits.length === 0) return topic ? pool.slice(0, limit) : [];
  return hits.slice(0, limit).map((s) => s.fact);
}

/**
 * Compact text for the model after the card is shown. Takes the narrowed
 * shape the tool returns, so the tool never has to cast its own output back
 * into a `SiteFact`.
 */
export function factsToText(facts: readonly Pick<SiteFact, "label" | "text">[]): string {
  if (facts.length === 0) {
    return "No grounded fact on this site covers that. Say you do not know rather than guessing, and offer the contact route.";
  }
  return facts.map((fact) => `${fact.label}: ${fact.text}`).join("\n");
}
