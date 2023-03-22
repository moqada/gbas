import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { RespondAsBotFunctionDefinition } from "../../slack_functions/respond_as_bot.ts";
import { MentionCommandFunctionDefinition } from "./slack_function.ts";

export const mentionCommandWorkflowInputParameters = {
  properties: {
    channelId: { type: Schema.slack.types.channel_id },
    channelType: { type: Schema.types.string },
    userId: { type: Schema.slack.types.user_id },
    message: { type: Schema.types.string },
    messageTs: { type: Schema.types.string },
    threadTs: { type: Schema.types.string },
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
 * create SlackWorkflow for the MentionCommand
 */
export const createMentionCommandSlackWorkflow = (
  {
    isQuickResponseEnabled = false,
    mentionCommandFuncDef,
    respondAsBotFuncDef,
  }: {
    isQuickResponseEnabled?: boolean;
    mentionCommandFuncDef: MentionCommandFunctionDefinition;
    respondAsBotFuncDef: RespondAsBotFunctionDefinition;
  },
) => {
  const workflow = DefineWorkflow({
    callback_id: "bot_mention_command_workflow",
    title: "Bot mention workflow",
    input_parameters: mentionCommandWorkflowInputParameters,
  });
  const mentionStep = workflow.addStep(mentionCommandFuncDef, {
    ...workflow.inputs,
    isQuickResponseEnabled,
  });
  if (!isQuickResponseEnabled) {
    workflow.addStep(respondAsBotFuncDef, mentionStep.outputs);
  }
  return workflow;
};

export type MentionCommandWorkflowDefinition = ReturnType<
  typeof createMentionCommandSlackWorkflow
>;
