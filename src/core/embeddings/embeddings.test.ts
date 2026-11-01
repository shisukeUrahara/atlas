import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { CachingEmbedder } from "./cache";
import { FakeEmbedder } from "./fake";
import { OpenAiEmbedder, type EmbeddingsApi } from "./openai";
import { dot, EmbeddingCacheMissError } from "./port";

const tmp = () => mkdtempSync(path.join(tmpdir(), "atlas-emb-"));

describe("FakeEmbedder", () => {
  test("unit vectors; shared words mean higher similarity", async () => {
    const [a, b, c] = await new FakeEmbedder().embed(["checkpointer saves state", "the checkpointer saves", "stream tokens"]);
    expect(dot(a, a)).toBeCloseTo(1, 5);
    expect(dot(a, b)).toBeGreaterThan(dot(a, c));
  });
});

describe("CachingEmbedder", () => {
  test("second call is served from disk; float16 keeps vectors close", async () => {
    const dir = tmp();
    const fake = new FakeEmbedder();
    const live = new CachingEmbedder(fake, dir, fake.model, fake.dims);
    const [v1] = await live.embed(["checkpointer saves state"]);
    const replay = new CachingEmbedder(null, dir, fake.model, fake.dims);
    const [v2] = await replay.embed(["checkpointer saves state"]);
    expect(fake.calls).toBe(1);
    expect(replay.stats).toEqual({ hits: 1, misses: 0 });
    expect(dot(v1, v2)).toBeCloseTo(1, 2); // float16 storage costs ~0.001 of cosine
  });

  test("replay mode refuses a miss instead of calling the API", async () => {
    const replay = new CachingEmbedder(null, tmp(), "m", 4);
    await expect(replay.embed(["never seen"])).rejects.toBeInstanceOf(EmbeddingCacheMissError);
  });

  test("only missing texts are sent, duplicates once", async () => {
    const fake = new FakeEmbedder();
    const c = new CachingEmbedder(fake, tmp(), fake.model, fake.dims);
    await c.embed(["a b c"]);
    await c.embed(["a b c", "d e f", "d e f"]);
    expect(c.stats.misses).toBe(2);
  });
});

describe("OpenAiEmbedder", () => {
  test("batches by 96, restores order by index and normalizes", async () => {
    const sizes: number[] = [];
    const api: EmbeddingsApi = {
      embeddings: {
        create: async ({ input }) => {
          sizes.push(input.length);
          return { data: input.map((t, index) => ({ index, embedding: [t.length, 0, 0] })).reverse() };
        },
      },
    };
    const e = new OpenAiEmbedder("text-embedding-3-small", { api });
    const texts = Array.from({ length: 100 }, (_, i) => "x".repeat(i + 1));
    const out = await e.embed(texts);
    expect(sizes).toEqual([96, 4]);
    expect(out).toHaveLength(100);
    expect(Array.from(out[5])).toEqual([1, 0, 0]);
  });
});
