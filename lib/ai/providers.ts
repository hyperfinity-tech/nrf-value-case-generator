import { openai } from "@ai-sdk/openai";
import { customProvider } from "ai";
import type { LanguageModel } from "ai";
import { isTestEnvironment } from "../constants";

// Helper function to wrap OpenAI models to add supportedUrls property and upgrade to v2
const wrapOpenAIModel = (model: ReturnType<typeof openai>): LanguageModel => {
  return {
    ...model,
    specificationVersion: "v2",
    supportedUrls: [],
  } as unknown as LanguageModel;
};

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        "chat-model": wrapOpenAIModel(openai("gpt-4o")),
        "chat-model-reasoning": wrapOpenAIModel(openai("gpt-5.1")),
        "title-model": wrapOpenAIModel(openai("gpt-4o-mini")),
        "artifact-model": wrapOpenAIModel(openai("gpt-4o")),
      } as any,
    });

// Models that support web search (always enabled for these)
export const WEB_SEARCH_ENABLED_MODELS: string[] = [];
