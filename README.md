# GBAS

This is an adapter for easily creating generic bots on the Slack next-gen platform that respond to mentions, messages, and emojis.

## Usage

Implement each function as a command.

### Mention Command

To create a command that responds to mentions, use the following implementation:

```ts
import {createMentionCommand} from "gbas/mod.ts";

export const echo = createMentionCommand({
  name: "echo",
  examples: ["echo <message> - echo applied message"],
  pattern: /^echo\s*(.+)$/i,
  execute: (c) => c.res.message(c.match[1]),
})
```

You can write a test for the command like this:

```ts
import { createMentionCommandTester }  from "gbas/mod.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";
import { echo } from "./echo.ts";

const { createContext, dispatch } = createMentionCommandTester(echo);

Deno.test("echo", async () => {
  const res = await dispatch(createContext("<@BOT> echo hello world"));
  assert(res.type === "message");
  assertEquals(res.text, "hello world");
});
```

### Message Command

To create a command that responds to messages, use the following implementation:

```ts
import {createMessageCommand} from "gbas/mod.ts";

export const hello = createMessageCommand({
  name: "hello",
  examples: ["hello - reaction emoji"],
  pattern: /^hello$/i,
  execute: (c) => c.res.reaction("hugging_face"),
})
```

You can write a test for the command like this:

```ts
import { createMessageCommandTester }  from "gbas/mod.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";
import { hello } from "./hello.ts";

const { createContext, dispatch } = createMessageCommandTester(echo);

Deno.test("hello", async () => {
  const c = createContext("hello")
  const res = await dispatch(c);
  assert(res.type === "reaction");
  assertEquals(res.emoji, "hugging_face");
});
```

### Reaction Command

To create a command that responds to reactions (emojis), use the following implementation:

```ts
import {createReactionCommand} from "gbas/mod.ts";

export const owl = createReactionCommand({
  name: "owl",
  examples: [":owl: - reply hoot"],
  emojis: ['owl'],
  execute: (c) => c.res.message("hoot!", {mentionUserIds: [c.event.userId]}),
})
```

You can write a test for the command like this:

```ts
import { createReactionCommandTester }  from "gbas/mod.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";
import { hello } from "./hello.ts";

const { createContext, dispatch } = createReactionCommandTester(echo);

Deno.test("owl", async () => {
  const c = createContext("owl")
  const res = await dispatch(c);
  assert(res.type === "message");
  assertEquals(res.text, "<@USER> hoot!");
});
```


### Setup

First, prepare a Slack Next-Gen platform app.
You can create a new one using the `slack create` command. For more information, please refer to [the official Slack documentation](https://api.slack.com/future/create).

After preparing the app, add `gbas` to `import_map.json`.

```diff
{
  "imports": {
    "deno-slack-sdk/": "https://deno.land/x/deno_slack_sdk@1.6.1/",
    "deno-slack-api/": "https://deno.land/x/deno_slack_api@1.7.0/",
+    "gbas/": "https://deno.land/x/gbas@0.1.0/",
  }
}
```

Create an instance of `CommandDispatcher` and add your commands.
In this example, we only add a Mention Command, but you can also create other `CommandDispatcher` instances for Message and Reaction commands as needed.

```ts
// bot/dispatchers.ts
import {createMentionCommand, createMentionCommandDispatcher} from "gbas/mod.ts";

export const mentionCommandDispatcher = new MentionCommandDispatcher([
  createMentionCommand({
    name: 'echo',
    examples: ['echo <message> - echo applied message'],
    pattern: /^echo\s*(.+)$/,
    execute: (c) => c.res.message(c.match[1]),
  })
]);
```

Create a Slack Function to respond as a bot.

```ts
// functions/respond_as_bot.ts
import { createRespondAsBotSlackFunction } from "gbas/mod.ts";
const { def: respondAsBotFuncDef, func: respondAsBotFunc } =
  createRespondAsBotSlackFunction({
    sourceFile: "functions/respond_as_bot.ts",
  });
export { respondAsBotFuncDef };
export default respondAsBotFunc;
```

Create the corresponding Function, Workflow, and Trigger for each command.
In this example, we only add a Mention Command, but you can also create other Function, Workflow, and Trigger for Message and Reaction commands as needed.

```ts
// functions/bot_mention.ts
import { createMentionCommandSlackFunction } from "gbas/mod.ts";
import { mentionCommandDispatcher } from "../bot/dispatchers.ts";
const { def: botMentionFuncDef, func: botMentionFunc } =
  createMentionCommandSlackFunction({
    dispatcher: mentionCommandDispatcher,
    sourceFile: "functions/bot_mention.ts",
  });
export { botMentionFuncDef };
export default botMentionFunc;

// triggers/bot_mention.ts
import {
  createMentionCommandSlackTrigger,
  createMentionCommandSlackWorkflow,
} from "gbas/mod.ts";
import { botMentionFuncDef } from "../functions/bot_mention.ts";
import { respondAsBotFuncDef } from "../functions/respond_as_bot.ts";
export const botMentionWorkflow = createMentionCommandSlackWorkflow({
  mentionCommandFuncDef: botMentionFuncDef,
  respondAsBotFuncDef: respondAsBotFuncDef,
  isQuickResponseEnabled: true,
});
export default createMentionCommandSlackTrigger({
  channelIds: ["YOUR_CHANNEL_ID"],
  workflow: botMentionWorkflow,
});
```

Edit `manifest.ts` to add the necessary `botScopes`, `workflows`, and `outgoingDomains`.

```diff
import { Manifest } from "deno-slack-sdk/mod.ts";
+import { mentionCommandDispatcher } from "./bot/dispatchers.ts";
+import { botMentionWorkflow } from "./triggers/bot_mention.ts";

export default Manifest({
-  workflows: [],
+  workflows: [botMentionWorkflow],
-  outgoingDomains: [],
+  outgoingDomains: [...new Set([...mentionCommandDispatcher.outgoingDomains])],
  botScopes: [
+    "app_mentions:read",
+    "channels:history",
    "commands",
    "chat:write",
+    "chat:write.customize",
    "chat:write.public",
+    "reactions:read",
+    "reactions:write",
  ],
});
```

Start your bot with `slack run` and add it to the specified channel.

For more examples, please refer to the [examples](/examples) directory.

## Development

- Test: `deno test`
