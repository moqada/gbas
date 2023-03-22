import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { RespondAsBotFunctionDefinition } from "../../slack_functions/respond_as_bot.ts";
import { ReactionCommandFunctionDefinition } from "./slack_function.ts";

export const reactionCommandWorkflowInputParameters = {
  properties: {
    channelId: { type: Schema.slack.types.channel_id },
    userId: { type: Schema.slack.types.user_id },
    reaction: { type: Schema.types.string },
    messageTs: { type: Schema.types.string },
  },
  required: [
    "channelId" as const,
    "userId" as const,
    "reaction" as const,
    "messageTs" as const,
  ],
};

/**
 * create SlackWorkflow for the ReactionCommand
 */
export const createReactionCommandSlackWorkflow = (
  {
    isQuickResponseEnabled = false,
    reactionCommandFuncDef,
    respondAsBotFuncDef,
  }: {
    isQuickResponseEnabled?: boolean;
    reactionCommandFuncDef: ReactionCommandFunctionDefinition;
    respondAsBotFuncDef: RespondAsBotFunctionDefinition;
  },
) => {
  const workflow = DefineWorkflow({
    callback_id: "bot_reaction_command_workflow",
    title: "Bot reaction workflow",
    input_parameters: reactionCommandWorkflowInputParameters,
  });
  const reactionStep = workflow.addStep(reactionCommandFuncDef, {
    ...workflow.inputs,
    isQuickResponseEnabled,
  });
  if (!isQuickResponseEnabled) {
    workflow.addStep(respondAsBotFuncDef, reactionStep.outputs);
  }
  return workflow;
};

export type ReactionCommandWorkflowDefinition = ReturnType<
  typeof createReactionCommandSlackWorkflow
>;
