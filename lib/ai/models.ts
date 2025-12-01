export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "chat-model",
    name: "GPT-4o",
    description: "OpenAI's most capable model for complex tasks",
  },
  {
    id: "chat-model-reasoning",
    name: "GPT-4o (Reasoning)",
    description: "GPT-4o optimized for analytical and reasoning tasks",
  },
];
