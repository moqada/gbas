import { SlackAPI } from "deno-slack-api/mod.ts";
import { MentionCommandDispatcher } from "./command_dispatcher.ts";
import { MentionCommand, MentionCommandContext } from "./types.ts";
import { BotResponse, MaybePromise } from "../../types.ts";
import { createMessageBasedResponderContextMock } from "../../test_utils.ts";

type Context = Omit<MentionCommandContext, "match">;
type CreateContext = (text: string, ctx?: Partial<Context>) => Context;
type Dispatch = (c: Context) => MaybePromise<BotResponse>;

export function createMentionCommandTester(): { createContext: CreateContext };
export function createMentionCommandTester(
  command: MentionCommand,
): { createContext: CreateContext; dispatch: Dispatch };
export function createMentionCommandTester(command?: MentionCommand) {
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
  const dispatcher = new MentionCommandDispatcher([command]);
  dispatcher.onNotFound(() => {
    throw new Error("pattern does not match");
  });
  const dispatch: Dispatch = (c) => dispatcher.dispatch(c);
  return {
    createContext,
    dispatch,
  };
}
