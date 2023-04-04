import { createReactionCommandTester } from "gbas/mod.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";
import { reactionCommandDispatcher } from "../dispatchers.ts";

const { createContext } = createReactionCommandTester();

Deno.test("owl", async () => {
  const c = createContext("owl");
  const res = await reactionCommandDispatcher.dispatch(c);
  assert(res.type === "message", res.type);
  assertEquals(res.text, "<@USER> hou");
});
