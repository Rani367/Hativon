import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";
import {
  getDefaultMonth,
  setDefaultMonth,
  getPendingMonth,
  getArchiveMonthsWithDefault,
} from "@/lib/settings";
import { getArchiveMonths, getPostsByMonth } from "@/lib/posts/queries";
import { getCurrentMonthYear, englishToHebrewMonth } from "@/lib/date/months";
import { revalidatePath, revalidateTag } from "next/cache";

interface DefaultMonthResponse {
  currentDefault: { year: number; month: string; hebrewMonth: string } | null;
  availableMonths: Array<{
    year: number;
    month: string;
    hebrewMonth: string;
    postCount: number;
    isDefault: boolean;
  }>;
  pendingMonth: {
    year: number;
    month: string;
    hebrewMonth: string;
    postCount: number;
  } | null;
}

/**
 * GET /api/admin/settings/default-month
 * Get current default month settings and available months
 */
export async function GET(): Promise<NextResponse<DefaultMonthResponse | { error: string }>> {
  try {
    // Check authentication
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current default month
    const defaultMonth = await getDefaultMonth();

    // Get all months with posts
    const archiveMonths = await getArchiveMonthsWithDefault(getArchiveMonths);

    // Get pending month (current calendar month if different and has posts)
    const pendingMonth = await getPendingMonth(async (year, month) => {
      const posts = await getPostsByMonth(year, month);
      return posts.length;
    });

    const response: DefaultMonthResponse = {
      currentDefault: defaultMonth
        ? {
            ...defaultMonth,
            hebrewMonth: englishToHebrewMonth(defaultMonth.month) || "",
          }
        : null,
      availableMonths: archiveMonths.map((m) => ({
        year: m.year,
        month: m.monthName,
        hebrewMonth: m.hebrewMonth,
        postCount: m.postCount,
        isDefault: m.isDefault,
      })),
      pendingMonth: pendingMonth
        ? {
            year: pendingMonth.year,
            month: pendingMonth.month,
            hebrewMonth: englishToHebrewMonth(pendingMonth.month) || "",
            postCount: pendingMonth.postCount,
          }
        : null,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    logError("Failed to get default month settings:", error);
    return NextResponse.json(
      { error: "Failed to get default month settings" },
      { status: 500 },
    );
  }
}

interface SetDefaultMonthRequest {
  year: number;
  month: string;
}

/**
 * PUT /api/admin/settings/default-month
 * Set the default month for the homepage
 */
export async function PUT(
  request: NextRequest,
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    // Check authentication
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as SetDefaultMonthRequest;
    const { year, month } = body;

    // Validate inputs
    if (!year || !month) {
      return NextResponse.json(
        { error: "Year and month are required" },
        { status: 400 },
      );
    }

    if (typeof year !== "number" || year < 1900 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const validMonths = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    if (!validMonths.includes(month.toLowerCase())) {
      return NextResponse.json({ error: "Invalid month" }, { status: 400 });
    }

    // Check that the month has at least one published post
    const MONTH_TO_NUMBER: Record<string, number> = {
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
    const monthNumber = MONTH_TO_NUMBER[month.toLowerCase()];
    const posts = await getPostsByMonth(year, monthNumber);

    if (posts.length === 0) {
      return NextResponse.json(
        { error: "Cannot set a month with no published posts as default" },
        { status: 400 },
      );
    }

    // Set the default month
    await setDefaultMonth(year, month.toLowerCase());

    // Invalidate caches
    revalidatePath("/");
    revalidateTag("posts", "max");

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("Failed to set default month:", error);
    return NextResponse.json(
      { error: "Failed to set default month" },
      { status: 500 },
    );
  }
}
