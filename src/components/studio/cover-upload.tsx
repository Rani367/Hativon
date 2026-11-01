"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getPostCardImageUrl } from "@/lib/images/post-images";
import { type PreparedImage, prepareImage, uploadImage } from "@/lib/images/prepare-upload";
import { studioCopy } from "@/lib/studio-copy";
import { CropDialog } from "./crop-dialog";

const { cover: text } = studioCopy;

interface CoverUploadProps {
  value: string;
  aiGenerated: boolean | null;
  onChange: (url: string, aiDetected: boolean) => void;
  onAiAnswer: (answer: boolean) => void;
}

export function CoverUpload({
  value,
  aiGenerated,
  onChange,
  onAiAnswer,
}: CoverUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [aiDetected, setAiDetected] = useState(false);
  const [pending, setPending] = useState<
    (PreparedImage & { previewUrl: string }) | null
  >(null);

  useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending.previewUrl);
    };
  }, [pending]);

  async function choose(file: File | undefined) {
    if (!file) return;

    setBusy(true);
    try {
      const prepared = await prepareImage(file);
      setPending({
        ...prepared,
        previewUrl: URL.createObjectURL(prepared.file),
      });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function upload(crop: { x: number; y: number; width: number; height: number }) {
    if (!pending) return;

    const { file, aiProvenance } = pending;
    setPending(null);
    setBusy(true);

    try {
      const { url, aiGenerated: detected } = await uploadImage(file, {
        crop,
        aiProvenance,
      });
      setAiDetected(detected);
      onChange(url, detected);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <span>{text.label}</span>

      {value ? (
        <img
          className="cover-preview"
          src={getPostCardImageUrl(value) ?? value}
          alt=""
        />
      ) : null}

      <div className="cover-actions">
        <button
          type="button"
          className="button button-quiet"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy ? text.uploading : value ? text.replace : text.choose}
        </button>
        {value ? (
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setAiDetected(false);
              onChange("", false);
            }}
          >
            {text.remove}
          </button>
        ) : null}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*,.heic,.heif"
        hidden
        onChange={(event) => {
          void choose(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {value ? (
        <fieldset className="field choice" disabled={aiDetected}>
          <legend>{text.aiQuestion}</legend>
          <label>
            <input
              type="radio"
              name="ai"
              checked={aiGenerated === true}
              onChange={() => onAiAnswer(true)}
            />
            {text.yes}
          </label>
          <label>
            <input
              type="radio"
              name="ai"
              checked={aiGenerated === false}
              onChange={() => onAiAnswer(false)}
            />
            {text.no}
          </label>
          {aiDetected ? <small>{text.aiDetected}</small> : null}
        </fieldset>
      ) : null}

      {pending ? (
        <CropDialog
          imageSrc={pending.previewUrl}
          onCancel={() => setPending(null)}
          onConfirm={(crop) => void upload(crop)}
        />
      ) : null}
    </div>
  );
}
