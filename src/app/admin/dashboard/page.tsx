"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, PlusCircle, Eye, EyeOff, Calendar, TrendingUp } from "lucide-react";
import { PostStats, Post } from "@/types/post.types";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function AdminDashboard() {
  const [stats, setStats] = useState<PostStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/posts?stats=true");
        const data = await response.json();

        setStats(data.stats);
        setRecentPosts(data.posts.slice(0, 5)); // Get 5 most recent
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">לוח בקרה</h1>
          <p className="text-muted-foreground mt-1">
            שלום! הנה סקירה כללית של העיתון שלך.
          </p>
        </div>
        <Link href="/admin/posts/new">
          <Button>
            <PlusCircle className="h-4 w-4 me-2" />
            כתבה חדשה
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סך הכל כתבות</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                כל הכתבות בעיתון
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">פורסמו</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.published}</div>
              <p className="text-xs text-muted-foreground mt-1">
                מופיע באתר
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">טיוטות</CardTitle>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.drafts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                בעבודה
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">היום</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today}</div>
              <p className="text-xs text-muted-foreground mt-1">
                כתבות שנוצרו היום
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">השבוע</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">
                כתבות השבוע
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">החודש</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.thisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">
                כתבות החודש
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>כתבות אחרונות</CardTitle>
            <Link href="/admin/posts">
              <Button variant="outline" size="sm">
                הצג הכל
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              אין עדיין כתבות. צור את הכתבה הראשונה כדי להתחיל!
            </p>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-1">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="font-medium hover:underline"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{format(new Date(post.createdAt), "d בMMMM yyyy", { locale: he })}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {post.status === 'published' ? 'פורסם' : 'טיוטה'}
                      </span>
                    </div>
                  </div>
                  <Link href={`/admin/posts/${post.id}`}>
                    <Button variant="ghost" size="sm">
                      ערוך
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
