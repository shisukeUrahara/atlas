import type { Metadata } from "next";
import { Denied } from "@/components/Denied";
import { LabSearch } from "@/components/lab/LabSearch";
import type { SearchResponse } from "@/components/lab/types";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import { getServices } from "../api/_lib/services";
import { pageUser } from "../_lib/session";
import { chooseWorkspace } from "../_lib/workspace";

export const metadata: Metadata = { title: "Retrieval Lab" };

export default async function LabPage({ searchParams }: PageProps<"/lab">) {
  const sp = await searchParams;
  const user = await pageUser();
  const { workspaces, current, requested } = chooseWorkspace(user, sp.ws);
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 500) : "";
  const initialData = current && q ? await searchOnServer(current.id, q) : null;
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight">Retrieval Lab</h1>
          <p className="mt-1 max-w-xl text-muted">One question, three search methods, side by side.</p>
        </div>
        <WorkspaceTabs workspaces={workspaces} current={current?.id ?? ""} path="/lab" />
      </header>
      {current ? <LabSearch key={current.id} workspaceId={current.id} initialQuery={q} initialData={initialData} /> : <Denied user={user} workspace={requested} />}
    </div>
  );
}

/** Same shape as POST /api/search, so the client can keep using it after the first render. */
async function searchOnServer(workspaceId: string, query: string): Promise<SearchResponse> {
  const { indexVersion, results } = await getServices().search.search(workspaceId, query, ["bm25", "dense", "hybrid"], 10);
  return {
    workspaceId,
    indexVersion,
    results: results.map((r) => ({
      method: r.method,
      unavailable: r.unavailable,
      hits: r.hits.map((h) => ({
        rank: h.rank, score: h.score, chunkId: h.chunk.chunkId, title: h.chunk.title,
        heading: h.chunk.heading, url: h.chunk.url, snippet: h.chunk.text.slice(0, 280),
      })),
    })),
  };
}
