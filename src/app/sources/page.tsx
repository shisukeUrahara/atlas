import type { Metadata } from "next";
import { Denied } from "@/components/Denied";
import { DocTable } from "@/components/sources/DocTable";
import { UploadButton } from "@/components/sources/UploadButton";
import { VersionDiff } from "@/components/sources/VersionDiff";
import { Card } from "@/components/ui/Card";
import { Empty } from "@/components/ui/Empty";
import { WorkspaceTabs } from "@/components/WorkspaceTabs";
import { getServices } from "../api/_lib/services";
import { pageUser } from "../_lib/session";
import { chooseWorkspace } from "../_lib/workspace";

export const metadata: Metadata = { title: "Sources" };

export default async function SourcesPage({ searchParams }: PageProps<"/sources">) {
  const sp = await searchParams;
  const user = await pageUser();
  const { workspaces, current, requested } = chooseWorkspace(user, sp.ws);
  const status = typeof sp.status === "string" && ["indexed", "failed"].includes(sp.status) ? sp.status : "all";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight">Sources</h1>
          <p className="mt-1 max-w-xl text-muted">
            Documents in {current?.name ?? "this workspace"}. Each one is hashed, chunked and versioned.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <WorkspaceTabs workspaces={workspaces} current={current?.id ?? ""} path="/sources" />
          {current?.source === "upload" && <UploadButton workspaceId={current.id} />}
        </div>
      </header>
      {!current ? (
        <Denied user={user} workspace={requested} />
      ) : (
        <SourcesBody wsId={current.id} source={current.source} status={status} />
      )}
    </div>
  );
}

function SourcesBody({ wsId, source, status }: { wsId: string; source: string; status: string }) {
  const { store } = getServices();
  const docs = store.documents(wsId);
  const version = store.indexVersion(wsId);
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Card className="lg:col-span-8" title="Documents" hint={source === "upload" ? "Files you uploaded." : `Pinned snapshot of ${source}.`}>
        {docs.length ? (
          <DocTable docs={docs} counts={store.chunkCounts(wsId)} ws={wsId} filter={status} />
        ) : (
          <Empty title="No documents yet" hint={source === "upload" ? "Upload a PDF or Markdown file to start." : "Run pnpm atlas ingest for this corpus."} />
        )}
      </Card>
      <div className="space-y-6 lg:col-span-4">
        <Card title="Latest index version" hint="What the last ingest changed.">
          <VersionDiff version={version} info={store.indexVersionInfo(wsId, version)} changes={store.indexChanges(wsId, version)} />
        </Card>
        <Card title="Upload rules">
          <ul className="space-y-1.5 text-sm text-muted">
            <li>PDF, Markdown (.md, .mdx) or .txt</li>
            <li>Up to 20 MB; PDFs up to 500 pages</li>
            <li>PDFs need a text layer (no OCR)</li>
            <li>Uploads go to “My uploads”; reference docs are read-only</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
