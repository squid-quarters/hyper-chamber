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
