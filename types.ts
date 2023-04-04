import { SlackAPIClient } from "deno-slack-api/types.ts";
import { Env } from "deno-slack-sdk/types.ts";

//
// Lib
//

export type MaybePromise<T> = Promise<T> | T;
// copied from deno-slack-api/type-helpers.ts
export type PopulatedArray<T> = [T, ...T[]];

//
// BotEvent
//

export type MessageBotEvent = {
  type: "message";
  userId: string;
  channelId: string;
  channelType: string;
  text: string;
  messageTs: string;
  threadTs?: string;
};
export type ReactionBotEvent = {
  type: "reaction";
  userId: string;
  channelId: string;
  emoji: string;
  messageTs: string;
  threadTs?: string;
};
/**
 * the event for the bot. basically, CommandDispatcher receives this via the context.
 */
export type BotEvent = MessageBotEvent | ReactionBotEvent;

//
// BotResponse
//

/**
 * the response witch the bot does nothing
 */
export type NoneBotResponse = { type: "none" };

/**
 * the response which the bot posts a message
 */
export type MessageBotResponse = {
  type: "message";
  channelId: string;
  text: string;
  threadTs?: string;
  isMrkdwn?: boolean;
  isReplyBroadcast?: boolean;
  iconEmoji?: string;
  username?: string;
};

/**
 * the response which the bot responds with specific emoji
 */
export type ReactionBotResponse = {
  type: "reaction";
  channelId: string;
  emoji: string;
  messageTs: string;
};

/**
 * the response which represents the bot's behaviors. basically, Command returns this.
 */
export type BotResponse =
  | NoneBotResponse
  | MessageBotResponse
  | ReactionBotResponse;

//
// Command
//

/**
 * the common context for Command
 */
export type BaseCommandContext<TBotEvent> = {
  /**
   * the same as provided by SlackFunction's context
   */
  client: SlackAPIClient;
  /**
   * user ID of the Bot
   */
  authUserId: string;
  /**
   * environment variables are the same as provided by SlackFunction's context
   */
  env: Env;
  event: TBotEvent;
  /**
   * choice random one from the items
   */
  randomChoice: <T>(items: T[]) => T;
  /**
   * a auth token is the same as provided by SlackFunction's context
   */
  token: string;
};

/**
 * the definition of the bot's command
 */
export type Command<
  TType = string,
  TContext = BaseCommandContext<unknown>,
  TExample = string,
  // deno-lint-ignore ban-types
  TExtra = {},
> = {
  /**
   * command type
   */
  type: TType;
  /**
   * unique command name per type
   */
  name: string;
  /**
   * usage examples with description of this command
   */
  examples: TExample[];
  /**
   * the main logic for a command
   */
  execute: (c: TContext) => MaybePromise<BotResponse>;
  /**
   * the description of a command
   */
  description?: string;
  /**
   * outgoingDomains which should be set to manifest.ts
   */
  outgoingDomains?: string[];
} & TExtra;

/**
 * the interface of dispatching commands. basically, dispatched by SlackFunction
 */
export interface CommandDispatcher<TCommand, TDispatchContext> {
  /**
   * registered command list
   */
  readonly commands: TCommand[];
  /**
   * domain list which is collected from registered commands
   */
  readonly outgoingDomains: string[];
  /**
   * registering a command to this CommandDispatcher
   */
  register(command: TCommand): this;
  /**
   * dispatching matched Command
   */
  dispatch(ctx: TDispatchContext): MaybePromise<BotResponse>;
}
