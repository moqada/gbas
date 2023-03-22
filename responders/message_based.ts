import { SlackAPIClient } from "deno-slack-api/types.ts";
import { createMessageText, SlackMessageResponse } from "../slack_utils.ts";
import {
  MessageBotResponse,
  NoneBotResponse,
  ReactionBotResponse,
} from "../types.ts";

type PostMessageOption = Partial<Omit<MessageBotResponse, "type" | "text">> & {
  mentionUserIds?: string[];
};
type AddReactionOption = Partial<Omit<ReactionBotResponse, "type" | "emoji">>;
export type MessageBasedResponderContext = {
  /**
   * interrupt response methods of the bot
   */
  interrupt: {
    /**
     * add an emoji reaction to a message
     */
    addReaction: (
      emoji: string,
      opts?: AddReactionOption,
    ) => Promise<void>;
    /**
     * post a message to a channel
     */
    postMessage: (
      text: string,
      opts?: PostMessageOption,
    ) => Promise<SlackMessageResponse>;
  };
  /**
   * final response methods of the bot
   */
  res: {
    /**
     * create a message response for posting a message to a channel
     */
    message: (text: string, opts?: PostMessageOption) => MessageBotResponse;
    /**
     * create a response for do nothing
     */
    none: () => NoneBotResponse;
    /**
     * create a reaction response for adding an emoji reaction to a message
     */
    reaction: (emoji: string, opts?: AddReactionOption) => ReactionBotResponse;
  };
};

export const createMessageBasedResponderContext = (
  { client, threadTs, channelId, messageTs }: {
    client: SlackAPIClient;
    channelId: string;
    messageTs: string;
    threadTs?: string;
  },
): MessageBasedResponderContext => {
  return {
    interrupt: {
      addReaction: async (emoji, opts) => {
        const res = await client.reactions.add({
          name: emoji,
          channel: opts?.channelId || channelId,
          timestamp: opts?.messageTs || messageTs,
        });
        if (!res.ok) {
          throw new Error(res.error);
        }
      },
      postMessage: async (text, { mentionUserIds, ...opts } = {}) => {
        const res = await client.chat.postMessage({
          channel: opts?.channelId || channelId,
          text: createMessageText({ text, mentionUserIds }),
          thread_ts: threadTs,
          ...("threadTs" in opts ? { thread_ts: opts.threadTs } : {}),
          reply_broadcast: opts?.isReplyBroadcast,
          icon_emoji: opts?.iconEmoji,
          username: opts?.username,
        });
        if (!res.ok) {
          throw new Error(res.error);
        }
        return {
          type: "message",
          channelId: res.channel,
          messageTs: res.message.ts,
          text: res.message.text,
          userId: res.message.user,
          raw: res,
          ...(res.message.thread_ts ? { threadTs: res.message.thread_ts } : {}),
        };
      },
    },
    res: {
      message: (text, { mentionUserIds, ...opts } = {}) => {
        return {
          type: "message",
          channelId,
          text: createMessageText({ text, mentionUserIds }),
          ...(threadTs ? { threadTs } : {}),
          ...opts,
        };
      },
      none: () => ({ type: "none" }),
      reaction: (emoji, opts) => {
        return {
          emoji,
          type: "reaction",
          channelId,
          messageTs,
          ...opts,
        };
      },
    },
  };
};
