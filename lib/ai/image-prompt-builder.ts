import { generateText } from "ai";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { geminiProvider } from "./providers";
import { META_IMAGE_PROMPT } from "@/lib/prompts/meta-image-prompt";

/**
 * Build a detailed image generation prompt from an ABM pack JSON spec.
 * Uses Gemini 3 Pro with deep thinking (thinkingLevel: 'high') to analyze
 * the brand data and create a tailored infographic prompt.
 *
 * @param spec - The ABM pack JSON data
 * @returns A detailed text-to-image prompt string
 */
export async function buildImagePrompt(
  spec: Record<string, unknown>
): Promise<string> {
  const { text } = await generateText({
    model: geminiProvider.promptModel(),
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

