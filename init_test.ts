import {
  assert,
  assertEquals,
  assertSnapshot,
  copy,
  join,
} from "./dev_deps.ts";

Deno.test("init", async (t) => {
  const initFilePath = await Deno.realPath("./init.ts");
  const tempDir = await Deno.makeTempDir();
  await copy("./fixtures/slack-create-blank-project", tempDir, {
    overwrite: true,
  });

  Deno.chdir(tempDir);
  const cmd = new Deno.Command("deno", { args: ["run", "-A", initFilePath] });
  const res = await cmd.output();

  await t.step("check stdout", async () => {
    const stdout = new TextDecoder().decode(res.stdout);
    const stderr = new TextDecoder().decode(res.stderr);
    assertEquals(res.code, 0, stderr);
    await assertSnapshot(t, stdout);
  });

  await t.step("check bot/", async () => {
    const statMention = await Deno.stat(
      join(tempDir, "bot", "mention", "mod.ts"),
    );
    const statMessage = await Deno.stat(
      join(tempDir, "bot", "message", "mod.ts"),
    );
    const statReaction = await Deno.stat(
      join(tempDir, "bot", "reaction", "mod.ts"),
    );
    assert(statMention.isFile);
    assert(statMessage.isFile);
    assert(statReaction.isFile);

    const dispatchersBody = await Deno.readTextFile(
      join(tempDir, "bot", "dispatchers.ts"),
    );
    await assertSnapshot(t, dispatchersBody);

    const configBody = await Deno.readTextFile(
      join(tempDir, "bot", "config.ts"),
    );
    await assertSnapshot(t, configBody);
  });

  await t.step("check functions/", async () => {
    const mentionBody = await Deno.readTextFile(
      join(tempDir, "functions", "bot_mention_command.ts"),
    );
    await assertSnapshot(t, mentionBody);

    const messageBody = await Deno.readTextFile(
      join(tempDir, "functions", "bot_message_command.ts"),
    );
    await assertSnapshot(t, messageBody);

    const reactionBody = await Deno.readTextFile(
      join(tempDir, "functions", "bot_reaction_command.ts"),
    );
    await assertSnapshot(t, reactionBody);

    const bodyRepondAsBot = await Deno.readTextFile(
      join(tempDir, "functions", "respond_as_bot.ts"),
    );
    await assertSnapshot(t, bodyRepondAsBot);
  });

  await t.step("check triggers/", async () => {
    const mentionBody = await Deno.readTextFile(
      join(tempDir, "triggers", "bot_mention_command.ts"),
    );
    await assertSnapshot(t, mentionBody);

    const messageBody = await Deno.readTextFile(
      join(tempDir, "triggers", "bot_message_command.ts"),
    );
    await assertSnapshot(t, messageBody);

    const reactionBody = await Deno.readTextFile(
      join(tempDir, "triggers", "bot_reaction_command.ts"),
    );
    await assertSnapshot(t, reactionBody);
  });

  await t.step("check workflows/", async () => {
    const mentionBody = await Deno.readTextFile(
      join(tempDir, "workflows", "bot_mention_command.ts"),
    );
    await assertSnapshot(t, mentionBody);

    const messageBody = await Deno.readTextFile(
      join(tempDir, "workflows", "bot_message_command.ts"),
    );
    await assertSnapshot(t, messageBody);

    const reactionBody = await Deno.readTextFile(
      join(tempDir, "workflows", "bot_reaction_command.ts"),
    );
    await assertSnapshot(t, reactionBody);
  });

  await t.step("check manifest.ts", async () => {
    const content = await Deno.readTextFile(join(tempDir, "manifest.ts"));
    await assertSnapshot(t, content);
  });

  await t.step("check import_map.json", async () => {
    const content = await Deno.readTextFile(join(tempDir, "import_map.json"));
    await assertSnapshot(t, content);
  });
});
