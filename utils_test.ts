import { assertMatch } from "./dev_deps.ts";
import { randomChoice } from "./utils.ts";

Deno.test("randomChoice", () => {
  assertMatch(randomChoice(["a", "b", "c", "d"]), /^(a|b|c|d)$/);
});
