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
} from "../schemas";

describe("User Validation Schemas", () => {
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
    const validStudentForm = {
      username: "testuser",
      password: "password123",
      confirmPassword: "password123",
      displayName: "Test User",
      grade: "ח" as const,
      classNumber: 2,
      isTeacher: false,
    };

    const validTeacherForm = {
      username: "teacher1",
      password: "password123",
      confirmPassword: "password123",
      displayName: "Teacher Name",
      isTeacher: true,
      adminPassword: "admin123",
    };

    it("accepts matching passwords", () => {
      const result = userRegistrationFormSchema.safeParse(validStudentForm);
      expect(result.success).toBe(true);
    });

    it("rejects mismatched passwords", () => {
      const mismatch = {
        ...validStudentForm,
        confirmPassword: "different",
      };

      const result = userRegistrationFormSchema.safeParse(mismatch);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmError = result.error.issues.find((i) =>
          i.path.includes("confirmPassword"),
        );
        expect(confirmError?.message).toContain("אינן תואמות");
      }
    });

    it("accepts valid teacher registration with admin password", () => {
      const result = userRegistrationFormSchema.safeParse(validTeacherForm);
      expect(result.success).toBe(true);
    });

    it("rejects teacher registration without admin password", () => {
      const teacherWithoutAdminPass = {
        ...validTeacherForm,
        adminPassword: undefined,
      };
      const result = userRegistrationFormSchema.safeParse(
        teacherWithoutAdminPass,
      );
      expect(result.success).toBe(false);
    });

    it("rejects student registration without grade/class", () => {
      const studentWithoutGrade = {
        username: "testuser",
        password: "password123",
        confirmPassword: "password123",
        displayName: "Test User",
        isTeacher: false,
      };
      const result = userRegistrationFormSchema.safeParse(studentWithoutGrade);
      expect(result.success).toBe(false);
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
});
