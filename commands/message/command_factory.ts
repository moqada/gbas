import { MessageCommand } from "./types.ts";

export const createMessageCommand = (
  definition: Omit<MessageCommand, "type">,
): MessageCommand => ({
  type: "message",
  ...definition,
});
