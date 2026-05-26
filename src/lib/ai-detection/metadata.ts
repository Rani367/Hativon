/**
 * Metadata-based AI detection.
 *
 * Scans embedded image metadata (EXIF / XMP / IPTC / C2PA / PNG text chunks)
 * for provenance markers that explicitly declare AI generation. This is the
 * first-pass check: it is free, local (no network, no API key), and high
 * precision. Only positive signals are reported — absence of a marker is
 * inconclusive, and the caller then falls back to the model detector.
 *
 * The most reliable signal is the IPTC "Digital Source Type"
 * (`trainedAlgorithmicMedia`), the cross-industry standard written by Adobe
 * Firefly, Google (Imagen/Gemini + SynthID), OpenAI (DALL·E), and others —
 * both in plain XMP and inside C2PA Content Credentials manifests.
 */

export interface MetadataDetectionResult {
  isAiGenerated: boolean;
  /** Which marker matched (for logging), or null when none did. */
  marker: string | null;
}

// Compared against a lowercased decode of the file bytes.
const AI_METADATA_MARKERS: string[] = [
  // IPTC DigitalSourceType (the standard AI-provenance declaration)
  "trainedalgorithmicmedia",
  "compositewithtrainedalgorithmicmedia",
  // Generator / C2PA claim-generator identifiers commonly embedded in metadata
  "midjourney",
  "dall-e",
  "openai",
  "stable diffusion",
  "stable-diffusion",
  "automatic1111",
  "comfyui",
  "adobe firefly",
  "stability ai",
  "stabilityai",
  "ideogram",
  "leonardo.ai",
  "made with google ai",
  "google deepmind",
  "synthid",
];

const NONE: MetadataDetectionResult = { isAiGenerated: false, marker: null };
const SCAN_BYTE_LIMIT = 5 * 1024 * 1024; // cover images are small; scan it all
const NUL = String.fromCharCode(0);

function decodeForScan(data: ArrayBuffer): string {
  const slice =
    data.byteLength > SCAN_BYTE_LIMIT ? data.slice(0, SCAN_BYTE_LIMIT) : data;
  // latin1 maps each byte 1:1 to a char, preserving ASCII markers regardless of
  // surrounding binary. Lowercased for case-insensitive matching.
  return Buffer.from(new Uint8Array(slice)).toString("latin1").toLowerCase();
}

/**
 * Inspect image bytes for embedded AI-provenance metadata.
 * Returns a positive result only when a recognized marker is present.
 */
export function detectAiFromMetadata(
  data: ArrayBuffer,
): MetadataDetectionResult {
  if (!data || data.byteLength === 0) {
    return NONE;
  }

  const haystack = decodeForScan(data);
  // A copy with NUL bytes removed catches UTF-16-encoded XMP, where ASCII chars
  // are interleaved with 0x00.
  const denulled = haystack.includes(NUL)
    ? haystack.split(NUL).join("")
    : haystack;

  const contains = (needle: string) =>
    haystack.includes(needle) || denulled.includes(needle);

  for (const marker of AI_METADATA_MARKERS) {
    if (contains(marker)) {
      return { isAiGenerated: true, marker };
    }
  }

  // Stable Diffusion (Automatic1111) "parameters" PNG text-chunk signature.
  if (contains("negative prompt:") && contains("steps:")) {
    return { isAiGenerated: true, marker: "sd-parameters" };
  }

  return NONE;
}
