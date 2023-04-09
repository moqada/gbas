import { assert, assertEquals } from "../../dev_deps.ts";
import { createMentionCommandTester } from "./tester.ts";
import { createMentionCommand } from "./command_factory.ts";

Deno.test("createMentionCommandTester: createContext", () => {
  const { createContext } = createMentionCommandTester();

  let ctx = createContext("hello");
  assertEquals(ctx.event.text, "hello");

  ctx = createContext("hello", { event: { channelId: "OVERRIDE_CHANNEL_ID" } });
  assertEquals(ctx.event.channelId, "OVERRIDE_CHANNEL_ID");
});

Deno.test("createMentionCommandTester: dispatch", async () => {
  const dummy = createMentionCommand({
    name: "dummy",
    examples: ["dummy - dummy"],
    pattern: /^dummy$/,
    execute: (c) => c.res.message("receive dummy!"),
  });
  const { createContext, dispatch } = createMentionCommandTester(dummy);
  const ctx = createContext("<@BOT> dummy");

  const res = await dispatch(ctx);

  assert(res.type === "message");
  assertEquals(res.text, "receive dummy!");
});
