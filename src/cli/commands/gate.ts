import path from "node:path";
import { AnswerService } from "@/core/answer/service";
import { listRuns, readRunFile } from "@/core/artifacts/runs";
import { readJsonl } from "@/core/dataset/jsonl";
import { runAnswers } from "@/core/eval/answers";
import { METHODS, runRetrieval, scoreRetrieval } from "@/core/eval/retrieval";
import { LabeledCase } from "@/core/evalset/questions";
import { summarizeAnswers } from "@/core/metrics/answers";
import { SearchService } from "@/core/search/service";
import { openStore } from "@/core/store/open";
import { MemoryVectorStore } from "@/core/vectors/memory";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** Quality floor on the tuning split. Leaks are a hard zero. */
export const FLOOR = { rightOutcome: 0.9, abstainRecall: 0.9, leaks: 0, failed: 0 };

/**
 * atlas gate: re-runs the tuning split (retrieval + answers) and
 * 1) checks the scores equal the newest committed tuning runs (replay is exact),
 * 2) checks the quality floor. Meant for CI, where there is no key and every call must hit the cache.
 */
export const gate: Command = async (_argv, deps) => {
  const cases = readJsonl(path.join(deps.dataDir, "fixtures", "eval", "questions.jsonl"), LabeledCase).filter((c) => c.split === "tuning");
  const lastR = listRuns(deps.dataDir, "retrieval").find((r) => r.manifest.split === "tuning");
  const lastA = listRuns(deps.dataDir, "answers").find((r) => r.manifest.split === "tuning");
  if (!lastR || !lastA) {
    deps.err("no committed tuning runs to compare with");
    return EXIT.CHECK_FAILED;
  }
  const store = openStore(deps.dataDir);
  const problems: string[] = [];
  try {
    const search = new SearchService(store, deps.makeEmbedder(), new MemoryVectorStore());
    const r = scoreRetrieval(await runRetrieval(cases, search));
    const committedR = JSON.parse(readRunFile(deps.dataDir, "retrieval", lastR.id, "scores.json")!);
    for (const m of METHODS)
      for (const k of ["recall@5", "mrr@10"] as const)
        if (Math.abs(r.overall[m][k].point - committedR.overall[m][k].point) > 1e-9) problems.push(`retrieval ${m} ${k}: ${r.overall[m][k].point} != committed ${committedR.overall[m][k].point}`);

    const answers = new AnswerService(search, deps.makeLlm(), deps.model);
    const a = summarizeAnswers(await runAnswers(cases, answers, store, () => 0));
    const committedA = JSON.parse(readRunFile(deps.dataDir, "answers", lastA.id, "scores.json")!).overall;
    for (const k of ["rightOutcome", "abstainRecall", "citedClaimRate", "leaks"] as const)
      if (Math.abs(a[k] - committedA[k]) > 1e-9) problems.push(`answers ${k}: ${a[k]} != committed ${committedA[k]}`);
    if (a.rightOutcome < FLOOR.rightOutcome) problems.push(`right outcome ${a.rightOutcome} < ${FLOOR.rightOutcome}`);
    if (a.abstainRecall < FLOOR.abstainRecall) problems.push(`abstain recall ${a.abstainRecall} < ${FLOOR.abstainRecall}`);
    if (a.leaks > FLOOR.leaks) problems.push(`${a.leaks} cross-workspace leak(s)`);
    if (a.failed > FLOOR.failed) problems.push(`${a.failed} failed answer(s)`);
    for (const p of problems) deps.err(p);
    deps.out(problems.length ? `gate FAILED (${problems.length})` : `gate ok: tuning replay matches ${lastR.id} and ${lastA.id}; floor met`);
    return problems.length ? EXIT.CHECK_FAILED : EXIT.OK;
  } finally {
    store.close();
  }
};
