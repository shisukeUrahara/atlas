import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { blobUrl, CorpusName, rawUrl, resolveInside, sha256Hex, snippetImports, SourceList, type ManifestFile, type SourceManifest } from "@/core/corpus/sources";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** atlas fetch --corpus <name>: download every pinned file into fixtures/<name>/snapshot/. */
export const fetchCorpus: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { corpus: { type: "string" } } });
  const corpus = CorpusName.safeParse(values.corpus);
  if (!corpus.success) {
    deps.err("usage: atlas fetch --corpus <name>  (name is a lowercase slug)");
    return EXIT.USAGE;
  }
  const dir = path.join(deps.dataDir, "fixtures", corpus.data);
  const list = SourceList.parse(JSON.parse(readFileSync(path.join(dir, "sources.json"), "utf8")));

  const missing: string[] = [];
  const save = async (p: string): Promise<{ file: ManifestFile; text: string } | null> => {
    const body = await deps.download(rawUrl(list, p));
    if (body === null) {
      missing.push(p);
      deps.err(`missing at ${list.commit.slice(0, 7)}: ${p}`);
      return null;
    }
    const target = resolveInside(path.join(dir, "snapshot"), p);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, body);
    return { file: { path: p, url: blobUrl(list, p), bytes: body.byteLength, sha256: sha256Hex(body) }, text: new TextDecoder().decode(body) };
  };

  const files: ManifestFile[] = [];
  const includes: ManifestFile[] = [];
  const seen = new Set<string>();
  // Snippets can import snippets; follow at most 3 levels.
  let queue: string[] = [];
  for (const p of list.paths) {
    const got = await save(p);
    if (!got) continue;
    files.push(got.file);
    queue.push(...snippetImports(got.text).map((i) => i.path));
  }
  for (let depth = 0; depth < 3 && queue.length; depth++) {
    const next: string[] = [];
    for (const p of queue) {
      if (seen.has(p)) continue;
      seen.add(p);
      const got = await save(p);
      if (!got) continue;
      includes.push(got.file);
      next.push(...snippetImports(got.text).map((i) => i.path));
    }
    queue = next;
  }

  const license = await deps.download(rawUrl(list, list.licenseFile));
  if (license === null) throw new Error(`license file not found: ${list.licenseFile}`);
  writeFileSync(path.join(dir, "LICENSE.source"), license);

  const manifest: SourceManifest = {
    corpus: list.corpus,
    repo: list.repo,
    commit: list.commit,
    license: list.license,
    retrievedAtUtc: deps.now().toISOString(),
    files,
    includes: includes.sort((a, b) => (a.path < b.path ? -1 : 1)),
    missing,
  };
  writeFileSync(path.join(dir, "source_manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  deps.out(`${list.corpus}: ${files.length} files + ${includes.length} snippets at ${list.commit.slice(0, 7)}, ${missing.length} missing`);
  return EXIT.OK;
};
