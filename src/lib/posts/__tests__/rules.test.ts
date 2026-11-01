import { describe, expect, it } from "bun:test";
import type { User } from "@/lib/users/types";
import {
  canEditPost,
  canPublishPost,
  composeByline,
  generateDescription,
} from "../rules";

const student = { id: "s", displayName: "דנה לוי", isTeacher: false } as User;
const teacher = { id: "t", displayName: "ריני דגן", isTeacher: true } as User;

describe("permissions", () => {
  it("lets writers edit only their own posts, and teachers any", () => {
    expect(canEditPost(student, { authorId: "s" })).toBe(true);
    expect(canEditPost(student, { authorId: "x" })).toBe(false);
    expect(canEditPost(teacher, { authorId: "x" })).toBe(true);
  });

  it("stops a writer republishing a post a teacher took down", () => {
    const held = { authorId: "s", teacherHold: true };

    expect(canPublishPost(student, held)).toBe(false);
    expect(canPublishPost(teacher, held)).toBe(true);
  });
});

describe("composeByline", () => {
  it("defaults to the writer's name", () => {
    expect(composeByline(student, "", undefined)).toBe("דנה לוי");
  });

  it("keeps the writer's name beside a group credit", () => {
    expect(composeByline(student, "ועדת תרבות", undefined)).toBe(
      "ועדת תרבות (דנה לוי)",
    );
  });

  it("leaves an unchanged old byline alone", () => {
    expect(composeByline(student, "שם ישן", "שם ישן")).toBe("שם ישן");
  });

  it("lets teachers write anything", () => {
    expect(composeByline(teacher, "מערכת העיתון", undefined)).toBe(
      "מערכת העיתון",
    );
  });
});

describe("generateDescription", () => {
  it("strips Markdown and blank-line markers", () => {
    expect(generateDescription("**שלום** [עולם](https://a.com)\n\n&nbsp;\n\nיפה")).toBe(
      "שלום עולם יפה",
    );
  });

  it("cuts long text with an ellipsis", () => {
    expect(generateDescription("א".repeat(300))).toHaveLength(163);
  });
});
