# Build log

What happened while building Atlas, including what broke. Commit subjects in quotes.

## Day 1 (1 Nov 2026): design, corpus, index, search, answers
- Designed every screen in Google Stitch first. The first two directions read as generic; a stricter DESIGN.md (one accent, no glows, no three-card rows, no invented numbers) produced the approved "Atlas · Evidence" screens. Stitch still invented details (relevance scores, version tags, "live feed"); they are listed in design/stitch/README.md and were not built.
- Corpora pinned by commit with sha256s. The first "old" LangChain snapshot (14 Sep 2025) had no LICENSE file; it was replaced by the commit that added the MIT license (30 Sep 2025). Thirty files from the unlicensed commit remain in git history (owner chose not to rewrite it).
- An automated security review found: unsafe paths in `sources.json` could write outside the snapshot folder; uploads could write into the reference corpora, needed no size header, had no PDF page cap, and same-name files overwrote each other. All fixed ("Refuse unsafe paths in atlas fetch", "Harden uploads after security review").
- While writing the prompt-injection test: a document containing `</passages>` could close the passage block early. Now neutralized.
- `node:sqlite` chosen over a native dependency; nested transactions needed a depth counter (found by a test).

## Day 2 (2 Nov 2026): fixes and the UI
- LangChain pages import code samples from separate snippet files; 86 were being dropped. Now fetched, hashed and inlined: chunks mentioning `InMemorySaver` went from 38 to 82. Side effect: BM25 now ranks two code-heavy middleware chunks above "Add short-term memory" for "InMemorySaver checkpointer".
- Stale vectors are deleted on index rebuild; design PNGs shrunk from 19.6 MB to 2.9 MB.
- UI built to the Stitch screens. Found while wiring browser tests: an empty `ATLAS_QDRANT_URL=` (as shipped in `.env.example`) crashed every command.

## Day 3 (3 Nov 2026): questions, evaluation, docs
- 120 questions drafted; rejection rules fired (identifier missing, copied heading words, invented names that exist).
- Pooled judging showed 15 of 24 "other-workspace" questions and 7 of 24 "unanswerable" ones were actually answered in the asked workspace (the two doc sets overlap, e.g. JSON structured output). They were replaced; 49 rejected candidates are logged in `fixtures/eval/rejected.jsonl`.
- The review CSV holds model-written text; a security review flagged spreadsheet formula injection. Values starting with = + - @ are now prefixed.
- The retrieval holdout run left an untracked folder, so the guard refused the answers holdout run, and printed a stack trace. Guard refusals now exit 5 with a message.
- Two intermediate commits had red CI: the browser test still clicked a Lab example chip that the labeled examples had replaced. Fixed in the next commit.
- Capturing the phone screenshot found two real bugs: a long recent question pushed the Ask button off screen (x = 786 on a 390 px phone), and the evidence sheet opened by itself over the citation chips. Both fixed, with a regression test.
- A security review flagged that the Overview's holdout-answer fallback ignored workspace access (bob could see a LangChain passage). Fixed.
- Costs on 3 Nov: embeddings ~1 cent, question drafting and judging a few cents, tuning answers $0.037, holdout answers $0.075.

## Fresh-clone check (3 Nov 2026)
Followed the README's Docker quick start in a new clone with no `.env` (replay mode):
- First try: `atlas ingest` in the container failed with "unable to open database file". The named volume for the SQLite file was created root-owned. Fixed in "Let the container write its database volume".
- Second try: ingest gave the same numbers as the dev machine (+633, then +1,226 / −557 / 76, Cookbook +405). All six pages 200, unknown page 404. Search: BM25, Dense (Qdrant, embeddings from the committed cache) and Hybrid all ran. A holdout question was answered with 4 cited claims from the committed response cache (`cached: true`). The Evaluation page showed 0.938, 96.3% and 31 / 32. No errors or SQLite warnings in the container log.

## After release (3 Nov 2026): UI fixes and the label review
- Using the Ask page myself: the whole page scrolled with the answer and the evidence column was a 380 px strip with its own scrollbar. Two new Stitch layouts; the "split reader" (concept D) was built: panes scroll on their own, evidence 45% with a draggable divider, question box pinned. Picking a recent question left the old passage in the evidence pane; fixed. Native dropdowns opened white in dark mode; fixed.
- A replay-mode browser test failed only on my machine: I had asked its question with a key, so the reply was in my local cache. The test now asks a question nobody asks.
- Label review: the owner chose a second model over a hand review. Claude reviewed all 120 questions (80 ok, 27 gold sets fixed, 13 dropped) and re-judged the 178 holdout claims (167 supported, 11 partial; the GPT judge had 175 supported). A new `model_review` label source keeps these runs from ever saying "owner-reviewed".
- Re-scoring replayed the live runs from the cache. In replay the model step measures the cache (p95 10 ms), so latency and cost now come from the newest live run.
- The review overturned one conclusion: q104 was not a labeling miss. Atlas answered a Cookbook-only question from off-topic LangChain passages. The citation check proves a passage was sent, not that it supports the claim.
