import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { isTestEnvironment } from "../constants";

// Model mapping for direct OpenAI usage
const modelMap = {
  "chat-model": "gpt-5.1",
  "chat-model-reasoning": "gpt-5.1",
  "title-model": "gpt-4o-mini",
  "artifact-model": "gpt-5.1",
} as const;

type ModelId = keyof typeof modelMap;

const resolveModelId = (modelId: string): ModelId => {
  if ((modelId as ModelId) in modelMap) {
    return modelId as ModelId;
  }
  return "chat-model";
};

const createLanguageModel = (modelId: string): LanguageModel => {
  if (isTestEnvironment) {
    const { chatModel, reasoningModel, titleModel, artifactModel } =
      require("./models.mock");
    const mockModels: Record<string, LanguageModel> = {
      "chat-model": chatModel,
      "chat-model-reasoning": reasoningModel,
      "title-model": titleModel,
      "artifact-model": artifactModel,
    } as Record<string, LanguageModel>;

    return mockModels[modelId] ?? chatModel;
  }

  const resolvedId = resolveModelId(modelId);
  return openai(modelMap[resolvedId]) as unknown as LanguageModel;
};

// Legacy provider interface for backwards compatibility
export const myProvider = {
  languageModel: (modelId: string): LanguageModel => createLanguageModel(modelId),
};

// Get the OpenAI model ID string for a given internal model ID
// Used by TokenLens for usage tracking
export function getModelIdString(internalModelId: string): string {
  const resolvedId = resolveModelId(internalModelId);
  return modelMap[resolvedId];
}

// OpenAI's built-in web search tool
export const webSearchTool = openai.tools.webSearch({});
