import { mkdirSync } from "node:fs";
import path from "node:path";
import { Store } from "./sqlite";

/** The app's database lives at <dataDir>/data/atlas.db (gitignored, a Docker volume in compose). */
export function openStore(dataDir: string): Store {
  const dir = path.join(dataDir, "data");
  mkdirSync(dir, { recursive: true });
  return new Store(path.join(dir, "atlas.db"));
}
