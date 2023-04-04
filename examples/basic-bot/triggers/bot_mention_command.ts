import { createMentionCommandSlackTrigger } from "gbas/mod.ts";
import { CHANNEL_IDS } from "../bot/config.ts";
import { botMentionCommandWorkflow } from "../workflows/bot_mention_command.ts";

export default createMentionCommandSlackTrigger({
  channelIds: CHANNEL_IDS,
  workflow: botMentionCommandWorkflow,
});
