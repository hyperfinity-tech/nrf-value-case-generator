import { openai } from "@ai-sdk/openai";
import { isTestEnvironment } from "../constants";

// Model mapping for direct OpenAI usage
const modelMap = {
  "chat-model": "gpt-5.1",
  "chat-model-reasoning": "gpt-5.1",
  "title-model": "gpt-4o-mini",
  "artifact-model": "gpt-5.1",
} as const;

type ModelId = keyof typeof modelMap;

// Get OpenAI model by our internal ID
export function getOpenAIModel(modelId: ModelId) {
  return openai(modelMap[modelId]);
}

// Legacy provider interface for backwards compatibility
export const myProvider = {
  languageModel: (modelId: string) => {
    if (isTestEnvironment) {
      const { chatModel, reasoningModel, titleModel, artifactModel } =
        require("./models.mock");
      const mockModels: Record<string, unknown> = {
        "chat-model": chatModel,
        "chat-model-reasoning": reasoningModel,
        "title-model": titleModel,
        "artifact-model": artifactModel,
      };
      return mockModels[modelId];
    }
    return openai(modelMap[modelId as ModelId] ?? "gpt-4o");
  },
};

// Models that support web search (always enabled for these)
export const WEB_SEARCH_ENABLED_MODELS: string[] = [];
