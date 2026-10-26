// Node 22+: node --test scripts/test-workshop-kb.mjs
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      !/\.(?:js|mjs|cjs|json|node|ts)$/i.test(specifier)
    ) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (!url.endsWith(".ts")) return nextLoad(url, context);
    const source = stripTypeScriptTypes(readFileSync(fileURLToPath(url), "utf8"), {
      mode: "strip",
    });
    return {
      format: "module",
      source,
      shortCircuit: true,
    };
  },
});

await import(new URL("../lib/workshop-kb/workshop-kb.test.ts", import.meta.url).href);
