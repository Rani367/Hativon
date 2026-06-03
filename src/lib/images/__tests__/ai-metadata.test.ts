import { describe, it, expect } from "bun:test";
import { bufferHasAiProvenance } from "../ai-metadata";

describe("bufferHasAiProvenance", () => {
  it("detects the IPTC trainedAlgorithmicMedia marker (AI-generated)", () => {
    const buf = Buffer.from(
      "...<Iptc4xmpExt:DigitalSourceType>http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia</Iptc4xmpExt:DigitalSourceType>...",
    );
    expect(bufferHasAiProvenance(buf)).toBe(true);
  });

  it("detects compositeWithTrainedAlgorithmicMedia", () => {
    expect(
      bufferHasAiProvenance(
        Buffer.from("digitalSourceType: compositeWithTrainedAlgorithmicMedia"),
      ),
    ).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(
      bufferHasAiProvenance(Buffer.from("TRAINEDALGORITHMICMEDIA")),
    ).toBe(true);
  });

  it("finds the marker among binary noise", () => {
    const buf = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x12, 0x9a]),
      Buffer.from("trainedAlgorithmicMedia"),
      Buffer.from([0x00, 0x01, 0x02]),
    ]);
    expect(bufferHasAiProvenance(buf)).toBe(true);
  });

  it("does NOT flag a plain image buffer", () => {
    expect(
      bufferHasAiProvenance(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])),
    ).toBe(false);
  });

  it("does NOT flag mere C2PA/Content-Credentials presence without an AI source type", () => {
    // A real camera photo can carry Content Credentials — that alone is not AI.
    expect(
      bufferHasAiProvenance(
        Buffer.from("c2pa.assertions urn:c2pa contentauth jumbf"),
      ),
    ).toBe(false);
  });

  it("returns false for an empty buffer", () => {
    expect(bufferHasAiProvenance(Buffer.from([]))).toBe(false);
  });
});
