import { BotResponse, MaybePromise } from "../../../types.ts";
import { createMentionCommand } from "../../mention/command_factory.ts";
import { MentionCommand, MentionCommandContext } from "../../mention/types.ts";
import { MessageCommand } from "../../message/types.ts";
import { ReactionCommand } from "../../reaction/types.ts";

const createDescription = (
  handlers: Array<MentionCommand | MessageCommand | ReactionCommand>,
  keyword?: string,
) => {
  let commands = [...handlers].sort((a, b) => a.name.localeCompare(b.name));
  if (keyword) {
    commands = commands.filter((command) => {
      return command.name.search(keyword) >= 0 ||
        command.examples.some((text) => text.search(keyword) >= 0);
    });
  }
  if (commands.length === 0) {
    return "";
  }
  const description = commands.map(({ examples, ...params }) => {
    return `${
      "emojis" in params
        ? params.emojis.map((e) => `:${e}:`).join(", ")
        : params.pattern
    }
    ${examples.join("\n    ")}`;
  }).join("\n");
  return `\`\`\`
${description}
\`\`\``;
};

const defaultRespondOnSuccess = (help: string, c: MentionCommandContext) => {
  return c.res.message(help);
};
const defaultRespondOnCommandNotFound = (
  keyword: string,
  c: MentionCommandContext,
) => {
  return c.res.message(`\`${keyword}\`: matched command is not found`);
};
const defaultExamples = [
  "help - show usage of all commands" as const,
  "help <query> - show usage of commands that match <query>" as const,
];

export const createHelpMentionCommand = (
  {
    commands,
    examples = defaultExamples,
    respondOnSuccess = defaultRespondOnSuccess,
    respondOnCommandNotFound = defaultRespondOnCommandNotFound,
  }: {
    commands: {
      message?: MessageCommand[];
      mention?: MentionCommand[];
      reaction?: ReactionCommand[];
    };
    examples?: MentionCommand["examples"];
    respondOnSuccess?: (
      help: string,
      c: MentionCommandContext,
    ) => MaybePromise<BotResponse>;
    respondOnCommandNotFound?: (
      keyword: string,
      c: MentionCommandContext,
    ) => MaybePromise<BotResponse>;
  },
) => {
  const help = createMentionCommand({
    name: "help",
    pattern: /^help(\s+(.+))?/,
    examples,
    execute: (c) => {
      const keyword = c.match[2];
      const descriptions: Array<{ label: string; body: string }> = [
        {
          label: "MENTION",
          body: createDescription(commands.mention || [], keyword),
        },
        {
          label: "MESSAGE",
          body: createDescription(commands.message || [], keyword),
        },
        {
          label: "REACTION",
          body: createDescription(commands.reaction || [], keyword),
        },
      ].filter((desc) => desc.body);
      if (descriptions.length === 0) {
        return respondOnCommandNotFound(keyword, c);
      }
      return respondOnSuccess(
        descriptions.map((desc) => {
          return `*${desc.label}*\n${desc.body}`;
        }).join("\n"),
        c,
      );
    },
  });
  return help;
};
