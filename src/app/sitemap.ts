import type { MetadataRoute } from "next";
import { getIssuePath, getIssues } from "@/lib/issues/issues";
import { getPublishedPostStamps } from "@/lib/posts/queries";
import { getSiteUrl, shouldSkipPrerender } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const home: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/issues`, changeFrequency: "weekly", priority: 0.6 },
  ];

  if (shouldSkipPrerender()) return home;

  const [issues, posts] = await Promise.all([
    getIssues(),
    getPublishedPostStamps(),
  ]);

  return [
    ...home,
    ...issues.map((issue) => ({
      url: `${siteUrl}${getIssuePath(issue.year, issue.month)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}/posts/${post.id}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
