import { createMentionCommandSlackWorkflow } from "gbas/mod.ts";
import { botMentionCommandFuncDef } from "../functions/bot_mention_command.ts";
import { respondAsBotFuncDef } from "../functions/respond_as_bot.ts";

export const botMentionCommandWorkflow = createMentionCommandSlackWorkflow({
  isQuickResponseEnabled: true,
  mentionCommandFuncDef: botMentionCommandFuncDef,
  respondAsBotFuncDef: respondAsBotFuncDef,
});
