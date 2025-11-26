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

export const maxDuration = 120; // ABM packs may take longer to generate

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
  let requestBody: AbmPackRequest;

  try {
    const json = await request.json();
    requestBody = abmPackRequestSchema.parse(json);
  } catch {
    return new ChatSDKError("bad_request:abm-pack").toResponse();
  }

  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError("unauthorized:abm-pack").toResponse();
    }

    const userType: UserType = session.user.type;

    // Rate limiting (shares limits with chat)
    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError("rate_limit:abm-pack").toResponse();
    }

    const { object, usage } = await generateObject({
      model: myProvider.languageModel(requestBody.selectedModel),
      schema: abmPackOutputSchema,
      system: ABM_SYSTEM_PROMPT,
      prompt: buildUserPrompt(requestBody),
    });

    return Response.json({
      ok: true,
      data: object,
      usage: usage ?? null,
    });
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error("ABM pack generation error:", error);
    return new ChatSDKError("offline:abm-pack").toResponse();
  }
}

