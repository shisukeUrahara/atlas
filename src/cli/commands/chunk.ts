import { readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { buildCorpus } from "@/core/corpus/build";
import { getCorpus } from "@/core/corpus/registry";
import { CorpusName, SourceManifest } from "@/core/corpus/sources";
import { writeJsonl } from "@/core/dataset/jsonl";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** atlas chunk --corpus <name>: snapshot -> fixtures/<name>/chunks.jsonl */
export const chunkCorpus: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { corpus: { type: "string" } } });
  const corpus = CorpusName.safeParse(values.corpus);
  if (!corpus.success) {
    deps.err("usage: atlas chunk --corpus <name>");
    return EXIT.USAGE;
  }
  const spec = getCorpus(corpus.data);
  const dir = path.join(deps.dataDir, "fixtures", corpus.data);
  const manifest = SourceManifest.parse(JSON.parse(readFileSync(path.join(dir, "source_manifest.json"), "utf8")));
  const docs = buildCorpus(spec.workspaceId, dir, manifest);
  const chunks = docs.flatMap((d) => d.chunks);
  writeJsonl(path.join(dir, "chunks.jsonl"), chunks);
  const dropped = docs.reduce((n, d) => n + d.droppedSnippets, 0);
  deps.out(`${corpus.data}: ${docs.length} docs -> ${chunks.length} chunks (${dropped} snippet includes dropped)`);
  return EXIT.OK;
};
