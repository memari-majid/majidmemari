import type { Metadata } from "next";

import { normalizeCoursePage } from "@/lib/course-kb/context";
import { CourseAssistant } from "./CourseAssistant";

export const metadata: Metadata = {
  title: "Building AI Solutions — decision lab and AI coach",
  description: "Practice the next decision in twelve guided labs. Investigate evidence, revise your reasoning, and apply it to your project with a course-grounded AI coach.",
  alternates: { canonical: "/teaching/ai-solutions/assistant" },
  robots: { index: false, follow: true },
};

export default async function CourseAssistantPage({ searchParams }: { searchParams: Promise<{ embed?: string; lesson?: string; delivery?: string }> }) {
  const query = await searchParams;
  const canvasDelivery = query.delivery === "canvas";
  const embedded = query.embed === "1" || canvasDelivery;
  const lesson = normalizeCoursePage(query.lesson);
  return <div className={`min-h-dvh text-slate-900 ${canvasDelivery ? "bg-white" : "bg-[#f7f6f2]"}`}><CourseAssistant embedded={embedded} lesson={lesson} canvasDelivery={canvasDelivery} /></div>;
}
