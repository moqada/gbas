import { createReactionCommandSlackWorkflow } from "gbas/mod.ts";
import { botReactionCommandFuncDef } from "../functions/bot_reaction_command.ts";
import { respondAsBotFuncDef } from "../functions/respond_as_bot.ts";

export const botReactionCommandWorkflow = createReactionCommandSlackWorkflow({
  reactionCommandFuncDef: botReactionCommandFuncDef,
  respondAsBotFuncDef: respondAsBotFuncDef,
  isQuickResponseEnabled: true,
});
