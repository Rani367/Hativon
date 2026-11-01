import { notFound } from "next/navigation";
import { PostEditor } from "@/components/studio/post-editor";
import { requireUser } from "@/lib/auth/guards";
import { canEditPost, canPublishPost } from "@/lib/posts/rules";
import { getStudioPost } from "@/lib/posts/studio";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const user = await requireUser();
  const { id } = await params;

  const post = await getStudioPost(id);
  if (!post || !canEditPost(user, post)) notFound();

  return (
    <PostEditor
      post={{
        id: post.id,
        title: post.title,
        content: post.content,
        description: post.description,
        coverImage: post.coverImage ?? "",
        author: post.author ?? "",
        aiGeneratedImage: post.aiGeneratedImage,
        status: post.status,
        teacherHold: post.teacherHold,
        updatedAt: post.updatedAt,
      }}
      defaultAuthor={user.displayName}
      editingOtherAuthor={
        post.authorId === user.id ? undefined : (post.author ?? "")
      }
      canPublish={canPublishPost(user, post)}
    />
  );
}
