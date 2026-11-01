"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteOwnPost, unpublishOwnPost } from "@/app/dashboard/actions";
import { studioCopy } from "@/lib/studio-copy";

const { list: text } = studioCopy;

export interface PostRow {
  id: string;
  title: string;
  author?: string;
  status: "draft" | "published";
  teacherHold: boolean;
  readCount: number;
}

function statusLabel(post: PostRow): string {
  if (post.teacherHold) return text.statusHeld;
  return post.status === "published" ? text.statusPublished : text.statusDraft;
}

export function PostRows({
  posts,
  showAuthor = false,
}: {
  posts: PostRow[];
  showAuthor?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(
    action: () => Promise<{ error?: string }>,
    successMessage: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(successMessage);
        router.refresh();
      }
    });
  }

  return (
    <div className="rows">
      {posts.map((post) => (
        <article key={post.id} className="row">
          <Link className="row-title" href={`/dashboard/posts/${post.id}`}>
            {post.title || text.untitled}
          </Link>

          <p className="row-meta">
            <span>{statusLabel(post)}</span>
            {showAuthor && post.author ? <span>{post.author}</span> : null}
            {post.status === "published" ? (
              <span>{text.reads(post.readCount)}</span>
            ) : null}
          </p>

          <div className="row-actions">
            {post.status === "published" ? (
              <>
                <a className="text-button" href={`/posts/${post.id}`}>
                  {text.view}
                </a>
                <button
                  type="button"
                  className="text-button"
                  disabled={pending}
                  onClick={() =>
                    run(() => unpublishOwnPost(post.id), text.unpublished)
                  }
                >
                  {text.unpublish}
                </button>
              </>
            ) : null}
            <button
              type="button"
              className="text-button"
              disabled={pending}
              onClick={() => {
                if (window.confirm(text.confirmDelete)) {
                  run(() => deleteOwnPost(post.id), text.deleted);
                }
              }}
            >
              {text.delete}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
