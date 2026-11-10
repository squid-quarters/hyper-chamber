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
