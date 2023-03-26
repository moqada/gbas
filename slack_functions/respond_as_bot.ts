import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const respondAsBotFuncInputParameters = {
  properties: {
    // common
    type: { type: Schema.types.string },
    channelId: { type: Schema.slack.types.channel_id },
    // for message
    text: { type: Schema.types.string },
    threadTs: { type: Schema.types.string },
    iconEmoji: { type: Schema.types.string },
    isMrkdwn: { type: Schema.types.boolean },
    isReplyBroadcast: { type: Schema.types.boolean },
    username: { type: Schema.types.string },
    // for reaction
    emoji: { type: Schema.types.string },
    messageTs: { type: Schema.types.string },
  },
  required: ["type" as const],
};

export const createRespondAsBotSlackFunction = (
  { callbackId = "respond_as_bot", sourceFile }: {
    callbackId?: string;
    sourceFile: string;
  },
) => {
  const def = DefineFunction({
    callback_id: callbackId,
    title: "Respond as the bot",
    description: "Respond as the bot",
    source_file: sourceFile,
    input_parameters: respondAsBotFuncInputParameters,
  });
  const func = SlackFunction(
    def,
    async ({ client, inputs }) => {
      switch (inputs.type) {
        case "none":
          // do nothing
          break;
        case "message": {
          if (!inputs.channelId || !inputs.text) {
            throw new Error("channel_id is required");
          }
          const { isMrkdwn = true } = inputs;
          // this is a workaround the "mrkdwn" param is not working now (2023/03/26)
          // normally, to disable mrkdwn set `{text, mrkdwn: false}` only.
          const mainParams = isMrkdwn
            ? {
              text: inputs.text,
            }
            : {
              blocks: [
                {
                  type: "section",
                  text: { type: "plain_text", text: inputs.text },
                },
              ],
            };
          const res = await client.chat.postMessage({
            ...mainParams,
            channel: inputs.channelId,
            thread_ts: inputs.threadTs,
            reply_broadcast: inputs.isReplyBroadcast,
            icon_emoji: inputs.iconEmoji,
            username: inputs.username,
          });
          if (!res.ok) {
            return { error: res.error || "chat.postMessage failed" };
          }
          break;
        }
        case "reaction": {
          const res = await client.reactions.add({
            channel: inputs.channelId,
            name: inputs.emoji,
            timestamp: inputs.messageTs,
          });
          if (!res.ok) {
            return { error: res.error || "reactions.add failed" };
          }
          break;
        }
        default:
          throw new Error(`{inputs.type} is not supported type`);
      }
      return { outputs: {} };
    },
  );
  return { def, func };
};

export type RespondAsBotFunctionDefinition = ReturnType<
  typeof createRespondAsBotSlackFunction
>["def"];
