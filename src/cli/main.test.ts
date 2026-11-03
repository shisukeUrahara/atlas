import { parseArgs } from "node:util";
import { expect, test } from "vitest";
import type { Deps } from "./deps";
import { EXIT } from "./exit";
import { DirtyTreeError } from "@/core/artifacts/guard";
import { main } from "./main";

function fakeDeps() {
  const out: string[] = [];
  const err: string[] = [];
  const deps: Deps = {
    dataDir: "/tmp",
    download: async () => null,
    model: "m",
    replay: true,
    makeEmbedder: () => { throw new Error("no embedder in this test"); },
    makeLlm: () => { throw new Error("no llm in this test"); },
    now: () => new Date(0),
    out: (l) => out.push(l),
    err: (l) => err.push(l),
  };
  return { deps, out, err };
}

test("no command prints usage", async () => {
  const { deps, err } = fakeDeps();
  expect(await main([], deps, { hello: async () => 0 })).toBe(EXIT.USAGE);
  expect(err[0]).toContain("atlas <hello>");
});

test("runs the named command with the rest of argv", async () => {
  const { deps, out } = fakeDeps();
  const echo = async (argv: string[], d: Deps) => (d.out(argv.join(" ")), EXIT.OK);
  expect(await main(["echo", "a", "b"], deps, { echo })).toBe(EXIT.OK);
  expect(out).toEqual(["a b"]);
});

test("bad options become a usage error", async () => {
  const { deps, err } = fakeDeps();
  const strict = async (argv: string[]) => (parseArgs({ args: argv, options: {} }), EXIT.OK);
  expect(await main(["strict", "--nope"], deps, { strict })).toBe(EXIT.USAGE);
  expect(err[0]).toMatch(/nope/);
});

test("a refused holdout run exits 5 with the guard's message", async () => {
  const { deps, err } = fakeDeps();
  const refuse = async () => {
    throw new DirtyTreeError();
  };
  expect(await main(["eval"], deps, { eval: refuse })).toBe(EXIT.DIRTY_TREE);
  expect(err[0]).toMatch(/uncommitted changes/);
});
