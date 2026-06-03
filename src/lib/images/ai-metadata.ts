/**
 * Detect whether an image's embedded metadata declares it as AI-generated.
 *
 * Looks for the standardized IPTC `digitalSourceType` provenance value, which
 * is also what C2PA / Content Credentials manifests carry in their assertions:
 *   - trainedAlgorithmicMedia              → AI-generated (e.g. DALL·E, Firefly, Imagen)
 *   - compositeWithTrainedAlgorithmicMedia → AI + human composite
 *
 * These tokens are ASCII and live inside the XMP / C2PA blocks of the file, so a
 * single latin1 byte scan finds them across JPEG/PNG/WebP without a
 * format-specific metadata parser. The 23+ char token effectively never
 * collides with pixel or compressed data, so false positives are negligible.
 *
 * NOTE: mere presence of C2PA / Content Credentials is NOT treated as AI — a
 * real camera photo can carry Content Credentials too. Only the explicit
 * AI digitalSourceType values above are treated as "AI-generated".
 */
const AI_PROVENANCE_MARKERS = [
  "trainedalgorithmicmedia",
  "compositewithtrainedalgorithmicmedia",
];

/**
 * @param buffer - the ORIGINAL uploaded image bytes (metadata is stripped once
 *   the image is re-encoded into card/full variants, so scan before that).
 * @returns true if the image metadata definitively marks it as AI-generated.
 */
export function bufferHasAiProvenance(buffer: Buffer): boolean {
  if (!buffer || buffer.length === 0) {
    return false;
  }
  const haystack = buffer.toString("latin1").toLowerCase();
  return AI_PROVENANCE_MARKERS.some((marker) => haystack.includes(marker));
}
