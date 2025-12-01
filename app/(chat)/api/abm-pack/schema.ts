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

// Sentiment aspects matching custom GPT (4 required aspects)
export const sentimentAspectEnum = z.enum([
  "overall_satisfaction",
  "perceived_value",
  "ease_of_use_ux",
  "key_pain_points",
]);

// Research source types for detailed citation
export const researchSourceTypeEnum = z.enum([
  "sec_filing_10k",
  "sec_filing_20f",
  "sec_filing_10q",
  "annual_report",
  "analyst_report",
  "trade_press",
  "company_website",
  "benchmark_mckinsey",
  "benchmark_bain",
  "benchmark_kpmg",
  "benchmark_statista",
  "category_proxy",
  "app_store_review",
  "trustpilot",
  "google_review",
  "social_media",
  "customer_forum",
  "other",
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

// Research Source (for detailed citation tracking)
const researchSourceSchema = z.object({
  dataPoint: z.string().describe("What data point this source supports"),
  sourceType: researchSourceTypeEnum.describe("Type of source used"),
  sourceName: z.string().describe("Specific source name and date"),
  confidenceLevel: dataConfidenceEnum.describe(
    "Confidence level: H (direct disclosure), M (industry benchmark), L (inference/proxy)"
  ),
  isProxy: z.boolean().describe("Whether this is a proxy/inferred value"),
  proxyRationale: z
    .string()
    .nullable()
    .describe("If proxy, explain the inference logic"),
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
  loyaltyProgrammePenetration: z
    .string()
    .nullable()
    .describe("Loyalty programme penetration rate if known"),
  loyaltyProgrammeLaunchDate: z
    .string()
    .nullable()
    .describe("When the loyalty programme was launched"),
  loyaltyProgrammeBenefits: z
    .string()
    .nullable()
    .describe("Key benefits of the loyalty programme"),
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
    .describe("Current brand-specific initiatives in loyalty, personalisation, pricing, markdowns"),
  blendedGrossMarginPercent: z
    .number()
    .describe("Blended gross margin percentage"),
  blendedGrossMarginSource: z
    .string()
    .describe("Source for the gross margin figure"),
  inferenceNotes: z
    .string()
    .nullable()
    .describe("Notes on any inferences made, including benchmark sources used"),
  researchSources: z
    .array(researchSourceSchema)
    .describe("Detailed source citations for all research data points"),
});

// Modelling
const modellingSchema = z.object({
  baseCaseGMUpliftMillions: z
    .number()
    .describe("Base case GM uplift in millions of dollars (calculated using MIDPOINT values)"),
  modeApplied: valueCaseModeEnum.describe(
    "Whether median or stretch_up mode was applied based on $2m threshold"
  ),
  modeRationale: z
    .string()
    .describe("Rationale: if base case < $2m use stretch_up, if >= $2m use median"),
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
  valueCaseModeRationale: z.string().describe("Rationale for mode selection based on $2m threshold rule"),
});

// Slide 1 Input Table Row
const slide1InputRowSchema = z.object({
  metric: z.string().describe("The metric name (e.g., '1. Total Revenue')"),
  valueOrEstimate: z.string().describe("The value or estimate"),
  sourceOrLogic: z.string().describe("Source or logic used"),
});

// Slide 1 Notes
const slide1NotesSchema = z.object({
  keyProxies: z.string().describe("Key proxies used with sources"),
  dataGapsAndInference: z.string().describe("Data gaps and what inference was used"),
});

// Sentiment Evidence (enhanced with source details)
const sentimentEvidenceSchema = z.object({
  quote: z.string().describe("Direct verbatim quote from source"),
  source: z.string().describe("Source name (e.g., 'Trustpilot', 'App Store', 'Trade press article')"),
  monthYear: z.string().describe("Month and year of the quote (e.g., 'May 2025')"),
});

// Sentiment Table Row (with fixed 4 aspects matching custom GPT)
const sentimentTableRowSchema = z.object({
  aspect: sentimentAspectEnum.describe("One of the 4 required sentiment aspects"),
  aspectDisplayName: z.string().describe("Human-readable aspect name (e.g., 'Overall satisfaction')"),
  sentimentSummary: z.string().describe("Short description of sentiment for this aspect"),
  evidence: z
    .array(sentimentEvidenceSchema)
    .min(1)
    .max(2)
    .describe("1-2 short quotes with source and month/year"),
});

// Loyalty Sentiment Snapshot
const loyaltySentimentSnapshotSchema = z.object({
  overallSentimentRating: sentimentEnum.describe("Overall sentiment rating (positive/mixed/negative)"),
  summaryNarrative: z
    .string()
    .describe("80-150 word summary of how customers feel about the loyalty programme"),
  feedbackDominatedBy: feedbackDominatedByEnum.describe(
    "Whether feedback is dominated by loyalty members, general customers, or mixed"
  ),
  sentimentTable: z
    .array(sentimentTableRowSchema)
    .length(4)
    .describe("4-row sentiment table: overall_satisfaction, perceived_value, ease_of_use_ux, key_pain_points"),
});

// Value Case Table Row (with 6-step methodology)
const valueCaseRowSchema = z.object({
  areaOfImpact: z
    .string()
    .describe("Area of impact (e.g., 'A. Personalised Loyalty', 'B. Supplier-funded Loyalty', 'C. Price Optimisation', 'D. Total Cumulative Uplift')"),
  opportunityType: z.string().describe("Type of opportunity"),
  estimatedUpliftGM: z
    .number()
    .describe("Estimated uplift in GM (millions of dollars)"),
  assumptionsMethodology: z
    .string()
    .describe("6-step CFO-ready methodology: 1) Uplift point applied, 2) Range & source, 3) Why selected, 4) Simple maths, 5) Result, 6) Reassurance"),
});

// Slide 4 Value Case Table
const slide4ValueCaseTableSchema = z.object({
  rows: z
    .array(valueCaseRowSchema)
    .min(3)
    .describe("Value case rows: A, B (if multi-brand), C, D (total)"),
});

// Outputs
const outputsSchema = z.object({
  executiveOneLiner: z
    .string()
    .describe("Headline value (Gross Margin): $X.Xm - all figures expressed on a gross-margin basis"),
  cfoReadinessPanel: cfoReadinessPanelSchema.describe(
    "CFO readiness panel data"
  ),
  executiveSummary: z
    .string()
    .describe("100-200 word consultative narrative explaining GM uplift calculation, evidence, mode applied, and strategic importance"),
  slide1InputTable: z
    .array(slide1InputRowSchema)
    .length(7)
    .describe("7-row input table: Total Revenue, Revenue from Loyalty Members, Active Loyalty Members, AOV, Purchase Frequency, Paid Media Channels, Tech Stack"),
  slide1Notes: slide1NotesSchema.describe("Notes for Slide 1"),
  loyaltySentimentSnapshot: loyaltySentimentSnapshotSchema.describe(
    "Loyalty sentiment analysis for last 12 months"
  ),
  slide4ValueCaseTable: slide4ValueCaseTableSchema.describe(
    "Value case table with GM-based uplift estimates"
  ),
});

// Credible Range
const credibleRangeSchema = z.object({
  minPercent: z.number().describe("Minimum percentage of credible range"),
  maxPercent: z.number().describe("Maximum percentage of credible range"),
  source: z.string().describe("Source for the credible range (e.g., McKinsey, Bain, industry benchmark)"),
});

// Assumptions Block Item (enhanced with 6-step breakdown)
const assumptionsBlockItemSchema = z.object({
  leverId: z.string().describe("Unique lever identifier (A, B, C, or D)"),
  leverName: z.string().describe("Human-readable lever name"),
  upliftPercentageApplied: z.number().describe("The uplift percentage applied"),
  upliftPointDescription: z
    .string()
    .describe("Step 1: Description of the uplift point (median or upper-mid stretch)"),
  credibleRange: credibleRangeSchema.describe("Step 2: Credible range and source"),
  selectionRationale: z
    .string()
    .describe("Step 3: Why this point was selected based on $2m threshold"),
  mathsExplanation: z
    .string()
    .describe("Step 4: Plain-English calculation explanation"),
  resultGM: z.number().describe("Step 5: Resulting GM uplift in millions"),
  resultStatement: z.string().describe("Step 5: Result statement"),
  reassuranceStatement: z
    .string()
    .describe("Step 6: Reassurance about evidence-based bounds"),
  upliftMode: valueCaseModeEnum.describe("Whether median or stretch_up was applied"),
});

// Appendices
const appendicesSchema = z.object({
  assumptionsBlock: z
    .array(assumptionsBlockItemSchema)
    .describe("Detailed 6-step assumptions breakdown for each lever"),
  sources: z.array(z.string()).describe("List of all sources used, one per line"),
});

// ============================================================================
// Full ABM Pack Output Schema
// ============================================================================

export const abmPackOutputSchema = z.object({
  brandIntake: brandIntakeSchema.describe("Brand intake information"),
  research: researchSchema.describe("Research findings with detailed sources"),
  modelling: modellingSchema.describe("Modelling results with $2m threshold rule"),
  outputs: outputsSchema.describe("Output deliverables"),
  appendices: appendicesSchema.describe("Supporting appendices with 6-step assumptions"),
});

export type AbmPackOutput = z.infer<typeof abmPackOutputSchema>;
