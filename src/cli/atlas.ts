import { existsSync } from "node:fs";
import path from "node:path";
import { CachingEmbedder } from "@/core/embeddings/cache";
import { OpenAiEmbedder } from "@/core/embeddings/openai";
import { loadEnv } from "@/core/env";
import { CachingLlm } from "@/core/llm/cache";
import { OpenAiClient } from "@/core/llm/openai";
import { ResilientLlm } from "@/core/llm/resilient";
import { main } from "./main";

/** GET with 3 tries for network errors and 5xx; 404 resolves null. */
async function download(url: string): Promise<Uint8Array | null> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.status === 404) return null;
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
      if (res.status < 500 || attempt === 3) throw new Error(`GET ${url}: HTTP ${res.status}`);
    } catch (e) {
      if (attempt === 3 || (e instanceof Error && e.message.startsWith("GET "))) throw e;
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
}

// Node built-in; does not override variables that are already set.
if (existsSync(".env")) process.loadEnvFile(".env");
const env = loadEnv(process.env);

main(process.argv.slice(2), {
  dataDir: env.dataDir,
  model: env.model,
  makeEmbedder: () =>
    new CachingEmbedder(
      env.apiKey ? new OpenAiEmbedder(env.embedModel, { apiKey: env.apiKey }) : null,
      path.join(env.dataDir, "cache", "embeddings"),
      env.embedModel,
      1536,
    ),
  makeLlm: () =>
    new CachingLlm(env.apiKey ? new ResilientLlm(new OpenAiClient({ apiKey: env.apiKey }), {}) : null, {
      dir: path.join(env.dataDir, "cache", "responses"),
    }),
  download,
  now: () => new Date(),
  out: (line) => console.log(line),
  err: (line) => console.error(line),
}).then((code) => process.exit(code));
