import { createReactionCommand } from "gbas/mod.ts";

export const owl = createReactionCommand({
  name: "owl",
  emojis: ["owl"],
  examples: [":owl: - say hou"],
  execute: (c) => {
    return c.res.message("hou", { mentionUserIds: [c.event.userId] });
  },
});
