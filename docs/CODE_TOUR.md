# Code tour

Read in this order. `src/core/` holds all logic and may not import Next or React (lint-enforced); `src/app/` and `src/components/` are the web app; `src/cli/` is `pnpm atlas`.

## 1. Corpus: from a pinned commit to chunks
- `core/corpus/sources.ts`: `sources.json` / `source_manifest.json` schemas, safe paths, raw and blob URLs.
- `cli/commands/fetch.ts`: downloads pinned files and the snippets they import, with sha256s.
- `core/corpus/clean.ts`: MDX (Python view, JSX unwrapped, snippets inlined) and notebooks to Markdown.
- `core/corpus/chunker.ts`: heading paths, paragraph packing, code blocks kept whole.
- `core/corpus/ids.ts`, `build.ts`: content-hash ids and one `BuiltDoc` per file. `pdf.ts` for uploads.

## 2. Index: SQLite, versions, uploads
- `core/store/sqlite.ts`: workspaces, documents, chunks, jobs, index versions and changes, traces. Every read takes a workspace.
- `core/ingest/ingest.ts`: skip / diff / prune and index versions. `upload.ts`: validated uploads into upload workspaces.

## 3. Search
- `core/retrieval/tokenize.ts`, `bm25.ts` (rank_bm25-compatible), `dense.ts`, `hybrid.ts` (RRF).
- `core/embeddings/*`: OpenAI embedder, float16 disk cache with replay mode.
- `core/vectors/*`: in-memory and Qdrant stores with a mandatory workspace filter.
- `core/search/service.ts`: per-workspace retrievers, rebuilt on a new index version; dense degrades to "off" with a reason.

## 4. Answers
- `core/answer/context.ts`: token budget, `[c1]…` labels, passage-tag neutralizing.
- `core/answer/prompt.ts`, `schema.ts`: instruction hierarchy, strict JSON contract, named parse failures.
- `core/answer/validate.ts`: citations must point at sent passages; uncited claims are dropped.
- `core/answer/service.ts`: the pipeline and its three abstention paths; `trace.ts` records each request.
- `core/llm/*`: model client, retries, response cache (copied from PromptFlight).

## 5. Access
- `core/auth/access.ts`: demo users and `authorize()`. `app/api/_lib/http.ts`: the route-side gate.

## 6. Evaluation
- `core/evalset/*`: drafting, pooled judging, replacing answered abstain questions, split, review sheet.
- `core/metrics/*`: retrieval metrics, answer metrics, bootstrap, McNemar / Holm.
- `core/eval/*`: retrieval and answer runs, claim support, run identity; `core/artifacts/*`: manifests, run folders, holdout guard.
- `cli/commands/gate.ts`: exact replay of the tuning runs in CI.

## 7. Web app
- `app/api/*`: search, answer, traces, uploads, jobs. Route tests: `app/api/api.test.ts`.
- `app/*/page.tsx`: Overview, Ask, Sources, Retrieval Lab, Traces, Evaluation (server components reading the store and run folders).
- `components/*`: theme, nav, evidence panel, lab columns, building blocks.

## 8. Tests
- Unit and route tests next to the code (`*.test.ts(x)`), `pnpm test`.
- Browser tests in `e2e/` (`pnpm e2e`): every page at three widths, axe in both themes, main flows; `screenshots.spec.ts` and `demo.spec.ts` are opt-in.
