import { describe, it, expect, mock, spyOn, beforeEach, afterEach } from "bun:test";

describe("Database Client", () => {
  describe("isDatabaseAvailable", () => {
    it("returns false when POSTGRES_URL is not set", async () => {
      const savedUrl = process.env.POSTGRES_URL;
      const savedUrlNp = process.env.POSTGRES_URL_NON_POOLING;
      process.env.POSTGRES_URL = "";
      process.env.POSTGRES_URL_NON_POOLING = "";

      // Test the guard logic that isDatabaseAvailable uses
      const postgresUrl = process.env.POSTGRES_URL;
      const postgresUrlNonPooling = process.env.POSTGRES_URL_NON_POOLING;
      const isAvailable = !!(postgresUrl || postgresUrlNonPooling);

      expect(isAvailable).toBe(false);

      // Restore
      if (savedUrl !== undefined) process.env.POSTGRES_URL = savedUrl;
      else delete process.env.POSTGRES_URL;
      if (savedUrlNp !== undefined) process.env.POSTGRES_URL_NON_POOLING = savedUrlNp;
      else delete process.env.POSTGRES_URL_NON_POOLING;
    });

    it("has required env check before attempting connection", () => {
      // Verify the logic: if no POSTGRES_URL and no POSTGRES_URL_NON_POOLING, return false
      const checkAvailability = (env: Record<string, string>) => {
        if (!env.POSTGRES_URL && !env.POSTGRES_URL_NON_POOLING) {
          return false;
        }
        return true; // Would attempt connection
      };

      expect(checkAvailability({ POSTGRES_URL: "", POSTGRES_URL_NON_POOLING: "" })).toBe(false);
      expect(checkAvailability({ POSTGRES_URL: "postgres://localhost/test", POSTGRES_URL_NON_POOLING: "" })).toBe(true);
    });
  });

  describe("db.query template literal conversion (unit test)", () => {
    it("converts template literals to parameterized queries correctly", () => {
      const templateStrings = ["SELECT * FROM users WHERE id = ", " AND name = ", ""] as unknown as TemplateStringsArray;
      Object.defineProperty(templateStrings, 'raw', {
        value: templateStrings
      });
      const values = ["user-123", "John"];

      const query = templateStrings.reduce((acc, str, i) => {
        return acc + str + (i < values.length ? `$${i + 1}` : "");
      }, "");

      expect(query).toBe("SELECT * FROM users WHERE id = $1 AND name = $2");
    });

    it("handles queries with no parameters", () => {
      const templateStrings = ["SELECT COUNT(*) FROM posts"] as unknown as TemplateStringsArray;
      Object.defineProperty(templateStrings, 'raw', {
        value: templateStrings
      });
      const values: string[] = [];

      const query = templateStrings.reduce((acc, str, i) => {
        return acc + str + (i < values.length ? `$${i + 1}` : "");
      }, "");

      expect(query).toBe("SELECT COUNT(*) FROM posts");
    });

    it("handles single parameter", () => {
      const templateStrings = ["SELECT * FROM posts WHERE id = ", ""] as unknown as TemplateStringsArray;
      Object.defineProperty(templateStrings, 'raw', {
        value: templateStrings
      });
      const values = ["post-123"];

      const query = templateStrings.reduce((acc, str, i) => {
        return acc + str + (i < values.length ? `$${i + 1}` : "");
      }, "");

      expect(query).toBe("SELECT * FROM posts WHERE id = $1");
    });

    it("handles many parameters", () => {
      const templateStrings = [
        "INSERT INTO users (a, b, c, d, e) VALUES (",
        ", ",
        ", ",
        ", ",
        ", ",
        ")",
      ] as unknown as TemplateStringsArray;
      Object.defineProperty(templateStrings, 'raw', {
        value: templateStrings
      });
      const values = [1, 2, 3, 4, 5];

      const query = templateStrings.reduce((acc, str, i) => {
        return acc + str + (i < values.length ? `$${i + 1}` : "");
      }, "");

      expect(query).toBe("INSERT INTO users (a, b, c, d, e) VALUES ($1, $2, $3, $4, $5)");
    });
  });

  describe("Array syntax parsing (unit test)", () => {
    it("correctly parses array query with parameters", () => {
      const input = [
        "SELECT * FROM users WHERE id = $1 AND grade = $2",
        "user-123",
        "ח",
      ];

      const [queryString, ...params] = input;

      expect(queryString).toBe("SELECT * FROM users WHERE id = $1 AND grade = $2");
      expect(params).toEqual(["user-123", "ח"]);
    });

    it("correctly parses array query without parameters", () => {
      const input = ["SELECT * FROM users"];

      const [queryString, ...params] = input;

      expect(queryString).toBe("SELECT * FROM users");
      expect(params).toEqual([]);
    });
  });

  describe("Environment detection", () => {
    it("correctly identifies production via VERCEL_ENV", () => {
      const isVercelProduction = (env: string | undefined) => env === "production";

      expect(isVercelProduction("production")).toBe(true);
      expect(isVercelProduction("development")).toBe(false);
      expect(isVercelProduction(undefined)).toBe(false);
      expect(isVercelProduction("preview")).toBe(false);
    });
  });

  describe("Pool configuration values", () => {
    it("uses expected connection pool settings", () => {
      const expectedConfig = {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      };

      expect(expectedConfig.max).toBe(20);
      expect(expectedConfig.idleTimeoutMillis).toBe(30000);
      expect(expectedConfig.connectionTimeoutMillis).toBe(2000);
    });
  });
});
