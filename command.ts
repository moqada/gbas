import { cliffyPrompt, colors } from "./deps.ts";
import { lowerCamelToSnake } from "./utils.ts";

const existsPath = async (
  path: string,
  { isDir = false }: { isDir?: boolean } = {},
): Promise<boolean> => {
  try {
    const c = await Deno.lstat(path);
    return isDir ? c.isDirectory : c.isFile;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return false;
    }
    throw err;
  }
};

const outputError = (msg: string) => {
  console.log(`${colors.red("error:")} ${msg}`);
};
const outputFileCreated = (path: string) => {
  console.log(`${colors.green("created")} ${path}`);
};

const createMentionCommand = async (
  { name, hasTest }: { name: string; hasTest: boolean },
) => {
  const filename = lowerCamelToSnake(name);
  // command
  const command = `import { createMentionCommand } from "gbas/mod.ts";

export const ${name} = createMentionCommand({
  name: "${name}",
  examples: ["${name} <text> - YOUR COMMAND DESCRIPTION"],
  pattern: /^${name}\\s+(.+)$/i,
  execute: (c) => {
    const text = c.match[1];
    return c.res.message(\`${name} command: \${text}\`);
  },
});
`;
  const commandFile = `bot/mention/${filename}.ts`;
  await Deno.writeTextFile(commandFile, command);
  outputFileCreated(commandFile);
  // test
  if (hasTest) {
    const test = `import { createMentionCommandTester } from "gbas/mod.ts";
import { mentionCommandDispatcher } from "../dispatchers.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";

const { createContext } = createMentionCommandTester();
Deno.test("${name}", async () => {
  const res = await mentionCommandDispatcher.dispatch(
    createContext("<@BOT> ${name} foo"),
  );
  assert(res.type === "message");
  assertEquals(res.text, "${name} command: foo");
});
`;
    const testFile = `bot/mention/${filename}_test.ts`;
    await Deno.writeTextFile(testFile, test);
    outputFileCreated(testFile);
  }
  // mod
  await Deno.writeTextFile(
    "bot/mention/mod.ts",
    `export { ${name} } from "./${filename}.ts";\n`,
    { append: true },
  );
};

const createMessageCommand = async (
  { name, hasTest }: { name: string; hasTest: boolean },
) => {
  const filename = lowerCamelToSnake(name);
  // command
  const command = `import { createMessageCommand } from "gbas/mod.ts";

export const ${name} = createMessageCommand({
  name: "${name}",
  examples: ["${name} - YOUR COMMAND DESCRIPTION!"],
  pattern: /^${name}$/i,
  execute: (c) => {
    return c.res.message("${name} command works!");
  },
});
`;
  const commandFile = `bot/message/${filename}.ts`;
  await Deno.writeTextFile(commandFile, command);
  outputFileCreated(commandFile);
  // test
  if (hasTest) {
    const test = `import { createMessageCommandTester } from "gbas/mod.ts";
import { messageCommandDispatcher } from "../dispatchers.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";

const { createContext } = createMessageCommandTester();
Deno.test("${name}", async () => {
  const res = await messageCommandDispatcher.dispatch(
    createContext("${name}"),
  );
  assert(res.type === "message");
  assertEquals(res.text, "${name} command works!");
});
`;
    const testFile = `bot/message/${filename}_test.ts`;
    await Deno.writeTextFile(testFile, test);
    outputFileCreated(testFile);
  }
  // mod
  await Deno.writeTextFile(
    "bot/message/mod.ts",
    `export { ${name} } from "./${filename}.ts";\n`,
    { append: true },
  );
};

const createReactionCommand = async (
  { name, hasTest }: { name: string; hasTest: boolean },
) => {
  const filename = lowerCamelToSnake(name);
  // command
  const command = `import { createReactionCommand } from "gbas/mod.ts";

export const ${name} = createReactionCommand({
  name: "${name}",
  examples: [":${name}: - YOUR COMMAND DESCRIPTION!"],
  emojis: ["${name}"],
  execute: (c) => {
    return c.res.message("${name} added!");
  },
});
`;
  const commandFile = `bot/reaction/${filename}.ts`;
  await Deno.writeTextFile(commandFile, command);
  outputFileCreated(commandFile);
  // test
  if (hasTest) {
    const test = `import { createReactionCommandTester } from "gbas/mod.ts";
import { reactionCommandDispatcher } from "../dispatchers.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";

const { createContext } = createReactionCommandTester();
Deno.test("${name}", async () => {
  const res = await reactionCommandDispatcher.dispatch(
    createContext("${name}"),
  );
  assert(res.type === "message");
  assertEquals(res.text, "${name} added!");
});
`;
    const testFile = `bot/reaction/${filename}_test.ts`;
    await Deno.writeTextFile(testFile, test);
    outputFileCreated(testFile);
  }
  // mod
  await Deno.writeTextFile(
    "bot/reaction/mod.ts",
    `export { ${name} } from "./${filename}.ts";\n`,
    { append: true },
  );
};

const main = async () => {
  const hasBotDir = await existsPath("bot", { isDir: true });
  if (!hasBotDir) {
    outputError(
      "bot directory is not found. this command is only support bot directory",
    );
    Deno.exit(1);
  }
  const commandType = await cliffyPrompt.Select.prompt({
    message: "Select command type",
    options: ["mention", "message", "reaction"],
    default: "mention",
  });
  const commandName = await cliffyPrompt.Input.prompt({
    message: "Input command name",
    validate: (value) => {
      if (value.match(/^[a-z0-9][a-zA-Z0-9]+$/)) {
        return true;
      }
      return "command name must be lowerCamelCase";
    },
  });
  if (!commandName) {
    outputError("command name is required");
    Deno.exit(1);
  }
  const hasTest = await cliffyPrompt.Confirm.prompt({
    message: "Create a test file?",
  });
  switch (commandType) {
    case "mention": {
      const filename = lowerCamelToSnake(commandName);
      if (!await existsPath("bot/mention", { isDir: true })) {
        outputError("bot/mention directory is not found.");
        Deno.exit(1);
      } else if (!await existsPath("bot/mention/mod.ts")) {
        outputError("bot/mention/mod.ts is not found.");
        Deno.exit(1);
      } else if (await existsPath(`bot/mention/${filename}.ts`)) {
        outputError(`bot/mention/${filename}.ts already exists.`);
        Deno.exit(1);
      }
      await createMentionCommand({ name: commandName, hasTest });
      break;
    }
    case "message": {
      const filename = lowerCamelToSnake(commandName);
      if (!await existsPath("bot/message", { isDir: true })) {
        outputError("bot/message directory is not found.");
        Deno.exit(1);
      } else if (!await existsPath("bot/message/mod.ts")) {
        outputError("bot/message/mod.ts is not found.");
        Deno.exit(1);
      } else if (await existsPath(`bot/message/${filename}.ts`)) {
        outputError(`bot/message/${filename}.ts already exists.`);
        Deno.exit(1);
      }
      await createMessageCommand({ name: commandName, hasTest });
      break;
    }
    case "reaction": {
      const filename = lowerCamelToSnake(commandName);
      if (!await existsPath("bot/reaction", { isDir: true })) {
        outputError("bot/reaction directory is not found.");
        Deno.exit(1);
      } else if (!await existsPath("bot/reaction/mod.ts")) {
        outputError("bot/reaction/mod.ts is not found.");
        Deno.exit(1);
      } else if (await existsPath(`bot/reaction/${filename}.ts`)) {
        outputError(`bot/reaction/${filename}.ts already exists.`);
        Deno.exit(1);
      }
      await createReactionCommand({ name: commandName, hasTest });
      break;
    }
    default:
      throw new Error(`command type is invalid: ${commandType}`);
  }
};

await main();
