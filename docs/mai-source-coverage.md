# Mai source coverage and review

Reviewed on 12 November 2026.

This collection contains 52 references and 159 annotated moments: the original 12 references are preserved unchanged, and 40 distinct demonstrations have been appended (23 combos, 14 setups and three responses). Each reference has a silent individual replay clip, selected stills and timed action descriptions. It is a curated practice collection, not complete tutorial coverage or current-patch certification.

## Source

[STREET FIGHTER 6 MAI COMBOS! Complete Combo Guide](https://www.youtube.com/watch?v=9zJ6H3eORh0), VesperArcade, 2025-02-06 UTC. Original metadata, chapter outline and recording SHA-256 are retained in `content/sources/vesperarcade-mai-2025.json`. Chapters and recipe panels locate candidates; actual action order, hit results, resource displays, state and clip boundaries establish the authored reference.

## Interpretation and limits

The initial collection selects ordinary-state meterless confirms, three different Super budgets, an OD launcher with a jumping-medium follow-up, a blocked-DI wall splat and three Punish Counter conversions. The back-heavy-kick target continuation is a separate input. The final Punish Counter example begins against a crouching Luke and demonstrates the force-stand branch. Level 1 visibly grants Flame stocks; subsequent enhanced-stock routes are not silently substituted for ordinary specials.

The source chapter metadata does not reliably match the actual recording. All selected intervals were located in the footage itself. Ambiguous-strength air-fan recipes remain outside the collection. The appended source adds enhanced-stock routes and corner-pressure examples with explicit prerequisites.

All entries are `source-reviewed` with `gameVersion: null`. None was re-tested in-game on the current patch. Source damage, advantage, safety and matchup behavior remain properties of the dated demonstration; they do not prove universal execution or safety. Longer lessons remain external links.

## Media preparation

The complete 1280×720 source frame is preserved. Accurate lossless excerpts are prepared before the canonical ingestion helper encodes silent H.264 clips, resets playback timestamps to zero, exports selected stills on that clock and writes WebVTT action descriptions. Source intervals and key-moment timestamps use separate clocks. Every selected moment and both clip endpoints are visually checked. Mechanical audits validate full decode, silence, H.264, dimensions, duration, presentation clocks, JPEG integrity, exact descriptions and manifest mappings. Full originals and tooling workfiles stay outside Git. Public redistribution has not been assessed.

## Preserved original reference index

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

## Deep expansion

[Classic MAI Combos & Setup Guide IN-DEPTH【STREET FIGHTER 6】](https://www.youtube.com/watch?v=d6A3gZaLKm8), Joe Ebios, 2026-06-19 UTC. Exact identity, original metadata chapters and recording hash are in `content/sources/joe-ebios-mai-2026.json`. The source was screened throughout; **screening is not complete execution review or complete extraction**. The interval-by-interval disposition ledger, including all unprocessed gaps in both sources, is `docs/source-ledgers/mai.json`.

The additions cover light-Bachi and medium-Ryuuenbu knockdown throw/shimmy/strike branches, corner frame-kill pressure, forward-throw follow-ups, blocked OD-fan pressure, Counter Hit links, standing-opponent Punish Counter confirms, raw and cancel Rush pickups, a two-Rush Level-3 cash-out, counter-DI positioning, OD launchers and explicit one-/three-Flame-stock conversions. Setup input sequences start after their prerequisite knockdown; the replay retains the prerequisite for context. Additional Drive spend is stated separately.

The reversal responses record Mai blocking Ryu’s wake-up Drive Reversal after a timed jab and blocking OD Shoryuken after an enhanced-Ryuuenbu knockdown. The latter take includes a jumping heavy kick before landing guard; fine-frame input review at 945.1 distinguishes its heavy-kick glyph from the heavy-punch glyph. It is described only as the recorded response to Ryu’s OD Shoryuken. Neither entry claims universal reversal safety. A further response from the original VesperArcade recording demonstrates jumping medium punch into a landing heavy rising kick against airborne Luke; it adds a meterless air-to-air conversion rather than a grounded anti-air safety claim. Source +frame values, throw-safety captions and matchup results are dated observations.

Several grounded recipes print `214HK` where a punch-strength Ryuuenbu would be required. Those takes remain excluded pending clearer strength evidence; the caption is not silently corrected. Ambiguous-strength airborne fan routes remain excluded. Long unselected sections are still available for further extraction and are explicitly unprocessed in the ledger; this expansion makes no source-exhaustion claim.

### Appended reference index

| Reference                                                                                                    | Type     | Original interval (seconds) |
| ------------------------------------------------------------------------------------------------------------ | -------- | --------------------------- |
| `mai-depth-light-bachi-dash-throw` — Light Bachi knockdown: dash, delay and throw                            | setup    | 8.35–15.30                  |
| `mai-depth-light-bachi-shimmy` — Light Bachi knockdown: bait the throw                                       | setup    | 16.05–23.35                 |
| `mai-depth-light-bachi-back-heavy-meaty` — Light Bachi knockdown: back-heavy wake-up pressure                | setup    | 24.55–29.10                 |
| `mai-depth-jabs-medium-ryuuenbu` — Two standing jabs into medium Ryuuenbu                                    | combo    | 66.45–70.45                 |
| `mai-depth-medium-ryuuenbu-dash-throw` — Medium Ryuuenbu knockdown: dash, walk and throw                     | setup    | 71.15–76.65                 |
| `mai-depth-medium-ryuuenbu-shimmy` — Medium Ryuuenbu knockdown: walk back and punish                         | setup    | 77.20–84.70                 |
| `mai-depth-medium-ryuuenbu-dash-medium` — Medium Ryuuenbu knockdown: dash into a medium confirm              | setup    | 85.60–91.70                 |
| `mai-depth-corner-bachi-whiff-medium-throw` — Corner Bachi knockdown: whiff medium, then throw               | setup    | 194.60–201.50               |
| `mai-depth-corner-bachi-whiff-medium-shimmy` — Corner Bachi knockdown: frame kill into shimmy                | setup    | 202.20–209.70               |
| `mai-depth-corner-bachi-jab-guard-reversal` — Corner Bachi knockdown: jab, then guard Drive Reversal         | response | 211.25–216.80               |
| `mai-depth-corner-bachi-meaty-jab-confirm` — Corner Bachi knockdown: timed jab into heavy rising kick        | setup    | 224.15–232.25               |
| `mai-depth-counter-low-jab-medium-heavy-bachi` — Counter-hit crouching jab into medium and heavy Bachi       | combo    | 236.55–240.40               |
| `mai-depth-heavy-bachi-dash-throw` — Heavy Bachi knockdown: dash into throw                                  | setup    | 240.85–247.20               |
| `mai-depth-jab-punish-heavy-fan-light-bachi` — Punish-counter jab into heavy Ryuuenbu and light Bachi        | combo    | 254.20–259.40               |
| `mai-depth-lights-rush-heavy-bachi` — Crouching jabs through cancel Rush into heavy Bachi                    | combo    | 266.25–271.25               |
| `mai-depth-medium-rush-force-stand-bachi` — Medium Rush confirm: force stand into Ryuuenbu and Bachi         | combo    | 295.50–301.30               |
| `mai-depth-medium-rush-level-one` — Medium Rush confirm into back heavy and Level 1                          | combo    | 302.25–307.55               |
| `mai-depth-medium-double-rush-level-three` — Medium cash-out: two Rush cancels into Level 3                  | combo    | 308.55–323.50               |
| `mai-depth-corner-medium-rush-heavy-rise` — Corner medium Rush into Ryuuenbu and heavy rising kick           | combo    | 343.20–349.05               |
| `mai-depth-corner-rush-heavy-target-medium-rise` — Corner Rush: crouching heavy into back-heavy target combo | combo    | 357.25–363.60               |
| `mai-depth-counter-medium-jab-bachi` — Counter-hit standing medium into jab and light Bachi                  | combo    | 382.20–385.85               |
| `mai-depth-counter-kick-low-heavy-bachi` — Counter-hit medium kick into low medium and heavy Bachi           | combo    | 386.35–390.65               |
| `mai-depth-low-medium-punish-heavy-fan-bachi` — Punish-counter crouching medium into heavy Ryuuenbu          | combo    | 404.80–409.40               |
| `mai-depth-crouching-heavy-jab-bachi` — Crouching heavy into crouching jab and light Bachi                   | combo    | 420.20–423.90               |
| `mai-depth-heavy-kick-punish-dash-medium-bachi` — Punish-counter heavy kick: dash into Ryuuenbu              | combo    | 450.25–455.90               |
| `mai-depth-heavy-kick-punish-raw-rush` — Punish-counter heavy kick: raw Rush heavy into medium Bachi         | combo    | 457.35–463.55               |
| `mai-depth-heavy-kick-punish-rush-level-one` — Punish-counter heavy kick into Rush heavy and Level 1         | combo    | 471.25–477.40               |
| `mai-depth-corner-heavy-kick-punish-light-rise` — Corner heavy-kick punish into light rising-kick juggle     | combo    | 545.25–552.35               |
| `mai-depth-heavy-punish-crouching-jab-bachi` — Punish-counter heavy punch into crouching jab and Bachi       | combo    | 576.65–580.75               |
| `mai-depth-corner-throw-dash-throw` — Corner throw: dash into another throw                                  | setup    | 644.85–651.45               |
| `mai-depth-corner-throw-dash-low` — Corner throw: dash into low lights                                       | setup    | 652.10–658.40               |
| `mai-depth-corner-throw-fan-blockstring` — Corner throw: OD fan into Ryuuenbu pressure                       | setup    | 658.85–665.60               |
| `mai-depth-corner-throw-fan-dash-throw` — Corner throw: OD fan cover into dash throw                         | setup    | 666.20–673.40               |
| `mai-depth-od-ryuuenbu-medium-bachi` — Crouching medium through OD Ryuuenbu into medium Bachi                | combo    | 744.85–749.30               |
| `mai-depth-double-od-air-medium-heavy-rise` — OD Ryuuenbu into OD Bachi, air medium and rising kick          | combo    | 749.80–755.85               |
| `mai-depth-counter-di-double-dash` — Counter DI: two dashes into heavy Ryuuenbu and medium Bachi             | combo    | 815.35–823.70               |
| `mai-depth-flame-medium-heavy-ryuuenbu` — Flame crouching-medium confirm into enhanced heavy Ryuuenbu        | combo    | 919.65–921.30               |
| `mai-depth-flame-ryuuenbu-triple-special` — Three-stock confirm: heavy and medium Ryuuenbu into rising kick  | combo    | 935.55–941.25               |
| `mai-depth-flame-knockdown-jump-guard` — Enhanced Ryuuenbu knockdown: jump heavy kick and guard OD Shoryuken | response | 941.65–947.60               |
| `mai-depth-air-to-air-medium-heavy-rise` — Air-to-air medium punch into heavy rising kick                    | response | 811.10–814.15               |
