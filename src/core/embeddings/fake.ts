import { tokenize } from "../retrieval/tokenize";
import { sha256Hex } from "../corpus/sources";
import { normalize, type Embedder } from "./port";

/** Deterministic bag-of-tokens hashing embedder for tests: texts sharing words are similar. */
export class FakeEmbedder implements Embedder {
  readonly model = "fake-hash-64";
  readonly dims = 64;
  calls = 0;

  async embed(texts: readonly string[]): Promise<Float32Array[]> {
    this.calls++;
    return texts.map((t) => {
      const v = new Float32Array(this.dims);
      for (const tok of tokenize(t)) v[parseInt(sha256Hex(tok).slice(0, 8), 16) % this.dims] += 1;
      return normalize(v);
    });
  }
}
