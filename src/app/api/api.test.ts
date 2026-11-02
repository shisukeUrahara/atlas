/**
 * Route handlers called in-process against a real SQLite file in a temp folder.
 * Replay mode (no API key): dense search is off and new answers return 503 not_cached.
 */
import { cpSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, test } from "vitest";

const dataDir = mkdtempSync(path.join(tmpdir(), "atlas-api-"));
process.env.ATLAS_DATA_DIR = dataDir;
delete process.env.OPENAI_API_KEY;
delete process.env.ATLAS_QDRANT_URL;

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;
let search: (req: Request) => Promise<Response>;
let answer: (req: Request) => Promise<Response>;
let upload: Handler;
let job: Handler;
let trace: Handler;

beforeAll(async () => {
  cpSync("fixtures/cookbook", path.join(dataDir, "fixtures", "cookbook"), { recursive: true });
  const { buildCorpus } = await import("@/core/corpus/build");
  const { runIngestJob } = await import("@/core/ingest/ingest");
  const { openStore } = await import("@/core/store/open");
  const store = openStore(dataDir);
  store.upsertWorkspace({ id: "cookbook", name: "OpenAI Cookbook", source: "openai/openai-cookbook", license: "MIT" });
  const dir = path.join(dataDir, "fixtures", "cookbook");
  runIngestJob(store, "seed", "cookbook", buildCorpus("cookbook", dir, JSON.parse(readFileSync(path.join(dir, "source_manifest.json"), "utf8"))), "MIT");
  store.close();
  search = (await import("./search/route")).POST;
  answer = (await import("./answer/route")).POST;
  upload = (await import("./workspaces/[id]/documents/route")).POST as unknown as Handler;
  job = (await import("./workspaces/[id]/jobs/[jobId]/route")).GET as unknown as Handler;
  trace = (await import("./traces/[id]/route")).GET as unknown as Handler;
});

const json = (url: string, body: unknown, user = "alice") =>
  new Request(`http://t${url}`, { method: "POST", headers: { "content-type": "application/json", cookie: `atlas_user=${user}` }, body: JSON.stringify(body) });
const params = (p: Record<string, string>) => ({ params: Promise.resolve(p) });

async function multipart(url: string, name: string, text: string, user = "alice") {
  const form = new FormData();
  form.set("file", new File([text], name, { type: "text/markdown" }));
  const probe = new Response(form);
  const body = new Uint8Array(await probe.arrayBuffer());
  return new Request(`http://t${url}`, {
    method: "POST",
    headers: { "content-type": probe.headers.get("content-type")!, "content-length": String(body.byteLength), cookie: `atlas_user=${user}` },
    body,
  });
}

describe("API routes (replay mode)", () => {
  test("search: BM25 hits, dense reports it is off, hybrid falls back", async () => {
    const res = await search(json("/api/search", { workspaceId: "cookbook", query: "embeddings cosine similarity", topK: 3 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    const by = Object.fromEntries(body.results.map((r: { method: string }) => [r.method, r]));
    expect(by.bm25.hits.length).toBe(3);
    expect(by.dense.unavailable).toMatch(/not cached/);
    expect(by.hybrid.unavailable).toMatch(/^BM25 only/);
  });

  test("search: denied workspace 403, bad body 400", async () => {
    expect((await search(json("/api/search", { workspaceId: "langchain", query: "x" }, "bob"))).status).toBe(403);
    expect((await search(json("/api/search", { workspaceId: "cookbook", query: "" }))).status).toBe(400);
  });

  test("upload -> job status; bob cannot see it; reference corpora are read-only", async () => {
    const md = "# Notes\n\n## Retries\n\nUse exponential backoff with jitter when the API returns 429 errors.\n";
    const res = await upload(await multipart("/api/workspaces/uploads/documents", "notes.md", md), params({ id: "uploads" }));
    expect(res.status).toBe(201);
    const { jobId } = await res.json();
    const ok = await job(new Request("http://t/x", { headers: { cookie: "atlas_user=alice" } }), params({ id: "uploads", jobId }));
    expect((await ok.json()).status).toBe("done");
    expect((await job(new Request("http://t/x", { headers: { cookie: "atlas_user=bob" } }), params({ id: "uploads", jobId }))).status).toBe(403);
    expect((await upload(await multipart("/api/workspaces/cookbook/documents", "n.md", md), params({ id: "cookbook" }))).status).toBe(403);
  });

  test("upload without Content-Length is refused", async () => {
    const req = new Request("http://t/api/workspaces/uploads/documents", { method: "POST", headers: { cookie: "atlas_user=alice" } });
    expect((await upload(req, params({ id: "uploads" }))).status).toBe(411);
  });

  test("answer: a question missing from the cache is 503 not_cached, never an API call", async () => {
    const res = await answer(json("/api/answer", { workspaceId: "cookbook", question: "How do I embed long inputs?" }));
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("not_cached");
  });

  test("trace: unknown id is 404, other user's workspace is 403", async () => {
    const get = (user: string, ws: string) => trace(new Request(`http://t/api/traces/req_0?workspace=${ws}`, { headers: { cookie: `atlas_user=${user}` } }), params({ id: "req_0" }));
    expect((await get("alice", "cookbook")).status).toBe(404);
    expect((await get("bob", "uploads")).status).toBe(403);
  });
});
