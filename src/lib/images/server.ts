import sharp from "sharp";

export interface PostImageVariantFile {
  file: File;
  filename: string;
}

export interface PostImageVariants {
  full: PostImageVariantFile;
  card: PostImageVariantFile;
}

const FULL_MAX_WIDTH = 1600;
const FULL_MAX_HEIGHT = 1200;
const CARD_WIDTH = 768;
const CARD_HEIGHT = 576;

function bufferToFile(
  buffer: Buffer,
  filename: string,
  type: string,
): File {
  return new File([new Uint8Array(buffer)], filename, { type });
}

export async function createPostImageVariants(file: File): Promise<PostImageVariants> {
  const input = Buffer.from(await file.arrayBuffer());
  const isGif = file.type === "image/gif";

  const cardBuffer = await sharp(input, { animated: false, failOn: "none" })
    .rotate()
    .resize(CARD_WIDTH, CARD_HEIGHT, {
      fit: "cover",
      position: sharp.strategy.attention,
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
