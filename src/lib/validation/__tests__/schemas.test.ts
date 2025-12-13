import { describe, it, expect } from "vitest";
import {
  gradeSchema,
  classNumberSchema,
  usernameSchema,
  passwordSchema,
  displayNameSchema,
  emailSchema,
  userRegistrationSchema,
  userRegistrationFormSchema,
  userLoginSchema,
  userUpdateSchema,
  postStatusSchema,
  postTitleSchema,
  postContentSchema,
  postDescriptionSchema,
  coverImageSchema,
  tagsSchema,
  categorySchema,
  postInputSchema,
  postUpdateSchema,
  adminPasswordSchema,
  envSchema,
  validateSchema,
} from "../schemas";

describe("Validation Schemas", () => {
  describe("gradeSchema", () => {
    it("accepts valid Hebrew grades", () => {
      const validGrades = ["ז", "ח", "ט", "י"];

      validGrades.forEach((grade) => {
        const result = gradeSchema.safeParse(grade);
        expect(result.success).toBe(true);
      });
    });

    it("rejects invalid grades", () => {
      const invalidGrades = ["א", "ב", "7", "8", "9", "10", "", "כ"];

      invalidGrades.forEach((grade) => {
        const result = gradeSchema.safeParse(grade);
        expect(result.success).toBe(false);
      });
    });

    it("provides Hebrew error message", () => {
      const result = gradeSchema.safeParse("invalid");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("כיתה");
      }
    });
  });

  describe("classNumberSchema", () => {
    it("accepts valid class numbers as integers", () => {
      [1, 2, 3, 4].forEach((num) => {
        const result = classNumberSchema.safeParse(num);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(num);
        }
      });
    });

    it("accepts valid class numbers as strings", () => {
      ["1", "2", "3", "4"].forEach((str) => {
        const result = classNumberSchema.safeParse(str);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(parseInt(str));
        }
      });
    });

    it("rejects out of range numbers", () => {
      [0, 5, -1, 10, 100].forEach((num) => {
        const result = classNumberSchema.safeParse(num);
        expect(result.success).toBe(false);
      });
    });

    it("rejects invalid strings", () => {
      ["0", "5", "abc", "", "1.5"].forEach((str) => {
        const result = classNumberSchema.safeParse(str);
        expect(result.success).toBe(false);
      });
    });

    it("provides error for out of range value", () => {
      const result = classNumberSchema.safeParse(5);
      expect(result.success).toBe(false);
      if (!result.success) {
        // The refine check catches the out-of-range value
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe("usernameSchema", () => {
    it("accepts valid usernames", () => {
      const validUsernames = ["user123", "test_user", "ABC", "a_b_c", "user"];

      validUsernames.forEach((username) => {
        const result = usernameSchema.safeParse(username);
        expect(result.success).toBe(true);
      });
    });

    it("rejects usernames shorter than 3 characters", () => {
      const result = usernameSchema.safeParse("ab");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("לפחות 3 תווים");
      }
    });

    it("rejects usernames longer than 50 characters", () => {
      const longUsername = "a".repeat(51);
      const result = usernameSchema.safeParse(longUsername);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("50 תווים");
      }
    });

    it("rejects usernames with special characters", () => {
      const invalidUsernames = [
        "user@name",
        "user name",
        "user-name",
        "user.name",
        "שם_משתמש",
      ];

      invalidUsernames.forEach((username) => {
        const result = usernameSchema.safeParse(username);
        expect(result.success).toBe(false);
      });
    });

    it("accepts exactly 3 characters", () => {
      const result = usernameSchema.safeParse("abc");
      expect(result.success).toBe(true);
    });

    it("accepts exactly 50 characters", () => {
      const result = usernameSchema.safeParse("a".repeat(50));
      expect(result.success).toBe(true);
    });
  });

  describe("passwordSchema", () => {
    it("accepts valid passwords", () => {
      const validPasswords = [
        "password123",
        "12345678",
        "a".repeat(100),
        "P@ssw0rd!",
      ];

      validPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it("rejects passwords shorter than 8 characters", () => {
      const result = passwordSchema.safeParse("1234567");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("לפחות 8 תווים");
      }
    });

    it("rejects passwords longer than 100 characters", () => {
      const result = passwordSchema.safeParse("a".repeat(101));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("100 תווים");
      }
    });

    it("accepts exactly 8 characters", () => {
      const result = passwordSchema.safeParse("12345678");
      expect(result.success).toBe(true);
    });
  });

  describe("displayNameSchema", () => {
    it("accepts valid display names", () => {
      const validNames = ["יוסי כהן", "Test User", "שם", "Name with spaces"];

      validNames.forEach((name) => {
        const result = displayNameSchema.safeParse(name);
        expect(result.success).toBe(true);
      });
    });

    it("rejects names shorter than 2 characters", () => {
      const result = displayNameSchema.safeParse("a");
      expect(result.success).toBe(false);
    });

    it("rejects names longer than 100 characters", () => {
      const result = displayNameSchema.safeParse("a".repeat(101));
      expect(result.success).toBe(false);
    });
  });

  describe("emailSchema", () => {
    it("accepts valid emails", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.org",
        "user+tag@example.co.il",
      ];

      validEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
      });
    });

    it("accepts empty string (optional)", () => {
      const result = emailSchema.safeParse("");
      expect(result.success).toBe(true);
    });

    it("accepts undefined (optional)", () => {
      const result = emailSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("rejects invalid emails", () => {
      const invalidEmails = ["not-an-email", "@nodomain.com", "missing@.com"];

      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("userRegistrationSchema", () => {
    const validRegistration = {
      username: "testuser",
      password: "password123",
      displayName: "Test User",
      grade: "ח" as const,
      classNumber: 2,
    };

    it("accepts valid registration data", () => {
      const result = userRegistrationSchema.safeParse(validRegistration);
      expect(result.success).toBe(true);
    });

    it("validates all fields together", () => {
      const invalid = {
        username: "ab", // too short
        password: "1234567", // too short
        displayName: "a", // too short
        grade: "invalid",
        classNumber: 5, // out of range
      };

      const result = userRegistrationSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it("rejects missing required fields", () => {
      const incomplete = {
        username: "testuser",
      };

      const result = userRegistrationSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });

  describe("userRegistrationFormSchema", () => {
    const validForm = {
      username: "testuser",
      password: "password123",
      confirmPassword: "password123",
      displayName: "Test User",
      grade: "ח" as const,
      classNumber: 2,
    };

    it("accepts matching passwords", () => {
      const result = userRegistrationFormSchema.safeParse(validForm);
      expect(result.success).toBe(true);
    });

    it("rejects mismatched passwords", () => {
      const mismatch = {
        ...validForm,
        confirmPassword: "different",
      };

      const result = userRegistrationFormSchema.safeParse(mismatch);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.issues.find(
          (i) => i.path.includes("confirmPassword"),
        );
        expect(confirmError?.message).toContain("אינן תואמות");
      }
    });
  });

  describe("userLoginSchema", () => {
    it("accepts valid login credentials", () => {
      const result = userLoginSchema.safeParse({
        username: "testuser",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty password", () => {
      const result = userLoginSchema.safeParse({
        username: "testuser",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("userUpdateSchema", () => {
    it("accepts partial updates", () => {
      const result = userUpdateSchema.safeParse({
        displayName: "New Name",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty update object", () => {
      const result = userUpdateSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("לפחות שדה אחד");
      }
    });

    it("accepts multiple fields", () => {
      const result = userUpdateSchema.safeParse({
        displayName: "New Name",
        grade: "ט",
        classNumber: 3,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Post Schemas", () => {
    describe("postStatusSchema", () => {
      it("accepts valid statuses", () => {
        expect(postStatusSchema.safeParse("draft").success).toBe(true);
        expect(postStatusSchema.safeParse("published").success).toBe(true);
      });

      it("rejects invalid statuses", () => {
        expect(postStatusSchema.safeParse("pending").success).toBe(false);
        expect(postStatusSchema.safeParse("").success).toBe(false);
      });
    });

    describe("postTitleSchema", () => {
      it("accepts valid titles", () => {
        expect(postTitleSchema.safeParse("Test Title").success).toBe(true);
        expect(postTitleSchema.safeParse("כותרת בעברית").success).toBe(true);
      });

      it("rejects empty title", () => {
        expect(postTitleSchema.safeParse("").success).toBe(false);
      });

      it("rejects title over 200 characters", () => {
        expect(postTitleSchema.safeParse("a".repeat(201)).success).toBe(false);
      });
    });

    describe("postContentSchema", () => {
      it("accepts valid content", () => {
        expect(postContentSchema.safeParse("Some content").success).toBe(true);
      });

      it("rejects empty content", () => {
        expect(postContentSchema.safeParse("").success).toBe(false);
      });

      it("rejects content over 50000 characters", () => {
        expect(postContentSchema.safeParse("a".repeat(50001)).success).toBe(
          false,
        );
      });
    });

    describe("postDescriptionSchema", () => {
      it("accepts valid descriptions", () => {
        expect(postDescriptionSchema.safeParse("A short desc").success).toBe(
          true,
        );
      });

      it("accepts undefined (optional)", () => {
        expect(postDescriptionSchema.safeParse(undefined).success).toBe(true);
      });

      it("rejects descriptions over 500 characters", () => {
        expect(postDescriptionSchema.safeParse("a".repeat(501)).success).toBe(
          false,
        );
      });
    });

    describe("coverImageSchema", () => {
      it("accepts valid URLs", () => {
        expect(
          coverImageSchema.safeParse("https://example.com/image.jpg").success,
        ).toBe(true);
      });

      it("accepts empty string (optional)", () => {
        expect(coverImageSchema.safeParse("").success).toBe(true);
      });

      it("accepts undefined (optional)", () => {
        expect(coverImageSchema.safeParse(undefined).success).toBe(true);
      });

      it("rejects invalid URLs", () => {
        expect(coverImageSchema.safeParse("not-a-url").success).toBe(false);
      });
    });

    describe("tagsSchema", () => {
      it("accepts valid tags array", () => {
        expect(tagsSchema.safeParse(["tag1", "tag2"]).success).toBe(true);
      });

      it("accepts empty array", () => {
        expect(tagsSchema.safeParse([]).success).toBe(true);
      });

      it("accepts undefined (optional)", () => {
        expect(tagsSchema.safeParse(undefined).success).toBe(true);
      });

      it("rejects more than 10 tags", () => {
        const manyTags = Array(11).fill("tag");
        expect(tagsSchema.safeParse(manyTags).success).toBe(false);
      });

      it("rejects empty string tags", () => {
        expect(tagsSchema.safeParse([""]).success).toBe(false);
      });

      it("rejects tags over 50 characters", () => {
        expect(tagsSchema.safeParse(["a".repeat(51)]).success).toBe(false);
      });
    });

    describe("categorySchema", () => {
      it("accepts valid category", () => {
        expect(categorySchema.safeParse("news").success).toBe(true);
      });

      it("accepts empty string (optional)", () => {
        expect(categorySchema.safeParse("").success).toBe(true);
      });

      it("rejects category over 50 characters", () => {
        expect(categorySchema.safeParse("a".repeat(51)).success).toBe(false);
      });
    });

    describe("postInputSchema", () => {
      const validPost = {
        title: "Test Post",
        content: "Test content here",
      };

      it("accepts minimal valid post", () => {
        expect(postInputSchema.safeParse(validPost).success).toBe(true);
      });

      it("accepts full post with all fields", () => {
        const fullPost = {
          ...validPost,
          description: "A description",
          coverImage: "https://example.com/image.jpg",
          author: "Test Author",
          authorId: "550e8400-e29b-41d4-a716-446655440000",
          authorGrade: "ח",
          authorClass: 2,
          tags: ["news", "school"],
          category: "events",
          status: "published",
        };
        expect(postInputSchema.safeParse(fullPost).success).toBe(true);
      });

      it("validates authorId as UUID", () => {
        const invalidUuid = {
          ...validPost,
          authorId: "not-a-uuid",
        };
        expect(postInputSchema.safeParse(invalidUuid).success).toBe(false);
      });
    });

    describe("postUpdateSchema", () => {
      it("accepts partial updates", () => {
        expect(postUpdateSchema.safeParse({ title: "New Title" }).success).toBe(
          true,
        );
        expect(
          postUpdateSchema.safeParse({ status: "draft" }).success,
        ).toBe(true);
      });

      it("rejects empty update object", () => {
        const result = postUpdateSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

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
});
