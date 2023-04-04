import { createMessageCommandTester } from "gbas/mod.ts";
import {
  assert,
  assertEquals,
  assertObjectMatch,
} from "std/testing/asserts.ts";
import { messageCommandDispatcher } from "../dispatchers.ts";

const { createContext } = createMessageCommandTester();

Deno.test("hello responds hello!", async () => {
  const ctx = createContext("hello");
  const res = await messageCommandDispatcher.dispatch(createContext("hello"));
  assert(res.type === "message");
  assertEquals(res.text, "<@USER> hello!");
});
