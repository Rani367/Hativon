"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PlusCircle, Search, Edit, Trash2, FileText } from "lucide-react";
import { Post } from "@/types/post.types";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(res => res.json());

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  // Use SWR for data fetching with automatic revalidation
  const { data, error, isLoading } = useSWR('/api/admin/posts', fetcher, {
    refreshInterval: 1000, // Auto-refresh every 1 second for instant updates
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 2000, // Prevent fetching multiple times within 2 seconds (allows optimistic updates to complete)
    revalidateIfStale: false, // Don't revalidate stale data automatically
    revalidateOnMount: false, // Don't fetch on mount - use cached data from optimistic updates
    fallbackData: { posts: [] }, // Fallback to empty if no cache
  });

  const posts = data?.posts || [];

  const filteredPosts = useMemo(() => {
    let filtered = posts;

    if (statusFilter !== "all") {
      filtered = filtered.filter((post: Post) => post.status === statusFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (post: Post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.slug.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [posts, search, statusFilter]);

  async function handleDelete(id: string) {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הכתבה הזו?")) return;

    try {
      // Optimistic update - remove from UI INSTANTLY and wait for completion
      await mutate(
        '/api/admin/posts',
        async () => {
          // Delete from server
          const response = await fetch(`/api/admin/posts/${id}`, {
            method: "DELETE",
            credentials: "include",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete post');
          }

          // Return updated data
          return {
            posts: posts.filter((post: Post) => post.id !== id)
          };
        },
        {
          optimisticData: {
            posts: posts.filter((post: Post) => post.id !== id)
          },
          rollbackOnError: true,
          populateCache: true,
          revalidate: false, // Don't revalidate - we just got fresh data from server
        }
      );
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert(`שגיאה במחיקת הכתבה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
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
                  <th className="p-4"><div className="h-4 w-16 rounded bg-muted animate-pulse" /></th>
                  <th className="p-4 hidden md:table-cell"><div className="h-4 w-20 rounded bg-muted animate-pulse" /></th>
                  <th className="p-4 hidden lg:table-cell"><div className="h-4 w-16 rounded bg-muted animate-pulse" /></th>
                  <th className="p-4"><div className="h-4 w-16 rounded bg-muted animate-pulse" /></th>
                  <th className="p-4 text-end"><div className="h-4 w-16 rounded bg-muted animate-pulse ms-auto" /></th>
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
          <h1 className="text-3xl font-bold">הפוסטים שלי</h1>
          <p className="text-muted-foreground mt-1">
            נהל את הכתבות שלך
          </p>
        </div>
        <Link href="/dashboard/posts/new">
          <Button>
            <PlusCircle className="h-4 w-4 me-2" />
            פוסט חדש
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
              <h3 className="text-xl font-semibold mb-2">אין לך פוסטים עדיין</h3>
              <p className="text-muted-foreground mb-4">
                התחל לכתוב ולשתף את הסיפורים שלך עם הקהילה
              </p>
              <Link href="/dashboard/posts/new">
                <Button>
                  <PlusCircle className="h-4 w-4 me-2" />
                  צור פוסט ראשון
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
                  placeholder="חפש פוסטים..."
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
                    <th className="p-4 font-medium">כותרת</th>
                    <th className="p-4 font-medium hidden md:table-cell">קטגוריה</th>
                    <th className="p-4 font-medium hidden lg:table-cell">נוצר</th>
                    <th className="p-4 font-medium">סטטוס</th>
                    <th className="p-4 font-medium text-end">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        לא נמצאו פוסטים התואמים את החיפוש.
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post: Post) => (
                      <tr key={post.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-4">
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
                        <td className="p-4 hidden md:table-cell">
                          {post.category && (
                            <Badge variant="secondary">{post.category}</Badge>
                          )}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">
                          {format(new Date(post.createdAt), "d בMMMM yyyy", { locale: he })}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={post.status === "published" ? "default" : "secondary"}
                          >
                            {post.status === "published" ? "פורסם" : "טיוטה"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Link href={`/dashboard/posts/${post.id}`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(post.id)}
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
        </>
      )}
    </div>
  );
}
