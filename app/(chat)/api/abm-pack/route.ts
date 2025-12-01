import { generateObject } from "ai";
import { auth, type UserType } from "@/app/(auth)/auth";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import { myProvider } from "@/lib/ai/providers";
import { getMessageCountByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import {
  abmPackOutputSchema,
  abmPackRequestSchema,
  type AbmPackRequest,
} from "./schema";

export const maxDuration = 1200; // ABM packs may take longer to generate

const ABM_SYSTEM_PROMPT = `
You are ABM Pack Builder, an expert in strategic account-based marketing for retail.
Produce a CFO-ready ABM pack using our Smart Scalable Outreach Framework.

You MUST:
- Follow the framework and rules precisely.
- Express ALL value outputs in $Gross Margin (GM), never revenue.
- Provide accurate, well-researched data with proper source citations.

## Smart Scalable Outreach Framework

### Value Case Rules
1. All financial impacts must be expressed in Gross Margin ($GM), not revenue
2. Apply the $2m GM threshold rule:
   - If base case GM uplift < $2m: use "median" mode with conservative estimates
   - If base case GM uplift >= $2m: use "stretch_up" mode with optimistic but credible estimates
3. For own-brand only companies: omit supplier-funded loyalty rows
4. For multi-brand/mixed: include supplier-funded opportunities

### Slide 4 Assumptions Template
For each value case row, the assumptionsMethodology field MUST follow this 6-step plain-English template:
1. Starting metric (e.g., "Starting from $X annual revenue")
2. Target segment (e.g., "Focusing on loyalty members who...")
3. Intervention (e.g., "By implementing personalized...")
4. Uplift percentage applied (e.g., "Applying a 3% uplift based on...")
5. Source/benchmark (e.g., "This aligns with industry benchmarks from...")
6. Final GM impact calculation (e.g., "Resulting in $Xm incremental GM")

### Loyalty Sentiment Rules
- Quote directly from real, verifiable sources
- Include month/year for all quotes
- Distinguish between loyalty member feedback and general customer feedback
- Cover 4 aspects: Rewards Value, Earning Experience, Redemption Experience, Overall Programme Perception

### Data Confidence Ratings
- H (High): Direct company disclosure or verified third-party data
- M (Medium): Industry benchmark or credible estimate
- L (Low): Inference or proxy-based estimate

### CFO Readiness Standards
- All numbers must be defensible
- Sources must be cited
- Assumptions must be explicit and reasonable
- Methodology must be transparent
`;

function buildUserPrompt(request: AbmPackRequest): string {
  return `
Brand intake for this ABM pack:

- Brand: ${request.brand}
- Website: ${request.website ?? "Not provided – infer from context if possible"}
- Business registry / SEC / EDGAR link: ${request.registryUrl ?? "Not provided – infer if listed"}
- Category: ${request.category ?? "Not provided – infer from catalogue and positioning"}
- Brand type (own-brand only / multi-brand / mixed): ${request.brandType ?? "Not provided – infer from catalogue if needed"}
- Contextual notes: ${request.notes ?? "None provided"}

Please now:
1) Research the brand using your knowledge to gather accurate information.
2) Build the full GM-based value case using the Smart Scalable Outreach Framework and the $2m threshold rule.
3) Populate every field of the output structure (no omissions).
4) Ensure:
   - All value-case numbers are in $Gross Margin (GM), not revenue.
   - The supplier-funded loyalty row is omitted if the brand is own-brand only.
   - All Slide 4 assumptions follow the mandatory six-step plain-English template.
   - All sources are properly cited with dates where available.
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
    console.log(`[${requestId}] ⏳ This may take 30-60 seconds...`);

    const startTime = Date.now();
    const { object, usage } = await generateObject({
      model,
      schema: abmPackOutputSchema,
      system: ABM_SYSTEM_PROMPT,
      prompt: userPrompt,
    });
    const generationTime = Date.now() - startTime;

    console.log(`[${requestId}] ✅ Object generation completed in ${generationTime}ms`);

    if (usage) {
      console.log(`[${requestId}] 📊 Token usage:`);
      console.log(`[${requestId}]   - Input tokens: ${usage.inputTokens ?? "N/A"}`);
      console.log(`[${requestId}]   - Output tokens: ${usage.outputTokens ?? "N/A"}`);
      console.log(
        `[${requestId}]   - Total tokens: ${(usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)}`
      );
    }

    console.log(`[${requestId}] 🔍 Validating generated object structure...`);
    console.log(
      `[${requestId}] Brand Intake Brand: ${object.brandIntake.brand}`
    );
    console.log(
      `[${requestId}] Research fields populated: ${Object.keys(object.research).length}`
    );
    console.log(
      `[${requestId}] Value case rows: ${object.outputs.slide4ValueCaseTable.rows.length}`
    );
    console.log(`[${requestId}] ✅ Object structure validation passed`);

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

