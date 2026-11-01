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
 * @param bytes - the ORIGINAL image bytes. Re-encoding strips metadata, so this
 *   must run before anything resizes the image, in the browser or on the server.
 * @returns true if the metadata definitively marks the image as AI-generated.
 */
export function bytesHaveAiProvenance(bytes: Uint8Array): boolean {
  if (bytes.length === 0) return false;

  const haystack = new TextDecoder("latin1").decode(bytes).toLowerCase();
  return AI_PROVENANCE_MARKERS.some((marker) => haystack.includes(marker));
}
