/**
 * The training the assistant is allowed to name, and the deterministic
 * needs-to-workshop match behind `recommendWorkshop`.
 *
 * Every NVIDIA title and URL here is a real Deep Learning Institute course,
 * last verified 2026-09-12 against the same list the company site publishes.
 * The model never invents a title: it passes what the visitor said, and this
 * module returns the pick. `taught` marks the one workshop he teaches himself
 * as a Certified Instructor; the rest are courses he can arrange. `custom` is
 * the non-catalog option, because the practice is not limited to NVIDIA's
 * courses.
 *
 * No prices anywhere: commercial terms are quoted by a human, never by the
 * assistant.
 *
 * Client-safe: data and pure functions.
 */

export type TrainingOption = {
  key: string;
  title: string;
  /** Empty for the customized option, which has no catalog page. */
  url: string;
  blurb: string;
  track: "instructor-led" | "self-paced" | "custom";
  /** True only for the workshop he teaches in person himself. */
  taught?: boolean;
  /** Lowercase intent signals matched against what the visitor said. */
  keywords: readonly string[];
};

export const TRAINING_CATALOG: readonly TrainingOption[] = [
  {
    key: "agentic-llm",
    title: "Building Agentic AI Applications With LLMs",
    url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1%3ADLI+C-FX-25+V1",
    blurb:
      "Agents that retrieve and refine information, route queries, and run tasks concurrently, with NVIDIA NIM, LangChain, and LangGraph. Eight hours, hands-on, instructor-led.",
    track: "instructor-led",
    taught: true,
    keywords: ["agent", "agentic", "llm app", "langgraph", "langchain", "tool use", "multi-agent", "nim"],
  },
  {
    key: "multimodal-agents",
    title: "Building AI Agents With Multimodal Models",
    url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1%3ADLI+C-FX-17+V1",
    blurb: "Agents that reason over text and visual inputs using multimodal models. Instructor-led.",
    track: "instructor-led",
    keywords: ["multimodal", "image", "vision", "video", "document", "ocr", "scan"],
  },
  {
    key: "add-knowledge",
    title: "Adding New Knowledge to LLMs",
    url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1%3ADLI+C-FX-26+V1",
    blurb:
      "Raw data through to a fine-tuned, optimized model with NeMo Curator, continued pretraining, SFT, DPO, and quantization. Instructor-led.",
    track: "instructor-led",
    keywords: [
      "fine-tune",
      "fine tuning",
      "finetune",
      "pretraining",
      "sft",
      "dpo",
      "nemo",
      "customize the model",
      "quantization",
      "distillation",
    ],
  },
  {
    key: "rag-agents",
    title: "Building RAG Agents With LLMs",
    url: "https://courses.nvidia.com/courses/course-v1%3ADLI+S-FX-15+V1/",
    blurb:
      "Retrieval-augmented generation with advanced LLM composition, dialog management, and tooling. Self-paced.",
    track: "self-paced",
    keywords: ["rag", "retrieval", "augmented", "knowledge base", "embedding", "vector", "grounding", "our docs", "sop"],
  },
  {
    key: "eval-rag",
    title: "Evaluating RAG and Semantic Search Systems",
    url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1%3ADLI+S-FX-32+V1",
    blurb: "Measuring and improving the quality of RAG and semantic search pipelines. Self-paced.",
    track: "self-paced",
    keywords: ["evaluation", "eval", "quality", "semantic search", "benchmark", "metrics", "accuracy", "hallucination"],
  },
  {
    key: "deploy-rag-scale",
    title: "Deploying RAG Pipelines for Production at Scale",
    url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1%3ADLI+C-FX-18+V1",
    blurb: "Operating production-grade RAG pipelines at scale. Instructor-led.",
    track: "instructor-led",
    keywords: ["deploy", "production", "scale", "latency", "throughput", "serving", "inference", "cost per query"],
  },
  {
    key: "prompt-engineering",
    title: "Building LLM Applications With Prompt Engineering",
    url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1%3ADLI+S-FX-12+V2",
    blurb: "Building LLM-powered applications with prompt-engineering techniques. Self-paced.",
    track: "self-paced",
    keywords: ["prompt", "prompt engineering", "few-shot", "instructions", "chatgpt"],
  },
  {
    key: "conversational-ai",
    title: "Building Conversational AI Applications",
    url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1%3ADLI+C-FX-06+V2",
    blurb: "Conversational AI and dialog applications powered by LLMs. Instructor-led.",
    track: "instructor-led",
    keywords: ["conversational", "chatbot", "chat", "dialog", "voice", "assistant", "support", "helpdesk"],
  },
  {
    key: "diffusion",
    title: "Generative AI With Diffusion Models",
    url: "https://courses.nvidia.com/courses/course-v1%3ADLI+S-FX-14+V1/",
    blurb: "Building and training diffusion models for image and data generation. Self-paced.",
    track: "self-paced",
    keywords: ["diffusion", "image generation", "images", "generative art", "stable diffusion"],
  },
  {
    key: "genai-explained",
    title: "Generative AI Explained",
    url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1%3ADLI+S-FX-07+V1",
    blurb: "A non-technical overview of generative AI concepts and applications. Self-paced.",
    track: "self-paced",
    keywords: ["intro", "overview", "explained", "beginner", "non-technical", "leadership", "executive", "board", "getting started"],
  },
  {
    key: "rapid-app-dev",
    title: "Rapid Application Development Using Large Language Models",
    url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1%3ADLI+S-FX-26+V1",
    blurb:
      "Practical LLM application development across the open-source ecosystem, from pretrained models to a working app. Self-paced.",
    track: "self-paced",
    keywords: ["rapid", "application development", "prototype", "mvp", "open-source", "build an app", "ship"],
  },
  {
    key: "intro-deploy-rag",
    title: "Introduction to Deploying RAG Pipelines for Production at Scale",
    url: "https://learn.nvidia.com/courses/course-detail?course_id=course-v1%3ADLI+S-FX-19+V1",
    blurb: "Taking a RAG pipeline from prototype toward production. Self-paced.",
    track: "self-paced",
    keywords: ["pilot to production", "pipeline", "intro", "first deployment"],
  },
  {
    key: "custom",
    title: "Customized Gen AI training for your team",
    url: "",
    blurb:
      "A session built around your team's own stack, data, and workflow when no standard course is the right fit. Half day, full day, or a short series, on site or online.",
    track: "custom",
    keywords: ["custom", "customized", "bespoke", "our stack", "our data", "our workflow", "internal", "tailored", "in-house"],
  },
] as const;

export type TrainingRecommendation = {
  option: TrainingOption;
  why: string;
  /** True when this is the workshop he teaches himself. */
  taught: boolean;
  alternatives: TrainingOption[];
};

export type RecommendInput = {
  role?: string;
  need?: string;
  level?: string;
  text?: string;
};

function scoreOf(option: TrainingOption, haystack: string): number {
  return option.keywords.reduce((score, k) => (haystack.includes(k) ? score + 1 : score), 0);
}

function reasonFor(option: TrainingOption): string {
  if (option.taught) return `${option.title} is the workshop I teach in person myself. ${option.blurb}`;
  if (option.track === "custom") return `${option.title}. ${option.blurb}`;
  return `${option.title} is the closest fit in the catalog. ${option.blurb} I can arrange it for your team.`;
}

/**
 * Deterministic keyword match, best first, ties broken toward the workshop he
 * teaches himself. Nothing matched means nothing was said that points at a
 * course, so the flagship leads and the model still has to phrase the pitch.
 */
export function recommendTraining(
  input: RecommendInput,
  catalog: readonly TrainingOption[] = TRAINING_CATALOG,
): TrainingRecommendation {
  const haystack = [input.role, input.need, input.level, input.text]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const scored = catalog.map((option) => ({ option, score: scoreOf(option, haystack) }));
  const maxScore = scored.reduce((max, s) => Math.max(max, s.score), 0);

  let option: TrainingOption;
  if (maxScore === 0) {
    option = catalog.find((o) => o.taught) ?? catalog[0];
  } else {
    const top = scored.filter((s) => s.score === maxScore);
    option = (top.find((s) => s.option.taught) ?? top[0]).option;
  }

  const alternatives = scored
    .filter((s) => s.option.key !== option.key)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.option);

  return { option, why: reasonFor(option), taught: Boolean(option.taught), alternatives };
}

/** One line for the model after the card is shown, so it does not repeat the card. */
export function recommendationToText(rec: TrainingRecommendation): string {
  const alts = rec.alternatives.map((a) => a.title).join("; ");
  return `${rec.why}${alts ? ` Alternatives shown: ${alts}.` : ""}`;
}
