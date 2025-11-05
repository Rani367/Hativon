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
      // Posts are already filtered by the API for non-admin users
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

    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPosts();
      } else {
        alert("שגיאה במחיקת הכתבה");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("שגיאה במחיקת הכתבה");
    }
  }

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
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
