"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useAuth } from "@/components/features/auth/auth-provider";
import { logError } from "@/lib/logger";
import { getPostCardImageUrl } from "@/lib/images/post-images";
import type { Post } from "@/types/post.types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Session-scoped key. Set when the user closes/postpones the survey so it does
 * not nag again during this browsing session. Cleared on login (see
 * auth-provider) so the survey re-appears on the next login until completed.
 */
const SNOOZE_KEY = "aiImageSurveySnoozed";

function isSnoozed(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(SNOOZE_KEY) === "1";
}

/**
 * One-time-per-user backfill survey. For logged-in users (real DB accounts)
 * who have not yet completed it, asks for each of their image-bearing posts
 * whether the cover image was AI-generated. Mounted globally inside the auth
 * provider; renders nothing until its trigger conditions are met.
 */
export function AiImageSurvey() {
  const { user, loading, checkAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Skip until auth resolves, for anonymous users, the admin-only mock user
    // (no DB row to persist the flag), already-completed users, and snoozed
    // sessions. Also skip while the dialog is already open.
    if (loading || !user) return;
    if (user.id === "legacy-admin") return;
    if (user.aiImageSurveyDismissed) return;
    if (isSnoozed()) return;
    if (open) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/admin/posts");
        if (!res.ok) return;
        const data = await res.json();
        // Only ever survey the user's OWN image posts. /api/admin/posts returns
        // every post when the session is also admin-authenticated, so filter by
        // authorId rather than trusting the response to be user-scoped.
        const imagePosts: Post[] = (data.posts ?? []).filter(
          (post: Post) => post.coverImage && post.authorId === user.id,
        );
        if (cancelled || imagePosts.length === 0) return;
        setPosts(imagePosts);
        setAnswers(
          Object.fromEntries(
            imagePosts.map((post) => [post.id, !!post.aiGeneratedImage]),
          ),
        );
        setOpen(true);
      } catch (error) {
        logError("Failed to load posts for AI image survey:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Re-evaluate whenever the authenticated user changes (e.g. on login).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const snooze = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SNOOZE_KEY, "1");
    }
    setOpen(false);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      // Only persist posts whose answer differs from what is already stored.
      const changed = posts.filter(
        (post) => !!answers[post.id] !== !!post.aiGeneratedImage,
      );

      await Promise.all(
        changed.map((post) =>
          fetch(`/api/user/posts/${post.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aiGeneratedImage: !!answers[post.id] }),
          }),
        ),
      );

      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiImageSurveyDismissed: true }),
      });

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(SNOOZE_KEY);
      }
      setOpen(false);
      toast.success("תודה! סימון התמונות נשמר");
      // Refresh auth so aiImageSurveyDismissed is now true and we don't re-open.
      await checkAuth();
    } catch (error) {
      logError("Failed to save AI image survey:", error);
      toast.error("שמירת הסימון נכשלה, נסו שוב");
    } finally {
      setSaving(false);
    }
  }, [posts, answers, checkAuth]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      // Closing via Esc / overlay / X postpones until next login.
      if (!next && !saving) {
        snooze();
      }
    },
    [saving, snooze],
  );

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>עזרו לנו לסמן תמונות שנוצרו ב-AI</DialogTitle>
          <DialogDescription>
            למען שקיפות, סמנו לכל כתבה אם תמונת השער שלה נוצרה באמצעות בינה
            מלאכותית. כתבות כאלה יקבלו תגית ויוצגו בתחתית הגלריה.
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-[55vh] space-y-2 overflow-y-auto pe-1">
          {posts.map((post) => {
            const thumb = getPostCardImageUrl(post.coverImage);
            const checkboxId = `ai-survey-${post.id}`;
            return (
              <li
                key={post.id}
                className="flex items-center gap-3 rounded-md border p-2"
              >
                {thumb && (
                  <Image
                    src={thumb}
                    alt={post.title}
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded object-cover"
                  />
                )}
                <span className="line-clamp-2 flex-1 text-sm font-medium">
                  {post.title}
                </span>
                <label
                  htmlFor={checkboxId}
                  className="flex shrink-0 cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={!!answers[post.id]}
                    onCheckedChange={(checked) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [post.id]: checked === true,
                      }))
                    }
                  />
                  נוצרה ב-AI
                </label>
              </li>
            );
          })}
        </ul>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={snooze} disabled={saving}>
            אחר כך
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "שומר..." : "שמירה וסיום"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
