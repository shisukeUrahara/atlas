# Stitch designs

All Atlas screens are designed in Google Stitch before any UI code is written. The owner approves them first.

The look is the same as PromptFlight v2 "Afterglow Ops", so the portfolio reads as one family.

## Design systems (reused from PromptFlight v2)
| Theme | Stitch asset |
|---|---|
| Dark | `assets/18202162895111375579` |
| Light | `assets/1966164970992536036` |

Model: `GEMINI_3_5_FLASH_LITE` (the default model timed out on PromptFlight).

## Tokens
| Token | Dark | Light |
|---|---|---|
| canvas | `#07080f` + violet glow 18%, blue glow 10% | `#f5f5fb` + the same glows at 8% |
| card | white 4%, 1px white 8% border, blur 16px | `#ffffff`, 1px `#e6e6f0`, soft shadow |
| text / muted | `#eef0f8` / `#9aa1b5` | `#12131c` / `#5d6275` |
| supported / verified | teal `#2dd4bf` | ink `#0f766e` on `#e6f7f4` |
| denied / error | coral `#f87171` | ink `#b4232a` on `#fde8e8` |
| not enough evidence / stale | amber `#fbbf24` | ink `#8a5300` on `#fdf3dc` |
| brand / citation chip | violet `#a78bfa` | ink `#5b3fd6` on `#efebff` |
| BM25 / Dense / Hybrid | `#f5a524` / `#38bdf8` / `#2dd4bf` | ink `#8a5300` / `#0369a1` / `#0f766e` |

Radius 20px for cards, 12px inside. Display numbers in Geist Light with tabular numerals. 11px uppercase micro labels. Inter body. JetBrains Mono for chunk ids, SHAs and request ids.

Theme toggle (sun/moon) top right on every page. Below 768 px the top pill tabs become a bottom tab bar.

## Pages
| Page | What it shows |
|---|---|
| Overview | Centered light headline "Answers you can check." One line on what Atlas does. Three stat tiles (questions labeled, Recall@5 hybrid, cited-claim rate). A flow diagram: Ingest, Search, Assemble, Answer, Check. "What we found" cards. |
| Ask | Left: workspace switcher (LangChain docs / OpenAI Cookbook) and question history. Center: chat. Each answer sentence ends with violet citation chips like `[c1]`. Right: evidence panel. Clicking a chip shows the source title, section, doc SHA, ingest date and the passage with the supporting words highlighted. |
| Sources | Document cards: title, path, license, SHA, chunk count, status pill. Upload button (PDF or Markdown). Ingestion job progress. Version diff: added / removed / unchanged chunks after a doc update. |
| Retrieval Lab | One question box. Three columns: BM25, Dense, Hybrid. Each row: rank, chunk title, score bar. Expected-source badge on the gold chunk. |
| Traces | One request: timeline of stages (auth, search, assemble, model, validate) with durations, prompt version, index version, request id. |
| Evaluation | Run picker and manifest strip. KPI cards: Recall@5, MRR@10, cited-claim rate, abstention accuracy, cross-workspace leaks. Bars per question class. Failures-only table. |

## States every page needs
Empty, loading, not enough evidence, denied (no access to workspace), stale (doc changed since indexing), error.

## Copy rule
Every Stitch prompt carries exact text. Numbers in the designs are **sample data** and are labeled "sample" in the prompt. The built pages read only real run folders. No avatars, no dates, no invented customer claims, no "live" tags.

## Project
- Stitch project: `projects/4703916948598782669` ("Atlas", private to the owner)
- Design system created in this project from the Afterglow brief: `assets/5aa75a9a159b4b948f49d1802f80cf91`

## Concepts (1 Nov 2026, dark)
Two directions, generated before any UI code. PNGs in `concepts/`.

| Concept | Ask | Overview |
|---|---|---|
| A: ops console (three-pane Ask, left-aligned hero, status tiles, incident cards) | `6d55697f1363454c8ddbedac6ba5a0d4` | `7f3c49e0a0ad4f8889a064610532a56d` |
| B: editorial (one reading column + evidence drawer, centered hero with a try-it box) | `ae6ab6b2c358415caa21f05b3514be98` | `92a578370d594362b79941b1aa8e7c2b` |

What Stitch invented and the build will not use: "Atlas Ops" name, "Relevance score 0.94", "Confidence: High", "Latency 284ms", precision/latency/intercepts stats on the finding cards, marketing lines under the KPI cards.

## Concept C (1 Nov 2026, dark): "Atlas · Evidence"
The owner asked for better screens than A and B. C uses a new design spec, [DESIGN.md](DESIGN.md): same Afterglow family, but one restrained violet accent, Geist + mono only (no Inter), no glows, asymmetric layouts, no row of three equal cards, prose passages as text (not code blocks).

- Design system: `assets/12585090034130361168` ("Atlas · Evidence (dark)")
- Model: `GEMINI_3_8_FLASH`

| Page | Screen id | PNG |
|---|---|---|
| Overview | `ed056f4f596849dfb39d7cdddc88bda4` | `concepts/overview-C-dark.png` |
| Ask | `c5dadcb1d36c48b0a925707babe44144` | `concepts/ask-C-dark.png` |

Invented by Stitch, not used in the build: "Zero hallucinated keys", "Enforced at retrieval & runtime", "Refusal trigger: threshold < 0.65", "Rank #1 in Hybrid", "Hallucination prevented", "grounding ratio 0.00", relative times ("2m"), "chunks: 4,120", "index fresh", version tags ("v0.14", "v0.4.1-rc"), and every metric value (real values come from run folders).

## Approved screens
Filled in after the owner approves a direction.
