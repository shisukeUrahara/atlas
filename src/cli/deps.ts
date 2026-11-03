import type { Embedder } from "@/core/embeddings/port";
import type { LlmClient } from "@/core/llm/port";

/** Everything a command touches from the outside world, so tests can fake it. */
export interface Deps {
  /** Cached embedder: live with a key, replay-only without. */
  makeEmbedder: () => Embedder;
  /** Cached model client: live with a key, replay-only without. */
  makeLlm: () => LlmClient;
  model: string;
  /** True when there is no API key: every model / embedding call must come from the cache. */
  replay: boolean;
  dataDir: string;
  /** GET a URL. Resolves null on 404, throws on other errors. */
  download: (url: string) => Promise<Uint8Array | null>;
  now: () => Date;
  out: (line: string) => void;
  err: (line: string) => void;
}

export type Command = (argv: string[], deps: Deps) => Promise<number>;
