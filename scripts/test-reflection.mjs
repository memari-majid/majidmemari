// Node 22+; the same version-matched TypeScript loader used by course-kb tests.
import { registerHooks, stripTypeScriptTypes } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/course-kb/reflection") return nextResolve(new URL("../lib/course-kb/reflection.ts", import.meta.url).href, context);
    if (!context.parentURL?.includes("/node_modules/") && (specifier.startsWith("./") || specifier.startsWith("../")) && !/\.(?:js|mjs|cjs|json|node|ts|tsx)$/i.test(specifier)) {
      const extension = existsSync(fileURLToPath(new URL(`${specifier}.ts`, context.parentURL))) ? ".ts" : ".tsx";
      return nextResolve(`${specifier}${extension}`, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".tsx")) return { format: "module", source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText, shortCircuit: true };
    if (!url.endsWith(".ts")) return nextLoad(url, context);
    return { format: "module", source: stripTypeScriptTypes(readFileSync(fileURLToPath(url), "utf8"), { mode: "strip" }), shortCircuit: true };
  },
});
await import(new URL("../lib/course-kb/reflection.test.ts", import.meta.url).href);
