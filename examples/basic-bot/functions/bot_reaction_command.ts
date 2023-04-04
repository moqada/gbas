import { createReactionCommandSlackFunction } from "gbas/mod.ts";
import { reactionCommandDispatcher } from "../bot/dispatchers.ts";

const { def: botReactionCommandFuncDef, func: botReactionCommandFunc } =
  createReactionCommandSlackFunction({
    dispatcher: reactionCommandDispatcher,
    sourceFile: "functions/bot_reaction_command.ts",
  });
export { botReactionCommandFuncDef };
export default botReactionCommandFunc;
