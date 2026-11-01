import sharp from "sharp";

export interface PostImageFile {
  file: File;
  filename: string;
}

/** A crop rectangle in natural, EXIF-oriented image pixels. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const FULL_MAX_WIDTH = 1600;
const FULL_MAX_HEIGHT = 1200;
const CARD_WIDTH = 768;
const CARD_HEIGHT = 576;
/** Crops smaller than this are refused, so a tiny region is never blown up. */
const MIN_CROP_SIZE = 32;

function bufferToFile(buffer: Buffer, filename: string, type: string): File {
  return new File([new Uint8Array(buffer)], filename, { type });
}

/**
 * Fits a crop from the browser inside the image. Returns null if nothing usable
 * remains, so the card falls back to the automatic crop instead of Sharp throwing.
 */
function clampCropRect(crop: CropRect, width: number, height: number) {
  const [x, y, w, h] = [crop.x, crop.y, crop.width, crop.height].map(Math.round);
  if (![x, y, w, h].every(Number.isFinite) || width < 1 || height < 1) return null;

  const left = Math.min(Math.max(x, 0), width - 1);
  const top = Math.min(Math.max(y, 0), height - 1);
  const croppedWidth = Math.min(Math.max(w, 1), width - left);
  const croppedHeight = Math.min(Math.max(h, 1), height - top);

  if (croppedWidth < MIN_CROP_SIZE || croppedHeight < MIN_CROP_SIZE) return null;
  return { left, top, width: croppedWidth, height: croppedHeight };
}

async function resolveCardCrop(input: Buffer, crop?: CropRect) {
  if (!crop) return null;

  try {
    // rotate() first, so these are the same pixels the browser showed.
    const meta = await sharp(input, { failOn: "none" }).rotate().metadata();
    const { width, height } = meta.autoOrient ?? {};
    return width && height ? clampCropRect(crop, width, height) : null;
  } catch {
    return null;
  }
}

async function encodeFull(input: Buffer): Promise<PostImageFile> {
  const buffer = await sharp(input, { failOn: "none" })
    .rotate()
    .resize(FULL_MAX_WIDTH, FULL_MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();

  return {
    file: bufferToFile(buffer, "full.webp", "image/webp"),
    filename: "full.webp",
  };
}

/** A cover's two files. Their names are load-bearing: see post-images.ts. */
export async function createCoverImages(
  file: File,
  crop?: CropRect,
): Promise<{ full: PostImageFile; card: PostImageFile }> {
  const input = Buffer.from(await file.arrayBuffer());
  const isGif = file.type === "image/gif";

  // A GIF's card is a still of frame 1, so a crop chosen on it means little.
  const cardRect = isGif ? null : await resolveCardCrop(input, crop);

  const pipeline = sharp(input, { animated: false, failOn: "none" }).rotate();
  if (cardRect) pipeline.extract(cardRect);

  const cardBuffer = await pipeline
    .resize(CARD_WIDTH, CARD_HEIGHT, {
      fit: "cover",
      ...(cardRect ? {} : { position: sharp.strategy.attention }),
    })
    .webp({ quality: 72 })
    .toBuffer();

  return {
    full: isGif ? { file, filename: "full.gif" } : await encodeFull(input),
    card: {
      file: bufferToFile(cardBuffer, "card.webp", "image/webp"),
      filename: "card.webp",
    },
  };
}

/** An image inside an article has no card. */
export async function createInlineImage(file: File): Promise<PostImageFile> {
  return file.type === "image/gif"
    ? { file, filename: "full.gif" }
    : encodeFull(Buffer.from(await file.arrayBuffer()));
}
