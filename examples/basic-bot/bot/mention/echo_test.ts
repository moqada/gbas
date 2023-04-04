import { createMentionCommandTester } from "gbas/mod.ts";
import { mentionCommandDispatcher } from "../dispatchers.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";

const { createContext } = createMentionCommandTester();
Deno.test("send same text", async () => {
  const res = await mentionCommandDispatcher.dispatch(
    createContext("<@BOT> echo foo"),
  );
  assert(res.type === "message");
  assertEquals(res.text, "foo");
});
