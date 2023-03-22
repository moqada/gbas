import { MentionCommand } from "./types.ts";

export const createMentionCommand = (
  definition: Omit<MentionCommand, "type">,
): MentionCommand => ({
  type: "mention",
  ...definition,
});
