"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { Search, Trash2 } from "lucide-react";
import { Post } from "@/types/post.types";
import { formatHebrewDate } from "@/lib/date/format";
import { logError } from "@/lib/logger";
import { useOptimisticList } from "@/hooks/use-optimistic-list";

function PostStatusBadge({ status }: { status: Post["status"] }) {
  return (
    <Badge variant={status === "published" ? "default" : "secondary"}>
      {status === "published" ? "פורסם" : "טיוטה"}
    </Badge>
  );
}

function AdminPostMobileCard({
  post,
  isPending,
  onDelete,
}: {
  post: Post;
  isPending: (id: string) => boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="break-words text-base font-semibold leading-6">
            {post.title}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {post.author ? (
              <span>
                {post.author}
                {post.authorDeleted && " (נמחק)"}
                {post.authorGrade && post.authorClass && (
                  <> ({post.authorGrade}{post.authorClass})</>
                )}
              </span>
            ) : (
              <span>-</span>
            )}
            {post.isTeacherPost && (
              <Badge variant="outline" className="text-xs">
                מורה
              </Badge>
            )}
            <span>{formatHebrewDate(post.createdAt)}</span>
          </div>
        </div>
        <PostStatusBadge status={post.status} />
      </div>
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(post.id)}
          disabled={isPending(post.id)}
          className="h-11 w-full"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          מחיקה
        </Button>
      </div>
    </div>
  );
}

export default function PostsListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // Optimistic delete hook
  const { optimisticDelete, isPending } = useOptimisticList({
    items: posts,
    setItems: setPosts,
    getItemId: (post) => post.id,
  });

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (post) => post.title.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [posts, search]);

  useEffect(() => {
    let isMounted = true;

    async function loadPosts() {
      try {
        const response = await fetch("/api/admin/posts");
        const data = await response.json();

        if (isMounted) {
          setPosts(data.posts || []);
        }
      } catch (error) {
        if (isMounted) {
          logError("Failed to fetch posts:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  function openDeleteDialog(id: string) {
    if (isPending(id)) return;
    setPostToDelete(id);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!postToDelete || isPending(postToDelete)) return;

    setDeleteDialogOpen(false);

    // Optimistic delete - item disappears instantly, rolls back on error
    await optimisticDelete(
      postToDelete,
      () =>
        fetch(`/api/admin/posts/${postToDelete}`, {
          method: "DELETE",
        }),
      { errorMessage: "שגיאה במחיקת הכתבה" }
    );

    setPostToDelete(null);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-48 rounded bg-muted animate-pulse mt-2" />
        </div>

        {/* Filters Skeleton */}
        <Card className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="h-10 w-full rounded-md bg-muted animate-pulse" />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:flex">
              <div className="h-9 w-16 rounded-md bg-muted animate-pulse" />
              <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
              <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
            </div>
          </div>
        </Card>

        {/* Table Skeleton */}
        <Card className="md:hidden">
          <div className="space-y-3 px-4 pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="space-y-3">
                  <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
                  <div className="h-9 rounded-md bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-start">
                  <th className="p-4"><div className="h-4 w-16 rounded bg-muted animate-pulse" /></th>
                  <th className="p-4 hidden sm:table-cell"><div className="h-4 w-16 rounded bg-muted animate-pulse" /></th>
                  <th className="p-4 hidden md:table-cell"><div className="h-4 w-16 rounded bg-muted animate-pulse" /></th>
                  <th className="p-4"><div className="h-4 w-16 rounded bg-muted animate-pulse" /></th>
                  <th className="p-4 text-end"><div className="h-4 w-16 rounded bg-muted animate-pulse ms-auto" /></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-4">
                      <div className="space-y-2">
                        <div className="h-5 w-48 rounded bg-muted animate-pulse" />
                        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                    </td>
                    <td className="p-4 hidden md:table-cell">
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
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">כל הכתבות</h1>
        <p className="text-muted-foreground mt-1">
          נהל את כתבות העיתון
        </p>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חפש כתבות..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 ps-10 sm:h-9"
          />
        </div>
      </Card>

      {/* Posts Table */}
      <div className="space-y-3 md:hidden">
        {filteredPosts.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
            לא נמצאו כתבות.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <AdminPostMobileCard
              key={post.id}
              post={post}
              isPending={isPending}
              onDelete={openDeleteDialog}
            />
          ))
        )}
      </div>

      <Card className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-start">
                <th className="p-3 sm:p-4 font-medium">כותרת</th>
                <th className="p-3 sm:p-4 font-medium hidden sm:table-cell">כותב</th>
                <th className="p-3 sm:p-4 font-medium hidden md:table-cell">נוצר</th>
                <th className="p-3 sm:p-4 font-medium">סטטוס</th>
                <th className="p-3 sm:p-4 font-medium text-end">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    לא נמצאו כתבות.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 sm:p-4">
                      <div>
                        <div className="font-medium">
                          {post.title}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 hidden sm:table-cell">
                      {post.author ? (
                        <div className="text-sm">
                          <span>{post.author}</span>
                          {post.authorDeleted && (
                            <span className="text-muted-foreground"> (נמחק)</span>
                          )}
                          {post.authorGrade && post.authorClass && (
                            <span className="text-muted-foreground">
                              {" "}({post.authorGrade}{post.authorClass})
                            </span>
                          )}
                          {post.isTeacherPost && (
                            <Badge variant="outline" className="ms-2 text-xs">מורה</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 text-sm text-muted-foreground hidden md:table-cell">
                      {formatHebrewDate(post.createdAt)}
                    </td>
                    <td className="p-3 sm:p-4">
                      <PostStatusBadge status={post.status} />
                    </td>
                    <td className="p-2 sm:p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(post.id)}
                          disabled={isPending(post.id)}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת כתבה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הכתבה הזו?{"\u200F"} פעולה זו לא ניתנת לביטול.
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
