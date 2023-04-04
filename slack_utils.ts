import { SlackAPIClient } from "deno-slack-api/types.ts";

export type SlackMessageResponse = {
  type: "message";
  userId: string;
  channelId: string;
  text: string;
  messageTs: string;
  threadTs?: string;
  // deno-lint-ignore no-explicit-any
  raw: any;
};

export const getThreadTs = async (
  { client, messageTs, channelId }: {
    channelId: string;
    client: SlackAPIClient;
    messageTs: string;
  },
) => {
  const res = await client.chat.getPermalink({
    message_ts: messageTs,
    channel: channelId,
  });
  if (!res.ok) {
    console.error(res.error);
    return undefined;
  }
  const url = new URL(res.permalink);
  const threadTs = url.searchParams.get("thread_ts");
  return threadTs || undefined;
};

export const createMessageText = (
  { mentionUserIds = [], text }: { mentionUserIds?: string[]; text: string },
) => {
  return mentionUserIds.length > 0
    ? `${mentionUserIds.map((id) => `<@${id}>`).join(" ")} ${text}`
    : text;
};
