"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
// rehype-sanitize uses GitHub's sanitization schema by default
// This allows: headings, lists, links, images, code blocks, tables, emphasis
// This blocks: script, style, iframe, form elements, event handlers
// See: https://github.com/syntax-tree/hast-util-sanitize#schema
import rehypeSanitize from "rehype-sanitize";
import { formatHebrewDate } from "@/lib/date/format";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { components } from "./mdx-component";
import { getWordCount } from "@/lib/utils/text-utils";
import { calculateReadingTime } from "@/lib/utils";

interface PostPreviewProps {
  title: string;
  content: string;
  coverImage?: string;
  description?: string;
  author?: string;
  authorGrade?: string;
  authorClass?: number;
  date?: Date;
}

export function PostPreview({
  title,
  content,
  coverImage,
  description,
  author,
  authorGrade,
  authorClass,
  date = new Date(),
}: PostPreviewProps) {
  const wordCount = useMemo(() => {
    return content ? getWordCount(content) : 0;
  }, [content]);

  const readingTime = useMemo(() => {
    return calculateReadingTime(wordCount);
  }, [wordCount]);

  // Generate auto description if not provided (matching post-storage logic)
  const displayDescription = useMemo(() => {
    if (description && description.trim()) {
      return description;
    }
    if (content) {
      // Strip markdown and get first 160 chars
      const stripped = content
        .replace(/[#*`~\[\]()]/g, "")
        .replace(/\n+/g, " ")
        .trim();
      return stripped.substring(0, 160) + (stripped.length > 160 ? "..." : "");
    }
    return "";
  }, [description, content]);

  return (
    <article className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
      {coverImage && (
        <div className="relative w-full mb-10 rounded-lg overflow-hidden">
          <Image
            src={coverImage}
            alt={title || "תצוגה מקדימה"}
            width={1200}
            height={800}
            className="w-full h-auto"
            quality={90}
            sizes="(max-width: 768px) 100vw, 896px"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIvPg=="
          />
        </div>
      )}

      <header className="mb-10">
        <div className="flex items-center gap-4 text-base text-muted-foreground mb-6">
          <time>{formatHebrewDate(date)}</time>
          {author && (
            <span>
              מאת {author}
              {authorGrade &&
                authorClass &&
                ` (כיתה ${authorGrade}${authorClass})`}
            </span>
          )}
          <span>{readingTime}</span>
          <span>{wordCount} מילים</span>
        </div>

        <h1 className="text-5xl font-bold mb-6 text-foreground leading-tight">
          {title || "אין כותרת"}
        </h1>

        {displayDescription && (
          <p className="text-xl text-muted-foreground mb-4">
            {displayDescription}
          </p>
        )}
      </header>

      <div className="max-w-none">
        {content ? (
          <ReactMarkdown
            components={components}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <p className="text-muted-foreground italic">התוכן יופיע כאן...</p>
        )}
      </div>
    </article>
  );
}
