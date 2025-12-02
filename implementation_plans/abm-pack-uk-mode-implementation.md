# ABM Pack UK Mode Implementation Plan

## Overview
Add a UK mode toggle to the ABM Pack Builder that switches between US and UK market configurations, including currency ($/£), registry sources (SEC/Companies House), and market-specific benchmarks.

## Key Differences Between US and UK Modes

| Aspect | US Mode | UK Mode |
|--------|---------|---------|
| Currency | $ (USD) | £ (GBP) |
| Threshold | $2,000,000 | £2,000,000 |
| Registry | SEC / EDGAR | Companies House |
| Filing Types | 10-K, 20-F, 10-Q | Annual Reports, Companies House filings |
| Benchmark Market | US or closest available | UK or closest available |
| Language | UK English (already used) | UK English |

## Files to Modify

### 1. Schema Update: `app/(chat)/api/abm-pack/schema.ts`
- Add `region` enum: `z.enum(["US", "UK"])`
- Add `region` field to `abmPackRequestSchema`
- Default to `"US"` for backwards compatibility

### 2. Route Update: `app/(chat)/api/abm-pack/route.ts`
- Create `ABM_SYSTEM_PROMPT_UK` constant with UK-specific content
- Create `buildUserPromptUK()` function
- Update request handling to select appropriate prompt based on region
- Log region in debug output

### 3. Form Update: `components/abm-pack-generator.tsx`
- Add `region: "US" | "UK"` to `FormState` interface
- Add region toggle UI (radio buttons or select)
- Update form submission to include region
- Update registry label dynamically based on region ("SEC / Registry Link" vs "Companies House / Registry Link")
- Reset form to include region

## Detailed Changes

### Schema (`schema.ts`)

```typescript
// Add region enum
export const regionEnum = z.enum(["US", "UK"]);

// Update request schema
export const abmPackRequestSchema = z.object({
  brand: z.string().min(1, "Brand name is required"),
  website: z.string().url().optional().nullable(),
  registryUrl: z.string().url().optional().nullable(),
  category: z.string().optional().nullable(),
  brandType: brandTypeInternalEnum.optional().nullable(),
  notes: z.string().optional().nullable(),
  selectedModel: z.enum(["chat-model", "chat-model-reasoning"]).default("chat-model"),
  region: regionEnum.default("US"), // NEW
});
```

### UK System Prompt (`route.ts`)

Key changes from US prompt:
1. Replace `$` with `£` throughout
2. Replace `$2,000,000` threshold with `£2,000,000`
3. Replace SEC/EDGAR references with Companies House
4. Replace "US or closest available market" with "UK or closest available market"
5. Replace "10-K / 20-F / 10-Q" with "Annual Reports and Companies House filings"

### UK User Prompt Builder (`route.ts`)

```typescript
function buildUserPromptUK(request: AbmPackRequest): string {
  return `
Brand intake for this ABM pack:

- Brand: ${request.brand}
- Website: ${request.website ?? "Not provided – search for official website"}
- Companies House / Registry link: ${request.registryUrl ?? "Not provided – search for Companies House filings if UK registered"}
- Category: ${request.category ?? "Not provided – infer from catalogue and positioning"}
- Brand type (own-brand only / multi-brand / mixed): ${request.brandType ?? "Not provided – infer from catalogue if needed"}
- Contextual notes: ${request.notes ?? "None provided"}

===========================================================
MANDATORY RESEARCH TASKS (DO ALL BEFORE GENERATING OUTPUT)
===========================================================

1) FINANCIAL RESEARCH:
   - Search for Companies House filings and annual reports for revenue and GM data
   - Find analyst reports or trade press for private companies
   - Identify blended gross margin % from filings or use category proxy

2) LOYALTY PROGRAMME RESEARCH:
   - Find loyalty programme name, launch date, benefits
   - Estimate penetration rate and active member count
   - Search for loyalty-related announcements or initiatives

3) BENCHMARK RESEARCH:
   - Gather AOV and purchase frequency benchmarks for this category (UK market)
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

Apply the £2m threshold rule CORRECTLY:
1. First calculate BASE CASE using MIDPOINT values for all levers
2. If BASE CASE < £2m GM uplift: switch to STRETCH-UP values for ALL levers
3. If BASE CASE >= £2m GM uplift: keep MIDPOINT values for ALL levers

For EVERY value case row, use the mandatory 6-step CFO-ready template:
1. Uplift point applied: "We have applied a X% uplift, which represents the [median/stretch-up] of the credible range."
2. Range & source: "This sits within the credible category range of A% to B%, based on [source]."
3. Why selected: "We selected this point because the total value case [was above/below] the 2 million pound threshold."
4. Simple maths: "In practice, this means applying X% to [segment], converting to GM using Y% blended margin."
5. Result: "This results in an estimated gross margin uplift of £Z.Xm."
6. Reassurance: "All assumptions sit comfortably within evidence-based bounds."

===========================================================
OWN-BRAND RULE
===========================================================
If brand type is "own_brand_only", OMIT the supplier-funded loyalty row (B) entirely from the value case table.

===========================================================
STYLE REQUIREMENTS
===========================================================
- Use UK English spelling throughout (programme, personalisation, colour, etc.)
- All monetary figures in GBP (£) with appropriate precision
- Cite sources inline with dates where available

Generate the complete ABM pack now with all fields populated.
`;
}
```

### Form Component (`abm-pack-generator.tsx`)

Add region toggle after brand name field:

```tsx
<div>
  <Label htmlFor="region">Market Region</Label>
  <Select
    value={formData.region}
    onValueChange={(value) => handleSelectChange("region", value)}
  >
    <SelectTrigger id="region">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="US">🇺🇸 United States (USD)</SelectItem>
      <SelectItem value="UK">🇬🇧 United Kingdom (GBP)</SelectItem>
    </SelectContent>
  </Select>
</div>
```

Update registry URL label dynamically:

```tsx
<div>
  <Label htmlFor="registryUrl">
    {formData.region === "UK" ? "Companies House / Registry Link" : "SEC / Registry Link"}
  </Label>
  <Input
    id="registryUrl"
    name="registryUrl"
    type="url"
    value={formData.registryUrl}
    onChange={handleInputChange}
    placeholder={formData.region === "UK" 
      ? "https://find-and-update.company-information.service.gov.uk/..." 
      : "https://sec.report/..."}
  />
</div>
```

## Testing Checklist

- [ ] US mode generates packs with USD currency
- [ ] UK mode generates packs with GBP currency
- [ ] Toggle switches correctly between modes
- [ ] Form labels update based on region
- [ ] Request schema validates region field
- [ ] Default region is US for backwards compatibility
- [ ] Mock response still works (update if needed for UK)

## Risk Assessment

**Low Risk**: This is an additive change that doesn't modify existing US functionality. The default region is US, so existing behaviour is preserved.

**Medium Consideration**: The output schema (`abmPackOutputSchema`) describes values in USD. For a more complete implementation, we might want to add a `currency` field to the output, but this is optional as the prompt instructs the model to use the appropriate currency.

## Implementation Order

1. Update schema with region enum and field
2. Add UK system prompt to route.ts
3. Add UK user prompt builder to route.ts
4. Update route handler to select prompts based on region
5. Update form component with region toggle and dynamic labels
6. Test both modes end-to-end

