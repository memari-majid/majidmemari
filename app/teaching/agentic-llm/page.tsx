import type { Metadata } from "next";
import { NavBar } from "@/app/components/NavBar";
import { WorkshopAssistant } from "./WorkshopAssistant";

export const metadata: Metadata = {
  title: "AI Workshop Companion",
  description:
    "AI learning companion for the NVIDIA DLI live lab, Building Agentic AI Applications with LLMs.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AgenticLlmTeachingAssistantPage() {
  return (
    <div className="flex h-dvh min-w-0 flex-col overflow-hidden bg-[#f7f6f2] text-slate-900">
      <NavBar />
      <WorkshopAssistant />
    </div>
  );
}
