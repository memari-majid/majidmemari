import { hasLongDash, plainPunctuation } from "@/lib/plain-punctuation";
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

/**
 * Every JSON-LD string on the site is serialized here, so the copy rule
 * against long dashes is enforced here rather than asserted in a style guide.
 *
 * The structured data is quoted by search engines and assistants, where an em
 * dash reads as machine-written prose, and it is assembled from data modules
 * (`lib/faq.ts`, `lib/majid.ts`) whose visible body copy still carries dashes
 * by design. Rewriting them at the boundary keeps the page copy those modules
 * feed exactly as its owners wrote it while the emitted graph stays plain, and
 * a dash added to the copy later cannot leak back into the structured data.
 *
 * Only strings that actually contain one are touched, so this is a provable
 * no-op for every other value, URLs and `@id`s included.
 */
function plainDashes<T>(value: T): T {
  if (typeof value === "string") {
    return (hasLongDash(value) ? plainPunctuation(value) : value) as T;
  }
  if (Array.isArray(value)) return value.map(plainDashes) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, v]) => [key, plainDashes(v)]),
    ) as T;
  }
  return value;
}

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
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(plainDashes({ "@context": "https://schema.org", "@graph": graph })),
      }}
    />
  );
}
