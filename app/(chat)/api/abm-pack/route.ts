import { generateText } from "ai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { myProvider } from "@/lib/ai/providers";
import { getMessageCountByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import {
  abmPackOutputSchema,
  abmPackRequestSchema,
  type AbmPackRequest,
  type AbmPackOutput,
} from "./schema";

// Convert Zod schema to JSON Schema for OpenAI Structured Outputs
const rawJsonSchema = zodToJsonSchema(abmPackOutputSchema, {
  name: "AbmPack",
  $refStrategy: "none", // Inline all definitions instead of using $ref
}) as Record<string, unknown>;

// Extract the actual schema definition - zodToJsonSchema may wrap it in definitions/$ref
// We need the object with "properties", not the wrapper
const abmPackJsonSchema: Record<string, unknown> = (() => {
  // If there's a definitions.AbmPack, use that
  const definitions = rawJsonSchema.definitions as Record<string, unknown> | undefined;
  if (definitions?.AbmPack) {
    return definitions.AbmPack as Record<string, unknown>;
  }
  // If the schema itself has properties, use it directly
  if (rawJsonSchema.properties) {
    return rawJsonSchema;
  }
  // Fallback: return as-is and log warning
  console.warn("⚠️ Could not find properties in JSON schema - structured outputs may not work correctly");
  return rawJsonSchema;
})();

// Debug: Log the schema structure at startup
console.log("🔧 JSON Schema structure check:");
console.log("  - Has properties:", "properties" in abmPackJsonSchema);
console.log("  - Property keys:", Object.keys((abmPackJsonSchema.properties as Record<string, unknown>) ?? {}));
console.log("  - Required fields:", abmPackJsonSchema.required);

// Debug: Log nested schema structure for outputs
const outputsProps = (abmPackJsonSchema.properties as Record<string, unknown>)?.outputs as Record<string, unknown> | undefined;
if (outputsProps?.properties) {
  console.log("  - Outputs property keys:", Object.keys(outputsProps.properties as Record<string, unknown>));
}

// Debug: Check if arrays are properly defined
const researchProps = (abmPackJsonSchema.properties as Record<string, unknown>)?.research as Record<string, unknown> | undefined;
if (researchProps?.properties) {
  const researchSources = (researchProps.properties as Record<string, unknown>)?.researchSources as Record<string, unknown> | undefined;
  console.log("  - researchSources type:", researchSources?.type);
}

export const maxDuration = 600; // ABM packs may take longer to generate

// =============================================================================
// FULL CUSTOM GPT SYSTEM PROMPT - CFO-Ready ABM Pack Builder
// =============================================================================
const ABM_SYSTEM_PROMPT = `You are ABM Pack Builder, an expert in strategic account-based marketing for retail.
Produce a CFO-ready ABM pack using our Smart Scalable Outreach Framework.
Follow the output order and table formats exactly.
All value outputs must be expressed in $Gross Margin (GM), not revenue.

CRITICAL: Your response MUST be a valid JSON object with EXACTLY these 5 top-level keys:
1. "brandIntake" - Brand intake information
2. "research" - Research findings with detailed sources
3. "modelling" - Modelling results with $2m threshold rule
4. "outputs" - Output deliverables
5. "appendices" - Supporting appendices with 6-step assumptions

ALL 5 keys are mandatory. Do not omit any of them.

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
- Do not mention ROI multiples, payback periods or target returns unless they are explicitly requested in the current user message.
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
| A. Personalised Loyalty (incl. offer waste reduction) | Incremental GM from better targeting and reduced discount waste | $Xm | [See 6-step template below] |
| B. Supplier-funded Loyalty (if applicable; omit for own-brand only) | Supplier-funded offers and contributions | $Xm | [See 6-step template below] |
| C. Price Optimisation | GM uplift from improved price architecture and markdown management | $Xm | [See 6-step template below] |
| D. Total Cumulative Uplift (GM) | Sum of A to C | $Xm | [See 6-step template below, referencing the combined effect] |

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
- Do not describe any ROI multiple or target. Only provide ROI if explicitly asked, and then calculate it transparently from the GM uplift already modelled.

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

===========================================================
DATA CONFIDENCE RATINGS
===========================================================
- H (High): Direct company disclosure or verified third-party data
- M (Medium): Industry benchmark or credible estimate
- L (Low): Inference or proxy-based estimate

===========================================================
SENTIMENT ASPECTS (EXACTLY 4 REQUIRED)
===========================================================
The sentimentTable must have exactly 4 rows with these aspects:
1. "overall_satisfaction" (display: "Overall satisfaction")
2. "perceived_value" (display: "Perceived value")
3. "ease_of_use_ux" (display: "Ease of use / UX")
4. "key_pain_points" (display: "Key pain points")
`;

function buildUserPrompt(request: AbmPackRequest): string {
  return `
Brand intake for this ABM pack:

- Brand: ${request.brand}
- Website: ${request.website ?? "Not provided – search for official website"}
- Business registry / SEC / EDGAR link: ${request.registryUrl ?? "Not provided – search for SEC filings if publicly listed"}
- Category: ${request.category ?? "Not provided – infer from catalogue and positioning"}
- Brand type (own-brand only / multi-brand / mixed): ${request.brandType ?? "Not provided – infer from catalogue if needed"}
- Contextual notes: ${request.notes ?? "None provided"}

===========================================================
MANDATORY RESEARCH TASKS (DO ALL BEFORE GENERATING OUTPUT)
===========================================================

1) FINANCIAL RESEARCH:
   - Search for SEC filings (10-K, 20-F, 10-Q) for revenue and GM data
   - Find analyst reports or trade press for private companies
   - Identify blended gross margin % from filings or use category proxy

2) LOYALTY PROGRAMME RESEARCH:
   - Find loyalty programme name, launch date, benefits
   - Estimate penetration rate and active member count
   - Search for loyalty-related announcements or initiatives

3) BENCHMARK RESEARCH:
   - Gather AOV and purchase frequency benchmarks for this category
   - Use McKinsey, Bain, KPMG, or Statista as sources
   - Clearly mark any proxies with confidence level (H/M/L)

4) TECH & MEDIA RESEARCH:
   - Identify paid media channels (search for ads, campaigns)
   - Find tech stack (commerce platform, CRM, loyalty system)

5) LOYALTY SENTIMENT RESEARCH (LAST 12 MONTHS):
   - Search app stores, Trustpilot, Google reviews for loyalty feedback
   - Find 1-2 verbatim quotes per aspect with source and date
   - Cover all 4 aspects: overall satisfaction, perceived value, ease of use/UX, key pain points

===========================================================
VALUE CASE INSTRUCTIONS
===========================================================

Apply the $2m threshold rule CORRECTLY:
1. First calculate BASE CASE using MIDPOINT values for all levers
2. If BASE CASE < $2m GM uplift: switch to STRETCH-UP values for ALL levers
3. If BASE CASE >= $2m GM uplift: keep MIDPOINT values for ALL levers

For EVERY value case row, use the mandatory 6-step CFO-ready template:
1. Uplift point applied: "We have applied a X% uplift, which represents the [median/stretch-up] of the credible range."
2. Range & source: "This sits within the credible category range of A% to B%, based on [source]."
3. Why selected: "We selected this point because the total value case [was above/below] the 2 million dollar threshold."
4. Simple maths: "In practice, this means applying X% to [segment], converting to GM using Y% blended margin."
5. Result: "This results in an estimated gross margin uplift of $Z.Xm."
6. Reassurance: "All assumptions sit comfortably within evidence-based bounds."

===========================================================
OWN-BRAND RULE
===========================================================
If brand type is "own_brand_only", OMIT the supplier-funded loyalty row (B) entirely from the value case table.

===========================================================
STYLE REQUIREMENTS
===========================================================
- Use UK English spelling throughout (programme, personalisation, colour, etc.)
- All monetary figures in USD with appropriate precision
- Cite sources inline with dates where available

Generate the complete ABM pack now with all fields populated.
`;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] 🚀 ABM Pack generation request received`);
  console.log(`[${requestId}] Request timestamp: ${new Date().toISOString()}`);

  let requestBody: AbmPackRequest;

  try {
    console.log(`[${requestId}] 📖 Parsing request JSON...`);
    const json = await request.json();
    console.log(`[${requestId}] ✅ Raw JSON parsed successfully`);
    console.log(`[${requestId}] 📋 Request data:`, JSON.stringify(json, null, 2));

    console.log(`[${requestId}] 🔍 Validating request against schema...`);
    requestBody = abmPackRequestSchema.parse(json);
    console.log(`[${requestId}] ✅ Request validation passed`);
    console.log(`[${requestId}] Brand: ${requestBody.brand}`);
    console.log(`[${requestId}] Category: ${requestBody.category}`);
    console.log(`[${requestId}] Brand Type: ${requestBody.brandType}`);
    console.log(`[${requestId}] Selected Model: ${requestBody.selectedModel}`);
  } catch (error) {
    console.error(
      `[${requestId}] ❌ Request parsing/validation failed:`,
      error instanceof Error ? error.message : String(error)
    );
    return new ChatSDKError("bad_request:abm-pack").toResponse();
  }

  try {
    console.log(`[${requestId}] 🔐 Authenticating user...`);
    const session = await auth();

    if (!session?.user) {
      console.error(`[${requestId}] ❌ Authentication failed: No session found`);
      return new ChatSDKError("unauthorized:abm-pack").toResponse();
    }

    console.log(`[${requestId}] ✅ User authenticated`);
    console.log(`[${requestId}] User ID: ${session.user.id}`);
    console.log(`[${requestId}] User Type: ${session.user.type}`);

    const userType: UserType = session.user.type;

    // Rate limiting (shares limits with chat)
    console.log(`[${requestId}] ⏱️  Checking rate limits (last 24 hours)...`);
    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });
    console.log(
      `[${requestId}] 📊 Message count in last 24h: ${messageCount}/${entitlementsByUserType[userType].maxMessagesPerDay}`
    );

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      console.error(
        `[${requestId}] ❌ Rate limit exceeded for user type "${userType}"`
      );
      return new ChatSDKError("rate_limit:abm-pack").toResponse();
    }

    console.log(`[${requestId}] ✅ Rate limit check passed`);

    console.log(`[${requestId}] 🤖 Initializing AI model...`);
    const model = myProvider.languageModel(requestBody.selectedModel);
    console.log(`[${requestId}] ✅ Model initialized: ${requestBody.selectedModel}`);

    console.log(`[${requestId}] 📝 Building user prompt...`);
    const userPrompt = buildUserPrompt(requestBody);
    console.log(
      `[${requestId}] ✅ User prompt generated (length: ${userPrompt.length} chars)`
    );

    console.log(`[${requestId}] 🎯 Generating structured ABM pack object...`);
    console.log(`[${requestId}] System prompt length: ${ABM_SYSTEM_PROMPT.length} chars`);
    console.log(`[${requestId}] ⏳ This may take 60-120 seconds with enhanced detail...`);

    const startTime = Date.now();
    
    // Debug: Log the JSON schema being sent to OpenAI
    const schemaProperties = abmPackJsonSchema.properties as Record<string, unknown> | undefined;
    console.log(`[${requestId}] 🔑 JSON Schema keys:`, Object.keys(schemaProperties ?? {}));
    if (!schemaProperties || Object.keys(schemaProperties).length === 0) {
      console.error(`[${requestId}] ❌ WARNING: JSON Schema has no properties! Structured outputs will not be constrained.`);
    }
    
    // Build the response format for OpenAI Structured Outputs
    // Use JSON.parse/stringify to ensure clean JSON types
    const responseFormat = JSON.parse(JSON.stringify({
      type: "json_schema",
      json_schema: {
        name: "abm_pack",
        strict: true,
        schema: abmPackJsonSchema,
      },
    }));
    
    // Use OpenAI's Structured Outputs with exact JSON schema
    // This GUARANTEES the output matches our schema exactly
    const { text, usage } = await generateText({
      model,
      system: ABM_SYSTEM_PROMPT,
      prompt: userPrompt,
        tools: {
    webSearch: webSearch(),
  },
      providerOptions: {
        openai: {
          response_format: responseFormat,
        },
      },
    });
    const generationTime = Date.now() - startTime;
    
    // Debug: Log raw text to see what the model returned
    console.log(`[${requestId}] 📄 Raw text length:`, text.length);
    
    // Parse the JSON - OpenAI strict mode guarantees schema compliance
    let object: AbmPackOutput;
    try {
      object = JSON.parse(text) as AbmPackOutput;
      console.log(`[${requestId}] 📦 Parsed JSON keys:`, Object.keys(object));
      console.log(`[${requestId}] 📦 Has appendices:`, "appendices" in object);
    } catch (parseError) {
      console.error(`[${requestId}] ❌ JSON parse error:`, parseError);
      throw new Error("Failed to parse model response as JSON");
    }

    console.log(`[${requestId}] ✅ Object generation completed in ${generationTime}ms`);

    if (usage) {
      console.log(`[${requestId}] 📊 Token usage:`);
      console.log(`[${requestId}]   - Input tokens: ${usage.inputTokens ?? "N/A"}`);
      console.log(`[${requestId}]   - Output tokens: ${usage.outputTokens ?? "N/A"}`);
      console.log(
        `[${requestId}]   - Total tokens: ${(usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)}`
      );
    }

    // Defensive structure validation - use optional chaining and fallbacks
    console.log(`[${requestId}] 🔍 Validating generated object structure...`);
    console.log(`[${requestId}]   Brand: ${object.brandIntake?.brand ?? "N/A"}`);
    console.log(`[${requestId}]   Research fields: ${Object.keys(object.research ?? {}).length}`);
    console.log(`[${requestId}]   Research field names: ${Object.keys(object.research ?? {}).join(", ")}`);
    console.log(`[${requestId}]   Research sources: ${object.research?.researchSources?.length ?? 0}`);
    console.log(`[${requestId}]   Outputs fields: ${Object.keys(object.outputs ?? {}).length}`);
    console.log(`[${requestId}]   Outputs field names: ${Object.keys(object.outputs ?? {}).join(", ")}`);
    console.log(`[${requestId}]   Slide 1 rows: ${object.outputs?.slide1InputTable?.length ?? 0}`);
    console.log(`[${requestId}]   Value case table exists: ${!!object.outputs?.slide4ValueCaseTable}`);
    console.log(`[${requestId}]   Value case rows: ${object.outputs?.slide4ValueCaseTable?.rows?.length ?? 0}`);
    console.log(`[${requestId}]   Sentiment snapshot exists: ${!!object.outputs?.loyaltySentimentSnapshot}`);
    console.log(`[${requestId}]   Sentiment rows: ${object.outputs?.loyaltySentimentSnapshot?.sentimentTable?.length ?? 0}`);
    console.log(`[${requestId}]   Mode applied: ${object.modelling?.modeApplied ?? "N/A"}`);
    console.log(`[${requestId}]   Base case GM: $${object.modelling?.baseCaseGMUpliftMillions ?? "N/A"}m`);
    console.log(`[${requestId}]   Assumptions: ${object.appendices?.assumptionsBlock?.length ?? 0}`);
    console.log(`[${requestId}]   Sources: ${object.appendices?.sources?.length ?? 0}`);
    
    // Debug: Log first 2000 chars of raw response for inspection
    console.log(`[${requestId}] 📝 Response preview (first 2000 chars):`, text.substring(0, 2000));
    console.log(`[${requestId}] ✅ Object structure check complete`);

    console.log(`[${requestId}] 📤 Preparing response...`);
    const response = Response.json({
      ok: true,
      data: object,
      usage: usage ?? null,
    });
    console.log(`[${requestId}] ✅ Response prepared and sent`);
    console.log(
      `[${requestId}] 🎉 ABM pack generation completed successfully in ${generationTime}ms`
    );

    return response;
  } catch (error) {
    const errorTime = new Date().toISOString();
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const errorStack =
      error instanceof Error ? error.stack : "No stack trace available";

    console.error(`[${requestId}] ❌ Error occurred at ${errorTime}`);
    console.error(`[${requestId}] Error message: ${errorMessage}`);
    console.error(`[${requestId}] Error stack: ${errorStack}`);
    console.error(`[${requestId}] Full error object:`, error);

    if (error instanceof ChatSDKError) {
      console.error(
        `[${requestId}] Error is ChatSDKError - returning error response`
      );
      return error.toResponse();
    }

    console.error(`[${requestId}] Unexpected error type - returning generic error`);
    return new ChatSDKError("offline:abm-pack").toResponse();
  }
}
