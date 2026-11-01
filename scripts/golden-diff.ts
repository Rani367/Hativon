#!/usr/bin/env bun
/**
 * Compares every published article between two deployments, so the rebuild can
 * be shown not to change what readers see.
 *
 *   bun scripts/golden-diff.ts <old-url> <new-url> <output-dir>
 *
 * Details contain student writing, so <output-dir> must be outside the repo. The
 * terminal shows only ids and which fields differ.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const OLD_BODY_MARKER = 'class="prose max-w-none';
const NEW_BODY_MARKER = 'class="article-body"';
const CONCURRENCY = 6;

const [oldBase, newBase, outputDir] = process.argv.slice(2);
if (!oldBase || !newBase || !outputDir) {
  console.error("Usage: golden-diff.ts <old-url> <new-url> <output-dir>");
  process.exit(1);
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name] ?? match);
}

/** The whole <div> starting at a marker, found by counting nested divs. */
function sliceDiv(html: string, marker: string): string | null {
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) return null;

  const start = html.lastIndexOf("<div", markerIndex);
  const tags = /<(\/?)div\b[^>]*>/g;
  tags.lastIndex = start;

  let depth = 0;
  for (let match = tags.exec(html); match; match = tags.exec(html)) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, tags.lastIndex);
  }
  return null;
}

/** Whitespace is ignored: it never changes what a reader sees here. */
function bodyText(body: string): string {
  return decodeEntities(body.replace(/<[^>]+>/g, "")).replace(/\s+/g, "");
}

function countTag(body: string, tag: string): number {
  return (body.match(new RegExp(`<${tag}[\\s>/]`, "g")) ?? []).length;
}

function structureOf(body: string) {
  // The old renderer showed "#" as a second h1. The new one shifts it to h2 so
  // the title stays the page's only h1, which this mapping accounts for.
  const headings = [...body.matchAll(/<(h[1-6])[\s>]/g)].map(([, tag]) =>
    tag === "h1" ? "h2" : tag,
  );
  const tags = ["p", "ul", "ol", "li", "blockquote", "strong", "em", "br", "table", "del"];

  return {
    headings: headings.join(","),
    counts: Object.fromEntries(tags.map((tag) => [tag, countTag(body, tag)])),
    links: [...body.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map(([, href]) =>
      decodeEntities(href),
    ),
  };
}

/** The article's block. Old pages also carry a site-wide one before it. */
function structuredData(html: string): Record<string, unknown> | null {
  const blocks = html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  );

  for (const [, json] of blocks) {
    try {
      const data = JSON.parse(json);
      if (data["@type"] === "NewsArticle") return data;
    } catch {
      // Not valid JSON, so keep looking.
    }
  }
  return null;
}

function extractArticle(rawHtml: string, marker: string) {
  // React separates adjacent text with comments: 373<!-- --> מילים.
  const html = rawHtml.replaceAll("<!-- -->", "");
  const body = sliceDiv(html, marker);
  const data = structuredData(html);
  const author = data?.author as { name?: string } | undefined;

  return {
    found: body !== null,
    text: body ? bodyText(body) : "",
    structure: body ? structureOf(body) : null,
    headline: data?.headline,
    description: data?.description,
    datePublished: data?.datePublished
      ? new Date(String(data.datePublished)).toISOString()
      : null,
    author: author?.name,
    image: data?.image,
    words: /(\d+) מילים/.exec(html)?.[1],
    reading: /(\d+) דק׳ קריאה/.exec(html)?.[1],
  };
}

async function get(url: string): Promise<{ status: number; html: string }> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      return { status: response.status, html: await response.text() };
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
}

interface Difference {
  id: string;
  fields: string[];
  details: Record<string, { old: unknown; new: unknown }>;
}

async function compareArticle(id: string): Promise<Difference | null> {
  const [before, after] = await Promise.all([
    get(`${oldBase}/posts/${id}`),
    get(`${newBase}/posts/${id}`),
  ]);

  const details: Difference["details"] = {};
  if (before.status !== after.status) {
    details.status = { old: before.status, new: after.status };
  }

  const oldArticle = extractArticle(before.html, OLD_BODY_MARKER);
  const newArticle = extractArticle(after.html, NEW_BODY_MARKER);

  for (const key of Object.keys(oldArticle) as (keyof typeof oldArticle)[]) {
    const oldValue = JSON.stringify(oldArticle[key]);
    const newValue = JSON.stringify(newArticle[key]);
    if (oldValue !== newValue) {
      details[key] = { old: oldArticle[key], new: newArticle[key] };
    }
  }

  const fields = Object.keys(details);
  return fields.length > 0 ? { id, fields, details } : null;
}

async function inBatches<T, R>(
  items: T[],
  work: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let index = 0; index < items.length; index += CONCURRENCY) {
    results.push(
      ...(await Promise.all(items.slice(index, index + CONCURRENCY).map(work))),
    );
  }
  return results;
}

function postIdsIn(html: string): string[] {
  const ids = [...html.matchAll(/\/posts\/([0-9a-f-]{36})/g)].map(([, id]) => id);
  return [...new Set(ids)];
}

mkdirSync(outputDir, { recursive: true });

const sitemap = await get(`${oldBase}/sitemap.xml`);
const ids = [...sitemap.html.matchAll(/\/posts\/([0-9a-f-]{36})</g)].map(
  ([, id]) => id,
);
console.log(`Comparing ${ids.length} articles`);

const differences = (await inBatches(ids, compareArticle)).filter(
  (difference): difference is Difference => difference !== null,
);

const fieldCounts = new Map<string, number>();
for (const { fields } of differences) {
  for (const field of fields) {
    fieldCounts.set(field, (fieldCounts.get(field) ?? 0) + 1);
  }
}

writeFileSync(
  path.join(outputDir, "articles.json"),
  JSON.stringify(differences, null, 2),
);

console.log(`Identical: ${ids.length - differences.length} of ${ids.length}`);
for (const [field, count] of fieldCounts) {
  console.log(`  ${field}: ${count} differ`);
}

// Issues show the same articles in the same order. The old pages show the first
// 12, then load more.
const months = [...(sitemap.html + (await get(`${newBase}/sitemap.xml`)).html).matchAll(
  /\/(\d{4}\/[a-z]+)</g,
)].map(([, value]) => value);

console.log("\nIssue order");
let issueFailures = 0;
for (const month of [...new Set(months)]) {
  const [before, after] = await Promise.all([
    get(`${oldBase}/${month}`),
    get(`${newBase}/${month}`),
  ]);
  const oldIds = postIdsIn(before.html);
  const newIds = postIdsIn(after.html);
  const matches = oldIds.every((id, index) => newIds[index] === id);
  if (!matches) issueFailures += 1;
  console.log(
    `  ${month}: ${matches ? "same order" : "ORDER DIFFERS"} (old shows ${oldIds.length}, new shows ${newIds.length})`,
  );
}

process.exit(differences.length > 0 || issueFailures > 0 ? 1 : 0);
