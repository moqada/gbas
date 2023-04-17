import { MentionCommand } from "./types.ts";

export function createMentionCommand(
  definition: Omit<MentionCommand, "type">,
): MentionCommand {
  return {
    type: "mention",
    ...definition,
  };
}
