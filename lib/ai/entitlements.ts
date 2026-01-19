import type { ChatModel } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<string, Entitlements> = {
  /*
   * For authenticated users (Clerk handles all auth)
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },
};
