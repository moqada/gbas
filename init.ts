import { colors } from "./deps.ts";

/**
 * create code in bot directory
 */
const createBotCode = async () => {
  // command dirs
  const commands = ["mention", "message", "reaction"];
  for (const command of commands) {
    await Deno.mkdir(`bot/${command}`, { recursive: true });
    await Deno.writeTextFile(`bot/${command}/mod.ts`, "");
  }
  // dispatchers.ts
  const codeDispatchers = `import {
  createHelpMentionCommand,
  MentionCommandDispatcher,
  MessageCommandDispatcher,
  ReactionCommandDispatcher,
} from "gbas/mod.ts";
import * as mentionCommands from "./mention/mod.ts";
import * as messageCommands from "./message/mod.ts";
import * as reactionCommands from "./reaction/mod.ts";

export const mentionCommandDispatcher = new MentionCommandDispatcher(
  Object.values(mentionCommands),
);
export const messageCommandDispatcher = new MessageCommandDispatcher(
  Object.values(messageCommands),
);
export const reactionCommandDispatcher = new ReactionCommandDispatcher(
  Object.values(reactionCommands),
);
mentionCommandDispatcher.register(
  createHelpMentionCommand({
    commands: {
      mention: mentionCommandDispatcher.commands,
      message: messageCommandDispatcher.commands,
      reaction: reactionCommandDispatcher.commands,
    },
  }),
);
`;
  await Deno.writeTextFile("bot/dispatchers.ts", codeDispatchers);
  // config.ts
  const codeConfig =
    `export const CHANNEL_IDS: [string, ...string[]] = ["YOUR_BOT_CHANNEL_ID"];
`;
  await Deno.writeTextFile("bot/config.ts", codeConfig);
};

/**
 * create code for respond as bot
 */
const createRespondAsBotFunctionCode = async () => {
  // Function
  const codeFunction =
    `import { createRespondAsBotSlackFunction } from "gbas/mod.ts";

const { def: respondAsBotFuncDef, func: respondAsBotFunc } =
  createRespondAsBotSlackFunction({
    sourceFile: "functions/respond_as_bot.ts",
  });
export { respondAsBotFuncDef };
export default respondAsBotFunc;
`;
  await Deno.writeTextFile("functions/respond_as_bot.ts", codeFunction);
};

/**
 * create code for mention command
 */
const createMentionCommandCode = async () => {
  // Function
  const codeFunction =
    `import { createMentionCommandSlackFunction } from "gbas/mod.ts";
import { mentionCommandDispatcher } from "../bot/dispatchers.ts";

const { def: botMentionCommandFuncDef, func: botMentionCommandFunc } =
  createMentionCommandSlackFunction({
    dispatcher: mentionCommandDispatcher,
    sourceFile: "functions/bot_mention_command.ts",
  });
export { botMentionCommandFuncDef };
export default botMentionCommandFunc;
`;
  await Deno.writeTextFile("functions/bot_mention_command.ts", codeFunction);
  // Workflow
  const codeWorkflow =
    `import { createMentionCommandSlackWorkflow } from "gbas/mod.ts";
import { botMentionCommandFuncDef } from "../functions/bot_mention_command.ts";
import { respondAsBotFuncDef } from "../functions/respond_as_bot.ts";

export const botMentionCommandWorkflow = createMentionCommandSlackWorkflow({
  isQuickResponseEnabled: true,
  mentionCommandFuncDef: botMentionCommandFuncDef,
  respondAsBotFuncDef: respondAsBotFuncDef,
});
`;
  await Deno.writeTextFile("workflows/bot_mention_command.ts", codeWorkflow);
  // Trigger
  const codeTrigger =
    `import { createMentionCommandSlackTrigger } from "gbas/mod.ts";
import { CHANNEL_IDS } from "../bot/config.ts";
import { botMentionCommandWorkflow } from "../workflows/bot_mention_command.ts";

export default createMentionCommandSlackTrigger({
  channelIds: CHANNEL_IDS,
  workflow: botMentionCommandWorkflow,
});
`;
  await Deno.writeTextFile("triggers/bot_mention_command.ts", codeTrigger);
};

/**
 * create code for message command
 */
const createMessageCommandCode = async () => {
  // Function
  const codeFunction =
    `import { createMessageCommandSlackFunction } from "gbas/mod.ts";
import { messageCommandDispatcher } from "../bot/dispatchers.ts";

const { def: botMessageCommandFuncDef, func: botMessageCommandFunc } =
  createMessageCommandSlackFunction({
    dispatcher: messageCommandDispatcher,
    sourceFile: "functions/bot_message_command.ts",
  });
export { botMessageCommandFuncDef };
export default botMessageCommandFunc;
`;
  await Deno.writeTextFile("functions/bot_message_command.ts", codeFunction);
  // Workflow
  const codeWorkflow =
    `import { createMessageCommandSlackWorkflow } from "gbas/mod.ts";
import { botMessageCommandFuncDef } from "../functions/bot_message_command.ts";
import { respondAsBotFuncDef } from "../functions/respond_as_bot.ts";

export const botMessageCommandWorkflow = createMessageCommandSlackWorkflow({
  isQuickResponseEnabled: true,
  messageCommandFuncDef: botMessageCommandFuncDef,
  respondAsBotFuncDef: respondAsBotFuncDef,
});
`;
  await Deno.writeTextFile("workflows/bot_message_command.ts", codeWorkflow);
  // Trigger
  const codeTrigger =
    `import { createMessageCommandSlackTrigger } from "gbas/mod.ts";
import { CHANNEL_IDS } from "../bot/config.ts";
import { botMessageCommandWorkflow } from "../workflows/bot_message_command.ts";

export default createMessageCommandSlackTrigger({
  channelIds: CHANNEL_IDS,
  workflow: botMessageCommandWorkflow,
});
`;
  await Deno.writeTextFile("triggers/bot_message_command.ts", codeTrigger);
};

const createReactionCommandCode = async () => {
  // Function
  const codeFunction =
    `import { createReactionCommandSlackFunction } from "gbas/mod.ts";
import { reactionCommandDispatcher } from "../bot/dispatchers.ts";

const { def: botReactionCommandFuncDef, func: botReactionCommandFunc } =
  createReactionCommandSlackFunction({
    dispatcher: reactionCommandDispatcher,
    sourceFile: "functions/bot_reaction_command.ts",
  });
export { botReactionCommandFuncDef };
export default botReactionCommandFunc;
`;
  await Deno.writeTextFile("functions/bot_reaction_command.ts", codeFunction);
  // Workflow
  const codeWorkflow =
    `import { createReactionCommandSlackWorkflow } from "gbas/mod.ts";
import { botReactionCommandFuncDef } from "../functions/bot_reaction_command.ts";
import { respondAsBotFuncDef } from "../functions/respond_as_bot.ts";

export const botReactionCommandWorkflow = createReactionCommandSlackWorkflow({
  reactionCommandFuncDef: botReactionCommandFuncDef,
  respondAsBotFuncDef: respondAsBotFuncDef,
  isQuickResponseEnabled: true,
});
`;
  await Deno.writeTextFile("workflows/bot_reaction_command.ts", codeWorkflow);
  // Trigger
  const codeTrigger =
    `import { createReactionCommandSlackTrigger } from "gbas/mod.ts";
import { CHANNEL_IDS } from "../bot/config.ts";
import { botReactionCommandWorkflow } from "../workflows/bot_reaction_command.ts";

export default createReactionCommandSlackTrigger({
  channelIds: CHANNEL_IDS,
  workflow: botReactionCommandWorkflow,
});
`;
  await Deno.writeTextFile("triggers/bot_reaction_command.ts", codeTrigger);
};

const getGbasModulePath = () => {
  const url = new URL(import.meta.url);
  return `${url.protocol}//${url.host}${
    url.pathname.substring(0, url.pathname.lastIndexOf("/"))
  }/`;
};

await createBotCode();
await Deno.mkdir("functions", { recursive: true });
await Deno.mkdir("workflows", { recursive: true });
await Deno.mkdir("triggers", { recursive: true });
await createRespondAsBotFunctionCode();
await createMentionCommandCode();
await createMessageCommandCode();
await createReactionCommandCode();

const snippet1 = `import {
  mentionCommandDispatcher,
  messageCommandDispatcher,
  reactionCommandDispatcher,
} from "./bot/dispatchers.ts";
import { botMentionCommandWorkflow } from "./workflows/bot_mention_command.ts";
import { botMessageCommandWorkflow } from "./workflows/bot_message_command.ts";
import { botReactionCommandWorkflow } from "./workflows/bot_reaction_command.ts";`;
const snippet2 =
  `workflows: [botMentionCommandWorkflow, botMessageCommandWorkflow, botReactionCommandWorkflow],
outgoingDomains: [
  ...new Set(
    [
      ...mentionCommandDispatcher.outgoingDomains,
      ...messageCommandDispatcher.outgoingDomains,
      ...reactionCommandDispatcher.outgoingDomains,
    ],
  ),
],
botScopes: [
  "app_mentions:read",
  "channels:history",
  "commands",
  "chat:write",
  "chat:write.customize",
  "chat:write.public",
  "reactions:read",
  "reactions:write",
],`;
const snippet3 = `"gbas/": "${getGbasModulePath()}",
"std/": "https://deno.land/std@0.181.0/",`;
const message = `🎉 Successfly created bot code.

You must edit ${colors.brightCyan("manifest.ts")} and ${
  colors.brightCyan("bot/config.ts")
}.

1. Copy and paste the following code to ${colors.brightCyan("manifest.ts")}:

${colors.gray("```")}
${colors.gray(snippet1)}
${colors.gray("```")}

2. Edit Manifest parameters in ${
  colors.brightCyan("manifest.ts")
} like the following:

${colors.gray("```")}
${colors.gray(snippet2)}
${colors.gray("```")}

3. Add the following dependencies to ${colors.brightCyan("import_map.json")}:

${colors.gray("```")}
${colors.gray(snippet3)}
${colors.gray("```")}

4. Change CHANNEL_IDS in ${colors.brightCyan("bot/config.ts")}.
5. Add your first command by \`${
  colors.brightCyan("deno run -Ar https://deno.land/x/gbas/command.ts")
}\`.
6. Develop locally with \`${colors.brightCyan("slack run")}\`.
`;

console.log(message);
