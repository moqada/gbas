import { SlackAPI } from "deno-slack-api/mod.ts";
import { createReactionCommand } from "./command_factory.ts";
import { ReactionCommandDispatcher } from "./command_dispatcher.ts";
import { assertEquals } from "../../dev_deps.ts";
import { createMessageBasedResponderContext } from "../../responders/message_based.ts";
import { ReactionCommandContext } from "./types.ts";

const createContext = (
  { emoji }: { emoji: string },
): ReactionCommandContext => {
  const token = "slack-test-token";
  const client = SlackAPI(token);
  const channelId = "DUMMYCHANNELID";
  const messageTs = "123456789.123";
  return {
    client: SlackAPI("slack-test-token"),
    token: "slack-test-token",
    env: {},
    authUserId: "BOT",
    event: {
      channelId,
      emoji,
      messageTs: "123456789.123",
      type: "reaction" as const,
      userId: "USERID",
    },
    ...createMessageBasedResponderContext({ client, channelId, messageTs }),
  };
};

const bowCommand = createReactionCommand({
  examples: [":bow: - it's ok if bow"],
  name: "bow",
  emojis: ["bow"],
  execute: (c) => c.res.reaction("ok_man"),
});

Deno.test(".dispatch() execute matched command", async () => {
  const dispatcher = new ReactionCommandDispatcher([bowCommand]);
  const ctx = createContext({ emoji: "bow" });
  const res = await dispatcher.dispatch(ctx);
  assertEquals(res, {
    type: "reaction",
    channelId: ctx.event.channelId,
    messageTs: ctx.event.messageTs,
    emoji: "ok_man",
  });
});

Deno.test(".register() add extra commands after new", async () => {
  const dispatcher = new ReactionCommandDispatcher([bowCommand]);
  const ctx = createContext({ emoji: "bow" });
  let res = await dispatcher.dispatch(ctx);
  assertEquals(res, {
    type: "reaction",
    channelId: ctx.event.channelId,
    emoji: "ok_man",
    messageTs: ctx.event.messageTs,
  });

  // unmatched emoji return "none" response
  const unknownCommandCtx: ReactionCommandContext = {
    ...ctx,
    event: { ...ctx.event, emoji: "owl" },
  };
  res = await dispatcher.dispatch(unknownCommandCtx);
  assertEquals(res, { type: "none" });

  // change response if command added
  dispatcher.register(createReactionCommand({
    name: "owl",
    examples: [":owl: - say hou"],
    emojis: ["owl"],
    execute: (c) => c.res.message("hou"),
  }));
  res = await dispatcher.dispatch(unknownCommandCtx);
  assertEquals(res, {
    type: "message",
    channelId: unknownCommandCtx.event.channelId,
    text: "hou",
  });
});

Deno.test(".outgoingDomains", () => {
  const dispatcher = new ReactionCommandDispatcher([
    bowCommand,
    createReactionCommand({
      name: "dummy1",
      examples: [],
      execute: (c) => c.res.none(),
      emojis: ["dummy1"],
      outgoingDomains: ["example.com"],
    }),
    createReactionCommand({
      name: "dummy1",
      examples: [],
      execute: (c) => c.res.none(),
      emojis: ["dummy2"],
      outgoingDomains: ["example.com", "github.com"],
    }),
  ]);
  assertEquals(dispatcher.outgoingDomains, ["example.com", "github.com"]);
});
