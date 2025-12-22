"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { User } from "@/types/user.types";
import {
  Trash2,
  Users,
  Database,
  AlertCircle,
  UserPlus,
  Terminal,
} from "lucide-react";
import { formatHebrewDate } from "@/lib/date/format";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dbNotConfigured, setDbNotConfigured] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setDbNotConfigured(false);
      const response = await fetch("/api/admin/users");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Special handling for database not configured (503)
        if (response.status === 503) {
          setDbNotConfigured(true);
          return;
        }

        logError("API Error:", response.status, errorData);
        throw new Error(errorData.error || "Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logError("Failed to fetch users:", error);
      toast.error(`שגיאה בטעינת משתמשים: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteClick(user: User) {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast.success(`המשתמש ${userToDelete.username} נמחק בהצלחה`);

      // Remove user from list
      setUsers(users.filter((u) => u.id !== userToDelete.id));
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      logError("Failed to delete user:", error);
      toast.error("שגיאה במחיקת המשתמש");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-48 rounded bg-muted animate-pulse mb-2" />
          <div className="h-4 w-96 rounded bg-muted animate-pulse" />
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 w-32 rounded bg-muted animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded bg-muted animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show database not configured message
  if (dbNotConfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
          <p className="text-muted-foreground mt-1">
            צפייה ומחיקה של משתמשים במערכת
          </p>
        </div>

        <Alert variant="warning">
          <Database className="h-4 w-4" />
          <AlertTitle>מסד נתונים לא מוגדר</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>
              ניהול משתמשים דורש חיבור למסד נתונים PostgreSQL. התכונה הזו פועלת
              רק כאשר המערכת מחוברת למסד נתונים.
            </p>
            <div className="mt-4 space-y-2">
              <p className="font-medium">אפשרויות:</p>
              <ul className="list-disc list-inside space-y-1 mr-4">
                <li>
                  <strong>פיתוח מקומי:</strong> הגדר{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    POSTGRES_URL
                  </code>{" "}
                  בקובץ{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    .env.local
                  </code>
                </li>
                <li>
                  <strong>ייצור (מומלץ):</strong> פרוס לVercel - מסד הנתונים
                  יוגדר אוטומטית עם Vercel Postgres
                </li>
              </ul>
            </div>
            <p className="text-xs mt-3 text-muted-foreground">
              לאחר הגדרת מסד הנתונים, רענן את הדף כדי לראות את רשימת המשתמשים.
            </p>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              הוראות התקנה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">להגדרה מקומית:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm mr-4">
                <li>התקן PostgreSQL במחשב שלך</li>
                <li>
                  הוסף{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    POSTGRES_URL
                  </code>{" "}
                  לקובץ{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    .env.local
                  </code>
                </li>
                <li>
                  הרץ{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    pnpm run db:init
                  </code>{" "}
                  ליצירת הטבלאות
                </li>
                <li>
                  הרץ{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    pnpm run create-admin
                  </code>{" "}
                  ליצירת משתמש ראשון
                </li>
                <li>רענן את הדף</li>
              </ol>
            </div>
            <div>
              <h3 className="font-medium mb-2">לפריסה בVercel (מומלץ):</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm mr-4">
                <li>פרוס את הפרויקט לVercel</li>
                <li>הוסף Vercel Postgres דרך לוח הבקרה</li>
                <li>התכונה תעבוד אוטומטית ללא הגדרות נוספות</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
        <p className="text-muted-foreground mt-1">
          צפייה ומחיקה של משתמשים במערכת
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            רשימת משתמשים ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="rounded-full bg-muted p-6 mb-4">
                <UserPlus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">אין משתמשים במערכת</h3>
              <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                עדיין לא נרשמו משתמשים למערכת. ניתן ליצור משתמש לבדיקה באמצעות
                הפקודה הבאה:
              </p>
              <div className="bg-muted rounded-lg p-4 mb-4 w-full max-w-md">
                <div className="flex items-start gap-2">
                  <Terminal className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <code className="text-sm font-mono break-all">
                    pnpm run create-test-user
                  </code>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-md">
                הפקודה תיצור משתמש בדיקה עם שם משתמש: <strong>user</strong>{" "}
                וסיסמה: <strong>12345678</strong>
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">שם משתמש</TableHead>
                    <TableHead className="text-right">שם תצוגה</TableHead>
                    <TableHead className="text-right">כיתה</TableHead>
                    <TableHead className="text-right">תאריך הצטרפות</TableHead>
                    <TableHead className="text-right">כניסה אחרונה</TableHead>
                    <TableHead className="text-left">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>{user.displayName}</TableCell>
                      <TableCell>
                        {user.grade}'{user.classNumber}
                      </TableCell>
                      <TableCell>
                        {formatHebrewDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        {user.lastLogin
                          ? formatHebrewDate(user.lastLogin)
                          : "אף פעם"}
                      </TableCell>
                      <TableCell className="text-left">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <Trash2 className="h-4 w-4 me-2" />
                          מחק
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              פעולה זו תמחק את המשתמש{" "}
              <strong className="text-foreground">
                {userToDelete?.username}
              </strong>{" "}
              ({userToDelete?.displayName}) לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={deleting}>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "מוחק..." : "מחק משתמש"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
