import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals, mockFetch } from "../dev_deps.ts";
import { createRespondAsBotSlackFunction } from "./respond_as_bot.ts";

const { createContext: createContextForType } = SlackFunctionTester(
  createRespondAsBotSlackFunction({
    sourceFile: "foo/bar/dummy.ts",
    callbackId: "dummy",
  }).def,
);
type SlackFunctionInputs = Parameters<typeof createContextForType>[0]["inputs"];

mockFetch.install();

const setup = (
  { slackFuncConfig }: {
    slackFuncConfig: ReturnType<typeof createRespondAsBotSlackFunction>;
  },
) => {
  const chatPostMessageCalls: Record<string, unknown>[] = [];
  const reactionsAddCalls: Record<string, unknown>[] = [];
  mockFetch.mock("POST@/api/chat.postMessage", async (req) => {
    const params: Record<string, unknown> = {};
    const formData = await req.formData();
    for (const [key, val] of formData.entries()) {
      params[key] = val;
    }
    chatPostMessageCalls.push(params);
    return new Response(JSON.stringify({}), { status: 200 });
  });
  mockFetch.mock("POST@/api/reactions.add", async (req) => {
    const params: Record<string, unknown> = {};
    const formData = await req.formData();
    for (const [key, val] of formData.entries()) {
      params[key] = val;
    }
    reactionsAddCalls.push(params);
    return new Response(JSON.stringify({}), { status: 200 });
  });
  const { createContext } = SlackFunctionTester(slackFuncConfig.def);
  return { chatPostMessageCalls, reactionsAddCalls, createContext };
};

Deno.test(
  "it does nothing if type: none inputs",
  async () => {
    const slackFuncConfig = createRespondAsBotSlackFunction({
      sourceFile: "foo/bar.ts",
    });
    const { chatPostMessageCalls, reactionsAddCalls, createContext } = setup({
      slackFuncConfig,
    });
    const inputs = { type: "none" };
    await slackFuncConfig.func(
      createContext({ inputs }),
    );
    assertEquals(chatPostMessageCalls, []);
    assertEquals(reactionsAddCalls, []);
  },
);

Deno.test(
  "it calls chat.postMessage if type: message inputs",
  () => {
    const channelId = "DUMMYCHANNELID";
    const text = "DUMMY_TEXT";
    const type = "message";
    const slackFuncConfig = createRespondAsBotSlackFunction({
      sourceFile: "foo/bar.ts",
    });
    const testCases: Array<{
      expected: Array<Record<string, unknown>>;
      inputs: SlackFunctionInputs;
    }> = [{
      expected: [{ channel: channelId, text }],
      inputs: { type, channelId, text },
    }, {
      expected: [{ channel: channelId, text, thread_ts: "123456789.123" }],
      // reply in the thread
      inputs: { type, channelId, text, threadTs: "123456789.123" },
    }, {
      expected: [{ channel: channelId, text, reply_broadcast: "true" }],
      // reply to broadcast
      inputs: { type, channelId, text, isReplyBroadcast: true },
    }, {
      expected: [{ channel: channelId, text, icon_emoji: "sushi" }],
      // iconEmoji
      inputs: { type, channelId, text, iconEmoji: "sushi" },
    }, {
      expected: [{ channel: channelId, text, username: "sushi-taro" }],
      // username
      inputs: { type, channelId, text, username: "sushi-taro" },
    }, {
      expected: [{
        channel: channelId,
        blocks: JSON.stringify([{
          type: "section",
          text: { type: "plain_text", text },
        }]),
      }],
      // isMrkdwn
      inputs: { type, channelId, text, isMrkdwn: false },
    }];
    testCases.forEach(async ({ expected, inputs }) => {
      const { chatPostMessageCalls, reactionsAddCalls, createContext } = setup({
        slackFuncConfig,
      });
      await slackFuncConfig.func(
        createContext({ inputs }),
      );
      assertEquals(chatPostMessageCalls, expected);
      assertEquals(reactionsAddCalls, []);
    });
  },
);

Deno.test(
  "it calls reactions.add if type: reaction inputs",
  async () => {
    const channelId = "DUMMYCHANNELID";
    const emoji = "DUMMY_EMOJI";
    const messageTs = "1234";
    const slackFuncConfig = createRespondAsBotSlackFunction({
      sourceFile: "foo/bar.ts",
    });
    const { chatPostMessageCalls, reactionsAddCalls, createContext } = setup({
      slackFuncConfig,
    });
    const inputs = {
      type: "reaction",
      channelId,
      emoji,
      messageTs,
    };
    await slackFuncConfig.func(
      createContext({ inputs }),
    );
    assertEquals(chatPostMessageCalls, []);
    assertEquals(reactionsAddCalls, [{
      channel: channelId,
      name: emoji,
      timestamp: messageTs,
    }]);
  },
);
