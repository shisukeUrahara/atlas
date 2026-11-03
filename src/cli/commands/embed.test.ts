import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { buildDoc } from "@/core/corpus/build";
import { sha256Hex } from "@/core/corpus/sources";
import { CachingEmbedder } from "@/core/embeddings/cache";
import { FakeEmbedder } from "@/core/embeddings/fake";
import { runIngestJob } from "@/core/ingest/ingest";
import { openStore } from "@/core/store/open";
import type { Deps } from "../deps";
import { EXIT } from "../exit";
import { embed } from "./embed";

test("embeds every chunk once; a second run is served from the cache", async () => {
  const dataDir = mkdtempSync(path.join(tmpdir(), "atlas-"));
  const store = openStore(dataDir);
  store.upsertWorkspace({ id: "langchain", name: "L", source: "langchain-ai/docs", license: "MIT" });
  const page = "## A\n\nFirst section text that is long enough to keep.\n\n## B\n\nSecond section text that is long enough to keep.\n";
  runIngestJob(store, "j", "langchain", [buildDoc("langchain", { path: "a.md", url: "u", sha256: sha256Hex(page) }, page)], "MIT");
  store.close();
  const fake = new FakeEmbedder();
  const cacheDir = path.join(dataDir, "cache", "embeddings");
  const out: string[] = [];
  const deps = {
    dataDir, out: (l: string) => out.push(l), err: () => {}, now: () => new Date(0), download: async () => null, model: "m",
    replay: true,
    makeEmbedder: () => new CachingEmbedder(fake, cacheDir, fake.model, fake.dims),
    makeLlm: () => { throw new Error("unused"); },
  } satisfies Deps;
  expect(await embed([], deps)).toBe(EXIT.OK);
  expect(await embed([], deps)).toBe(EXIT.OK);
  expect(fake.calls).toBe(1);
  expect(out[0]).toMatch(/^langchain: 2 chunks, 2 distinct texts/);
});
