import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = resolve(process.argv[2] ?? resolve(root, "../business-ai-analytics"));
const destination = resolve(root, "content/business-analytics/snapshot.json");
const repository = "https://github.com/memari-majid/business-ai-analytics";
const branch = "main";
const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

function git(...args) {
  return execFileSync("git", ["-C", source, ...args], { maxBuffer: 4 * 1024 * 1024 });
}

const remote = git("remote", "get-url", "origin").toString().trim();
const expectedRemote = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)memari-majid\/business-ai-analytics(?:\.git)?\/?$/;
if (!expectedRemote.test(remote)) {
  throw new Error("The source checkout must point to memari-majid/business-ai-analytics.");
}

const commit = git("rev-parse", "HEAD").toString().trim();
// Anonymous access establishes that the checked-out commit is the public branch tip.
const response = await fetch(
  "https://api.github.com/repos/memari-majid/business-ai-analytics/git/ref/heads/main",
  {
    headers: { "Accept": "application/vnd.github+json", "User-Agent": "business-analytics-snapshot" },
    signal: AbortSignal.timeout(15_000),
  },
);
if (!response.ok) {
  throw new Error(`Could not verify the public main branch on GitHub (HTTP ${response.status}).`);
}
const remoteRef = await response.json();
if (remoteRef.object?.sha !== commit) {
  throw new Error("Update the source checkout to the published main commit before syncing.");
}

const include = /^(?:README\.md|labs\/README\.md|(?:learning|resources)\/[A-Za-z0-9_-]+\.md)$/;
const entries = git("ls-tree", "--full-tree", "-r", "-z", commit).toString().split("\0").filter(Boolean);
const documents = [];
const paths = new Set();

for (const entry of entries) {
  const separator = entry.indexOf("\t");
  const path = entry.slice(separator + 1);
  if (!include.test(path)) continue;

  const [mode, type, object] = entry.slice(0, separator).split(" ");
  if (type !== "blob" || !["100644", "100755"].includes(mode)) {
    throw new Error(`Expected a regular file at ${path}.`);
  }
  const key = path.toLowerCase();
  if (paths.has(key)) throw new Error(`Conflicting document route for ${path}.`);
  paths.add(key);

  // Read the committed object so worktree or ignored content cannot enter the release.
  const bytes = git("cat-file", "blob", object);
  const markdown = decoder.decode(bytes);
  const title = /^\uFEFF?# ([^\r\n]+)$/m.exec(markdown)?.[1].trim();
  if (!title) throw new Error(`Missing document title in ${path}.`);
  documents.push({
    path,
    title,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    markdown,
  });
}

if (
  !paths.has("readme.md")
  || !paths.has("labs/readme.md")
  || !documents.some(({ path }) => path.startsWith("learning/"))
  || !documents.some(({ path }) => path.startsWith("resources/"))
) {
  throw new Error("The snapshot is missing an expected public document group.");
}

const snapshot = JSON.stringify({ repository, branch, commit, documents }, null, 2) + "\n";
const existing = await readFile(destination, "utf8").catch((error) => {
  if (error.code !== "ENOENT") throw error;
  return undefined;
});

if (existing !== snapshot) {
  await mkdir(dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  try {
    await writeFile(temporary, snapshot, { flag: "wx" });
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
}

console.log(`Verified ${documents.length} public analytics documents at ${commit.slice(0, 7)}.`);
