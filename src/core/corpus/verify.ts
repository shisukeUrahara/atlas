import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { resolveInside, sha256Hex, type SourceManifest } from "./sources";

export interface VerifyProblem {
  path: string;
  problem: "missing" | "checksum";
}

/** Every file in the manifest must exist in snapshot/ with the recorded sha256. */
export function verifySnapshot(corpusDir: string, manifest: SourceManifest): VerifyProblem[] {
  const snapshot = path.join(corpusDir, "snapshot");
  const problems: VerifyProblem[] = [];
  for (const f of [...manifest.files, ...(manifest.includes ?? [])]) {
    const file = resolveInside(snapshot, f.path);
    if (!existsSync(file)) problems.push({ path: f.path, problem: "missing" });
    else if (sha256Hex(readFileSync(file)) !== f.sha256) problems.push({ path: f.path, problem: "checksum" });
  }
  return problems;
}
