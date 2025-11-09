"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PlusCircle, Search, Edit, Trash2, FileText } from "lucide-react";
import { Post } from "@/types/post.types";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState(true);
  const [syncingPosts, setSyncingPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();

    // Check for optimistic post from localStorage
    const optimisticPost = localStorage.getItem('optimisticPost');
    if (optimisticPost) {
      try {
        const newPost = JSON.parse(optimisticPost);
        localStorage.removeItem('optimisticPost');

        // Check if this is an update (post ID exists) or new post
        setPosts(prev => {
          const existingIndex = prev.findIndex(p => p.id === newPost.id);
          if (existingIndex >= 0) {
            // Update existing post
            const updated = [...prev];
            updated[existingIndex] = newPost;
            return updated;
          } else {
            // Add new post
            return [newPost, ...prev];
          }
        });

        setSyncingPosts(new Set([newPost.id]));

        // Poll for server sync
        const pollInterval = setInterval(async () => {
          const response = await fetch("/api/admin/posts", { cache: "no-store" });
          const data = await response.json();
          const serverPost = data.posts.find((p: any) =>
            p.id === newPost.id || p.title === newPost.title
          );
          if (serverPost) {
            setPosts(data.posts);
            setSyncingPosts(new Set());
            clearInterval(pollInterval);
          }
        }, 500);

        // Stop after 10 seconds max
        setTimeout(() => {
          clearInterval(pollInterval);
          setSyncingPosts(new Set());
        }, 10000);
      } catch (e) {
        console.error('Failed to parse optimistic post:', e);
      }
    }
  }, []);

  useEffect(() => {
    let filtered = posts;

    if (statusFilter !== "all") {
      filtered = filtered.filter((post) => post.status === statusFilter);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.slug.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPosts(filtered);
  }, [posts, search, statusFilter]);

  async function fetchPosts() {
    try {
      const response = await fetch("/api/admin/posts", {
        cache: "no-store",
      });
      const data = await response.json();
      setPosts(data.posts);
      setFilteredPosts(data.posts);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הכתבה הזו?")) return;

    // Optimistic update - remove from UI INSTANTLY
    const originalPosts = posts;
    const originalFilteredPosts = filteredPosts;
    setPosts(posts.filter(post => post.id !== id));
    setFilteredPosts(filteredPosts.filter(post => post.id !== id));

    // Delete from server in background
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!response.ok) {
        // Restore posts if delete failed
        setPosts(originalPosts);
        setFilteredPosts(originalFilteredPosts);
        const errorData = await response.json();
        alert(`שגיאה במחיקת הכתבה: ${errorData.error || 'שגיאה לא ידועה'}`);
      }
    } catch (error) {
      // Restore posts if request failed
      setPosts(originalPosts);
      setFilteredPosts(originalFilteredPosts);
      console.error("Failed to delete post:", error);
      alert("שגיאה במחיקת הכתבה");
    }
  }

  if (loading) {
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

      {/* Syncing indicator */}
      {syncingPosts.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">
              מסנכרן שינויים לשרת...
            </span>
          </div>
        </div>
      )}

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
                    filteredPosts.map((post) => (
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
                          <div className="flex items-center gap-2">
                            {syncingPosts.has(post.id) && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>מוחק...</span>
                              </div>
                            )}
                            {!syncingPosts.has(post.id) && (
                              <Badge
                                variant={post.status === "published" ? "default" : "secondary"}
                              >
                                {post.status === "published" ? "פורסם" : "טיוטה"}
                              </Badge>
                            )}
                          </div>
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
