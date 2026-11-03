import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { sha256Hex, SourceManifest } from "@/core/corpus/sources";
import type { Deps } from "../deps";
import { EXIT } from "../exit";
import { fetchCorpus } from "./fetch";

const COMMIT = "a".repeat(40);

function setup(files: Record<string, string>) {
  const dataDir = mkdtempSync(path.join(tmpdir(), "atlas-"));
  const dir = path.join(dataDir, "fixtures", "demo");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, "sources.json"),
    JSON.stringify({ corpus: "demo", repo: "o/r", commit: COMMIT, license: "MIT", licenseFile: "LICENSE", paths: ["a.md", "gone.md"] }),
  );
  const urls: string[] = [];
  const deps: Deps = {
    dataDir,
    model: "m",
    makeEmbedder: () => { throw new Error("no embedder in this test"); },
    makeLlm: () => { throw new Error("no llm in this test"); },
    download: async (url) => {
      urls.push(url);
      const p = url.split(`${COMMIT}/`)[1];
      return p in files ? new TextEncoder().encode(files[p]) : null;
    },
    now: () => new Date("2026-11-01T00:00:00Z"),
    out: () => {},
    err: () => {},
  };
  return { dir, deps, urls };
}

test("downloads pinned files, hashes them and lists missing ones", async () => {
  const { dir, deps, urls } = setup({ "a.md": "# A", LICENSE: "MIT text" });
  expect(await fetchCorpus(["--corpus", "demo"], deps)).toBe(EXIT.OK);
  expect(urls[0]).toBe(`https://raw.githubusercontent.com/o/r/${COMMIT}/a.md`);
  expect(readFileSync(path.join(dir, "snapshot", "a.md"), "utf8")).toBe("# A");
  expect(readFileSync(path.join(dir, "LICENSE.source"), "utf8")).toBe("MIT text");
  const m = SourceManifest.parse(JSON.parse(readFileSync(path.join(dir, "source_manifest.json"), "utf8")));
  expect(m.files).toEqual([
    {
      path: "a.md",
      url: `https://github.com/o/r/blob/${COMMIT}/a.md`,
      bytes: 3,
      sha256: sha256Hex("# A"),
    },
  ]);
  expect(m.missing).toEqual(["gone.md"]);
  expect(m.retrievedAtUtc).toBe("2026-11-01T00:00:00.000Z");
});

test("no --corpus is a usage error", async () => {
  const { deps } = setup({});
  expect(await fetchCorpus([], deps)).toBe(EXIT.USAGE);
});

test("a corpus name with path tricks is refused", async () => {
  const { deps } = setup({});
  expect(await fetchCorpus(["--corpus", "../demo"], deps)).toBe(EXIT.USAGE);
});

test("snippets imported by pages are fetched, hashed and listed as includes", async () => {
  const { dir, deps } = setup({
    "a.md": "import X from '/snippets/x.mdx';\n\n<X />",
    "src/snippets/x.mdx": "import Y from '/snippets/y.mdx';\n<Y />",
    "src/snippets/y.mdx": "code",
    LICENSE: "MIT",
  });
  expect(await fetchCorpus(["--corpus", "demo"], deps)).toBe(EXIT.OK);
  const m = SourceManifest.parse(JSON.parse(readFileSync(path.join(dir, "source_manifest.json"), "utf8")));
  expect(m.includes.map((f) => f.path)).toEqual(["src/snippets/x.mdx", "src/snippets/y.mdx"]);
  expect(readFileSync(path.join(dir, "snapshot", "src/snippets/y.mdx"), "utf8")).toBe("code");
});
