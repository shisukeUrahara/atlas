import { execFileSync } from "node:child_process";

export interface RepoState {
  git_sha: string;
  git_dirty: boolean;
  /** Last commit that touched the pre-registration file, or null if it was never committed. */
  preregistration_sha: string | null;
}

export class NotAGitRepoError extends Error {
  constructor(dir: string) {
    super(`${dir} is not a git checkout with at least one commit. Run holdout evaluations on the host, not in a container.`);
    this.name = "NotAGitRepoError";
  }
}

/** The labeling guide fixes the classes, split and rules before any run: it is the pre-registration. */
export const PREREGISTRATION_FILE = "docs/labeling_guide.md";

const git = (cwd: string, args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

/**
 * Where the code is right now. Throws outside a checkout: a run that cannot say which
 * code produced it must not pretend the tree was clean. Untracked files count as dirty.
 */
export function repoState(cwd: string): RepoState {
  let sha: string;
  try {
    sha = git(cwd, ["rev-parse", "HEAD"]);
  } catch {
    throw new NotAGitRepoError(cwd);
  }
  return {
    git_sha: sha,
    git_dirty: git(cwd, ["status", "--porcelain"]) !== "",
    preregistration_sha: git(cwd, ["log", "-1", "--format=%H", "--", PREREGISTRATION_FILE]) || null,
  };
}
