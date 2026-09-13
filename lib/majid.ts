/**
 * Canonical public facts about Dr. Majid Memari.
 * Sources (do not invent grants, employers, or metrics):
 *   Teaching/uvu_courses/template/instructor_profile.py
 *   Teaching/uvu_courses/portfolio/tenure/data/personal.md
 *   Teaching/uvu_courses/portfolio/tenure/data/teaching.md
 *   Teaching/uvu_courses/portfolio/tenure/data/scholarship.md
 *   Teaching/uvu_courses/portfolio/tenure/data/service_professional.md
 * Stanford / Johns Hopkins are Penn collaborations, not employers.
 * Silicon Slopes is community, not an employer. NVIDIA DLI is instructional certification.
 * Public bio is three buckets: Academia · Industry · Community (instructor_profile bio_full).
 * AI Utah 100 (2026): he is a published honoree — not a winner, #1, or category.
 */

export const MAJID = {
  fullName: "Dr. Majid Memari",
  displayName: "Majid (MJ) Memari",
  shortBio:
    "Assistant Professor of Computer Science at Utah Valley University; NVIDIA University Ambassador and DLI Certified Instructor.",
  headlineRole: "AI Scientist & Solution Architect",
  jobTitle: "Assistant Professor of Computer Science",
  department: "Department of Computer Science",
  university: "Utah Valley University",
  roles: {
    uvu: "Assistant Professor of Computer Science, Utah Valley University (2024–present)",
    nvidia: "NVIDIA University Ambassador and Deep Learning Institute Certified Instructor",
    herbert: "Principal AI Architect, Gary R. Herbert Institute for Public Policy",
    rai: "AI Consultant, University of Utah One-U Responsible AI Initiative",
    nexus: "Founder & Principal AI Architect, Nexus AI Solutions LLC",
  },
  clientOffer: {
    label: "AI consulting and team training",
    summary:
      "Advisory engagements on how to adopt AI, plus instructor-led workshops and in-house team training.",
  },
  education: {
    phd: "Ph.D. in Computer Science, Southern Illinois University Carbondale (2023)",
    ms: "M.S. in Computer Science, Southern Illinois University Carbondale (2017)",
    mba: "M.B.A., Islamic Azad University (2015)",
    basc: "B.A.Sc. in Industrial Engineering, Islamic Azad University (2010)",
  },
  prior: {
    uvuPostdoc: "Postdoctoral Researcher, Utah Valley University (2023–2024)",
    penn: "Postdoc, University of Pennsylvania (2023); Stanford and Johns Hopkins collaborations from that appointment",
    siu: "Research Assistant, Southern Illinois University Carbondale (2015–2022)",
  },
  /**
   * Homepage #top hero grid — keywords / numbers, not university-name dump.
   * Penn / Stanford / JHU / SIU stay in bio, not as big tokens.
   * 11: SIU RA 2015–2022 through 2026 applied AI & CS (careerStartYear).
   *     Do not claim 20 years.
   * PhD: diploma is Computer Science, SIU Carbondale 2023 (do not change
   *     institution). Thesis is synthetic-image / generative-model evaluation
   *     (C-VAE, C-GAN). Public hero label is “PhD in Gen AI” (user wording) —
   *     not a degree program officially named Generative AI. Do not lead with
   *     “R1 PhD” (SIU was R2 at 2023 conferral; Carnegie R1 is 2025).
   * 374: Google Scholar citations, tenure snapshot 2026-08-21
   *     (`evidence/publications/google_scholar_2026-08-21.md`). Do not inflate.
   * AI Utah 100: 2026 Yearbook Honoree List (official name; not “Utah AI 100”).
   *     Community-nominated, then expert panel. Public list does not label
   *     individuals by category — do not invent one. Not winner / #1 / top 1.
   *     Faculty / UVU is not a fourth-cell keyword. Cell 4 links to
   *     https://www.aiutah.org/ai-utah-100/. NVIDIA DLI stays in Industry / about.
   * No $1M on this grid (no sourced Penn/postdoc dollar amount; GridEye USHE
   * is a proposal). UVU title stays in bio / about cards, not this grid.
   */
  careerStartYear: 2015,
  yearsAppliedAiCs: 11,
  scholarCitations: 374,
  scholarCitationsAsOf: "2026-08-21",
  heroStats: [
    { display: "11", label: "Years applied AI & CS" },
    { display: "PhD", label: "in Gen AI" },
    { display: "374", label: "Scholar citations" },
    {
      display: "AI Utah 100",
      label: "Honoree, 2026",
      href: "https://www.aiutah.org/ai-utah-100/",
    },
  ],
  siliconSlopes: "https://www.siliconslopes.com/",
  clarion: "Clarion AI Partners",
  potentia: "Potentia Analytics",
  aiUtah100: {
    label: "2026 AI Utah 100 honoree",
    url: "https://www.aiutah.org/ai-utah-100/",
  },
  bio: {
    academia:
      "Majid is Assistant Professor of Computer Science at Utah Valley University. He teaches and researches applied AI, machine learning, and generative AI, including UVU work on drone RGB and thermal imaging for wind-turbine maintenance. He designed and teaches AI Entrepreneurship: Build and Launch AI-Powered Businesses — students take AI from a real problem to a working business, end to end, in the industry they choose. Prior research includes the University of Utah One-U Responsible AI Initiative, a postdoc at the University of Pennsylvania (with Stanford and Johns Hopkins collaborations), and research-assistant work at Southern Illinois University Carbondale.",
    industry:
      "In Utah's Silicon Slopes tech community he consults with Clarion AI Partners on LLM and agent workflows—including when to use AI and when not to. Through Nexus AI Solutions he provides AI consulting and team training: advisory work, workshops, and in-house sessions. He is listed in the NVIDIA Certified Instructor Directory as a Deep Learning Institute Certified Instructor, and earlier did data-science work at Potentia Analytics.",
    community:
      "At the Gary R. Herbert Institute for Public Policy he collaborates with the Utah Office of Data Privacy and the Utah Department of Health and Human Services (DHHS) on AI for data governance and privacy, and contributes to One-U RAI public and policy conversations. He is a 2026 AI Utah 100 honoree.",
  },
  scholar: "https://scholar.google.com/citations?user=LQI4T24AAAAJ&hl=en",
  linkedin: "https://www.linkedin.com/in/majid-memari",
  github: "https://github.com/memari-majid",
  orcid: "https://orcid.org/0000-0001-5654-4996",
  researchGate: "https://www.researchgate.net/profile/Majid-Memari",
  nvidiaInstructorDirectory:
    "https://www.nvidia.com/en-eu/training/instructor-directory/bio/?instructorId=003Vv00000J9hZLIAZ",
  nvidiaTraining: "https://www.nvidia.com/en-us/training/",
  uvuDirectory: "https://www.uvu.edu/directory/employee/?id=VW1ra3dUZ0I5YmpXcUYwaE1LN1kxZz09",
  personalSite: "https://www.majidmemari.com",
  nexusSite: "https://nexusaisolution.net",
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
  fall2026Courses: [
    "Fundamentals of Programming (online)",
    "Causal Inference (online)",
    "Machine Learning (online, MS-AAI)",
    "AI Entrepreneurship: Build and Launch AI-Powered Businesses (in-person)",
  ],
  cs4720r: {
    title: "AI Entrepreneurship",
    tagline: "Build and Launch AI-Powered Businesses",
    term: "Fall 2026 · in-person",
    summary:
      "A UVU course he designed and teaches. Students discover a real problem, build no-code AI systems, and launch a working AI-powered business — end to end, in any industry they choose.",
    catalog:
      "They learn AI capabilities first, then Lean Startup methods to validate, build, and pitch. Mentors and Demo Day are with UVU's Baugh Entrepreneurship Institute. Domain is student-chosen. The same model is the direction of his team training: helping people build their own AI-powered businesses.",
  },
} as const;
