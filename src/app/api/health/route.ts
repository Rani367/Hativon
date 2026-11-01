import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDatabaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

function getRuntime() {
  return typeof Bun === "undefined"
    ? { name: "node", version: process.version }
    : { name: "bun", version: Bun.version };
}

/**
 * A one-way fingerprint of the database host, so two deployments can be
 * compared without revealing either host. Pooled and direct connections to the
 * same database share a fingerprint.
 */
function fingerprintDatabase(url: string): string {
  const host = new URL(url).hostname.replace("-pooler", "");
  return createHash("sha256").update(host).digest("hex").slice(0, 12);
}

export async function GET() {
  const runtime = getRuntime();
  const environment = process.env.VERCEL_ENV ?? "local";
  const url = getDatabaseUrl();

  if (!url) {
    return NextResponse.json(
      { ok: false, runtime, environment, database: { ok: false } },
      { status: 503 },
    );
  }

  const fingerprint = fingerprintDatabase(url);

  try {
    await db()`SELECT 1`;
    return NextResponse.json({
      ok: true,
      runtime,
      environment,
      database: { ok: true, fingerprint },
    });
  } catch {
    // The error can contain connection details, so it stays out of the response.
    return NextResponse.json(
      { ok: false, runtime, environment, database: { ok: false, fingerprint } },
      { status: 503 },
    );
  }
}
