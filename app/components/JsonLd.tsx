import { personJsonLd, websiteJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

export function JsonLd({ page = "/" }: { page?: string }) {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      personJsonLd(),
      websiteJsonLd(),
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}${page === "/" ? "" : page}#page`,
        url: page === "/" ? SITE_URL : `${SITE_URL}${page}`,
        name: "Majid Memari",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#person` },
        mainEntity: { "@id": `${SITE_URL}/#person` },
        inLanguage: "en-US",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
