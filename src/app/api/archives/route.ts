import { NextResponse } from "next/server";
import { getMergedArchiveMonths } from "@/lib/issues/merged-issues";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const archives = await getMergedArchiveMonths();

    return NextResponse.json(archives, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
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
