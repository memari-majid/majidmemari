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
      "Majid designs AI courses and workshops for learners across universities and organizations. His teaching connects concepts to real problems through worked examples, visual explanations, interactive practice, and projects. In Building AI Solutions, business learners discover a need, build with AI tools, evaluate the evidence, and prepare a solution for use without writing code.",
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
  publications: [
    {
      year: 2026,
      title: "The Capability Ladder: A Curriculum-Modernization Framework for Workforce Readiness in the AI Era",
      authors: "M. Memari, G. Rudolph",
      venue: "arXiv:2608.07779",
      href: "https://arxiv.org/abs/2608.07779",
      kind: "preprint",
    },
    {
      year: 2026,
      title: "AI-ClassSims: Multi-Agent LLM Classroom Simulation with Real-Time Feedback for Teacher Training",
      authors: "M. Memari, K. Ruggles",
      venue: "2026 Intermountain Engineering, Technology and Computing (IETC)",
      href: "https://scholar.google.com/citations?user=LQI4T24AAAAJ&hl=en",
      kind: "conference",
    },
    {
      year: 2026,
      title:
        "DataGovAI: A Multi-Agent RAG System for Government Data Retention Compliance with Privacy-Preserving Evaluation",
      authors: "M. Memari, G. Rudolph, B. Burns, E. Howlett, C. Bramwell, G. Mcewan",
      venue: "2026 Intermountain Engineering, Technology and Computing (IETC)",
      href: "https://scholar.google.com/citations?user=LQI4T24AAAAJ&hl=en",
      kind: "conference",
    },
    {
      year: 2026,
      title: "Accelerating Feedback, Preserving Expertise: AI-Assisted Evaluation in Teacher Preparation",
      authors: "K. Ruggles, M. Memari",
      venue: "SITE 2026",
      href: "https://scholar.google.com/citations?user=LQI4T24AAAAJ&hl=en",
      kind: "conference",
    },
    {
      year: 2025,
      title:
        "Artificial Intelligence in Elementary STEM Education: A Systematic Review of Current Applications and Future Challenges",
      authors: "M. Memari, K. Ruggles",
      venue: "arXiv:2511.00105",
      href: "https://arxiv.org/abs/2511.00105",
      kind: "preprint",
    },
    {
      year: 2025,
      title: "Enhanced non-destructive testing of small wind turbine blades using infrared thermography",
      authors: "M. Memari, M. Shekaramiz, M. A. S. Masoum, A. C. Seibi",
      venue: "Machines, 13(2), 108",
      href: "https://doi.org/10.3390/machines13020108",
      kind: "journal",
    },
    {
      year: 2024,
      title:
        "Review on the advancements in wind turbine blade inspection: Integrating drone and deep learning technologies for enhanced defect detection",
      authors: "M. Memari, P. Shakya, M. Shekaramiz, A. C. Seibi, M. A. S. Masoum",
      venue: "IEEE Access, 12, 33236–33282",
      href: "https://doi.org/10.1109/ACCESS.2024.3371493",
      kind: "journal",
    },
  ],
} as const;
