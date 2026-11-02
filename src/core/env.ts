import { z } from "zod";

/** Dated snapshots, so results do not drift. */
export const DEFAULT_ANSWER_MODEL = "gpt-4.1-mini-2025-04-14";
export const DEFAULT_EMBED_MODEL = "text-embedding-3-small";

const Raw = z.object({
  OPENAI_API_KEY: z.string().trim().optional(),
  ATLAS_DATA_DIR: z.string().trim().optional(),
  // Empty means "not set": .env.example ships the variable with no value.
  ATLAS_QDRANT_URL: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.url().optional()),
  ATLAS_MODEL: z.string().trim().optional(),
});

export interface Env {
  /** `live` may call the API. `replay` answers only from the committed cache. */
  mode: "live" | "replay";
  apiKey: string | null;
  /** Folder that holds fixtures/, cache/, runs/ and data/. */
  dataDir: string;
  /** Qdrant URL, or null to use the in-process vector store. */
  qdrantUrl: string | null;
  model: string;
  embedModel: string;
}

/** Reads the variables Atlas knows. A bad value throws and names it. */
export function loadEnv(source: Record<string, string | undefined>, cwd = process.cwd()): Env {
  const parsed = Raw.safeParse(source);
  if (!parsed.success) {
    const names = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`invalid environment variable: ${names}`);
  }
  const apiKey = parsed.data.OPENAI_API_KEY || null;
  return {
    mode: apiKey ? "live" : "replay",
    apiKey,
    dataDir: parsed.data.ATLAS_DATA_DIR || cwd,
    qdrantUrl: parsed.data.ATLAS_QDRANT_URL ?? null,
    model: parsed.data.ATLAS_MODEL || DEFAULT_ANSWER_MODEL,
    embedModel: DEFAULT_EMBED_MODEL,
  };
}
