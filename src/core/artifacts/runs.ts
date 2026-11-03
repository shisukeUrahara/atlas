import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sha256Hex } from "../corpus/sources";
import { RunManifest, type RunKind } from "./manifest";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** `20261103T101500Z-holdout`. Sorts by time and is a safe folder name. */
export function runId(createdAt: Date, split: string): string {
  return `${createdAt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}-${split}`;
}

/** `Holdout · retrieval · 3 Nov 2026 10:15 UTC`. */
export function runLabel(kind: RunKind, split: string, d: Date): string {
  const when = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
  return `${split === "holdout" ? "Holdout" : "Tuning"} · ${kind} · ${when}`;
}

const SAFE_ID = /^[0-9A-Za-z_-]+$/;
export const runsDir = (dataDir: string, kind: RunKind) => path.join(dataDir, "runs", kind);

/** Writes the files, then checksums.txt over them (sha256sum -c compatible). */
export function writeRunFolder(dir: string, files: Record<string, string>): void {
  mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) writeFileSync(path.join(dir, name), body);
  const lines = Object.keys(files)
    .sort()
    .map((name) => `${sha256Hex(readFileSync(path.join(dir, name)))}  ${name}`);
  writeFileSync(path.join(dir, "checksums.txt"), lines.join("\n") + "\n");
}

export interface RunSummary {
  id: string;
  kind: RunKind;
  manifest: RunManifest;
}

/** Finished runs of one kind, newest first. Folders without a manifest are skipped. */
export function listRuns(dataDir: string, kind: RunKind): RunSummary[] {
  const root = runsDir(dataDir, kind);
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && SAFE_ID.test(e.name) && existsSync(path.join(root, e.name, "run_manifest.json")))
    .map((e) => ({ id: e.name, kind, manifest: RunManifest.parse(JSON.parse(readFileSync(path.join(root, e.name, "run_manifest.json"), "utf8"))) }))
    .sort((a, b) => b.manifest.created_at_utc.localeCompare(a.manifest.created_at_utc) || b.id.localeCompare(a.id));
}

/** Reads one file of a run; refuses ids that are not plain folder names. */
export function readRunFile(dataDir: string, kind: RunKind, id: string, file: string): string | null {
  if (!SAFE_ID.test(id) || !/^[\w.-]+$/.test(file)) return null;
  const p = path.join(runsDir(dataDir, kind), id, file);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}
