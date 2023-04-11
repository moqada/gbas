import { assertEquals } from "https://deno.land/std@0.180.0/testing/asserts.ts";
import { assertMatch } from "./dev_deps.ts";
import { lowerCamelToSnake, randomChoice } from "./utils.ts";

Deno.test("randomChoice", () => {
  assertMatch(randomChoice(["a", "b", "c", "d"]), /^(a|b|c|d)$/);
});

Deno.test("snakeToCamel", () => {
  assertEquals(
    lowerCamelToSnake("lowerCamelCaseToSnakeCase"),
    "lower_camel_case_to_snake_case",
  );
});
