# Mai source coverage and review

Reviewed on 11 November 2026.

This first collection contains 12 selected references and 39 annotated moments. Each reference has a silent individual replay clip, selected stills and timed action descriptions. It is a curated practice collection, not complete tutorial coverage or current-patch certification.

## Source

[STREET FIGHTER 6 MAI COMBOS! Complete Combo Guide](https://www.youtube.com/watch?v=9zJ6H3eORh0), VesperArcade, 2025-02-06 UTC. Original metadata, chapter outline and recording SHA-256 are retained in `content/sources/vesperarcade-mai-2025.json`. Chapters and recipe panels locate candidates; actual action order, hit results, resource displays, state and clip boundaries establish the authored reference.

## Interpretation and limits

The initial collection selects ordinary-state meterless confirms, three different Super budgets, an OD launcher with a jumping-medium follow-up, a blocked-DI wall splat and three Punish Counter conversions. The back-heavy-kick target continuation is a separate input. The final Punish Counter example begins against a crouching Luke and demonstrates the force-stand branch. Level 1 visibly grants Flame stocks; subsequent enhanced-stock routes are not silently substituted for ordinary specials.

The source chapter metadata does not reliably match the actual recording. All selected intervals were located in the footage itself. Ambiguous-strength air-fan recipes and the longer enhanced-stock and corner-pressure routes remain outside this collection.

All entries are `source-reviewed` with `gameVersion: null`. None was re-tested in-game on the current patch. Source damage, advantage, safety and matchup behavior remain properties of the dated demonstration; they do not prove universal execution or safety. Longer lessons remain external links.

## Media preparation

The complete 1280×720 source frame is preserved. Accurate lossless excerpts are prepared before the canonical ingestion helper encodes silent H.264 clips, resets playback timestamps to zero, exports selected stills on that clock and writes WebVTT action descriptions. Source intervals and key-moment timestamps use separate clocks. Every selected moment and both clip endpoints are visually checked. Mechanical audits validate full decode, silence, H.264, dimensions, duration, presentation clocks, JPEG integrity, exact descriptions and manifest mappings. Full originals and tooling workfiles stay outside Git. Public redistribution has not been assessed.

## Reference index

| Reference                                                                                                 | Type  | Original interval |
| --------------------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `mai-vesper-low-light-kick` — Low lights into light Hissatsu Shinobi Bachi                                | combo | 0:16.60–0:20.85   |
| `mai-vesper-low-heavy-rise` — Low lights into heavy Hishou Ryuuenjin                                      | combo | 0:21.80–0:26.25   |
| `mai-vesper-low-od-rush-air-medium` — Low lights into OD rush and jumping-medium juggle                   | combo | 0:44.70–0:50.55   |
| `mai-vesper-low-level1` — Low kick and jab into Level 1                                                   | combo | 0:58.60–1:03.50   |
| `mai-vesper-low-od-rush-level2` — Low lights into OD rush, air medium and Level 2                         | combo | 1:05.00–1:12.10   |
| `mai-vesper-low-light-rush-level3` — Low lights and light rush into Level 3                               | combo | 1:22.25–1:35.95   |
| `mai-vesper-medium-jab-light-rush` — Crouching medium into jab and light rush                             | combo | 3:13.00–3:17.75   |
| `mai-vesper-heavy-jab-heavy-rise` — Crouching heavy into jab and heavy rising kick                        | combo | 3:18.30–3:22.40   |
| `mai-vesper-wall-back-heavy-target` — Wall splat into back-heavy target combo and medium rising kick      | combo | 5:09.50–5:15.85   |
| `mai-vesper-punish-jab-heavy-fan` — Punish-counter jab into heavy Ryuuenbu and rising kick                | combo | 6:13.70–6:18.75   |
| `mai-vesper-punish-medium-heavy-rise` — Punish-counter medium into crouching medium and rising kick       | combo | 6:26.90–6:30.20   |
| `mai-vesper-punish-back-heavy-force-stand` — Back-heavy punish forces stand into Ryuuenbu and rising kick | combo | 8:29.60–8:35.80   |

## Official move-name cross-check

Names and character-specific resource behavior were checked against [Capcom’s published character introduction](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1788311419158166). The tutorial footage separately establishes the listed command, strength, action order and state.

| Command in this collection | Official move name                       |
| -------------------------- | ---------------------------------------- |
| `236LK`                    | Light Hissatsu Shinobi Bachi             |
| `236KK`                    | OD Hissatsu Shinobi Bachi                |
| `214HP`                    | Heavy Ryuuenbu                           |
| `623MK`                    | Medium Hishou Ryuuenjin                  |
| `623HK`                    | Heavy Hishou Ryuuenjin                   |
| `SA1`                      | Kagerou no Mai (Level 1)                 |
| `SA2`                      | Chou Hissatsu Shinobi Bachi (Level 2)    |
| `SA3`                      | Shiranui Ryuu: Enbu Ada Zakura (Level 3) |
