# ABM Pack Route Implementation Plan

## Overview

Integrate an ABM (Account-Based Marketing) Pack generation API into the existing Next.js chatbot application. This route will generate structured CFO-ready marketing packs using AI with structured outputs.

## Key Findings

### Current Setup
- **AI Provider**: Uses `@ai-sdk/gateway` with xAI Grok models (not OpenAI)
- **Auth**: next-auth via exported `auth()` function
- **Patterns**: Uses `generateText` from Vercel AI SDK with `myProvider.languageModel()`
- **Models defined**: `chat-model`, `chat-model-reasoning`, `title-model`, `artifact-model`

### Issues in Original Code
| Issue | Resolution |
|-------|------------|
| `try:` syntax (Python) | Convert to `try {` |
| Uses `openai` SDK directly | Adapt to Vercel AI SDK `generateObject` |
| `client.responses.create()` invalid method | Use `generateObject()` from `ai` package |
| `gpt-5.1` non-existent model | Use configurable model via existing provider |
| Raw JSON schema | Convert to Zod schema (idiomatic for AI SDK) |
| `.js` file | Convert to TypeScript |

---

## Implementation Steps

### Step 1: Create Zod Schema File

**File**: `app/(chat)/api/abm-pack/schema.ts`

Convert the large JSON schema to Zod for:
- Type safety
- Better integration with AI SDK's `generateObject`
- Runtime validation of request body

Schema sections:
- `brandIntakeSchema` - Input validation
- `abmPackOutputSchema` - Full structured output including:
  - `brandIntake`
  - `research`
  - `modelling`
  - `outputs` (executive summary, CFO panel, slides, sentiment analysis, value case)
  - `appendices`

### Step 2: Create Route Handler

**File**: `app/(chat)/api/abm-pack/route.ts`

```typescript
// Pseudocode structure
import { generateObject } from "ai";
import { auth } from "@/app/(auth)/auth";
import { myProvider } from "@/lib/ai/providers";
import { abmPackRequestSchema, abmPackOutputSchema } from "./schema";

export async function POST(request: Request) {
  // 1. Auth check (same pattern as chat route)
  const session = await auth();
  if (!session?.user) return unauthorized response;

  // 2. Parse & validate request body with Zod
  const body = abmPackRequestSchema.parse(await request.json());

  // 3. Generate structured output
  const { object } = await generateObject({
    model: myProvider.languageModel(body.selectedModel ?? "chat-model"),
    schema: abmPackOutputSchema,
    system: ABM_SYSTEM_PROMPT,
    prompt: buildUserPrompt(body),
  });

  // 4. Return structured response
  return Response.json({ ok: true, data: object });
}
```

### Step 3: Add Model Selection Support

**Option A (Recommended)**: Accept `selectedModel` in request body, default to `"chat-model"`

**Option B**: Add a dedicated `"abm-model"` to `providers.ts` if you want a specific model for this use case

### Step 4: System Prompt

Move the system prompt to `lib/ai/prompts.ts` for consistency:

```typescript
export const abmPackSystemPrompt = `
You are ABM Pack Builder, an expert in strategic account-based marketing for retail.
Produce a CFO-ready ABM pack using our Smart Scalable Outreach Framework.
...
`;
```

---

## File Structure After Implementation

```
app/(chat)/api/abm-pack/
├── route.ts          # POST handler
└── schema.ts         # Zod schemas for request/response
```

---

## Request/Response Contract

### Request Body
```typescript
{
  brand: string;                    // Required
  website?: string;
  registryUrl?: string;
  category?: string;
  brandType?: "own_brand_only" | "multi_brand" | "mixed";
  notes?: string;
  selectedModel?: "chat-model" | "chat-model-reasoning";  // Optional, defaults to chat-model
}
```

### Response Body
```typescript
{
  ok: true;
  data: {
    brandIntake: { ... };
    research: { ... };
    modelling: { ... };
    outputs: {
      executiveOneLiner: string;
      cfoReadinessPanel: { ... };
      executiveSummary: string;
      slide1InputTable: Array<{ metric, valueOrEstimate, sourceOrLogic }>;
      slide1Notes: { ... };
      loyaltySentimentSnapshot: { ... };
      slide4ValueCaseTable: { ... };
    };
    appendices: { ... };
  };
  usage?: { ... };  // Token usage if available
}
```

---

## Potential Issues & Mitigations

### 1. Model Capability
**Risk**: Grok models may not support structured outputs as well as GPT-4
**Mitigation**: The AI SDK handles this via prompting. If outputs are unreliable, consider:
- Adding output validation
- Implementing retry logic
- Using `chat-model-reasoning` for better structured output adherence

### 2. Schema Complexity
**Risk**: The schema is large (~270 lines of JSON schema). Complex nested structures may cause generation issues.
**Mitigation**: 
- Test with simpler schemas first
- Consider breaking into multiple smaller generation calls if needed

### 3. Token Limits
**Risk**: The comprehensive output may exceed model context limits
**Mitigation**: 
- Monitor token usage
- Consider streaming for large outputs
- The AI SDK's `generateObject` handles this reasonably well

---

## Questions for Confirmation

1. **Model preference**: Should this default to `chat-model` or `chat-model-reasoning`? The reasoning model might produce more reliable structured outputs.

2. **Error handling**: Should we match the existing `ChatSDKError` pattern, or is a simpler JSON error response acceptable?

3. **Rate limiting**: Should this endpoint have its own rate limits separate from chat?

4. **Logging/Telemetry**: Should we add OpenTelemetry instrumentation like the chat route?

---

## Timeline Estimate

| Task | Effort |
|------|--------|
| Create Zod schema | ~30 min |
| Create route handler | ~20 min |
| Add system prompt | ~5 min |
| Testing & refinement | ~30 min |
| **Total** | **~1.5 hours** |

---

## Next Steps

Once you confirm this plan:
1. I'll create the schema file with full Zod types
2. I'll create the route handler
3. I'll add the system prompt to the prompts file
4. We can test and iterate

