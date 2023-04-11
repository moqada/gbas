import { SlackAPI } from "deno-slack-api/mod.ts";
import {
  assertEquals,
  assertExists,
  assertObjectMatch,
  mockFetch,
} from "../dev_deps.ts";
import { createMessageBasedResponderContext } from "./message_based.ts";

mockFetch.install();

Deno.test("res.message()", () => {
  const channelId = "TESTCHANNELID";
  const messageTs = "123456789.123";
  const text = "hello";
  const type = "message";
  const ctx = createMessageBasedResponderContext({
    client: SlackAPI("slack-test-token"),
    channelId,
    messageTs,
  });
  const testCases: Array<{
    expected: ReturnType<typeof ctx.res.message>;
    opts: Parameters<typeof ctx.res.message>[1];
  }> = [{
    expected: { channelId, type, text },
    // default
    opts: undefined,
  }, {
    expected: { channelId, text: "<@USERID1> <@USERID2> hello", type },
    // with mentions
    opts: { mentionUserIds: ["USERID1", "USERID2"] },
  }, {
    expected: { channelId, text, threadTs: "123456789.1234", type },
    // with threadTs
    opts: { threadTs: "123456789.1234" },
  }, {
    expected: { channelId, text, threadTs: undefined, type },
    // with threadTs  (force denied)
    opts: { threadTs: undefined },
  }, {
    expected: { channelId: "OTHERCHANNELID", text, type },
    // with channelId
    opts: { channelId: "OTHERCHANNELID" },
  }, {
    expected: { channelId, text, type, isMrkdwn: true },
    // with isMrkdwn
    opts: { isMrkdwn: true },
  }];
  testCases.forEach(({ expected, opts }) => {
    assertEquals(ctx.res.message(text, opts), expected);
  });
});

Deno.test("res.message() in the thread", () => {
  const channelId = "TESTCHANNELID";
  const threadTs = "123456789.123";
  const ctx = createMessageBasedResponderContext({
    client: SlackAPI("slack-test-token"),
    channelId,
    messageTs: "123456789.123",
    threadTs,
  });
  assertEquals(ctx.res.message("hello"), {
    channelId,
    text: "hello",
    type: "message",
    threadTs,
  });
});

Deno.test("res.reaction()", () => {
  const channelId = "TESTCHANNELID";
  const messageTs = "123456789.123";
  const emoji = "pray";
  const type = "reaction";
  const ctx = createMessageBasedResponderContext({
    client: SlackAPI("slack-test-token"),
    channelId,
    messageTs,
  });
  const testCases: Array<{
    expected: ReturnType<typeof ctx.res.reaction>;
    opts: Parameters<typeof ctx.res.reaction>[1];
  }> = [{
    expected: { channelId, emoji, messageTs, type },
    // default
    opts: undefined,
  }, {
    expected: { channelId: "OTHERCHANNELID", emoji, messageTs, type },
    // with channelId
    opts: { channelId: "OTHERCHANNELID" },
  }, {
    expected: { channelId, emoji, messageTs: "987654321.123", type },
    // with messageTs
    opts: { messageTs: "987654321.123" },
  }];
  testCases.forEach(({ expected, opts }) => {
    assertEquals(ctx.res.reaction(emoji, opts), expected);
  });
});

const setupPostMessage = ({ ts, user }: { ts: string; user: string }) => {
  const chatPostMessageCalls: Record<string, unknown>[] = [];
  mockFetch.mock("POST@/api/chat.postMessage", async (req) => {
    const params: Record<string, unknown> = {};
    const formData = await req.formData();
    for (const [key, val] of formData.entries()) {
      params[key] = val;
    }
    chatPostMessageCalls.push(params);
    return new Response(
      JSON.stringify({
        ok: true,
        channel: params.channel,
        message: {
          text: params.text,
          ts,
          user,
          ...(params.thread_ts ? { thread_ts: params.thread_ts } : {}),
        },
      }),
      { status: 200 },
    );
  });
  return { chatPostMessageCalls };
};

Deno.test("interrupt.postMessage()", () => {
  const userId = "BOTUSERID";
  const messageTs = "987654321.123";
  const channelId = "TESTCHANNELID";
  const eventMessageTs = "123456789.123";
  const text = "hello";
  const type = "message";
  const ctx = createMessageBasedResponderContext({
    client: SlackAPI("slack-function-test-token"),
    channelId,
    messageTs: eventMessageTs,
  });
  const testCases: Array<{
    expected: {
      res: Omit<Awaited<ReturnType<typeof ctx.interrupt.postMessage>>, "raw">;
      calls: Array<Record<string, unknown>>;
    };
    opts: Parameters<typeof ctx.interrupt.postMessage>[1];
  }> = [{
    expected: {
      calls: [{ channel: channelId, text }],
      res: { channelId, text, messageTs, type, userId },
    },
    // default
    opts: undefined,
  }, {
    expected: {
      calls: [{ channel: channelId, text: "<@USERID1> <@USERID2> hello" }],
      res: {
        channelId,
        text: "<@USERID1> <@USERID2> hello",
        messageTs,
        type,
        userId,
      },
    },
    // with mentions
    opts: { mentionUserIds: ["USERID1", "USERID2"] },
  }, {
    expected: {
      calls: [{ channel: channelId, text, thread_ts: "123456789.1234" }],
      res: {
        channelId,
        messageTs,
        text,
        threadTs: "123456789.1234",
        type,
        userId,
      },
    },
    // with threadTs
    opts: { threadTs: "123456789.1234" },
  }, {
    expected: {
      calls: [{ channel: "OTHERCHANNELID", text }],
      res: { channelId: "OTHERCHANNELID", messageTs, text, type, userId },
    },
    // with channelId
    opts: { channelId: "OTHERCHANNELID" },
  }, {
    expected: {
      calls: [{ channel: channelId, text, reply_broadcast: "true" }],
      res: { channelId, text, messageTs, type, userId },
    },
    // with isReplyBroadcast
    opts: { isReplyBroadcast: true },
  }, {
    expected: {
      calls: [{ channel: channelId, text, icon_emoji: "sushi" }],
      res: { channelId, text, messageTs, type, userId },
    },
    // with iconEmoji
    opts: { iconEmoji: "sushi" },
  }, {
    expected: {
      calls: [{ channel: channelId, text, username: "sushi-taro" }],
      res: { channelId, text, messageTs, type, userId },
    },
    // with username
    opts: { username: "sushi-taro" },
  }, {
    expected: {
      calls: [{
        channel: channelId,
        blocks: JSON.stringify([{
          type: "section",
          text: { type: "plain_text", text },
        }]),
      }],
      res: {
        channelId,
        // @ts-expect-error - actual is string, but workaround mock return undefined
        text: undefined,
        messageTs,
        type,
        userId,
      },
    },
    // with isMrkdwn
    opts: { isMrkdwn: false },
  }];
  testCases.forEach(async ({ expected, opts }) => {
    const { chatPostMessageCalls } = setupPostMessage({
      ts: messageTs,
      user: userId,
    });
    const res = await ctx.interrupt.postMessage(text, opts);
    assertEquals(chatPostMessageCalls, expected.calls);
    assertObjectMatch(res, expected.res);
    assertExists(res.raw);
  });
});

Deno.test("interrupt.postMessage() in the thread", async () => {
  const userId = "BOTUSERID";
  const messageTs = "987654321.123";
  const channelId = "TESTCHANNELID";
  const eventMessageTs = "123456789.123";
  const threadTs = "123456789.123";
  const text = "hello";
  const type = "message";
  const ctx = createMessageBasedResponderContext({
    client: SlackAPI("slack-function-test-token"),
    channelId,
    messageTs: eventMessageTs,
    threadTs,
  });
  const { chatPostMessageCalls } = setupPostMessage({
    ts: messageTs,
    user: userId,
  });
  const res = await ctx.interrupt.postMessage(text);
  assertEquals(chatPostMessageCalls, [{
    channel: channelId,
    text,
    thread_ts: threadTs,
  }]);
  assertObjectMatch(res, {
    channelId,
    text,
    messageTs,
    type,
    userId,
  });
  assertExists(res.raw);
});

const setupAddReaction = ({ ts, user }: { ts: string; user: string }) => {
  const reactionsAddCalls: Record<string, unknown>[] = [];
  mockFetch.mock("POST@/api/reactions.add", async (req) => {
    const params: Record<string, unknown> = {};
    const formData = await req.formData();
    for (const [key, val] of formData.entries()) {
      params[key] = val;
    }
    reactionsAddCalls.push(params);
    return new Response(
      JSON.stringify({
        ok: true,
        channel: params.channel,
        message: {
          text: params.text,
          ts,
          user,
          ...(params.thread_ts ? { thread_ts: params.thread_ts } : {}),
        },
      }),
      { status: 200 },
    );
  });
  return { reactionsAddCalls };
};

Deno.test("interrupt.addReaction()", () => {
  const channel = "TESTCHANNELID";
  const timestamp = "123456789.123";
  const name = "pray";
  const ctx = createMessageBasedResponderContext({
    client: SlackAPI("slack-function-test-token"),
    channelId: channel,
    messageTs: timestamp,
    threadTs: "123456789.123",
  });
  const testCases: Array<{
    expected: Array<Record<string, unknown>>;
    opts: Parameters<typeof ctx.interrupt.addReaction>[1];
  }> = [{
    expected: [{ channel, name, timestamp }],
    // default
    opts: undefined,
  }, {
    expected: [{ channel: "OTHERCHANNELID", name, timestamp }],
    // with channelId
    opts: { channelId: "OTHERCHANNELID" },
  }, {
    expected: [{ channel, name, timestamp: "987654321.1234" }],
    // with messageTs
    opts: { messageTs: "987654321.1234" },
  }];
  testCases.forEach(async ({ expected, opts }) => {
    const { reactionsAddCalls } = setupAddReaction({
      ts: timestamp,
      user: "BOTUSERID",
    });
    await ctx.interrupt.addReaction(name, opts);
    assertEquals(reactionsAddCalls, expected);
  });
});

const setupUpdateMessage = ({ ts, user }: { ts: string; user: string }) => {
  const chatUpdateMessageCalls: Record<string, unknown>[] = [];
  mockFetch.mock("POST@/api/chat.update", async (req) => {
    const params: Record<string, unknown> = {};
    const formData = await req.formData();
    for (const [key, val] of formData.entries()) {
      params[key] = val;
    }
    chatUpdateMessageCalls.push(params);
    return new Response(
      JSON.stringify({
        ok: true,
        channel: params.channel,
        text: params.text,
        ts,
        message: {
          text: params.text,
          user,
          ...(params.thread_ts ? { thread_ts: params.thread_ts } : {}),
        },
      }),
      { status: 200 },
    );
  });
  return { chatUpdateMessageCalls };
};

Deno.test("interrupt.updateMessage()", () => {
  const userId = "BOTUSERID";
  const messageTs = "987654321.123";
  const channelId = "TESTCHANNELID";
  const eventChannelId = "EVENTCHANNELID";
  const eventMessageTs = "123456789.123";
  const text = "hello";
  const type = "message";
  const ctx = createMessageBasedResponderContext({
    client: SlackAPI("slack-function-test-token"),
    channelId: eventChannelId,
    messageTs: eventMessageTs,
  });
  const testCases: Array<{
    expected: {
      res: Omit<Awaited<ReturnType<typeof ctx.interrupt.updateMessage>>, "raw">;
      calls: Array<Record<string, unknown>>;
    };
    opts: Parameters<typeof ctx.interrupt.updateMessage>[1];
  }> = [{
    expected: {
      calls: [{ channel: channelId, text, ts: messageTs }],
      res: { channelId, text, messageTs, type, userId },
    },
    // default
    opts: { channelId, messageTs },
  }, {
    expected: {
      calls: [{
        channel: channelId,
        text: "<@USERID1> <@USERID2> hello",
        ts: messageTs,
      }],
      res: {
        channelId,
        text: "<@USERID1> <@USERID2> hello",
        messageTs,
        type,
        userId,
      },
    },
    // with mentions
    opts: { channelId, messageTs, mentionUserIds: ["USERID1", "USERID2"] },
  }, {
    expected: {
      calls: [{
        channel: channelId,
        text,
        ts: messageTs,
        reply_broadcast: "true",
      }],
      res: { channelId, text, messageTs, type, userId },
    },
    // with isReplyBroadcast
    opts: { channelId, messageTs, isReplyBroadcast: true },
  }];
  testCases.forEach(async ({ expected, opts }) => {
    const { chatUpdateMessageCalls } = setupUpdateMessage({
      ts: messageTs,
      user: userId,
    });
    const res = await ctx.interrupt.updateMessage(text, opts);
    assertEquals(chatUpdateMessageCalls, expected.calls);
    assertObjectMatch(res, expected.res);
    assertExists(res.raw);
  });
});
