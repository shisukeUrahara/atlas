# ADR 0001: Chunking and index versions

**Status:** accepted · 1 Nov 2026

## Context
Docs change. A RAG index that keeps old chunks can cite a removed API, and one that re-embeds everything on each change cannot say what changed. Atlas must (1) re-ingest an unchanged corpus as a no-op, (2) remove exactly the stale text after an update, and (3) report what changed.

## Decision
- **Chunk by heading, pack by paragraph.** Split on `##`–`####` (heading path kept, e.g. "Persistence > Threads"), pack paragraphs up to 1,200 characters, never cut a paragraph. A fenced code block counts as one paragraph, so code is never split (new compared with SearchLab's chunker).
- **Content-hash ids.** `documentId = sha256(workspace, path)`, `chunkId = sha256(documentId, heading, text)`, first 16 hex chars. The commit is not part of the id, so an unchanged paragraph keeps its id across doc versions.
- **File-level skip, chunk-level diff.** Same file sha256 → skip. Changed file → keep chunks whose id still exists, delete the rest, insert new ones. Files that left the corpus are deleted with their chunks (prune).
- **Index versions.** Each ingest that changes something records a new version plus the list of added and removed chunks (title and heading kept, so the UI can show removed sections after their text is gone). Vectors of removed chunks are deleted on the next index build.
- **MDX handling.** Keep the Python view of `:::python` / `:::js` blocks, unwrap JSX wrappers, and inline code-sample snippets that pages import (149 for LangChain), each pinned and hashed like a page.

## Consequences
- Old → new LangChain docs: +1,226 / −557 / 76 unchanged, v1 → v2; running it again changes nothing.
- Any edit to a paragraph changes its id: a one-word fix counts as remove + add. Accepted: correctness over minimal churn.
- Gold labels are tied to chunk ids, so re-chunking invalidates labels; every eval run records `chunks_sha256`.
