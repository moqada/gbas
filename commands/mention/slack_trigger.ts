import { Trigger } from "deno-slack-api/types.ts";
import { PopulatedArray } from "../../types.ts";
import { MentionCommandWorkflowDefinition } from "./slack_workflow.ts";

/**
 * create SlackTrigger for the MentionCommand
 */
export const createMentionCommandSlackTrigger = (
  { channelIds, workflow }: {
    channelIds: PopulatedArray<string>;
    workflow: MentionCommandWorkflowDefinition;
  },
) => {
  const botMentionTrigger: Trigger<typeof workflow.definition> = {
    type: "event",
    name: "Bot mention trigger",
    description: "receive mentions to bot mention handlers",
    event: {
      channel_ids: channelIds,
      event_type: "slack#/events/app_mentioned",
    },
    workflow: `#/workflows/${workflow.definition.callback_id}`,
    inputs: {
      channelId: { value: "{{data.channel_id}}" },
      channelType: { value: "{{data.channel_type}}" },
      message: { value: "{{data.text}}" },
      messageTs: { value: "{{data.message_ts}}" },
      // even if mentioned within a thread, data.thread_ts is not passed.
      // threadTs: { value: "{{data.thread_ts}}" },
      userId: { value: "{{data.user_id}}" },
    },
  };
  return botMentionTrigger;
};
