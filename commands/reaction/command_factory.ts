import { ReactionCommand } from "./types.ts";

export function createReactionCommand(
  definition: Omit<ReactionCommand, "type">,
): ReactionCommand {
  return {
    type: "reaction",
    ...definition,
  };
}
