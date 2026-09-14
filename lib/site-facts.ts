/**
 * The grounded facts the `lookupSiteFacts` tool may cite.
 *
 * Every entry is derived from a module that already owns the fact: `MAJID`,
 * `SITE`, `FAQS` or `TRAINING_CATALOG`. Never add a fact here that is not in
 * one of them, and never write a number into this file by hand: if a claim
 * has no home in a data module, it does not belong in the assistant's mouth.
 *
 * Nothing here describes the assistant itself: how it is built and what it
 * costs are not facts it shares with visitors (owner decision, 2026-09-13).
 *
 * Every returned string passes through `plainPunctuation()`, because the data
 * modules contain em and en dashes and this text is read aloud by the model.
 *
 * Client-safe: data modules and pure functions.
 */

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
    text: `Email ${SITE.email} for anything commercial, or ${SITE.uvuEmail} for university matters. The contact form on this site records a message on the server. For students and academic contacts there is an office-hours booking page, shown as a card in this chat.`,
    source: "site data",
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
