import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { detectAiImage, aiScoreFromPredictions } from "../detect";

// A 1x1 transparent PNG as a data URL — lets detectAiImage resolve image bytes
// locally so the only network call is the HF classify request we mock.
const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQAY3Y2wAAAAAElFTkSuQmCC";

function hfResponse(predictions: Array<{ label: string; score: number }>) {
  return new Response(JSON.stringify(predictions), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

const originalFetch = globalThis.fetch;
const originalKey = process.env.HUGGINGFACE_API_KEY;
const originalModel = process.env.HF_AI_DETECTOR_MODEL;
const originalThreshold = process.env.AI_DETECTION_THRESHOLD;

describe("aiScoreFromPredictions", () => {
  it("returns the AI label score when present", () => {
    expect(
      aiScoreFromPredictions([
        { label: "artificial", score: 0.9 },
        { label: "human", score: 0.1 },
      ]),
    ).toBe(0.9);
  });

  it("prefers the AI label even when human scores higher", () => {
    expect(
      aiScoreFromPredictions([
        { label: "human", score: 0.8 },
        { label: "artificial", score: 0.2 },
      ]),
    ).toBe(0.2);
  });

  it("derives AI score from a human/real label when no AI label exists", () => {
    expect(
      aiScoreFromPredictions([
        { label: "real", score: 0.7 },
        { label: "other", score: 0.3 },
      ]),
    ).toBeCloseTo(0.3, 5);
  });

  it("returns null for unrecognized labels", () => {
    expect(
      aiScoreFromPredictions([
        { label: "cat", score: 0.6 },
        { label: "dog", score: 0.4 },
      ]),
    ).toBeNull();
  });
});

describe("detectAiImage", () => {
  beforeEach(() => {
    process.env.HUGGINGFACE_API_KEY = "test-key";
    delete process.env.HF_AI_DETECTOR_MODEL;
    delete process.env.AI_DETECTION_THRESHOLD;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.HUGGINGFACE_API_KEY;
    else process.env.HUGGINGFACE_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.HF_AI_DETECTOR_MODEL;
    else process.env.HF_AI_DETECTOR_MODEL = originalModel;
    if (originalThreshold === undefined) delete process.env.AI_DETECTION_THRESHOLD;
    else process.env.AI_DETECTION_THRESHOLD = originalThreshold;
  });

  it("flags via metadata without a key or a model call", async () => {
    delete process.env.HUGGINGFACE_API_KEY;
    const fetchMock = mock(async () =>
      hfResponse([{ label: "human", score: 0.99 }]),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const dataUrl =
      "data:image/jpeg;base64," +
      Buffer.from("xmp trainedAlgorithmicMedia").toString("base64");
    const result = await detectAiImage(dataUrl);

    expect(result).toEqual({ isAiGenerated: true, score: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lets metadata take precedence over the model", async () => {
    const fetchMock = mock(async () =>
      hfResponse([{ label: "human", score: 0.99 }]),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const dataUrl =
      "data:image/png;base64," +
      Buffer.from("created with Midjourney v6").toString("base64");
    const result = await detectAiImage(dataUrl);

    expect(result.isAiGenerated).toBe(true);
    expect(result.score).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is disabled (no fetch) when the API key is missing", async () => {
    delete process.env.HUGGINGFACE_API_KEY;
    const fetchMock = mock(async () => hfResponse([]));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await detectAiImage(PNG_DATA_URL);

    expect(result).toEqual({ isAiGenerated: false, score: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("flags an image as AI-generated above the threshold", async () => {
    globalThis.fetch = mock(async () =>
      hfResponse([
        { label: "artificial", score: 0.92 },
        { label: "human", score: 0.08 },
      ]),
    ) as unknown as typeof fetch;

    const result = await detectAiImage(PNG_DATA_URL);

    expect(result.isAiGenerated).toBe(true);
    expect(result.score).toBeCloseTo(0.92, 5);
  });

  it("does not flag an image below the threshold", async () => {
    globalThis.fetch = mock(async () =>
      hfResponse([
        { label: "artificial", score: 0.2 },
        { label: "human", score: 0.8 },
      ]),
    ) as unknown as typeof fetch;

    const result = await detectAiImage(PNG_DATA_URL);

    expect(result.isAiGenerated).toBe(false);
    expect(result.score).toBeCloseTo(0.2, 5);
  });

  it("respects a custom AI_DETECTION_THRESHOLD", async () => {
    process.env.AI_DETECTION_THRESHOLD = "0.95";
    globalThis.fetch = mock(async () =>
      hfResponse([
        { label: "artificial", score: 0.92 },
        { label: "human", score: 0.08 },
      ]),
    ) as unknown as typeof fetch;

    const result = await detectAiImage(PNG_DATA_URL);

    expect(result.isAiGenerated).toBe(false);
  });

  it("fails open when the HF request errors", async () => {
    globalThis.fetch = mock(
      async () => new Response("error", { status: 500 }),
    ) as unknown as typeof fetch;

    const result = await detectAiImage(PNG_DATA_URL);

    expect(result).toEqual({ isAiGenerated: false, score: null });
  });

  it("fails open on unrecognized labels", async () => {
    globalThis.fetch = mock(async () =>
      hfResponse([{ label: "cat", score: 0.9 }]),
    ) as unknown as typeof fetch;

    const result = await detectAiImage(PNG_DATA_URL);

    expect(result).toEqual({ isAiGenerated: false, score: null });
  });
});
