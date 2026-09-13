import type { Metadata } from "next";
import { FAQS } from "@/lib/faq";
import { MAJID } from "@/lib/majid";
import { SITE, SITE_URL } from "@/lib/site";

export const INDEXABLE_PATHS = ["/", "/about", "/teaching", "/publications", "/contact"] as const;

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
  MAJID.nvidiaInstructorDirectory,
] as const;

const COURSE_NAME = `${MAJID.cs4720r.title}: ${MAJID.cs4720r.tagline}`;
const COURSE_DESCRIPTION = `${MAJID.cs4720r.summary} ${MAJID.cs4720r.catalog}`;

export const PAGE_COPY = {
  home: {
    title: "Majid Memari — AI Scientist & Solution Architect",
    description:
      "Majid Memari, AI Scientist and Solution Architect. PhD in Gen AI (Computer Science, SIU 2023). Applied AI and AI Entrepreneurship at Utah Valley University. 11 years applied AI, 374 Scholar citations, 2026 AI Utah 100 honoree.",
  },
  about: {
    title: "About Majid Memari — AI Scientist & Solution Architect",
    description:
      "About Majid Memari: AI Scientist and Solution Architect; Assistant Professor of Computer Science at UVU. Applied AI, Gen AI, and AI Entrepreneurship. 2026 AI Utah 100 honoree — academia, industry, and community.",
  },
  teaching: {
    title: "AI Entrepreneurship: Build and Launch AI-Powered Businesses",
    description:
      "Majid Memari designed and teaches AI Entrepreneurship: Build and Launch AI-Powered Businesses at Utah Valley University. Applied AI and Gen AI teaching, plus NVIDIA DLI workshops. No catalog numbers.",
  },
  publications: {
    title: "Majid Memari Research — Applied AI, Gen AI, 374 Citations",
    description:
      "Applied AI and Gen AI research by Majid Memari: 374 Google Scholar citations (snapshot 2026-08-21). Wind-turbine UAV inspection, GridEye, DataGovAI, and the Capability Ladder. Ph.D. Computer Science, SIU 2023.",
  },
  contact: {
    title: "Contact Majid Memari — AI Scientist at UVU",
    description:
      "Contact Majid Memari, AI Scientist and Solution Architect at Utah Valley University — applied AI teaching, Gen AI research, or AI consulting via Nexus AI Solutions. Orem, Utah.",
  },
} as const;

export function pageMetadata(
  page: keyof typeof PAGE_COPY,
  path: (typeof INDEXABLE_PATHS)[number],
  ogType: "website" | "profile" = "website",
): Metadata {
  const copy = PAGE_COPY[page];
  return {
    title: { absolute: copy.title },
    description: copy.description,
    alternates: { canonical: path },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: path,
      type: ogType,
    },
    twitter: {
      title: copy.title,
      description: copy.description,
    },
  };
}

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
    jobTitle: [MAJID.headlineRole, MAJID.jobTitle],
    award: MAJID.aiUtah100.label,
    description: `${MAJID.headlineRole}. ${MAJID.shortBio} Ph.D. in Computer Science (SIU 2023) with gen-AI thesis work. Teaches ${COURSE_NAME}. ${MAJID.aiUtah100.label}. Research includes wind-turbine UAV inspection, GridEye, and public-sector DataGovAI.`,
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
        url: MAJID.nvidiaInstructorDirectory,
      },
      { "@type": "Organization", name: "Nexus AI Solutions LLC", url: MAJID.nexusSite },
      {
        "@type": "Organization",
        name: "University of Utah One-U Responsible AI Initiative",
        url: "https://rai.utah.edu/",
      },
    ],
    knowsAbout: [
      "AI Scientist",
      "AI Solution Architect",
      "Solution Architect",
      "Applied AI",
      "Gen AI",
      "Generative AI",
      "AI Utah 100",
      "AI Entrepreneurship",
      "Build and Launch AI-Powered Businesses",
      "Machine Learning",
      "Causal Inference",
      "Artificial Intelligence",
      "Large Language Models",
      "Agentic AI",
      "Deep Learning",
      "Computer Vision",
      "Wind-turbine inspection",
      "UAV drone imaging",
      "GridEye",
      "DataGovAI",
      "Public-sector AI",
      "AI consulting",
      "Team training",
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
    description: PAGE_COPY.home.description,
    inLanguage: "en-US",
    publisher: { "@id": `${SITE_URL}/#person` },
  };
}

/** UVU course — no catalog codes. Provider is the university, not Nexus. */
export function courseJsonLd() {
  return {
    "@type": "Course",
    "@id": `${SITE_URL}/teaching#ai-entrepreneurship`,
    name: COURSE_NAME,
    description: COURSE_DESCRIPTION,
    url: `${SITE_URL}/teaching`,
    inLanguage: "en-US",
    provider: {
      "@type": "CollegeOrUniversity",
      name: MAJID.university,
      url: "https://www.uvu.edu/",
    },
    instructor: { "@id": `${SITE_URL}/#person` },
    hasCourseInstance: {
      "@type": "CourseInstance",
      name: COURSE_NAME,
      courseMode: "onsite",
      location: {
        "@type": "Place",
        name: MAJID.university,
        address: {
          "@type": "PostalAddress",
          addressLocality: SITE.addressLocality,
          addressRegion: SITE.addressRegion,
          addressCountry: SITE.addressCountry,
        },
      },
    },
  };
}

export function faqJsonLd() {
  return {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    url: `${SITE_URL}/#faq`,
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

export function publicationListJsonLd() {
  return {
    "@type": "ItemList",
    "@id": `${SITE_URL}/publications#list`,
    name: "Selected publications by Dr. Majid Memari",
    itemListElement: MAJID.publications.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "ScholarlyArticle",
        name: p.title,
        author: p.authors,
        datePublished: String(p.year),
        url: p.href,
        identifier: p.venue,
      },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
