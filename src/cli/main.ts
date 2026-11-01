import type { Command, Deps } from "./deps";
import { chunkCorpus } from "./commands/chunk";
import { fetchCorpus } from "./commands/fetch";
import { EXIT } from "./exit";

/** Commands are added one per commit as the pipeline grows. */
export const COMMANDS: Record<string, Command> = {
  fetch: fetchCorpus,
  chunk: chunkCorpus,
};

export async function main(argv: string[], deps: Deps, commands = COMMANDS): Promise<number> {
  const [name, ...rest] = argv;
  const command = name === undefined ? undefined : commands[name];
  if (!command) {
    deps.err(`usage: atlas <${Object.keys(commands).join("|") || "command"}> [options]`);
    return EXIT.USAGE;
  }
  try {
    return await command(rest, deps);
  } catch (e) {
    // parseArgs rejects unknown or malformed options with an ERR_PARSE_ARGS_* code.
    if (e instanceof Error && "code" in e && String(e.code).startsWith("ERR_PARSE_ARGS")) {
      deps.err(e.message);
      return EXIT.USAGE;
    }
    throw e;
  }
}
