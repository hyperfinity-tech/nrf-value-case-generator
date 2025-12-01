import { z } from "zod";

// ============================================================================
// Enums
// ============================================================================

export const dataConfidenceEnum = z.enum(["H", "M", "L"]);
export const sentimentEnum = z.enum(["positive", "mixed", "negative"]);
export const valueCaseModeEnum = z.enum(["median", "stretch_up"]);
export const brandTypeInternalEnum = z.enum([
  "own_brand_only",
  "multi_brand",
  "mixed",
]);
export const brandTypeOutputEnum = z.enum(["Own-brand", "Multi-brand", "Mixed"]);
export const feedbackDominatedByEnum = z.enum([
  "loyalty_members",
  "general_customers",
  "mixed",
]);

// ============================================================================
// Request Schema
// ============================================================================

export const abmPackRequestSchema = z.object({
  brand: z.string().min(1, "Brand name is required"),
  website: z.string().url().optional().nullable(),
  registryUrl: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  brandType: brandTypeInternalEnum.optional().nullable(),
  notes: z.string().optional().nullable(),
  selectedModel: z
    .enum(["chat-model", "chat-model-reasoning"])
    .default("chat-model"),
});

export type AbmPackRequest = z.infer<typeof abmPackRequestSchema>;

// ============================================================================
// Output Schema (for generateObject)
// ============================================================================

// Brand Intake
const brandIntakeSchema = z.object({
  brand: z.string().describe("The brand name"),
  website: z.string().nullable().describe("Brand website URL"),
  registryLink: z
    .string()
    .nullable()
    .describe("Business registry / SEC / EDGAR link"),
  category: z.string().describe("Brand category/vertical"),
  brandType: brandTypeInternalEnum.describe(
    "Whether the brand sells own-brand products only, is multi-brand, or mixed"
  ),
  contextualNotes: z
    .string()
    .nullable()
    .describe("Any additional context provided"),
});

// Research
const researchSchema = z.object({
  latestAnnualRevenue: z
    .string()
    .describe("Latest annual revenue figure with currency"),
  latestAnnualRevenueSource: z
    .string()
    .describe("Source for the revenue figure"),
  loyaltyProgrammeDetails: z
    .string()
    .describe("Details about the loyalty programme"),
  activeLoyaltyMembers: z
    .string()
    .nullable()
    .describe("Number of active loyalty members if known"),
  aovBenchmark: z.string().describe("Average order value benchmark"),
  purchaseFrequencyBenchmark: z
    .string()
    .describe("Purchase frequency benchmark"),
  paidMediaChannels: z.string().describe("Active paid media channels"),
  techStack: z.string().describe("Known technology stack"),
  brandSpecificInitiatives: z
    .string()
    .describe("Current brand-specific initiatives"),
  blendedGrossMarginPercent: z
    .number()
    .describe("Blended gross margin percentage"),
  blendedGrossMarginSource: z
    .string()
    .describe("Source for the gross margin figure"),
  inferenceNotes: z
    .string()
    .nullable()
    .describe("Notes on any inferences made"),
});

// Modelling
const modellingSchema = z.object({
  baseCaseGMUpliftMillions: z
    .number()
    .describe("Base case GM uplift in millions of dollars"),
  modeApplied: valueCaseModeEnum.describe(
    "Whether median or stretch_up mode was applied"
  ),
  modeRationale: z
    .string()
    .describe("Rationale for the mode selection based on $2m threshold rule"),
});

// Data Confidence
const dataConfidenceSchema = z.object({
  revenue: dataConfidenceEnum.describe("Confidence level for revenue data"),
  loyalty: dataConfidenceEnum.describe("Confidence level for loyalty data"),
  aov: dataConfidenceEnum.describe("Confidence level for AOV data"),
  frequency: dataConfidenceEnum.describe(
    "Confidence level for frequency data"
  ),
});

// CFO Readiness Panel
const cfoReadinessPanelSchema = z.object({
  blendedGMPercentUsed: z.number().describe("The blended GM % used"),
  blendedGMSourceOrProxy: z.string().describe("Source or proxy used for GM"),
  brandType: brandTypeOutputEnum.describe("Brand type for display"),
  dataConfidence: dataConfidenceSchema.describe(
    "Confidence levels for key metrics"
  ),
  valueCaseMode: valueCaseModeEnum.describe("Mode applied for value case"),
  valueCaseModeRationale: z.string().describe("Rationale for mode selection"),
});

// Slide 1 Input Table Row
const slide1InputRowSchema = z.object({
  metric: z.string().describe("The metric name"),
  valueOrEstimate: z.string().describe("The value or estimate"),
  sourceOrLogic: z.string().describe("Source or logic used"),
});

// Slide 1 Notes
const slide1NotesSchema = z.object({
  keyProxies: z.string().describe("Key proxies used"),
  dataGapsAndInference: z.string().describe("Data gaps and inference notes"),
});

// Sentiment Evidence
const sentimentEvidenceSchema = z.object({
  quote: z.string().describe("Direct quote from source"),
  source: z.string().describe("Source of the quote"),
  monthYear: z.string().describe("Month and year of the quote"),
});

// Sentiment Table Row
const sentimentTableRowSchema = z.object({
  aspect: z.string().describe("Aspect being evaluated"),
  sentimentSummary: z.string().describe("Summary of sentiment"),
  evidence: z
    .array(sentimentEvidenceSchema)
    .min(1)
    .describe("Evidence supporting the sentiment"),
});

// Loyalty Sentiment Snapshot
const loyaltySentimentSnapshotSchema = z.object({
  overallSentimentRating: sentimentEnum.describe("Overall sentiment rating"),
  summaryNarrative: z.string().describe("Summary narrative of sentiment"),
  feedbackDominatedBy: feedbackDominatedByEnum.describe(
    "Who dominates the feedback"
  ),
  sentimentTable: z
    .array(sentimentTableRowSchema)
    .length(4)
    .describe("4-row sentiment analysis table"),
});

// Value Case Table Row
const valueCaseRowSchema = z.object({
  areaOfImpact: z.string().describe("Area of impact"),
  opportunityType: z.string().describe("Type of opportunity"),
  estimatedUpliftGM: z
    .number()
    .describe("Estimated uplift in GM (raw dollars)"),
  assumptionsMethodology: z
    .string()
    .describe("6-step plain-English methodology explanation"),
});

// Slide 4 Value Case Table
const slide4ValueCaseTableSchema = z.object({
  rows: z
    .array(valueCaseRowSchema)
    .min(3)
    .describe("Value case rows (minimum 3)"),
});

// Outputs
const outputsSchema = z.object({
  executiveOneLiner: z
    .string()
    .describe("Single line executive summary of the opportunity"),
  cfoReadinessPanel: cfoReadinessPanelSchema.describe(
    "CFO readiness panel data"
  ),
  executiveSummary: z.string().describe("Full executive summary"),
  slide1InputTable: z
    .array(slide1InputRowSchema)
    .length(7)
    .describe("7-row input table for Slide 1"),
  slide1Notes: slide1NotesSchema.describe("Notes for Slide 1"),
  loyaltySentimentSnapshot: loyaltySentimentSnapshotSchema.describe(
    "Loyalty sentiment analysis"
  ),
  slide4ValueCaseTable: slide4ValueCaseTableSchema.describe(
    "Value case table for Slide 4"
  ),
});

// Credible Range
const credibleRangeSchema = z.object({
  minPercent: z.number().describe("Minimum percentage"),
  maxPercent: z.number().describe("Maximum percentage"),
  source: z.string().describe("Source for the range"),
});

// Assumptions Block Item
const assumptionsBlockItemSchema = z.object({
  leverId: z.string().describe("Unique lever identifier"),
  leverName: z.string().describe("Human-readable lever name"),
  upliftPercentageApplied: z.number().describe("Uplift percentage applied"),
  upliftMode: valueCaseModeEnum.describe("Mode applied for this lever"),
  credibleRange: credibleRangeSchema.describe("Credible range for the uplift"),
});

// Appendices
const appendicesSchema = z.object({
  assumptionsBlock: z
    .array(assumptionsBlockItemSchema)
    .describe("Detailed assumptions for each lever"),
  sources: z.array(z.string()).describe("List of sources used"),
});

// ============================================================================
// Full ABM Pack Output Schema
// ============================================================================

export const abmPackOutputSchema = z.object({
  brandIntake: brandIntakeSchema.describe("Brand intake information"),
  research: researchSchema.describe("Research findings"),
  modelling: modellingSchema.describe("Modelling results"),
  outputs: outputsSchema.describe("Output deliverables"),
  appendices: appendicesSchema.describe("Supporting appendices"),
});

export type AbmPackOutput = z.infer<typeof abmPackOutputSchema>;

