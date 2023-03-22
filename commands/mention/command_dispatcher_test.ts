import { SlackAPI } from "deno-slack-api/mod.ts";
import { createMentionCommand } from "./command_factory.ts";
import { MentionCommandDispatcher } from "./command_dispatcher.ts";
import { assertEquals } from "../../dev_deps.ts";
import { createMessageBasedResponderContext } from "../../responders/message_based.ts";

const createContext = ({ text }: { text: string }) => {
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
      channelType: "public",
      text,
      messageTs: "123456789.123",
      type: "message" as const,
      userId: "USERID",
    },
    ...createMessageBasedResponderContext({ client, channelId, messageTs }),
  };
};

const pingCommand = createMentionCommand({
  examples: [],
  name: "ping",
  pattern: /^ping$/i,
  execute: (c) => c.res.message("PONG"),
});

Deno.test(".dispatch() execute matched command", async () => {
  const dispatcher = new MentionCommandDispatcher([pingCommand]);
  const ctx = createContext({ text: "<@BOT> ping" });
  const res = await dispatcher.dispatch(ctx);
  assertEquals(res, {
    type: "message",
    channelId: ctx.event.channelId,
    text: "PONG",
  });
});

Deno.test('.dispatch() return "none" response if the head of mention is not a bot user', async () => {
  const dispatcher = new MentionCommandDispatcher([pingCommand]);
  const ctx = createContext({ text: "<@NOT_BOT_USER> <@BOT> ping" });
  const res = await dispatcher.dispatch(ctx);
  assertEquals(res, { type: "none" });
});

Deno.test(".register() add extra commands after new", async () => {
  const dispatcher = new MentionCommandDispatcher([pingCommand]);
  const ctx = createContext({ text: "<@BOT> ping" });
  let res = await dispatcher.dispatch(ctx);
  assertEquals(res, {
    type: "message",
    channelId: ctx.event.channelId,
    text: "PONG",
  });

  // unknown command return "none" response
  const unknownCommandCtx = {
    ...ctx,
    event: { ...ctx.event, text: "<@BOT> hello" },
  };
  res = await dispatcher.dispatch(unknownCommandCtx);
  assertEquals(res, {
    type: "message",
    channelId: unknownCommandCtx.event.channelId,
    text: "command not found",
  });

  // change response if command added
  dispatcher.register(createMentionCommand({
    name: "hello",
    examples: [],
    pattern: /^hello/i,
    execute: (c) => c.res.message("hello!"),
  }));
  res = await dispatcher.dispatch(unknownCommandCtx);
  assertEquals(res, {
    type: "message",
    channelId: unknownCommandCtx.event.channelId,
    text: "hello!",
  });
});

Deno.test(".outgoingDomains", () => {
  const dispatcher = new MentionCommandDispatcher([
    pingCommand,
    createMentionCommand({
      name: "dummy1",
      examples: [],
      execute: (c) => c.res.none(),
      pattern: /dummy/,
      outgoingDomains: ["example.com"],
    }),
    createMentionCommand({
      name: "dummy1",
      examples: [],
      execute: (c) => c.res.none(),
      pattern: /dummy/,
      outgoingDomains: ["example.com", "github.com"],
    }),
  ]);
  assertEquals(dispatcher.outgoingDomains, ["example.com", "github.com"]);
});
