import type { Chunk, ScoredChunk } from "../domain/schemas";

/** ponytail: ~4 characters per token for English docs; swap in a real tokenizer if budgets get tight. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export interface ContextItem {
  /** Citation label the model must use, e.g. "c1". */
  label: string;
  chunk: Chunk;
}

export interface AssembledContext {
  items: ContextItem[];
  /** Retrieved but left out because the budget was full. Recorded for the trace. */
  dropped: string[];
  tokens: number;
}

export const DEFAULT_CONTEXT_TOKENS = 3000;

/** Document text can never open or close the <passages> block that holds it. */
export const neutralizeTags = (text: string) => text.replace(/<\s*\/?\s*passages\s*>/gi, "[passages tag removed]");

const render = (label: string, c: Chunk) =>
  neutralizeTags(`[${label}] ${c.title}${c.heading ? ` > ${c.heading}` : ""}\n${c.text}`);

/**
 * Adds chunks in rank order while they fit the token budget. A chunk that does not fit is
 * dropped (not cut), so every quoted passage is complete. Labels follow inclusion order.
 */
export function assembleContext(hits: readonly ScoredChunk[], budget = DEFAULT_CONTEXT_TOKENS): AssembledContext {
  const items: ContextItem[] = [];
  const dropped: string[] = [];
  let tokens = 0;
  for (const h of hits) {
    const label = `c${items.length + 1}`;
    const cost = estimateTokens(render(label, h.chunk));
    if (tokens + cost > budget) {
      dropped.push(h.chunk.chunkId);
      continue;
    }
    items.push({ label, chunk: h.chunk });
    tokens += cost;
  }
  return { items, dropped, tokens };
}

/** The text block sent to the model, one labeled passage per chunk. */
export function renderContext(ctx: AssembledContext): string {
  return ctx.items.map((i) => render(i.label, i.chunk)).join("\n\n---\n\n");
}
