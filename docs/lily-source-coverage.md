# Lily source coverage and review

Reviewed on 11 November 2026.

This first collection contains 16 curated references and 69 selected moments. It is a practical selection from the source, not exhaustive character coverage or current-patch certification.

## Source

[Joe Ebios: SF6 Classic Lily Combos & Setup Guide the March Update 【STREET FIGHTER 6】](https://www.youtube.com/watch?v=vkfzS1OOP4w), published 2026-04-24 UTC. Exact download metadata, chapter information when present, and the original recording SHA-256 are in `content/sources/joe-ebios-lily-classic-2026.json`.

## Interpretation and limits

Every entry is `source-reviewed` with `gameVersion: null`. Actions, buttons, starting states, resource use and selected moments were checked against footage and its input display. Captions are supporting evidence, not a guarantee of current-patch execution. Frame-advantage numbers printed in the footage are dated source observations; no universal reversal safety, guaranteed pressure or matchup coverage is inferred. Notes identify the prerequisite knockdown when a setup starts after it.

Wind-enhanced Condor Spire routes require a stored Wind stock. The source’s `(wind)` label is expanded in the input cards; ordinary and OD versions are kept separate. Condor Wind stock gain is described from the shown hit sequence, not assumed for every spacing.

Setup clips begin at their stated prerequisite knockdown. Their resource badges count only the displayed follow-up; the preceding combo and any Wind it consumed are prerequisites. Throws are demonstrated against the recorded dummy response, not unavoidable loops.

The source offers alternative enders in several captions. Each card contains only the performed branch. The corner normal-throw follow-up is kept separate from the Mexican Typhoon setups.

## Media preparation

Full 1280×720 frames preserve HUD, inputs and overlays. The canonical ingestion helper prepares short silent H.264 clips, selected JPEGs and WebVTT action descriptions on a zero-based presentation clock. Both boundaries and every selected moment are visually reviewed; mechanical audits cover decoding, duration, image integrity and description timing. Originals and review boards stay outside Git. `content/media-lily.json` records private-development provenance; public redistribution is not assessed.

## Selected reference index

| Reference                                                                                 | Type     | Original interval |
| ----------------------------------------------------------------------------------------- | -------- | ----------------- |
| `lily-ebios-lights-medium-buster` — Lights into medium Tomahawk Buster                    | combo    | 0:02.85–0:06.85   |
| `lily-ebios-lights-wind-spire` — Lights into Wind medium Spire                            | combo    | 0:46.85–0:52.35   |
| `lily-ebios-heavy-medium-wind` — Crouching heavy into medium Wind                         | combo    | 4:16.35–4:20.30   |
| `lily-ebios-counter-heavy-wind` — Counter-hit heavy into heavy Wind                       | combo    | 4:44.55–4:49.10   |
| `lily-ebios-rush-heavy-wind` — Raw Rush heavy into heavy Wind                             | combo    | 4:50.20–4:54.90   |
| `lily-ebios-heavy-wind-spire` — Heavy into Wind heavy Spire                               | combo    | 4:55.60–5:00.10   |
| `lily-ebios-impact-heavy-wind` — Impact crumple into heavy Wind                           | combo    | 11:12.55–11:20.25 |
| `lily-ebios-impact-od-spire-sa1` — Impact crumple into OD Spire and SA1                   | combo    | 11:32.55–11:44.40 |
| `lily-ebios-wall-wind-spire-sa1` — Wall splat into Wind Spire and SA1                     | combo    | 12:33.70–12:43.55 |
| `lily-ebios-rush-cancel-light-spire` — Rush cancel into light Spire                       | combo    | 6:09.90–6:15.35   |
| `lily-ebios-buster-rush-typhoon` — After medium Buster: Rush into Typhoon                 | setup    | 0:18.85–0:23.35   |
| `lily-ebios-wind-spire-jump-throw` — After Wind medium Spire: jump into throw             | setup    | 1:03.15–1:07.35   |
| `lily-ebios-heavy-spire-dashes-typhoon` — After Wind heavy Spire: two dashes into Typhoon | setup    | 5:10.05–5:14.25   |
| `lily-ebios-corner-throw-rush-throw` — Corner throw into Rush throw                       | setup    | 10:35.65–10:39.50 |
| `lily-ebios-anti-air-heavy-wind` — Anti-air heavy into heavy Wind                         | response | 4:21.10–4:23.65   |
| `lily-ebios-blocked-drive-reversal-typhoon` — Blocked Drive Reversal into heavy Typhoon   | response | 13:16.10–13:21.25 |

Long guides remain external links. Additional routes and uncertain source interpretations are deliberately omitted from this first collection.
