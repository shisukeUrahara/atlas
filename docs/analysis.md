# Holdout analysis

> **Labels: LLM-drafted, cross-checked by a second model (Claude), not hand-checked.** GPT-4.1-mini drafted every question and gold passage and a GPT-4.1-mini judge checked them. Then a second model family (Claude) reviewed all 120 questions against their gold passages and retrieval pools (docs/labeling_guide.md): 80 kept, 27 gold sets fixed, 13 questions dropped. No person checked the labels.

Runs (each folder has a manifest, per-question results, scores and checksums):
- Retrieval: `runs/retrieval/20261103T114450Z-holdout` (42 answerable questions)
- Answers: `runs/answers/20261103T114451Z-holdout` (74 questions, gpt-4.1-mini-2025-04-14, prompt answer-v1)

Both are re-scores on the reviewed labels. They replay the model replies and embeddings of the original live holdout runs (`20261103T043542Z-holdout`, `20261103T043818Z-holdout`) from the committed cache, so the system's behaviour is unchanged; only the answer key changed. Latency and cost come from the live run. Nothing in the system was changed after the holdout runs.

## What the review changed
- 13 questions dropped: 8 `exact_id` questions that named no API symbol (an image file, a URL, a product name) or were ambiguous ("the code snippet" when there are two), 3 paraphrases that copied the passage's wording or were too vague, 1 `version_new` question that was a list of headings, 1 `cross_workspace` question that referred to "the passage".
- 27 gold sets fixed: mostly passages that only mentioned the topic in passing were removed, and a few passages that also state the answer were added.
- Holdout: 48 → 42 answerable questions, 80 → 74 in total. Tuning: 24 → 18 answerable, 40 → 33 in total.

## Retrieval

| Method | Recall@5 [95% CI] | MRR@10 |
|---|---|---|
| BM25 | 0.833 [0.714, 0.929] | 0.778 |
| Dense | 0.905 [0.810, 0.976] | 0.854 |
| Hybrid (RRF, k=60) | 0.929 [0.833, 1.000] | 0.895 |

By class (Recall@5):

| Class | n | BM25 | Dense | Hybrid |
|---|---|---|---|---|
| exact_id | 11 | **1.000** | 0.818 | **1.000** |
| paraphrase | 16 | 0.938 | 0.938 | 0.938 |
| version_new | 15 | 0.600 | **0.933** | 0.867 |

What this says:
- **Keyword search owns exact API names.** BM25 found a labeled passage in the top 5 for every exact_id question; vectors missed 2 of 11. This repeats the SearchLab result on a different corpus.
- **Vectors win on the new docs.** On version_new questions BM25 found only 9 of 15. These pages describe new features in new words, and the questions paraphrase them.
- **Hybrid is best overall but not proven better.** Hybrid vs BM25 on hit@5: 5 questions only hybrid got, 1 only BM25 got, exact McNemar p = 0.219 (Holm 0.438). Hybrid vs Dense: 3 vs 2, p = 1.0. With 42 questions these differences are not significant.
- The MRR gain of hybrid over BM25 is +0.117, paired bootstrap [0.024, 0.217]. Over Dense it is +0.041 [−0.050, 0.136]. These two intervals are not adjusted for multiple comparisons.

Hybrid misses at rank 5:
- q039 paraphrase: BM25 rank 5, Dense not in top 10, Hybrid not in top 10.
- q055 / q056 version_new: Dense rank 1 and 3, BM25 not in top 10, Hybrid rank 6.

The same RRF weakness both ways: when one method finds the passage and the other has it nowhere in its top 10, equal-weight fusion gives it only one method's share of score, and chunks that both methods rank moderately overtake it.

## Answers

| Measure | Holdout (n = 74) |
|---|---|
| Right outcome (answer answerable, abstain otherwise) | 95.9% (71) |
| Abstain recall (unanswerable + cross_workspace, 32) | 96.9% (31) |
| False abstain (answerable, 42) | 4.8% (2) |
| Cited-claim rate (claims shown / drafted) | 100% |
| Answered answerable questions citing a labeled gold passage | 97.5% (39 of 40; q039 cited none) |
| Cross-workspace leaks | 0 |
| Failed (schema / refusal) | 0 |
| Latency p50 / p95 (live run) | 1.35 s / 2.99 s |
| Cost (live run, 80 questions) | $0.075 |

The three wrong outcomes:
- **q104** (cross_workspace, asked in LangChain): "How can section titles improve the ease of skimming content?" Atlas answered instead of abstaining. An earlier version of this analysis called it a labeling miss. The second review says otherwise: nothing in the LangChain docs is about skimming, and the three claims Atlas made cite a report-writing `Section` schema that does not say what the claims say (all three judged "partial"). So this is a real error: an off-topic answer with valid-looking citations. It is not a leak (every cited chunk is in the LangChain index), but it shows the limit of the citation check: it proves a cited passage was sent, not that it supports the claim.
- **q036** (paraphrase): "How do you ensure all necessary data is copied when duplicating a sequence with incremental snapshots?" The model said the passages were insufficient.
- **q069** (version_new): "How can I prevent a long-running task from being stopped due to inactivity in langgraph?" Same.

## Claim support

The 178 claims from the live holdout run were judged twice, using only the cited passages:

| Judge | Supported | Partial | Unsupported |
|---|---|---|---|
| GPT-4.1-mini (`claim_support.jsonl`) | 175 (98.3%) | 3 | 0 |
| Claude (`claims_model_review.jsonl`) | 167 (93.8%) | 11 | 0 |

The two agree on 166 of 178. Claude was stricter: 10 claims the GPT judge called supported carried a detail (a name, a condition, "across threads") that the cited passage does not state, usually because it came from another passage in the same answer. Neither judge found a claim the passages contradict.

## Limits
- No person checked the labels. Two model families did, and they still disagree on details.
- One live run per configuration, temperature 0: no measure of run-to-run variance.
- 42 / 74 holdout questions: intervals are wide; per-class numbers rest on 11–16 questions each.
- The citation check proves provenance, not support (q104).
