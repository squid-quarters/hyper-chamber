# Sagat source coverage and review

Reviewed on 11 November 2026.

This first collection contains 13 selected references and 43 annotated moments. Each reference has a silent individual replay clip, selected stills and timed action descriptions. It is a curated practice collection, not complete tutorial coverage or current-patch certification.

## Source

[Street Fighter 6 Sagat Combos Guide!](https://www.youtube.com/watch?v=0P24l4Nu1FE), VesperArcade, 2025-08-07 UTC. Original metadata, chapter outline and recording SHA-256 are retained in `content/sources/vesperarcade-sagat-2025.json`. Chapters and recipe panels locate candidates; actual action order, hit results, resource displays, state and clip boundaries establish the authored reference.

## Interpretation and limits

This collection separates the light and medium Tiger Nexus follow-up branches, one- and three-bar Super finishes, an OD-projectile Super conversion, two blocked-DI wall-splat conversions, a standing-light-kick Punish Counter and an anti-air back-heavy conversion. The source explicitly warns that the forward-medium-kick Nexus follow-up misses crouching opponents. The held heavy Uppercut has an extra finishing strike and is distinct from the tapped heavy version.

The source demonstrates particular jump heights and corner juggle spacing. Those conditions do not establish universal anti-air coverage. Longer rush-cancel, OD Nexus and corner-oki branches remain outside this initial collection.

All entries are `source-reviewed` with `gameVersion: null`. None was re-tested in-game on the current patch. Source damage, advantage, safety and matchup behavior remain properties of the dated demonstration; they do not prove universal execution or safety. Longer lessons remain external links.

## Media preparation

The complete 1280×720 source frame is preserved. Accurate lossless excerpts are prepared before the canonical ingestion helper encodes silent H.264 clips, resets playback timestamps to zero, exports selected stills on that clock and writes WebVTT action descriptions. Source intervals and key-moment timestamps use separate clocks. Every selected moment and both clip endpoints are visually checked. Mechanical audits validate full decode, silence, H.264, dimensions, duration, presentation clocks, JPEG integrity, exact descriptions and manifest mappings. Full originals and tooling workfiles stay outside Git. Public redistribution has not been assessed.

## Reference index

| Reference                                                                                          | Type  | Original interval |
| -------------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `sagat-vesper-low-medium-uppercut` — Low lights into medium Tiger Uppercut                         | combo | 0:15.70–0:20.60   |
| `sagat-vesper-low-light-knee` — Low kick and jab into light Tiger Knee                             | combo | 0:26.80–0:31.30   |
| `sagat-vesper-low-nexus-light-follow` — Low lights into light Tiger Nexus and light follow-up      | combo | 0:32.30–0:36.10   |
| `sagat-vesper-low-nexus-medium-follow` — Low lights into light Nexus and medium follow-up          | combo | 0:37.50–0:42.10   |
| `sagat-vesper-low-level1` — Low lights into Level 1                                                | combo | 0:49.70–0:55.65   |
| `sagat-vesper-low-uppercut-level3` — Low lights through medium Uppercut into Level 3               | combo | 1:07.50–1:20.65   |
| `sagat-vesper-medium-od-shot-level1` — Crouching medium into OD Tiger Shot and Level 1             | combo | 1:59.70–2:06.25   |
| `sagat-vesper-back-heavy-shot-uppercut` — Back heavy punch through medium shot into heavy Uppercut | combo | 2:23.60–2:28.90   |
| `sagat-vesper-wall-held-uppercut` — Wall splat into back heavy and held heavy Uppercut             | combo | 3:53.20–4:01.15   |
| `sagat-vesper-wall-heavy-knee-uppercut` — Wall splat through heavy Tiger Knee into medium Uppercut | combo | 4:02.50–4:09.40   |
| `sagat-vesper-punish-light-heavy-uppercut` — Punish-counter light kick into heavy Uppercut         | combo | 4:23.50–4:27.70   |
| `sagat-vesper-anti-air-back-heavy-held` — Anti-air back heavy punch into held heavy Uppercut       | combo | 10:27.40–10:33.10 |
| `sagat-vesper-medium-od-knee` — Crouching medium punch into OD Tiger Knee Crush                    | combo | 1:53.60–1:58.20   |

## Official move-name cross-check

Names and character-specific resource behavior were checked against [Capcom’s published character introduction](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1805431065284804). The tutorial footage separately establishes the listed command, strength, action order and state.

| Command in this collection | Official move name         |
| -------------------------- | -------------------------- |
| `236MP`                    | Medium High Tiger Shot     |
| `236MPHP`                  | OD High Tiger Shot (MP+HP) |
| `236LK`                    | Light Tiger Knee Crush     |
| `236HK`                    | Heavy Tiger Knee Crush     |
| `236KK`                    | OD Tiger Knee Crush        |
| `623MP`                    | Medium Tiger Uppercut      |
| `623HP`                    | Heavy Tiger Uppercut       |
| `623HP (hold)`             | Held heavy Tiger Uppercut  |
| `214LK`                    | Light Tiger Nexus          |
| `6LK`                      | Mighty Tiger follow-up     |
| `6MK`                      | Greedy Tiger follow-up     |
| `SA1`                      | Tiger Cannon (Level 1)     |
| `SA3`                      | Tiger Vanquisher (Level 3) |

The selected Level 2 take is excluded because the source caption does not establish the Savage Tiger follow-up command. The OD Knee reference is a separate, explicit-strength demonstration.
