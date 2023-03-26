import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { createMessageBasedResponderContext } from "../../responders/message_based.ts";
import { respondAsBotFuncInputParameters } from "../../slack_functions/respond_as_bot.ts";
import { MessageCommandContext, RespondOnError } from "./types.ts";
import { MessageCommandDispatcher } from "./command_dispatcher.ts";
import { getThreadTs } from "../../slack_utils.ts";
import { randomChoice } from "../../utils.ts";

const defaultRespondOnError: RespondOnError = (err, c) => {
  return c.res.message(`Error: \`${err || "unknown error"}\``);
};
export const messageCommandFuncInputParameters = {
  properties: {
    channelId: { type: Schema.slack.types.channel_id },
    channelType: { type: Schema.types.string },
    userId: { type: Schema.slack.types.user_id },
    message: { type: Schema.types.string },
    messageTs: { type: Schema.types.string },
    threadTs: { type: Schema.types.string },
    isQuickResponseEnabled: { type: Schema.types.boolean },
  },
  required: [
    "channelId" as const,
    "channelType" as const,
    "userId" as const,
    "message" as const,
    "messageTs" as const,
  ],
};

/**
 * create SlackFunction for the MessageCommand
 */
export const createMessageCommandSlackFunction = ({
  dispatcher,
  sourceFile,
  callbackId = "bot_message_command_function",
  respondOnError = defaultRespondOnError,
}: {
  dispatcher: MessageCommandDispatcher;
  callbackId?: string;
  sourceFile: string;
  respondOnError?: RespondOnError;
}) => {
  const def = DefineFunction({
    callback_id: callbackId,
    source_file: sourceFile,
    title: "Handle a message to bot",
    input_parameters: messageCommandFuncInputParameters,
    output_parameters: respondAsBotFuncInputParameters,
  });
  const func = SlackFunction(
    def,
    async ({ client, env, inputs, token }) => {
      const res = await client.auth.test();
      if (!res.ok) {
        return { error: res.error ?? "client.auth.test failed" };
      }
      if (res.user_id === inputs.userId) {
        return { outputs: { type: "none" } };
      }
      let threadTs = typeof inputs.threadTs === "string"
        ? inputs.threadTs.trim()
        : undefined;
      threadTs = threadTs ||
        await getThreadTs({
          client,
          channelId: inputs.channelId,
          messageTs: inputs.messageTs,
        });
      const c: Omit<MessageCommandContext, "match"> = {
        client,
        env,
        authUserId: res.user_id,
        event: {
          channelId: inputs.channelId,
          messageTs: inputs.messageTs,
          text: inputs.message,
          type: "message",
          userId: inputs.userId,
          channelType: inputs.channelType,
          threadTs,
        },
        randomChoice,
        token,
        ...createMessageBasedResponderContext({
          client,
          channelId: inputs.channelId,
          messageTs: inputs.messageTs,
          threadTs,
        }),
      };
      let response;
      try {
        response = await dispatcher.dispatch(c);
      } catch (err) {
        response = await respondOnError(err, c);
      }
      if (response.type !== "none" && inputs.isQuickResponseEnabled) {
        switch (response.type) {
          case "message": {
            const { text, type: _, ...opts } = response;
            try {
              await c.interrupt.postMessage(text, opts);
            } catch (err) {
              const outputs = await respondOnError(err, c);
              return { outputs };
            }
            break;
          }
          case "reaction": {
            const { emoji, type: _, ...opts } = response;
            try {
              await c.interrupt.addReaction(emoji, opts);
            } catch (err) {
              const outputs = await respondOnError(err, c);
              return { outputs };
            }
            break;
          }
          default:
            break;
        }
        return { outputs: { type: "none" } };
      }
      return { outputs: response };
    },
  );
  return { def, func };
};

export type MessageCommandFunctionDefinition = ReturnType<
  typeof createMessageCommandSlackFunction
>["def"];
