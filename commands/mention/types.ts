import { MessageBasedResponderContext } from "../../responders/message_based.ts";
import {
  BaseCommandContext,
  BotResponse,
  Command,
  MaybePromise,
  MessageBotEvent,
} from "../../types.ts";

type CommandText = string;
type Description = string;

export type MentionCommandContext =
  & BaseCommandContext<MessageBotEvent>
  & MessageBasedResponderContext
  & {
    /**
     * the result of matching message.text against pattern
     */
    match: RegExpExecArray;
  };
export type MentionCommand = Command<
  "mention",
  MentionCommandContext,
  `${CommandText} - ${Description}`,
  {
    /**
     * the regular expression of conditions for executing the command
     */
    pattern: RegExp;
  }
>;

export type RespondOnCommandNotFound = (
  ctx: Omit<MentionCommandContext, "match">,
) => MaybePromise<BotResponse>;
export type RespondOnError = (
  err: unknown,
  ctx: Omit<MentionCommandContext, "match">,
) => MaybePromise<BotResponse>;
