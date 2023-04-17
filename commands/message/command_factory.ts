import { MessageCommand } from "./types.ts";

export function createMessageCommand(
  definition: Omit<MessageCommand, "type">,
): MessageCommand {
  return {
    type: "message",
    ...definition,
  };
}
