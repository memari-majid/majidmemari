import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AiNowStrip } from "@/app/components/AiNowStrip";
import { AiChatbotShowcase } from "@/app/components/AiChatbotShowcase";
import { AnimatedCounter } from "@/app/components/AnimatedCounter";
import { ContactForm } from "@/app/components/ContactForm";
import { FaqAccordion } from "@/app/components/FaqAccordion";
import { Reveal } from "@/app/components/Reveal";
import { ScrollToTop } from "@/app/components/ScrollToTop";
import { CollaborationHighlights } from "@/app/components/Testimonials";
import { LogoStrip } from "@/app/components/LogoStrip";
import { NewsletterForm } from "@/app/components/NewsletterForm";
import { BioCategories } from "@/app/components/BioCategories";
import { PartnersStrip } from "@/app/components/PartnersStrip";
import { SITE } from "@/lib/site";
import { MAJID } from "@/lib/majid";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const STATS = [
  { value: 6, suffix: "", label: "Active flagship projects" },
  { value: 8, suffix: "+", label: "AI courses & DLI workshops" },
  { value: 20, suffix: "+", label: "Student researchers mentored" },
  { value: 4, suffix: "", label: "Fall 2026 UVU courses" },
];

const PROJECTS = [
  {
    title: "DataGovAI",
    tagline: "Utah data governance & public-sector AI",
    description:
      "Multi-agent RAG for government data-retention compliance, developed with the Gary R. Herbert Institute for Public Policy and Utah agencies. Published at IETC 2026 with UVU student co-authors. Privacy-preserving evaluation so agencies can measure accuracy without exposing the sensitive records used to test the system.",
    icon: "gov",
    requestAccess: true,
  },
  {
    title: "AI-ClassSims",
    tagline: "Classroom simulation for teacher prep",
    description:
      "Multi-agent LLM platform for preservice STEM teacher training — AI student personas, classroom scenarios, and real-time feedback. GEL-funded collaboration with UVU's School of Education (IETC 2026).",
    icon: "shield",
  },
  {
    title: "AI-STER",
    tagline: "AI-assisted teaching evaluation",
    description:
      "AI-assisted rubric for student-teaching evaluation — faster, more consistent feedback while preserving instructor expertise. GEL-funded work with Krista Ruggles, published at SITE 2026.",
    icon: "grad",
  },
  {
    title: "Wind-turbine & drone inspection",
    tagline: "RGB + thermal computer vision",
    description:
      "Published research on drone RGB/thermal inspection of wind-turbine blades — data fusion, ensemble learning, and infrared NDT in IEEE Access, Energies, Machines, and Drones. Continues UVU postdoctoral work in applied computer vision.",
    icon: "drone",
  },
  {
    title: "The Capability Ladder",
    tagline: "Curriculum and workforce readiness",
    description:
      "A five-level framework for modernizing computing curricula as AI changes the work: trigger, automation, workflow, AI agent, and agent team. With George Rudolph; arXiv:2608.07779 (2026).",
    icon: "grad",
  },
  {
    title: "GridEye",
    tagline: "Aerial inspection of the electrical grid",
    description:
      "AI-driven aerial inspection and predictive maintenance for electrical-grid infrastructure. Collaboration with the University of Utah (U-Smart), UVU ECE, and PacifiCorp — IEEE Access review and a joint USHE proposal in development.",
    icon: "pipeline",
  },
  {
    title: "Privacy-preserving synthetic data",
    tagline: "Safe data for research & policy",
    description:
      "CTGAN / tabular-diffusion pipelines with differential privacy so researchers can study statewide health-claims patterns without using real patient records — a Herbert Institute collaboration with Utah DHHS.",
    icon: "heart",
    requestAccess: true,
  },
  {
    title: "Agentic Workflow Automation",
    tagline: "End-to-end intelligent ops",
    description:
      "Multi-agent systems that coordinate specialist models and tools to automate complex business processes with human oversight.",
    icon: "cog",
  },
  {
    title: "AI Financial Assistant",
    tagline: "Bookkeeping & business finance",
    description:
      "An AI assistant for bookkeeping workflows, organized records, and everyday finance questions — built for clarity. Not a substitute for licensed tax, legal, or investment professionals.",
    icon: "ledger",
  },
  {
    title: "Custom AI Solutions",
    tagline: "Built for your domain",
    description:
      "Computer vision, forecasting, NLP for compliance, RAG over internal docs — if it needs AI, I design and ship it.",
    icon: "spark",
  },
];

const UVU_COURSES = [
  {
    code: "CS 4720R",
    title: "AI Business and Tech Solutions",
    term: "Fall 2026 · in-person",
    blurb: "Real client projects for students with little or no prior AI experience — applied tools, portfolio deliverables, and industry-facing work.",
  },
  {
    code: "CS 6470",
    title: "Machine Learning",
    term: "Fall 2026 · online (MS-AAI)",
    blurb: "Graduate machine learning for UVU's applied-AI track — supervised and unsupervised methods, evaluation, and project work.",
  },
  {
    code: "CS-2700",
    title: "Causal Inference",
    term: "Fall 2026 · online",
    blurb: "Applied causal reasoning and data-science practice, redesigned around hands-on analysis rather than theory alone.",
  },
  {
    code: "CS-1400",
    title: "Fundamentals of Programming",
    term: "Fall 2026 · online",
    blurb: "Introductory programming with current applied-AI tooling and hands-on labs in a coordinated multi-section course.",
  },
];

const FEATURED_PROJECT_TITLES = [
  "DataGovAI",
  "AI-ClassSims",
  "AI-STER",
  "Wind-turbine & drone inspection",
  "GridEye",
  "Privacy-preserving synthetic data",
] as const;

const FEATURED_PROJECTS = FEATURED_PROJECT_TITLES.map((title) => {
  const project = PROJECTS.find((p) => p.title === title);
  if (!project) throw new Error(`Missing featured project: ${title}`);
  return project;
});

const WORKSHOPS = [
  {
    title: "Building Agentic AI Applications with LLMs",
    duration: "NVIDIA DLI · certified instructor",
    blurb:
      "The workshop that led to my NVIDIA University Ambassador designation — multi-agent patterns, tool use, and GPU-accelerated labs. Delivered on campus for ~30 UVU students.",
  },
  {
    title: "Fundamentals of Deep Learning",
    duration: "~8 hours (typical DLI workshop)",
    blurb:
      "Train neural networks for classification and detection with hands-on PyTorch labs on GPU-accelerated cloud instances.",
  },
  {
    title: "RAG & LLM Agents",
    duration: "Applied GenAI",
    blurb:
      "Retrieval-augmented generation, prompt patterns, and safe deployment of LLM-powered assistants.",
  },
  {
    title: "Generative AI",
    duration: "Foundations",
    blurb:
      "Diffusion and generative fundamentals with practical exercises — aligned with industry demand.",
  },
];

const TECH_LOGOS = [
  { name: "NVIDIA", src: "/logos/nvidia.svg" },
  { name: "OpenAI", src: "/logos/openai.svg" },
  { name: "PyTorch", src: "/logos/pytorch.svg" },
  { name: "LangChain", src: "/logos/langchain.svg" },
  { name: "Python", src: "/logos/python.svg" },
  { name: "Next.js", src: "/logos/nextjs.svg" },
  { name: "AWS", src: "/logos/aws.svg" },
  { name: "Microsoft Azure", src: "/logos/azure.svg" },
  { name: "Docker", src: "/logos/docker.svg" },
  { name: "Kubernetes", src: "/logos/kubernetes.svg" },
  { name: "n8n", src: "/logos/n8n.svg" },
  { name: "PostgreSQL", src: "/logos/postgresql.svg" },
  { name: "Vercel", src: "/logos/vercel.svg" },
];

const FOOTER_LINKS = [
  { label: "About", href: "/about" },
  { label: "Work", href: "/#work" },
  { label: "Partners", href: "/#partners" },
  { label: "Teaching", href: "/teaching" },
  { label: "Publications", href: "/publications" },
  { label: "Mentorship", href: "/#mentorship" },
  { label: "Contact", href: "/#contact" },
];

const GOVERNMENT_HIGHLIGHTS = [
  {
    title: "Utah Office of Data Privacy",
    text: "AI applied to data governance and privacy management — improving compliance efficiency and strengthening transparency and public trust.",
  },
  {
    title: "Utah Department of Health & Human Services",
    text: "AI-driven solutions that reduce manual review time and expand secure access to data for research and policy innovation.",
  },
  {
    title: "Privacy-preserving infrastructure",
    text: "Helping Utah build a modern, responsible data foundation that supports research while safeguarding citizens.",
  },
  {
    title: "Expanding across departments",
    text: "Building additional AI solutions for more Utah departments — intelligent automation and data-driven decision-making at scale.",
  },
] as const;

const ROLES = [
  {
    org: "NVIDIA",
    title: "Ambassador & DLI Instructor",
    period: "Nov 2025 — Present",
    description:
      "Delivers free hands-on workshops on agentic AI, GPU computing, and applied ML — open to students, faculty, and industry partners.",
    icon: "nvidia",
  },
  {
    org: "Utah Valley University",
    title: "Assistant Professor",
    period: "Jul 2024 — Present",
    description:
      "Teaches applied AI, machine learning, causal inference, and LLMs; designs new courses each term and mentors student teams on funded research.",
    icon: "uvu",
  },
  {
    org: "University of Utah — One-U RAI",
    title: "AI Consultant, AI Policy SIG",
    period: "Jan 2025 — Present",
    description:
      "Shapes responsible AI strategy across healthcare, education, government, and commercial sectors — bringing student perspectives into policy discussions.",
    icon: "uou",
  },
  {
    org: "Gary R. Herbert Institute for Public Policy",
    title: "Principal AI Architect",
    period: "Nov 2024 — Present",
    description:
      "Leads DataGovAI and privacy-preserving synthetic-data work with Utah agencies; students contribute on the same projects.",
    icon: "herbert",
  },
  {
    org: "Nexus AI Solutions LLC",
    title: "Founder & Principal AI Architect",
    period: "Present",
    description:
      "AI consulting and team training for organizations — advisory work, workshops, and in-house sessions. Implementation is available as a follow-on statement of work.",
    icon: "spark",
  },
] as const;

const NVIDIA_TRAINING_URL = "https://www.nvidia.com/en-us/training/";

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function ProjectIcon({ kind }: { kind: string }) {
  const map: Record<string, ReactNode> = {
    grad: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
      </svg>
    ),
    shield: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751A11.959 11.959 0 0 0 12 2.714Z" />
      </svg>
    ),
    heart: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
    cog: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.37.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
    spark: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    drone: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h.01M18 12h.01M6 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm16 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM6.34 12H9m6 0h2.66M12 12V9m0 6v-3m0-3a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm0 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
      </svg>
    ),
    wallet: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 3V9m0 3a2.25 2.25 0 0 1-2.25 2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 1 3 12V9m0 3a2.25 2.25 0 0 1 2.25-2.25H6.75a3 3 0 1 0 6 0h2.25A2.25 2.25 0 0 1 18 9v3" />
      </svg>
    ),
    ledger: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    gov: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    pipeline: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3v.75m-9-9v.75m0 3v.75m0 3v.75m0 3v.75M3.375 6h17.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H3.375A1.125 1.125 0 0 1 2.25 16.875v-9.75c0-.621.504-1.125 1.125-1.125Z" />
      </svg>
    ),
  };
  return <span className="text-sky-600 dark:text-sky-400">{map[kind] ?? map.spark}</span>;
}

function RoleIcon({ kind }: { kind: string }) {
  const map: Record<string, ReactNode> = {
    nvidia: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    uvu: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
      </svg>
    ),
    uou: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    herbert: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    spark: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
  };
  return <span className="text-sky-600 dark:text-sky-400">{map[kind] ?? map.nvidia}</span>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HomePageContent() {
  const year = new Date().getFullYear();

  return (
    <>
      {/* ============== HERO ============== */}
      <section
        id="top"
        className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 pb-16 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:min-h-[92vh] sm:px-6 sm:pb-20 sm:pt-[calc(6rem+env(safe-area-inset-top))]"
      >
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.16),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/90 via-zinc-100/70 to-zinc-50 dark:from-zinc-950/40 dark:via-zinc-950/70 dark:to-zinc-950" />
        </div>

        <div className="relative z-10 mx-auto min-w-0 max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="mb-6 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              {SITE.role}
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl sm:leading-[1.05]">
              Majid Memari
              <span className="mt-3 block text-3xl font-semibold sm:mt-4 sm:text-5xl">
                Building <span className="gradient-text">AI that ships</span>
              </span>
              <span className="block text-zinc-700 dark:text-zinc-300 sm:mt-2 sm:text-4xl">
                — and teaching what comes next.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Active projects include DataGovAI, AI-STER, AI-ClassSims, privacy-preserving synthetic
              data, wind-turbine RGB/thermal inspection, and GridEye. I work with Utah agencies,
              UVU, the University of Utah, and consult with {MAJID.clarion} on LLM and agent
              workflows.
            </p>
          </Reveal>
          <Reveal delay={280}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <a
                href="#contact"
                className="rounded-full bg-zinc-900 px-8 py-3.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Get in touch
              </a>
              <a
                href="#work"
                className="rounded-full border border-zinc-300 bg-white/60 px-8 py-3.5 text-sm font-medium text-zinc-800 backdrop-blur transition hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:border-zinc-500"
              >
                See my work
              </a>
            </div>
          </Reveal>
          <Reveal delay={360}>
            <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-x-4 gap-y-8 border-t border-zinc-200/80 pt-12 dark:border-zinc-800/60 sm:mt-20 sm:grid-cols-4 sm:gap-6 sm:pt-16">
              {STATS.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                    <AnimatedCounter end={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <PartnersStrip voice="I" includeSchoolOfEducation />

      {/* ============== ABOUT ============== */}
      <section
        id="about"
        className="scroll-mt-20 border-t border-zinc-200/80 bg-white px-4 py-32 dark:border-zinc-800/40 dark:bg-zinc-950 sm:px-6"
      >
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              About
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              Dr. Majid Memari
            </h2>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-500">
              Academia · Industry · Community
            </p>
          </Reveal>

          <div className="mt-16 grid gap-16 md:grid-cols-2 md:items-start">
            <Reveal delay={100}>
              <div className="space-y-6">
                <div className="relative mx-auto h-40 w-40 md:mx-0">
                  <Image
                    src="/majid-memari.png"
                    alt="Dr. Majid Memari"
                    fill
                    className="rounded-full object-cover object-top ring-1 ring-zinc-200 dark:ring-zinc-700"
                    sizes="160px"
                  />
                  <div
                    className="pointer-events-none absolute -inset-2 animate-[pulse-glow_6s_ease-in-out_infinite] rounded-full border border-zinc-300/20 dark:border-zinc-600/20"
                    aria-hidden
                  />
                </div>
                <BioCategories />
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { big: "Ph.D.", sub: "Computer Science, SIU Carbondale" },
                  { big: "NVIDIA", sub: "University Ambassador & DLI Instructor" },
                  { big: "2026", sub: "Selected for the 2026 AI Utah 100" },
                  { big: "UVU", sub: "Assistant Professor of Computer Science" },
                ].map((card) => (
                  <div key={card.big} className="card p-4">
                    <p className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {card.big}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-zinc-600 dark:text-zinc-500">
                      {card.sub}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3">
                {ROLES.map((r) => (
                  <div key={r.org} className="card flex items-start gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <RoleIcon kind={r.icon} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        {r.org}
                      </p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {r.title}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-500">{r.period}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============== WORK ============== */}
      <section
        id="work"
        className="scroll-mt-20 border-t border-zinc-200/80 px-4 py-32 dark:border-zinc-800/40 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Portfolio
            </p>
            <h2 className="mt-4 text-center text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              Selected work
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-zinc-600 dark:text-zinc-400">
              Flagship work: DataGovAI, AI-STER, AI-ClassSims, privacy-preserving synthetic data,
              wind-turbine RGB/thermal inspection, and GridEye.
            </p>
          </Reveal>
          <div className="mt-20 grid auto-rows-fr gap-5 sm:grid-cols-2">
            {FEATURED_PROJECTS.map((p, i) => (
              <Reveal key={p.title} delay={i * 50} className="h-full min-h-0">
                <div className="card flex h-full min-h-[240px] flex-col p-6 sm:min-h-[220px]">
                  <div className="mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    <ProjectIcon kind={p.icon} />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{p.title}</h3>
                  <p className="mt-1 shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                    {p.tagline}
                  </p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-500">
                    {p.description}
                  </p>
                  {"requestAccess" in p && p.requestAccess ? (
                    <Link
                      href="#contact"
                      className="mt-4 inline-flex text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-600 dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:decoration-zinc-400"
                    >
                      Request access or demo
                    </Link>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-32 border-t border-zinc-200/80 pt-24 dark:border-zinc-800/40">
            <Reveal>
              <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Automation
              </p>
              <h3 className="mt-4 text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                Agentic workflows
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600 dark:text-zinc-400">
                Intelligent pipelines with n8n — tools, APIs, and models orchestrated to run around
                the clock.
              </p>
            </Reveal>

            <Reveal delay={80}>
              <div className="mt-12 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-5 [-webkit-overflow-scrolling:touch]">
                <div className="inline-block min-w-0 w-full max-w-full sm:inline-block">
                  <Image
                    src="/workflow.svg"
                    alt="Agentic AI workflow automation diagram built with n8n — connected nodes for form handling, conditional logic, AI processing, and multi-step orchestration"
                    width={985}
                    height={700}
                    sizes="(max-width: 640px) 100vw, 985px"
                    className="h-auto w-full max-w-full rounded-lg sm:w-full"
                  />
                </div>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <Reveal delay={100}>
                <div className="card p-5 text-center">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Visual workflow design
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-500">
                    Drag-and-drop with n8n — branching, loops, error handling, and approvals.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={140}>
                <div className="card p-5 text-center">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">AI-native nodes</h4>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-500">
                    LLM calls, RAG, sentiment, and classification in the pipeline.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={180}>
                <div className="card p-5 text-center">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Always-on orchestration
                  </h4>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-500">
                    Webhooks, schedules, monitoring, retries, and audit trails.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>

          <div className="mt-32 border-t border-zinc-200/80 pt-24 dark:border-zinc-800/40">
            <Reveal>
              <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Interactive
              </p>
              <h3 className="mt-4 text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                Try my AI
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600 dark:text-zinc-400">
                Products I ship — an AI financial assistant and a course-grounded teaching assistant.
              </p>
            </Reveal>
            <div className="mt-10">
              <AiChatbotShowcase />
            </div>
          </div>

          <div className="mt-32 border-t border-zinc-200/80 pt-24 dark:border-zinc-800/40">
            <Reveal>
              <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Collaboration
              </p>
              <h3 className="mt-4 text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                Where I make an impact
              </h3>
            </Reveal>
            <Reveal delay={80}>
              <div className="mt-12">
                <CollaborationHighlights />
              </div>
            </Reveal>
          </div>

          <AiNowStrip />

          <div className="mt-24 border-t border-zinc-200/80 pt-16 dark:border-zinc-800/40">
            <Reveal>
              <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500">
                Tools I work with
              </p>
              <LogoStrip items={TECH_LOGOS} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============== TEACHING ============== */}
      <section
        id="teaching"
        className="scroll-mt-20 border-t border-zinc-200/80 bg-white px-4 py-32 dark:border-zinc-800/40 dark:bg-zinc-950 sm:px-6"
      >
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Utah Valley University · NVIDIA DLI
            </p>
            <h2 className="mt-4 text-center text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              Courses &amp; workshops
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-zinc-600 dark:text-zinc-500">
              I refresh applied-AI course content every term and deliver{" "}
              <Link
                href={NVIDIA_TRAINING_URL}
                className="text-sky-600 dark:text-sky-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                NVIDIA Deep Learning Institute
              </Link>{" "}
              workshops as a University Ambassador — GPU-accelerated labs, free for students at
              participating universities, with DLI-style certificates where available.
            </p>
          </Reveal>
          <div className="mt-16 grid gap-4 sm:grid-cols-2">
            {UVU_COURSES.map((c, i) => (
              <Reveal key={c.code} delay={i * 50}>
                <div className="card h-full p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    {c.code}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {c.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{c.term}</p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-500">
                    {c.blurb}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WORKSHOPS.map((w, i) => (
              <Reveal key={w.title} delay={i * 60}>
                <div className="card h-full p-5">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {w.title}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{w.duration}</p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-500">
                    {w.blurb}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <div className="mt-10 grid gap-3 text-center text-xs text-zinc-600 dark:text-zinc-500 sm:grid-cols-2 lg:grid-cols-4">
              <span className="rounded-lg border border-zinc-200 dark:border-zinc-800/60 bg-zinc-100/80 dark:bg-zinc-900/30 px-3 py-2">
                GPU cloud labs
              </span>
              <span className="rounded-lg border border-zinc-200 dark:border-zinc-800/60 bg-zinc-100/80 dark:bg-zinc-900/30 px-3 py-2">
                Industry tools &amp; frameworks
              </span>
              <span className="rounded-lg border border-zinc-200 dark:border-zinc-800/60 bg-zinc-100/80 dark:bg-zinc-900/30 px-3 py-2">
                DLI-style completion
              </span>
              <span className="rounded-lg border border-zinc-200 dark:border-zinc-800/60 bg-zinc-100/80 dark:bg-zinc-900/30 px-3 py-2">
                Real-world use cases
              </span>
            </div>
            <div className="mt-8 flex flex-col items-center gap-2">
              <a
                href="#contact"
                className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Invite me to your campus
              </a>
              <p className="max-w-md text-center text-xs text-zinc-600">
                Available for universities worldwide. Student workshops are offered at no charge to
                students; logistics vary by institution.
              </p>
            </div>
          </Reveal>

          <Reveal delay={280}>
            <div className="mt-16 rounded-2xl border border-sky-200/80 bg-sky-50/80 px-4 sm:px-6 py-8 dark:border-sky-900/40 dark:bg-sky-950/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                Bridging academia &amp; industry
              </p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                EdTech innovation &amp; entrepreneurship course
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-400">
                I design new AI courses to close the gap between what universities teach and what
                industry needs. One example: an innovation and entrepreneurship course focused on
                Education Technology. Students discover real problems in K-12 and higher education,
                propose AI-powered solutions, build working prototypes using no-code tools
                (cloud-hosted n8n), and pitch their EdTech startup to mentors and judges. No
                programming experience required — co-taught by a computer scientist and an
                education expert, with mentoring and guest lectures from{" "}
                <a
                  href="https://www.uvu.edu/entrepreneurship/"
                  className="text-sky-600 underline decoration-sky-600/30 hover:decoration-sky-600 dark:text-sky-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  UVU&apos;s Baugh Entrepreneurship Institute
                </a>
                .
              </p>
              <div className="mt-6">
                <a
                  href="#contact"
                  className="inline-flex rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-500 dark:shadow-sky-900/30"
                >
                  Contact me about courses &amp; collaboration
                </a>
              </div>
            </div>
          </Reveal>

          <div className="mx-auto mt-32 max-w-6xl border-t border-zinc-200/80 pt-24 dark:border-zinc-800/40">
            <Reveal>
              <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Public sector
              </p>
              <h3 className="mt-4 text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                Government &amp; public policy
              </h3>
              <p className="mx-auto mt-4 max-w-3xl text-center text-zinc-600 dark:text-zinc-500">
                As Principal AI Architect at the Gary R. Herbert Institute for Public Policy
                (Nov 2024 — Present), I lead state-level collaborations with Utah agencies. Students
                work alongside me on these initiatives — gaining hands-on public-sector AI
                experience.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {GOVERNMENT_HIGHLIGHTS.map((card, i) => (
                <Reveal key={card.title} delay={(i + 1) * 60}>
                  <div className="card p-6">
                    <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {card.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-500">
                      {card.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={240}>
              <div className="mt-10 text-center">
                <a
                  href="#contact"
                  className="inline-flex rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  Bring AI to your agency
                </a>
                <p className="mt-2 text-xs text-zinc-600">
                  Responsible, privacy-preserving AI partnerships with state and local agencies.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============== MENTORSHIP ============== */}
      <section
        id="mentorship"
        className="scroll-mt-20 border-t border-zinc-200/80 bg-zinc-50 px-4 py-32 dark:border-zinc-800/40 dark:bg-zinc-900/30 sm:px-6"
      >
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Mentorship
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              Student interns &amp; research
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              I mentor 10+ undergraduate researchers each year (20+ since Fall 2024) on funded
              projects — DataGovAI, AI-STER, AI-ClassSims, synthetic data, and inspection AI — from
              architecture to deployment, at no cost to students.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="card mt-12 p-8">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                AI Engineer Intern
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">Fully online · rolling intake</p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                If you want{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">
                  real-world AI engineering experience
                </strong>{" "}
                — not only coursework — reach out. You&apos;ll work alongside me and the team on
                production-minded tasks: LLMs and RAG, agentic workflows, cloud integrations, and
                domain projects that ship.
              </p>
              <div className="mt-6 space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
                <div>
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">What you might do</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Contribute to LLM-powered apps, evaluation, and tooling</li>
                    <li>Help build agentic systems and integrations with cloud data services</li>
                    <li>Support EdTech, simulation, and public-sector initiatives with mentorship</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">What I look for</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Curiosity and follow-through; Python and interest in LLMs/APIs are a plus</li>
                    <li>Willingness to learn — I pair you with concrete tasks and feedback</li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={`mailto:${SITE.email}?subject=AI%20Engineer%20Intern%20Inquiry`}
                  className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  Email me
                </a>
                <a
                  href="#contact"
                  className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-zinc-500"
                >
                  Contact form
                </a>
              </div>
              <p className="mt-6 text-xs text-zinc-600">
                Not sure if you&apos;re a fit? I still want to hear from you —{" "}
                <a href="#contact" className="text-sky-600 dark:text-sky-400 hover:underline">
                  get in touch
                </a>
                .
              </p>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-10 flex flex-col gap-4 rounded-xl border border-zinc-200/80 bg-white px-5 py-4 dark:border-zinc-800/60 dark:bg-zinc-900/40 sm:flex-row sm:items-center sm:gap-5">
              <a
                href="https://siliconslopes.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-sm dark:border-zinc-200 dark:bg-white sm:h-32 sm:w-32"
              >
                <span className="absolute inset-2 block">
                  <span className="relative block h-full w-full">
                    <Image
                      src="/logos/siliconslopes.png"
                      alt="Silicon Slopes — Utah tech community"
                      fill
                      sizes="(max-width: 640px) 96px, 128px"
                      className="object-contain object-center"
                    />
                  </span>
                </span>
              </a>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  AI Utah, Silicon Slopes &amp; Utah tech
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-500">
                  I contribute to{" "}
                  <a
                    href="https://www.aiutah.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sky-600 underline decoration-sky-600/30 hover:decoration-sky-600 dark:text-sky-400"
                  >
                    AI Utah
                  </a>
                  {" "}— Utah&apos;s AI user group and community hub for practitioners, events, and
                  collaboration. I was{" "}
                  <a
                    href="https://www.aiutah.org/ai-utah-100/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sky-600 underline decoration-sky-600/30 hover:decoration-sky-600 dark:text-sky-400"
                  >
                    selected for the 2026 AI Utah 100
                  </a>
                  . I show up, bring students, and help them plug into that network.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-500">
                  I&apos;m also active in{" "}
                  <a
                    href="https://siliconslopes.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-sky-600 underline decoration-sky-600/30 hover:decoration-sky-600 dark:text-sky-400"
                  >
                    Silicon Slopes
                  </a>
                  , the nonprofit helping Utah founders grow — connecting learners with founders,
                  hiring managers, and collaborators across the broader tech ecosystem.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============== CONTACT + FAQ ============== */}
      <section
        id="contact"
        className="scroll-mt-20 border-t border-zinc-200/80 bg-white px-4 py-32 dark:border-zinc-800/40 dark:bg-zinc-950 sm:px-6"
      >
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Contact
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              Let&apos;s work together
            </h2>
            <p className="mt-4 max-w-lg text-zinc-600 dark:text-zinc-400">
              AI consulting, workshops, team training, student mentorship, or a research
              collaboration — send a message. UVU students can also{" "}
              <a
                href={SITE.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-600 underline decoration-sky-600/30 hover:decoration-sky-600 dark:text-sky-400"
              >
                book office hours
              </a>
              .
            </p>
          </Reveal>

          <Reveal delay={60}>
            <div className="mt-12">
              <ContactForm />
            </div>
          </Reveal>

          <div id="faq" className="mt-24 scroll-mt-24">
            <Reveal>
              <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Frequently asked questions
              </h3>
            </Reveal>
            <Reveal delay={40}>
              <div className="mt-8">
                <FaqAccordion />
              </div>
            </Reveal>
          </div>

          <div className="mt-20 grid gap-4 sm:grid-cols-3">
            {[
              {
                href: `mailto:${SITE.email}`,
                label: "Email",
                detail: SITE.emailDisplay,
                icon: (
                  <svg className="mb-3 h-8 w-8 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                ),
              },
              {
                href: SITE.linkedin,
                label: "LinkedIn",
                detail: SITE.linkedinHandle,
                external: true,
                icon: (
                  <svg className="mb-3 h-8 w-8 text-zinc-500 dark:text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                ),
              },
              {
                href: SITE.github,
                label: "GitHub",
                detail: SITE.githubHandle,
                external: true,
                icon: (
                  <svg className="mb-3 h-8 w-8 text-zinc-500 dark:text-zinc-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                ),
              },
            ].map((c) => (
              <Reveal key={c.label} delay={80}>
                <a
                  href={c.href}
                  {...(("external" in c) ? { target: "_blank", rel: "me noopener noreferrer" } : {})}
                  className="card group flex flex-col items-center p-5 text-center"
                >
                  {c.icon}
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{c.label}</p>
                  <p className="mt-1 break-all text-xs text-zinc-600 dark:text-zinc-500 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-300">
                    {c.detail}
                  </p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer className="border-t border-zinc-200/80 bg-zinc-50 px-4 py-16 dark:border-zinc-800/40 dark:bg-zinc-900/30 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-sky-500 to-indigo-600 text-[11px] font-bold text-white"
                >
                  MM
                </span>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {SITE.name}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-500">
                Assistant Professor of Computer Science at UVU · NVIDIA Ambassador · Orem, Utah.
              </p>
            </div>

            <nav
              aria-label="Footer"
              className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400"
            >
              {FOOTER_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="transition hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {l.label}
                </Link>
              ))}
              <Link href="/#faq" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
                FAQ
              </Link>
            </nav>

            <div className="w-full max-w-xs lg:w-auto">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                Stay in touch
              </p>
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-500">
                Occasional updates on AI work, workshops, and student opportunities.
              </p>
              <div className="mt-3">
                <NewsletterForm />
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center gap-4 border-t border-zinc-200/80 pt-8 text-center dark:border-zinc-800/40 sm:flex-row sm:justify-between sm:text-left">
            <div className="flex gap-4">
              {[
                {
                  href: SITE.linkedin,
                  label: "LinkedIn",
                  d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
                },
                {
                  href: SITE.github,
                  label: "GitHub",
                  d: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z",
                },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  aria-label={s.label}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
            <p className="text-xs text-zinc-600">© {year} Majid Memari · Utah</p>
          </div>
        </div>
      </footer>

      <ScrollToTop />
    </>
  );
}
