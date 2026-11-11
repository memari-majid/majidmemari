import type { Metadata } from "next";

import { normalizeCoursePage } from "@/lib/course-kb/context";
import { CourseAssistant } from "./CourseAssistant";

export const metadata: Metadata = {
  title: "Building AI Solutions — AI teaching assistant",
  description: "Ask about AI capabilities, real-world problem-solving, simulations, and your capstone. The AI teaching assistant uses Majid Memari’s course materials and links to its sources.",
  alternates: { canonical: "/teaching/ai-solutions/assistant" },
  robots: { index: false, follow: true },
};

export default async function CourseAssistantPage({ searchParams }: { searchParams: Promise<{ embed?: string; lesson?: string; delivery?: string }> }) {
  const query = await searchParams;
  const canvasDelivery = query.delivery === "canvas";
  const embedded = query.embed === "1" || canvasDelivery;
  const lesson = normalizeCoursePage(query.lesson);
  return <div className={`min-h-dvh text-zinc-900 ${canvasDelivery ? "bg-white" : "bg-zinc-50"}`}><CourseAssistant embedded={embedded} lesson={lesson} canvasDelivery={canvasDelivery} /></div>;
}
