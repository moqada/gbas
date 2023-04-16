# GBAS

This is an adapter for easily creating generic bots on the Slack Next-gen
platform that respond to mentions, messages, and emojis.

## Getting Started

First, prepare a Slack Next-gen platform app.

You can create a new one using the `slack create` command. For more information,
please refer to
[the official Slack documentation](https://api.slack.com/future/create).

Then navigate to the slack project directory, run the following:

```
deno run -Ar https://deno.land/x/gbas/init.ts
```

<details>
<summary>Actually command output example</summary>

```zsh
┗╸❯❯❯ slack create sample
⚙️  Creating a new Slack app in ~/sample

📦 Installed project dependencies

✨ sample successfully created

🧭 Explore the documentation to learn more
   Read the README.md or peruse the docs over at api.slack.com/future
   Find available commands and usage info with slack help

📋 Follow the steps below to begin development
   Change into your project directory with cd sample/
   Develop locally and see changes in real-time with slack run
   When you're ready to deploy for production use slack deploy

┗╸❯❯❯ cd sample

┗╸❯❯❯ deno run -Ar https://deno.land/x/gbas/init.ts
🎉 Successfully created bot code.

You must edit bot/config.ts.

1. Change CHANNEL_IDS in bot/config.ts.
2. Add your first command by `deno run -Ar https://deno.land/x/gbas/command.ts`
3. Develop locally with `slack run`.
```

</details>

For more examples, please refer to the [examples](/examples) directory.

## Usage

Implement each function as a command.

You can scaffold code by running the following:

```
deno run -Ar https://deno.land/x/gbas/command.ts
```

### Mention Command

To create a command that responds to mentions, use the following implementation:

```ts
import { createMentionCommand } from "gbas/mod.ts";

export const echo = createMentionCommand({
  name: "echo",
  examples: ["echo <message> - echo applied message"],
  pattern: /^echo\s*(.+)$/i,
  execute: (c) => c.res.message(c.match[1]),
});
```

You can write a test for the command like this:

```ts
import { createMentionCommandTester } from "gbas/mod.ts";
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
import { createMessageCommand } from "gbas/mod.ts";

export const hello = createMessageCommand({
  name: "hello",
  examples: ["hello - reaction emoji"],
  pattern: /^hello$/i,
  execute: (c) => c.res.reaction("hugging_face"),
});
```

You can write a test for the command like this:

```ts
import { createMessageCommandTester } from "gbas/mod.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";
import { hello } from "./hello.ts";

const { createContext, dispatch } = createMessageCommandTester(echo);

Deno.test("hello", async () => {
  const c = createContext("hello");
  const res = await dispatch(c);
  assert(res.type === "reaction");
  assertEquals(res.emoji, "hugging_face");
});
```

### Reaction Command

To create a command that responds to reactions (emojis), use the following
implementation:

```ts
import { createReactionCommand } from "gbas/mod.ts";

export const owl = createReactionCommand({
  name: "owl",
  examples: [":owl: - reply hoot"],
  emojis: ["owl"],
  execute: (c) => c.res.message("hoot!", { mentionUserIds: [c.event.userId] }),
});
```

You can write a test for the command like this:

```ts
import { createReactionCommandTester } from "gbas/mod.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";
import { owl } from "./owl.ts";

const { createContext, dispatch } = createReactionCommandTester(owl);

Deno.test("owl", async () => {
  const c = createContext("owl");
  const res = await dispatch(c);
  assert(res.type === "message");
  assertEquals(res.text, "<@USER> hoot!");
});
```

## Development

- Test: `deno task test`
