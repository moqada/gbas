import { createMentionCommand } from "gbas/mod.ts";

export const echo = createMentionCommand({
  name: "echo",
  examples: ["echo <text> - Echo applied text"],
  pattern: /^echo ([\s\S]+)$/i,
  execute: (c) => {
    const text = c.match[1];
    return c.res.message(text);
  },
});
