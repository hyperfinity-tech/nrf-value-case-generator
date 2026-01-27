import { openai } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import { isTestEnvironment } from "../constants";

// Google Gemini provider for image generation
// Uses GOOGLE_GENERATIVE_AI_API_KEY environment variable by default
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Model mapping for direct OpenAI usage
const modelMap = {
  "chat-model": "gpt-5.2",
  "chat-model-reasoning": "gpt-5.2",
  "title-model": "gpt-4o-mini",
  "artifact-model": "gpt-5.2",
  "deep-research-model": "o4-mini-deep-research",
} as const;

type ModelId = keyof typeof modelMap;

const resolveModelId = (modelId: string): ModelId => {
  if ((modelId as ModelId) in modelMap) {
    return modelId as ModelId;
  }
  return "chat-model";
};

const createLanguageModel = (modelId: string): LanguageModel => {
  
  const resolvedId = resolveModelId(modelId);
  return openai(modelMap[resolvedId]) as unknown as LanguageModel;
};

// Provider interface for model resolution
export const myProvider = {
  languageModel: (modelId: string): LanguageModel => createLanguageModel(modelId),
};

// Get the OpenAI model ID string for a given internal model ID
// Used by TokenLens for usage tracking
export function getModelIdString(internalModelId: string): string {
  const resolvedId = resolveModelId(internalModelId);
  return modelMap[resolvedId];
}

// OpenAI's built-in tools
export const webSearchTool = openai.tools.webSearch({});
export const codeInterpreterTool = openai.tools.codeInterpreter({});

// Google Gemini provider for infographic generation
// Models match gemini_tester.py exactly
export const geminiProvider = {
  // For building image prompts from JSON specs (with deep thinking)
  // Model: gemini-3-pro-preview (same as gemini_tester.py line 46)
  promptModel: () => google("gemini-3-pro-preview"),
  // For generating images with multimodal input and reference images
  // Model: gemini-3-pro-image-preview (same as gemini_tester.py line 83)
  imageModel: () => google("gemini-3-pro-image-preview"),
};
