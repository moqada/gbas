import { createMessageCommandSlackWorkflow } from "gbas/mod.ts";
import { botMessageCommandFuncDef } from "../functions/bot_message_command.ts";
import { respondAsBotFuncDef } from "../functions/respond_as_bot.ts";

export const botMessageCommandWorkflow = createMessageCommandSlackWorkflow({
  isQuickResponseEnabled: true,
  messageCommandFuncDef: botMessageCommandFuncDef,
  respondAsBotFuncDef: respondAsBotFuncDef,
});
