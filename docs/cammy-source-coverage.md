# Cammy source coverage and review

Reviewed on 11 November 2026.

This first collection contains 15 curated references and 63 selected moments. It is a practical selection from the source, not exhaustive character coverage or current-patch certification.

## Source

[Joe Ebios: SF6 CAMMY Beginner Guide: The ONLY Combos & Setups You Need](https://www.youtube.com/watch?v=B6ceWgQ2t3Q), published 2026-07-01 UTC. Exact download metadata, chapter information when present, and the original recording SHA-256 are in `content/sources/joe-ebios-cammy-beginner-2026.json`.

## Interpretation and limits

Every entry is `source-reviewed` with `gameVersion: null`. Actions, buttons, starting states, resource use and selected moments were checked against footage and its input display. Captions are supporting evidence, not a guarantee of current-patch execution. Frame-advantage numbers printed in the footage are dated source observations; no universal reversal safety, guaranteed pressure or matchup coverage is inferred. Notes identify the prerequisite knockdown when a setup starts after it.

Back-medium-punch into heavy kick is the Lift Combination target route; heavy-punch into heavy kick is a separate target route. Jump cancels, held heavy specials, normal Drive Rush and cancel Drive Rush remain separate actions. Source setup numbers are dated and spacing-dependent.

## Media preparation

Full 1280×720 frames preserve HUD, inputs and overlays. The canonical ingestion helper prepares short silent H.264 clips, selected JPEGs and WebVTT action descriptions on a zero-based presentation clock. Both boundaries and every selected moment are visually reviewed; mechanical audits cover decoding, duration, image integrity and description timing. Originals and review boards stay outside Git. `content/media-cammy.json` records private-development provenance; public redistribution is not assessed.

## Selected reference index

| Reference                                                                                                                | Type     | Original interval |
| ------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------- |
| `cammy-ebios-light-medium-arrow` — Two jabs and light kick into medium Arrow                                             | combo    | 0:00.70–0:04.65   |
| `cammy-ebios-low-rush-lift-arrow-spike` — Low Rush: Lift Combination into Arrow and Spike                                | combo    | 2:50.15–2:55.85   |
| `cammy-ebios-crouching-heavy-medium-heavy-arrow` — Crouching heavy into medium and heavy Arrow                           | combo    | 3:04.10–3:06.95   |
| `cammy-ebios-corner-forward-throw-walk-throw` — Corner throw: walk into another throw attempt                            | setup    | 3:09.10–3:14.95   |
| `cammy-ebios-throw-whiff-back-heavy-air-level-one` — Throw whiff: back-heavy air catch into Level 1                      | response | 3:35.10–3:43.35   |
| `cammy-ebios-drive-reversal-medium-heavy-arrow` — Drive Reversal punish: medium into heavy Arrow                         | combo    | 3:44.25–3:48.35   |
| `cammy-ebios-corner-drive-reversal-target-arrow-spike` — Corner Drive Reversal punish: target combo into Arrow and Spike | combo    | 3:50.10–3:55.85   |
| `cammy-ebios-heavy-punish-knuckle-jab-arrow` — Throw-whiff punish: heavy Knuckle into jab and Arrow                      | combo    | 3:58.25–4:02.40   |
| `cammy-ebios-blocked-dp-crouching-heavy-arrow` — Blocked reversal: crouching heavy into heavy Arrow                      | combo    | 4:11.30–4:15.25   |
| `cammy-ebios-blocked-dp-back-heavy-knuckle-level-one` — Blocked reversal: back-heavy juggle into Level 1                 | combo    | 4:17.35–4:25.65   |
| `cammy-ebios-corner-blocked-dp-arrow-heavy-spike` — Corner reversal punish: back heavy, Arrow and heavy Spike            | combo    | 4:27.20–4:32.40   |
| `cammy-ebios-counter-di-air-medium-heavy-strike` — Counter DI: Lift Combination into air medium and Strike               | combo    | 4:34.25–4:41.85   |
| `cammy-ebios-counter-di-held-arrow-level-one-switch` — Counter DI: held heavy Arrow into Level 1 side switch             | combo    | 4:43.30–4:53.90   |
| `cammy-ebios-wall-splat-knuckle-spike-jab-timing` — Blocked DI wall splat: Knuckle, Spike and jab timing                 | setup    | 5:05.05–5:10.45   |
| `cammy-ebios-low-double-rush-held-spike-level-three` — Low confirm cash-out: two Rush cancels into Level 3               | combo    | 5:11.15–5:26.30   |

Long guides remain external links. Additional routes and uncertain source interpretations are deliberately omitted from this first collection.
