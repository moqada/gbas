import { colors, tsMorph } from "./deps.ts";

/**
 * create files in bot directory
 */
const createBotFiles = async () => {
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
 * create a file for respond as bot
 */
const createRespondAsBotFunctionFile = async () => {
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
 * create files for mention command
 */
const createMentionCommandFiles = async () => {
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
 * create files for message command
 */
const createMessageCommandFiles = async () => {
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

const createReactionCommandFiles = async () => {
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

/**
 * Apply changes to manifest.ts
 */
const updateManifestFile = async (
  { project }: { project: tsMorph.Project },
) => {
  const sourceFile = project.getSourceFileOrThrow("./manifest.ts");

  // Add new import declarations
  sourceFile.addImportDeclarations([{
    namedImports: [
      "mentionCommandDispatcher",
      "messageCommandDispatcher",
      "reactionCommandDispatcher",
    ],
    moduleSpecifier: "./bot/dispatchers.ts",
  }, {
    namedImports: ["botMentionCommandWorkflow"],
    moduleSpecifier: "./workflows/bot_mention_command.ts",
  }, {
    namedImports: ["botMessageCommandWorkflow"],
    moduleSpecifier: "./workflows/bot_message_command.ts",
  }, {
    namedImports: ["botReactionCommandWorkflow"],
    moduleSpecifier: "./workflows/bot_reaction_command.ts",
  }]);

  const manifestCall = sourceFile.getExportAssignmentOrThrow(
    (exportAssignment) => {
      return !!exportAssignment.getExpression();
    },
  ).getExpression();
  const objectLiteral = manifestCall.getFirstChildByKindOrThrow(
    tsMorph.ts.SyntaxKind.ObjectLiteralExpression,
  );

  // Replace outgoingDomains value
  const outgoingDomainsToAdd = [
    "...mentionCommandDispatcher.outgoingDomains",
    "...messageCommandDispatcher.outgoingDomains",
    "...reactionCommandDispatcher.outgoingDomains",
  ];
  const outgoingDomainsProperty = objectLiteral.getProperty("outgoingDomains");
  if (outgoingDomainsProperty) {
    const outgoingDomainsArray = outgoingDomainsProperty
      .getFirstChildByKindOrThrow(
        tsMorph.ts.SyntaxKind.ArrayLiteralExpression,
      );
    const outgoingDomainsText = outgoingDomainsArray.getElements().length === 0
      ? outgoingDomainsToAdd.join(",")
      : `...${outgoingDomainsArray.getFullText().trim()}, ${
        outgoingDomainsToAdd.join(",")
      }`;
    outgoingDomainsArray.replaceWithText(
      `[...new Set(${outgoingDomainsText})]`,
    );
  } else {
    objectLiteral.addProperty(
      `outgoingDomains: [${outgoingDomainsToAdd.join(",")}]`,
    );
  }

  // Replace workflows value
  const workflowsToAdd = [
    "botMentionCommandWorkflow",
    "botMessageCommandWorkflow",
    "botReactionCommandWorkflow",
  ];
  const workflowsProperty = objectLiteral.getProperty("workflows");
  if (workflowsProperty) {
    const workflowsArray = workflowsProperty.getFirstChildByKindOrThrow(
      tsMorph.ts.SyntaxKind.ArrayLiteralExpression,
    );
    workflowsArray.addElements(workflowsToAdd);
  } else {
    objectLiteral.addProperty(`workflows: [${workflowsToAdd.join(",")}]`);
  }

  // Replace botScopes value
  const requiredBotScopes = [
    "app_mentions:read",
    "channels:history",
    "commands",
    "chat:write",
    "chat:write.customize",
    "chat:write.public",
    "reactions:read",
    "reactions:write",
  ];
  const botScopesProperty = objectLiteral.getPropertyOrThrow("botScopes");
  const botScopesArray = botScopesProperty.getFirstChildByKindOrThrow(
    tsMorph.ts.SyntaxKind.ArrayLiteralExpression,
  );
  // const botScopeArrayElements = botScopesArray.getElements();
  const botScopesElements = botScopesArray.getElements().map((element) => {
    return element.getText().trim();
  });
  const botScopesToAdd = requiredBotScopes.filter((scope) => {
    return !botScopesElements?.includes(`"${scope}"`);
  });
  botScopesArray.addElements(botScopesToAdd.map((scope) => {
    return `"${scope}"`;
  }));
  sourceFile.formatText();
  await sourceFile.save();
};

const getGbasModulePath = () => {
  const path = import.meta.url.startsWith("http")
    ? import.meta.url
    : "https://deno.land/x/gbas/mod.ts";
  const url = new URL(path);
  return `${url.protocol}//${url.host}${
    url.pathname.substring(0, url.pathname.lastIndexOf("/"))
  }/`;
};

const getStdModulePath = async (gbasModulePath: string) => {
  const path = `${gbasModulePath}import_map.json`;
  let text = "";
  if (path.startsWith("http")) {
    const body = await fetch(path);
    text = await body.text();
  } else {
    text = await Deno.readTextFile(path.replace("file://", ""));
  }
  const json = JSON.parse(text);
  return json.imports["std/"];
};

/**
 * Apply changes to import_map.json
 */
const updateImportMapFile = async () => {
  const filepath = "./import_map.json";
  const file = await Deno.readTextFile(filepath);
  const json: { imports: Record<string, string> } = JSON.parse(file);
  const gbasModulePath = getGbasModulePath();
  if (!json["imports"]["gbas/"]) {
    json["imports"]["gbas/"] = gbasModulePath;
  }
  if (!json["imports"]["std/"]) {
    json["imports"]["std/"] = await getStdModulePath(gbasModulePath);
  }
  await Deno.writeTextFile(filepath, JSON.stringify(json, null, 2));
};

const MANIFEST_FILE_SNIPPET_1 = `import {
  mentionCommandDispatcher,
  messageCommandDispatcher,
  reactionCommandDispatcher,
} from "./bot/dispatchers.ts";
import { botMentionCommandWorkflow } from "./workflows/bot_mention_command.ts";
import { botMessageCommandWorkflow } from "./workflows/bot_message_command.ts";
import { botReactionCommandWorkflow } from "./workflows/bot_reaction_command.ts";`;
const MANIFEST_FILE_SNIPPET_2 =
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
const IMPORT_MAP_FILE_SNIPPET = `"gbas/": "${getGbasModulePath()}",
"std/": "https://deno.land/std@0.181.0/",`;

const main = async () => {
  await createBotFiles();
  await Deno.mkdir("functions", { recursive: true });
  await Deno.mkdir("workflows", { recursive: true });
  await Deno.mkdir("triggers", { recursive: true });
  await createRespondAsBotFunctionFile();
  await createMentionCommandFiles();
  await createMessageCommandFiles();
  await createReactionCommandFiles();

  const project = new tsMorph.Project({
    resolutionHost: tsMorph.ResolutionHosts.deno,
  });
  project.addSourceFilesAtPaths("**/*.ts");

  const mustEditFiles = ["bot/config.ts"];
  const steps = [];

  try {
    await updateManifestFile({ project });
  } catch (_) {
    mustEditFiles.push("manifest.ts");
    steps.push(
      `Copy and paste the following code to ${colors.brightCyan("manifest.ts")}:

${colors.gray("```")}
${colors.gray(MANIFEST_FILE_SNIPPET_1)}
${colors.gray("```")}`,
    );
    steps.push(
      `Edit Manifest parameters in ${
        colors.brightCyan("manifest.ts")
      } like the following:

${colors.gray("```")}
${colors.gray(MANIFEST_FILE_SNIPPET_2)}
${colors.gray("```")}`,
    );
  }

  try {
    await updateImportMapFile();
  } catch (_) {
    steps.push(
      `Add the following dependencies to ${
        colors.brightCyan("import_map.json")
      }:

${colors.gray("```")}
${colors.gray(IMPORT_MAP_FILE_SNIPPET)}
${colors.gray("```")}`,
    );
  }
  steps.push(`Change CHANNEL_IDS in ${colors.brightCyan("bot/config.ts")}.`);
  steps.push(
    `Add your first command by \`${
      colors.brightCyan("deno run -Ar https://deno.land/x/gbas/command.ts")
    }\``,
  );
  steps.push(
    `Develop locally with \`${colors.brightCyan("slack run")}\`.`,
  );

  const message = `🎉 Successfully created bot code.

You must edit ${
    mustEditFiles.map((filename) => colors.brightCyan(filename)).join(", ")
  }.

${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}`;

  console.log(message);

  await new Deno.Command("deno", { args: ["fmt"] }).output();
};

await main();
