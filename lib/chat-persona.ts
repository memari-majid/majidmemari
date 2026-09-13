/**
 * Assistant and founder names, defined once.
 *
 * Owner override, 2026-09-13: the assistant is the "AI Consultant" and, inside
 * the chat surface only (the chat system prompt, tool descriptions and hints,
 * card copy, the emails the agent sends), the founder is called "Dr. Memari".
 * Outside the chat, in website copy, metadata, JSON-LD, headings and alt text,
 * he stays "Majid Memari, PhD".
 *
 * Nothing may hardcode these strings in a component, a prompt, a test, or a
 * doc. Never rename by blanket substitution either: the tool keys
 * `handOffToMajid` and `emailMajidNote`, the module `lib/majid.ts`, and the
 * domain majidmemari.com all contain the old string and must not change.
 *
 * PARITY (nexus-website AGENTS.md 9.2, and AGENTS.md here). nexusaisolution.net
 * carries the same module. The SHARED NAMES block below is exported under the
 * same names, in the same order, in both repos, so the two files diff by eye;
 * only the values differ where the sites differ (the badge, the tagline). Add a
 * name to one repo and add it to the other in the same position, even when the
 * value is the same.
 *
 * Client-safe: constants and pure functions, no imports, no env.
 */

/* ---------------------------------------------------------------- *
 * SHARED NAMES. Same export names, same order, in both repos.       *
 * ---------------------------------------------------------------- */

/** The assistant's name, in the chat and in copy about the chat. */
export const ASSISTANT_NAME = "AI Consultant";

/** Sentence form, for lines like "the AI Consultant is an AI". */
export const ASSISTANT_THE = `the ${ASSISTANT_NAME}`;

/** One line under the name, for the launcher and the panel header. */
export const ASSISTANT_TAGLINE = "Ask about consulting, team training, teaching, or internships";

/**
 * Widget badge. It sits beside the assistant name in the panel header, so it
 * must never repeat the word "Consultant". nexusaisolution.net uses "Nexus AI".
 */
export const WIDGET_BADGE = "Majid's AI";

/** The founder, inside the chat surface only. */
export const FOUNDER_CHAT_NAME = "Dr. Memari";

/** Possessive form of the chat name, so no caller has to build it by hand. */
export const FOUNDER_CHAT_POSSESSIVE = `${FOUNDER_CHAT_NAME}'s`;

/** The founder, everywhere else: website copy, metadata, headings, alt text. */
export const FOUNDER_SITE_NAME = "Majid Memari, PhD";

/** The founder without the postnominal, for running prose outside the chat. */
export const FOUNDER_PLAIN_NAME = "Majid Memari";

/* ---------------------------------------------------------------- *
 * SITE-LOCAL. Nothing below is expected to match the other repo.    *
 * ---------------------------------------------------------------- */

/**
 * First person, because this site is his own and never leads with the company.
 * The company site renders its own greeting inside
 * `app/components/chat/ConversationView.tsx`, so this constant has no twin
 * there on purpose.
 */
export const ASSISTANT_INTRO =
  `I am the ${ASSISTANT_NAME} on this site, an AI agent rather than ${FOUNDER_CHAT_NAME} himself. ` +
  "Tell me what you are working on and where you want to go with AI. I give you straight guidance, " +
  "and when it helps I can draft a consulting brief, score your readiness, size a project, and pass " +
  `you to ${FOUNDER_CHAT_NAME}, with your OK first.`;

/** Honest footer line under the composer. */
export const ASSISTANT_DISCLAIMER = `The ${ASSISTANT_NAME} is an AI and can be wrong.`;

/* ---------------------------------------------------------------- *
 * COMPATIBILITY ALIASES. Older names, kept so components that still  *
 * import them keep compiling. Same value, no behaviour change.       *
 * Prefer the shared name above in new code, and drop an alias once    *
 * its last caller is converted.                                      *
 * ---------------------------------------------------------------- */

/**
 * @deprecated Use `WIDGET_BADGE`, the name the company site uses for the same
 * value. Still imported by `app/components/ChatWidget.tsx` and
 * `app/components/chat/InlineAssistantDemo.tsx`, which render the badge twice
 * rather than once inside `ConversationView` as the company site does.
 */
export const ASSISTANT_BADGE = WIDGET_BADGE;

/**
 * @deprecated Use `ASSISTANT_TAGLINE`. Still imported by
 * `app/components/ChatWidget.tsx`.
 */
export const ASSISTANT_BLURB = ASSISTANT_TAGLINE;

/** @deprecated Use `FOUNDER_SITE_NAME`. No caller left in this repo. */
export const FOUNDER_PUBLIC_NAME = FOUNDER_SITE_NAME;
