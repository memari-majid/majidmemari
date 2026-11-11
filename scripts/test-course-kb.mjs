// Node 22+: node --test scripts/test-course-kb.mjs
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!context.parentURL?.includes("/node_modules/") && (specifier.startsWith("./") || specifier.startsWith("../")) && !/\.(?:js|mjs|cjs|json|node|ts)$/i.test(specifier)) return nextResolve(`${specifier}.ts`, context);
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (!url.endsWith(".ts")) return nextLoad(url, context);
    return { format: "module", source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), "utf8"), { mode: "strip" }), shortCircuit: true };
  },
});
await import(new URL("../lib/course-kb/course-kb.test.ts", import.meta.url).href);


// This is a policy/data-consistency guard, not a claim that all model answers
// obey the prompt. Live response verification remains a separate acceptance step.
const { test } = await import("node:test");
const { default: assert } = await import("node:assert/strict");
const { REQUIRED_TEXTBOOKS, buildCourseSystemPrompt } = await import(new URL("../lib/course-kb/prompt.ts", import.meta.url).href);
const { COURSE_CHUNKS } = await import(new URL("../lib/course-kb/generated.ts", import.meta.url).href);
test("textbook inventory matches the assigned reading guide and distinguishes directions from book text", () => {
  const guide = readFileSync(new URL("../public/teaching/ai-solutions/readings.html", import.meta.url), "utf8");
  const titles = REQUIRED_TEXTBOOKS.map(book => book.title);
  assert.equal(titles.length, 3);
  assert.equal(new Set(titles).size, 3);
  assert.deepEqual(REQUIRED_TEXTBOOKS.map(book => book.role), ["AI foundation", "business foundation", "statistics companion"]);
  const prompt = buildCourseSystemPrompt(COURSE_CHUNKS.filter(chunk => chunk.url.includes("unit-01.html")), "unit-01.html", true);
  for (const book of REQUIRED_TEXTBOOKS) {
    assert(guide.includes(book.title), `The public assigned-reading guide must identify ${book.title}`);
    assert(prompt.includes(book.title));
    assert(prompt.includes(book.authors));
  }
  assert(prompt.includes("3 distinct textbook titles"));
  assert(prompt.includes("two sections from one title are one textbook"));
  assert(prompt.includes("course-authored reading directions"));
  assert(prompt.includes("no textbook excerpts or textbook chapters"));
  assert(prompt.includes("identify it as learner-provided"));
  assert(prompt.includes("existing Canvas project update"));
});
