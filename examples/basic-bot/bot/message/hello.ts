import { createMessageCommand } from "gbas/mod.ts";

export const hello = createMessageCommand({
  name: "hello",
  examples: ["hello - hello!"],
  pattern: /^hello$/i,
  execute: (c) => {
    return c.res.message("hello!", { mentionUserIds: [c.event.userId] });
  },
});
