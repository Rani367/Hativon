import Markdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { copy } from "@/lib/copy";
import { rehypeUnwrapImages } from "@/lib/markdown/unwrap-images";

// Stored Markdown renders the same way it always has, because some of it dates
// from years of different editors. Two rules matter:
//
// - No rehype-raw. Raw HTML in old posts is dropped, and enabling it would bring
//   back hidden markup and open a script-injection hole.
// - No remark-breaks. A single newline stays a space, or old articles reflow.
const components: Components = {
  // The article title is the page's only h1, so a heading written as "#" in an
  // article becomes the next level down.
  h1: ({ children }) => <h2>{children}</h2>,
  a: ({ children, href }) => (
    <a href={href} rel="noopener noreferrer">
      {children}
    </a>
  ),
  img: ({ src, alt }) =>
    typeof src === "string" ? (
      <figure>
        {/* Plain <img>: next/image throws on hosts outside its allowlist, and
            articles can link to images hosted anywhere. */}
        <img src={src} alt={alt || copy.article.imageFallbackAlt} loading="lazy" />
        {alt ? <figcaption>{alt}</figcaption> : null}
      </figure>
    ) : null,
  // Code is left-to-right whatever the page's direction. No syntax colours: the
  // highlighter cost 221 KB on every article, and the site is black and white.
  pre: ({ children }) => <pre dir="ltr">{children}</pre>,
  table: ({ children }) => (
    <div className="article-table">
      <table>{children}</table>
    </div>
  ),
};

/** The body of an article. Runs on the server only, so it ships no JavaScript. */
export function ArticleBody({ content }: { content: string }) {
  return (
    <div className="article-body">
      <Markdown
        components={components}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeUnwrapImages]}
      >
        {content}
      </Markdown>
    </div>
  );
}
