import { SlackAPI } from "deno-slack-api/mod.ts";
import { MessageCommandDispatcher } from "./command_dispatcher.ts";
import { MessageCommand, MessageCommandContext } from "./types.ts";
import { BotResponse, MaybePromise } from "../../types.ts";
import { createMessageBasedResponderContextMock } from "../../test_utils.ts";
import { randomChoice } from "../../utils.ts";

type Context = Omit<MessageCommandContext, "match">;
type CreateContext = (text: string, ctx?: Partial<Context>) => Context;
type Dispatch = (c: Context) => MaybePromise<BotResponse>;

export function createMessageCommandTester(): { createContext: CreateContext };
export function createMessageCommandTester(
  command: MessageCommand,
): { createContext: CreateContext; dispatch: Dispatch };
export function createMessageCommandTester(command?: MessageCommand) {
  const createContext: CreateContext = (
    text,
    { event, interrupt, res, ...ctx } = {},
  ) => {
    const token = "gbas-bot-tester-token";
    const client = SlackAPI(token);
    const newEvent = {
      channelId: "C0123",
      channelType: "public",
      messageTs: "1643810217.088700",
      type: "message" as const,
      userId: "USER",
      ...event,
      text,
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
      randomChoice,
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
  const dispatcher = new MessageCommandDispatcher([command]);
  const dispatch: Dispatch = (c) => dispatcher.dispatch(c);
  return {
    createContext,
    dispatch,
  };
}
