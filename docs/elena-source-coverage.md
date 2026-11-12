# Elena source coverage and review

Reviewed on 11 November 2026.

This first collection contains 12 selected references and 40 annotated moments. Each reference has a silent individual replay clip, selected stills and timed action descriptions. It is a curated practice collection, not complete tutorial coverage or current-patch certification.

## Source

[Street Fighter 6 Elena Combos! Complete Combo Guide](https://www.youtube.com/watch?v=G_aSayiIcGg), VesperArcade, 2025-06-17 UTC. Original metadata, chapter outline and recording SHA-256 are retained in `content/sources/vesperarcade-elena-2025.json`. Chapters and recipe panels locate candidates; actual action order, hit results, resource displays, state and clip boundaries establish the authored reference.

## Interpretation and limits

The collection distinguishes ordinary light confirms, the standing-opponent Rhino Horn finish, a standing-light-kick link, one and two successive Level 1 juggle budgets, an OD Rhino Horn conversion, a three-bar finish and a standing-medium-kick confirm. The corner DI take uses both heavy-punch target inputs before the light Rhino Horn juggle. The Punish Counter jab links into the medium target combo. The airborne MP example is an air-to-air conversion that lands before Scratch Wheel.

The source offers alternate starters and finishers in some captions. Each reference selects the executed take rather than treating those alternatives as extra hits. Longer Lynx Song and Lynx Whirl branches, rush-cancel cash-outs and setplay remain outside this initial collection.

All entries are `source-reviewed` with `gameVersion: null`. None was re-tested in-game on the current patch. Source damage, advantage, safety and matchup behavior remain properties of the dated demonstration; they do not prove universal execution or safety. Longer lessons remain external links.

## Media preparation

The complete 1280×720 source frame is preserved. Accurate lossless excerpts are prepared before the canonical ingestion helper encodes silent H.264 clips, resets playback timestamps to zero, exports selected stills on that clock and writes WebVTT action descriptions. Source intervals and key-moment timestamps use separate clocks. Every selected moment and both clip endpoints are visually checked. Mechanical audits validate full decode, silence, H.264, dimensions, duration, presentation clocks, JPEG integrity, exact descriptions and manifest mappings. Full originals and tooling workfiles stay outside Git. Public redistribution has not been assessed.

## Reference index

| Reference                                                                                              | Type  | Original interval |
| ------------------------------------------------------------------------------------------------------ | ----- | ----------------- |
| `elena-vesper-low-light-scythe` — Low lights into light Spinning Scythe                                | combo | 0:21.80–0:26.20   |
| `elena-vesper-three-jab-heavy-wheel` — Three crouching jabs into heavy Scratch Wheel                   | combo | 0:27.60–0:31.65   |
| `elena-vesper-jab-standing-light-rhino` — Crouching jabs and standing jab into light Rhino Horn        | combo | 0:33.30–0:37.60   |
| `elena-vesper-jab-light-kick-heavy-wheel` — Crouching jabs into standing LK and heavy Scratch Wheel    | combo | 0:38.80–0:42.95   |
| `elena-vesper-low-level1-heavy-wheel` — Low lights through Level 1 into heavy Scratch Wheel            | combo | 0:44.90–0:51.65   |
| `elena-vesper-low-two-level1s` — Low lights through two Level 1s into heavy Scratch Wheel              | combo | 0:52.80–1:02.50   |
| `elena-vesper-low-od-rhino-heavy-wheel` — Low lights through OD Rhino Horn into heavy Scratch Wheel    | combo | 1:03.90–1:08.85   |
| `elena-vesper-low-scythe-level3` — Low lights through light Spinning Scythe into Level 3               | combo | 1:30.30–1:44.30   |
| `elena-vesper-medium-lights-light-scythe` — Standing medium kick into lights and light Spinning Scythe | combo | 1:54.75–1:59.70   |
| `elena-vesper-wall-heavy-target-rhino` — Wall splat through heavy target combo and light Rhino Horn    | combo | 5:13.20–5:20.10   |
| `elena-vesper-punish-jab-medium-target` — Punish-counter jab into medium target combo and Rhino Horn   | combo | 6:17.30–6:22.15   |
| `elena-vesper-air-medium-heavy-wheel` — Air-to-air medium punch into heavy Scratch Wheel               | combo | 14:09.40–14:12.75 |

## Official move-name cross-check

Names and character-specific resource behavior were checked against [Capcom’s published character introduction](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1797820624474686). The tutorial footage separately establishes the listed command, strength, action order and state.

| Command in this collection | Official move name               |
| -------------------------- | -------------------------------- |
| `214LK`                    | Light Spinning Scythe            |
| `236LK`                    | Light Rhino Horn                 |
| `236MK`                    | Medium Rhino Horn                |
| `236KK`                    | OD Rhino Horn                    |
| `623MK`                    | Medium Scratch Wheel             |
| `623HK`                    | Heavy Scratch Wheel              |
| `SA1`                      | Meteor Volley (Level 1)          |
| `SA3`                      | Song of the Grasslands (Level 3) |

## Deep expansion

Reviewed 12 November 2026. The library contains **52 references and 160 selected moments**. All 12 original objects, revisions, related links and media remain unchanged. Forty additions contain 11 combos, 17 setups and 12 responses.

[Joe Ebios’s complete guide](https://www.youtube.com/watch?v=53t-H8cqiFo), uploaded 2026-09-04 UTC, supplies 35 additions. Its title cites the 2026.08.03 update; neither that title nor source review is current-patch gameplay certification. [KEI.B’s recording](https://www.youtube.com/watch?v=V0FL4F70d98), 2025-06-09 UTC, supplies three Perfect Parry responses; the preserved [VesperArcade recording](https://www.youtube.com/watch?v=G_aSayiIcGg), 2025-06-17 UTC, supplies two air-to-air conversions. New metadata retains exact identities, dates and recording hashes. The complete source-clock ledger is `docs/source-ledgers/elena.json`.

The new setup families distinguish medium-Rhino, raw-Rush heavy-Rhino and corner light-Wheel knockdowns. Roll/Whirl/Snap, raw-Rush low and overhead, blocked-medium throw/shimmy, empty-roll delayed throw, whiff-light overhead, standing-jab framekills and crouching-jab framekills retain their actual prerequisites. Prerequisites remain separate from performed follow-up inputs and costs, while replays retain context. Numeric +F values are dated advantage observations, not wait instructions. Every intentional framekill appears as **(whiff)** in compact/copied notation.

The responses include the recorded medium-Rhino Snap trade, Rush/crouch-guard as Ryu OD Shoryuken misses overhead, roll/medium/guard against Ryu Drive Reversal, two-whiff jab/guard against Lily Level 1, two standing-light-kick punish options against Bison Drive Reversal, a heavy-target/Rush carry punish after Ryu OD Shoryuken, three Perfect Parry conversions, and two air-to-airs. Safety claims are limited to those recorded exchanges. The Perfect Parry routes retain their damage scaling and actual Scythe/Whirl/Harvest-Circle cancels. The air-to-airs are separately labeled and do not imply grounded Anti-air coverage. The carry response begins Midscreen.

The added combos cover heavy-Scythe/Rhino knockdowns, raw-Rush extensions, OD roll into Level 1/post-Super Wheel, Level 3 cash-out, Counter-Hit jab target links, and point-blank versus longer-range jab/medium/low Punish Counters. Actual uncaptained shimmy punish buttons were resolved with full input-history probes: **cr.MP**, then heavy Scythe; the corner extension uses **light Rhino and light Wheel**. Generic any ender captions do not become guessed routes. [Capcom’s introduction](https://www.capcomfrance.fr/elena-arrivera-dans-street-fighter-6-le-5-juin-prochain/) supports move naming and the distinction between Lynx Whirl, Moon Glider and the Super choices; footage establishes commands, strengths and the performed branches.

All 40 new excerpts preserve the full 1280×720 frame, use silent H264 on a zero clock, and derive exact stills and timed descriptions through the canonical media helper. The final semantic pass also moved two Punish-Counter starts ahead of impact, removed a black chapter transition, selected the actual post-Super Wheel and separate whiffs, and distinguished the OD-DP miss from a block. Every selected prepared still and both original clip endpoints are reviewed separately from source screening; mechanical audit checks streams, complete decode, dimensions, clocks, duration, exact JPEG selection and VTT. Originals and author tooling remain outside Git.

This is substantial partial extraction. Large light/medium/target/Rush/DI/Super, corner-throw and stun sections remain unprocessed. KEI.B’s apparent safe jump is excluded because the recorded opponent DP strength/OD state is unresolved; it is not labeled universally safe. The Lily Condor-Spire wind state needs its own review. The local Stoned source is screened but unextracted. Dedicated grounded Anti-air material remains a gap.

### Appended reference index

| Reference                                                                                                                      | Type     | Source interval                                |
| ------------------------------------------------------------------------------------------------------------------------------ | -------- | ---------------------------------------------- |
| `elena-depth-crouching-heavy-scythe-medium-rhino` — Crouching heavy into heavy Scythe and medium Rhino                         | combo    | joe-ebios-elena-september-2026 2.00–8.85       |
| `elena-depth-medium-rhino-roll-whirl-snap` — Medium-Rhino knockdown: roll, Whirl and Leopard Snap                              | setup    | joe-ebios-elena-september-2026 9.00–15.85      |
| `elena-depth-medium-rhino-snap-trade-target` — Medium-Rhino knockdown: Snap trade into kick target                             | response | joe-ebios-elena-september-2026 15.95–25.75     |
| `elena-depth-medium-rhino-rush-guard` — Medium-Rhino knockdown: raw Rush and guard as OD Shoryuken misses                      | response | joe-ebios-elena-september-2026 25.95–33.35     |
| `elena-depth-medium-rhino-rush-medium-glider` — Medium-Rhino knockdown: Rush medium into Moon Glider                           | setup    | joe-ebios-elena-september-2026 33.50–42.70     |
| `elena-depth-medium-rhino-rush-low-target` — Medium-Rhino knockdown: Rush low into kick target                                 | setup    | joe-ebios-elena-september-2026 42.90–52.60     |
| `elena-depth-crouching-heavy-rush-heavy-rhino` — Heavy Scythe launcher: raw Rush into heavy Rhino                              | combo    | joe-ebios-elena-september-2026 52.80–59.70     |
| `elena-depth-heavy-rhino-roll-whirl-snap` — Heavy-Rhino knockdown: roll, Whirl and Leopard Snap                                | setup    | joe-ebios-elena-september-2026 59.90–67.35     |
| `elena-depth-heavy-rhino-rush-throw` — Heavy-Rhino knockdown: raw Rush into throw                                              | setup    | joe-ebios-elena-september-2026 74.50–84.40     |
| `elena-depth-heavy-rhino-rush-shimmy` — Heavy-Rhino knockdown: raw Rush shimmy                                                 | setup    | joe-ebios-elena-september-2026 84.65–96.45     |
| `elena-depth-heavy-rhino-rush-overhead` — Heavy-Rhino knockdown: Rush overhead into kick target                                | setup    | joe-ebios-elena-september-2026 109.25–119.60   |
| `elena-depth-scythe-od-roll-level-one` — Heavy Scythe: raw Rush OD roll into Level 1 and heavy Wheel                           | combo    | joe-ebios-elena-september-2026 147.70–158.25   |
| `elena-depth-scythe-heavy-rhino-level-three` — Heavy Scythe cash-out: raw Rush, heavy Rhino and Level 3                        | combo    | joe-ebios-elena-september-2026 193.90–209.10   |
| `elena-depth-corner-heavy-scythe-light-wheel` — Corner heavy Scythe: light Rhino into light Wheel                              | combo    | joe-ebios-elena-september-2026 228.00–235.35   |
| `elena-depth-corner-wheel-roll-medium-guard` — Corner light-Wheel knockdown: roll medium, then guard Drive Reversal            | response | joe-ebios-elena-september-2026 242.55–250.85   |
| `elena-depth-corner-wheel-roll-medium-throw` — Corner light-Wheel knockdown: roll medium on block, then throw                  | setup    | joe-ebios-elena-september-2026 258.65–268.65   |
| `elena-depth-corner-wheel-roll-medium-shimmy` — Corner light-Wheel knockdown: roll medium on block into shimmy                 | setup    | joe-ebios-elena-september-2026 268.90–281.95   |
| `elena-depth-corner-wheel-roll-medium-confirm` — Corner light-Wheel knockdown: roll medium into kick target                    | setup    | joe-ebios-elena-september-2026 282.30–293.65   |
| `elena-depth-corner-wheel-roll-delay-throw` — Corner light-Wheel knockdown: empty roll and delayed throw                       | setup    | joe-ebios-elena-september-2026 293.95–303.85   |
| `elena-depth-corner-wheel-whiff-low-overhead` — Corner light-Wheel knockdown: whiff light kick into overhead                   | setup    | joe-ebios-elena-september-2026 304.10–312.35   |
| `elena-depth-corner-wheel-low-standing-jab-throw` — Corner light-Wheel knockdown: two whiffs into throw                        | setup    | joe-ebios-elena-september-2026 321.10–330.85   |
| `elena-depth-corner-wheel-low-standing-jab-confirm` — Corner light-Wheel knockdown: two whiffs into jab target confirm         | setup    | joe-ebios-elena-september-2026 331.50–342.35   |
| `elena-depth-corner-wheel-whiffs-jab-guard-level-one` — Corner light-Wheel knockdown: two whiffs, jab, then guard Lily Level 1 | response | joe-ebios-elena-september-2026 342.70–352.85   |
| `elena-depth-corner-wheel-low-crouching-jab-low` — Corner light-Wheel knockdown: two crouching whiffs into low target          | setup    | joe-ebios-elena-september-2026 360.45–371.65   |
| `elena-depth-corner-wheel-low-crouching-jab-throw` — Corner light-Wheel knockdown: two crouching whiffs and delayed throw      | setup    | joe-ebios-elena-september-2026 371.95–381.65   |
| `elena-depth-corner-wheel-low-crouching-jab-shimmy` — Corner light-Wheel knockdown: two crouching whiffs into shimmy           | setup    | joe-ebios-elena-september-2026 381.95–394.65   |
| `elena-depth-punish-jab-medium-glider` — Jab Punish Counter: crouching medium into Moon Glider                                 | combo    | joe-ebios-elena-september-2026 931.30–935.45   |
| `elena-depth-punish-close-jab-heavy-scythe` — Close jab Punish Counter: heavy Scythe and medium Rhino                          | combo    | joe-ebios-elena-september-2026 938.00–943.95   |
| `elena-depth-punish-jab-od-rhino-side-switch` — Jab Punish Counter: kick target into OD-Rhino side switch                      | combo    | joe-ebios-elena-september-2026 946.85–951.25   |
| `elena-depth-punish-low-medium-glider` — Low Punish Counter: crouching medium into Moon Glider                                 | combo    | joe-ebios-elena-september-2026 965.95–970.85   |
| `elena-depth-punish-medium-heavy-scythe` — Crouching-medium Punish Counter into heavy Scythe                                   | combo    | joe-ebios-elena-september-2026 972.70–978.35   |
| `elena-depth-guard-bison-drive-reversal-light-rhino` — Block Bison Drive Reversal: standing light-kick punish                  | response | joe-ebios-elena-september-2026 953.20–957.65   |
| `elena-depth-guard-bison-drive-reversal-od-scythe` — Block Bison Drive Reversal: light kick into OD Scythe                     | response | joe-ebios-elena-september-2026 958.90–964.95   |
| `elena-depth-air-to-air-heavy-level-one` — Air-to-air heavy kick: Level 1 into heavy Wheel                                     | response | vesperarcade-elena-2025 842.35–847.90          |
| `elena-depth-air-to-air-target-od-side-switch` — Air-to-air punch target: OD Rhino side switch                                 | response | vesperarcade-elena-2025 859.90–864.40          |
| `elena-depth-perfect-parry-psycho-di` — Perfect Parry OD Psycho Crusher: DI into heavy Scythe                                  | response | keib-elena-2025 1198.15–1205.55                |
| `elena-depth-perfect-parry-psycho-jab` — Perfect Parry OD Psycho Crusher: jab into Scythe and Whirl                            | response | keib-elena-2025 1209.85–1215.60                |
| `elena-depth-perfect-parry-kimberly-run` — Perfect Parry Kimberly’s run attack: jab into heavy Scythe                          | response | keib-elena-2025 1229.15–1234.40                |
| `elena-depth-counter-jab-kick-target-heavy-rhino` — Counter-hit crouching jab: kick target into heavy Rhino                    | combo    | joe-ebios-elena-september-2026 620.90–625.35   |
| `elena-depth-guard-od-dp-heavy-target-carry` — Block OD Shoryuken: heavy target into raw-Rush carry                            | response | joe-ebios-elena-september-2026 1117.90–1126.85 |
