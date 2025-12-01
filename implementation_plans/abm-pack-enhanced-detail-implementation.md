# ABM Pack Enhanced Detail Implementation Plan

## Overview

Port the full custom GPT prompt to the Vercel app while maintaining structured outputs for reliability. This requires coordinated changes to:
1. **Schema** (`schema.ts`) - Add new fields, update existing ones
2. **Route** (`route.ts`) - Enhanced system prompt and user prompt
3. **UX Component** (`abm-pack-generator.tsx`) - Render new information

---

## Phase 1: Schema Updates (`app/(chat)/api/abm-pack/schema.ts`)

### 1.1 Update Sentiment Aspects (Match Custom GPT)

**Current:**
- Rewards Value
- Earning Experience  
- Redemption Experience
- Overall Programme Perception

**New (Custom GPT):**
- Overall satisfaction
- Perceived value
- Ease of use / UX
- Key pain points

Add an enum for the 4 required aspects:
```typescript
export const sentimentAspectEnum = z.enum([
  "overall_satisfaction",
  "perceived_value", 
  "ease_of_use_ux",
  "key_pain_points",
]);
```

### 1.2 Add Loyalty Sentiment Source Enum

```typescript
export const sentimentSourceTypeEnum = z.enum([
  "app_store_review",
  "trustpilot",
  "google_review",
  "trade_press",
  "social_media",
  "customer_forum",
  "other",
]);
```

### 1.3 Enhanced Sentiment Evidence Schema

Update `sentimentEvidenceSchema` to include source type:
```typescript
const sentimentEvidenceSchema = z.object({
  quote: z.string().describe("Direct verbatim quote from source"),
  sourceType: sentimentSourceTypeEnum.describe("Type of source"),
  sourceName: z.string().describe("Specific source name (e.g., 'App Store', 'Trustpilot')"),
  monthYear: z.string().describe("Month and year of the quote (e.g., 'May 2025')"),
});
```

### 1.4 Update Sentiment Table Row Schema

```typescript
const sentimentTableRowSchema = z.object({
  aspect: sentimentAspectEnum.describe("One of the 4 required sentiment aspects"),
  aspectDisplayName: z.string().describe("Human-readable aspect name"),
  sentimentSummary: z.string().describe("Short description of sentiment for this aspect"),
  evidence: z
    .array(sentimentEvidenceSchema)
    .min(1)
    .max(2)
    .describe("1-2 short quotes with source and month/year"),
});
```

### 1.5 Add Research Source Hierarchy Schema

```typescript
const researchSourceSchema = z.object({
  dataPoint: z.string().describe("What data point this source supports"),
  sourceType: z.enum([
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
    "other",
  ]).describe("Type of source used"),
  sourceName: z.string().describe("Specific source name and date"),
  confidenceLevel: dataConfidenceEnum.describe("Confidence level for this data point"),
  isProxy: z.boolean().describe("Whether this is a proxy/inferred value"),
  proxyRationale: z.string().nullable().describe("If proxy, explain the inference logic"),
});
```

### 1.6 Update Research Schema

Add fields for research sources and loyalty sentiment detail:
```typescript
const researchSchema = z.object({
  // Existing fields...
  latestAnnualRevenue: z.string(),
  latestAnnualRevenueSource: z.string(),
  loyaltyProgrammeDetails: z.string(),
  activeLoyaltyMembers: z.string().nullable(),
  aovBenchmark: z.string(),
  purchaseFrequencyBenchmark: z.string(),
  paidMediaChannels: z.string(),
  techStack: z.string(),
  brandSpecificInitiatives: z.string(),
  blendedGrossMarginPercent: z.number(),
  blendedGrossMarginSource: z.string(),
  inferenceNotes: z.string().nullable(),
  
  // NEW FIELDS
  loyaltyProgrammePenetration: z.string().nullable().describe("Loyalty programme penetration rate if known"),
  loyaltyProgrammeLaunchDate: z.string().nullable().describe("When the loyalty programme was launched"),
  loyaltyProgrammeBenefits: z.string().nullable().describe("Key benefits of the loyalty programme"),
  researchSources: z.array(researchSourceSchema).describe("Detailed source citations for all research"),
});
```

### 1.7 Update Assumptions Block Schema (CFO-Ready 6-Step)

```typescript
const assumptionsBlockItemSchema = z.object({
  leverId: z.string().describe("Unique lever identifier (A, B, C, D)"),
  leverName: z.string().describe("Human-readable lever name"),
  
  // Step 1: Uplift point applied
  upliftPercentageApplied: z.number().describe("The uplift percentage applied"),
  upliftPointDescription: z.string().describe("Step 1: Description of the uplift point (median or stretch-up)"),
  
  // Step 2: Range & source
  credibleRange: z.object({
    minPercent: z.number(),
    maxPercent: z.number(),
    source: z.string().describe("Source for the credible range"),
  }),
  
  // Step 3: Why this point was selected
  selectionRationale: z.string().describe("Step 3: Why this point was selected based on $2m threshold"),
  
  // Step 4: Simple maths explanation
  mathsExplanation: z.string().describe("Step 4: Plain-English calculation explanation"),
  
  // Step 5: Result
  resultGM: z.number().describe("Step 5: Resulting GM uplift in millions"),
  resultStatement: z.string().describe("Step 5: Result statement"),
  
  // Step 6: Reassurance
  reassuranceStatement: z.string().describe("Step 6: Reassurance about evidence-based bounds"),
  
  upliftMode: valueCaseModeEnum.describe("Whether median or stretch_up was applied"),
});
```

### 1.8 Update Value Case Row Schema

Ensure `assumptionsMethodology` follows the 6-step template:
```typescript
const valueCaseRowSchema = z.object({
  areaOfImpact: z.string().describe("Area of impact (A, B, C, or D)"),
  opportunityType: z.string().describe("Type of opportunity"),
  estimatedUpliftGM: z.number().describe("Estimated uplift in GM (millions)"),
  assumptionsMethodology: z.string().describe("Full 6-step plain-English methodology following CFO-ready template"),
});
```

---

## Phase 2: Route Updates (`app/(chat)/api/abm-pack/route.ts`)

### 2.1 Replace System Prompt (Full Custom GPT Port)

```typescript
const ABM_SYSTEM_PROMPT = `
You are ABM Pack Builder, an expert in strategic account-based marketing for retail.

Produce a CFO-ready ABM pack using our Smart Scalable Outreach Framework.
Follow the output order and table formats exactly.
All value outputs must be expressed in $Gross Margin (GM), not revenue.

===========================================================
0) BRAND INTAKE (REQUIRED OR INFERRED)
===========================================================

Ask for or infer:
- Brand
- Website
- Business registry / SEC / EDGAR link (if available)
- Category (e.g., premium activewear, outdoor goods, premium gifting & grocery)
- Brand Type: own-brand only / multi-brand / mixed (infer from catalogue if not provided)
- Any contextual notes (optional)

===========================================================
1) LIVE RESEARCH (ALWAYS RUN BEFORE OUTPUT)
===========================================================

Find and cite:
- Latest filed annual revenue (most recent FY), prioritising:
  - US SEC filings (10-K / 20-F / 10-Q) and annual reports for listed companies
  - Credible trade / analyst / news sources for private companies
- Loyalty programme details (penetration, benefits, launch date)
- Active loyalty members or active customers (if available)
- AOV and purchase frequency benchmarks (category-specific, US or closest available market)
- Paid media channels (ads, campaigns, job postings)
- Tech stack (commerce, CRM, loyalty, marketing automation)
- Brand-specific initiatives in loyalty, personalisation, pricing, markdowns
- Blended gross margin % (GM%) from filings or analyst notes; if unavailable, use a credible category proxy
- Loyalty sentiment (last 12 months):
  - Overall sentiment (positive / mixed / negative)
  - Key themes in what customers like and dislike about the loyalty programme
  - Short, representative quotes from customer reviews, app store reviews or public articles, each with clear source and date

===========================================================
2) BENCHMARK & INFERENCE LOGIC
===========================================================

- If brand data is missing, use credible category benchmarks (McKinsey, Bain, KPMG, Statista, trade press).
- Always explain inference briefly and cite the source.
- If only non-US data is available, use it as a proxy and clearly state this.
- Mark each data point with confidence level: H (High - direct disclosure), M (Medium - industry benchmark), L (Low - inference/proxy).

===========================================================
3) VALUE CASE MODELLING LOGIC (CORE RULES)
===========================================================

All uplift modelling must be in $Gross Margin (GM).

A) For each lever, determine the evidence-based credible range.
B) Compute the MIDPOINT (median uplift point).
C) Compute the STRETCH-UP POINT (approximately 70th to 85th percentile of the credible range, never exceeding the evidence-backed maximum).

BASE CASE VALUE = sum of all GM uplift using MIDPOINT values.

APPLY THIS RULE:
- If BASE CASE < $2,000,000 GM uplift:
    -> Use STRETCH-UP values for ALL levers equally.
- If BASE CASE >= $2,000,000 GM uplift:
    -> Use MIDPOINT values for ALL levers.

Never exceed credible evidence-based bounds.
Never include revenue uplift in the headline numbers.
The value case must never be reverse engineered to hit any predefined ROI multiple or fixed GM or revenue target.

- Do not design the model to aim for any fixed ROI (for example, 10x) or any specific monetary outcome.
- Do not mention ROI multiples, payback periods or target returns unless they are explicitly requested.
- If ROI or payback is explicitly requested, calculate it transparently from the already modelled GM uplift and clearly state all assumptions.

===========================================================
4) OUTPUT ORDER (STRICT)
===========================================================

1) EXECUTIVE ONE-LINER
"Headline value (Gross Margin): $X.Xm - all figures expressed on a gross-margin basis."

2) CFO READINESS PANEL
- Blended GM% used: X% (source / proxy)
- Brand type: Own-brand / Multi-brand / Mixed
- Data confidence: Revenue [H/M/L], Loyalty [H/M/L], AOV [H/M/L], Frequency [H/M/L]
- Value case mode: Median / Stretch-up (state which applied and why)

3) EXECUTIVE SUMMARY (100 to 200 WORDS)
A consultative narrative explaining:
- How the total GM uplift was calculated
- Evidence from brand performance, category benchmarks, and loyalty or pricing initiatives
- Whether median or stretch-up values were applied and why
- Why this value case matters strategically to the brand now

4) SLIDE 1 - INPUT TABLE (7 ROWS)
| Metric | Value / Estimate | Source / Logic |
| --- | --- | --- |
| 1. Total Revenue |  |  |
| 2. Revenue from Loyalty Members |  |  |
| 3. Active Loyalty Members |  |  |
| 4. AOV |  |  |
| 5. Purchase Frequency |  |  |
| 6. Paid Media Channels |  |  |
| 7. Tech Stack |  |  |

Notes:
- Key proxies (with sources)
- Any data gaps and what inference was used

5) SLIDE 2 - LOYALTY SENTIMENT SNAPSHOT (LAST 12 MONTHS)
Provide:
- Overall sentiment rating for the loyalty programme (positive / mixed / negative)
- A concise summary (80 to 150 words) of how customers feel about the loyalty programme, based on the last 12 months of public feedback
- Clear reference to whether feedback is dominated by existing loyalty members or general customers

Include a sentiment table with EXACTLY these 4 aspects:
| Aspect | Sentiment Summary | Evidence (Quotes & Sources) |
| --- | --- | --- |
| Overall satisfaction | Short description | 1 to 2 short quotes with source and month/year |
| Perceived value | Short description | 1 to 2 short quotes with source and month/year |
| Ease of use / UX | Short description | 1 to 2 short quotes with source and month/year |
| Key pain points | Short description | 1 to 2 short quotes with source and month/year |

Rules for quotes:
- Use short, representative verbatim excerpts from customer reviews, app stores, public review sites or articles.
- Each quote should be clearly cited, for example: [Trustpilot, May 2025], [App Store review, March 2025], [Trade press article, July 2025].
- Focus on the last 12 months. If you must use older material due to limited data, clearly state this in the sentiment summary.

6) SLIDE 4 - VALUE CASE TABLE (GM-BASED)
All values must be $GM.

| Area of Impact | Opportunity Type | Estimated Uplift ($GM) | Assumptions / Methodology |
| --- | --- | --- | --- |
| A. Personalised Loyalty (incl. offer waste reduction) | Incremental GM from better targeting and reduced discount waste | $Xm | [6-step template] |
| B. Supplier-funded Loyalty (if applicable; omit for own-brand only) | Supplier-funded offers and contributions | $Xm | [6-step template] |
| C. Price Optimisation | GM uplift from improved price architecture and markdown management | $Xm | [6-step template] |
| D. Total Cumulative Uplift (GM) | Sum of A to C | $Xm | [Combined summary] |

If the brand is own-brand only, remove the Supplier-funded Loyalty row entirely and adjust the Total Cumulative Uplift accordingly.

===========================================================
4.1 UNIFORM PLAIN-ENGLISH EXPLANATION TEMPLATE (MANDATORY)
===========================================================

For EVERY row in Slide 4, the Assumptions & Methodology column MUST follow this exact structure, in this order:

1. UPLIFT POINT APPLIED
"We have applied a X% uplift, which represents the [median / upper-mid stretch] of the credible range for this lever."

2. RANGE & SOURCE
"This sits within the credible category range of A% to B%, based on [source]."

3. WHY THIS POINT WAS SELECTED
"We selected this point because the total value case [was above/below] the 2 million dollar threshold, which means the model uses the [median / stretch-up] rule."

4. SIMPLE MATHS EXPLANATION
"In practice, this means applying the X% uplift to [loyal customers / relevant revenue / supplier-funded portion], and converting this into gross margin using the blended GM% of Y%."

5. RESULT
"This results in an estimated gross margin uplift of $Z.Xm for this lever."

6. REASSURANCE
"All assumptions sit comfortably within evidence-based bounds and avoid reliance on extreme best-case scenarios."

ADDITIONAL RULES:
- No algebraic formulas unless unavoidable.
- Always name the uplift percentage chosen.
- Always name the credible range and its citation.
- Always state whether median or stretch-up was used.
- Language must be consistent across ALL levers.
- Do not describe any ROI multiple or target.

===========================================================
5) CATEGORY & BRAND CONTEXT REQUIREMENTS
===========================================================

- Match all benchmarks to the brand's true category.
- If own-brand only: remove the supplier-funded row entirely.
- Integrate brand-specific loyalty, personalisation and pricing evidence.
- Where possible, reflect any recent brand initiatives that are visible in filings, news or public communications.

===========================================================
6) STYLE & CITATIONS
===========================================================

- UK English spelling and grammar; authoritative but accessible tone.
- Tables must be complete with no missing rows.
- Always cite credible sources inline.
- Always state logic when using proxies or inferred values.
- For loyalty sentiment, always connect quotes directly to their platforms or sources with month and year.

===========================================================
7) APPENDICES
===========================================================

A) Assumptions Block
List actual uplift percentages used (median or stretch-up) for each lever, with full 6-step breakdown and sources.

B) Sources Appendix
One line per citation link, organised by data category.
`;
```

### 2.2 Update User Prompt Builder

```typescript
function buildUserPrompt(request: AbmPackRequest): string {
  return `
Brand intake for this ABM pack:

- Brand: ${request.brand}
- Website: ${request.website ?? "Not provided – infer from context if possible"}
- Business registry / SEC / EDGAR link: ${request.registryUrl ?? "Not provided – search for SEC filings if listed"}
- Category: ${request.category ?? "Not provided – infer from catalogue and positioning"}
- Brand type (own-brand only / multi-brand / mixed): ${request.brandType ?? "Not provided – infer from catalogue if needed"}
- Contextual notes: ${request.notes ?? "None provided"}

IMPORTANT INSTRUCTIONS:

1) RESEARCH FIRST: Before generating any output, conduct thorough research on this brand:
   - Search for SEC filings (10-K, 20-F, 10-Q) for revenue and GM data
   - Find loyalty programme details, member counts, penetration rates
   - Gather AOV and purchase frequency benchmarks for this category
   - Identify paid media channels and tech stack
   - Find loyalty sentiment quotes from app stores, review sites, trade press (last 12 months)

2) BENCHMARK GAPS: For any missing data, use credible category benchmarks from McKinsey, Bain, KPMG, or Statista. Clearly mark these as proxies.

3) VALUE CASE: Apply the $2m threshold rule CORRECTLY:
   - First calculate BASE CASE using MIDPOINT values for all levers
   - If BASE CASE < $2m: switch to STRETCH-UP values for ALL levers
   - If BASE CASE >= $2m: keep MIDPOINT values for ALL levers

4) 6-STEP METHODOLOGY: For EVERY value case row, follow the mandatory 6-step template:
   1. Uplift point applied (X% representing median/stretch-up)
   2. Range & source (A% to B% based on [source])
   3. Why selected (threshold rule explanation)
   4. Simple maths (plain English calculation)
   5. Result ($X.Xm GM uplift)
   6. Reassurance (evidence-based bounds statement)

5) LOYALTY SENTIMENT: Include EXACTLY 4 aspects in the sentiment table:
   - Overall satisfaction
   - Perceived value
   - Ease of use / UX
   - Key pain points
   Each with 1-2 quotes, source name, and month/year.

6) OWN-BRAND RULE: If brand type is "own_brand_only", OMIT the supplier-funded loyalty row entirely.

7) UK ENGLISH: Use UK English spelling throughout (e.g., "programme" not "program", "personalisation" not "personalization").

Generate the complete ABM pack now, ensuring all fields are populated with meaningful, researched data.
`;
}
```

---

## Phase 3: UX Updates (`components/abm-pack-generator.tsx`)

### 3.1 New Section: Research Sources Panel

Add after Brand Intake section:
```tsx
{result.research.researchSources && result.research.researchSources.length > 0 && (
  <div>
    <h3 className="text-lg font-semibold mb-2">Research Sources</h3>
    <div className="bg-muted p-4 rounded-lg space-y-2">
      {result.research.researchSources.map((source, idx) => (
        <div key={idx} className="flex items-start gap-2 text-sm">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            source.confidenceLevel === 'H' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            source.confidenceLevel === 'M' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {source.confidenceLevel}
          </span>
          <div>
            <span className="font-medium">{source.dataPoint}:</span>{' '}
            <span className="text-muted-foreground">{source.sourceName}</span>
            {source.isProxy && (
              <span className="text-orange-600 dark:text-orange-400 ml-2">(Proxy: {source.proxyRationale})</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

### 3.2 Enhanced Loyalty Sentiment Section

Replace existing sentiment section with full table:
```tsx
{result.outputs.loyaltySentimentSnapshot && (
  <div>
    <h3 className="text-lg font-semibold mb-2">Loyalty Sentiment Snapshot (Last 12 Months)</h3>
    <div className="bg-muted p-4 rounded-lg space-y-4">
      {/* Overall rating */}
      <div className="flex items-center gap-3">
        <span className="font-medium">Overall:</span>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          result.outputs.loyaltySentimentSnapshot.overallSentimentRating === "positive"
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : result.outputs.loyaltySentimentSnapshot.overallSentimentRating === "negative"
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        }`}>
          {result.outputs.loyaltySentimentSnapshot.overallSentimentRating?.toUpperCase()}
        </span>
        <span className="text-sm text-muted-foreground">
          (Feedback dominated by: {result.outputs.loyaltySentimentSnapshot.feedbackDominatedBy?.replace('_', ' ')})
        </span>
      </div>
      
      {/* Summary narrative */}
      <p className="text-sm">{result.outputs.loyaltySentimentSnapshot.summaryNarrative}</p>
      
      {/* Sentiment table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-semibold">Aspect</th>
              <th className="text-left py-2 font-semibold">Sentiment</th>
              <th className="text-left py-2 font-semibold">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {result.outputs.loyaltySentimentSnapshot.sentimentTable?.map((row, idx) => (
              <tr key={idx} className="border-b last:border-b-0">
                <td className="py-3 font-medium align-top">{row.aspectDisplayName ?? row.aspect}</td>
                <td className="py-3 align-top">{row.sentimentSummary}</td>
                <td className="py-3 align-top">
                  <div className="space-y-2">
                    {row.evidence?.map((ev, evIdx) => (
                      <div key={evIdx} className="text-xs">
                        <span className="italic">"{ev.quote}"</span>
                        <span className="text-muted-foreground ml-1">
                          — [{ev.sourceName}, {ev.monthYear}]
                        </span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}
```

### 3.3 Enhanced Value Case Section with 6-Step Methodology

Update to show the full methodology breakdown:
```tsx
{result.outputs.slide4ValueCaseTable?.rows && result.outputs.slide4ValueCaseTable.rows.length > 0 && (
  <div>
    <h3 className="text-lg font-semibold mb-2">Value Case (GM-Based)</h3>
    <div className="space-y-4">
      {result.outputs.slide4ValueCaseTable.rows.map((row, idx) => (
        <div key={idx} className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-semibold">{row.areaOfImpact}</p>
              <p className="text-sm text-muted-foreground">{row.opportunityType}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${row.estimatedUpliftGM.toFixed(2)}m
              </p>
              <p className="text-xs text-muted-foreground">GM Uplift</p>
            </div>
          </div>
          
          {/* Expanded methodology */}
          <details className="mt-3">
            <summary className="text-sm font-medium cursor-pointer hover:text-blue-600">
              View Methodology (6-Step CFO-Ready Explanation)
            </summary>
            <div className="mt-3 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
              {row.assumptionsMethodology}
            </div>
          </details>
        </div>
      ))}
    </div>
  </div>
)}
```

### 3.4 Enhanced Appendices Section

Add new section for detailed assumptions:
```tsx
{result.appendices && (
  <div>
    <h3 className="text-lg font-semibold mb-2">Appendices</h3>
    
    {/* Assumptions Block */}
    {result.appendices.assumptionsBlock && result.appendices.assumptionsBlock.length > 0 && (
      <div className="mb-4">
        <h4 className="font-medium mb-2">A) Assumptions Block</h4>
        <div className="space-y-3">
          {result.appendices.assumptionsBlock.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-3 text-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{item.leverName}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  item.upliftMode === 'median' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                }`}>
                  {item.upliftMode === 'median' ? 'Median' : 'Stretch-Up'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Uplift Applied:</span>{' '}
                  <span className="font-medium">{item.upliftPercentageApplied}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Credible Range:</span>{' '}
                  <span className="font-medium">
                    {item.credibleRange.minPercent}% - {item.credibleRange.maxPercent}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Source: {item.credibleRange.source}
              </p>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Sources List */}
    {result.appendices.sources && result.appendices.sources.length > 0 && (
      <div>
        <h4 className="font-medium mb-2">B) Sources</h4>
        <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
          {result.appendices.sources.map((source, idx) => (
            <li key={idx}>{source}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}
```

### 3.5 New Slide 1 Input Table Section

Add after Executive Summary:
```tsx
{result.outputs.slide1InputTable && result.outputs.slide1InputTable.length > 0 && (
  <div>
    <h3 className="text-lg font-semibold mb-2">Slide 1 - Input Metrics</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-sm border rounded-lg">
        <thead className="bg-muted">
          <tr>
            <th className="text-left py-2 px-3 font-semibold">Metric</th>
            <th className="text-left py-2 px-3 font-semibold">Value / Estimate</th>
            <th className="text-left py-2 px-3 font-semibold">Source / Logic</th>
          </tr>
        </thead>
        <tbody>
          {result.outputs.slide1InputTable.map((row, idx) => (
            <tr key={idx} className="border-t">
              <td className="py-2 px-3 font-medium">{row.metric}</td>
              <td className="py-2 px-3">{row.valueOrEstimate}</td>
              <td className="py-2 px-3 text-muted-foreground text-xs">{row.sourceOrLogic}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {result.outputs.slide1Notes && (
      <div className="mt-2 p-3 bg-muted rounded-lg text-xs">
        <p><strong>Key Proxies:</strong> {result.outputs.slide1Notes.keyProxies}</p>
        <p><strong>Data Gaps:</strong> {result.outputs.slide1Notes.dataGapsAndInference}</p>
      </div>
    )}
  </div>
)}
```

---

## Phase 4: Implementation Order

### Step 1: Schema Updates
1. Add new enums for sentiment aspects and source types
2. Update `sentimentEvidenceSchema` with new fields
3. Update `sentimentTableRowSchema` with aspect enum
4. Add `researchSourceSchema`
5. Update `researchSchema` with new fields
6. Update `assumptionsBlockItemSchema` with 6-step fields
7. Test schema compiles without errors

### Step 2: Route Updates
1. Replace `ABM_SYSTEM_PROMPT` with full custom GPT port
2. Update `buildUserPrompt` function
3. Verify JSON schema generation works with new schema
4. Test endpoint with sample request

### Step 3: UX Updates
1. Add Research Sources panel
2. Add Slide 1 Input Table section
3. Enhance Loyalty Sentiment section with full table
4. Enhance Value Case section with expandable methodology
5. Add Appendices section
6. Test full UI rendering

### Step 4: Testing
1. Generate ABM pack for a known brand (e.g., Nike, Lululemon)
2. Verify all new fields are populated
3. Check 6-step methodology is present in value case rows
4. Verify sentiment quotes have sources and dates
5. Confirm $2m threshold rule is applied correctly

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema changes break existing responses | High | Carefully test with sample generations |
| Longer prompts may hit token limits | Medium | Monitor token usage, optimize if needed |
| Model may not follow 6-step template exactly | Medium | Provide explicit examples in prompt |
| Structured outputs may truncate long content | Medium | Consider increasing field description lengths |

---

## Rollback Plan

If issues arise:
1. Revert schema changes (restore original `schema.ts`)
2. Revert route changes (restore original prompts)
3. UX changes are safe as they handle missing data gracefully

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Schema | 1-2 hours |
| Phase 2: Route | 1 hour |
| Phase 3: UX | 2-3 hours |
| Phase 4: Testing | 1-2 hours |
| **Total** | **5-8 hours** |

---

## Approval Checklist

Before implementation, confirm:
- [ ] Schema changes are understood and approved
- [ ] Full system prompt port is approved
- [ ] UX component changes are approved
- [ ] Testing approach is agreed
- [ ] Rollback plan is acceptable

