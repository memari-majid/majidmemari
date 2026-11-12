// Node 22+; the same version-matched TypeScript loader used by course-kb tests.
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
await import(new URL("../lib/course-kb/shift-classifier.test.ts", import.meta.url).href);
await import(new URL("../lib/course-kb/shift-run.test.ts", import.meta.url).href);
