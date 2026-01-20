import type { AbmPackOutput } from "@/app/(chat)/api/abm-pack/schema";

/**
 * Normalize ABM pack output for frontend consumption.
 * With the strict schema, minimal transformation is needed.
 * This function handles any edge cases and ensures type safety.
 */
export function normalizeAbmPackOutput(data: AbmPackOutput): AbmPackOutput {
  // Deep clone to avoid mutation
  const normalized: AbmPackOutput = JSON.parse(JSON.stringify(data));

  // Ensure all required fields exist with sensible defaults
  // This should rarely be needed with strict schema, but provides safety

  // Ensure outputs slide tables have expected structure
  if (normalized.outputs) {
    // Ensure slide1InputTable has notes field
    if (normalized.outputs.slide1InputTable && normalized.outputs.slide1InputTable.notes === undefined) {
      normalized.outputs.slide1InputTable.notes = null;
    }

    // Ensure slide2LoyaltySentiment exists
    if (!normalized.outputs.slide2LoyaltySentiment) {
      console.warn("⚠️ Missing slide2LoyaltySentiment in output, using empty structure");
      normalized.outputs.slide2LoyaltySentiment = {
        overallSentimentRating: "mixed",
        summary: "",
        sentimentTableMarkdown: "",
      };
    }
  }

  // Ensure modelling structure
  if (normalized.modelling) {
    // Ensure baseCaseUsingMidpoints has supplierFundedLoyaltyGMUpliftUSD_m
    if (
      normalized.modelling.baseCaseUsingMidpoints &&
      normalized.modelling.baseCaseUsingMidpoints.supplierFundedLoyaltyGMUpliftUSD_m === undefined
    ) {
      normalized.modelling.baseCaseUsingMidpoints.supplierFundedLoyaltyGMUpliftUSD_m = null;
    }
  }

  // Ensure appendices structure
  if (normalized.appendices) {
    // Ensure leverB is null if not applicable
    if (
      normalized.appendices.assumptionsBlock &&
      normalized.appendices.assumptionsBlock.leverB_supplierFundedLoyalty === undefined
    ) {
      normalized.appendices.assumptionsBlock.leverB_supplierFundedLoyalty = null;
    }
  }

  return normalized;
}
