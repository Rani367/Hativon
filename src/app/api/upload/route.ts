import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { studioCopy } from "@/lib/studio-copy";
import { bytesHaveAiProvenance } from "@/lib/images/ai-metadata";
import {
  type CropRect,
  createCoverImages,
  createInlineImage,
} from "@/lib/images/server";
import { isRateLimited } from "@/lib/rate-limit";

export const maxDuration = 30;

// Vercel refuses bodies over about 4.5 MB. Bigger photos are shrunk in the browser.
const MAX_FILE_SIZE = 4.4 * 1024 * 1024;

/** Real image signatures, because the declared type comes from the client. */
const SIGNATURES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
};

function matchesSignature(bytes: Uint8Array, type: string): boolean {
  return (SIGNATURES[type] ?? []).some((signature) =>
    signature.every((byte, index) => bytes[index] === byte),
  );
}

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function parseCrop(form: FormData): CropRect | undefined {
  const values = ["cropX", "cropY", "cropWidth", "cropHeight"].map((name) => {
    const value = form.get(name);
    return typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  });

  if (!values.every(Number.isFinite)) return undefined;
  const [x, y, width, height] = values;
  return { x, y, width, height };
}

export async function POST(request: Request) {
  const { upload: text } = studioCopy;

  if (!isSameOrigin(request)) return fail(text.failed, 403);

  const user = await getSessionUser();
  if (!user) return fail(text.signedOut, 401);

  if (await isRateLimited("upload", user.id)) return fail(text.tooMany, 429);

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return fail(text.failed, 503);

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail(text.notImage, 400);
  if (file.size > MAX_FILE_SIZE) return fail(text.tooLarge, 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesSignature(bytes, file.type)) return fail(text.notImage, 400);

  // Resizing strips metadata, so anything resized in the browser reports what it
  // found first. It's no weaker than before: metadata was always removable.
  const aiGenerated =
    bytesHaveAiProvenance(bytes) || form.get("aiProvenance") === "1";

  const assetId = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const store = (name: string, content: File) =>
    put(`posts/${assetId}/${name}`, content, { access: "public", token });

  try {
    if (form.get("purpose") === "inline") {
      const image = await createInlineImage(file);
      const { url } = await store(image.filename, image.file);
      return NextResponse.json({ url, aiGenerated });
    }

    const { full, card } = await createCoverImages(file, parseCrop(form));
    const [fullBlob] = await Promise.all([
      store(full.filename, full.file),
      store(card.filename, card.file),
    ]);
    return NextResponse.json({ url: fullBlob.url, aiGenerated });
  } catch (error) {
    console.error("Image upload failed:", error);
    return fail(text.failed, 500);
  }
}
