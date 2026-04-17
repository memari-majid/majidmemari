export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://majidmemari.com";

export const SITE = {
  name: "Majid Memari",
  shortName: "Majid Memari",
  fullName: "Dr. Majid Memari",
  role: "AI Engineer · Educator · NVIDIA Ambassador",
  description:
    "Personal site of Dr. Majid Memari — AI engineer, educator, and NVIDIA Ambassador. Assistant Professor at Utah Valley University and Principal AI Architect at the Gary R. Herbert Institute for Public Policy. Building LLMs, agents, EdTech, and public-sector AI from Utah.",
  email: "memari.majid@hotmail.com",
  emailDisplay: "memari.majid@hotmail.com",
  addressLocality: "Sandy",
  addressRegion: "UT",
  addressCountry: "US",
  linkedin: "https://www.linkedin.com/in/majid-memari",
  linkedinHandle: "majid-memari",
  github: "https://github.com/memari-majid",
  githubHandle: "memari-majid",
  scholar: "https://scholar.google.com/citations?user=ZvFHa5cAAAAJ",
} as const;
