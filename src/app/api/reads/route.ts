import { after, NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin } from "@/lib/auth/guards";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

const BOTS = /bot|crawl|spider|slurp|preview|fetch|headless|lighthouse/i;

const payloadSchema = z.object({ id: z.string().uuid() });

/**
 * Counts one read: the browser sends this after 10 visible seconds, once per
 * device. Only a number is stored, nothing about who read it.
 *
 * It answers straight away and counts afterwards, so it never delays a reader.
 */
export async function POST(request: Request) {
  const done = new NextResponse(null, { status: 204 });

  if (!isSameOrigin(request)) return done;
  if (BOTS.test(request.headers.get("user-agent") ?? "")) return done;

  const payload = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) return done;

  const { id } = payload.data;
  const ip = await getClientIp();
  const user = await getSessionUser();

  after(async () => {
    if (await isRateLimited("read", ip)) return;

    // Writers reading their own article don't count.
    await db()`
      INSERT INTO post_reads (post_id, read_count)
      SELECT id, 1 FROM posts
      WHERE id = ${id}
        AND status = 'published'
        AND author_id IS DISTINCT FROM ${user?.id ?? null}
      ON CONFLICT (post_id) DO UPDATE
      SET read_count = post_reads.read_count + 1, updated_at = CURRENT_TIMESTAMP
    `;
  });

  return done;
}
