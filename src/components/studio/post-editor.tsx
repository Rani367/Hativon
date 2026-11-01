"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { savePost, unpublishOwnPost } from "@/app/dashboard/actions";
import { useAutoSave } from "@/hooks/use-auto-save";
import {
  AUTOSAVE_DRAFT_ID_KEY,
  AUTOSAVE_STORAGE_KEY_NEW,
  type PostFormData,
  getAutoSaveStorageKey,
} from "@/lib/autosave";
import { studioCopy } from "@/lib/studio-copy";
import { CoverUpload } from "./cover-upload";
import { Modal } from "./modal";

const { editor: text, recovery, conflict } = studioCopy;

// The editor is the heaviest code on the site, so it loads only here.
const RichTextEditor = dynamic(
  () => import("./rich-text-editor").then((module) => module.RichTextEditor),
  { ssr: false, loading: () => <div className="editor-body" /> },
);

export interface EditablePost {
  id: string;
  title: string;
  content: string;
  description: string;
  coverImage: string;
  author: string;
  aiGeneratedImage: boolean;
  status: "draft" | "published";
  teacherHold: boolean;
  updatedAt: string;
}

interface PostEditorProps {
  post: EditablePost | null;
  defaultAuthor: string;
  /** Teacher editing someone else's post. */
  editingOtherAuthor?: string;
  canPublish: boolean;
}

function formatTime(value: Date | string): string {
  return new Date(value).toLocaleString("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function PostEditor({
  post,
  defaultAuthor,
  editingOtherAuthor,
  canPublish,
}: PostEditorProps) {
  const router = useRouter();
  const isPublished = post?.status === "published";

  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [customAuthor, setCustomAuthor] = useState(post?.author ?? defaultAuthor);
  const [aiGenerated, setAiGenerated] = useState<boolean | null>(
    post?.coverImage ? post.aiGeneratedImage : null,
  );
  const [saving, setSaving] = useState(false);
  const [recoveryDismissed, setRecoveryDismissed] = useState(false);
  const [conflictDismissed, setConflictDismissed] = useState(false);

  const autosave = useAutoSave({
    postId: post?.id ?? null,
    initialVersion: post?.updatedAt,
    serverSave: !isPublished,
  });

  const { updateFormData, cancelPendingSave } = autosave;

  // A new article resumes the draft this browser was last working on.
  useEffect(() => {
    if (post) return;

    const draftId = localStorage.getItem(AUTOSAVE_DRAFT_ID_KEY);
    if (draftId) router.replace(`/dashboard/posts/${draftId}`);
  }, [post, router]);

  const snapshot = useCallback(
    (changes: Partial<PostFormData> = {}): PostFormData => ({
      title,
      content,
      // Only one the writer actually changed, so an existing long description
      // isn't sent back and rejected on every save.
      description: description === post?.description ? undefined : description,
      coverImage: coverImage || undefined,
      customAuthor: customAuthor || undefined,
      ...changes,
    }),
    [title, content, description, post?.description, coverImage, customAuthor],
  );

  function change(changes: Partial<PostFormData>) {
    const next = snapshot(changes);
    if (next.title || next.content) updateFormData(next);
  }

  function applyDraft(data: PostFormData) {
    setTitle(data.title);
    setContent(data.content);
    if (data.description !== undefined) setDescription(data.description);
    if (data.coverImage !== undefined) setCoverImage(data.coverImage);
    if (data.customAuthor !== undefined) setCustomAuthor(data.customAuthor);
  }

  function clearLocalDraft() {
    const id = autosave.currentPostId ?? post?.id ?? null;
    localStorage.removeItem(getAutoSaveStorageKey(id));
    localStorage.removeItem(AUTOSAVE_STORAGE_KEY_NEW);
    localStorage.removeItem(AUTOSAVE_DRAFT_ID_KEY);
  }

  async function save(publish: boolean) {
    setSaving(true);
    cancelPendingSave();

    try {
      const result = await savePost({
        id: autosave.currentPostId ?? post?.id ?? null,
        ...snapshot(),
        coverImage,
        aiGeneratedImage: aiGenerated,
        publish,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      clearLocalDraft();

      if (publish) {
        // A full load, so the writer sees their article the way readers will.
        window.location.assign(`/posts/${result.id}`);
        return;
      }

      toast.success(text.draftSaved);
      router.push("/dashboard");
    } catch {
      toast.error(text.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function unpublish() {
    if (!post) return;

    setSaving(true);
    try {
      const result = await unpublishOwnPost(post.id);
      if (result.error) toast.error(result.error);
      else router.push("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  const showRecovery = Boolean(autosave.recoveryData) && !recoveryDismissed;
  const showConflict = Boolean(autosave.conflictData) && !conflictDismissed;

  return (
    <main id="main" className="editor">
      {editingOtherAuthor ? (
        <p className="editor-notice">{text.editingOther(editingOtherAuthor)}</p>
      ) : null}
      {!canPublish ? <p className="editor-notice">{text.onHold}</p> : null}

      <textarea
        className="editor-title"
        rows={1}
        maxLength={200}
        placeholder={text.titlePlaceholder}
        aria-label={text.titlePlaceholder}
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          change({ title: event.target.value });
        }}
      />

      <CoverUpload
        value={coverImage}
        aiGenerated={aiGenerated}
        onChange={(url, detected) => {
          setCoverImage(url);
          setAiGenerated(url ? (detected ? true : null) : null);
          if (url) change({ coverImage: url });
        }}
        onAiAnswer={setAiGenerated}
      />

      <RichTextEditor
        value={content}
        placeholder={text.bodyPlaceholder}
        onChange={(markdown) => {
          setContent(markdown);
          change({ content: markdown });
        }}
      />

      <label className="field">
        <span>{text.descriptionLabel}</span>
        <textarea
          rows={2}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            change({ description: event.target.value });
          }}
        />
        <small>{text.descriptionHint}</small>
      </label>

      <label className="field">
        <span>{text.authorLabel}</span>
        <input
          maxLength={100}
          value={customAuthor}
          onChange={(event) => {
            setCustomAuthor(event.target.value);
            change({ customAuthor: event.target.value || undefined });
          }}
        />
        <small>{text.authorHint}</small>
      </label>

      <div className="editor-actions">
        {canPublish ? (
          <button
            type="button"
            className="button"
            disabled={saving}
            onClick={() => void save(true)}
          >
            {isPublished ? text.update : text.publish}
          </button>
        ) : null}

        {isPublished ? (
          <button
            type="button"
            className="button button-quiet"
            disabled={saving}
            onClick={() => void unpublish()}
          >
            {text.unpublish}
          </button>
        ) : (
          <button
            type="button"
            className="button button-quiet"
            disabled={saving}
            onClick={() => void save(false)}
          >
            {text.saveDraft}
          </button>
        )}

        <span className="save-state" role="status">
          {isPublished ? text.localOnly : null}
          {!isPublished && autosave.status === "saving" ? text.saving : null}
          {!isPublished && autosave.status === "saved" && autosave.lastSaved
            ? text.savedAt(formatTime(autosave.lastSaved))
            : null}
          {autosave.status === "error" ? (
            <>
              {text.autosaveFailed}{" "}
              <button
                type="button"
                className="text-button"
                onClick={() => autosave.triggerSave(snapshot())}
              >
                {text.retry}
              </button>
            </>
          ) : null}
        </span>
      </div>

      {showRecovery && autosave.recoveryData ? (
        <Modal title={recovery.title} onClose={() => setRecoveryDismissed(true)}>
          <p>{recovery.body(formatTime(autosave.recoveryData.timestamp))}</p>
          <div className="modal-actions">
            <button
              type="button"
              className="button button-quiet"
              onClick={() => {
                autosave.clearRecovery();
                setRecoveryDismissed(true);
              }}
            >
              {recovery.discard}
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                const data = autosave.recoverFromLocal();
                if (data) applyDraft(data);
                setRecoveryDismissed(true);
              }}
            >
              {recovery.recover}
            </button>
          </div>
        </Modal>
      ) : null}

      {showConflict && autosave.conflictData ? (
        <Modal title={conflict.title} onClose={() => setConflictDismissed(true)}>
          <p>{conflict.body(formatTime(autosave.conflictData.serverVersion))}</p>
          <div className="modal-actions">
            <button
              type="button"
              className="button button-quiet"
              onClick={() => {
                autosave.dismissConflict();
                setConflictDismissed(true);
              }}
            >
              {conflict.keepEditing}
            </button>
            <button
              type="button"
              className="button button-quiet"
              onClick={() => {
                const { serverContent, serverVersion } = autosave.conflictData!;
                applyDraft({
                  title: serverContent.title ?? "",
                  content: serverContent.content ?? "",
                  description: serverContent.description,
                  coverImage: serverContent.coverImage,
                  customAuthor: serverContent.customAuthor,
                });
                autosave.setServerVersion(serverVersion);
                autosave.dismissConflict();
              }}
            >
              {conflict.reload}
            </button>
            <button
              type="button"
              className="button"
              onClick={() => {
                const { serverVersion } = autosave.conflictData!;
                autosave.setServerVersion(serverVersion);
                autosave.dismissConflict();
                autosave.triggerSave(snapshot());
              }}
            >
              {conflict.overwrite}
            </button>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}
