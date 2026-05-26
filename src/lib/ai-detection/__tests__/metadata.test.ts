import { describe, it, expect } from "bun:test";
import { detectAiFromMetadata } from "../metadata";

function buf(s: string): ArrayBuffer {
  const u8 = new TextEncoder().encode(s);
  return u8.buffer.slice(
    u8.byteOffset,
    u8.byteOffset + u8.byteLength,
  ) as ArrayBuffer;
}

describe("detectAiFromMetadata", () => {
  it("flags the IPTC trainedAlgorithmicMedia source type", () => {
    const result = detectAiFromMetadata(
      buf("<xmp>digitalSourceType: trainedAlgorithmicMedia</xmp>"),
    );
    expect(result.isAiGenerated).toBe(true);
    expect(result.marker).toBe("trainedalgorithmicmedia");
  });

  it("flags a known generator name (Midjourney)", () => {
    expect(detectAiFromMetadata(buf("Software: Midjourney v6")).isAiGenerated).toBe(
      true,
    );
  });

  it("flags a C2PA / OpenAI claim generator", () => {
    expect(
      detectAiFromMetadata(buf("c2pa manifest ... Made by OpenAI")).isAiGenerated,
    ).toBe(true);
  });

  it("flags a Stable Diffusion parameters text chunk", () => {
    const sd =
      "parameters: a cat\nNegative prompt: blurry\nSteps: 20, Sampler: Euler a";
    expect(detectAiFromMetadata(buf(sd)).isAiGenerated).toBe(true);
  });

  it("detects markers in NUL-interleaved (UTF-16) metadata", () => {
    const marker = "trainedAlgorithmicMedia";
    const interleaved = marker
      .split("")
      .map((c) => c + String.fromCharCode(0))
      .join("");
    expect(detectAiFromMetadata(buf("xx" + interleaved + "yy")).isAiGenerated).toBe(
      true,
    );
  });

  it("does not flag ordinary camera/editor metadata", () => {
    const exif =
      "Canon EOS 5D Mark IV; Adobe Photoshop Lightroom; f/2.8 1/200s ISO100";
    expect(detectAiFromMetadata(buf(exif)).isAiGenerated).toBe(false);
  });

  it("returns negative for an empty buffer", () => {
    expect(detectAiFromMetadata(new ArrayBuffer(0)).isAiGenerated).toBe(false);
  });
});
