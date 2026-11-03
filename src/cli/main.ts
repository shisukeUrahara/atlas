import type { Command, Deps } from "./deps";
import { buildQuestions } from "./commands/buildQuestions";
import { chunkCorpus } from "./commands/chunk";
import { draftQuestionsCmd } from "./commands/draftQuestions";
import { embed } from "./commands/embed";
import { fetchCorpus } from "./commands/fetch";
import { ingest } from "./commands/ingest";
import { judgePool } from "./commands/judgePool";
import { replaceFlaggedCmd } from "./commands/replaceFlagged";
import { applyReviewCmd, reviewSheet } from "./commands/review";
import { verify } from "./commands/verify";
import { EXIT } from "./exit";

/** Commands are added one per commit as the pipeline grows. */
export const COMMANDS: Record<string, Command> = {
  fetch: fetchCorpus,
  chunk: chunkCorpus,
  verify,
  ingest,
  embed,
  "draft-questions": draftQuestionsCmd,
  "judge-pool": judgePool,
  "replace-flagged": replaceFlaggedCmd,
  "build-questions": buildQuestions,
  "review-sheet": reviewSheet,
  "apply-review": applyReviewCmd,
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
