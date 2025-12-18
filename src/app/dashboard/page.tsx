"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  FileText,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Post } from "@/types/post.types";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const POSTS_PER_PAGE = 20;

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get pagination from URL params
  const currentOffset = parseInt(searchParams.get("offset") || "0", 10);
  const currentPage = Math.floor(currentOffset / POSTS_PER_PAGE) + 1;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [totalPosts, setTotalPosts] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Fetch posts with server-side pagination
  const fetchPosts = useCallback(async () => {
    let isMounted = true;

    try {
      setIsLoading(true);

      // Build URL with pagination and filters
      const params = new URLSearchParams();
      params.set("limit", String(POSTS_PER_PAGE));
      params.set("offset", String(currentOffset));

      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/admin/posts?${params.toString()}`, {
        cache: "no-store",
      });

      if (!isMounted) return;

      const data = await response.json();
      setPosts(data.posts || []);
      setTotalPosts(data.total ?? data.posts?.length ?? 0);
      setHasMore(data.hasMore ?? false);
    } catch (error) {
      if (isMounted) {
        logError("Failed to fetch posts:", error);
        toast.error("שגיאה בטעינת כתבות");
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [currentOffset, statusFilter, search]);

  // Fetch posts when pagination or filters change
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Navigate to page
  const goToPage = (page: number) => {
    const offset = (page - 1) * POSTS_PER_PAGE;
    const params = new URLSearchParams(searchParams.toString());
    params.set("offset", String(offset));
    router.push(`/dashboard?${params.toString()}`);
  };

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

  // Client-side filtering is now done server-side, so just return posts
  const filteredPosts = useMemo(() => posts, [posts]);

  function openDeleteDialog(id: string) {
    setPostToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!postToDelete) return;

    setDeleteDialogOpen(false);
    const loadingToast = toast.loading("מוחק כתבה...");

    try {
      const response = await fetch(`/api/admin/posts/${postToDelete}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete post");
      }

      toast.dismiss(loadingToast);
      toast.success("הכתבה נמחקה בהצלחה!");

      // Refresh to get fresh data from server
      router.refresh();
      await fetchPosts();
    } catch (error) {
      logError("Failed to delete post:", error);
      toast.dismiss(loadingToast);
      toast.error(
        `שגיאה במחיקת הכתבה: ${error instanceof Error ? error.message : "שגיאה לא ידועה"}`,
      );
    } finally {
      setPostToDelete(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-32 rounded bg-muted animate-pulse" />
            <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-10 w-28 rounded-md bg-muted animate-pulse" />
        </div>

        {/* Filters Skeleton */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-16 rounded-md bg-muted animate-pulse" />
              <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
              <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
            </div>
          </div>
        </Card>

        {/* Table Skeleton */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-start">
                  <th className="p-4">
                    <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                  </th>
                  <th className="p-4 hidden md:table-cell">
                    <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                  </th>
                  <th className="p-4 hidden lg:table-cell">
                    <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                  </th>
                  <th className="p-4">
                    <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                  </th>
                  <th className="p-4 text-end">
                    <div className="h-4 w-16 rounded bg-muted animate-pulse ms-auto" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="h-5 w-48 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
                        <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">הכתבות שלי</h1>
          <p className="text-muted-foreground mt-1">נהל את הכתבות שלך</p>
        </div>
        <Link href="/dashboard/posts/new">
          <Button>
            <PlusCircle className="h-4 w-4 me-2" />
            כתבה חדשה
          </Button>
        </Link>
      </div>

      {/* Show empty state if no posts */}
      {posts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-6">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">אין לך כתבות עדיין</h3>
              <p className="text-muted-foreground mb-4">
                התחל לכתוב ולשתף את הסיפורים שלך עם הקהילה
              </p>
              <Link href="/dashboard/posts/new">
                <Button>
                  <PlusCircle className="h-4 w-4 me-2" />
                  צור כתבה ראשונה
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חפש כתבות..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  הכל
                </Button>
                <Button
                  variant={statusFilter === "published" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("published")}
                >
                  פורסמו
                </Button>
                <Button
                  variant={statusFilter === "draft" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("draft")}
                >
                  טיוטות
                </Button>
              </div>
            </div>
          </Card>

          {/* Posts Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-start">
                    <th className="p-3 sm:p-4 font-medium">כותרת</th>
                    <th className="p-3 sm:p-4 font-medium hidden md:table-cell">
                      קטגוריה
                    </th>
                    <th className="p-3 sm:p-4 font-medium hidden lg:table-cell">
                      נוצר
                    </th>
                    <th className="p-3 sm:p-4 font-medium">סטטוס</th>
                    <th className="p-3 sm:p-4 font-medium text-end">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-muted-foreground"
                      >
                        לא נמצאו כתבות התואמות את החיפוש.
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post: Post) => (
                      <tr
                        key={post.id}
                        className="border-b last:border-0 hover:bg-muted/50"
                      >
                        <td className="p-3 sm:p-4">
                          <div>
                            <Link
                              href={`/dashboard/posts/${post.id}`}
                              className="font-medium hover:underline"
                            >
                              {post.title}
                            </Link>
                            <p className="text-sm text-muted-foreground mt-1">
                              {post.slug}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4 hidden md:table-cell">
                          {post.category && (
                            <Badge variant="secondary">{post.category}</Badge>
                          )}
                        </td>
                        <td className="p-3 sm:p-4 text-sm text-muted-foreground hidden lg:table-cell">
                          {format(new Date(post.createdAt), "d בMMMM yyyy", {
                            locale: he,
                          })}
                        </td>
                        <td className="p-3 sm:p-4">
                          <Badge
                            variant={
                              post.status === "published"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {post.status === "published" ? "פורסם" : "טיוטה"}
                          </Badge>
                        </td>
                        <td className="p-2 sm:p-4">
                          <div className="flex justify-end gap-2">
                            <Link href={`/dashboard/posts/${post.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 w-10 sm:h-9 sm:w-9"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(post.id)}
                              className="h-10 w-10 sm:h-9 sm:w-9"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                מציג {currentOffset + 1}-
                {Math.min(currentOffset + POSTS_PER_PAGE, totalPosts)} מתוך{" "}
                {totalPosts} כתבות
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                  הקודם
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  עמוד {currentPage} מתוך {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasMore && currentPage >= totalPages}
                >
                  הבא
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת כתבה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הכתבה הזו? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
