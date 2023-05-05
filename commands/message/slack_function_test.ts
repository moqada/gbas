import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import {
  assertEquals,
  assertInstanceOf,
  assertObjectMatch,
  mock,
  mockFetch,
} from "../../dev_deps.ts";
import { createMessageCommand } from "./command_factory.ts";
import { MessageCommandDispatcher } from "./command_dispatcher.ts";
import { createMessageCommandSlackFunction } from "./slack_function.ts";

mockFetch.install();

type GetPermalinkResponse = {
  ok: true;
  permalink: string;
  channel: string;
} | {
  ok: false;
  error: string;
};
type AuthTestResponse = {
  ok: true;
  user_id: string;
} | {
  ok: false;
  error: string;
};

const BOT_USER_ID = "DUMMYBOTUSERID";
const DEFAULT_CHANNEL_ID = "DUMMYCHANNELID";
const defaultResAuthTest = {
  ok: true as const,
  user_id: BOT_USER_ID,
};
const defaultGetPermalinkResponse = {
  ok: true as const,
  channel: DEFAULT_CHANNEL_ID,
  permalink:
    `https://example.com/archives/C1H9RESGL/p135854651700023?cid=C1H9RESGL`,
};

const setup = (
  {
    resAuthTest = defaultResAuthTest,
    resGetPermalink = defaultGetPermalinkResponse,
    slackFuncConfig,
  }: {
    resAuthTest?: AuthTestResponse;
    resGetPermalink?: GetPermalinkResponse;
    slackFuncConfig: ReturnType<typeof createMessageCommandSlackFunction>;
  },
) => {
  mockFetch.mock("POST@/api/chat.getPermalink", () => {
    return new Response(JSON.stringify(resGetPermalink), { status: 200 });
  });
  mockFetch.mock("POST@/api/auth.test", () => {
    return new Response(JSON.stringify(resAuthTest), { status: 200 });
  });
  const { createContext } = SlackFunctionTester(slackFuncConfig.def);

  return { createContext };
};

const createDefaultMentionCommandDispatcher = () =>
  new MessageCommandDispatcher([
    createMessageCommand({
      examples: ["hi - say Hi!"],
      execute: (c) => c.res.message("Hi!"),
      name: "hi",
      pattern: /hi/i,
    }),
  ]);

Deno.test(
  "it returns message output if matched handlers exists",
  async () => {
    const dispatcher = createDefaultMentionCommandDispatcher();
    const slackFuncConfig = createMessageCommandSlackFunction({
      dispatcher,
      sourceFile: "foo/bar.ts",
    });
    const { createContext } = setup({ slackFuncConfig });
    const inputs = {
      channelId: DEFAULT_CHANNEL_ID,
      channelType: "DUMMYCHANNELTYPE",
      userId: "DUMMYUSERID",
      message: "hi",
      messageTs: "1673778812501.0",
    };
    const spyDispatch = mock.spy(dispatcher, "dispatch");
    const res = await slackFuncConfig.func(createContext({ inputs }));

    // commandDispatcher.dispatch called with valid args
    mock.assertSpyCalls(spyDispatch, 1);
    assertEquals(spyDispatch.calls[0].args.length, 1);
    const dispatchArg = spyDispatch.calls[0].args[0];
    assertObjectMatch(dispatchArg, {
      authUserId: BOT_USER_ID,
      env: {},
      event: {
        channelId: inputs.channelId,
        channelType: inputs.channelType,
        messageTs: inputs.messageTs,
        text: inputs.message,
        type: "message",
        userId: inputs.userId,
      },
      token: "slack-function-test-token",
    });
    // include SlackAPI
    assertInstanceOf(dispatchArg.client.setSlackApiUrl, Function);
    assertInstanceOf(dispatchArg.client.apiCall, Function);
    assertInstanceOf(dispatchArg.client.response, Function);
    // include MessageResponder context
    assertInstanceOf(dispatchArg.res.message, Function);
    assertInstanceOf(dispatchArg.res.none, Function);
    assertInstanceOf(dispatchArg.res.reaction, Function);
    assertInstanceOf(dispatchArg.interrupt.addReaction, Function);
    assertInstanceOf(dispatchArg.interrupt.postMessage, Function);

    // return with command output
    assertEquals(res, {
      outputs: {
        type: "message",
        channelId: inputs.channelId,
        text: "Hi!",
      },
    });
  },
);

Deno.test(
  "it returns message output with threadTs if matched handlers exists and mentioned in the thread",
  async () => {
    const threadTs = "1358546515.000008";
    const dispatcher = createDefaultMentionCommandDispatcher();
    const slackFuncConfig = createMessageCommandSlackFunction({
      dispatcher,
      sourceFile: "foo/bar.ts",
    });
    const inputs = {
      channelId: DEFAULT_CHANNEL_ID,
      channelType: "DUMMYCHANNELTYPE",
      userId: "DUMMYUSERID",
      message: "hi",
      messageTs: "1673778812501.0",
    };
    const { createContext } = setup({
      resGetPermalink: {
        ok: true,
        channel: inputs.channelId,
        permalink:
          `https://example.com/archives/C1H9RESGL/p135854651700023?thread_ts=${threadTs}&cid=C1H9RESGL`,
      },
      slackFuncConfig,
    });
    const res = await slackFuncConfig.func(createContext({ inputs }));
    assertEquals(res.outputs, {
      type: "message",
      channelId: inputs.channelId,
      text: "Hi!",
      threadTs,
    });
  },
);

Deno.test(
  "it returns none output if the message is sent by the bot",
  async () => {
    const dispatcher = createDefaultMentionCommandDispatcher();
    const slackFuncConfig = createMessageCommandSlackFunction({
      dispatcher,
      sourceFile: "foo/bar.ts",
    });
    const inputs = {
      channelId: DEFAULT_CHANNEL_ID,
      channelType: "DUMMYCHANNELTYPE",
      // this message was sent by own
      userId: BOT_USER_ID,
      message: "hi",
      messageTs: "1673778812501.0",
    };
    const { createContext } = setup({ slackFuncConfig });
    const res = await slackFuncConfig.func(createContext({ inputs }));
    assertEquals(res.outputs, { type: "none" });
  },
);

Deno.test(
  "it returns none output if the message is sent by the app",
  async () => {
    const dispatcher = createDefaultMentionCommandDispatcher();
    const slackFuncConfig = createMessageCommandSlackFunction({
      dispatcher,
      sourceFile: "foo/bar.ts",
    });
    const inputs = {
      channelId: DEFAULT_CHANNEL_ID,
      channelType: "DUMMYCHANNELTYPE",
      // this message was sent by app
      // a value becomes " " because workaround if event.data.user_id is null in message event trigger.
      userId: " ",
      message: "hi",
      messageTs: "1673778812501.0",
    };
    const { createContext } = setup({ slackFuncConfig });
    const res = await slackFuncConfig.func(createContext({ inputs }));
    assertEquals(res.outputs, { type: "none" });
  },
);

Deno.test(
  'it returns "error" output if matched handlers throw error',
  async () => {
    const dispatcher = new MessageCommandDispatcher([
      createMessageCommand({
        examples: ["hi - say Hi!"],
        execute: () => {
          throw new Error("always throw error");
        },
        name: "hi",
        pattern: /hi/i,
      }),
    ]);
    let slackFuncConfig = createMessageCommandSlackFunction({
      dispatcher,
      sourceFile: "foo/bar.ts",
    });
    const { createContext } = setup({ slackFuncConfig });
    const inputs = {
      channelId: DEFAULT_CHANNEL_ID,
      channelType: "DUMMYCHANNELTYPE",
      userId: "DUMMYUSERID",
      message: "hi",
      messageTs: "1673778812501.0",
    };
    let res = await slackFuncConfig.func(createContext({ inputs }));
    assertEquals(res.outputs, {
      type: "message",
      channelId: inputs.channelId,
      text: "Error: `Error: always throw error`",
    });

    // respondOnError override message
    slackFuncConfig = createMessageCommandSlackFunction({
      dispatcher,
      respondOnError: (err, c) => {
        return c.res.message(`overridden: ${err}`);
      },
      sourceFile: "foo/bar.ts",
    });
    res = await slackFuncConfig.func(createContext({ inputs }));
    assertEquals(res.outputs, {
      type: "message",
      channelId: inputs.channelId,
      text: "overridden: Error: always throw error",
    });
  },
);

Deno.test(
  'it returns "none" output and call interrupt methods if call with isQuickResponseEnabled',
  async () => {
    const apiCalls: Record<string, unknown>[] = [];
    mockFetch.mock("POST@/api/chat.postMessage", async (c) => {
      const formData = await c.formData();
      const params: Record<string, unknown> = {};
      for (const [key, val] of formData.entries()) {
        params[key] = val;
      }
      apiCalls.push(params);
      return new Response(
        JSON.stringify({
          ok: true,
          channel: params.channel,
          message: {
            text: params.text,
            ts: "123456789.123",
            user: BOT_USER_ID,
          },
        }),
        { status: 200 },
      );
    });
    const dispatcher = createDefaultMentionCommandDispatcher();
    const slackFuncConfig = createMessageCommandSlackFunction({
      dispatcher,
      sourceFile: "foo/bar.ts",
    });
    const inputs = {
      channelId: DEFAULT_CHANNEL_ID,
      channelType: "DUMMYCHANNELTYPE",
      userId: "DUMMYUSERID",
      message: "hi",
      messageTs: "1673778812501.0",
      isQuickResponseEnabled: true,
    };
    const { createContext } = setup({ slackFuncConfig });
    const res = await slackFuncConfig.func(createContext({ inputs }));
    assertEquals(res.outputs, { type: "none" });
    assertEquals(apiCalls, [{ channel: inputs.channelId, text: "Hi!" }]);
  },
);
