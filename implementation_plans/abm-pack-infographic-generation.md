# ABM Pack Infographic Generation - Implementation Plan

## Overview

Add the ability to generate a "Strategic Value Infographic" image when creating an ABM pack. The image is generated using Google's Gemini models based on the ABM pack JSON data.

## User Flow

1. User fills in ABM pack form
2. User optionally ticks "Generate Infographic" checkbox
3. User submits form
4. **Stage 1**: JSON pack is generated (existing flow)
5. **Stage 2**: If checkbox was ticked, image prompt is built from JSON, then image is generated
6. Results displayed together once both are ready
7. If image generation fails, show pack results silently (no error message about image)

## Technical Architecture

### 1. Backend Components

#### 1.1 Gemini Provider Setup (`lib/ai/providers.ts`)

Add Google Gemini model configuration alongside existing OpenAI models using the official AI SDK:

```typescript
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Google Gemini provider for image generation
// Uses GOOGLE_GENERATIVE_AI_API_KEY environment variable by default
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const geminiProvider = {
  // For building image prompts from JSON specs (with deep thinking)
  // Model: gemini-3-pro-preview (same as gemini_tester.py line 46)
  promptModel: () => google("gemini-3-pro-preview"),
  // For generating images with multimodal input and reference images
  // Model: gemini-3-pro-image-preview (same as gemini_tester.py line 83)
  imageModel: () => google("gemini-3-pro-image-preview"),
};
```

**Reference**: [AI SDK Google Generative AI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai#gemini-3-models)

**Note**: These are the exact model IDs used in `gemini_tester.py`.

#### 1.2 Meta Prompt File (`lib/prompts/meta-image-prompt.ts`)

Move the meta prompt from `meta_image_prompt.md` to a TypeScript file:

```typescript
// lib/prompts/meta-image-prompt.ts
export const META_IMAGE_PROMPT = `
# System Prompt: The "Meta" Infographic Designer
...
`;
```

#### 1.3 Image Generation API Route (`app/(chat)/api/abm-pack-image/route.ts`)

New API route that:
1. Receives ABM pack JSON data
2. Builds an image prompt using Gemini 3 Pro with deep thinking
3. Generates the image using Gemini with `responseModalities: ['IMAGE']`
4. Returns base64 image data

```typescript
// POST /api/abm-pack-image
// Request: { packData: ABMPackOutput, debugMode: boolean }
// Response: { ok: true, imageBase64: string } or { ok: false, error: string }
```

#### 1.4 Reference Images

Move to `public/images/`:
- `public/images/hyperfinity_logo_dark.png`
- `public/images/hyperfinity_template.png`

These can be fetched via URL in the serverless function and converted to base64 for multimodal input.

### 2. Frontend Components

#### 2.1 Form State Changes (`components/abm-pack-generator.tsx`)

Add new state:
```typescript
interface FormState {
  brand: string;
  region: "US" | "UK";
  useMockResponse: boolean;
  generateInfographic: boolean;  // NEW
}
```

Add new result state:
```typescript
const [infographicImage, setInfographicImage] = useState<string | null>(null);
```

#### 2.2 Form UI Changes

Add checkbox below the mock response checkbox:
```tsx
<div className="flex items-center space-x-2">
  <input
    type="checkbox"
    id="generateInfographic"
    checked={formData.generateInfographic}
    onChange={(e) => setFormData(prev => ({ 
      ...prev, 
      generateInfographic: e.target.checked 
    }))}
  />
  <Label htmlFor="generateInfographic">
    Generate Strategic Infographic (adds ~30-60s)
  </Label>
</div>
```

#### 2.3 Submit Flow Changes

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  try {
    // Debug mode - use mock data
    if (formData.useMockResponse) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setResult(MOCK_RESPONSE);
      
      if (formData.generateInfographic) {
        // Use static debug image from public folder
        setInfographicImage("/images/debug/gemini_image_0006_final.png");
      }
      return;
    }
    
    // Stage 1: Generate JSON pack
    const packResponse = await fetch("/api/abm-pack", {...});
    const packData = await packResponse.json();
    
    // Stage 2: Generate infographic if requested
    let imageData: string | null = null;
    if (formData.generateInfographic) {
      try {
        const imageResponse = await fetch("/api/abm-pack-image", {
          method: "POST",
          body: JSON.stringify({ packData: packData.data }),
        });
        
        if (imageResponse.ok) {
          const imgResult = await imageResponse.json();
          imageData = imgResult.imageBase64;
        }
        // If fails, silently continue without image
      } catch {
        // Silently ignore image generation errors
      }
    }
    
    // Show results together
    setResult(packData.data);
    setInfographicImage(imageData);
    
  } finally {
    setIsLoading(false);
  }
};
```

#### 2.4 Results Display Changes

Add prominent image display at the top of results:

```tsx
{result && (
  <div className="space-y-4">
    {/* Infographic Image - Prominent Display */}
    {infographicImage && (
      <Card>
        <CardHeader>
          <CardTitle>Strategic Value Infographic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <img 
              src={infographicImage.startsWith("data:") 
                ? infographicImage 
                : infographicImage
              }
              alt={`${getBrandName()} Strategic Value Case Infographic`}
              className="w-full h-full object-contain"
            />
          </div>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => downloadImage(infographicImage, getBrandName())}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Infographic
          </Button>
        </CardContent>
      </Card>
    )}
    
    {/* Existing results card... */}
  </div>
)}
```

### 3. Image Generation Logic (TypeScript conversion using AI SDK)

#### 3.1 Build Image Prompt Function

Uses Gemini 3 Pro with deep thinking (`thinkingLevel: 'high'`) to generate a detailed image prompt from the ABM pack JSON:

```typescript
// lib/ai/image-prompt-builder.ts
import { generateText } from "ai";
import { google, type GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { META_IMAGE_PROMPT } from "@/lib/prompts/meta-image-prompt";

export async function buildImagePrompt(spec: Record<string, unknown>): Promise<string> {
  const { text } = await generateText({
    model: google("gemini-3-pro-preview"),
    system: META_IMAGE_PROMPT,
    prompt: `JSON SPEC:\n${JSON.stringify(spec, null, 2)}`,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingLevel: "high",
        },
      } satisfies GoogleGenerativeAIProviderOptions,
    },
  });
  
  return text.trim();
}
```

#### 3.2 Generate Image Function

Uses `gemini-3-pro-image-preview` (same as `gemini_tester.py` line 83) with `responseModalities: ['IMAGE']` and reference images as multimodal input:

```typescript
// lib/ai/image-generator.ts
import { generateText } from "ai";
import { google, type GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { readFile } from "fs/promises";
import path from "path";

export async function generateInfographicImage(
  prompt: string,
  logoPath: string,
  templatePath: string
): Promise<string> {
  // Read reference images and convert to base64 data URLs
  const [logoBuffer, templateBuffer] = await Promise.all([
    readFile(path.join(process.cwd(), "public", logoPath)),
    readFile(path.join(process.cwd(), "public", templatePath)),
  ]);
  
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  const templateDataUrl = `data:image/png;base64,${templateBuffer.toString("base64")}`;

  // Use generateText with IMAGE response modality
  // Model: gemini-3-pro-image-preview (same as gemini_tester.py line 83)
  const { experimental_output } = await generateText({
    model: google("gemini-3-pro-image-preview"),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image", image: logoDataUrl },
          { type: "image", image: templateDataUrl },
        ],
      },
    ],
    providerOptions: {
      google: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: "16:9" // Same as gemini_tester.py line 85
        },
      } satisfies GoogleGenerativeAIProviderOptions,
    },
  });

  // Extract base64 image from response
  // The response format depends on the AI SDK version
  // May need to extract from experimental_output or response parts
  if (!experimental_output) {
    throw new Error("No image returned from Gemini");
  }
  
  // Return as data URL for direct display
  return experimental_output; // Format: data:image/png;base64,...
}
```

**Notes**: 
- The exact response format for image outputs may vary. We may need to handle the response structure based on testing.
- The Python script uses `resolution = "2K"` (line 84). The AI SDK `imageConfig` only documents `aspectRatio`. Resolution/image size may need to be set via additional provider options if supported, or may default to a sensible value.

### 4. Dependencies

Add the AI SDK Google provider:
```bash
pnpm add @ai-sdk/google
```

This provides:
- `google()` - Language model factory for Gemini models
- `google.image()` - Image model factory for Imagen models (alternative option)
- Type exports like `GoogleGenerativeAIProviderOptions`

### 5. Environment Variables

Add to Vercel:
```
GOOGLE_GENERATIVE_AI_API_KEY=<your-key>
```

The AI SDK automatically reads from `GOOGLE_GENERATIVE_AI_API_KEY` environment variable.

### 6. File Changes Summary

| File | Action |
|------|--------|
| `package.json` | Modify - add `@ai-sdk/google` dependency |
| `lib/ai/providers.ts` | Modify - add Gemini provider exports |
| `lib/prompts/meta-image-prompt.ts` | Create - meta prompt content |
| `lib/ai/image-prompt-builder.ts` | Create - builds prompt from JSON using `gemini-3-pro-preview` |
| `lib/ai/image-generator.ts` | Create - generates image via `gemini-3-pro-image-preview` |
| `app/(chat)/api/abm-pack-image/route.ts` | Create - API endpoint |
| `components/abm-pack-generator.tsx` | Modify - add checkbox, image display |
| `public/images/hyperfinity_logo_dark.png` | Move from root |
| `public/images/hyperfinity_template.png` | Move from root |
| `public/images/debug/gemini_image_0006_final.png` | Move from `outputs/` |
| `meta_image_prompt.md` | Delete after migration |

### 7. Debug Mode Behaviour

When `useMockResponse` is checked:
- JSON pack: Use existing `MOCK_RESPONSE` constant
- Infographic: Serve static image from `/images/debug/gemini_image_0006_final.png`

The debug image is moved from `outputs/` to `public/images/debug/gemini_image_0006_final.png` so it can be served as a static asset.

### 8. Error Handling Strategy

- If JSON pack generation fails: Show error toast, no results
- If image generation fails: Show JSON pack results normally, no mention of image
- The `generateInfographic` checkbox state is not persisted in results

### 9. Loading State UX

Single loading spinner with updated messaging:
- "Generating ABM pack..." (Stage 1)
- "Generating infographic..." (Stage 2, if checkbox ticked)

Or simply: "Generating ABM pack (this may take 60-120 seconds)..." when infographic is requested.

## Open Questions / Risks

1. **Image Output Format**: The AI SDK documentation shows `responseModalities: ['IMAGE']` is supported, but the exact response structure for extracting the generated image needs testing. May need to inspect `experimental_output` or response parts.

## Implementation Order

1. Add `@ai-sdk/google` dependency via `pnpm add @ai-sdk/google`
2. Move reference images to `public/images/`
3. Move debug image to `public/images/debug/`
4. Create `lib/prompts/meta-image-prompt.ts` (content from `meta_image_prompt.md`)
5. Update `lib/ai/providers.ts` with Gemini provider exports
6. Create `lib/ai/image-prompt-builder.ts`
7. Create `lib/ai/image-generator.ts`
8. Create `app/(chat)/api/abm-pack-image/route.ts`
9. Update `components/abm-pack-generator.tsx` with checkbox and image display
10. Test with debug mode first (uses static image)
11. Test with live Gemini calls
12. Clean up: delete `meta_image_prompt.md` from root

