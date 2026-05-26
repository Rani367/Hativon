/**
 * AI image detection
 *
 * Scans an image with an open-source AI-image detector hosted on the (free)
 * Hugging Face Inference API and reports whether it is AI-generated.
 *
 * Design: fail-open. If the feature is not configured (`HUGGINGFACE_API_KEY`
 * missing), the model is loading, the request times out, or anything else goes
 * wrong, we return `{ isAiGenerated: false, score: null }` so that creating /
 * updating posts never breaks because of detection.
 *
 * Configuration (env):
 * - HUGGINGFACE_API_KEY    Free token from huggingface.co/settings/tokens.
 *                          When absent, detection is disabled (treats as not-AI).
 * - HF_AI_DETECTOR_MODEL   Model id (default: Organika/sdxl-detector).
 * - AI_DETECTION_THRESHOLD AI-probability cutoff, 0..1 (default: 0.5).
 */

import { detectAiFromMetadata } from "./metadata";

const HF_ENDPOINT_BASE = "https://router.huggingface.co/hf-inference/models";
const DEFAULT_MODEL = "Organika/sdxl-detector";
const DEFAULT_THRESHOLD = 0.5;
const DEFAULT_TIMEOUT_MS = 6000;
const MAX_MODEL_WAIT_MS = 8000;

// Labels that indicate an AI-generated image, across common detector models.
const AI_LABEL_PATTERN =
  /artificial|\bai\b|fake|generated|synthetic|sdxl|midjourney|dalle|diffusion|gan/i;
// Labels that indicate a real / human-made image.
const HUMAN_LABEL_PATTERN = /human|real|natural|authentic|photo/i;

export interface AiDetectionResult {
  /** True when the AI-probability meets the configured threshold. */
  isAiGenerated: boolean;
  /** AI probability (0..1), or null when detection was unavailable. */
  score: number | null;
}

export interface DetectOptions {
  /** Overall time budget for the whole detection, in ms. */
  timeoutMs?: number;
  /** When true, wait once for a cold model (HTTP 503) and retry. */
  waitForModel?: boolean;
}

interface Prediction {
  label: string;
  score: number;
}

interface ImageBytes {
  data: ArrayBuffer;
  contentType: string;
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}

const NOT_DETECTED: AiDetectionResult = { isAiGenerated: false, score: null };

let disabledWarningLogged = false;

function isEnabled(): boolean {
  if (process.env.HUGGINGFACE_API_KEY) {
    return true;
  }
  if (!disabledWarningLogged) {
    disabledWarningLogged = true;
    console.warn(
      "[AI-DETECT] HUGGINGFACE_API_KEY not set — using metadata-only detection (model fallback disabled).",
    );
  }
  return false;
}

function getThreshold(): number {
  const raw = process.env.AI_DETECTION_THRESHOLD;
  if (!raw) return DEFAULT_THRESHOLD;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : DEFAULT_THRESHOLD;
}

function decodeDataUrl(src: string): ImageBytes | null {
  // data:[<mediatype>][;base64],<data>
  const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(src);
  if (!match) return null;
  const contentType = match[1] || "application/octet-stream";
  const isBase64 = Boolean(match[2]);
  const payload = match[3];
  const buffer = isBase64
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  return { data: toArrayBuffer(buffer), contentType };
}

async function resolveImageBytes(
  src: string,
  signal: AbortSignal,
): Promise<ImageBytes | null> {
  if (src.startsWith("data:")) {
    return decodeDataUrl(src);
  }
  if (!/^https?:\/\//i.test(src)) {
    return null;
  }
  const response = await fetch(src, { signal });
  if (!response.ok) return null;
  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) return null;
  const buffer = await response.arrayBuffer();
  return { data: buffer, contentType };
}

/**
 * Map a model's prediction list to a single AI probability.
 * Returns null when no recognizable AI/human label is present.
 */
export function aiScoreFromPredictions(
  predictions: Prediction[],
): number | null {
  const aiEntry = predictions.find((p) => AI_LABEL_PATTERN.test(p.label));
  if (aiEntry) return aiEntry.score;

  const humanEntry = predictions.find((p) => HUMAN_LABEL_PATTERN.test(p.label));
  if (humanEntry) return 1 - humanEntry.score;

  return null;
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

async function classify(
  image: ImageBytes,
  model: string,
  apiKey: string,
  signal: AbortSignal,
  waitForModel: boolean,
): Promise<Prediction[] | null> {
  const url = `${HF_ENDPOINT_BASE}/${model}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": image.contentType,
      },
      body: image.data,
      signal,
    });

    if (response.ok) {
      const json: unknown = await response.json();
      return Array.isArray(json) ? (json as Prediction[]) : null;
    }

    // Cold model: HF returns 503 with an estimated load time.
    if (response.status === 503 && waitForModel && attempt === 0) {
      const body = (await response.json().catch(() => null)) as {
        estimated_time?: number;
      } | null;
      const waitMs = Math.min(
        Math.ceil((body?.estimated_time ?? 3) * 1000),
        MAX_MODEL_WAIT_MS,
      );
      await delay(waitMs, signal);
      if (signal.aborted) return null;
      continue;
    }

    console.warn(`[AI-DETECT] HF request failed (${response.status})`);
    return null;
  }

  return null;
}

/**
 * Detect whether the image at `imageSrc` (an http(s) URL or a data: URL) is
 * AI-generated. Never throws; returns NOT_DETECTED on any failure.
 *
 * Strategy:
 *   1. Embedded metadata (free, local, high precision). If a provenance marker
 *      declares AI generation, we flag immediately — no API key required.
 *   2. Fallback: the Hugging Face model detector, only when no metadata marker
 *      was found and an API key is configured.
 *
 * A metadata hit reports `score: null` (it is a definitive flag, not a
 * probability).
 */
export async function detectAiImage(
  imageSrc: string,
  options: DetectOptions = {},
): Promise<AiDetectionResult> {
  if (!imageSrc) {
    return NOT_DETECTED;
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const image = await resolveImageBytes(imageSrc, controller.signal);
    if (!image) return NOT_DETECTED;

    // 1) Metadata first.
    const meta = detectAiFromMetadata(image.data);
    if (meta.isAiGenerated) {
      return { isAiGenerated: true, score: null };
    }

    // 2) Model fallback (requires an API key).
    if (!isEnabled()) return NOT_DETECTED;

    const apiKey = process.env.HUGGINGFACE_API_KEY as string;
    const model = process.env.HF_AI_DETECTOR_MODEL || DEFAULT_MODEL;
    const threshold = getThreshold();

    const predictions = await classify(
      image,
      model,
      apiKey,
      controller.signal,
      options.waitForModel ?? false,
    );
    if (!predictions) return NOT_DETECTED;

    const score = aiScoreFromPredictions(predictions);
    if (score === null) {
      console.warn(
        `[AI-DETECT] Unrecognized labels from ${model}: ${predictions
          .map((p) => p.label)
          .join(", ")}`,
      );
      return NOT_DETECTED;
    }

    return { isAiGenerated: score >= threshold, score };
  } catch (error) {
    if (!(error instanceof Error && error.name === "AbortError")) {
      console.warn("[AI-DETECT] Detection failed:", error);
    }
    return NOT_DETECTED;
  } finally {
    clearTimeout(timer);
  }
}
