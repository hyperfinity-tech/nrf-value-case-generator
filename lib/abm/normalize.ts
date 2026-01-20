import type { AbmPackOutput } from "@/app/(chat)/api/abm-pack/schema";

/**
 * Normalize ABM pack output for frontend consumption.
 * The schema is flexible, so this function provides a pass-through
 * with minimal safety checks.
 */
export function normalizeAbmPackOutput(data: AbmPackOutput): AbmPackOutput {
  // Deep clone to avoid mutation
  const normalized: AbmPackOutput = JSON.parse(JSON.stringify(data));

  // The schema is flexible with many optional fields and .passthrough()
  // so we don't need to fill in defaults - the frontend/renderer handles missing data gracefully

  return normalized;
}
