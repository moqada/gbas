import { createMessageCommandTester } from "gbas/mod.ts";
import { assert, assertEquals } from "std/testing/asserts.ts";
import { messageCommandDispatcher } from "../dispatchers.ts";

const { createContext } = createMessageCommandTester();

Deno.test("hello responds hello!", async () => {
  const res = await messageCommandDispatcher.dispatch(createContext("hello"));
  assert(res.type === "message");
  assertEquals(res.text, "<@USER> hello!");
});
