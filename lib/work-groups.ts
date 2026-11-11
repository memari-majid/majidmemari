import { PROJECTS, type Project } from "@/lib/projects";
import { PUBLICATIONS, type Publication } from "@/lib/publications";

type WorkGroupDefinition = {
  id: string;
  title: string;
  description: string;
  projectSlugs: readonly string[];
  publicationIds: readonly string[];
};

export type WorkGroup = {
  id: string;
  title: string;
  description: string;
  projects: Project[];
  publications: Publication[];
};

/** Each work has one primary home; its existing topic tags retain other relevant focuses. */
const WORK_GROUP_DEFINITIONS = [
  {
    id: "computer-vision",
    title: "Computer Vision",
    description: "Visual recognition, synthetic images, and imaging methods for engineering inspection.",
    projectSlugs: ["wind-turbine-inspection", "synthetic-image-evaluation", "grideye"],
    publicationIds: [
      "infrared-blade-testing-2025",
      "pedestal-fan-inspection-2024",
      "blade-inspection-review-2024",
      "rgb-thermal-fusion-2024",
      "blade-fault-localization-2024",
      "thermal-blade-detection-2024",
      "generative-evaluation-2024",
      "generative-ocr-2023",
      "computer-vision-review-2023",
      "synthetic-image-dissertation-2023",
    ],
  },
  {
    id: "ai-education",
    title: "AI & Education",
    description: "AI-supported learning, teacher preparation, assessment, and curriculum.",
    projectSlugs: ["building-ai-solutions", "ai-classsims", "ai-ster", "course-chatbot", "nvidia-workshop-ta"],
    publicationIds: [
      "capability-ladder-2026",
      "ai-classsims-2026",
      "teacher-preparation-feedback-2026",
      "elementary-stem-review-2025",
      "education-ai-trends-2025",
      "project-based-stem-learning-2025",
    ],
  },
  {
    id: "language-models",
    title: "Language Models & Agents",
    description: "Language-model applications for specialist guidance, reflection, and planning.",
    projectSlugs: ["datagovai", "carewise", "willow"],
    publicationIds: ["datagovai-2026", "meal-planning-agent-2025"],
  },
  {
    id: "finance-analytics",
    title: "Finance & Analytics",
    description: "Bookkeeping, financial dashboards, and historical predictive research.",
    projectSlugs: ["ai-cpa", "finhub", "news-sentiment-market-prediction"],
    publicationIds: ["news-sentiment-thesis-2017"],
  },
  {
    id: "computational-biology",
    title: "Computational Biology",
    description: "Genome assembly and computational contributions to biological research.",
    projectSlugs: [],
    publicationIds: ["argane-genome-2020"],
  },
] as const satisfies readonly WorkGroupDefinition[];

function resolveWorkGroups(): WorkGroup[] {
  const projectBySlug = new Map(PROJECTS.map((project) => [project.slug, project]));
  const publicationById = new Map(PUBLICATIONS.map((publication) => [publication.id, publication]));
  const assignedProjects = new Set<string>();
  const assignedPublications = new Set<string>();
  const assignedGroups = new Set<string>();

  const groups = WORK_GROUP_DEFINITIONS.map((group) => {
    if (assignedGroups.has(group.id)) throw new Error(`Duplicate work group: ${group.id}`);
    assignedGroups.add(group.id);

    const projects = group.projectSlugs.map((slug) => {
      const project = projectBySlug.get(slug);
      if (!project) throw new Error(`Unknown project in work group ${group.id}: ${slug}`);
      if (assignedProjects.has(slug)) throw new Error(`Project assigned to multiple work groups: ${slug}`);
      assignedProjects.add(slug);
      return project;
    });
    const publications = group.publicationIds.map((id) => {
      const publication = publicationById.get(id);
      if (!publication) throw new Error(`Unknown publication in work group ${group.id}: ${id}`);
      if (assignedPublications.has(id)) throw new Error(`Publication assigned to multiple work groups: ${id}`);
      assignedPublications.add(id);
      return publication;
    });
    return { id: group.id, title: group.title, description: group.description, projects, publications };
  });

  const missingProjects = PROJECTS.filter((project) => !assignedProjects.has(project.slug)).map((project) => project.slug);
  const missingPublications = PUBLICATIONS.filter((publication) => !assignedPublications.has(publication.id)).map((publication) => publication.id);
  if (missingProjects.length > 0 || missingPublications.length > 0) {
    throw new Error(`Unclassified work: projects [${missingProjects.join(", ")}]; publications [${missingPublications.join(", ")}]`);
  }
  return groups;
}

export const WORK_GROUPS = resolveWorkGroups();
