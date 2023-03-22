import { Trigger } from "deno-slack-api/types.ts";
import { PopulatedArray } from "../../types.ts";
import { MessageCommandWorkflowDefinition } from "./slack_workflow.ts";

/**
 * create SlackTrigger for the MessageCommand
 */
export const createMessageCommandSlackTrigger = (
  { channelIds, workflow }: {
    channelIds: PopulatedArray<string>;
    workflow: MessageCommandWorkflowDefinition;
  },
) => {
  const botMessageTrigger: Trigger<typeof workflow.definition> = {
    type: "event",
    name: "Bot message trigger",
    description: "receive messages to bot message handlers",
    event: {
      channel_ids: channelIds,
      event_type: "slack#/events/message_posted",
      // workaround for listening to all messages (filter property is required, but it wants to pass through all).
      filter: {
        version: 1,
        root: { statement: "1 == 1" },
      },
    },
    workflow: `#/workflows/${workflow.definition.callback_id}`,
    inputs: {
      channelId: { value: "{{data.channel_id}}" },
      channelType: { value: "{{data.channel_type}}" },
      message: { value: "{{data.text}}" },
      messageTs: { value: "{{data.message_ts}}" },
      // temporary workaround (2023/03/20): it responds only in threads if prefix space is nothing
      threadTs: { value: " {{data.thread_ts}}" },
      userId: { value: "{{data.user_id}}" },
    },
  };
  return botMessageTrigger;
};
