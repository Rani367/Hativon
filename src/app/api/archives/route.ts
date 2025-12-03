import { NextResponse } from "next/server";
import { getArchiveMonths } from "@/lib/posts/queries";

export async function GET() {
  try {
    const archives = await getArchiveMonths();
    return NextResponse.json(archives);
  } catch (error) {
    console.error("Failed to fetch archives:", error);
    return NextResponse.json([], { status: 500 });
  }
}
