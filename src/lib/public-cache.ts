import { revalidatePath } from "next/cache";
import { after } from "next/server";

/**
 * Public pages are cached until something changes them. revalidatePath alone
 * leaves the old copy up until a visitor triggers a rebuild, so the pages are
 * also fetched right after, or a teacher's unpublish could linger for a reader.
 */
function warm(paths: string[]) {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (process.env.VERCEL_ENV !== "production" || !host) return;

  after(async () => {
    await Promise.allSettled(
      paths.map((path) => fetch(`https://${host}${path}`, { cache: "no-store" })),
    );
  });
}

// Route patterns must name the route group, or they silently match nothing.
function revalidateListings() {
  revalidatePath("/");
  revalidatePath("/issues");
  revalidatePath("/sitemap.xml");
  revalidatePath("/(public)/[year]/[month]", "page");
  revalidatePath("/(public)/[year]/[month]/print", "page");
}

interface PublicState {
  id: string;
  status: string;
}

/** Call once after any change to a post that readers could have seen. */
export function refreshAfterPostChange(
  before: PublicState | null,
  after: PublicState | null,
): void {
  const wasPublic = before?.status === "published";
  const isPublic = after?.status === "published";
  if (!wasPublic && !isPublic) return;

  const id = (after ?? before)!.id;
  revalidateListings();
  revalidatePath(`/posts/${id}`);
  warm(["/", "/issues", `/posts/${id}`]);
}

/** For changes that touch every page, like merging issues or deleting a writer. */
export function refreshAllPublicPages(): void {
  revalidateListings();
  revalidatePath("/(public)/posts/[id]", "page");
  warm(["/", "/issues"]);
}
