/** Public course context shared by the iframe, request handler and retrieval. */
export const COURSE_PREFIX = "/teaching/ai-solutions/";
const UNIT_TITLES = [
  "AI and a useful business task", "Discover the need", "Choose and scope a solution",
  "Design the workflow", "Build the first usable version", "Design a fair test",
  "Pilot, revise, and retest", "Calculate value and capacity", "Shape the offer",
  "Find users and sell or secure adoption", "Make delivery dependable", "Demonstrate and defend",
];
const MILESTONE_TITLES = ["Problem and feasible scope", "First usable solution", "Pilot and learning", "Viability and route to users", "Demonstration and handoff"];
const SUPPORT_TITLES: Record<string, string> = { "index.html": "Course overview", "resources.html": "Course resources", "project.html": "Your project record", "example.html": "Worked project example", "finish.html": "Course finish", "readings.html": "Course readings", "instructor.html": "Instructor information" };

/** Public edition layout, not a read of an institution's settings or learner records. */
export const CANVAS_ASYNC_LAYOUT = {
  unitCount: UNIT_TITLES.length,
  choiceQuestionsPerQuiz: 3,
  pointsPerChoice: 1,
  projectUpdatePoints: 0,
  formativeGroupWeight: 0,
  peerExchangeUnits: [3, 7, 12],
  milestoneWeights: [15, 20, 25, 15, 25],
  finalSharedPoints: 60,
  individualExamPoints: 40,
} as const;

export function normalizeCoursePage(value: unknown): string {
  if (typeof value !== "string") return "";
  return /^(?:unit-(?:0[1-9]|1[0-2])|milestone-[1-5]|index|resources|project|example|finish|readings|instructor)\.html$/.test(value) ? value : "";
}

export function coursePageLabel(value: unknown): string {
  const page = normalizeCoursePage(value);
  if (page.startsWith("unit-")) { const number = Number(page.slice(5, 7)); return `Unit ${number}: ${UNIT_TITLES[number - 1]}`; }
  if (page.startsWith("milestone-")) { const number = Number(page.slice(10, 11)); return `Milestone ${number}: ${MILESTONE_TITLES[number - 1]}`; }
  return SUPPORT_TITLES[page] ?? "Your course";
}

/** Permit course evidence links only; source URLs never become external navigation. */
export function courseEvidenceLink(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2000) return undefined;
  try {
    const url = new URL(value, "https://www.majidmemari.com");
    if (!["https://www.majidmemari.com", "https://majidmemari.com"].includes(url.origin) || url.username || url.password) return undefined;
    if (!url.pathname.startsWith(COURSE_PREFIX) || !/^[a-z0-9/-]+\.html$/.test(url.pathname.slice(COURSE_PREFIX.length))) return undefined;
    return `${url.pathname}${url.hash}`;
  } catch { return undefined; }
}

/** Canvas keeps navigation inside its learning path; citations remain readable labels. */
export function courseEvidenceNavigation(value: unknown, canvasDelivery = false): string | undefined {
  return canvasDelivery ? undefined : courseEvidenceLink(value);
}
