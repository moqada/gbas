import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import {
  assertEquals,
  assertInstanceOf,
  assertObjectMatch,
  mock,
  mockFetch,
} from "../../dev_deps.ts";
import { createMentionCommand } from "./command_factory.ts";
import { MentionCommandDispatcher } from "./command_dispatcher.ts";
import { createMentionCommandSlackFunction } from "./slack_function.ts";

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
    slackFuncConfig: ReturnType<typeof createMentionCommandSlackFunction>;
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
  new MentionCommandDispatcher([
    createMentionCommand({
      examples: ["ping - say PONG"],
      execute: (c) => c.res.message("PONG"),
      name: "ping",
      pattern: /^ping$/i,
    }),
  ]);

Deno.test(
  "it returns message output if matched handlers exists",
  async () => {
    const dispatcher = createDefaultMentionCommandDispatcher();
    const slackFuncConfig = createMentionCommandSlackFunction({
      dispatcher,
      sourceFile: "foo/bar.ts",
    });
    const { createContext } = setup({ slackFuncConfig });
    const inputs = {
      channelId: DEFAULT_CHANNEL_ID,
      channelType: "DUMMYCHANNELTYPE",
      userId: "DUMMYUSERID",
      message: `<@${BOT_USER_ID}> ping`,
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
        text: "PONG",
      },
    });
  },
);

Deno.test(
  "it returns message output with threadTs if matched handlers exists and mentioned in the thread",
  async () => {
    const threadTs = "1358546515.000008";
    const dispatcher = createDefaultMentionCommandDispatcher();
    const slackFuncConfig = createMentionCommandSlackFunction({
      dispatcher,
      sourceFile: "foo/bar.ts",
    });
    const inputs = {
      channelId: DEFAULT_CHANNEL_ID,
      channelType: "DUMMYCHANNELTYPE",
      userId: "DUMMYUSERID",
      message: `<@${BOT_USER_ID}> ping`,
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
      text: "PONG",
      threadTs,
    });
  },
);

Deno.test(
  "it returns none output if the message sent by bot",
  async () => {
    const dispatcher = createDefaultMentionCommandDispatcher();
    const slackFuncConfig = createMentionCommandSlackFunction({
      dispatcher,
      sourceFile: "foo/bar.ts",
    });
    const inputs = {
      channelId: DEFAULT_CHANNEL_ID,
      channelType: "DUMMYCHANNELTYPE",
      userId: BOT_USER_ID,
      message: `<@${BOT_USER_ID}> ping`,
      messageTs: "1673778812501.0",
    };
    const { createContext } = setup({ slackFuncConfig });
    const res = await slackFuncConfig.func(createContext({ inputs }));
    assertEquals(res.outputs, { type: "none" });
  },
);

Deno.test(
  'it returns "command not found" output if matched handlers does not exist',
  async () => {
    const dispatcher = createDefaultMentionCommandDispatcher();
    let slackFuncConfig = createMentionCommandSlackFunction({
      dispatcher,
      sourceFile: "foo/bar.ts",
    });
    let { createContext } = setup({ slackFuncConfig });
    const inputs = {
      channelId: DEFAULT_CHANNEL_ID,
      channelType: "DUMMYCHANNELTYPE",
      userId: "DUMMYUSERID",
      message: `<@${BOT_USER_ID}> DOES_NOT_EXIST_COMMAND`,
      messageTs: "1673778812501.0",
    };
    let res = await slackFuncConfig.func(createContext({ inputs }));
    assertEquals(res.outputs, {
      type: "message",
      channelId: inputs.channelId,
      text: "command not found",
    });

    // respondOnCommandNotFound override message
    slackFuncConfig = createMentionCommandSlackFunction({
      dispatcher,
      respondOnCommandNotFound: (c) =>
        c.res.message("overridden command not found"),
      sourceFile: "foo/bar.ts",
    });
    res = await slackFuncConfig.func(createContext({ inputs }));
    assertEquals(res.outputs, {
      type: "message",
      channelId: inputs.channelId,
      text: "overridden command not found",
    });
  },
);

Deno.test(
  'it returns "error" output if matched handlers throw error',
  async () => {
    const dispatcher = new MentionCommandDispatcher([
      createMentionCommand({
        examples: ["ping - say PONG"],
        execute: (c) => {
          throw new Error("always throw error");
        },
        name: "ping",
        pattern: /^ping$/i,
      }),
    ]);
    let slackFuncConfig = createMentionCommandSlackFunction({
      dispatcher,
      sourceFile: "foo/bar.ts",
    });
    let { createContext } = setup({ slackFuncConfig });
    const inputs = {
      channelId: DEFAULT_CHANNEL_ID,
      channelType: "DUMMYCHANNELTYPE",
      userId: "DUMMYUSERID",
      message: `<@${BOT_USER_ID}> ping`,
      messageTs: "1673778812501.0",
    };
    let res = await slackFuncConfig.func(createContext({ inputs }));
    assertEquals(res.outputs, {
      type: "message",
      channelId: inputs.channelId,
      text: "Error: `Error: always throw error`",
    });

    // respondOnError override message
    slackFuncConfig = createMentionCommandSlackFunction({
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
    const apiCalls: Record<string, any>[] = [];
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
    const slackFuncConfig = createMentionCommandSlackFunction({
      dispatcher,
      sourceFile: "foo/bar.ts",
    });
    const inputs = {
      channelId: DEFAULT_CHANNEL_ID,
      channelType: "DUMMYCHANNELTYPE",
      userId: "DUMMYUSERID",
      message: `<@${BOT_USER_ID}> ping`,
      messageTs: "1673778812501.0",
      isQuickResponseEnabled: true,
    };
    const { createContext } = setup({ slackFuncConfig });
    const res = await slackFuncConfig.func(createContext({ inputs }));
    assertEquals(res.outputs, { type: "none" });
    assertEquals(apiCalls, [{ channel: inputs.channelId, text: "PONG" }]);
  },
);
