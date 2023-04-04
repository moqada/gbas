import {
  createMentionCommandSlackTrigger,
  createMentionCommandSlackWorkflow,
} from "gbas/mod.ts";
import { respondAsBotFuncDef } from "../functions/respond_as_bot.ts";
import { mentionCommandFuncDef } from "../functions/bot_mention.ts";

export const mentionCommandWorkflow = createMentionCommandSlackWorkflow({
  mentionCommandFuncDef,
  respondAsBotFuncDef,
});
export default createMentionCommandSlackTrigger({
  channelIds: ["YOUR_CHANNEL_ID"],
  workflow: mentionCommandWorkflow,
});
