import { MAJID } from "@/lib/majid";
import { SITE, SITE_URL } from "@/lib/site";
import { PROTOTYPES } from "@/lib/prototypes";

export const INDEXABLE_PATHS = [
  "/",
  "/about",
  "/teaching",
  "/publications",
  "/prototypes",
  ...PROTOTYPES.map(({ slug }) => `/prototypes/${slug}`),
  "/teaching/ai-solutions/index.html",
] as const;

export function absoluteUrl(path = "/"): string {
  if (path === "/") return SITE_URL;
  return `${SITE_URL}${path}`;
}

export const PERSON_SAME_AS = [
  SITE.linkedin,
  SITE.github,
  SITE.scholar,
  MAJID.orcid,
  MAJID.researchGate,
  MAJID.aiUtah100.url,
] as const;

export function personJsonLd() {
  return {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: SITE.fullName,
    givenName: "Majid",
    familyName: "Memari",
    additionalName: "MJ",
    honorificPrefix: "Dr.",
    honorificSuffix: "Ph.D.",
    alternateName: [SITE.shortName, MAJID.displayName, "Majid Memari PhD"],
    url: SITE_URL,
    image: `${SITE_URL}/majid-memari.png`,
    jobTitle: MAJID.jobTitle,
    description: SITE.description,
    sameAs: [...PERSON_SAME_AS],
    affiliation: [
      {
        "@type": "Organization",
        name: "NVIDIA Deep Learning Institute",
        url: "https://www.nvidia.com/en-us/training/",
      },
    ],
    knowsAbout: [
      "Artificial Intelligence",
      "Large Language Models",
      "Agentic AI",
      "Deep Learning",
      "Computer Vision",
      "Drone Imaging",
      "AI consulting",
      "Team training",
      "Workshops",
      "Public-Sector AI",
      "AI Education",
      "Business AI Solutions",
      "Responsible AI",
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Majid Memari",
    alternateName: ["Dr. Majid Memari", "Majid (MJ) Memari"],
    url: SITE_URL,
    description: SITE.description,
    inLanguage: "en-US",
    publisher: { "@id": `${SITE_URL}/#person` },
  };
}
