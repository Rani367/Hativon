import { describe, expect, it } from "bun:test";
import {
  getReadingMinutes,
  getWordCount,
  isOpeningOfArticle,
} from "../reading";

describe("isOpeningOfArticle", () => {
  const content = "להורי ותלמידי החטיבה **היקרים**,\n\nעם סיומה של שנת הלימודים";

  it("spots a generated description, cut off with an ellipsis", () => {
    expect(isOpeningOfArticle("להורי ותלמידי החטיבה היקרים, עם...", content)).toBe(
      true,
    );
  });

  it("keeps a description the writer wrote", () => {
    expect(isOpeningOfArticle("סיכום שנת הלימודים", content)).toBe(false);
  });

  it("keeps nothing for an empty description", () => {
    expect(isOpeningOfArticle("", content)).toBe(false);
  });
});

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
