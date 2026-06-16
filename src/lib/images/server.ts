import sharp from "sharp";

export interface PostImageVariantFile {
  file: File;
  filename: string;
}

export interface PostImageVariants {
  full: PostImageVariantFile;
  card: PostImageVariantFile;
}

/** A crop rectangle in natural (EXIF-oriented) image pixels. */
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
/** Reject crops smaller than this on either side, so we never upscale a tiny region. */
const MIN_CROP_SIZE = 32;

function bufferToFile(
  buffer: Buffer,
  filename: string,
  type: string,
): File {
  return new File([new Uint8Array(buffer)], filename, { type });
}

/**
 * Clamp a (possibly out-of-bounds or malformed) crop rect to integer pixels that
 * sit fully inside the oriented image. Returns null when nothing usable remains, so
 * the caller can fall back to the automatic attention crop instead of throwing
 * Sharp's "extract_area: bad extract area".
 */
function clampCropRect(
  crop: CropRect,
  orientedWidth: number,
  orientedHeight: number,
): { left: number; top: number; width: number; height: number } | null {
  const rx = Math.round(crop.x);
  const ry = Math.round(crop.y);
  const rw = Math.round(crop.width);
  const rh = Math.round(crop.height);
  if (![rx, ry, rw, rh].every(Number.isFinite)) return null;
  if (orientedWidth < 1 || orientedHeight < 1) return null;

  const left = Math.min(Math.max(rx, 0), orientedWidth - 1);
  const top = Math.min(Math.max(ry, 0), orientedHeight - 1);
  // Shrink so left+width / top+height never exceed the oriented bounds.
  const width = Math.min(Math.max(rw, 1), orientedWidth - left);
  const height = Math.min(Math.max(rh, 1), orientedHeight - top);

  if (width < MIN_CROP_SIZE || height < MIN_CROP_SIZE) return null;
  return { left, top, width, height };
}

/**
 * Resolve the crop rect against the image's oriented dimensions. Reads metadata from
 * a `.rotate()`-ed instance so `autoOrient` reflects the same orientation the browser
 * (and thus the client crop coordinates) used. Returns null on any failure or when the
 * rect is unusable, so the card pipeline falls back to the attention crop.
 */
async function resolveCardCrop(
  input: Buffer,
  crop: CropRect | undefined,
): Promise<{ left: number; top: number; width: number; height: number } | null> {
  if (!crop) return null;
  try {
    const meta = await sharp(input, { failOn: "none" }).rotate().metadata();
    const oriented = meta.autoOrient;
    if (!oriented?.width || !oriented?.height) return null;
    return clampCropRect(crop, oriented.width, oriented.height);
  } catch {
    return null;
  }
}

export async function createPostImageVariants(
  file: File,
  crop?: CropRect,
): Promise<PostImageVariants> {
  const input = Buffer.from(await file.arrayBuffer());
  const isGif = file.type === "image/gif";

  // GIFs keep the automatic card crop (the still card only ever sees frame 1).
  const cardRect = isGif ? null : await resolveCardCrop(input, crop);

  const cardPipeline = sharp(input, { animated: false, failOn: "none" }).rotate();
  if (cardRect) {
    // rotate() ran first, so the extract coords share the browser's oriented space.
    cardPipeline.extract(cardRect);
  }
  // Always resize after extract: float crops aren't pixel-perfect 4:3, cover absorbs it.
  const cardBuffer = await cardPipeline
    .resize(CARD_WIDTH, CARD_HEIGHT, {
      fit: "cover",
      ...(cardRect ? {} : { position: sharp.strategy.attention }),
    })
    .webp({ quality: 72 })
    .toBuffer();

  if (isGif) {
    return {
      full: {
        file,
        filename: "full.gif",
      },
      card: {
        file: bufferToFile(cardBuffer, "card.webp", "image/webp"),
        filename: "card.webp",
      },
    };
  }

  const fullBuffer = await sharp(input, { failOn: "none" })
    .rotate()
    .resize(FULL_MAX_WIDTH, FULL_MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer();

  return {
    full: {
      file: bufferToFile(fullBuffer, "full.webp", "image/webp"),
      filename: "full.webp",
    },
    card: {
      file: bufferToFile(cardBuffer, "card.webp", "image/webp"),
      filename: "card.webp",
    },
  };
}

export async function fileToDataUrl(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}
