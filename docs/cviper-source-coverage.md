# C. Viper source coverage and review

Reviewed on 11 November 2026.

This first collection contains 13 selected references and 39 annotated moments. Each reference has a silent individual replay clip, selected stills and timed action descriptions. It is a curated practice collection, not complete tutorial coverage or current-patch certification.

## Source

[Street Fighter 6 C. Viper Combos Guide, With Annotations!](https://www.youtube.com/watch?v=sD6SaqB9h-M), VesperArcade, 2025-10-17 UTC. Original metadata, chapter outline and recording SHA-256 are retained in `content/sources/vesperarcade-cviper-2025.json`. Chapters and recipe panels locate candidates; actual action order, hit results, resource displays, state and clip boundaries establish the authored reference.

## Interpretation and limits

This collection selects explicit-strength light confirms, Tracer continuations, OD Seismic Hammer juggles, high-jump cancels and Super finishes. Tracer is a distinct forward-plus-two-punch follow-up that spends one Drive bar in the source. A Super Jump Cancel precedes the airborne kick; it is not another grounded hit. Repeated light starters have different meter-dependent finishes.

The guide also prints some Seismic Hammer and kick-special recipes without specifying strength. Those ambiguous takes, including the DI and Punish Counter branches, are deliberately excluded. A fuller anti-air/oki collection requires another source with sufficiently clear input evidence.

All entries are `source-reviewed` with `gameVersion: null`. None was re-tested in-game on the current patch. Source damage, advantage, safety and matchup behavior remain properties of the dated demonstration; they do not prove universal execution or safety. Longer lessons remain external links.

## Media preparation

The complete 1280×720 source frame is preserved. Accurate lossless excerpts are prepared before the canonical ingestion helper encodes silent H.264 clips, resets playback timestamps to zero, exports selected stills on that clock and writes WebVTT action descriptions. Source intervals and key-moment timestamps use separate clocks. Every selected moment and both clip endpoints are visually checked. Mechanical audits validate full decode, silence, H.264, dimensions, duration, presentation clocks, JPEG integrity, exact descriptions and manifest mappings. Full originals and tooling workfiles stay outside Git. Public redistribution has not been assessed.

## Reference index

| Reference                                                                                           | Type  | Original interval |
| --------------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `cviper-vesper-low-heavy-thunder` — Low light chain into heavy Thunder Dash                         | combo | 0:34.30–0:38.30   |
| `cviper-vesper-low-od-kick` — Low light chain into OD kick                                          | combo | 0:39.50–0:43.70   |
| `cviper-vesper-low-tracer` — Low lights into medium Thunder Dash and Tracer                         | combo | 0:45.40–0:49.60   |
| `cviper-vesper-low-level1` — Low light chain into Level 1                                           | combo | 0:51.60–0:56.60   |
| `cviper-vesper-low-od-level2` — Low lights through OD kick into Level 2                             | combo | 0:58.10–1:07.65   |
| `cviper-vesper-low-thunder-level3` — Low lights through medium Thunder Dash into Level 3            | combo | 1:09.80–1:22.45   |
| `cviper-vesper-medium-tracer-level3` — Medium confirm through light Thunder Dash and Tracer         | combo | 1:33.45–1:42.45   |
| `cviper-vesper-medium-od-seismo-tracer` — Mediums into OD Seismic Hammer and Tracer                 | combo | 1:55.40–1:59.65   |
| `cviper-vesper-medium-od-seismo-level1` — Mediums into OD Seismic Hammer and Level 1                | combo | 2:02.00–2:07.40   |
| `cviper-vesper-medium-two-od-level2` — OD Seismic Hammer into OD kick and Level 2                   | combo | 2:09.40–2:19.60   |
| `cviper-vesper-medium-high-jump-air-kick` — OD Seismic Hammer high-jump cancel into air kick        | combo | 2:21.50–2:26.45   |
| `cviper-vesper-heavy-light-seismo` — Crouching heavy into light Seismic Hammer                      | combo | 3:14.25–3:17.80   |
| `cviper-vesper-heavy-high-jump-air-kick` — Crouching heavy through Seismic Hammer and airborne kick | combo | 3:19.60–3:24.40   |

## Official move-name cross-check

Names and character-specific resource behavior were checked against [Capcom’s published character introduction](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1811772772213248). The tutorial footage separately establishes the listed command, strength, action order and state.

| Command in this collection | Official move name           |
| -------------------------- | ---------------------------- |
| `214LP`                    | Light Thunder Dash           |
| `214MP`                    | Medium Thunder Dash          |
| `214HP`                    | Heavy Thunder Dash           |
| `623LP`                    | Light Seismic Hammer         |
| `623PP`                    | OD Seismic Hammer            |
| `236KK`                    | OD Burning Kick              |
| `j.236HK`                  | Airborne heavy Burning Kick  |
| `6PP`                      | Tracer Combination follow-up |
| `SJC`                      | High Jump cancel             |
| `SA1`                      | Limit Decoupler (Level 1)    |
| `SA2`                      | Mission Complete (Level 2)   |
| `SA3`                      | Hard Luck Rejector (Level 3) |

High Jump spends one Drive bar with Limit Decoupler inactive. The two High Jump routes budget that bar in addition to any OD special.
