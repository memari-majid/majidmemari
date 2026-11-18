import snapshot from "../content/business-analytics/snapshot.json" with { type: "json" };

export const analyticsBasePath = "/teaching/ai-in-business-analytics";
export const analyticsRepositoryUrl = snapshot.repository;
export const analyticsCommit = snapshot.commit;
export const analyticsRevisionUrl = `${analyticsRepositoryUrl}/commit/${analyticsCommit}`;

export type AnalyticsDocument = {
  sourcePath: string;
  slug: string[];
  title: string;
  markdown: string;
  href: string;
  githubUrl: string;
};

function githubDocumentUrl(sourcePath: string) {
  const kind = sourcePath.endsWith("/") || !sourcePath ? "tree" : "blob";
  const encodedPath = sourcePath.split("/").map(encodeURIComponent).join("/");
  return `${analyticsRepositoryUrl}/${kind}/${analyticsCommit}/${encodedPath}`;
}

export const analyticsDocuments: readonly AnalyticsDocument[] = snapshot.documents.map(
  ({ path, title, markdown }) => {
    const slug = path.replace(/\.md$/, "").toLowerCase().split("/");
    return {
      sourcePath: path,
      slug,
      title,
      markdown,
      href: `${analyticsBasePath}/${slug.join("/")}`,
      githubUrl: githubDocumentUrl(path),
    };
  },
);

const documentByPath = new Map(analyticsDocuments.map((document) => [document.sourcePath, document]));
const documentBySlug = new Map(analyticsDocuments.map((document) => [document.slug.join("/"), document]));

export function getAnalyticsDocument(slug: readonly string[]): AnalyticsDocument | undefined {
  return documentBySlug.get(slug.join("/"));
}

export function resolveAnalyticsMarkdownHref(sourcePath: string, href: string): string {
  // Fragments and queries apply to the current reader. External URLs keep their provenance.
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|[?#])/i.test(href) || href === "") return href;

  const documentUrl = new URL(sourcePath, "https://analytics-source.invalid/");
  const target = new URL(href, documentUrl);
  const targetPath = decodeURI(target.pathname.slice(1));
  const document = documentByPath.get(targetPath);
  const url = document?.href ?? githubDocumentUrl(targetPath);
  return url + target.search + target.hash;
}
