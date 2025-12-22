"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Trash2 } from "lucide-react";
import { Post } from "@/types/post.types";
import { formatHebrewDate } from "@/lib/date/format";
import { logError } from "@/lib/logger";

export default function PostsListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
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
      const response = await fetch("/api/admin/posts");
      const data = await response.json();
      setPosts(data.posts || []);
      setFilteredPosts(data.posts || []);
    } catch (error) {
      logError("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("האם אתה בטוח שברצונך למחוק את הכתבה הזו?")) return;

    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPosts();
      }
    } catch (error) {
      logError("Failed to delete post:", error);
    }
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
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
      <div>
        <h1 className="text-3xl font-bold">כל הכתבות</h1>
        <p className="text-muted-foreground mt-1">
          נהל את כתבות העיתון
        </p>
      </div>

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
                <th className="p-3 sm:p-4 font-medium hidden md:table-cell">קטגוריה</th>
                <th className="p-3 sm:p-4 font-medium hidden lg:table-cell">נוצר</th>
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
                      {formatHebrewDate(post.createdAt)}
                    </td>
                    <td className="p-3 sm:p-4">
                      <Badge
                        variant={post.status === "published" ? "default" : "secondary"}
                      >
                        {post.status === "published" ? "פורסם" : "טיוטה"}
                      </Badge>
                    </td>
                    <td className="p-2 sm:p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
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
    </div>
  );
}
