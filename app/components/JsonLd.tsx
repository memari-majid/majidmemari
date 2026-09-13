import {
  breadcrumbJsonLd,
  courseJsonLd,
  faqJsonLd,
  PAGE_COPY,
  personJsonLd,
  publicationListJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

type JsonLdPage = "/" | "/about" | "/teaching" | "/publications" | "/contact";

export function JsonLd({ page = "/" }: { page?: JsonLdPage }) {
  const url = page === "/" ? SITE_URL : `${SITE_URL}${page}`;
  const graph: Record<string, unknown>[] = [personJsonLd(), websiteJsonLd()];

  if (page === "/") {
    graph.push(
      {
        "@type": "ProfilePage",
        "@id": `${SITE_URL}#page`,
        url: SITE_URL,
        name: PAGE_COPY.home.title,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#person` },
        mainEntity: { "@id": `${SITE_URL}/#person` },
        inLanguage: "en-US",
      },
      courseJsonLd(),
      faqJsonLd(),
    );
  } else if (page === "/about") {
    graph.push(
      {
        "@type": "ProfilePage",
        "@id": `${url}#page`,
        url,
        name: PAGE_COPY.about.title,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#person` },
        mainEntity: { "@id": `${SITE_URL}/#person` },
        inLanguage: "en-US",
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
      ]),
    );
  } else if (page === "/teaching") {
    graph.push(
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        url,
        name: PAGE_COPY.teaching.title,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/teaching#ai-entrepreneurship` },
        mainEntity: { "@id": `${SITE_URL}/teaching#ai-entrepreneurship` },
        inLanguage: "en-US",
      },
      courseJsonLd(),
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Teaching", path: "/teaching" },
      ]),
    );
  } else if (page === "/publications") {
    graph.push(
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: "Research and publications",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#person` },
        mainEntity: { "@id": `${SITE_URL}/publications#list` },
        inLanguage: "en-US",
      },
      publicationListJsonLd(),
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Publications", path: "/publications" },
      ]),
    );
  } else {
    graph.push(
      {
        "@type": "ContactPage",
        "@id": `${url}#page`,
        url,
        name: "Contact Majid Memari",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#person` },
        inLanguage: "en-US",
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Contact", path: "/contact" },
      ]),
    );
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
