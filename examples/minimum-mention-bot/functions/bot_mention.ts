import { createMentionCommandSlackFunction } from "gbas/mod.ts";
import { mentionCommandDispatcher } from "../bot.ts";

const { def: mentionCommandFuncDef, func: mentionCommandFunc } =
  createMentionCommandSlackFunction({
    dispatcher: mentionCommandDispatcher,
    sourceFile: "functions/bot_mention.ts",
  });
export { mentionCommandFuncDef };
export default mentionCommandFunc;
