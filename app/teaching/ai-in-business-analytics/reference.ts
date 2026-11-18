import type { Metadata } from "next";
import {
  analyticsBasePath,
  analyticsDocuments,
  getAnalyticsDocument,
} from "@/lib/business-analytics";

export type Guide = {
  label: string;
  href: string;
  description: string;
};

export type GuideGroup = {
  title: string;
  guides: Guide[];
};

function guide(path: string, label: string, description: string): Guide {
  const document = getAnalyticsDocument(path.split("/"));
  if (!document) {
    throw new Error("Missing analytics guide " + path);
  }
  return { label, href: document.href, description };
}

export const guideGroups: GuideGroup[] = [
  {
    title: "Research and evidence",
    guides: [
      guide("resources/state_of_the_art", "State of the art", "What’s established and where the evidence is still developing."),
      guide("resources/research", "Research guide", "Landmark papers, study design, findings, and limitations."),
      guide("resources/references", "References", "Full citations and publication status."),
    ],
  },
  {
    title: "Methods and applications",
    guides: [
      guide("resources/analytics_methods", "Analytics methods", "Prediction, forecasting, causal inference, optimization, and agents."),
      guide("resources/business_applications", "Applied research", "Evidence from marketing, sales, operations, finance, and service."),
      guide("learning/field_map", "Business function map", "Common decisions, pitfalls, and examples by team."),
      guide("resources/frameworks", "Theories and frameworks", "Ideas that shape research and practice."),
    ],
  },
  {
    title: "Teaching and practice",
    guides: [
      guide("resources/datasets", "Datasets and benchmarks", "Public data and evaluation tasks organized by decision."),
      guide("learning/analytics_studio", "Studio cases and rubric", "Six business exercises with a shared assessment rubric."),
      guide("labs/readme", "Runnable labs", "Work through campaign lift, inventory, and grounded answers."),
      guide("learning/teaching_map", "Business-school teaching map", "Examples from business-school curricula and capstones."),
    ],
  },
  {
    title: "Field orientation",
    guides: [
      guide("learning/field_primer", "Field primer for scientists", "How scientific training translates into business analytics."),
      guide("learning/topic_index", "Topic index", "Find a method, question, or business problem."),
      guide("learning/glossary", "Glossary", "Definitions and formulas for common business metrics."),
    ],
  },
  {
    title: "Books and courses",
    guides: [
      guide("resources/recent_resources", "Recent resources", "Selected books, courses, and project briefs from 2025 onward."),
      guide("resources/books", "Books", "Texts and chapters for learning, reference, or teaching."),
      guide("resources/courses", "Courses", "Syllabi, lectures, assignments, and access details."),
      guide("resources/online", "Online resources", "Cases, practice guides, and places to follow new work."),
    ],
  },
  {
    title: "People and journals",
    guides: [
      guide("resources/people", "People", "Researchers and practitioners to follow by topic."),
      guide("resources/journals", "Journals", "Find publication venues by field and research question."),
    ],
  },
];

export const decisionMap = [
  ["Measure", "What happened?", "Data and business intelligence", "learning/topic_index", "data-measurement-and-bi"],
  ["Predict", "What is likely to happen?", "Forecasting", "resources/analytics_methods", "forecasting"],
  ["Test", "What will change if we act?", "Causal inference and experiments", "resources/analytics_methods", "causal-machine-learning-and-experimentation"],
  ["Decide", "Which action should we take?", "Prescriptive analytics and optimization", "resources/analytics_methods", "prescriptive-analytics-and-optimization"],
  ["Verify", "Can we trust the result?", "Analytics agents and text-to-SQL", "resources/analytics_methods", "analytics-agents-and-text-to-sql"],
].map(([label, question, method, path, anchor]) => ({
  label,
  question,
  method,
  href: guide(path, label, question).href + "#" + anchor,
}));

export const overviewDocument = analyticsDocuments.find((document) => document.sourcePath === "README.md");

export const referenceTitle = "AI in Business Analytics";
export const referenceDescription = "A field reference for AI scientists and business-school instructors.";

export function referenceMetadata(title: string, description: string, path: string): Metadata {
  const image = {
    url: analyticsBasePath + "/opengraph-image",
    width: 1200,
    height: 630,
    alt: referenceTitle + " by Majid Memari",
  };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      siteName: "Majid Memari",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
