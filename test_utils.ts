import { MessageBasedResponderContext } from "./responders/message_based.ts";
import { createMessageText } from "./slack_utils.ts";

export const createMessageBasedResponderContextMock = (
  { channelId, messageTs, userId }: {
    channelId: string;
    messageTs: string;
    userId: string;
  },
): MessageBasedResponderContext => {
  return {
    interrupt: {
      addReaction: () => Promise.resolve(),
      deleteMessage: () => Promise.resolve(),
      postMessage: (text: string, opts = {}) =>
        Promise.resolve({
          text: createMessageText({
            mentionUserIds: opts.mentionUserIds,
            text,
          }),
          channelId,
          messageTs,
          type: "message",
          userId,
          raw: {},
          ...opts,
        }),
      updateMessage: (
        text: string,
        { mentionUserIds, isReplyBroadcast: _, ...opts },
      ) =>
        Promise.resolve({
          text: createMessageText({ mentionUserIds, text }),
          type: "message",
          userId,
          raw: {},
          ...opts,
        }),
    },
    res: {
      message: (text: string, opts = {}) => ({
        text: createMessageText({
          mentionUserIds: opts.mentionUserIds,
          text,
        }),
        channelId,
        type: "message",
        userId,
        ...opts,
      }),
      none: () => ({ type: "none" }),
      reaction: (emoji: string, opts = {}) => ({
        emoji,
        channelId,
        messageTs,
        type: "reaction",
        ...opts,
      }),
    },
  };
};
