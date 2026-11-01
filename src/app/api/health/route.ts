import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fingerprintDatabase, getDatabaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

function getRuntime() {
  return typeof Bun === "undefined"
    ? { name: "node", version: process.version }
    : { name: "bun", version: Bun.version };
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
