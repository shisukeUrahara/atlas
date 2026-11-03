import { expect, test } from "vitest";
import type { Chunk } from "../domain/schemas";
import type { LlmClient, LlmRequest } from "../llm/port";
import { bannedWords, draftQuestions, identifiersIn, PLAN } from "./draft";

test("identifiers: CamelCase, snake_case and dotted names", () => {
  expect(identifiersIn("Use InMemorySaver with thread_id via langgraph.checkpoint and e.g. foo")).toEqual(["InMemorySaver", "thread_id", "langgraph.checkpoint"]);
});

test("banned words come from title and heading, 6+ letters", () => {
  const c = { title: "Short-term memory", heading: "Enable checkpointers" } as Chunk;
  expect(bannedWords(c)).toEqual(["memory", "enable", "checkpointers"]);
});

test("the plan has 24 questions per class, 120 in all", () => {
  const per = new Map<string, number>();
  for (const s of PLAN) per.set(s.cls, (per.get(s.cls) ?? 0) + s.n);
  expect([...per.values()]).toEqual([24, 24, 24, 24, 24]);
});

/** Fake model: echoes the identifier for exact_id, a fixed paraphrase otherwise, inventions on request. */
class Scripted implements LlmClient {
  n = 0;
  async complete(req: LlmRequest) {
    const u = req.messages[1].content;
    this.n++;
    let content: string;
    if (u.includes("do NOT exist")) {
      content = JSON.stringify({ items: Array.from({ length: 40 }, (_, i) => ({ question: `How do I use frobnicate_${i}?`, invented_identifier: `frobnicate_${i}` })) });
    } else {
      const id = /names `([^`]+)`/.exec(u)?.[1];
      content = JSON.stringify({ question: id ? `What does ${id} do in number ${this.n}?` : `Question number ${this.n}?` });
    }
    return { content, refusal: null, finish_reason: "stop", usage: { prompt_tokens: 0, completion_tokens: 0 }, latency_ms: 0, cached: false };
  }
}

const chunk = (ws: string, i: number, text: string, doc = "d"): Chunk => ({
  chunkId: `${ws.slice(0, 1)}${String(i).padStart(15, "0")}`.slice(0, 16).replace(/[^0-9a-f]/g, "a"),
  documentId: `${doc}${i % 3}`, workspaceId: ws, title: `Page ${i}`, heading: `Part ${i}`, text, url: "u", page: null,
});

test("drafts the full plan with unique ids and the asked-in workspace", async () => {
  const body = (i: number) => `Use ToolNode${i}Runner to run tools. ${"Plain prose explaining the feature in detail. ".repeat(8)}`;
  const lc = Array.from({ length: 80 }, (_, i) => ({ ...chunk("langchain", i, body(i), "n"), chunkId: (1000 + i).toString(16).padStart(16, "0") }));
  const cb = Array.from({ length: 40 }, (_, i) => ({ ...chunk("cookbook", i, body(i + 100)), chunkId: (5000 + i).toString(16).padStart(16, "0") }));
  const newDocIds = new Set(lc.map((c) => c.documentId));
  const out = await draftQuestions(new Scripted(), "m", { langchain: lc, cookbook: cb, newDocIds });
  expect(out).toHaveLength(120);
  expect(new Set(out.map((q) => q.id)).size).toBe(120);
  expect(out.filter((q) => q.queryClass === "cross_workspace" && q.workspaceId === "langchain").every((q) => q.seedWorkspaceId === "cookbook")).toBe(true);
  expect(out.filter((q) => q.queryClass === "unanswerable").every((q) => q.seedChunkId === null)).toBe(true);
});
