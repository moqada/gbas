import { Trigger } from "deno-slack-sdk/types.ts";
import { PopulatedArray } from "../../types.ts";
import { ReactionCommandWorkflowDefinition } from "./slack_workflow.ts";

/**
 * create SlackTrigger for the ReactionCommand
 */
export const createReactionCommandSlackTrigger = (
  { channelIds, workflow }: {
    channelIds: PopulatedArray<string>;
    workflow: ReactionCommandWorkflowDefinition;
  },
) => {
  const botReactionTrigger: Trigger<typeof workflow.definition> = {
    type: "event",
    name: "Bot reaction trigger",
    description: "receive reactions to bot reaction handlers",
    event: {
      channel_ids: channelIds,
      event_type: "slack#/events/reaction_added",
    },
    workflow: `#/workflows/${workflow.definition.callback_id}`,
    inputs: {
      channelId: { value: "{{data.channel_id}}" },
      reaction: { value: "{{data.reaction}}" },
      messageTs: { value: "{{data.message_ts}}" },
      userId: { value: "{{data.user_id}}" },
    },
  };
  return botReactionTrigger;
};
