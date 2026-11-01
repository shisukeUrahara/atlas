import { cpSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { openStore } from "@/core/store/open";
import type { Deps } from "../deps";
import { EXIT } from "../exit";
import { ingest } from "./ingest";

test("ingests a corpus, then a second run changes nothing", async () => {
  const dataDir = mkdtempSync(path.join(tmpdir(), "atlas-"));
  cpSync("fixtures/cookbook", path.join(dataDir, "fixtures", "cookbook"), { recursive: true });
  const out: string[] = [];
  const deps: Deps = { dataDir, download: async () => null, now: () => new Date(0), out: (l) => out.push(l), err: () => {} };
  expect(await ingest(["--corpus", "cookbook"], deps)).toBe(EXIT.OK);
  expect(await ingest(["--corpus", "cookbook"], deps)).toBe(EXIT.OK);
  expect(out[0]).toMatch(/\+405 -0 =0 chunks, index v1/);
  expect(out[1]).toMatch(/\+0 -0 =405 chunks, index v1/);
  const store = openStore(dataDir);
  expect(store.workspaces().map((w) => w.id)).toEqual(["cookbook", "uploads"]);
  store.close();
});
