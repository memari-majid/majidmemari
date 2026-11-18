import type { MetadataRoute } from "next";
import { analyticsDocuments } from "@/lib/business-analytics";
import { INDEXABLE_PATHS, absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const readerPaths = analyticsDocuments
    .filter(({ sourcePath }) => sourcePath !== "README.md" && sourcePath !== "learning/ROADMAP.md")
    .map(({ href }) => href);
  return [...INDEXABLE_PATHS, ...readerPaths].map((path, i) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : Math.max(0.5, 0.8 - i * 0.05),
  }));
}
