import { assert, assertEquals } from "../../dev_deps.ts";
import { createReactionCommandTester } from "./tester.ts";
import { createReactionCommand } from "./command_factory.ts";

Deno.test("createMentionCommandTester: createContext", () => {
  const { createContext } = createReactionCommandTester();

  let ctx = createContext("owl");
  assertEquals(ctx.event.emoji, "owl");

  ctx = createContext("owl", { event: { channelId: "OVERRIDE_CHANNEL_ID" } });
  assertEquals(ctx.event.channelId, "OVERRIDE_CHANNEL_ID");
});

Deno.test("createMentionCommandTester: dispatch", async () => {
  const owl = createReactionCommand({
    name: "owl",
    examples: [":owl: - hoot!"],
    emojis: ["owl"],
    execute: (c) => c.res.message("hoot!"),
  });
  const { createContext, dispatch } = createReactionCommandTester(owl);
  const ctx = createContext("owl");

  const res = await dispatch(ctx);

  assert(res.type === "message");
  assertEquals(res.text, "hoot!");
});
