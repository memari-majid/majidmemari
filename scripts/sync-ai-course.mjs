import { createHash } from "node:crypto";
import { readdir, readFile, mkdir, rm, writeFile, realpath } from "node:fs/promises";
import { dirname, resolve, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destination = resolve(root, "public/teaching/ai-solutions");
const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/sync-ai-course.mjs /path/to/course/site/dist");
const source = await realpath(resolve(input));
if (source === destination || source.startsWith(`${destination}/`)) {
  throw new Error("Source must be the independently built course, outside the destination.");
}

const allowed = new Set([".html", ".css", ".js", ".mjs", ".svg", ".txt", ".zip", ".json"]);
const sourceTitle = "Building AI Solutions";
const publicTitle = "AI Solution Studio";
const titleReplacements = [[sourceTitle, publicTitle], [sourceTitle.toUpperCase(), publicTitle.toUpperCase()]];
const assistantUrl = "https://www.majidmemari.com/teaching/ai-solutions/assistant";
const assistantPath = "/teaching/ai-solutions/assistant";
const portableArchive = "downloads/course-site.zip";
const exportAssets = ["assets/practice.js", "assets/workbook.js"];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const displaysTitle = (path) => [".html", ".txt"].includes(extname(path)) || exportAssets.includes(path);
const replaceText = (text, replacements) => replacements.reduce((result, [before, after]) => result.replaceAll(before, after), text);
const files = [];
async function inspect(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const full = resolve(directory, item.name);
    if (item.isSymbolicLink() || item.name.startsWith(".")) {
      throw new Error(`Refusing hidden file or symlink: ${relative(source, full)}`);
    }
    if (item.isDirectory()) await inspect(full);
    else if (item.isFile() && allowed.has(extname(full)) && (extname(full) !== ".json" || relative(source, full) === "assets/ta-activities.json")) files.push(full);
    else throw new Error(`Unexpected public file: ${relative(source, full)}`);
  }
}
await inspect(source);
for (const required of ["index.html", "unit-01.html", "unit-12.html", "milestone-5.html", "assets/site.js", "assets/practice.css", portableArchive, ...exportAssets]) {
  if (!files.includes(resolve(source, required))) throw new Error(`Missing course output: ${required}`);
}
const index = await readFile(resolve(source, "index.html"), "utf8");
if (![sourceTitle, publicTitle].some((title) => index.includes(title))) {
  throw new Error("Source does not identify the expected course.");
}

const originals = new Map();
const portableFiles = new Map();
for (const full of files.sort()) {
  const path = relative(source, full);
  const original = await readFile(full);
  originals.set(path, original);
  portableFiles.set(path, displaysTitle(path)
    ? Buffer.from(replaceText(original.toString("utf8"), titleReplacements))
    : original);
}

// The display title appears in practice and workbook exports. Their storage keys
// stay intact. Refresh only the cache keys of the changed assets.
const assetVersions = exportAssets.map((path) => [
  `${path}?v=${hash(originals.get(path)).slice(0, 12)}`,
  `${path}?v=${hash(portableFiles.get(path)).slice(0, 12)}`,
]);
for (const [path, bytes] of portableFiles) {
  if (extname(path) !== ".html") continue;
  portableFiles.set(path, Buffer.from(replaceText(bytes.toString("utf8"), assetVersions)));
}

// Keep the existing portable package structure and links while refreshing the
// same display text and asset versions. Python is also used for the source build.
const replacements = Object.fromEntries([...originals.keys()].filter(displaysTitle).map(
  (path) => [path, extname(path) === ".html" ? [...titleReplacements, ...assetVersions] : titleReplacements],
));
const archiveBytes = execFileSync("python3", ["-c", `
from io import BytesIO
import json
import sys
from zipfile import ZipFile

paths, replacements = json.load(sys.stdin)
output = BytesIO()
with ZipFile(sys.argv[1]) as source, ZipFile(output, "w") as target:
    entries = source.infolist()
    names = {entry.filename for entry in entries}
    if len(names) != len(entries) or names != set(paths):
        raise ValueError("Portable archive does not match the public course file list.")
    target.comment = source.comment
    for entry in entries:
        data = source.read(entry)
        for before, after in replacements.get(entry.filename, []):
            data = data.replace(before.encode(), after.encode())
        target.writestr(entry, data)
sys.stdout.buffer.write(output.getvalue())
`, resolve(source, portableArchive)], {
  input: JSON.stringify([[...originals.keys()].filter((path) => path !== portableArchive), replacements]),
  maxBuffer: 16 * 1024 * 1024,
});
portableFiles.set(portableArchive, archiveBytes);

const hostedFiles = new Map();
for (const [path, portableBytes] of portableFiles) {
  // Keep the portable archive's absolute online link, but use this deployment
  // for course pages so previews and production share the same assistant.
  const bytes = extname(path) === ".html"
    ? Buffer.from(portableBytes.toString("utf8").replaceAll(assistantUrl, assistantPath))
    : portableBytes;
  hostedFiles.set(path, bytes);
}

// Only this course's generated public directory is replaced after validation.
await rm(destination, { recursive: true, force: true });
for (const [path, bytes] of hostedFiles) {
  const full = resolve(destination, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, bytes);
}
const manifest = [...hostedFiles].map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: hash(bytes) }));
await mkdir(resolve(root, "content"), { recursive: true });
await writeFile(resolve(root, "content/ai-solutions-release.json"), JSON.stringify({
  title: publicTitle,
  owner: "Majid Memari",
  entry: "/teaching/ai-solutions/index.html",
  files: manifest,
}, null, 2) + "\n");
console.log(`Synced ${manifest.length} verified public course files to public/teaching/ai-solutions.`);
execFileSync(process.execPath, [resolve(root, "scripts/build-course-kb.mjs")], { cwd: root, stdio: "inherit" });
