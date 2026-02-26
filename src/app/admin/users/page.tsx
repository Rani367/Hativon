"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/user.types";
import {
  Trash2,
  Users,
  UserPlus,
  Terminal,
  KeyRound,
  X,
} from "lucide-react";
import { formatHebrewDate } from "@/lib/date/format";
import { toast } from "sonner";
import { useOptimisticList } from "@/hooks/use-optimistic-list";
import { DbNotConfiguredView } from "./db-not-configured";

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [dbNotConfigured, setDbNotConfigured] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [userToDismiss, setUserToDismiss] = useState<User | null>(null);

  // Optimistic delete hook
  const { optimisticDelete, isPending } = useOptimisticList({
    items: users,
    setItems: setUsers,
    getItemId: (user) => user.id,
  });

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
    if (isPending(user.id)) return;
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!userToDelete || isPending(userToDelete.id)) return;

    setDeleteDialogOpen(false);

    // Optimistic delete - user disappears instantly, rolls back on error
    await optimisticDelete(
      userToDelete.id,
      () =>
        fetch(`/api/admin/users/${userToDelete.id}`, {
          method: "DELETE",
        }),
      { errorMessage: "שגיאה במחיקת המשתמש" }
    );

    setUserToDelete(null);
  }

  function handleDismissClick(user: User) {
    setUserToDismiss(user);
    setDismissDialogOpen(true);
  }

  async function handleDismissConfirm() {
    if (!userToDismiss) return;

    setDismissDialogOpen(false);
    const userId = userToDismiss.id;

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, passwordResetRequested: false } : u,
      ),
    );

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissResetRequest: true }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to dismiss request");
      }

      toast.success("בקשת איפוס הסיסמה נדחתה");
    } catch (error) {
      // Rollback on failure
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, passwordResetRequested: true } : u,
        ),
      );
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`שגיאה בדחיית הבקשה: ${msg}`);
    } finally {
      setUserToDismiss(null);
    }
  }

  function handleResetClick(userId: string) {
    if (resetUserId === userId) {
      setResetUserId(null);
      setResetPassword("");
    } else {
      setResetUserId(userId);
      setResetPassword("");
    }
  }

  async function handleResetSubmit(userId: string) {
    if (!resetPassword.trim() || resetPassword.length < 8) {
      toast.error("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }

    setResetting(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reset password");
      }

      // Clear the reset request badge
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, passwordResetRequested: false } : u,
        ),
      );

      setResetUserId(null);
      setResetPassword("");
      toast.success("הסיסמה אופסה בהצלחה");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`שגיאה באיפוס הסיסמה: ${msg}`);
    } finally {
      setResetting(false);
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

  if (dbNotConfigured) {
    return <DbNotConfiguredView />;
  }

  const pendingResets = users.filter((u) => u.passwordResetRequested).length;

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
            {pendingResets > 0 && (
              <Badge variant="destructive" className="mr-2">
                {pendingResets} בקשות איפוס
              </Badge>
            )}
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
                        <span className="flex items-center gap-2">
                          {user.username}
                          {user.passwordResetRequested && (
                            <span className="inline-flex items-center gap-1">
                              <Badge variant="destructive" className="text-xs">
                                איפוס סיסמה
                              </Badge>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDismissClick(user);
                                }}
                                className="inline-flex items-center justify-center rounded-full h-4 w-4 bg-destructive/20 text-destructive hover:bg-destructive/40 transition-colors"
                                title="דחה בקשת איפוס"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{user.displayName}</TableCell>
                      <TableCell>
                        {user.grade}&apos;{user.classNumber}
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
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetClick(user.id)}
                            >
                              <KeyRound className="h-4 w-4 me-2" />
                              איפוס סיסמה
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                              disabled={isPending(user.id)}
                            >
                              <Trash2 className="h-4 w-4 me-2" />
                              מחק
                            </Button>
                          </div>
                          {resetUserId === user.id && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="password"
                                value={resetPassword}
                                onChange={(e) =>
                                  setResetPassword(e.target.value)
                                }
                                placeholder="סיסמה חדשה (לפחות 8 תווים)"
                                className="text-right h-8 text-sm"
                                disabled={resetting}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleResetSubmit(user.id);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleResetSubmit(user.id)}
                                disabled={
                                  resetting || resetPassword.length < 8
                                }
                              >
                                {resetting ? "מאפס..." : "אישור"}
                              </Button>
                            </div>
                          )}
                        </div>
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
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              מחק משתמש
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dismiss Reset Request Dialog */}
      <AlertDialog open={dismissDialogOpen} onOpenChange={setDismissDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>דחיית בקשת איפוס סיסמה</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם לדחות את בקשת איפוס הסיסמה של{" "}
              <strong className="text-foreground">
                {userToDismiss?.username}
              </strong>{" "}
              ({userToDismiss?.displayName})? הבקשה תוסר מהרשימה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDismissConfirm}>
              דחה בקשה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
