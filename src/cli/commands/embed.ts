import { parseArgs } from "node:util";
import { WorkspaceId } from "@/core/domain/schemas";
import { embeddingText } from "@/core/retrieval/dense";
import { openStore } from "@/core/store/open";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/**
 * atlas embed [--workspace <id>]: embeds every indexed chunk into cache/embeddings, so dense search
 * replays without a key. Only missing texts are sent; a second run makes no API call.
 */
export const embed: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { workspace: { type: "string" } } });
  const store = openStore(deps.dataDir);
  try {
    const ids = values.workspace ? [WorkspaceId.parse(values.workspace)] : store.workspaces().filter((w) => w.source !== "upload").map((w) => w.id);
    const embedder = deps.makeEmbedder();
    for (const ws of ids) {
      const chunks = store.chunks(ws);
      const texts = [...new Set(chunks.map(embeddingText))];
      const t0 = Date.now();
      await embedder.embed(texts);
      deps.out(`${ws}: ${chunks.length} chunks, ${texts.length} distinct texts embedded or cached (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    }
    return EXIT.OK;
  } finally {
    store.close();
  }
};
