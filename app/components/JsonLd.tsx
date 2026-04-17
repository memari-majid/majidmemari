import { SITE, SITE_URL } from "@/lib/site";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.fullName,
    alternateName: SITE.shortName,
    url: SITE_URL,
    image: `${SITE_URL}/majid-memari.png`,
    jobTitle: "Assistant Professor · Principal AI Architect · NVIDIA Ambassador",
    description: SITE.description,
    email: `mailto:${SITE.email}`,
    sameAs: [SITE.linkedin, SITE.github, SITE.scholar],
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.addressLocality,
      addressRegion: SITE.addressRegion,
      addressCountry: SITE.addressCountry,
    },
    affiliation: [
      {
        "@type": "CollegeOrUniversity",
        name: "Utah Valley University",
        url: "https://www.uvu.edu/",
      },
      {
        "@type": "Organization",
        name: "Gary R. Herbert Institute for Public Policy",
      },
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
      "Public-Sector AI",
      "EdTech",
      "Responsible AI",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
