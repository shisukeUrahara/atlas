import path from "node:path";
import { CachingEmbedder } from "@/core/embeddings/cache";
import { OpenAiEmbedder } from "@/core/embeddings/openai";
import { loadEnv } from "@/core/env";
import { SearchService } from "@/core/search/service";
import { openStore } from "@/core/store/open";
import type { Store } from "@/core/store/sqlite";
import { MemoryVectorStore } from "@/core/vectors/memory";
import { QdrantVectorStore } from "@/core/vectors/qdrant";

interface Services {
  store: Store;
  search: SearchService;
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
  services = { store, search: new SearchService(store, embedder, vectors) };
  return services;
}
