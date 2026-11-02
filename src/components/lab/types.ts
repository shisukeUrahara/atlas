import type { Method } from "@/core/domain/schemas";

/** Shape returned by POST /api/search. */
export interface SearchHit {
  rank: number;
  score: number;
  chunkId: string;
  title: string;
  heading: string;
  url: string;
  snippet: string;
}

export interface SearchResponse {
  workspaceId: string;
  indexVersion: number;
  results: { method: Method; unavailable: string | null; hits: SearchHit[] }[];
}

/** Repo path from a GitHub blob URL ("…/blob/<sha>/src/oss/x.mdx" -> "src/oss/x.mdx"); other URLs as-is. */
export function shortPath(url: string): string {
  const m = /\/blob\/[0-9a-f]{7,40}\/(.+)$/.exec(url);
  return m ? m[1] : url.replace(/^upload:/, "");
}
