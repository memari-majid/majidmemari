export type Prototype = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  purpose: string;
  capabilities: readonly string[];
  limit: string;
  url: string;
  launchLabel: string;
  access: string;
  accessNote: string;
  historical?: boolean;
};

/** Public portfolio copy only. Account access and live AI availability vary by app. */
export const PROTOTYPES: readonly Prototype[] = [
  {
    slug: "building-ai-solutions",
    name: "Building AI Solutions",
    category: "Learning & business",
    summary: "An interactive course that turns business problems into practical AI solutions.",
    purpose: "Help business learners identify a useful problem, create a usable solution, and evaluate its value with evidence and numbers.",
    capabilities: ["A guided learning path with business cases and worked examples.", "Interactive figures and practice inside the lessons.", "Project templates, a portable workbook, and a practical capstone."],
    limit: "Case data and simulations are illustrative. Learners must test their own solutions and check important claims.",
    url: "https://www.majidmemari.com/teaching/ai-solutions/",
    launchLabel: "Explore the course",
    access: "Public course",
    accessNote: "Follow twelve units and one capstone without an account. Save or export your workbook to keep your notes.",
  },
  {
    slug: "datagovai",
    name: "DataGovAI",
    category: "Data governance",
    summary: "A knowledge assistant for questions about Utah government records retention.",
    purpose: "Explore how retrieval and AI assistance can help people navigate government records guidance and locate relevant source material.",
    capabilities: ["A conversational interface for records-retention questions.", "A focused knowledge base around Utah General Retention Schedules.", "An applied example of AI support for a specialized information workflow."],
    limit: "Responses need review against the current authoritative records guidance and the requirements of the relevant organization.",
    url: "https://datagovai-web.vercel.app",
    launchLabel: "Open DataGovAI",
    access: "Sign-in required",
    accessNote: "An authorized account is required to ask questions; public sign-in is available.",
  },
  {
    slug: "ai-classsims",
    name: "AI-ClassSims",
    category: "Teacher preparation",
    summary: "Practice classroom interactions with AI student personas.",
    purpose: "Give aspiring teachers a place to rehearse classroom decisions and reflect on how different students respond.",
    capabilities: ["A simulated classroom with distinct student personas.", "Teacher turns that prompt AI student responses.", "A practice environment for classroom management and instructional choices."],
    limit: "Simulated student behavior is a teaching aid. It does not establish how real children will respond or replace supervised classroom practice.",
    url: "https://aiclassims.com",
    launchLabel: "Open the classroom",
    access: "Public simulation",
    accessNote: "Open the classroom to explore the simulation. AI responses depend on the application's service availability.",
  },
  {
    slug: "carewise",
    name: "CareWise",
    category: "Parent education",
    summary: "Source-grounded autism information for parents and caregivers.",
    purpose: "Help parents understand information, prepare questions for a child's care team, and navigate a curated library of trusted sources.",
    capabilities: ["A public parent guide and source library.", "Conversational educational answers with source citations.", "A focused workflow for understanding autism-related information."],
    limit: "An educational prototype, not a diagnostic, therapy, or crisis service. Review health decisions with a qualified professional.",
    url: "https://carewise.space",
    launchLabel: "Explore CareWise",
    access: "Guide public · chat sign-in",
    accessNote: "Read the guide and source information publicly. The chat opens through the application's sign-in flow.",
  },
  {
    slug: "willow",
    name: "Willow",
    category: "Reflection & skills",
    summary: "A conversational companion for everyday reflection and cognitive behavioral skills practice.",
    purpose: "Explore structured reflection, thought records, and practical exercises in a calm conversational experience.",
    capabilities: ["A public conversation demo.", "Guided reflection and cognitive behavioral skill exercises.", "A topic library and explanations of the sources behind the experience."],
    limit: "A skills-practice prototype, not a therapist, doctor, or crisis service. The public demo conversation clears when refreshed.",
    url: "https://www.willowspace.dev/demo",
    launchLabel: "Try the Willow demo",
    access: "Public demo",
    accessNote: "Try the demo without an account. Account-based features use a separate sign-in flow.",
  },
  {
    slug: "ai-cpa",
    name: "AI-CPA · AI Bookkeeping",
    category: "Accounting & finance",
    summary: "An AI-assisted bookkeeping workspace with a conversational assistant named Saul.",
    purpose: "Explore how AI can help organize multi-entity books and explain accounting questions in the context of an authorized user's data.",
    capabilities: ["A bookkeeping workspace for multiple entities.", "A conversational assistant grounded in the workspace's financial context.", "Support for exploring collaboration strategies and tax-aware questions."],
    limit: "Informational assistance requires review by a qualified accounting professional. Financial records are available only to authorized users.",
    url: "https://www.aicpa.dev",
    launchLabel: "Open the sign-in page",
    access: "Sign-in required",
    accessNote: "An authorized application account is required to open the bookkeeping workspace. Contact me to discuss a demonstration.",
  },
  {
    slug: "finhub",
    name: "FinHub",
    category: "Personal finance",
    summary: "A finance dashboard that brings balances, spending, and debt information into one workspace.",
    purpose: "Explore how connected financial information and optional AI assistance can support a clearer view of everyday finances.",
    capabilities: ["Balances and recent transaction views.", "Spending rollups and recurring-payment information.", "A debt overview with an avalanche-planning interface."],
    limit: "This private workspace uses authorized financial connections. Its summaries are informational and depend on the connected data.",
    url: "https://finhub-eight.vercel.app",
    launchLabel: "Open the sign-in page",
    access: "Sign-in required",
    accessNote: "An administrator-provisioned account is required. Contact me to discuss the prototype without sharing personal financial records.",
  },
  {
    slug: "ai-ster",
    name: "AI-STER",
    category: "Teacher evaluation",
    summary: "AI-assisted student-teaching evaluation aligned with USBE rubrics.",
    purpose: "Explore a structured way to organize teaching observations and support a human evaluator's review.",
    capabilities: ["A rubric-based student-teaching evaluation workflow.", "AI assistance for examining observation evidence.", "Role-based workspaces for supervisors, coordinators, and administrators."],
    limit: "Evaluation decisions remain the responsibility of qualified human reviewers. Access is restricted to protect evaluation records.",
    url: "https://uvuaister.com",
    launchLabel: "Open the sign-in page",
    access: "Sign-in required",
    accessNote: "An authorized evaluator account is required. The public sign-in page is available; contact me for a walkthrough.",
  },
  {
    slug: "course-chatbot",
    name: "Course AI Teaching Assistant",
    category: "Course support",
    summary: "An archived-course AI demo that helps learners explore saved Summer 2026 materials.",
    purpose: "Demonstrate conversational course support using saved Summer 2026 syllabus, module, and assignment materials.",
    capabilities: ["Course questions and module-based starter prompts.", "Fast and thinking response modes.", "Conversation history saved in the visitor's browser."],
    limit: "This archived course demonstration has no live Canvas sync or current assignments and due dates. Confirm current course details in Canvas. The assistant supports learning and does not complete graded work for students.",
    url: "https://chatbot-ruddy-one-94.vercel.app",
    launchLabel: "Open the course assistant",
    access: "Public demo · Archived course",
    accessNote: "Ask AI questions about saved Summer 2026 course materials. Live Canvas sync and current dates are unavailable; linked historical Canvas resources may require sign-in.",
  },
  {
    slug: "nvidia-workshop-ta",
    name: "NVIDIA Workshop Teaching Assistant",
    category: "Workshop support",
    summary: "A workshop question-and-answer assistant for an authorized learning community.",
    purpose: "Give workshop participants a focused place to ask questions about course material while they work through technical learning activities.",
    capabilities: ["A workshop-specific question-and-answer experience.", "Access through the workshop's Slack sign-in.", "AI support alongside instructor-led learning."],
    limit: "Built as an independent teaching-support prototype. AI responses need checking against the workshop materials and instructor guidance.",
    url: "https://nvidia-teaching-assistant.vercel.app",
    launchLabel: "Open workshop sign-in",
    access: "Workshop Slack sign-in",
    accessNote: "Sign in with an authorized NVIDIA-AI-WORKSHOP Slack account to use this assistant.",
  },
  {
    slug: "grideye",
    name: "GridEye",
    category: "Infrastructure research",
    summary: "A historical research prototype exploring aerial AI and power-quality information for grid inspection.",
    purpose: "Show an earlier concept for combining drone imagery, thermal sensing, and electrical context in an infrastructure inspection workflow.",
    capabilities: ["Public explanations of the inspection concept.", "High-level summaries of sensing and AI research ideas.", "An example of communicating a technical research prototype on the web."],
    limit: "Historical portfolio material. The project pages may describe earlier plans and do not establish a current active program, funding award, or deployed inspection service.",
    url: "https://grideye-nine.vercel.app",
    launchLabel: "View the historical prototype",
    access: "Historical prototype",
    accessNote: "The public site remains available as a record of the earlier concept.",
    historical: true,
  },
];

export const FEATURED_PROTOTYPE_SLUGS = ["datagovai", "ai-classsims", "carewise"];

export function getPrototype(slug: string) {
  return PROTOTYPES.find((prototype) => prototype.slug === slug);
}
