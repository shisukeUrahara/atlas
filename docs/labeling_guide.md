# Labeling guide

Written before any question was drafted, so the rules cannot be bent to fit results.

## The question set
120 questions, 24 per class. Split 40 tuning / 80 holdout, stratified by class (8 / 16 per class), seed 7.
The holdout set is scored once, at the end.

| Class | What it tests | Workspace asked in | Right outcome |
|---|---|---|---|
| `exact_id` | The question names an API symbol (class, function, parameter, header) that appears in the docs | 16 LangChain, 8 Cookbook | Retrieve the passage that defines or uses it; answer with a citation |
| `paraphrase` | Same need as a passage, in different words (no distinctive term copied from it) | 16 LangChain, 8 Cookbook | Retrieve the passage; answer with a citation |
| `version_new` | A fact that exists only in the pinned Nov 2026 LangChain docs, not in the Sep 2025 snapshot | 24 LangChain | Retrieve the new passage; answer from it, not from model memory |
| `unanswerable` | A plausible question the docs never answer (e.g. a made-up API like `magic_retry`) | 16 LangChain, 8 Cookbook | "Not enough evidence" |
| `cross_workspace` | Answered only by the *other* workspace's docs | 16 asked in LangChain about Cookbook content, 8 the other way | "Not enough evidence", and no chunk from the other workspace may ever be cited |

## Gold passages
- A gold chunk **states** the answer or the thing asked about. A chunk that only mentions the term in passing is not gold.
- A question can have several gold chunks (the same fact in two places). Retrieval counts a hit if **any** gold chunk is ranked.
- `unanswerable` and `cross_workspace` questions have **no** gold chunks.
- Gold chunk ids refer to the index built from the pinned snapshots; re-chunking changes ids, so labels are tied to `chunks_sha256` in each run manifest.

## How labels are made
1. **Draft.** An LLM writes each question from one seed chunk (exact_id, paraphrase, version_new) or from the corpus as a whole (unanswerable, cross_workspace). The seed chunk is the first gold candidate.
2. **Pool.** BM25, Dense and Hybrid each retrieve their top 10 for the question. The union is the pool.
3. **Judge.** An LLM marks which pooled chunks state the answer. Seed + judged chunks become the draft gold set.
4. **Owner review.** Every question and its gold chunks go into `fixtures/eval/review.csv`. The owner marks each row `ok`, `fix` (with corrected chunk ids) or `drop`. `pnpm atlas apply-review` writes the result.

Until step 4 is done every question carries `review: "pending"`, and every number computed from them is reported as **"labels: LLM-drafted, pending owner review"**. No post uses those numbers.

## Rejection rules (applied before review)
- `exact_id`: the identifier must appear verbatim in the seed chunk.
- `paraphrase`: no word of 6+ letters that is rare in the corpus may be copied from the seed chunk's heading.
- `version_new`: the seed chunk must be absent from the Sep 2025 index (an `added` chunk in index v2).
- `unanswerable`: BM25 must not find the invented identifier anywhere in the workspace.
- `cross_workspace`: the seed chunk comes from the other workspace.
- Duplicates (same seed chunk or near-identical question) are dropped and redrafted.
