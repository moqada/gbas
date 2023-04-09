import { assert, assertEquals } from "../../dev_deps.ts";
import { createMessageCommandTester } from "./tester.ts";
import { createMessageCommand } from "./command_factory.ts";

Deno.test("createMentionCommandTester: createContext", () => {
  const { createContext } = createMessageCommandTester();

  let ctx = createContext("hello");
  assertEquals(ctx.event.text, "hello");

  ctx = createContext("hello", { event: { channelId: "OVERRIDE_CHANNEL_ID" } });
  assertEquals(ctx.event.channelId, "OVERRIDE_CHANNEL_ID");
});

Deno.test("createMentionCommandTester: dispatch", async () => {
  const dummy = createMessageCommand({
    name: "dummy",
    examples: ["dummy - dummy"],
    pattern: /^dummy$/,
    execute: (c) => c.res.message("receive dummy!"),
  });
  const { createContext, dispatch } = createMessageCommandTester(dummy);
  const ctx = createContext("dummy");

  const res = await dispatch(ctx);

  assert(res.type === "message");
  assertEquals(res.text, "receive dummy!");
});
