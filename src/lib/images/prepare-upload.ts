import { studioCopy } from "@/lib/studio-copy";
import { bytesHaveAiProvenance } from "./ai-metadata";

/**
 * Gets a photo ready to send. Phones produce files too large for Vercel's roughly
 * 4.5 MB request limit, and iPhones produce HEIC, which the server can't read.
 * Both are fixed here, in the browser. Resizing strips metadata, so the AI scan
 * has to happen first.
 */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_SIDE = 2600;

type Format = "jpeg" | "png" | "gif" | "webp" | "heic" | null;

function detectFormat(bytes: Uint8Array): Format {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));

  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "jpeg";
  if (ascii(1, 4) === "PNG") return "png";
  if (ascii(0, 3) === "GIF") return "gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(4, 8) === "ftyp" && /hei|hev|mif|msf/.test(ascii(8, 12))) return "heic";
  return null;
}

async function decode(file: File, format: Format): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch (error) {
    if (format !== "heic") throw error;
  }

  // Safari opens HEIC by itself. This decoder is large, so it only loads for the
  // rare browser that needs it.
  const { heicTo } = await import("heic-to/csp");
  const converted = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
  return createImageBitmap(converted);
}

async function encodeJpeg(
  image: ImageBitmap,
  scale: number,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("No canvas");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))),
      "image/jpeg",
      quality,
    );
  });
}

export interface PreparedImage {
  file: File;
  aiProvenance: boolean;
}

/** Throws an Error with a message to show the person if the file can't be used. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const { upload: text } = studioCopy;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const aiProvenance = bytesHaveAiProvenance(bytes);
  const format = detectFormat(bytes);

  if (!format) throw new Error(text.notImage);

  if (format !== "heic" && file.size <= MAX_UPLOAD_BYTES) {
    return { file, aiProvenance };
  }

  // Re-encoding a GIF would lose its animation.
  if (format === "gif") throw new Error(text.gifTooLarge);

  let image: ImageBitmap;
  try {
    image = await decode(file, format);
  } catch {
    throw new Error(text.heicFailed);
  }

  let scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
  let blob = await encodeJpeg(image, scale, 0.85);

  while (blob.size > MAX_UPLOAD_BYTES && scale > 0.2) {
    scale *= 0.8;
    blob = await encodeJpeg(image, scale, 0.8);
  }

  image.close();

  if (blob.size > MAX_UPLOAD_BYTES) throw new Error(text.tooLarge);

  const name = `${file.name.replace(/\.[^.]+$/, "")}.jpg`;
  return { file: new File([blob], name, { type: "image/jpeg" }), aiProvenance };
}

export interface UploadOptions {
  purpose?: "cover" | "inline";
  crop?: { x: number; y: number; width: number; height: number };
  aiProvenance?: boolean;
}

/** Sends a prepared file. Throws an Error with a message to show on failure. */
export async function uploadImage(
  file: File,
  { purpose = "cover", crop, aiProvenance }: UploadOptions = {},
): Promise<{ url: string; aiGenerated: boolean }> {
  const form = new FormData();
  form.append("file", file);
  form.append("purpose", purpose);
  if (aiProvenance) form.append("aiProvenance", "1");

  if (crop) {
    form.append("cropX", String(Math.round(crop.x)));
    form.append("cropY", String(Math.round(crop.y)));
    form.append("cropWidth", String(Math.round(crop.width)));
    form.append("cropHeight", String(Math.round(crop.height)));
  }

  const response = await fetch("/api/upload", { method: "POST", body: form });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(data.error ?? studioCopy.upload.failed);
  return data;
}
