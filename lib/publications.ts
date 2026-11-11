export const RESEARCH_FOCUSES = [
  { id: "ai", label: "AI & machine learning", description: "Computer vision, generative models, pattern recognition, and methods for evaluating AI systems." },
  { id: "llm", label: "LLMs & agents", description: "Language models, retrieval-augmented generation, and agents for specialist information and interactive applications." },
  { id: "education", label: "Education", description: "Curriculum, teacher preparation, assessment, and the use of AI in STEM learning." },
  { id: "vision", label: "Computer vision", description: "Image generation, image-quality evaluation, recognition, and visual defect detection." },
  { id: "engineering", label: "Engineering", description: "Imaging, sensing, and deep-learning methods for inspection and condition assessment." },
  { id: "governance", label: "Governance & privacy", description: "Source-grounded AI and privacy-aware evaluation for government records workflows." },
  { id: "biology", label: "Computational biology", description: "Genome assembly and computational resources for biological research." },
] as const;

export type ResearchFocusId = (typeof RESEARCH_FOCUSES)[number]["id"];
export type PublicationKind = "journal" | "conference" | "preprint" | "dissertation" | "thesis";
export type ResearchConnection = "direct" | "related";
export type Publication = {
  id: string;
  year: number;
  title: string;
  authors: string;
  venue: string;
  href: string;
  kind: PublicationKind;
  status?: "accepted";
  note?: string;
  topics: readonly ResearchFocusId[];
  summary: string;
  projectLinks?: readonly { slug: string; relationship: ResearchConnection }[];
  otherLinks?: readonly { label: string; href: string }[];
};

export function publicationKindLabel(publication: Publication) {
  if (publication.status === "accepted") return "Accepted journal article";
  return { journal: "Journal article", conference: "Conference paper", preprint: "Preprint", dissertation: "Dissertation", thesis: "Thesis" }[publication.kind];
}

/** Curated scholarly records: current publisher metadata takes precedence over older CV entries. */
export const PUBLICATIONS: readonly Publication[] = [
  {
    id: "capability-ladder-2026", year: 2026, kind: "journal", status: "accepted",
    title: "The Capability Ladder: Aligning AI Delegation with Human Supervision in Computing Education",
    authors: "M. Memari, G. Rudolph, K. Ruggles",
    venue: "Frontiers in Education · Digital Education",
    href: "https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2026.1998746/abstract",
    note: "Accepted 20 October 2026; final formatted version forthcoming.",
    topics: ["ai", "llm", "education"],
    summary: "Proposes a framework connecting AI delegation with observable evidence of human supervision. It provides a classification procedure, supervision record, and analytic rubric; its constructed examples do not establish measured learning gains.",
    projectLinks: [{ slug: "building-ai-solutions", relationship: "related" }],
    otherLinks: [{ label: "Earlier preprint", href: "https://arxiv.org/abs/2608.07779" }],
  },
  {
    id: "ai-classsims-2026", year: 2026, kind: "conference",
    title: "AI-ClassSims: Multi-Agent LLM Classroom Simulation with Real-Time Feedback for Teacher Training",
    authors: "M. Memari, K. Ruggles", venue: "IETC 2026 · IEEE",
    href: "https://doi.org/10.1109/IETC69527.2026.11568604", topics: ["ai", "llm", "education"],
    summary: "Presents a classroom simulator with multiple student agents, persona memory, group discussion, and instructional feedback. Initial evaluation examines simulated behavior and language rather than establishing teacher-training efficacy through a controlled study.",
    projectLinks: [{ slug: "ai-classsims", relationship: "direct" }],
  },
  {
    id: "datagovai-2026", year: 2026, kind: "conference",
    title: "DataGovAI: A Multi-Agent RAG System for Government Data Retention Compliance with Privacy-Preserving Evaluation",
    authors: "M. Memari, G. Rudolph, B. Burns, E. Howlett, C. Bramwell, G. Mcewan", venue: "IETC 2026 · IEEE",
    href: "https://doi.org/10.1109/IETC69527.2026.11568649", topics: ["ai", "llm", "governance"],
    summary: "Examines how retrieval-augmented generation and coordinated agents can support government records-retention guidance. The research emphasizes source-grounded responses and privacy-preserving evaluation.",
    projectLinks: [{ slug: "datagovai", relationship: "direct" }],
  },
  {
    id: "teacher-preparation-feedback-2026", year: 2026, kind: "conference",
    title: "Accelerating Feedback, Preserving Expertise: AI-Assisted Evaluation in Teacher Preparation",
    authors: "K. Ruggles, M. Memari", venue: "SITE 2026 · AACE / LearnTechLib",
    href: "https://www.learntechlib.org/p/2129225/", topics: ["ai", "llm", "education"],
    summary: "Introduces AI-STER, a human-in-the-loop approach combining language models with standards-aligned rubrics for student-teacher assessment. It focuses on supporting feedback while preserving educators’ evaluative judgment.",
    projectLinks: [{ slug: "ai-ster", relationship: "direct" }],
  },
  {
    id: "elementary-stem-review-2025", year: 2025, kind: "preprint",
    title: "Artificial Intelligence in Elementary STEM Education: A Systematic Review of Current Applications and Future Challenges",
    authors: "M. Memari, K. Ruggles", venue: "arXiv:2511.00105",
    href: "https://arxiv.org/abs/2511.00105", topics: ["ai", "education"],
    summary: "Synthesizes AI applications in elementary STEM, including tutoring, learning analytics, assessment, computer vision, and robotics. It identifies questions around developmental suitability, privacy, equity, and teacher-centered implementation.",
    projectLinks: [{ slug: "ai-classsims", relationship: "related" }],
  },
  {
    id: "education-ai-trends-2025", year: 2025, kind: "conference",
    title: "The Role of AI in Transforming Education: A Systematic Review of Trends",
    authors: "Q. E. A. Ratul, E. Zaman, S. Das, M. Memari", venue: "IETC 2025 · IEEE, pp. 1–6",
    href: "https://doi.org/10.1109/IETC64455.2025.11039329", topics: ["ai", "education"],
    summary: "Reviews trends in the use of artificial intelligence in education. This work contributes a broader view of the field alongside the application-specific studies in teacher preparation and classroom simulation.",
  },
  {
    id: "meal-planning-agent-2025", year: 2025, kind: "conference",
    title: "Intelligent Meal Planning: A Generative LLM-Based Autonomous Agent Application",
    authors: "E. Howlett, J. Catlett, M. Memari", venue: "IETC 2025 · IEEE, pp. 1–5",
    href: "https://doi.org/10.1109/IETC64455.2025.11039478", topics: ["ai", "llm"],
    summary: "Explores a generative language-model agent application for meal planning. It extends the agent research line to a practical planning task.",
  },
  {
    id: "project-based-stem-learning-2025", year: 2025, kind: "conference",
    title: "Enhancing STEM Education through Project-Based Learning: Leveraging AI Tools in Undergraduate Courses",
    authors: "M. Memari, H. Petit, N. Olson, F. Ahmadi", venue: "HUIC STEM/STEAM & Education 2025",
    href: "https://huichawaii.org/wp-content/uploads/2025/07/Memari-Majid-2025-HUIC-STEM.pdf", topics: ["ai", "vision", "education", "engineering"],
    summary: "Describes a project-based undergraduate capstone using YOLOv12 and automated labeling for road-hazard detection. It examines AI tools as support for data preparation, experimentation, interdisciplinary collaboration, and reflection.",
    projectLinks: [{ slug: "building-ai-solutions", relationship: "related" }],
  },
  {
    id: "infrared-blade-testing-2025", year: 2025, kind: "journal",
    title: "Enhanced Non-Destructive Testing of Small Wind Turbine Blades Using Infrared Thermography",
    authors: "M. Memari, M. Shekaramiz, M. A. S. Masoum, A. C. Seibi", venue: "Machines, 13(2), 108",
    href: "https://doi.org/10.3390/machines13020108", topics: ["ai", "vision", "engineering"],
    summary: "Studies thermal-image defect detection and localization on small wind-turbine blades, including YOLOv8 and YOLOv9 methods. The controlled experiments support further investigation toward drone-based inspection.",
    projectLinks: [{ slug: "wind-turbine-inspection", relationship: "direct" }],
  },
  {
    id: "pedestal-fan-inspection-2024", year: 2024, kind: "journal",
    title: "Deep Learning for Indoor Pedestal Fan Blade Inspection: Utilizing Low-Cost Autonomous Drones in an Educational Setting",
    authors: "A. A. Rodriguez, M. Davis, J. Zander, E. Nazario Dejesus, M. Shekaramiz, M. Memari, M. A. S. Masoum", venue: "Drones, 8(7), 298",
    href: "https://doi.org/10.3390/drones8070298", topics: ["ai", "vision", "education", "engineering"],
    summary: "Uses small drones and pedestal fans as a low-cost, controlled surrogate for blade inspection. Students apply computer vision and machine learning to simulated defects through a hands-on engineering project.",
    projectLinks: [{ slug: "wind-turbine-inspection", relationship: "related" }],
  },
  {
    id: "blade-inspection-review-2024", year: 2024, kind: "journal",
    title: "Review on the Advancements in Wind Turbine Blade Inspection: Integrating Drone and Deep Learning Technologies for Enhanced Defect Detection",
    authors: "M. Memari, P. Shakya, M. Shekaramiz, A. C. Seibi, M. A. S. Masoum", venue: "IEEE Access, 12, 33236–33282",
    href: "https://doi.org/10.1109/ACCESS.2024.3371493", topics: ["ai", "vision", "engineering"],
    summary: "Reviews drone inspection, image processing, deep learning, and structural-integrity approaches for wind-turbine blades. It connects sensing and automated defect detection with practical blade-maintenance challenges.",
    projectLinks: [{ slug: "wind-turbine-inspection", relationship: "direct" }],
  },
  {
    id: "rgb-thermal-fusion-2024", year: 2024, kind: "journal",
    title: "Data Fusion and Ensemble Learning for Advanced Anomaly Detection Using Multi-Spectral RGB and Thermal Imaging of Small Wind Turbine Blades",
    authors: "M. Memari, M. Shekaramiz, M. A. S. Masoum, A. C. Seibi", venue: "Energies, 17(3), 673",
    href: "https://doi.org/10.3390/en17030673", topics: ["ai", "vision", "engineering"],
    summary: "Combines RGB and thermal imaging with deep-learning classifiers and ensemble methods for small-blade anomaly detection. It compares models and image-fusion approaches using controlled experimental data.",
    projectLinks: [{ slug: "wind-turbine-inspection", relationship: "direct" }],
  },
  {
    id: "blade-fault-localization-2024", year: 2024, kind: "journal",
    title: "Identification and Localization of Wind Turbine Blade Faults Using Deep Learning",
    authors: "M. Davis, E. Nazario Dejesus, M. Shekaramiz, J. Zander, M. Memari", venue: "Applied Sciences, 14(14), 6319",
    href: "https://doi.org/10.3390/app14146319", topics: ["ai", "vision", "engineering"],
    summary: "Compares YOLO and Mask R-CNN architectures for locating cracks, holes, and erosion in small-scale wind-turbine blades. The work extends image classification toward identifying where defects occur.",
    projectLinks: [{ slug: "wind-turbine-inspection", relationship: "direct" }],
  },
  {
    id: "thermal-blade-detection-2024", year: 2024, kind: "conference",
    title: "Wind Turbine Blade Fault Detection via Thermal Imaging Using Deep Learning",
    authors: "B. Collier, M. Memari, M. Shekaramiz, M. A. S. Masoum, A. Seibi", venue: "IETC 2024 · IEEE, pp. 23–28",
    href: "https://doi.org/10.1109/IETC61393.2024.10564364", topics: ["ai", "vision", "engineering"],
    summary: "Applies deep-learning methods to thermal imagery for wind-turbine blade fault detection. This conference contribution forms part of the broader imaging and inspection research developed in the related journal studies.",
    projectLinks: [{ slug: "wind-turbine-inspection", relationship: "direct" }],
  },
  {
    id: "generative-evaluation-2024", year: 2024, kind: "preprint",
    title: "Advancing Generative Model Evaluation: A Novel Algorithm for Realistic Image Synthesis and Comparison in OCR System",
    authors: "M. Memari, K. R. Ahmed, S. Rahimi, N. A. Golilarz", venue: "arXiv:2402.17204",
    href: "https://arxiv.org/abs/2402.17204", topics: ["ai", "vision"],
    summary: "Introduces a procedure for comparing synthetic images, focusing on Arabic handwritten digits and OCR. It refines image-quality evaluation to support generative-model comparison and improvement.",
    projectLinks: [{ slug: "synthetic-image-evaluation", relationship: "direct" }],
  },
  {
    id: "generative-ocr-2023", year: 2023, kind: "conference",
    title: "Generative Data Augmentation for Arabic Handwritten Digit Recognition Boosting Real-time OCR Capabilities",
    authors: "M. Memari, K. R. Ahmed, S. Rahimi", venue: "AIPR 2023 · ACM, pp. 312–323",
    href: "https://doi.org/10.1145/3641584.3641631", topics: ["ai", "vision"],
    summary: "Investigates generative data augmentation for Arabic handwritten-digit recognition and real-time OCR. It connects synthetic-image generation with recognition and image-quality evaluation.",
    projectLinks: [{ slug: "synthetic-image-evaluation", relationship: "direct" }],
  },
  {
    id: "computer-vision-review-2023", year: 2023, kind: "journal",
    title: "Advances in Computer Vision and Image Processing for Pattern Recognition: A Comprehensive Review",
    authors: "M. Memari", venue: "International Journal of Engineering and Applied Sciences, 11(05), 2896–2901",
    href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4577859", topics: ["ai", "vision"],
    note: "Link opens the author manuscript on SSRN.",
    summary: "Surveys methods and applications across computer vision, image processing, and pattern recognition. It provides a broad methodological overview rather than a single application study.",
  },
  {
    id: "synthetic-image-dissertation-2023", year: 2023, kind: "dissertation",
    title: "A New Approach to Synthetic Image Evaluation", authors: "M. Memari", venue: "Ph.D. dissertation · Southern Illinois University Carbondale",
    href: "https://opensiuc.lib.siu.edu/dissertations/2181/", topics: ["ai", "vision"],
    summary: "Investigates conditional VAE and GAN image generation for Arabic handwritten-digit recognition. It develops the Synthetic Image Evaluation Procedure to connect image quality, feature extraction, and OCR experiments.",
    projectLinks: [{ slug: "synthetic-image-evaluation", relationship: "direct" }],
  },
  {
    id: "argane-genome-2020", year: 2020, kind: "journal",
    title: "First draft genome assembly of the Argane tree (Argania spinosa)", authors: "S. Khayi et al.", venue: "F1000Research, 7, 1310 · Version 2",
    href: "https://doi.org/10.12688/f1000research.15719.2", topics: ["biology"],
    note: "First published in 2018; revised version published in 2020.",
    summary: "Reports a draft genome assembly for the Argan tree and provides a resource for genomic analysis. The publisher credits Majid with investigation and software contributions.",
  },
  {
    id: "news-sentiment-thesis-2017", year: 2017, kind: "thesis",
    title: "Predicting the Stock Market Using News Sentiment Analysis", authors: "M. Memari", venue: "M.S. thesis · Southern Illinois University Carbondale",
    href: "https://opensiuc.lib.siu.edu/theses/2442/", topics: ["ai"],
    note: "Presented in 2017; the university repository records the award in 2018.",
    summary: "Compares classifiers and ensemble methods using GDELT news/event signals and historical Dow Jones prices from March 2015 to October 2017. This is historical predictive research rather than a live trading system.",
    projectLinks: [{ slug: "news-sentiment-market-prediction", relationship: "direct" }],
  },
];
