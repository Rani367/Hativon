import type { Metadata } from "next";
import { PostEditor } from "@/components/studio/post-editor";
import { requireUser } from "@/lib/auth/guards";
import { studioCopy } from "@/lib/studio-copy";

export const metadata: Metadata = { title: studioCopy.editor.newTitle };

export default async function NewPostPage() {
  const user = await requireUser();

  return <PostEditor post={null} defaultAuthor={user.displayName} canPublish />;
}
