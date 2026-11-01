import path from "node:path";
import { AnswerService } from "@/core/answer/service";
import { CachingEmbedder } from "@/core/embeddings/cache";
import { OpenAiEmbedder } from "@/core/embeddings/openai";
import { loadEnv } from "@/core/env";
import { CachingLlm } from "@/core/llm/cache";
import { OpenAiClient } from "@/core/llm/openai";
import { ResilientLlm } from "@/core/llm/resilient";
import { SearchService } from "@/core/search/service";
import { openStore } from "@/core/store/open";
import type { Store } from "@/core/store/sqlite";
import { MemoryVectorStore } from "@/core/vectors/memory";
import { QdrantVectorStore } from "@/core/vectors/qdrant";

interface Services {
  store: Store;
  search: SearchService;
  answers: AnswerService;
  model: string;
  replay: boolean;
}

let services: Services | null = null;

/** One store and one search service per server process (built on first use). */
export function getServices(): Services {
  if (services) return services;
  const env = loadEnv(process.env);
  const store = openStore(env.dataDir);
  const inner = env.apiKey ? new OpenAiEmbedder(env.embedModel, { apiKey: env.apiKey }) : null;
  const embedder = new CachingEmbedder(inner, path.join(env.dataDir, "cache", "embeddings"), env.embedModel, 1536);
  const vectors = env.qdrantUrl ? QdrantVectorStore.fromUrl(env.qdrantUrl, "atlas_chunks", 1536) : new MemoryVectorStore();
  const search = new SearchService(store, embedder, vectors);
  // Replay mode (no key): answers come only from cache/responses; a miss is reported, never sent.
  const live = env.apiKey ? new ResilientLlm(new OpenAiClient({ apiKey: env.apiKey }), {}) : null;
  const llm = new CachingLlm(live, { dir: path.join(env.dataDir, "cache", "responses") });
  services = { store, search, answers: new AnswerService(search, llm, env.model), model: env.model, replay: !env.apiKey };
  return services;
}
