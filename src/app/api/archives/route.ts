import { NextResponse } from "next/server";
import { getArchiveMonths } from "@/lib/posts/queries";
import { logError } from "@/lib/logger";

// Cache this route for 60 seconds, revalidate in background
export const revalidate = 60;

export async function GET() {
  try {
    const archives = await getArchiveMonths();

    // Return with aggressive caching headers
    return NextResponse.json(archives, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    logError("Failed to fetch archives:", error);
    return NextResponse.json(
      { error: "Failed to fetch archives" },
      { status: 500 },
    );
  }
}
