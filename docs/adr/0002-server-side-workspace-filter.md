# ADR 0002: The workspace filter lives on the server

**Status:** accepted · 1 Nov 2026

## Context
Atlas holds several document sets. A user who may read the Cookbook must never receive LangChain text: not in search results, not in an answer, not in a trace. Filters that come from the request body or from a model's tool call can be forged or hallucinated.

## Decision
- The user comes from the session (here a demo cookie), and `authorize(user, workspace)` is the single gate. It returns the workspace id the request may use, or a 403.
- **Every read takes a workspace id**: there is no store query and no vector search that spans workspaces. Qdrant gets the filter built in code (`must: workspace_id = …`); point ids are derived from (workspace, chunk) so the same chunk id in two workspaces never collides.
- The model never chooses where to search. It only sees passages already retrieved inside the authorized workspace.
- Reference corpora are read-only: uploads go only to workspaces whose source is "upload".
- An answer is checked independently in evaluation: every cited chunk must exist in the asked workspace's own index (`leaks`, must be 0).

## Consequences
- bob gets 403 on LangChain for search, answers, uploads, jobs and traces; the Overview and Evaluation pages show other workspaces' scores and question text but never their passages.
- Demo identities are authorization only. A real deployment needs an identity provider in front of `authorize`.
