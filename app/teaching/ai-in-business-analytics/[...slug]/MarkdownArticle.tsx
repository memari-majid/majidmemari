import { Children, isValidElement, type ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveAnalyticsMarkdownHref, type AnalyticsDocument } from "@/lib/business-analytics";
import styles from "./article.module.css";

export function headingSlug(heading: string): string {
  return heading.toLowerCase().trim().replace(/[^\p{L}\p{M}\p{N}_ -]/gu, "").replace(/ /g, "-");
}

function headingText(children: ReactNode): string {
  return Children.toArray(children).map((child) => {
    if (typeof child === "string" || typeof child === "number") {
      return String(child);
    }
    if (isValidElement<{ children?: ReactNode }>(child)) {
      return headingText(child.props.children);
    }
    return "";
  }).join("");
}

export function MarkdownArticle({ document }: { document: AnalyticsDocument }) {
  const aliases = new Map<string, string>();
  // The original README preserves a legacy GitHub anchor. Map the known
  // anchor syntax onto the following heading without rendering raw HTML.
  const markdown = document.markdown
    .replace(/^# [^\r\n]+\r?\n+/, "")
    .replace(/^<a name="([\w.-]+)"><\/a>\r?\n(?:[ \t]*\r?\n)*(?=## ([^\r\n]+))/gm, (_match, alias: string, title: string) => {
      aliases.set(headingSlug(title), alias);
      return "";
    });
  const slugs = new Set([headingSlug(document.title)]);

  function heading(Tag: "h2" | "h3" | "h4" | "h5" | "h6") {
    return function ArticleHeading({ children }: { children?: ReactNode }) {
      const base = headingSlug(headingText(children));
      let id = base;
      for (let occurrence = 1; slugs.has(id); occurrence++) {
        id = base + "-" + occurrence;
      }
      slugs.add(id);
      const alias = aliases.get(id);
      return <Tag id={id}>{alias && <span id={alias} aria-hidden="true" />}{children}</Tag>;
    };
  }

  return (
    <div className={styles.article}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(href) => defaultUrlTransform(resolveAnalyticsMarkdownHref(document.sourcePath, href))}
        components={{
          h2: heading("h2"),
          h3: heading("h3"),
          h4: heading("h4"),
          h5: heading("h5"),
          h6: heading("h6"),
          pre: ({ children }) => <pre tabIndex={0}>{children}</pre>,
          table: ({ children }) => (
            <div className={styles.tableScroll} role="region" aria-label="Scrollable reference table" tabIndex={0}>
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
