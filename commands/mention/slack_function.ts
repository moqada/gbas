import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { createMessageBasedResponderContext } from "../../responders/message_based.ts";
import { respondAsBotFuncInputParameters } from "../../slack_functions/respond_as_bot.ts";
import {
  MentionCommandContext,
  RespondOnCommandNotFound,
  RespondOnError,
} from "./types.ts";
import { MentionCommandDispatcher } from "./command_dispatcher.ts";
import { getThreadTs } from "../../slack_utils.ts";
import { randomChoice } from "../../utils.ts";

const defaultRespondOnError: RespondOnError = (err, c) => {
  return c.res.message(`Error: \`${err || "unknown error"}\``);
};
export const mentionCommandFuncInputParameters = {
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
 * create SlackFunction for the MentionCommand
 */
export const createMentionCommandSlackFunction = ({
  dispatcher,
  sourceFile,
  callbackId = "bot_mention_command_function",
  respondOnError = defaultRespondOnError,
  respondOnCommandNotFound,
}: {
  dispatcher: MentionCommandDispatcher;
  callbackId?: string;
  sourceFile: string;
  respondOnError?: RespondOnError;
  respondOnCommandNotFound?: RespondOnCommandNotFound;
}) => {
  if (respondOnCommandNotFound) {
    dispatcher.onNotFound(respondOnCommandNotFound);
  }
  const def = DefineFunction({
    callback_id: callbackId,
    source_file: sourceFile,
    title: "Handle a mention to bot",
    input_parameters: mentionCommandFuncInputParameters,
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
      // even if mentioned within a thread, inputs.threadTs is not passed (2023/03/22)
      const threadTs = inputs.threadTs ||
        await getThreadTs({
          client,
          channelId: inputs.channelId,
          messageTs: inputs.messageTs,
        });
      const c: Omit<MentionCommandContext, "match"> = {
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

export type MentionCommandFunctionDefinition = ReturnType<
  typeof createMentionCommandSlackFunction
>["def"];
