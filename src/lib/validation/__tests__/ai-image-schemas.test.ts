import { describe, it, expect } from "bun:test";
import {
  postInputSchema,
  postUpdateSchema,
  userPreferencesUpdateSchema,
} from "@/lib/validation/schemas";

describe("AI image validation", () => {
  it("postInputSchema accepts aiGeneratedImage", () => {
    const result = postInputSchema.safeParse({
      title: "כותרת",
      content: "תוכן ארוך מספיק",
      coverImage: "https://example.com/image.jpg",
      aiGeneratedImage: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.aiGeneratedImage).toBe(true);
    }
  });

  it("postInputSchema rejects a non-boolean aiGeneratedImage", () => {
    const result = postInputSchema.safeParse({
      title: "כותרת",
      content: "תוכן ארוך מספיק",
      coverImage: "https://example.com/image.jpg",
      aiGeneratedImage: "yes",
    });
    expect(result.success).toBe(false);
  });

  it("postUpdateSchema accepts aiGeneratedImage alone", () => {
    const result = postUpdateSchema.safeParse({ aiGeneratedImage: false });
    expect(result.success).toBe(true);
  });

  it("userPreferencesUpdateSchema accepts aiImageSurveyDismissed alone", () => {
    const result = userPreferencesUpdateSchema.safeParse({
      aiImageSurveyDismissed: true,
    });
    expect(result.success).toBe(true);
  });
});
