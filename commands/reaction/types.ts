import { MessageBasedResponderContext } from "../../responders/message_based.ts";
import {
  BaseCommandContext,
  BotResponse,
  Command,
  MaybePromise,
  ReactionBotEvent,
} from "../../types.ts";

type Emoji = string;
type Description = string;

export type ReactionCommandContext =
  & BaseCommandContext<ReactionBotEvent>
  & MessageBasedResponderContext;
export type ReactionCommand = Command<
  "reaction",
  ReactionCommandContext,
  `:${Emoji}: - ${Description}`,
  {
    /**
     * the emoji list of conditions for executing the command
     */
    emojis: Emoji[];
  }
>;

export type RespondOnError = (
  err: unknown,
  ctx: ReactionCommandContext,
) => MaybePromise<BotResponse>;
