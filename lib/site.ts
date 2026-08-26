/** Canonical host matches the live 200 URL (apex redirects to www). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.majidmemari.com";

export const SITE = {
  name: "Majid Memari",
  shortName: "Majid Memari",
  fullName: "Dr. Majid Memari",
  displayName: "Majid (MJ) Memari",
  role: "Academia · Industry · Community",
  description:
    "Personal site of Dr. Majid Memari. Academia: Assistant Professor of Computer Science at Utah Valley University. Industry: AI consulting and team training (Clarion AI Partners; Nexus AI Solutions; NVIDIA DLI instructor). Community: Gary R. Herbert Institute for Public Policy and the 2026 AI Utah 100.",
  email: "memari.majid@hotmail.com",
  emailDisplay: "memari.majid@hotmail.com",
  uvuEmail: "mmemari@uvu.edu",
  uvuPhone: "(801) 863-5912",
  uvuOffice: "SE 407J",
  bookingUrl:
    "https://bookings.cloud.microsoft/bookwithme/user/af8e2af355104ba38fdd04c7fb463f26%40uvu.edu?anonymous&ismsaljsauthenabled",
  addressLocality: "Orem",
  addressRegion: "UT",
  addressCountry: "US",
  linkedin: "https://www.linkedin.com/in/majid-memari",
  linkedinHandle: "majid-memari",
  github: "https://github.com/memari-majid",
  githubHandle: "memari-majid",
  scholar: "https://scholar.google.com/citations?user=LQI4T24AAAAJ&hl=en",
  aiUtah100: "https://www.aiutah.org/ai-utah-100/",
} as const;
