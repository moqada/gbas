import { createMessageCommandSlackTrigger } from "gbas/mod.ts";
import { CHANNEL_IDS } from "../bot/config.ts";
import { botMessageCommandWorkflow } from "../workflows/bot_message_command.ts";

export default createMessageCommandSlackTrigger({
  channelIds: CHANNEL_IDS,
  workflow: botMessageCommandWorkflow,
});
