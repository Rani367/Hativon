import { describe, expect, it } from "bun:test";
import { getReadingMinutes, getWordCount } from "../reading";

describe("getWordCount", () => {
  it("counts words", () => {
    expect(getWordCount("שלום עולם יפה")).toBe(3);
  });

  it("ignores Markdown punctuation and code", () => {
    expect(getWordCount("**שלום** `קוד` עולם\n\n```\nבלוק\n```")).toBe(2);
  });

  it("ignores the blank-line marker", () => {
    expect(getWordCount("ראשונה\n\n&nbsp;\n\nשנייה")).toBe(2);
  });

  it("counts nothing in an empty article", () => {
    expect(getWordCount("")).toBe(0);
    expect(getWordCount("   ")).toBe(0);
  });
});

describe("getReadingMinutes", () => {
  it("rounds up at 130 words a minute", () => {
    expect(getReadingMinutes(130)).toBe(1);
    expect(getReadingMinutes(131)).toBe(2);
  });

  it("never says zero minutes", () => {
    expect(getReadingMinutes(0)).toBe(1);
  });
});
