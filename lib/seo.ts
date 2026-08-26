import { MAJID } from "@/lib/majid";
import { SITE, SITE_URL } from "@/lib/site";

export const INDEXABLE_PATHS = ["/", "/about", "/teaching", "/publications"] as const;

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
  MAJID.nexusSite,
  MAJID.uvuDirectory,
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
    email: SITE.uvuEmail,
    telephone: SITE.uvuPhone,
    sameAs: [...PERSON_SAME_AS],
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.addressLocality,
      addressRegion: SITE.addressRegion,
      addressCountry: SITE.addressCountry,
    },
    worksFor: {
      "@type": "CollegeOrUniversity",
      name: MAJID.university,
      url: "https://www.uvu.edu/",
    },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Southern Illinois University Carbondale",
    },
    affiliation: [
      { "@type": "CollegeOrUniversity", name: "Utah Valley University", url: "https://www.uvu.edu/" },
      { "@type": "Organization", name: "Gary R. Herbert Institute for Public Policy" },
      {
        "@type": "Organization",
        name: "NVIDIA Deep Learning Institute",
        url: "https://www.nvidia.com/en-us/training/",
      },
      { "@type": "Organization", name: "Nexus AI Solutions LLC", url: MAJID.nexusSite },
      { "@type": "Organization", name: "University of Utah One-U Responsible AI Initiative", url: "https://rai.utah.edu/" },
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
      "EdTech",
      "Responsible AI",
      "Utah Valley University",
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
