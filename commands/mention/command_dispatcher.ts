import { CommandDispatcher } from "../../types.ts";
import {
  MentionCommand,
  MentionCommandContext,
  RespondOnCommandNotFound,
} from "./types.ts";

export class MentionCommandDispatcher
  implements
    CommandDispatcher<MentionCommand, Omit<MentionCommandContext, "match">> {
  private respondOnNotFound: RespondOnCommandNotFound = (ctx) => {
    return ctx.res.message("command not found");
  };

  constructor(readonly commands: MentionCommand[]) {}

  get outgoingDomains() {
    return [...new Set(this.commands.flatMap((c) => c.outgoingDomains || []))];
  }

  register(command: MentionCommand) {
    this.commands.push(command);
    return this;
  }

  /**
   * register the handler for command not found
   */
  onNotFound(handler: RespondOnCommandNotFound) {
    this.respondOnNotFound = handler;
    return this;
  }

  async dispatch(ctx: Omit<MentionCommandContext, "match">) {
    const mentionRegex = new RegExp(`^<@${ctx.authUserId}>\\s*`);
    if (!mentionRegex.test(ctx.event.text)) {
      return ctx.res.none();
    }
    const message = ctx.event.text.replace(mentionRegex, "");
    const command = this.commands.find((cmd) => cmd.pattern.test(message));
    if (!command) {
      return this.respondOnNotFound(ctx);
    }
    return command.execute({
      ...ctx,
      match: command.pattern.exec(message) as RegExpExecArray,
    });
  }
}
