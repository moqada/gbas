import {
  createHelpMentionCommand,
  MentionCommandDispatcher,
  MessageCommandDispatcher,
  ReactionCommandDispatcher,
} from "gbas/mod.ts";
import * as mentionCommands from "./mention/mod.ts";
import * as messageCommands from "./message/mod.ts";
import * as reactionCommands from "./reaction/mod.ts";

export const mentionCommandDispatcher = new MentionCommandDispatcher(
  Object.values(mentionCommands),
);
export const messageCommandDispatcher = new MessageCommandDispatcher(
  Object.values(messageCommands),
);
export const reactionCommandDispatcher = new ReactionCommandDispatcher(
  Object.values(reactionCommands),
);
mentionCommandDispatcher.register(
  createHelpMentionCommand({
    commands: {
      mention: mentionCommandDispatcher.commands,
      message: messageCommandDispatcher.commands,
      reaction: reactionCommandDispatcher.commands,
    },
  }),
);
