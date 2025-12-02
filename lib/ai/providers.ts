import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { isTestEnvironment } from "../constants";

// Model mapping for direct OpenAI usage
const modelMap = {
  "chat-model": "gpt-5.1",
  "chat-model-reasoning": "gpt-5.1",
  "title-model": "gpt-4o-mini",
  "artifact-model": "gpt-5.1",
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
