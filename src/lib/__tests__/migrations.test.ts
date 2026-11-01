import { describe, expect, it } from "bun:test";
import {
  PRODUCTION_DATABASE_FINGERPRINT,
  assertSafeTarget,
  findPending,
  parseMigrationFilename,
} from "../migrations";

describe("parseMigrationFilename", () => {
  it("reads the id and name", () => {
    expect(parseMigrationFilename("0003_teacher_hold.sql")).toEqual({
      id: "0003",
      name: "teacher_hold",
      filename: "0003_teacher_hold.sql",
    });
  });

  it("ignores anything else", () => {
    expect(parseMigrationFilename("README.md")).toBeNull();
    expect(parseMigrationFilename("3_short.sql")).toBeNull();
    expect(parseMigrationFilename("0003_Bad-Name.sql")).toBeNull();
  });
});

describe("findPending", () => {
  it("returns unapplied migrations in id order", () => {
    const pending = findPending(
      ["0002_b.sql", "0000_a.sql", "0001_c.sql"],
      ["0001"],
    );
    expect(pending.map((migration) => migration.id)).toEqual(["0000", "0002"]);
  });

  it("returns nothing when everything is applied", () => {
    expect(findPending(["0000_a.sql"], ["0000"])).toEqual([]);
  });

  it("refuses two migrations with the same id", () => {
    expect(() => findPending(["0001_a.sql", "0001_b.sql"], [])).toThrow(
      "share the id 0001",
    );
  });
});

describe("assertSafeTarget", () => {
  it("refuses production by default", () => {
    expect(() =>
      assertSafeTarget(PRODUCTION_DATABASE_FINGERPRINT, false),
    ).toThrow("production database");
  });

  it("allows production only when explicitly told to", () => {
    expect(() =>
      assertSafeTarget(PRODUCTION_DATABASE_FINGERPRINT, true),
    ).not.toThrow();
  });

  it("allows any other database", () => {
    expect(() => assertSafeTarget("dfbc216dbe8b", false)).not.toThrow();
  });
});
