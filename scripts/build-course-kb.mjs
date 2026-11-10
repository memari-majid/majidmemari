// Build only from the public course snapshot. No private teaching files or network access.
import { readFile, readdir, writeFile, mkdir, lstat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const course = path.join(root, "public/teaching/ai-solutions");
const prefix = "/teaching/ai-solutions/";
const allowed = /^(?:index|resources|project|example|finish|readings|instructor|unit-(?:0[1-9]|1[0-2])|milestone-[1-5])\.html$/;
const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", times: "×", minus: "−", le: "≤", ge: "≥", rarr: "→" };
const decode = text => text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, code) => {
  if (code[0] !== "#") return entities[code.toLowerCase()] ?? match;
  const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
  return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
});
const clean = text => decode(text).replace(/[ \t\r]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m => [m[1], decode(m[2] ?? m[3])]));
const voids = new Set(["br", "hr", "img", "input", "meta", "link", "source", "wbr"]);

// The input is our generated static HTML, not arbitrary fetched documents. Preserve
// main headings, paragraphs, row/cell boundaries and rubrics; omit navigation and notes UI.
export function extractSections(html) {
  const title = clean((html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "Course").replace(/ · Building AI Solutions$/, ""));
  const stack = []; const sections = []; let current = { heading: "Overview", anchor: "main", text: "" }; let heading = false;
  const flush = () => { const body = clean(current.text); if (body) sections.push({ ...current, body }); };
  for (const token of html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) ?? []) {
    if (token.startsWith("<!--")) continue;
    if (!token.startsWith("<")) {
      if (stack.some(x => x.tag === "main") && !stack.some(x => x.skip)) {
        if (heading) current.heading += token; else current.text += token;
      }
      continue;
    }
    const closing = /^<\//.test(token), tag = token.match(/^<\/?([\w-]+)/)?.[1]?.toLowerCase();
    if (!tag) continue;
    if (closing) {
      if (tag === "h2" && heading) { heading = false; current.heading = clean(current.heading); }
      if (stack.some(x => x.tag === "main") && !stack.some(x => x.skip)) {
        if (tag === "td" || tag === "th") current.text += " | ";
        else if (["p", "li", "tr", "h1", "h3", "h4", "summary", "pre", "div"].includes(tag)) current.text += "\n";
      }
      const at = stack.map(x => x.tag).lastIndexOf(tag); if (at >= 0) stack.splice(at);
      continue;
    }
    const a = attrs(token);
    const skip = a["data-kb-skip"] !== undefined || ["script", "style", "nav", "aside", "button", "textarea", "select"].includes(tag) || /(?:^|\s)(?:notes|storage-warning|print-header)(?:\s|$)/.test(a.class ?? "");
    const inMain = stack.some(x => x.tag === "main"), excluded = skip || stack.some(x => x.skip);
    if (inMain && !excluded && tag === "h2") {
      flush(); current = { heading: "", anchor: a.id ?? [...stack].reverse().find(x => x.id)?.id ?? "main", text: "" }; heading = true;
    }
    if (inMain && !excluded && tag === "br") current.text += "\n";
    if (inMain && !excluded && tag === "form" && a["data-explanation"]) current.text += `\nKnowledge-check explanation: ${a["data-explanation"]}\n`;
    if (!voids.has(tag)) stack.push({ tag, id: a.id, skip });
  }
  flush(); return { title, sections };
}

function splitText(text, max = 2800) {
  const output = []; let part = "";
  for (const line of text.split("\n")) {
    if (part.length + line.length + 1 > max && part) { output.push(part); part = ""; }
    // Only unusually long paragraphs need a sentence/word split.
    let rest = line;
    while (rest.length > max) { let cut = rest.lastIndexOf(" ", max); if (cut < max / 2) cut = max; output.push(rest.slice(0, cut)); rest = rest.slice(cut).trim(); }
    part += (part ? "\n" : "") + rest;
  }
  if (part.trim()) output.push(part.trim()); return output;
}

// Read literal simulation definitions with the TypeScript parser, NEVER eval app code.
// Functions/imports/identifiers are ignored. Only the published strings, controls,
// assumptions and formulas become evidence; private or live student data cannot enter.
function literal(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal).filter(x => x !== undefined);
  if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText().replace(/^['"]|['"]$/g, ""), literal(p.initializer)]).filter(([, v]) => v !== undefined));
  if (ts.isCallExpression(node) && node.expression.getText() === "control") return Object.fromEntries(["id", "label", "min", "max", "step", "value", "unit", "hint"].map((key, i) => [key, literal(node.arguments[i])]));
  return undefined;
}
export function extractLabs(source) {
  const ast = ts.createSourceFile("app.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS); let labs = []; let evidence = {};
  const walk = node => {
    if (ts.isVariableDeclaration(node) && node.name.getText() === "labs") labs = literal(node.initializer) ?? [];
    if (ts.isVariableDeclaration(node) && node.name.getText() === "evidenceQuestions") evidence = literal(node.initializer) ?? {};
    if (ts.isCallExpression(node) && node.expression.getText() === "labs.push") labs.push(...node.arguments.map(literal).filter(Boolean));
    ts.forEachChild(node, walk);
  };
  walk(ast); return labs.map(lab => ({ ...lab, evidence: evidence[lab.id] }));
}

export async function buildCourseKB() {
  const files = (await readdir(course)).filter(name => allowed.test(name)).sort();
  if (!files.includes("unit-01.html") || !files.includes("unit-12.html") || !files.includes("milestone-5.html")) throw new Error("Sync the complete public course before building its knowledge base.");
  const hash = createHash("sha256"); const chunks = [];
  const readPublic = async name => { const filename = path.join(course, name); if (!(await lstat(filename)).isFile()) throw new Error(`Expected regular public file: ${name}`); const content = await readFile(filename, "utf8"); hash.update(name + "\0" + content); return content; };
  for (const file of files) {
    const { title, sections } = extractSections(await readPublic(file));
    sections.forEach((section, i) => splitText(section.body).forEach((body, j) => chunks.push({ id: `${file}:${i}:${j}`, page: file, title, section: section.heading, url: prefix + file + (section.anchor ? `#${encodeURIComponent(section.anchor)}` : ""), body })));
  }
  // Required simulation explanations and worked results are authored in the lesson HTML.
  // Hash the interactive model too, but never execute it while building the retrieval corpus.
  await readPublic("assets/practice.js");
  await readPublic("assets/lesson-figures.js");
  const metadata = { sourceDigest: hash.digest("hex"), sourcePages: files.length, simulationCount: 3, practicePages: 5, inlineFigurePages: 6, chunkCount: chunks.length };
  const output = `// Generated by scripts/build-course-kb.mjs from public course files only.\nimport type { CourseChunk } from "./types";\nexport const COURSE_KB_META = ${JSON.stringify(metadata, null, 2)};\nexport const COURSE_CHUNKS: readonly CourseChunk[] = ${JSON.stringify(chunks, null, 2)};\n`;
  await mkdir(path.join(root, "lib/course-kb"), { recursive: true });
  await writeFile(path.join(root, "lib/course-kb/generated.ts"), output);
  return metadata;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await buildCourseKB()));
