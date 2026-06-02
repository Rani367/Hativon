import { NextRequest, NextResponse } from "next/server";
import { getIssue } from "@/lib/issues/merged-issues";
import { logError } from "@/lib/logger";
import type { PostSummary } from "@/types/post.types";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;
const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function toPublicPostSummary(post: PostSummary): PostSummary {
  return {
    id: post.id,
    title: post.title,
    coverImage: post.coverImage,
    description: post.description,
    wordCount: post.wordCount,
    date: post.date,
    author: post.author,
    authorGrade: post.authorGrade,
    authorClass: post.authorClass,
    authorDeleted: post.authorDeleted,
    isTeacherPost: post.isTeacherPost,
    tags: post.tags,
    category: post.category,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

    const year = yearParam ? parseInt(yearParam, 10) : NaN;
    const month = monthParam ? monthParam.toLowerCase() : "";
    const limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    const monthNumber = MONTH_NAME_TO_NUMBER[month];

    if (
      !yearParam ||
      !monthParam ||
      !Number.isInteger(year) ||
      year < 1900 ||
      year > 2100 ||
      !monthNumber
    ) {
      return NextResponse.json(
        { error: "Invalid year or month" },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > MAX_LIMIT ||
      !Number.isInteger(offset) ||
      offset < 0
    ) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 },
      );
    }

    // Resolve through getIssue so load-more on a merged "double issue" pages over
    // the full combined range, keeping offsets aligned with the initial render.
    const issue = await getIssue(year, monthNumber, {
      limit,
      offset,
    });
    const result = issue.result;

    return NextResponse.json(
      {
        ...result,
        posts: result.posts.map(toPublicPostSummary),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    logError("Error fetching public posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}
