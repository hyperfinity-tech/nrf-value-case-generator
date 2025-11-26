import { tool } from "ai";
import { z } from "zod";

export const webSearch = tool({
  description:
    "Search the web for current information. Use this when you need up-to-date information, recent news, or facts that may have changed since your training.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("The search query to look up on the web"),
  }),
  execute: async (input) => {
    // The actual web search is handled by the model's built-in web_search capability
    // This tool definition allows the model to indicate when it wants to search
    // For GPT-5.1 with web search enabled, this integrates with OpenAI's web search
    return {
      query: input.query,
      message:
        "Web search capability is enabled. The model will use its built-in web search.",
    };
  },
});

