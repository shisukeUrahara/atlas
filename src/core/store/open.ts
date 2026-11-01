import { mkdirSync } from "node:fs";
import path from "node:path";
import { Store } from "./sqlite";

/** The app's database lives at <dataDir>/data/atlas.db (gitignored, a Docker volume in compose). */
export function openStore(dataDir: string): Store {
  const dir = path.join(dataDir, "data");
  mkdirSync(dir, { recursive: true });
  const store = new Store(path.join(dir, "atlas.db"));
  // Uploads never mix with the reference corpora: they get their own workspace.
  store.upsertWorkspace({ id: "uploads", name: "My uploads", source: "upload", license: "user upload" });
  return store;
}
