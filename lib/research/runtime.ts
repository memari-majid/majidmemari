/** Optional live AI roles. Assessment forms/answers never enter either method. */
import { gateway, generateText, Output } from "ai";
import type { ResearchConfig } from "./config";
import type { ResearchDependencies } from "./service";
import { selectResearchQuestion } from "./questions";
import {
  SHIFT_CLASSIFIER_OUTPUT,
  SHIFT_CLASSIFIER_RULES,
  validateShiftClassification,
} from "../course-kb/shift-classifier";
import { validateShiftWorkflow } from "../course-kb/shift-run";
const token = (x: unknown) =>
  typeof x === "number" && Number.isSafeInteger(x) && x >= 0 ? x : null;
export function liveResearchDependencies(
  config: ResearchConfig,
): ResearchDependencies {
  // Synthetic endpoints cannot call an actual provider, even if the app has keys.
  if (config.mode !== "live") return {};
  const modelId = config.manifest.freeze!.modelId;
  return {
    select: (context, signal) =>
      selectResearchQuestion(context, {
        model: gateway(modelId),
        modelId,
        signal,
      }),
    propose: async (workflow) => {
      const steps = validateShiftWorkflow(workflow);
      const result = await generateText({
        model: gateway(modelId),
        system: SHIFT_CLASSIFIER_RULES,
        prompt: JSON.stringify({ steps }),
        output: Output.object({ schema: SHIFT_CLASSIFIER_OUTPUT }),
        maxOutputTokens: 5500,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(30000),
        experimental_telemetry: {
          isEnabled: false,
          recordInputs: false,
          recordOutputs: false,
        },
        providerOptions: {
          gateway: {
            tags: ["feature:reviewed-research-workflow-interpretation"],
          },
        },
      });
      const mapping = validateShiftClassification(result.output, steps);
      return {
        mapping,
        classifiedBy: "ai",
        modelId,
        usage: {
          inputTokens: token(result.usage.inputTokens),
          outputTokens: token(result.usage.outputTokens),
          totalTokens: token(result.usage.totalTokens),
        },
      };
    },
  };
}
