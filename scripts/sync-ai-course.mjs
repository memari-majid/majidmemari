import { createHash } from "node:crypto";
import { readdir, readFile, mkdir, rm, cp, writeFile, realpath } from "node:fs/promises";
import { dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = resolve(root, "public/teaching/ai-solutions");
const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/sync-ai-course.mjs /path/to/course/site/dist");
const source = await realpath(resolve(input));
if (source === destination || source.startsWith(`${destination}/`)) {
  throw new Error("Source must be the independently built course, outside the destination.");
}

const allowed = new Set([".html", ".css", ".js", ".mjs", ".svg", ".txt", ".zip"]);
const files = [];
async function inspect(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const full = resolve(directory, item.name);
    if (item.isSymbolicLink() || item.name.startsWith(".")) {
      throw new Error(`Refusing hidden file or symlink: ${relative(source, full)}`);
    }
    if (item.isDirectory()) await inspect(full);
    else if (item.isFile() && allowed.has(extname(full))) files.push(full);
    else throw new Error(`Unexpected public file: ${relative(source, full)}`);
  }
}
await inspect(source);
for (const required of ["index.html", "course.html", "assets/site.js", "labs/index.html", "downloads/course-site.zip"]) {
  if (!files.includes(resolve(source, required))) throw new Error(`Missing course output: ${required}`);
}
if (!(await readFile(resolve(source, "index.html"), "utf8")).includes("Building AI Solutions")) {
  throw new Error("Source does not identify the expected course.");
}

const manifest = [];
for (const full of files.sort()) {
  const bytes = await readFile(full);
  manifest.push({ path: relative(source, full), bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
}

// Only this course's generated public directory is replaced after validation.
await mkdir(dirname(destination), { recursive: true });
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
await mkdir(resolve(root, "content"), { recursive: true });
await writeFile(resolve(root, "content/ai-solutions-release.json"), JSON.stringify({
  title: "Building AI Solutions",
  owner: "Majid Memari",
  entry: "/teaching/ai-solutions/index.html",
  files: manifest,
}, null, 2) + "\n");
console.log(`Synced ${manifest.length} verified public course files to public/teaching/ai-solutions.`);
