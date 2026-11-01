"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { coverImageSchema } from "@/lib/autosave";
import { requireUser } from "@/lib/auth/guards";
import type { FormState } from "@/lib/form-state";
import {
  MAX_DESCRIPTION_LENGTH,
  canEditPost,
  canPublishPost,
} from "@/lib/posts/rules";
import {
  type PostFields,
  createDraft,
  deletePost,
  getStudioPost,
  publishPost,
  setAiImageFlags,
  unpublishPost,
  updatePostFields,
} from "@/lib/posts/studio";
import { studioCopy } from "@/lib/studio-copy";
import { dismissAiSurvey, updateProfile } from "@/lib/users/queries";

const { editor: text, auth: authText } = studioCopy;

const saveSchema = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().max(200),
  content: z.string().max(50_000),
  description: z.string().max(1000).optional(),
  coverImage: z.union([z.literal(""), coverImageSchema]),
  customAuthor: z.string().max(100).optional(),
  aiGeneratedImage: z.boolean().nullable(),
  publish: z.boolean(),
});

export async function savePost(
  input: z.input<typeof saveSchema>,
): Promise<{ id?: string; error?: string }> {
  const user = await requireUser();

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { error: text.saveFailed };

  const { id, publish, aiGeneratedImage, ...rest } = parsed.data;

  const existing = id ? await getStudioPost(id) : null;
  if (id && !existing) return { error: text.notFound };
  if (existing && !canEditPost(user, existing)) return { error: text.notAllowed };

  if (
    rest.description !== undefined &&
    rest.description !== existing?.description &&
    rest.description.trim().length > MAX_DESCRIPTION_LENGTH
  ) {
    return { error: text.descriptionTooLong };
  }

  if (publish) {
    if (existing && !canPublishPost(user, existing)) return { error: text.held };
    if (!rest.title.trim()) return { error: text.needTitle };
    if (!rest.content.trim()) return { error: text.needContent };
    if (!rest.coverImage) return { error: text.needCover };
    if (aiGeneratedImage === null) return { error: text.needAiAnswer };
  }

  const fields: PostFields = {
    ...rest,
    aiGeneratedImage: aiGeneratedImage ?? undefined,
  };

  const post = existing
    ? await updatePostFields(user, existing, fields)
    : await createDraft(user, fields);

  if (publish && post.status === "draft") await publishPost(post);

  revalidatePath("/dashboard");
  return { id: post.id };
}

export async function unpublishOwnPost(id: string): Promise<{ error?: string }> {
  const user = await requireUser();

  const post = await getStudioPost(id);
  if (!post) return { error: text.notFound };
  if (!canEditPost(user, post)) return { error: text.notAllowed };

  // A teacher taking down someone else's post holds it. Writers can take down
  // their own and put it back.
  await unpublishPost(post, user.isTeacher && post.authorId !== user.id);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return {};
}

export async function deleteOwnPost(id: string): Promise<{ error?: string }> {
  const user = await requireUser();

  const post = await getStudioPost(id);
  if (!post) return { error: text.notFound };
  if (!canEditPost(user, post)) return { error: text.notAllowed };

  await deletePost(post);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return {};
}

export async function saveAiSurvey(
  answers: Record<string, boolean>,
): Promise<void> {
  const user = await requireUser();

  // Limited to the writer's own posts inside this call.
  await setAiImageFlags(user.id, answers);
  await dismissAiSurvey(user.id);
  revalidatePath("/dashboard");
}

const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  grade: z.enum(["ז", "ח", "ט", "י"]).optional(),
  classNumber: z.coerce.number().int().min(1).max(4).optional(),
});

export async function saveProfile(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse(
    Object.fromEntries([...form.entries()].filter(([, value]) => value !== "")),
  );
  if (!parsed.success) return { error: authText.invalid };

  await updateProfile(user.id, {
    displayName: parsed.data.displayName,
    grade: parsed.data.grade ?? user.grade,
    classNumber: parsed.data.classNumber ?? user.classNumber,
  });

  revalidatePath("/dashboard");
  return { success: authText.profileSaved };
}
