# Design System: Atlas

## 1. Visual Theme & Atmosphere
A precise, evidence-first research instrument. Calm night canvas, one restrained violet accent, and text that reads like annotated documentation. Same family as PromptFlight "Afterglow", but quieter and sharper: the faint afterglow lives only in the page background, never on buttons or text.
- Density 6 (balanced app, dense where data lives, airy around the answer)
- Variance 6 (offset, asymmetric splits; nothing is centered for the sake of it)
- Motion 4 (fluid CSS; citation chips and highlights fade in, no theatrics)
The signature idea: **every claim is visibly tied to its source**. Citation chips, highlighted passages and thin connector lines are the hero visuals, not stock imagery.

## 2. Color Palette & Roles
Dark
- **Night Canvas** (#0b0c12) — page background, with a soft violet haze top-left at 12% and a blue haze bottom-right at 8%
- **Panel** (rgba(255,255,255,0.035)) with **Hairline** (rgba(255,255,255,0.08)) — cards and columns
- **Inset** (rgba(255,255,255,0.025)) — inner tiles, code and passage blocks
- **Paper Ink** (#ecedf3) — primary text
- **Steel Ink** (#9ba1b4) — secondary text, metadata
- **Afterglow Violet** (#9b8cf2) — the only accent: citation chips, active tab, focus ring, highlighted evidence words (as an underline plus 16% tint, never as a glow)
Light
- **Mist Canvas** (#f6f6fa) with the same hazes at 6%
- **Paper** (#ffffff), **Hairline** (#e4e4ee), **Inset** (#f3f3f8)
- **Ink** (#14151d), **Steel Ink** (#5a5f72)
- **Afterglow Violet ink** (#5b45d1) on **Violet wash** (#efecff)
Status (text in ink tones only, never on fills)
- **Supported** teal (#2dd4bf dark / #0f766e on #e6f7f4 light)
- **Not enough evidence / stale** amber (#f2b84b dark / #8a5300 on #fdf3dc light)
- **Denied / error** coral (#f87171 dark / #b4232a on #fde8e8 light)
- Retrieval methods: **BM25** amber (#f5a524), **Dense** sky (#38bdf8), **Hybrid** teal (#2dd4bf) — shown as a small dot plus the name in mono

## 3. Typography Rules
- **Display:** Geist, weight 300–500, tracking -0.02em. Hierarchy by weight and color, not size alone. Large numbers use tabular numerals.
- **Body:** Geist 15px, line-height 1.6, max 68 characters per line.
- **Mono:** Geist Mono (or JetBrains Mono) for chunk ids, SHAs, paths, request ids, scores, citation chips.
- **Micro labels:** 11px uppercase, letter-spacing 0.08em, Steel Ink.
- Banned: Inter, any serif, gradient text, all-caps headlines.

## 4. Component Stylings
- **Citation chip:** mono `c1`, 20px tall, violet wash fill, violet ink, 6px radius. Hover/selected: 1px violet outline. Sits inline right after the sentence it supports.
- **Evidence passage:** inset block, 12px radius, body text (not a code block, no line numbers). Supporting words get a violet underline + 16% tint. Above it: title, mono path, small pills (license, sha, ingested).
- **Buttons:** flat. Primary = violet fill with dark ink text, 10px radius, -1px translate on press. Secondary = hairline outline. No glows.
- **Cards:** 20px radius, hairline border, no drop shadow in dark; whisper shadow in light. Use cards only where grouping matters; long lists use hairline dividers.
- **Pills:** fully rounded, 11px mono, tinted 14% background with matching ink.
- **Inputs:** label above, 12px radius, inset fill, violet focus ring (2px, no blur).
- **Loading:** skeleton blocks shaped like the real content. No spinners.
- **Empty states:** one sentence + the exact next action (for example "Upload a PDF or Markdown file").

## 5. Layout Principles
- Max width 1400px, 12-column grid, 24px gutters.
- Top bar: wordmark "Atlas" left, pill tabs (Overview, Ask, Sources, Retrieval Lab, Traces, Evaluation), right: workspace chip, user chip "alice", sun/moon theme toggle.
- Heroes are left-aligned or split (text left, proof right). No centered hero.
- No row of three equal cards. Use 2-column zig-zag, a 7/5 split, or a single wide card with internal columns.
- Below 768px: single column, top tabs become a bottom tab bar with 6 icons, evidence panel becomes a bottom sheet. Touch targets 44px. No horizontal page scroll; wide tables scroll inside their card.

## 6. Motion & Interaction
- Ease-out springs (stiffness 100, damping 20) for panels; 150ms fades for chips.
- Selecting a citation chip scrolls the evidence panel and pulses the highlighted words once.
- Lists reveal with a 30ms stagger. Animate only transform and opacity. Respect reduced motion.

## 7. Anti-Patterns (Banned)
- No invented metrics, confidence scores, relevance scores, latencies or "live" tags. Any number in a mock is labeled "sample".
- No avatars, no photos, no emojis, no stock illustrations.
- No neon or outer glows, no gradient text, no purple button glow.
- No pure black (#000000).
- No three equal feature cards, no centered hero.
- No marketing copy ("seamless", "elevate", "unleash", "next-gen", "rigorous pipeline").
- No code-block styling for prose passages; no fake line numbers.
- No overlapping panels that hide text.
