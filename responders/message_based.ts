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
     * delete a message
     */
    deleteMessage: (
      opts: { channelId: string; messageTs: string },
    ) => Promise<void>;
    /**
     * post a message to a channel
     */
    postMessage: (
      text: string,
      opts?: PostMessageOption,
    ) => Promise<SlackMessageResponse>;
    /**
     * update a message
     */
    updateMessage: (
      text: string,
      opts: {
        channelId: string;
        messageTs: string;
        mentionUserIds?: string[];
        isReplyBroadcast?: boolean;
      },
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
      deleteMessage: async (
        { channelId, messageTs }: { channelId: string; messageTs: string },
      ) => {
        const res = await client.chat.delete({
          channel: channelId,
          ts: messageTs,
        });
        if (!res.ok) {
          throw new Error(res.error);
        }
      },
      postMessage: async (
        text,
        { mentionUserIds, isMrkdwn = true, ...opts } = {},
      ) => {
        // this is a workaround the "mrkdwn" param is not working now (2023/03/26)
        // normally, to disable mrkdwn set `{text, mrkdwn: false}` only.
        const mainParams = isMrkdwn
          ? {
            text: createMessageText({ text, mentionUserIds }),
          }
          : {
            blocks: [
              {
                type: "section",
                text: {
                  type: "plain_text",
                  text: createMessageText({ text, mentionUserIds }),
                },
              },
            ],
          };
        const res = await client.chat.postMessage({
          ...mainParams,
          channel: opts?.channelId || channelId,
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
      updateMessage: async (
        text,
        { channelId, messageTs, mentionUserIds, ...opts },
      ) => {
        const res = await client.chat.update({
          channel: channelId,
          ts: messageTs,
          text: createMessageText({ text, mentionUserIds }),
          reply_broadcast: opts?.isReplyBroadcast,
        });
        if (!res.ok) {
          throw new Error(res.error);
        }
        return {
          type: "message",
          channelId: res.channel,
          messageTs: res.ts,
          text: res.message.text,
          userId: res.message.user,
          raw: res,
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
