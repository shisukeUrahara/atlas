import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { CORPORA } from "@/core/corpus/registry";
import { SourceManifest } from "@/core/corpus/sources";
import { verifySnapshot } from "@/core/corpus/verify";
import { readJsonl } from "@/core/dataset/jsonl";
import { Chunk } from "@/core/domain/schemas";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** atlas verify: every corpus snapshot matches its manifest and its chunks.jsonl parses. */
export const verify: Command = async (_argv, deps) => {
  const fixtures = path.join(deps.dataDir, "fixtures");
  const corpora = readdirSync(fixtures).filter((d) => d in CORPORA);
  let bad = 0;
  for (const corpus of corpora) {
    const dir = path.join(fixtures, corpus);
    const manifest = SourceManifest.parse(JSON.parse(readFileSync(path.join(dir, "source_manifest.json"), "utf8")));
    const problems = verifySnapshot(dir, manifest);
    for (const p of problems) deps.err(`${corpus}: ${p.problem}: ${p.path}`);
    const chunks = readJsonl(path.join(dir, "chunks.jsonl"), Chunk);
    bad += problems.length;
    deps.out(`${corpus}: ${manifest.files.length} files ${problems.length ? "FAILED" : "ok"}, ${chunks.length} chunks`);
  }
  return bad ? EXIT.CHECK_FAILED : EXIT.OK;
};
