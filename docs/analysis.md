# Holdout analysis

> **Labels: LLM-drafted, pending owner review.** Every number below uses gold passages and question classes that an LLM drafted and an LLM judge checked (docs/labeling_guide.md). They are not owner-reviewed yet. After review, `pnpm atlas apply-review` updates the labels and the same holdout runs are re-scored; the system is not changed.

Runs (each folder has a manifest, per-question results, scores and checksums):
- Retrieval: `runs/retrieval/20261103T043542Z-holdout` (48 answerable questions, git 0ff298f)
- Answers: `runs/answers/20261103T043818Z-holdout` (80 questions, gpt-4.1-mini-2025-04-14, prompt answer-v1)

Both were run once. Tuning runs (40 questions) came first and nothing was changed after the holdout runs.

## Retrieval

| Method | Recall@5 [95% CI] | MRR@10 |
|---|---|---|
| BM25 | 0.875 [0.771, 0.958] | 0.804 |
| Dense | 0.917 [0.833, 0.979] | 0.857 |
| Hybrid (RRF, k=60) | 0.938 [0.854, 1.000] | 0.911 |

By class (Recall@5, n = 16 each):

| Class | BM25 | Dense | Hybrid |
|---|---|---|---|
| exact_id | **1.000** | 0.813 | 0.938 |
| paraphrase | 0.938 | **1.000** | **1.000** |
| version_new | 0.688 | **0.938** | 0.875 |

What this says:
- **Keyword search owns exact API names.** BM25 found the labeled passage in the top 5 for every exact_id question; vectors missed 3 of 16. This repeats the SearchLab result on a different corpus.
- **Vectors win on the new docs.** On version_new questions BM25 found only 11 of 16. These pages describe new features in new words, and the questions paraphrase them.
- **Hybrid is best overall but not proven better.** Hybrid vs BM25 on hit@5: 4 questions only hybrid got, 1 only BM25 got, exact McNemar p = 0.375 (Holm 0.75). Hybrid vs Dense: 3 vs 2, p = 1.0. With 48 questions these differences are not significant.
- The MRR gain of hybrid over BM25 is +0.107, paired bootstrap [0.019, 0.203]. Over Dense it is +0.054 [−0.030, 0.142]. These two intervals are not adjusted for multiple comparisons.

Hybrid misses at rank 5 (all three are rank 6–8, never absent):
- q020 exact_id: BM25 rank 5, Dense not in top 10, Hybrid rank 8. Fusion pulled a strong keyword hit down.
- q055 / q056 version_new: Dense rank 1 and 3, BM25 not in top 10, Hybrid rank 6. Fusion pulled a strong vector hit down.

Both directions of the same RRF weakness: when one method is confident and the other finds nothing, equal-weight fusion halves the confident method's score.

## Answers

| Measure | Holdout (n = 80) |
|---|---|
| Right outcome (answer answerable, abstain otherwise) | 96.3% |
| Abstain recall (unanswerable + cross_workspace, 32) | 96.9% (31) |
| False abstain (answerable, 48) | 4.2% (2) |
| Cited-claim rate (claims shown / drafted) | 100% |
| Answers citing a labeled gold passage | 100% of answered answerable questions |
| Cross-workspace leaks | 0 |
| Failed (schema / refusal) | 0 |
| Latency p50 / p95 | 1.35 s / 2.99 s |
| Cost of the run | $0.075 |
| Claims judged supported by their cited passage | 98.3% of 178 (LLM-judged) |

The three wrong outcomes:
- **q104** (cross_workspace, asked in LangChain): "How can section titles improve the ease of skimming content?" Atlas answered from a LangChain report-writing passage. The question was meant to be Cookbook-only, but LangChain's docs do talk about section titles. This looks like a labeling miss (the pooled judge found no answering chunk, the answer step did), not a leak: every cited chunk is in the LangChain index. Owner review should reclassify or drop it.
- **q036** (paraphrase): "How do you ensure all necessary data is copied when duplicating a sequence with incremental snapshots?" The model said the passages were insufficient.
- **q069** (version_new): "How can I prevent a long-running task from being stopped due to inactivity in langgraph?" Same.

Both false abstentions are the cautious failure: Atlas declined rather than guessed.

## Limits
- Labels are LLM-drafted and LLM-judged, from the same model family that answers. The claim-support check in particular is likely lenient.
- One run per configuration, temperature 0, cached replies: no measure of run-to-run variance.
- 48 / 80 holdout questions: intervals are wide; per-class numbers rest on 16 questions each.
- The cross_workspace class was filtered by a judge that only sees the pooled top results; q104 shows that filter can miss.
