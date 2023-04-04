import { createRespondAsBotSlackFunction } from "gbas/mod.ts";

const { def: respondAsBotFuncDef, func: respondAsBotFunc } =
  createRespondAsBotSlackFunction({
    sourceFile: "functions/respond_as_bot.ts",
  });
export { respondAsBotFuncDef };
export default respondAsBotFunc;
