"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "What kinds of projects do you take on?",
    a: "Production AI work — LLM-powered apps, agentic workflows, EdTech, simulation training, drone & 3D imaging, and public-sector data systems. I bring student teams into many engagements as part of the mentorship program.",
  },
  {
    q: "How are the NVIDIA workshops structured?",
    a: "I deliver hands-on workshops aligned with NVIDIA Deep Learning Institute standards — GPU-accelerated cloud labs, real-world exercises, and DLI-style certificates of completion. On-campus sessions are free for students at participating universities.",
  },
  {
    q: "How do I apply for the AI Engineer Intern role?",
    a: "Email me with a short note about your background and what you'd like to learn — Python and curiosity are a plus, formal experience is not required. Internships are fully online, on a rolling intake, and there's no cost to students.",
  },
  {
    q: "Can you work with our existing tech stack?",
    a: "Yes. I integrate with AWS, Azure, GCP, on-prem, and hybrid setups. My work spans Python, PyTorch, LangChain, Next.js, n8n, and modern cloud-native architectures.",
  },
  {
    q: "What does a typical engagement look like?",
    a: "We start with a discovery conversation to understand your goals and constraints. From there I propose a phased plan — usually a focused proof-of-concept first, then iteration toward production deployment with ongoing support.",
  },
  {
    q: "How do you handle data privacy and compliance?",
    a: "Security and privacy are core to every engagement. I build with encryption at rest and in transit, role-based access, audit logging, and alignment with frameworks like HIPAA, FERPA, and state data-privacy regulations — especially relevant in my Utah public-sector work.",
  },
];

export function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-zinc-200 dark:divide-zinc-800/60">
      {FAQS.map((faq, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 sm:text-base">
                {faq.q}
              </span>
              <svg
                className={`h-5 w-5 shrink-0 text-sky-600 transition-transform duration-300 dark:text-sky-400 ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[min(28rem,70vh)] pb-5" : "max-h-0"}`}
            >
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{faq.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
