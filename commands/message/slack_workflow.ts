import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { RespondAsBotFunctionDefinition } from "../../slack_functions/respond_as_bot.ts";
import { MessageCommandFunctionDefinition } from "./slack_function.ts";

export const messageCommandWorkflowInputParameters = {
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
 * create SlackWorkflow for the MessageCommand
 */
export function createMessageCommandSlackWorkflow(
  {
    isQuickResponseEnabled = false,
    messageCommandFuncDef,
    respondAsBotFuncDef,
  }: {
    isQuickResponseEnabled?: boolean;
    messageCommandFuncDef: MessageCommandFunctionDefinition;
    respondAsBotFuncDef: RespondAsBotFunctionDefinition;
  },
) {
  const workflow = DefineWorkflow({
    callback_id: "bot_message_command_workflow",
    title: "Bot message workflow",
    input_parameters: messageCommandWorkflowInputParameters,
  });
  const messageStep = workflow.addStep(messageCommandFuncDef, {
    ...workflow.inputs,
    isQuickResponseEnabled,
  });
  if (!isQuickResponseEnabled) {
    workflow.addStep(respondAsBotFuncDef, messageStep.outputs);
  }
  return workflow;
}

export type MessageCommandWorkflowDefinition = ReturnType<
  typeof createMessageCommandSlackWorkflow
>;
