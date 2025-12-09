import type { AbmPackOutput } from "@/app/(chat)/api/abm-pack/schema";

// Normalize legacy/variant key shapes into the canonical structure the frontend expects
export function normalizeAbmPackOutput(data: AbmPackOutput): AbmPackOutput {
  const normalized: AbmPackOutput = JSON.parse(JSON.stringify(data));

  const outputs: Record<string, any> = normalized.outputs ?? {};
  outputs.slide1InputTable ??= outputs.slide1_inputTable;
  outputs.slide4ValueCaseTable ??= outputs.slide4_valueCaseTable;
  outputs.loyaltySentimentSnapshot ??=
    outputs.slide2LoyaltySentimentSnapshot ||
    outputs.slide2_loyaltySentimentSnapshot ||
    outputs.loyaltySentimentLast12Months;
  outputs.slide1Notes ??= outputs.slide1_notes;

  if (Array.isArray(outputs.slide1InputTable)) {
    outputs.slide1InputTable = { rows: outputs.slide1InputTable };
  }
  if (outputs.slide1InputTable?.table && !outputs.slide1InputTable.rows) {
    outputs.slide1InputTable.rows = outputs.slide1InputTable.table;
  }

  if (outputs.slide4ValueCaseTable?.table && !outputs.slide4ValueCaseTable.rows) {
    outputs.slide4ValueCaseTable.rows = outputs.slide4ValueCaseTable.table;
  }

  if (!normalized.modelling && outputs.modelling) {
    normalized.modelling = outputs.modelling;
  }
  if (!normalized.modelling && normalized.appendices) {
    const assumptionsBlock: any = normalized.appendices.assumptionsBlock;
    if (assumptionsBlock && typeof assumptionsBlock === "object" && !Array.isArray(assumptionsBlock)) {
      if (assumptionsBlock.overallModel) {
        normalized.modelling = assumptionsBlock.overallModel as any;
      }
    }
  }

  normalized.outputs = outputs as AbmPackOutput["outputs"];
  return normalized;
}

