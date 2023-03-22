import { CommandDispatcher } from "../../types.ts";
import { MessageCommand, MessageCommandContext } from "./types.ts";

export class MessageCommandDispatcher
  implements
    CommandDispatcher<MessageCommand, Omit<MessageCommandContext, "match">> {
  constructor(readonly commands: MessageCommand[]) {}

  get outgoingDomains() {
    return [...new Set(this.commands.flatMap((c) => c.outgoingDomains || []))];
  }

  register(command: MessageCommand) {
    this.commands.push(command);
    return this;
  }

  async dispatch(ctx: Omit<MessageCommandContext, "match">) {
    const mentionRegex = new RegExp(`^<@${ctx.authUserId}>\\s*`);
    if (mentionRegex.test(ctx.event.text)) {
      return ctx.res.none();
    }
    const command = this.commands.find((cmd) =>
      cmd.pattern.test(ctx.event.text)
    );
    if (!command) {
      return ctx.res.none();
    }
    return command.execute({
      ...ctx,
      match: command.pattern.exec(ctx.event.text) as RegExpExecArray,
    });
  }
}
