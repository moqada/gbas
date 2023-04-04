import { Manifest } from "deno-slack-sdk/mod.ts";
import { mentionCommandDispatcher } from "./bot.ts";
import { mentionCommandWorkflow } from "./triggers/bot_mention.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/future/manifest
 */
export default Manifest({
  name: "minimum-mention-bot",
  description: "GBAS minimum sample bot",
  icon: "assets/default_new_app_icon.png",
  functions: [],
  workflows: [mentionCommandWorkflow],
  outgoingDomains: [...new Set([...mentionCommandDispatcher.outgoingDomains])],
  botScopes: [
    "app_mentions:read",
    "channels:history",
    "chat:write",
    "chat:write.customize",
    "chat:write.public",
    "commands",
    "reactions:read",
    "reactions:write",
  ],
});
