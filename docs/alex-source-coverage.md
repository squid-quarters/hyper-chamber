# Alex source coverage and review

Reviewed on 11 November 2026.

This first collection contains 12 selected references and 39 annotated moments. Each reference has a silent individual replay clip, selected stills and timed action descriptions. It is a curated practice collection, not complete tutorial coverage or current-patch certification.

## Source

[Street Fighter 6 Alex Combos Guide, With Annotations!](https://www.youtube.com/watch?v=KOBn4nUUVKU), VesperArcade, 2026-03-19 UTC. Original metadata, chapter outline and recording SHA-256 are retained in `content/sources/vesperarcade-alex-2026.json`. Chapters and recipe panels locate candidates; actual action order, hit results, resource displays, state and clip boundaries establish the authored reference.

## Interpretation and limits

The collection distinguishes ordinary and held standing-heavy starters, light and medium Flash Axe, the heavy and OD knee-smash throw finishes, three Super budgets and a blocked-DI corner conversion through Prowler Stance. The stance entry and forward-light-punch continuation are separate inputs. The OD Flash Axe to Level 2 take uses the first-hit cancel explicitly shown by the source. The Punish Counter reference selects the demonstrated standing jab rather than merging its crouching-jab alternative.

The initial collection does not cover the full stance tree, command-throw setplay or anti-air branches. English Prowler Stance terminology follows the official Capcom launch post: https://news.capcomusa.com/2026/2026/03/17/alex-power-bombs-into-street-fighter-6-today/ .

All entries are `source-reviewed` with `gameVersion: null`. None was re-tested in-game on the current patch. Source damage, advantage, safety and matchup behavior remain properties of the dated demonstration; they do not prove universal execution or safety. Longer lessons remain external links.

## Media preparation

The complete 1280×720 source frame is preserved. Accurate lossless excerpts are prepared before the canonical ingestion helper encodes silent H.264 clips, resets playback timestamps to zero, exports selected stills on that clock and writes WebVTT action descriptions. Source intervals and key-moment timestamps use separate clocks. Every selected moment and both clip endpoints are visually checked. Mechanical audits validate full decode, silence, H.264, dimensions, duration, presentation clocks, JPEG integrity, exact descriptions and manifest mappings. Full originals and tooling workfiles stay outside Git. Public redistribution has not been assessed.

## Reference index

| Reference                                                                                    | Type  | Original interval |
| -------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `alex-vesper-low-light-axe` — Low light chain into light Flash Axe                           | combo | 0:16.50–0:21.65   |
| `alex-vesper-low-heavy-knee` — Low lights into heavy Aerial Knee Smash                       | combo | 0:22.80–0:28.80   |
| `alex-vesper-low-level1` — Low light chain into Level 1                                      | combo | 0:29.60–0:35.70   |
| `alex-vesper-low-od-knee` — Low light chain into OD Aerial Knee Smash                        | combo | 0:36.85–0:44.00   |
| `alex-vesper-low-od-axe-level2` — Low lights through OD punch special into Level 2           | combo | 0:45.10–0:55.15   |
| `alex-vesper-low-light-axe-level3` — Low lights and light Flash Axe into Level 3             | combo | 0:56.45–1:09.10   |
| `alex-vesper-back-medium-light-axe` — Back medium kick into lights and light Flash Axe       | combo | 1:14.00–1:18.10   |
| `alex-vesper-back-medium-heavy-knee` — Back medium kick into lights and heavy knee smash     | combo | 1:19.50–1:25.60   |
| `alex-vesper-standing-medium-axe` — Standing medium punch into medium Flash Axe              | combo | 1:26.65–1:32.50   |
| `alex-vesper-held-heavy-jab-knee` — Held heavy punch into jab and heavy knee smash           | combo | 1:42.50–1:48.30   |
| `alex-vesper-wall-stance-medium-knee` — Wall splat through Prowler Stance into medium knee   | combo | 2:39.65–2:47.65   |
| `alex-vesper-punish-jab-medium-axe` — Punish-counter jab into crouching medium and Flash Axe | combo | 3:34.20–3:38.25   |

## Official move-name cross-check

Names and character-specific resource behavior were checked against [Capcom’s published character introduction](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1822556746157802). The tutorial footage separately establishes the listed command, strength, action order and state.

| Command in this collection | Official move name              |
| -------------------------- | ------------------------------- |
| `236LP`                    | Light Flash Axe                 |
| `236MP`                    | Medium Flash Axe                |
| `236PP`                    | OD quarter-circle-forward punch |
| `623MK`                    | Medium Aerial Knee Smash        |
| `623HK`                    | Heavy Aerial Knee Smash         |
| `623KK`                    | OD Aerial Knee Smash            |
| `2PP`                      | Prowler Stance                  |
| `SA1`                      | Raging Spear (Level 1)          |
| `SA2`                      | Sledgecross Hammer (Level 2)    |
| `SA3`                      | The Final Prison (Level 3)      |

The OD forward-punch command is retained with a directional label until its exact OD move-name mapping is established; it is not guessed from the non-OD light/medium name.

## Deep expansion

Reviewed 12 November 2026. The library now contains **51 references and 164 selected moments**. All 12 original objects, IDs, revisions, related links, source metadata, manifest assets and media bytes are preserved. The 39 additions contain 20 setups, 13 combos and 6 responses.

[Joe Ebios’s updated Classic Alex guide](https://www.youtube.com/watch?v=8p5NCSvXjbM), uploaded 2026-05-19 UTC, supplies 38 additions. [Brian_F’s Alex guide](https://www.youtube.com/watch?v=L4OjcgYa7-o), 2026-03-29 UTC, supplies the actual grounded light-Knee anti-air. The original [VesperArcade guide](https://www.youtube.com/watch?v=KOBn4nUUVKU) and its 12 extracted references remain exact. Local original/metadata hashes and a complete source-clock disposition partition live in `docs/source-ledgers/alex.json`.

Setup families now distinguish midscreen heavy-Knee Rush pressure, corner heavy-Knee dash pressure, OD-Knee hard-knockdown dash pressure, the heavy-Chop/back-turn b.MK knockdown, the forward-held OD-back-grab extension and the normal corner throw. They include normal and strength-specific command throws, blocked back-medium kick into a different follow-up, actual shimmies, the Rush overhead and delayed low, corner crouching-heavy/Prowler conversion, a whiff-jab frame kill and a meterless dash/jab/light-kick route. Prerequisites and their resource costs are separate from performed follow-ups. Intentional whiffs appear in compact/copied notation; numeric +F overlays are advantage readings, not invented wait counts.

Conversions add close versus far light-confirm Rush routes, the full six-Drive/three-Super cash-out, target-chain forward Prowler punches, heavy-punch and heavy-kick Punish-Counter links, held-heavy releases after the actual blocked-back-medium/backward-movement Ryu-OD bait, the actual heavy-Chop turn-around and heavy/OD back-grabs, the separate PP Level-2 throw follow-up, near-corner Super carry/pickup and normal blocked-DI wall crush. Printed alternatives do not become unperformed inputs. The far-light Rush link is actual cr.MP despite the shortened MP overlay; the cash-out first Rush link is actual cr.HP rather than the printed standing-MP alternative. The OD quarter-circle-forward punch remains neutral command notation where the English move-name mapping is not established.

Responses cover the grounded **623LK** anti-air, two different blocked Drive-Reversal punishes, the Prowler leap crossing Ryu OD uppercut, the actual **9 > j.HK > Guard** after the OD-back-grab extension, and counter-DI into an OD-Knee juggle. The jump/guard card claims only the recorded Ryu OD-uppercut block. Brian’s green wake-up follow-up is not mislabeled an anti-air juggle. Counter-DI crumple, normal wall crush and Burnout stun stay separate. The near-corner carry begins Midscreen; Super use alone does not imply Cash-out.

[Capcom’s launch announcement](https://news.capcomusa.com/2026/2026/03/17/alex-power-bombs-into-street-fighter-6-today/) and [its gameplay introduction](https://prtimes.jp/main/html/rd/p/000005573.000013450.html) support the stance and special-move distinctions. Footage supplies the actual commands, strengths, starting state, hit/block results and costs. All additions are `source-reviewed`, `gameVersion: null`; none is certified through current-patch gameplay testing.

Full-frame silent H264 loops use a zero playback clock. Exact selected JPEGs and timed descriptions come from the canonical ingestion helper. Every selected prepared moment and both original/generated boundaries receive visual review, with fine original button/HUD probes on risky branches. Mechanical audits check full decode, single silent video stream, duration/clock, exact stills, VTT and manifest mapping. Originals and tooling remain local, outside Git.

This is substantial partial extraction. The ledger explicitly keeps Joe’s additional Prowler/throw/PC/Super/DI/stun branches, Brian’s large Prowler-oki and reversal lessons, and most Vesper alternatives unprocessed. Metadata-only companion links are not execution-reviewed footage. Source availability is not exhausted.

### Appended reference index

| Reference                                                                                                           | Type     | Source interval                   |
| ------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------- |
| `alex-depth-heavy-knee-rush-back-medium` — Heavy Knee: Rush back medium into crouching medium                       | setup    | joe-ebios-alex-2026 16.20–21.15   |
| `alex-depth-heavy-knee-blocked-back-medium-command-throw` — Heavy Knee: blocked Rush kick into medium command throw | setup    | joe-ebios-alex-2026 32.60–38.55   |
| `alex-depth-heavy-knee-blocked-back-medium-repeat` — Heavy Knee: blocked Rush kick into a second back medium        | setup    | joe-ebios-alex-2026 43.15–49.35   |
| `alex-depth-corner-heavy-knee-dash-throw` — Corner heavy Knee: dash and delayed normal throw                        | setup    | joe-ebios-alex-2026 59.60–62.80   |
| `alex-depth-corner-heavy-knee-dash-command-throw` — Corner heavy Knee: dash into medium command throw               | setup    | joe-ebios-alex-2026 67.75–72.30   |
| `alex-depth-corner-heavy-knee-dash-shimmy` — Corner heavy Knee: dash shimmy into medium pair                        | setup    | joe-ebios-alex-2026 76.60–82.00   |
| `alex-depth-corner-heavy-knee-dash-crouching-heavy` — Corner heavy Knee: dash crouching heavy into Prowler chain    | setup    | joe-ebios-alex-2026 95.10–101.35  |
| `alex-depth-od-knee-dash-throw` — OD Knee: dash into normal throw                                                   | setup    | joe-ebios-alex-2026 114.40–118.70 |
| `alex-depth-od-knee-dash-heavy-command-throw` — OD Knee: dash into heavy command throw                              | setup    | joe-ebios-alex-2026 124.45–129.10 |
| `alex-depth-od-knee-dash-shimmy` — OD Knee: dash shimmy into standing-medium pair                                   | setup    | joe-ebios-alex-2026 135.10–140.65 |
| `alex-depth-back-turn-knee-rush-throw` — Back-turn b.MK knockdown: Rush into normal throw                           | setup    | joe-ebios-alex-2026 396.15–400.80 |
| `alex-depth-back-turn-knee-rush-shimmy` — Back-turn b.MK knockdown: Rush shimmy medium pair                         | setup    | joe-ebios-alex-2026 407.20–413.45 |
| `alex-depth-back-turn-knee-rush-overhead` — Back-turn b.MK knockdown: Rush overhead conversion                      | setup    | joe-ebios-alex-2026 420.10–425.15 |
| `alex-depth-back-turn-knee-rush-delayed-low` — Back-turn b.MK knockdown: delayed Rush low                           | setup    | joe-ebios-alex-2026 431.40–437.00 |
| `alex-depth-hyper-bomb-rush-command-throw` — OD back-grab follow-up: Rush heavy command throw                       | setup    | joe-ebios-alex-2026 494.05–499.35 |
| `alex-depth-hyper-bomb-rush-throw` — OD back-grab follow-up: Rush normal throw                                      | setup    | joe-ebios-alex-2026 506.05–510.90 |
| `alex-depth-corner-throw-rush-throw` — Corner throw: Rush into another normal throw                                 | setup    | joe-ebios-alex-2026 702.80–707.60 |
| `alex-depth-corner-throw-rush-whiff-jab-shimmy` — Corner throw: Rush, whiff jab and shimmy starter                  | setup    | joe-ebios-alex-2026 710.65–712.60 |
| `alex-depth-corner-throw-dash-jab-light-kick` — Corner throw: dash jab into light kick and Knee                     | setup    | joe-ebios-alex-2026 744.25–748.65 |
| `alex-depth-corner-throw-dash-light-command-throw` — Corner throw: dash into light command throw                    | setup    | joe-ebios-alex-2026 752.60–757.65 |
| `alex-depth-anti-air-light-knee` — Anti-air: light Knee Smash                                                       | response | brian-f-alex-2026 194.45–196.90   |
| `alex-depth-guard-drive-reversal-light-knee` — Block Drive Reversal: light kick into heavy Knee                     | response | joe-ebios-alex-2026 208.55–213.60 |
| `alex-depth-guard-drive-reversal-command-throw` — Block Drive Reversal: heavy command-throw punish                  | response | joe-ebios-alex-2026 214.60–220.65 |
| `alex-depth-prowler-leap-evades-ryu-od` — Target chain into Prowler leap: evade Ryu OD uppercut                     | response | joe-ebios-alex-2026 356.00–360.65 |
| `alex-depth-hyper-bomb-jump-kick-guard` — OD back-grab extension: jump heavy kick, then guard Ryu OD                | response | joe-ebios-alex-2026 484.10–487.60 |
| `alex-depth-counter-di-dash-od-knee` — Counter Drive Impact: dash Prowler pickup into OD Knee                       | response | joe-ebios-alex-2026 951.55–961.80 |
| `alex-depth-close-lights-rush-prowler` — Close lights: Rush cancel into Prowler chain                               | combo    | joe-ebios-alex-2026 157.65–165.20 |
| `alex-depth-far-lights-rush-medium` — Far lights: Rush cancel into crouching medium                                 | combo    | joe-ebios-alex-2026 166.45–172.85 |
| `alex-depth-lights-two-rush-level-three-cashout` — Lights cash-out: two Rush cancels and Level 3                    | combo    | joe-ebios-alex-2026 173.35–190.20 |
| `alex-depth-target-prowler-forward-punch-chain` — Medium-heavy target: forward Prowler punch chain                  | combo    | joe-ebios-alex-2026 326.10–332.85 |
| `alex-depth-heavy-punish-crouching-medium-knee` — Heavy-punch punish: crouching medium into heavy Knee              | combo    | joe-ebios-alex-2026 457.25–462.20 |
| `alex-depth-held-heavy-chop-back-throw` — Held heavy punch: Flash Chop into back-turned grab                        | combo    | joe-ebios-alex-2026 463.55–469.55 |
| `alex-depth-held-heavy-od-back-grab-level-two` — Held heavy punch: OD back-grab into Level 2 follow-up              | combo    | joe-ebios-alex-2026 562.10–575.90 |
| `alex-depth-heavy-kick-punish-rush-forward-prowler` — Heavy-kick punish: Rush heavy into forward Prowler pickup     | combo    | joe-ebios-alex-2026 589.75–596.00 |
| `alex-depth-near-corner-heavy-kick-level-two-pickup` — Near-corner heavy kick: Level 2 carry and Prowler pickup     | combo    | joe-ebios-alex-2026 609.20–620.10 |
| `alex-depth-held-heavy-kick-held-punch-knee` — Back medium bait: held-heavy punish into Knee                        | combo    | joe-ebios-alex-2026 621.25–628.10 |
| `alex-depth-held-heavy-kick-heavy-chop-level-three` — Back medium bait: held-heavy punish, Chop and Level 3         | combo    | joe-ebios-alex-2026 637.30–652.10 |
| `alex-depth-corner-held-heavy-od-level-two-pickup` — Corner held heavy: OD quarter-circle punch and Level 2 pickup  | combo    | joe-ebios-alex-2026 577.20–588.65 |
| `alex-depth-blocked-di-wall-crush-prowler` — Blocked corner Drive Impact: wall-crush Prowler route                  | combo    | joe-ebios-alex-2026 975.35–982.40 |
