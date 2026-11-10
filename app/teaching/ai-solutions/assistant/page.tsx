import type { Metadata } from "next";
import { NavBar } from "@/app/components/NavBar";
import { CourseAssistant } from "./CourseAssistant";

export const metadata: Metadata = {
  title: "Building AI Solutions — AI teaching assistant",
  description: "Ask about lessons, business decisions, simulations, and your capstone. The AI teaching assistant uses Majid Memari’s course materials and links to its sources.",
  alternates: { canonical: "/teaching/ai-solutions/assistant" },
  robots: { index: false, follow: true },
};

export default function CourseAssistantPage() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900">
      <NavBar />
      <CourseAssistant />
    </div>
  );
}
