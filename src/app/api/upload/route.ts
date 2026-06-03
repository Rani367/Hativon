import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth/middleware";
import { logError } from "@/lib/logger";
import { createPostImageVariants, fileToDataUrl } from "@/lib/images/server";
import { bufferHasAiProvenance } from "@/lib/images/ai-metadata";

/**
 * Image file signatures (magic bytes) for validation
 * This prevents MIME type spoofing attacks
 */
const IMAGE_SIGNATURES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
};

/**
 * Validate that file content matches known image signatures
 */
async function validateImageSignature(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const signatures of Object.values(IMAGE_SIGNATURES)) {
    for (const sig of signatures) {
      if (sig.every((byte, i) => bytes[i] === byte)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Upload image to Vercel Blob
 * Requires authentication
 * Falls back to base64 data URL in development without BLOB_READ_WRITE_TOKEN
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the file from form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type (MIME type check)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 },
      );
    }

    // Validate file signature (magic bytes check)
    const isValidImage = await validateImageSignature(file);
    if (!isValidImage) {
      return NextResponse.json(
        { error: "Invalid image file format" },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    // Detect AI-provenance metadata on the ORIGINAL bytes — re-encoding into
    // the card/full variants below strips it, so this must run first.
    const aiGenerated = bufferHasAiProvenance(
      Buffer.from(await file.arrayBuffer()),
    );

    const variants = await createPostImageVariants(file);

    // Check if Vercel Blob token is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      // Fallback to optimized data URLs for local development
      const [fullDataUrl, cardDataUrl] = await Promise.all([
        fileToDataUrl(variants.full.file),
        fileToDataUrl(variants.card.file),
      ]);

      return NextResponse.json({
        url: fullDataUrl,
        cardUrl: cardDataUrl,
        filename: variants.full.filename,
        aiGenerated,
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const assetId = `${timestamp}-${randomString}`;
    const fullPath = `posts/${assetId}/${variants.full.filename}`;
    const cardPath = `posts/${assetId}/${variants.card.filename}`;

    // Upload to Vercel Blob
    const [fullBlob, cardBlob] = await Promise.all([
      put(fullPath, variants.full.file, {
        access: "public",
      }),
      put(cardPath, variants.card.file, {
        access: "public",
      }),
    ]);

    return NextResponse.json({
      url: fullBlob.url,
      cardUrl: cardBlob.url,
      filename: fullPath,
      aiGenerated,
    });
  } catch (error) {
    logError("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 },
    );
  }
}
