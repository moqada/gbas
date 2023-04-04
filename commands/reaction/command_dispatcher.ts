import { CommandDispatcher } from "../../types.ts";
import { ReactionCommand, ReactionCommandContext } from "./types.ts";

export class ReactionCommandDispatcher
  implements CommandDispatcher<ReactionCommand, ReactionCommandContext> {
  constructor(readonly commands: ReactionCommand[]) {}

  get outgoingDomains() {
    return [...new Set(this.commands.flatMap((c) => c.outgoingDomains || []))];
  }

  register(command: ReactionCommand) {
    this.commands.push(command);
    return this;
  }

  dispatch(ctx: ReactionCommandContext) {
    const command = this.commands.find((cmd) =>
      cmd.emojis.includes(ctx.event.emoji)
    );
    if (!command) {
      return ctx.res.none();
    }
    return command.execute(ctx);
  }
}
