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
    name: "GPT-5.2 Thinking",
    description: "GPT-5.2 with adaptive reasoning for deeper analytical and reasoning tasks",
  },
];
