/**
 * Builds a throwaway data folder for browser tests: e2e/.data with the committed fixtures linked in,
 * and the LangChain (old, then new) and Cookbook corpora ingested. Never touches data/ in the checkout.
 */
import { existsSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const dir = path.resolve("e2e/.data");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
if (!existsSync(path.join(dir, "fixtures"))) symlinkSync(path.resolve("fixtures"), path.join(dir, "fixtures"), "dir");
for (const corpus of ["langchain-old", "langchain", "cookbook"]) {
  execFileSync("pnpm", ["-s", "atlas", "ingest", "--corpus", corpus], { stdio: "inherit", env: { ...process.env, ATLAS_DATA_DIR: dir } });
}
