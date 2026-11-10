# Ingrid source coverage and review

Reviewed on 11 November 2026.

This first collection contains 12 selected references and 38 annotated moments. Each reference has a silent individual replay clip, selected stills and timed action descriptions. It is a curated practice collection, not complete tutorial coverage or current-patch certification.

## Source

[Street Fighter 6 Ingrid Combo Guide! Annotations & Timestamps](https://www.youtube.com/watch?v=1o4EPXASNwg), VesperArcade, 2026-05-30 UTC. Original metadata, chapter outline and recording SHA-256 are retained in `content/sources/vesperarcade-ingrid-2026.json`. Chapters and recipe panels locate candidates; actual action order, hit results, resource displays, state and clip boundaries establish the authored reference.

## Interpretation and limits

The collection separates ordinary Sun Rise confirms, a Level 3 cancel, blocked-DI wall splats, a one-Solar-Crest Sun Flare extension, a crouching-jab Punish Counter, raw Drive Rush and an air-to-air conversion. The medium-punch and back-heavy-punch target-combo follow-ups are separate actions. The one-star Sun Flare spends one Crest; it is not interchangeable with the two-star version. Wall splat is distinct from the later DI Punish Counter chapter. The airborne heavy-kick example lands before the light Sun Rise follow-up and ends in knockdown. The down-three-kicks corner example records that specific command without inventing another teleport branch.

Further multi-Crest routes, Level 2 installs and longer corner extensions remain outside this first collection. No source timing or strength omitted by the guide has been guessed into a reference.

All entries are `source-reviewed` with `gameVersion: null`. None was re-tested in-game on the current patch. Source damage, advantage, safety and matchup behavior remain properties of the dated demonstration; they do not prove universal execution or safety. Longer lessons remain external links.

## Media preparation

The complete 1280×720 source frame is preserved. Accurate lossless excerpts are prepared before the canonical ingestion helper encodes silent H.264 clips, resets playback timestamps to zero, exports selected stills on that clock and writes WebVTT action descriptions. Source intervals and key-moment timestamps use separate clocks. Every selected moment and both clip endpoints are visually checked. Mechanical audits validate full decode, silence, H.264, dimensions, duration, presentation clocks, JPEG integrity, exact descriptions and manifest mappings. Full originals and tooling workfiles stay outside Git. Public redistribution has not been assessed.

## Reference index

| Reference                                                                                   | Type     | Original interval |
| ------------------------------------------------------------------------------------------- | -------- | ----------------- |
| `ingrid-vesper-low-medium-kick` — Low light chain into medium Sun Rise                      | combo    | 0:25.20–0:29.55   |
| `ingrid-vesper-low-od-rise` — Low jabs into OD Sun Rise                                     | combo    | 0:31.60–0:36.55   |
| `ingrid-vesper-medium-target-rise` — Medium-punch target combo into Sun Rise                | combo    | 1:23.80–1:28.40   |
| `ingrid-vesper-crouching-medium-light-rise` — Crouching medium into light kick and Sun Rise | combo    | 1:29.80–1:34.60   |
| `ingrid-vesper-back-medium-jab-rise` — Back medium kick into jab and Sun Rise               | combo    | 1:35.80–1:40.55   |
| `ingrid-vesper-medium-flare-level3` — Standing medium kick into Sun Flare and Level 3       | combo    | 1:42.20–1:48.70   |
| `ingrid-vesper-wall-target-rise` — Wall splat into back-heavy target combo                  | combo    | 2:15.80–2:22.55   |
| `ingrid-vesper-wall-one-crest-juggle` — Wall splat: one-Crest Sun Flare into projectile     | combo    | 2:24.50–2:32.10   |
| `ingrid-vesper-punish-jab-medium-rise` — Punish-counter crouching jab into medium           | combo    | 3:07.10–3:11.60   |
| `ingrid-vesper-rush-low-target-rise` — Drive Rush low into medium target combo              | combo    | 5:34.70–5:39.55   |
| `ingrid-vesper-air-heavy-light-rise` — Air-to-air heavy kick into light Sun Rise            | response | 7:47.10–7:49.65   |
| `ingrid-vesper-corner-down-three-kicks` — Corner down-three-kicks into light Sun Rise       | combo    | 11:22.40–11:26.35 |

## Official move-name cross-check

Names and character-specific resource behavior were checked against [Capcom’s published character introduction](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1830797770231820). The tutorial footage separately establishes the listed command, strength, action order and state.

| Command in this collection | Official move name          |
| -------------------------- | --------------------------- |
| `236LK`                    | Light Sun Rise              |
| `236MK`                    | Medium Sun Rise             |
| `236KK`                    | OD Sun Rise                 |
| `214MP`                    | Medium Sun Flare            |
| `214HP*`                   | One-Crest heavy Sun Flare   |
| `236HP`                    | Heavy Sun Shot              |
| `2KKK`                     | Vanishing Sun (down branch) |
| `SA3`                      | Cosmic Ray (Level 3)        |

The guide’s Solar Crests are officially Sun Crests. Heavy/OD Sun Flare automatically uses up to two; the one-star route requires exactly one starting Crest, visible in the original HUD.
