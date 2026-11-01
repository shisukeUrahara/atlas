/** Turns texts into unit-length vectors, one per text, same order. */
export interface Embedder {
  readonly model: string;
  readonly dims: number;
  embed(texts: readonly string[]): Promise<Float32Array[]>;
}

export class EmbeddingCacheMissError extends Error {
  constructor(readonly missing: number) {
    super(`${missing} embedding(s) not in the cache and no API key (replay mode). Set OPENAI_API_KEY and run atlas embed.`);
  }
}

export function normalize(v: Float32Array): Float32Array {
  let n = 0;
  for (const x of v) n += x * x;
  n = Math.sqrt(n) || 1;
  return v.map((x) => x / n);
}

export function dot(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
