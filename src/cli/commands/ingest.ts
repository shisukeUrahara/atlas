import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { buildCorpus } from "@/core/corpus/build";
import { getCorpus } from "@/core/corpus/registry";
import { CorpusName, SourceManifest } from "@/core/corpus/sources";
import { runIngestJob } from "@/core/ingest/ingest";
import { openStore } from "@/core/store/open";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/**
 * atlas ingest --corpus <name>: syncs the workspace to exactly this corpus snapshot.
 * Unchanged files are skipped; changed files are diffed; files that left the corpus are removed.
 */
export const ingest: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { corpus: { type: "string" } } });
  const corpus = CorpusName.safeParse(values.corpus);
  if (!corpus.success) {
    deps.err("usage: atlas ingest --corpus <name>");
    return EXIT.USAGE;
  }
  const spec = getCorpus(corpus.data);
  const dir = path.join(deps.dataDir, "fixtures", corpus.data);
  const manifest = SourceManifest.parse(JSON.parse(readFileSync(path.join(dir, "source_manifest.json"), "utf8")));
  const store = openStore(deps.dataDir);
  try {
    store.upsertWorkspace({ id: spec.workspaceId, name: spec.workspaceName, source: manifest.repo, license: manifest.license });
    const docs = buildCorpus(spec.workspaceId, dir, manifest);
    const r = runIngestJob(store, randomUUID(), spec.workspaceId, docs, manifest.license, { prune: true });
    deps.out(
      `${corpus.data} -> workspace ${spec.workspaceId}: +${r.added} -${r.removed} =${r.unchanged} chunks, index v${r.indexVersion}`,
    );
    return EXIT.OK;
  } finally {
    store.close();
  }
};
