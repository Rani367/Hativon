import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const query = mock(async () => [{ "?column?": 1 }]);
mock.module("@/lib/db", () => ({ db: () => query }));

const { GET } = await import("../route");

const PRODUCTION_URL =
  "postgresql://user:secret@ep-example-pooler.us-east-1.aws.neon.tech/neondb";

describe("GET /api/health", () => {
  const originalUrl = process.env.POSTGRES_URL;

  beforeEach(() => {
    query.mockClear();
    query.mockImplementation(async () => [{ "?column?": 1 }]);
    process.env.POSTGRES_URL = PRODUCTION_URL;
  });

  afterEach(() => {
    process.env.POSTGRES_URL = originalUrl;
  });

  it("reports a healthy database", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.database.ok).toBe(true);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("never exposes the connection string", async () => {
    const text = await (await GET()).text();

    expect(text).not.toContain("secret");
    expect(text).not.toContain("ep-example");
    expect(text).not.toContain("neon.tech");
  });

  it("gives pooled and direct connections the same fingerprint", async () => {
    const pooled = await (await GET()).json();

    process.env.POSTGRES_URL = PRODUCTION_URL.replace("-pooler", "");
    const direct = await (await GET()).json();

    expect(direct.database.fingerprint).toBe(pooled.database.fingerprint);
  });

  it("gives different databases different fingerprints", async () => {
    const production = await (await GET()).json();

    process.env.POSTGRES_URL = PRODUCTION_URL.replace("ep-example", "ep-other");
    const preview = await (await GET()).json();

    expect(preview.database.fingerprint).not.toBe(production.database.fingerprint);
  });

  it("answers 503 and hides the error when the query fails", async () => {
    query.mockImplementation(async () => {
      throw new Error("connection to ep-example.neon.tech failed");
    });

    const response = await GET();
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(JSON.parse(text).ok).toBe(false);
    expect(text).not.toContain("ep-example");
  });

  it("answers 503 when no database is configured", async () => {
    delete process.env.POSTGRES_URL;

    const response = await GET();

    expect(response.status).toBe(503);
    expect(query).not.toHaveBeenCalled();
  });
});
