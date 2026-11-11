import { PUBLICATIONS } from "@/lib/publications";

/**
 * Canonical public facts about Dr. Majid Memari.
 * Sources (do not invent grants, employers, or metrics):
 *   Teaching/uvu_courses/template/instructor_profile.py
 *   Teaching/uvu_courses/portfolio/tenure/data/personal.md
 *   Teaching/uvu_courses/portfolio/tenure/data/teaching.md
 *   Teaching/uvu_courses/portfolio/tenure/data/scholarship.md
 *   Teaching/uvu_courses/portfolio/tenure/data/service_professional.md
 * Public course and biography copy uses Majid Memari's independent personal brand.
 * NVIDIA DLI is instructional certification, not employment.
 * AI Utah 100 (2026): say “selected for”; do not invent a winner category.
 */

export const MAJID = {
  fullName: "Dr. Majid Memari",
  displayName: "Majid (MJ) Memari",
  shortBio:
    "AI educator and mentor helping learners turn real problems into practical AI solutions. NVIDIA Deep Learning Institute Certified Instructor.",
  jobTitle: "AI Educator and Mentor",
  roles: {
    nvidia: "NVIDIA Deep Learning Institute Certified Instructor",
  },
  clientOffer: {
    label: "AI consulting and team training",
    summary:
      "Advisory engagements on how to adopt AI, plus instructor-led workshops and in-house team training.",
  },
  education: {
    phd: "Ph.D. in Computer Science (2023)",
    ms: "M.S. in Computer Science (2017)",
    mba: "M.B.A. (2015)",
    basc: "B.S. in Industrial Engineering (2010)",
  },
  certifications: {
    aiForBusiness: {
      title: "AI For Business Specialization",
      issuer: "University of Pennsylvania",
      url: "https://www.coursera.org/account/accomplishments/specialization/H2NX0NYKLLO6",
    },
  },
  siliconSlopes: "https://www.siliconslopes.com/",
  clarion: "Clarion AI Partners",
  potentia: "Potentia Analytics",
  aiUtah100: {
    label: "selected for the 2026 AI Utah 100",
    url: "https://www.aiutah.org/ai-utah-100/",
  },
  bio: {
    academia:
      "Majid designs AI courses and workshops for learners across universities and organizations. His teaching connects concepts to real problems through worked examples, visual explanations, interactive practice, and projects. Building AI Solutions is open to everyone, including students from any discipline, with no prerequisites. Learners discover a need, build with AI tools, evaluate evidence, and prepare a solution for use without writing code.",
    industry:
      "His applied work spans machine learning, generative AI, agents, computer vision, and data governance. He brings research and practical experience into the classroom, connecting technical capabilities to business value, evaluation, and responsible adoption. His background includes a Ph.D. in Computer Science and an M.B.A.",
    community:
      "Majid's mentorship focuses on defining useful problems, building practical skills, and communicating results clearly. He welcomes conversations with learners, educators, and organizations about AI learning and project collaboration. The work is shaped by the learner's goals, the partner's needs, and the resources available.",
  },
  scholar: "https://scholar.google.com/citations?user=LQI4T24AAAAJ&hl=en",
  linkedin: "https://www.linkedin.com/in/majid-memari",
  github: "https://github.com/memari-majid",
  orcid: "https://orcid.org/0000-0001-5654-4996",
  researchGate: "https://www.researchgate.net/profile/Majid-Memari",
  personalSite: "https://www.majidmemari.com",
  scholarListedWorks: 20,
  publications: PUBLICATIONS,
} as const;
