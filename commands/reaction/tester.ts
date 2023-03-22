import { SlackAPI } from "deno-slack-api/mod.ts";
import { ReactionCommandDispatcher } from "./command_dispatcher.ts";
import { ReactionCommand, ReactionCommandContext } from "./types.ts";
import { BotResponse, MaybePromise } from "../../types.ts";
import { createMessageBasedResponderContextMock } from "../../test_utils.ts";

type CreateContext = (
  emoji: string,
  ctx?: Partial<ReactionCommandContext>,
) => ReactionCommandContext;
type Dispatch = (c: ReactionCommandContext) => MaybePromise<BotResponse>;

export function createReactionCommandTester(): { createContext: CreateContext };
export function createReactionCommandTester(
  command: ReactionCommand,
): { createContext: CreateContext; dispatch: Dispatch };
export function createReactionCommandTester(command?: ReactionCommand) {
  const createContext: CreateContext = (
    emoji,
    { event, interrupt, res, ...ctx } = {},
  ) => {
    const token = "gbas-bot-tester-token";
    const client = SlackAPI(token);
    const newEvent = {
      channelId: "C0123",
      messageTs: "1643810217.088700",
      type: "reaction" as const,
      userId: "USER",
      ...event,
      emoji,
    };
    const responder = createMessageBasedResponderContextMock({
      channelId: newEvent.channelId,
      messageTs: newEvent.messageTs,
      userId: newEvent.userId,
    });
    return {
      client,
      authUserId: "BOT",
      event: newEvent,
      env: {},
      interrupt: {
        ...responder.interrupt,
        ...interrupt,
      },
      res: {
        ...responder.res,
        ...res,
      },
      token,
      ...ctx,
    };
  };
  if (!command) {
    return { createContext };
  }
  const dispatcher = new ReactionCommandDispatcher([command]);
  const dispatch: Dispatch = (c) => dispatcher.dispatch(c);
  return {
    createContext,
    dispatch,
  };
}
