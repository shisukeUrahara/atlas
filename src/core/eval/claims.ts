import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import type { LlmClient } from "../llm/port";
import type { Store } from "../store/sqlite";
import type { AnswerRecord } from "./answers";

export const ClaimJudgment = z.object({
  runId: z.string(),
  questionId: z.string(),
  claimIndex: z.number().int().nonnegative(),
  claim: z.string(),
  chunkIds: z.array(z.string()),
  verdict: z.enum(["supported", "partial", "unsupported"]),
  /** "llm" until the owner confirms or changes it in claims_review.csv. */
  source: z.enum(["llm", "owner"]),
});
export type ClaimJudgment = z.infer<typeof ClaimJudgment>;

const VERDICT = z.object({ verdict: z.enum(["supported", "partial", "unsupported"]) });
const SYSTEM = `You check whether documentation passages state a claim.
"supported": the passages state everything the claim says.
"partial": they state part of it, or the claim adds something not in them.
"unsupported": they do not state it. Judge only from the passages, never from outside knowledge.`;

/** One judge call per shown claim, with the full text of the chunks it cites. */
export async function judgeClaims(runId: string, records: readonly AnswerRecord[], store: Store, llm: LlmClient, model: string): Promise<ClaimJudgment[]> {
  const out: ClaimJudgment[] = [];
  for (const r of records.filter((x) => x.status === "answered")) {
    for (const [i, cl] of r.claims.entries()) {
      const passages = cl.chunkIds.map((id, k) => {
        const ch = store.chunk(r.workspaceId, id);
        return `[${k + 1}] ${ch ? `${ch.title} > ${ch.heading}\n${ch.text}` : "(missing)"}`;
      });
      const res = await llm.complete({
        model,
        temperature: 0,
        max_completion_tokens: 20,
        response_format: JSON.parse(JSON.stringify(zodResponseFormat(VERDICT, "claim_support"))),
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Claim: ${cl.text}\n\nPassages:\n${passages.join("\n\n---\n\n")}` },
        ],
      });
      const v = res.content ? VERDICT.safeParse(JSON.parse(res.content)) : null;
      out.push({ runId, questionId: r.id, claimIndex: i, claim: cl.text, chunkIds: cl.chunkIds, verdict: v?.success ? v.data.verdict : "unsupported", source: "llm" });
    }
  }
  return out;
}

export function supportRate(js: readonly ClaimJudgment[]): { n: number; supported: number; partial: number; unsupported: number } {
  const n = js.length;
  const c = (v: ClaimJudgment["verdict"]) => (n ? js.filter((j) => j.verdict === v).length / n : 0);
  return { n, supported: c("supported"), partial: c("partial"), unsupported: c("unsupported") };
}
