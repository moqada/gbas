import { createMentionCommandSlackFunction } from "gbas/mod.ts";
import { mentionCommandDispatcher } from "../bot/dispatchers.ts";

const { def: botMentionCommandFuncDef, func: botMentionCommandFunc } =
  createMentionCommandSlackFunction({
    dispatcher: mentionCommandDispatcher,
    sourceFile: "functions/bot_mention_command.ts",
  });
export { botMentionCommandFuncDef };
export default botMentionCommandFunc;
