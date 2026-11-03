# ADR 0003: Evaluation protocol

**Status:** accepted · 3 Nov 2026

## Context
Portfolio numbers are only useful if another engineer can reproduce them and see what they rest on. The question set, its labels, the split and the rules had to be fixed before any score was seen.

## Decision
- **Pre-registration:** `docs/labeling_guide.md` (classes, counts, split, rejection rules) was committed before any question was drafted. Holdout runs refuse to start unless it is committed and the tree is clean.
- **120 questions, 5 classes × 24**, stratified 40 tuning / 80 holdout (seed 7). Holdout scored once, after the tuning runs.
- **Labels:** LLM draft from a seed chunk → pool BM25 / Dense / Hybrid top 10 → LLM judge → owner review (`review.csv`). Abstain-class questions that the judge finds answered in the asked workspace are replaced and logged (49 rejected candidates). Until review every number says "labels: LLM-drafted, pending owner review".
- **Retrieval metrics:** Recall@1/5/10, MRR@10, nDCG@10 (binary) with 10,000-draw percentile bootstrap intervals; hybrid vs each single method by exact McNemar on hit@5 with Holm adjustment and a paired bootstrap on ΔMRR.
- **Answer metrics:** right outcome by class, abstain recall, false-abstain rate, cited-claim rate, gold-cited rate, cross-workspace leaks (hard zero), failures, p50 / p95 latency, cost; claim support by an LLM judge against the cited chunks (pending review).
- **Runs are folders** (`runs/<kind>/<run-id>/`): manifest (git sha, dirty flag, label status, index versions, questions and chunk hashes, model, prompt version + hash, replay and cache stats), per-question results, scores, checksums.
- **Replay:** model replies and embeddings are cached in `cache/`; with no key every call must hit the cache. `atlas gate` re-runs the tuning split in CI and requires identical scores plus a quality floor.

## Consequences
- Anyone can re-check the committed numbers without a key; re-scoring after label review needs no new model calls.
- One run per configuration at temperature 0 measures no variance. The LLM judge shares a model family with the answerer, so claim support is likely lenient until reviewed.
