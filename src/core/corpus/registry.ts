import type { WorkspaceId } from "../domain/schemas";

export interface CorpusSpec {
  /** Workspace the corpus is ingested into. Older snapshots share their workspace. */
  workspaceId: WorkspaceId;
  workspaceName: string;
}

export const CORPORA: Record<string, CorpusSpec> = {
  langchain: { workspaceId: "langchain", workspaceName: "LangChain docs" },
  "langchain-old": { workspaceId: "langchain", workspaceName: "LangChain docs" },
  cookbook: { workspaceId: "cookbook", workspaceName: "OpenAI Cookbook" },
};

export function getCorpus(name: string): CorpusSpec {
  const spec = CORPORA[name];
  if (!spec) throw new Error(`unknown corpus "${name}" (known: ${Object.keys(CORPORA).join(", ")})`);
  return spec;
}
