#!/usr/bin/env bun

import { resolve } from "path";
import { config } from "dotenv";
import { put } from "@vercel/blob";
import { db } from "@/lib/db/client";
import {
  createPostImageVariants,
} from "@/lib/images/server";
import { isOptimizedPostCoverUrl } from "@/lib/images/post-images";

config({ path: resolve(__dirname, "../.env.local") });

interface PostImageRow {
  id: string;
  cover_image: string;
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

function extensionFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("webp")) return "webp";
  return "jpg";
}

async function fetchCoverImage(url: string): Promise<File | null> {
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    return null;
  }

  const buffer = await response.arrayBuffer();
  const extension = extensionFromContentType(contentType);
  return new File([buffer], `cover.${extension}`, { type: contentType });
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !dryRun) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required unless --dry-run is set");
  }

  const result = await db.query`
    SELECT id, cover_image
    FROM posts
    WHERE cover_image IS NOT NULL
      AND cover_image != ''
    ORDER BY created_at DESC
  `;

  const rows = (result.rows as PostImageRow[]).filter(
    (row) => !isOptimizedPostCoverUrl(row.cover_image),
  );
  const selectedRows = limit ? rows.slice(0, limit) : rows;

  console.log(
    `[IMAGES] ${dryRun ? "Would process" : "Processing"} ${selectedRows.length} post images`,
  );

  for (const row of selectedRows) {
    try {
      const sourceFile = await fetchCoverImage(row.cover_image);
      if (!sourceFile) {
        console.warn(`[IMAGES] Skipping ${row.id}: could not fetch image`);
        continue;
      }

      if (dryRun) {
        console.log(`[IMAGES] Would optimize ${row.id}`);
        continue;
      }

      const variants = await createPostImageVariants(sourceFile);
      const assetId = `${Date.now()}-${row.id.slice(0, 8)}`;
      const fullPath = `posts/${assetId}/${variants.full.filename}`;
      const cardPath = `posts/${assetId}/${variants.card.filename}`;

      const [fullBlob] = await Promise.all([
        put(fullPath, variants.full.file, { access: "public" }),
        put(cardPath, variants.card.file, { access: "public" }),
      ]);

      await db.query`
        UPDATE posts
        SET cover_image = ${fullBlob.url},
            updated_at = updated_at
        WHERE id = ${row.id}
      `;

      console.log(`[IMAGES] Optimized ${row.id}`);
    } catch (error) {
      console.error(`[IMAGES] Failed ${row.id}:`, error);
    }
  }
}

main().catch((error) => {
  console.error("[IMAGES] Backfill failed:", error);
  process.exit(1);
});
