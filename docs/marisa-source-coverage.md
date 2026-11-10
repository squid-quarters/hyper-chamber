# Marisa source coverage and review

Reviewed on 11 November 2026.

This first collection contains 14 curated references and 59 selected moments. It is a practical selection from the source, not exhaustive character coverage or current-patch certification.

## Source

[Joe Ebios: Classic Marisa Combos & Setup guide season3【STREET FIGHTER 6】](https://www.youtube.com/watch?v=kB_QYkNRvBs), published 2026-01-31 UTC. Exact download metadata, chapter information when present, and the original recording SHA-256 are in `content/sources/joe-ebios-marisa-classic-2026.json`.

## Interpretation and limits

Every entry is `source-reviewed` with `gameVersion: null`. Actions, buttons, starting states, resource use and selected moments were checked against footage and its input display. Captions are supporting evidence, not a guarantee of current-patch execution. Frame-advantage numbers printed in the footage are dated source observations; no universal reversal safety, guaranteed pressure or matchup coverage is inferred. Notes identify the prerequisite knockdown when a setup starts after it.

The selection keeps normal and fully held buttons distinct. Dimachaerus includes a separate forward-punch follow-up. Oki references begin from the stated knockdown and show a particular recorded defensive response; they do not certify guaranteed pressure. The source’s long max-damage variations are curated to one practical double-Rush cash-out.

## Media preparation

Full 1280×720 frames preserve HUD, inputs and overlays. The canonical ingestion helper prepares short silent H.264 clips, selected JPEGs and WebVTT action descriptions on a zero-based presentation clock. Both boundaries and every selected moment are visually reviewed; mechanical audits cover decoding, duration, image integrity and description timing. Originals and review boards stay outside Git. `content/media-marisa.json` records private-development provenance; public redistribution is not assessed.

## Selected reference index

| Reference                                                                                                    | Type  | Original interval |
| ------------------------------------------------------------------------------------------------------------ | ----- | ----------------- |
| `marisa-ebios-three-jabs-light-dimachaerus` — Three crouching jabs into light Dimachaerus                    | combo | 0:03.05–0:07.30   |
| `marisa-ebios-counter-jab-light-kick-dimachaerus` — Counter-hit jab: light kick into Dimachaerus             | combo | 1:36.15–1:40.30   |
| `marisa-ebios-counter-light-target-medium-dimachaerus` — Counter-hit light target into medium Dimachaerus    | combo | 1:41.10–1:44.95   |
| `marisa-ebios-medium-target-od-held-heavy` — Medium target: OD Dimachaerus into held heavy                   | combo | 10:26.15–10:31.95 |
| `marisa-ebios-corner-medium-rush-quadriga-phalanx` — Corner medium target: Rush into OD Quadriga and Phalanx | combo | 10:33.10–10:38.70 |
| `marisa-ebios-medium-target-double-rush-level-three` — Medium-target cash-out: double Rush into Level 3      | combo | 10:40.05–10:50.90 |
| `marisa-ebios-corner-crouching-medium-punish-quadriga` — Crouching-medium punish: OD Quadriga into Phalanx   | combo | 10:59.05–11:04.05 |
| `marisa-ebios-overhead-counter-jab-dimachaerus` — Overhead Counter Hit: jab into light Dimachaerus           | combo | 11:11.05–11:15.50 |
| `marisa-ebios-shimmy-back-heavy-medium-target` — Shimmy punish: back heavy into medium target                | combo | 11:23.65–11:29.50 |
| `marisa-ebios-heavy-punish-medium-target` — Heavy Punish Counter: medium target into Dimachaerus             | combo | 11:52.70–11:57.10 |
| `marisa-ebios-corner-counter-di-held-quadriga` — Corner counter DI: held back heavy into OD Quadriga         | combo | 20:59.90–21:08.50 |
| `marisa-ebios-wall-splat-od-phalanx-held-kick` — Blocked DI wall splat: OD Phalanx into held kick            | combo | 21:09.15–21:16.35 |
| `marisa-ebios-corner-phalanx-dash-jab-throw` — Corner Phalanx knockdown: dash, whiff jab and throw           | setup | 5:57.45–6:01.45   |
| `marisa-ebios-corner-forward-throw-rush-throw` — Corner forward throw: Rush into delayed throw               | setup | 19:09.20–19:15.25 |

Long guides remain external links. Additional routes and uncertain source interpretations are deliberately omitted from this first collection.
