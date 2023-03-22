import { ReactionCommand } from "./types.ts";

export const createReactionCommand = (
  definition: Omit<ReactionCommand, "type">,
): ReactionCommand => ({
  type: "reaction",
  ...definition,
});
