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

## Screens
Filled in as screens are generated and approved.
