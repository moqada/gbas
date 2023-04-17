import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { createMessageBasedResponderContext } from "../../responders/message_based.ts";
import { respondAsBotFuncInputParameters } from "../../slack_functions/respond_as_bot.ts";
import { ReactionCommandContext, RespondOnError } from "./types.ts";
import { ReactionCommandDispatcher } from "./command_dispatcher.ts";
import { getThreadTs } from "../../slack_utils.ts";
import { randomChoice } from "../../utils.ts";

const defaultRespondOnError: RespondOnError = (err, c) => {
  return c.res.message(`Error: \`${err || "unknown error"}\``);
};
export const reactionCommandFuncInputParameters = {
  properties: {
    channelId: { type: Schema.slack.types.channel_id },
    userId: { type: Schema.slack.types.user_id },
    reaction: { type: Schema.types.string },
    messageTs: { type: Schema.types.string },
    isQuickResponseEnabled: { type: Schema.types.boolean },
  },
  required: [
    "channelId" as const,
    "userId" as const,
    "reaction" as const,
    "messageTs" as const,
  ],
};

/**
 * create SlackFunction for the ReactionCommand
 */
export function createReactionCommandSlackFunction({
  dispatcher,
  sourceFile,
  callbackId = "bot_reaction_command_function",
  respondOnError = defaultRespondOnError,
}: {
  dispatcher: ReactionCommandDispatcher;
  callbackId?: string;
  sourceFile: string;
  respondOnError?: RespondOnError;
}) {
  const def = DefineFunction({
    callback_id: callbackId,
    source_file: sourceFile,
    title: "Handle a reaction to bot",
    input_parameters: reactionCommandFuncInputParameters,
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
      const threadTs = await getThreadTs({
        client,
        channelId: inputs.channelId,
        messageTs: inputs.messageTs,
      });
      const c: ReactionCommandContext = {
        client,
        env,
        authUserId: res.user_id,
        event: {
          channelId: inputs.channelId,
          messageTs: inputs.messageTs,
          emoji: inputs.reaction,
          type: "reaction",
          userId: inputs.userId,
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
}

export type ReactionCommandFunctionDefinition = ReturnType<
  typeof createReactionCommandSlackFunction
>["def"];
