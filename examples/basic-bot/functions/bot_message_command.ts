import { createMessageCommandSlackFunction } from "gbas/mod.ts";
import { messageCommandDispatcher } from "../bot/dispatchers.ts";

const { def: botMessageCommandFuncDef, func: botMessageCommandFunc } =
  createMessageCommandSlackFunction({
    dispatcher: messageCommandDispatcher,
    sourceFile: "functions/bot_message_command.ts",
  });
export { botMessageCommandFuncDef };
export default botMessageCommandFunc;
