import type { Metadata } from "next";

import { reflectionAllowedForLesson } from "@/lib/course-kb/reflection";
import { normalizeCoursePage } from "@/lib/course-kb/context";
import { CourseAssistant } from "./CourseAssistant";

export const metadata: Metadata = {
  title: "Building AI Solutions — AI Learning Companion",
  description: "Explore ideas, practice decisions and reflect with an AI Learning Companion grounded in the course materials. Work through decision labs, a workflow rehearsal and your own project reasoning.",
  alternates: { canonical: "/teaching/ai-solutions/assistant" },
  robots: { index: false, follow: true },
};

export default async function CourseAssistantPage({ searchParams }: { searchParams: Promise<{ embed?: string; lesson?: string; delivery?: string }> }) {
  const query = await searchParams;
  const canvasDelivery = query.delivery === "canvas";
  const embedded = query.embed === "1" || canvasDelivery;
  const lesson = normalizeCoursePage(query.lesson);
  return <div className={`min-h-dvh text-slate-900 ${canvasDelivery ? "bg-white" : "bg-[#f7f6f2]"}`}><CourseAssistant embedded={embedded} lesson={lesson} canvasDelivery={canvasDelivery} reflectionEnabled={reflectionAllowedForLesson(query.lesson)} /></div>;
}
