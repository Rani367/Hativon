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
import { triggerHaptic } from "@/lib/utils";
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
  Link,
  Copy,
  Check,
  X,
} from "lucide-react";
import { formatHebrewDate } from "@/lib/date/format";
import { toast } from "sonner";
import { useOptimisticList } from "@/hooks/use-optimistic-list";
import { DbNotConfiguredView } from "./db-not-configured";

function UserMobileCard({
  user,
  isPending,
  resetUserId,
  generatedLink,
  copied,
  onResetClick,
  onCopyLink,
  onDeleteClick,
  onDismissClick,
}: {
  user: User;
  isPending: (id: string) => boolean;
  resetUserId: string | null;
  generatedLink?: string;
  copied: boolean;
  onResetClick: (userId: string) => void;
  onCopyLink: (userId: string, link: string) => void;
  onDeleteClick: (user: User) => void;
  onDismissClick: (user: User) => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="break-words text-base font-semibold">
            {user.displayName}
          </div>
          <div className="mt-1 break-words text-sm text-muted-foreground">
            @{user.username}
          </div>
        </div>
        {user.passwordResetRequested && (
          <div className="flex shrink-0 items-center gap-1">
            <Badge variant="destructive" className="text-xs">
              איפוס
            </Badge>
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                onDismissClick(user);
              }}
              className="inline-flex size-7 items-center justify-center rounded-full bg-destructive/20 text-destructive transition-colors hover:bg-destructive/40"
              title="דחה בקשת איפוס"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">כיתה</dt>
          <dd className="font-medium">
            {user.grade}&apos;{user.classNumber}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">הצטרפות</dt>
          <dd className="font-medium">{formatHebrewDate(user.createdAt)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">כניסה אחרונה</dt>
          <dd className="font-medium">
            {user.lastLogin ? formatHebrewDate(user.lastLogin) : "אף פעם"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onResetClick(user.id)}
          className="h-11 w-full"
        >
          <Link className="h-4 w-4" />
          איפוס סיסמה
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDeleteClick(user)}
          disabled={isPending(user.id)}
          className="h-11 w-full"
        >
          <Trash2 className="h-4 w-4" />
          מחק
        </Button>
      </div>

      {resetUserId === user.id && (
        <div className="mt-3">
          {generatedLink ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                readOnly
                value={generatedLink}
                className="h-11 min-w-0 text-sm font-mono"
                dir="ltr"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCopyLink(user.id, generatedLink)}
                className="h-11 shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sm:sr-only">העתק</span>
              </Button>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">יוצר קישור...</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [dbNotConfigured, setDbNotConfigured] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, string>>({});
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [userToDismiss, setUserToDismiss] = useState<User | null>(null);

  // Optimistic delete hook
  const { optimisticDelete, isPending } = useOptimisticList({
    items: users,
    setItems: setUsers,
    getItemId: (user) => user.id,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        setLoading(true);
        setDbNotConfigured(false);
        const response = await fetch("/api/admin/users");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Special handling for database not configured (503)
          if (response.status === 503) {
            if (isMounted) {
              setDbNotConfigured(true);
            }
            return;
          }

          logError("API Error:", response.status, errorData);
          throw new Error(errorData.error || "Failed to fetch users");
        }

        const data = await response.json();
        if (isMounted) {
          setUsers(data.users || []);
        }
      } catch (error) {
        if (isMounted) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logError("Failed to fetch users:", error);
          toast.error(`שגיאה בטעינת משתמשים: ${errorMessage}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

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

  async function handleResetClick(userId: string) {
    // Toggle off if already showing this user's link
    if (resetUserId === userId) {
      setResetUserId(null);
      return;
    }

    // If a link was already generated, just show it
    if (generatedLinks[userId]) {
      setResetUserId(userId);
      return;
    }

    // Generate a new link immediately
    setResetUserId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateResetLink: true }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate reset link");
      }

      const data = await response.json();
      setGeneratedLinks((prev) => ({ ...prev, [userId]: data.resetLink }));

      // Clear the reset request badge
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, passwordResetRequested: false } : u,
        ),
      );

      toast.success("קישור איפוס נוצר");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`שגיאה ביצירת קישור: ${msg}`);
      setResetUserId(null);
    }
  }

  async function handleCopyLink(userId: string, link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedUserId(userId);
      toast.success("הקישור הועתק");
      setTimeout(() => setCopiedUserId(null), 2000);
    } catch {
      toast.error("לא ניתן להעתיק את הקישור");
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
        <h1 className="text-2xl font-bold sm:text-3xl">ניהול משתמשים</h1>
        <p className="text-muted-foreground mt-1">
          צפייה ומחיקה של משתמשים במערכת
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 leading-6">
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
                    bun run create-test-user
                  </code>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-md">
                הפקודה תיצור משתמש בדיקה עם שם משתמש: <strong>user</strong>{" "}
                וסיסמה: <strong>12345678</strong>
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {users.map((user) => (
                  <UserMobileCard
                    key={user.id}
                    user={user}
                    isPending={isPending}
                    resetUserId={resetUserId}
                    generatedLink={generatedLinks[user.id]}
                    copied={copiedUserId === user.id}
                    onResetClick={handleResetClick}
                    onCopyLink={handleCopyLink}
                    onDeleteClick={handleDeleteClick}
                    onDismissClick={handleDismissClick}
                  />
                ))}
              </div>

              <div className="hidden rounded-md border lg:block">
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
                                  triggerHaptic();
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
                              <Link className="h-4 w-4 me-2" />
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
                              {generatedLinks[user.id] ? (
                                <>
                                  <Input
                                    readOnly
                                    value={generatedLinks[user.id]}
                                    className="h-8 text-sm font-mono"
                                    dir="ltr"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopyLink(user.id, generatedLinks[user.id])}
                                  >
                                    {copiedUserId === user.id ? (
                                      <Check className="h-4 w-4" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  יוצר קישור...
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?{"\u200F"}</AlertDialogTitle>
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
              ({userToDismiss?.displayName})?{"\u200F"} הבקשה תוסר מהרשימה.
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
