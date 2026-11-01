import OpenAI from "openai";
import { normalize, type Embedder } from "./port";

const BATCH = 96;

/** Minimal slice of the OpenAI client, so tests can fake it. */
export interface EmbeddingsApi {
  embeddings: { create(body: { model: string; input: string[] }): Promise<{ data: { index: number; embedding: number[] }[] }> };
}

export class OpenAiEmbedder implements Embedder {
  readonly dims = 1536;
  private readonly api: EmbeddingsApi;

  constructor(
    readonly model: string,
    opts: { apiKey?: string; api?: EmbeddingsApi },
  ) {
    this.api = opts.api ?? new OpenAI({ apiKey: opts.apiKey, maxRetries: 3, timeout: 60_000 });
  }

  async embed(texts: readonly string[]): Promise<Float32Array[]> {
    const out: Float32Array[] = [];
    for (let i = 0; i < texts.length; i += BATCH) {
      const input = texts.slice(i, i + BATCH);
      const res = await this.api.embeddings.create({ model: this.model, input });
      const sorted = [...res.data].sort((a, b) => a.index - b.index);
      if (sorted.length !== input.length) throw new Error(`expected ${input.length} embeddings, got ${sorted.length}`);
      out.push(...sorted.map((d) => normalize(Float32Array.from(d.embedding))));
    }
    return out;
  }
}
