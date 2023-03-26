import { SlackAPI } from "deno-slack-api/mod.ts";
import { createMessageCommand } from "./command_factory.ts";
import { MessageCommandDispatcher } from "./command_dispatcher.ts";
import { assertEquals } from "../../dev_deps.ts";
import { createMessageBasedResponderContext } from "../../responders/message_based.ts";
import { randomChoice } from "../../utils.ts";

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
    randomChoice,
    ...createMessageBasedResponderContext({ client, channelId, messageTs }),
  };
};

const hiCommand = createMessageCommand({
  examples: ["hi - say Hi! if find 'hi'"],
  name: "hi",
  pattern: /hi/i,
  execute: (c) => c.res.message("Hi!"),
});

Deno.test(".dispatch() execute matched command", async () => {
  const dispatcher = new MessageCommandDispatcher([hiCommand]);
  const ctx = createContext({ text: "abc hi def" });
  const res = await dispatcher.dispatch(ctx);
  assertEquals(res, {
    type: "message",
    channelId: ctx.event.channelId,
    text: "Hi!",
  });
});

Deno.test('.dispatch() return "none" response if it is mention', async () => {
  const dispatcher = new MessageCommandDispatcher([hiCommand]);
  const ctx = createContext({ text: "<@BOT> hi" });
  const res = await dispatcher.dispatch(ctx);
  assertEquals(res, { type: "none" });
});

Deno.test(".register() add extra commands after new", async () => {
  const dispatcher = new MessageCommandDispatcher([hiCommand]);
  const ctx = createContext({ text: "hi" });
  let res = await dispatcher.dispatch(ctx);
  assertEquals(res, {
    type: "message",
    channelId: ctx.event.channelId,
    text: "Hi!",
  });

  // unmatched message return "none" response
  const unknownCommandCtx = {
    ...ctx,
    event: { ...ctx.event, text: "hello" },
  };
  res = await dispatcher.dispatch(unknownCommandCtx);
  assertEquals(res, { type: "none" });

  // change response if command added
  dispatcher.register(createMessageCommand({
    name: "hello",
    examples: ["hello - say Hello!"],
    pattern: /^hello/i,
    execute: (c) => c.res.message("Hello!"),
  }));
  res = await dispatcher.dispatch(unknownCommandCtx);
  assertEquals(res, {
    type: "message",
    channelId: unknownCommandCtx.event.channelId,
    text: "Hello!",
  });
});

Deno.test(".outgoingDomains", () => {
  const dispatcher = new MessageCommandDispatcher([
    hiCommand,
    createMessageCommand({
      name: "dummy1",
      examples: [],
      execute: (c) => c.res.none(),
      pattern: /dummy/,
      outgoingDomains: ["example.com"],
    }),
    createMessageCommand({
      name: "dummy1",
      examples: [],
      execute: (c) => c.res.none(),
      pattern: /dummy/,
      outgoingDomains: ["example.com", "github.com"],
    }),
  ]);
  assertEquals(dispatcher.outgoingDomains, ["example.com", "github.com"]);
});
