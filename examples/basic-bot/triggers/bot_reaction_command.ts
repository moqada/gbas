import { createReactionCommandSlackTrigger } from "gbas/mod.ts";
import { CHANNEL_IDS } from "../bot/config.ts";
import { botReactionCommandWorkflow } from "../workflows/bot_reaction_command.ts";

export default createReactionCommandSlackTrigger({
  channelIds: CHANNEL_IDS,
  workflow: botReactionCommandWorkflow,
});
