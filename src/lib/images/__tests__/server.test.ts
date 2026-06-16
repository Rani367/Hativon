import { describe, it, expect } from "bun:test";
import sharp from "sharp";
import { createPostImageVariants, type CropRect } from "@/lib/images/server";

const CARD_WIDTH = 768;
const CARD_HEIGHT = 576;

function bufferToFile(buffer: Buffer, name: string, type: string): File {
  return new File([new Uint8Array(buffer)], name, { type });
}

/**
 * Build a JPEG whose left half is red and right half is blue, so a crop's
 * dominant colour reveals which region was extracted.
 */
async function makeHalvesJpeg(width = 1000, height = 750): Promise<Buffer> {
  const half = Math.floor(width / 2);
  const left = await sharp({
    create: { width: half, height, channels: 3, background: { r: 220, g: 20, b: 20 } },
  })
    .png()
    .toBuffer();
  const right = await sharp({
    create: { width: width - half, height, channels: 3, background: { r: 20, g: 20, b: 220 } },
  })
    .png()
    .toBuffer();
  return sharp({
    create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .composite([
      { input: left, left: 0, top: 0 },
      { input: right, left: half, top: 0 },
    ])
    .jpeg({ quality: 95 })
    .toBuffer();
}

async function cardDimensions(file: File): Promise<{ width?: number; height?: number }> {
  const buf = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(buf).metadata();
  return { width: meta.width, height: meta.height };
}

async function cardMeanRgb(file: File): Promise<[number, number, number]> {
  const buf = Buffer.from(await file.arrayBuffer());
  const stats = await sharp(buf).stats();
  return [
    stats.channels[0].mean,
    stats.channels[1].mean,
    stats.channels[2].mean,
  ];
}

describe("createPostImageVariants", () => {
  it("produces a 768x576 webp card with no crop", async () => {
    const file = bufferToFile(await makeHalvesJpeg(), "photo.jpg", "image/jpeg");

    const variants = await createPostImageVariants(file);

    expect(variants.card.filename).toBe("card.webp");
    expect(variants.card.file.type).toBe("image/webp");
    expect(await cardDimensions(variants.card.file)).toEqual({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
    expect(variants.full.filename).toBe("full.webp");
  });

  it("extracts the chosen region for the card (left → red)", async () => {
    const file = bufferToFile(await makeHalvesJpeg(), "photo.jpg", "image/jpeg");
    const crop: CropRect = { x: 0, y: 0, width: 480, height: 360 };

    const variants = await createPostImageVariants(file, crop);

    expect(await cardDimensions(variants.card.file)).toEqual({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
    const [r, , b] = await cardMeanRgb(variants.card.file);
    expect(r).toBeGreaterThan(b);
  });

  it("extracts the chosen region for the card (right → blue)", async () => {
    const file = bufferToFile(await makeHalvesJpeg(), "photo.jpg", "image/jpeg");
    const crop: CropRect = { x: 520, y: 0, width: 480, height: 360 };

    const variants = await createPostImageVariants(file, crop);

    const [r, , b] = await cardMeanRgb(variants.card.file);
    expect(b).toBeGreaterThan(r);
  });

  it("falls back to a valid card for an out-of-bounds crop", async () => {
    const file = bufferToFile(await makeHalvesJpeg(), "photo.jpg", "image/jpeg");
    const crop: CropRect = { x: 99999, y: 99999, width: 500, height: 500 };

    const variants = await createPostImageVariants(file, crop);

    expect(await cardDimensions(variants.card.file)).toEqual({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
  });

  it("falls back for a NaN crop without throwing", async () => {
    const file = bufferToFile(await makeHalvesJpeg(), "photo.jpg", "image/jpeg");
    const crop: CropRect = { x: NaN, y: 0, width: 480, height: 360 };

    const variants = await createPostImageVariants(file, crop);

    expect(await cardDimensions(variants.card.file)).toEqual({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
  });

  it("falls back for a too-small crop region", async () => {
    const file = bufferToFile(await makeHalvesJpeg(), "photo.jpg", "image/jpeg");
    const crop: CropRect = { x: 0, y: 0, width: 10, height: 10 };

    const variants = await createPostImageVariants(file, crop);

    expect(await cardDimensions(variants.card.file)).toEqual({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
  });

  it("applies a crop in oriented space for an EXIF-rotated image", async () => {
    // Stored 1000x750, orientation 6 → displays as 750 wide x 1000 tall.
    const base = await makeHalvesJpeg(1000, 750);
    const oriented = await sharp(base)
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const file = bufferToFile(oriented, "rotated.jpg", "image/jpeg");
    // Crop within the oriented (750x1000) bounds — must not throw "bad extract area".
    const crop: CropRect = { x: 0, y: 0, width: 300, height: 400 };

    const variants = await createPostImageVariants(file, crop);

    expect(await cardDimensions(variants.card.file)).toEqual({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
  });

  it("ignores the crop for GIFs and keeps the original as the full variant", async () => {
    const gif = await sharp({
      create: { width: 400, height: 300, channels: 3, background: { r: 10, g: 200, b: 10 } },
    })
      .gif()
      .toBuffer();
    const file = bufferToFile(gif, "anim.gif", "image/gif");
    const crop: CropRect = { x: 0, y: 0, width: 200, height: 150 };

    const variants = await createPostImageVariants(file, crop);

    expect(variants.full.filename).toBe("full.gif");
    expect(variants.full.file.type).toBe("image/gif");
    expect(variants.card.file.type).toBe("image/webp");
    expect(await cardDimensions(variants.card.file)).toEqual({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
  });
});
