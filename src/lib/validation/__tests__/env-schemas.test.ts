import { describe, it, expect } from "vitest";
import {
  adminPasswordSchema,
  envSchema,
  usernameSchema,
  userRegistrationSchema,
  postInputSchema,
  validateSchema,
  displayNameSchema,
  postTitleSchema,
  postContentSchema,
  tagsSchema,
} from "../schemas";

describe("Environment and Admin Schemas", () => {
  describe("adminPasswordSchema", () => {
    it("accepts non-empty password", () => {
      expect(adminPasswordSchema.safeParse({ password: "admin" }).success).toBe(
        true,
      );
    });

    it("rejects empty password", () => {
      expect(adminPasswordSchema.safeParse({ password: "" }).success).toBe(
        false,
      );
    });

    it("rejects missing password", () => {
      expect(adminPasswordSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("envSchema", () => {
    const validEnv = {
      JWT_SECRET: "a".repeat(32),
      ADMIN_PASSWORD: "password12",
      NEXT_PUBLIC_SITE_URL: "https://example.com",
    };

    it("accepts valid environment variables", () => {
      expect(envSchema.safeParse(validEnv).success).toBe(true);
    });

    it("rejects JWT_SECRET shorter than 32 characters", () => {
      const result = envSchema.safeParse({
        ...validEnv,
        JWT_SECRET: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects ADMIN_PASSWORD shorter than 8 characters", () => {
      const result = envSchema.safeParse({
        ...validEnv,
        ADMIN_PASSWORD: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid NEXT_PUBLIC_SITE_URL", () => {
      const result = envSchema.safeParse({
        ...validEnv,
        NEXT_PUBLIC_SITE_URL: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("accepts optional POSTGRES_URL", () => {
      const result = envSchema.safeParse({
        ...validEnv,
        POSTGRES_URL: "postgres://localhost/db",
      });
      expect(result.success).toBe(true);
    });

    it("validates SESSION_DURATION format", () => {
      const validDurations = ["1s", "30m", "24h", "7d"];
      validDurations.forEach((duration) => {
        const result = envSchema.safeParse({
          ...validEnv,
          SESSION_DURATION: duration,
        });
        expect(result.success).toBe(true);
      });

      const invalidDurations = ["1", "30", "1w", "abc"];
      invalidDurations.forEach((duration) => {
        const result = envSchema.safeParse({
          ...validEnv,
          SESSION_DURATION: duration,
        });
        expect(result.success).toBe(false);
      });
    });

    it("validates NODE_ENV values", () => {
      ["development", "production", "test"].forEach((env) => {
        const result = envSchema.safeParse({
          ...validEnv,
          NODE_ENV: env,
        });
        expect(result.success).toBe(true);
      });

      const result = envSchema.safeParse({
        ...validEnv,
        NODE_ENV: "staging",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("validateSchema helper", () => {
  it("returns success with data for valid input", () => {
    const result = validateSchema(usernameSchema, "validuser");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("validuser");
    }
  });

  it("returns errors for invalid input", () => {
    const result = validateSchema(usernameSchema, "ab");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeDefined();
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    }
  });

  it("formats nested path errors correctly", () => {
    const nestedSchema = userRegistrationSchema;
    const result = validateSchema(nestedSchema, {
      username: "ab", // too short
      password: "short", // too short
      displayName: "Test",
      grade: "ח",
      classNumber: 2,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.username).toBeDefined();
      expect(result.errors.password).toBeDefined();
    }
  });

  it("handles multiple validation errors per field", () => {
    const result = validateSchema(postInputSchema, {
      title: "",
      content: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.title).toBeDefined();
      expect(result.errors.content).toBeDefined();
    }
  });
});

describe("Hebrew/Unicode handling", () => {
  it("handles Hebrew usernames in display name", () => {
    const result = displayNameSchema.safeParse("משה כהן");
    expect(result.success).toBe(true);
  });

  it("rejects Hebrew in username (English only)", () => {
    const result = usernameSchema.safeParse("משתמש");
    expect(result.success).toBe(false);
  });

  it("allows Hebrew in post title", () => {
    const result = postTitleSchema.safeParse("כותרת המאמר החדש");
    expect(result.success).toBe(true);
  });

  it("allows Hebrew in post content", () => {
    const result = postContentSchema.safeParse("תוכן בעברית עם אותיות");
    expect(result.success).toBe(true);
  });

  it("allows Hebrew tags", () => {
    const result = tagsSchema.safeParse(["חדשות", "ספורט", "תרבות"]);
    expect(result.success).toBe(true);
  });
});
