/** Canonical host matches the live 200 URL (apex redirects to www). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.majidmemari.com";

export const SITE = {
  name: "Majid Memari",
  shortName: "Majid Memari",
  fullName: "Dr. Majid Memari",
  displayName: "Majid (MJ) Memari",
  role: "AI teaching · Workshops · Mentorship",
  description:
    "AI courses, interactive simulations, practical workshops, and mentorship by Majid Memari. Learn to build, evaluate, and apply AI solutions to real-world problems. No prerequisites for Building AI Solutions.",
  linkedin: "https://www.linkedin.com/in/majid-memari",
  linkedinHandle: "majid-memari",
  github: "https://github.com/memari-majid",
  githubHandle: "memari-majid",
  scholar: "https://scholar.google.com/citations?user=LQI4T24AAAAJ&hl=en",
  aiUtah100: "https://www.aiutah.org/ai-utah-100/",
} as const;
