#!/usr/bin/env bun
/**
 * Backfill AI image detection for existing posts.
 *
 * Scans each post's cover image with the configured detector and stores the
 * result (is_ai_generated / ai_detection_score / ai_detected_at). Already-scanned
 * posts are skipped unless --force is passed.
 *
 * Usage:
 *   bun run ai:backfill --dry-run            # show what would be scanned
 *   bun run ai:backfill --limit=10           # scan first 10 unscanned posts
 *   bun run ai:backfill --force              # re-scan everything
 *
 * Requires HUGGINGFACE_API_KEY in .env.local (free token).
 */

import { resolve } from "path";
import { config } from "dotenv";
import { db } from "@/lib/db/client";
import { detectAiImage } from "@/lib/ai-detection/detect";

config({ path: resolve(__dirname, "../.env.local") });

interface PostImageRow {
  id: string;
  cover_image: string;
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

// Pause between calls to stay within the Hugging Face free-tier rate limit.
const THROTTLE_MS = 1500;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  if (!process.env.HUGGINGFACE_API_KEY && !dryRun) {
    throw new Error(
      "HUGGINGFACE_API_KEY is required unless --dry-run is set (get a free token at https://huggingface.co/settings/tokens)",
    );
  }

  const result = force
    ? await db.query`
        SELECT id, cover_image
        FROM posts
        WHERE cover_image IS NOT NULL AND cover_image != ''
        ORDER BY created_at DESC
      `
    : await db.query`
        SELECT id, cover_image
        FROM posts
        WHERE cover_image IS NOT NULL AND cover_image != ''
          AND ai_detected_at IS NULL
        ORDER BY created_at DESC
      `;

  const rows = result.rows as PostImageRow[];
  const selectedRows = limit ? rows.slice(0, limit) : rows;

  console.log(
    `[AI-DETECT] ${dryRun ? "Would scan" : "Scanning"} ${selectedRows.length} post image(s)`,
  );

  let flagged = 0;

  for (const row of selectedRows) {
    if (dryRun) {
      console.log(`[AI-DETECT] Would scan ${row.id}`);
      continue;
    }

    try {
      // Generous timeout + cold-model wait since this runs offline, not in a request.
      const detection = await detectAiImage(row.cover_image, {
        timeoutMs: 30000,
        waitForModel: true,
      });

      await db.query`
        UPDATE posts
        SET is_ai_generated = ${detection.isAiGenerated},
            ai_detection_score = ${detection.score},
            ai_detected_at = NOW()
        WHERE id = ${row.id}
      `;

      if (detection.isAiGenerated) flagged++;
      console.log(
        `[AI-DETECT] ${row.id}: ${
          detection.isAiGenerated ? "AI-generated" : "not AI"
        }${detection.score !== null ? ` (score ${detection.score.toFixed(3)})` : ""}`,
      );
    } catch (error) {
      console.error(`[AI-DETECT] Failed ${row.id}:`, error);
    }

    await sleep(THROTTLE_MS);
  }

  if (!dryRun) {
    console.log(
      `[AI-DETECT] Done. Flagged ${flagged} of ${selectedRows.length} as AI-generated.`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[AI-DETECT] Backfill failed:", error);
    process.exit(1);
  });
