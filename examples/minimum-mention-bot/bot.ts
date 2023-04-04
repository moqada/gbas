import { createMentionCommand, MentionCommandDispatcher } from "gbas/mod.ts";

export const mentionCommandDispatcher = new MentionCommandDispatcher([
  createMentionCommand({
    name: "ping",
    examples: ["ping - ping pong"],
    pattern: /^ping$/i,
    execute: (c) => c.res.message("PONG"),
  }),
]);
