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

## Deep expansion

Reviewed 12 November 2026. The library now contains **49 references and 148 selected moments**. All 13 original reference objects, revisions, related links, manifests and media remain unchanged. The 36 additions contain 13 combos, 17 setups and 6 responses.

The preserved [VesperArcade annotated guide](https://www.youtube.com/watch?v=sD6SaqB9h-M), uploaded 2025-10-17 UTC, supplies 13 new combos. [Killerex’s SF6: C Viper Tech](https://www.youtube.com/watch?v=q6XFnRI9obc), 2025-10-16 UTC, supplies six knockdown setups. [Chris_F’s C.Viper 101 - Complete Guide](https://www.youtube.com/watch?v=QnM17vm3S0Y), 2025-10-18 UTC, supplies eleven pressure/oki setups and six responses. Exact metadata and local recording hashes are retained. The full source-clock disposition ledger is `docs/source-ledgers/cviper.json`; every unselected interval remains explicit.

The combos add far versus close double-kick confirms, the heavy Thunder Dash feint, standing-heavy high-jump feint, Punish-Counter heavy kick and Drive Impact, a real side switch, cross-up medium kick, Drive Rush overhead, far medium-Thunder stagger and charged normal versus OD Focus Force. Chris_F’s actual input history resolves the heavy feint as **214HP+LK**, distinct from **6PP Tracer** and neutral **PP Knuckled Pursuit**. The held OD Focus/Level 3 cash-out starts with six Drive bars and three Super bars; its eight nominal Drive costs include two high jumps, with regeneration and the final OD move taking the remainder into Burnout. Eight is not a starting-gauge requirement.

The setup families distinguish grounded Tracer, grounded light Burning Kick/Pursuit, airborne Burning Kick/Pursuit, juggle Tracer and corner forward throw. Follow-ups cover walk and dash throws, standing-medium meaty, a specific backdash/heavy-kick wake-up-throw callout, the different four-light dash/walk-back spacing, a crouching-light-kick whiff into corner medium punch, and ordinary jumping-heavy-punch/landing guard. The separate standing-medium pressure branches catch a walk-back, confirm Counter-Hit jab into crouching medium, or throw a guarding opponent. A blocked crouching-heavy feint creates an actual spacing trap against Cammy crouching medium punch. Prerequisites stay separate from follow-up inputs/costs. Intentional whiffs appear as **(whiff)** in compact and copied notation. Dated +F values describe remaining advantage; no numeric wait duration is invented.

Three grounded anti-airs cover heavy Thunder/Tracer, farther standing heavy kick and heavy kick/high-jump Level 2. The three Drive Rush responses retain actual crouching-medium/Seismo, single standing-light-kick and crouching-medium-kick/two-high-jump/aerial-medium-Burning-Kick results against Juri. The last response spends two Drive bars. None claims an on-reaction or universal check. Jamie’s exact rising-kick strength is unidentified in the two landing-guard setups; those cards document only the recorded blocks and explicitly do not certify OD-safe or universal safe jumps. The two-jab dash/walk-back and immediate post-medium throw failures are not labeled successful pressure.

[Capcom’s official introduction](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1811772772213248) supports move naming, High Jump/follow-up costs and the Level 1 install distinction. Footage supplies the performed strengths and states. No new extraction starts with an assumed active install. All new entries remain `source-reviewed`, with `gameVersion: null`, and are not re-tested on the current patch.

Every new excerpt preserves the full 1280×720 frame, uses silent H264 on a zero clock, and derives exact stills and timed descriptions through the canonical ingestion helper. Selected prepared moments and original/prepared clip endpoints receive separate visual review. Mechanical checks cover stream/decode/clock/duration, exact selected JPEGs, descriptions and manifest mapping. Source originals and author tooling remain outside Git.

This is substantial partial extraction. Killerex’s remaining meaty/side-switch/DI-reset chapters, Chris_F’s install/neutral/defensive and numerous combo/oki alternatives, and Vesper’s further light/medium/DI/Rush/air-to-air/Super branches remain unprocessed. Ambiguous LP/MP Seismo takes stay excluded. Source availability is not exhausted.

### Appended reference index

| Reference                                                                                                                 | Type     | Source interval                        |
| ------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------- |
| `cviper-depth-anti-air-heavy-thunder-tracer` — Close anti-air: heavy Thunder Dash into Tracer                             | response | chris-f-cviper-2025 1185.65–1188.85    |
| `cviper-depth-anti-air-far-standing-heavy-kick` — Far anti-air: standing heavy kick                                       | response | chris-f-cviper-2025 143.30–145.85      |
| `cviper-depth-anti-air-heavy-kick-jump-cancel-level-two` — Anti-air heavy kick: high-jump cancel into Level 2             | response | chris-f-cviper-2025 1204.35–1212.05    |
| `cviper-depth-drive-rush-counter-medium-seismo` — Stop Juri Drive Rush: crouching-medium Counter Hit into Seismo          | response | chris-f-cviper-2025 1268.85–1271.65    |
| `cviper-depth-drive-rush-standing-light-kick` — Stop Juri Drive Rush: standing light-kick check                           | response | chris-f-cviper-2025 1282.80–1284.70    |
| `cviper-depth-drive-rush-low-high-jump-seismo` — Stop Juri Drive Rush: low Counter Hit, high-jump cancel and Seismo       | response | chris-f-cviper-2025 1292.65–1296.00    |
| `cviper-depth-far-forward-heavy-light-thunder` — Far double kick: jab into heavy Thunder Dash                             | combo    | vesperarcade-cviper-2025 182.05–186.05 |
| `cviper-depth-close-forward-heavy-light-chain` — Close double kick: two crouching jabs into medium Thunder                | combo    | vesperarcade-cviper-2025 187.75–192.15 |
| `cviper-depth-crouching-heavy-feint-focus` — Crouching heavy: Thunder feint, medium punch and Focus Force                 | combo    | vesperarcade-cviper-2025 206.05–210.30 |
| `cviper-depth-crouching-heavy-feint-od-seismo` — Crouching heavy feint: OD Seismo and aerial heavy Burning Kick           | combo    | vesperarcade-cviper-2025 211.75–216.90 |
| `cviper-depth-standing-heavy-jump-cancel-feint` — Standing heavy: high-jump cancel into Thunder feint and Focus           | combo    | vesperarcade-cviper-2025 218.65–222.85 |
| `cviper-depth-far-heavy-kick-punish-light-thunder` — Far heavy-kick Punish Counter into light Thunder                     | combo    | vesperarcade-cviper-2025 315.85–319.75 |
| `cviper-depth-heavy-kick-punish-side-switch` — Heavy-kick Punish Counter: two high jumps and side-switch juggle           | combo    | vesperarcade-cviper-2025 321.55–327.60 |
| `cviper-depth-drive-impact-punish-seismo-air-kick` — Drive Impact Punish Counter: light Seismo high-jump juggle           | combo    | vesperarcade-cviper-2025 366.25–372.35 |
| `cviper-depth-crossup-medium-od-seismo-double-od` — Cross-up medium kick: OD Seismo into a second OD Burning Kick         | combo    | vesperarcade-cviper-2025 392.30–398.35 |
| `cviper-depth-drive-rush-overhead-focus` — Drive Rush overhead: crouching medium into Focus Force                         | combo    | vesperarcade-cviper-2025 455.15–459.85 |
| `cviper-depth-far-medium-thunder-jab-heavy` — Far medium Thunder Dash stagger: jab into heavy Thunder                     | combo    | vesperarcade-cviper-2025 544.15–548.15 |
| `cviper-depth-charged-focus-light-seismo-juggle` — Charged normal Focus Force: light Seismo high-jump route               | combo    | vesperarcade-cviper-2025 582.70–589.70 |
| `cviper-depth-charged-od-focus-all-drive-level-three` — Charged OD Focus Force: full-Drive Level 3 cash-out               | combo    | vesperarcade-cviper-2025 615.55–634.15 |
| `cviper-depth-corner-forward-throw-walk-throw` — Corner forward throw: walk into another throw                            | setup    | chris-f-cviper-2025 222.65–226.20      |
| `cviper-depth-corner-forward-throw-shimmy-heavy` — Corner throw shimmy: punish the whiffed throw with heavy kick          | setup    | chris-f-cviper-2025 243.15–245.80      |
| `cviper-depth-blocked-medium-low-walkback-check` — Blocked medium punch: low kick catches the walk-back                   | setup    | chris-f-cviper-2025 309.45–313.15      |
| `cviper-depth-blocked-medium-counter-jab-medium` — Blocked medium punch: Counter-Hit jab links into crouching medium      | setup    | chris-f-cviper-2025 324.10–326.65      |
| `cviper-depth-blocked-medium-throw-respect` — Blocked medium punch: throw the guarding opponent                           | setup    | chris-f-cviper-2025 331.10–334.70      |
| `cviper-depth-crouching-heavy-feint-spacing-trap` — Blocked crouching heavy feint: make Cammy medium whiff                | setup    | chris-f-cviper-2025 363.05–365.85      |
| `cviper-depth-light-burning-pursuit-walk-throw` — Grounded light Burning Kick/Pursuit: walk into wake-up throw            | setup    | chris-f-cviper-2025 611.80–617.75      |
| `cviper-depth-two-jab-tracer-dash-medium` — Two-jab Tracer knockdown: dash into meaty medium punch                        | setup    | chris-f-cviper-2025 790.65–793.85      |
| `cviper-depth-two-jab-tracer-dash-backdash-heavy` — Two-jab Tracer knockdown: dash, backdash and heavy-kick throw callout | setup    | chris-f-cviper-2025 795.85–800.15      |
| `cviper-depth-four-light-tracer-dash-walkback` — Four-light Tracer knockdown: dash and walk back from throw               | setup    | chris-f-cviper-2025 830.25–834.75      |
| `cviper-depth-corner-tracer-whiff-low-medium` — Corner Tracer knockdown: whiff low kick into meaty medium                 | setup    | chris-f-cviper-2025 900.05–904.15      |
| `cviper-depth-grounded-tracer-dash-throw` — Grounded heavy Thunder/Tracer: dash into delayed throw                        | setup    | killerex-cviper-2025 15.15–19.98       |
| `cviper-depth-grounded-burning-pursuit-dash-throw` — Grounded light Burning Kick/Pursuit: dash into throw                 | setup    | killerex-cviper-2025 21.40–26.12       |
| `cviper-depth-air-burning-pursuit-dash-throw` — Air Burning Kick/Pursuit juggle: dash into wake-up throw                  | setup    | killerex-cviper-2025 27.65–33.15       |
| `cviper-depth-juggle-tracer-walk-medium-throw` — Juggled medium Thunder/Tracer: walk, blocked medium and throw            | setup    | killerex-cviper-2025 78.85–84.80       |
| `cviper-depth-od-thunder-tracer-jump-land-guard` — OD Thunder/Tracer knockdown: jumping heavy punch and land guard        | setup    | killerex-cviper-2025 493.70–496.60     |
| `cviper-depth-seismo-air-heavy-jump-land-guard` — Seismo/air heavy Burning Kick: jumping heavy punch and land guard       | setup    | killerex-cviper-2025 498.35–501.15     |
