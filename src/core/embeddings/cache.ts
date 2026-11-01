import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { sha256Hex } from "../corpus/sources";
import { EmbeddingCacheMissError, type Embedder } from "./port";

/** Bump when the key recipe or storage format changes. */
const CACHE_V = 1;

export const embeddingKey = (model: string, text: string) => sha256Hex(`${CACHE_V}\0${model}\0${text}`).slice(0, 32);

const encode = (v: Float32Array) => Buffer.from(Float16Array.from(v).buffer).toString("base64");
function decode(b64: string): Float32Array {
  const buf = Buffer.from(b64, "base64");
  return Float32Array.from(new Float16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2));
}

/**
 * Append-only disk cache: cache/embeddings/<model>.jsonl, one {k, v} line per text, v = base64 float16.
 * With inner = null it is replay mode: any miss throws EmbeddingCacheMissError and nothing is called.
 */
export class CachingEmbedder implements Embedder {
  readonly stats = { hits: 0, misses: 0 };
  private map: Map<string, string> | null = null;

  constructor(
    private readonly inner: Embedder | null,
    private readonly dir: string,
    readonly model: string,
    readonly dims: number,
  ) {}

  private get file() {
    return path.join(this.dir, `${this.model.replace(/[^A-Za-z0-9._-]/g, "_")}.jsonl`);
  }

  private load(): Map<string, string> {
    if (this.map) return this.map;
    const map = new Map<string, string>();
    if (existsSync(this.file)) {
      for (const line of readFileSync(this.file, "utf8").split("\n")) {
        if (!line.trim()) continue;
        const { k, v } = JSON.parse(line) as { k: string; v: string };
        map.set(k, v);
      }
    }
    this.map = map;
    return map;
  }

  has(text: string): boolean {
    return this.load().has(embeddingKey(this.model, text));
  }

  async embed(texts: readonly string[]): Promise<Float32Array[]> {
    const map = this.load();
    const keys = texts.map((t) => embeddingKey(this.model, t));
    const missing = [...new Set(texts.filter((_, i) => !map.has(keys[i])))];
    this.stats.hits += texts.length - texts.filter((_, i) => !map.has(keys[i])).length;
    if (missing.length) {
      if (!this.inner) throw new EmbeddingCacheMissError(missing.length);
      this.stats.misses += missing.length;
      const vectors = await this.inner.embed(missing);
      mkdirSync(this.dir, { recursive: true });
      const lines = missing.map((t, i) => {
        const k = embeddingKey(this.model, t);
        const v = encode(vectors[i]);
        map.set(k, v);
        return JSON.stringify({ k, v });
      });
      appendFileSync(this.file, lines.join("\n") + "\n");
    }
    return keys.map((k) => decode(map.get(k)!));
  }
}
