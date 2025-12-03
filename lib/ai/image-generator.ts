import { generateText } from "ai";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { geminiProvider } from "./providers";

/**
 * Reference image paths relative to public folder
 */
const REFERENCE_IMAGES = {
  logo: "images/hyperfinity_logo_dark.png",
  template: "images/hyperfinity_template.png",
} as const;

/**
 * Generate an infographic image using Gemini 3 Pro Image model.
 * Uses reference images (logo and template) as multimodal input.
 *
 * @param prompt - The detailed image generation prompt
 * @returns Base64 data URL of the generated image
 */
export async function generateInfographicImage(
  prompt: string
): Promise<string> {
  // Read reference images and convert to base64 data URLs
  const [logoBuffer, templateBuffer] = await Promise.all([
    readFile(path.join(process.cwd(), "public", REFERENCE_IMAGES.logo)),
    readFile(path.join(process.cwd(), "public", REFERENCE_IMAGES.template)),
  ]);

  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  const templateDataUrl = `data:image/png;base64,${templateBuffer.toString("base64")}`;

  // Use generateText with IMAGE response modality
  // Model: gemini-3-pro-image-preview (same as gemini_tester.py line 83)
  const response = await generateText({
    model: geminiProvider.imageModel(),
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
          aspectRatio: "16:9", // Same as gemini_tester.py line 85
        },
      } satisfies GoogleGenerativeAIProviderOptions,
    },
  });

  // Extract the image from the response
  // The AI SDK returns image data in the response files or experimental outputs
  // We need to check multiple possible locations based on SDK version
  
  // Check for files in the response (newer SDK versions)
  if (response.files && response.files.length > 0) {
    const imageFile = response.files.find(f => 
      f.mimeType?.startsWith("image/")
    );
    if (imageFile?.base64) {
      return `data:${imageFile.mimeType};base64,${imageFile.base64}`;
    }
  }

  // Check experimental_output for base64 image data
  if (response.experimental_output) {
    // If it's already a data URL, return it
    if (typeof response.experimental_output === "string" && 
        response.experimental_output.startsWith("data:image/")) {
      return response.experimental_output;
    }
  }

  // Fallback: Check if the text response contains base64 image data
  // Some models return the image inline in the text
  if (response.text) {
    // Check if the response text is base64 encoded image data
    const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
    const cleanText = response.text.trim();
    if (base64Pattern.test(cleanText) && cleanText.length > 1000) {
      return `data:image/png;base64,${cleanText}`;
    }
  }

  throw new Error(
    "No image returned from Gemini. Response structure may have changed."
  );
}

