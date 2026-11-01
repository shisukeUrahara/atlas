import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { sha256Hex, type SourceManifest } from "./sources";
import { verifySnapshot } from "./verify";

test("reports missing files and checksum mismatches", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "atlas-"));
  mkdirSync(path.join(dir, "snapshot"));
  writeFileSync(path.join(dir, "snapshot", "ok.md"), "ok");
  writeFileSync(path.join(dir, "snapshot", "changed.md"), "edited");
  const file = (p: string, body: string) => ({ path: p, url: "u", bytes: body.length, sha256: sha256Hex(body) });
  const manifest: SourceManifest = {
    corpus: "c", repo: "o/r", commit: "c", license: "MIT", retrievedAtUtc: "", missing: [],
    files: [file("ok.md", "ok"), file("changed.md", "original"), file("gone.md", "x")],
  };
  expect(verifySnapshot(dir, manifest)).toEqual([
    { path: "changed.md", problem: "checksum" },
    { path: "gone.md", problem: "missing" },
  ]);
});

test("the committed snapshots match their manifests", async () => {
  const { readFileSync } = await import("node:fs");
  for (const corpus of ["langchain", "langchain-old", "cookbook"]) {
    const dir = path.join("fixtures", corpus);
    const manifest = JSON.parse(readFileSync(path.join(dir, "source_manifest.json"), "utf8"));
    expect(verifySnapshot(dir, manifest)).toEqual([]);
  }
});
