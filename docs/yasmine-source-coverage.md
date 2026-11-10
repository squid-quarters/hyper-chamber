# Yasmine source coverage and review

Reviewed on 11 November 2026.

This first collection contains 12 selected references and 36 annotated moments. Each reference has a silent individual replay clip, selected stills and timed action descriptions. It is a curated practice collection, not complete tutorial coverage or current-patch certification.

## Source

[Street Fighter 6 Yasmine Combos Guide! Annotations & Timestamps](https://www.youtube.com/watch?v=zclm5B9jVys), VesperArcade, 2026-08-05 UTC. Original metadata, chapter outline and recording SHA-256 are retained in `content/sources/vesperarcade-yasmine-2026.json`. Chapters and recipe panels locate candidates; actual action order, hit results, resource displays, state and clip boundaries establish the authored reference.

## Interpretation and limits

The collection distinguishes ordinary Alon routes from the Bayani-enhanced heavy Alon juggle. The forward-punch Alon continuation is its own follow-up input. The Bayani example begins with the visible powered-state gauge; it must not be substituted for the ordinary heavy Alon take. The light and medium target-combo continuations remain separate steps. A blocked-DI wall splat, a standing-jab Punish Counter and a raw Drive Rush low confirm round out the initial collection.

This selection does not yet cover the source's longer rush-cancel, anti-air or corner-pressure branches. The recording's optional alternative finishers are not silently combined into the selected take.

All entries are `source-reviewed` with `gameVersion: null`. None was re-tested in-game on the current patch. Source damage, advantage, safety and matchup behavior remain properties of the dated demonstration; they do not prove universal execution or safety. Longer lessons remain external links.

## Media preparation

The complete 1280×720 source frame is preserved. Accurate lossless excerpts are prepared before the canonical ingestion helper encodes silent H.264 clips, resets playback timestamps to zero, exports selected stills on that clock and writes WebVTT action descriptions. Source intervals and key-moment timestamps use separate clocks. Every selected moment and both clip endpoints are visually checked. Mechanical audits validate full decode, silence, H.264, dimensions, duration, presentation clocks, JPEG integrity, exact descriptions and manifest mappings. Full originals and tooling workfiles stay outside Git. Public redistribution has not been assessed.

## Reference index

| Reference                                                                                      | Type  | Original interval |
| ---------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `yasmine-vesper-low-light-alon` — Low light confirm into light Daloy and Alon                  | combo | 0:24.80–0:29.55   |
| `yasmine-vesper-double-low-heavy-dp` — Two low kicks into heavy Lipad ng Agila                 | combo | 0:31.20–0:35.60   |
| `yasmine-vesper-low-level1` — Low light chain into Level 1                                     | combo | 0:37.50–0:44.50   |
| `yasmine-vesper-light-target-medium-alon` — Low lights and jab target combo into medium Alon   | combo | 0:46.30–0:51.50   |
| `yasmine-vesper-medium-jab-heavy-dp` — Crouching medium into jab and heavy rising kick         | combo | 1:37.10–1:41.60   |
| `yasmine-vesper-medium-heavy-alon` — Crouching medium into heavy Daloy and Alon                | combo | 1:43.90–1:48.60   |
| `yasmine-vesper-bayani-medium-heavy-juggle` — Bayani heavy Alon into heavy-punch juggle        | combo | 1:50.10–1:57.60   |
| `yasmine-vesper-medium-od-talim-juggle` — Crouching medium into OD Talim and heavy rising kick | combo | 1:59.20–2:04.55   |
| `yasmine-vesper-medium-target-heavy-dp` — Medium-punch target combo into heavy rising kick     | combo | 2:17.30–2:22.50   |
| `yasmine-vesper-wall-heavy-talim` — Wall splat into medium Talim and rising-kick juggle        | combo | 3:58.80–4:05.60   |
| `yasmine-vesper-punish-jab-low-alon` — Punish-counter jab into low medium and Alon             | combo | 4:47.20–4:51.50   |
| `yasmine-vesper-rush-low-heavy-alon` — Drive Rush low into crouching medium and heavy Alon     | combo | 7:17.30–7:22.60   |

## Official move-name cross-check

Names and character-specific resource behavior were checked against [Capcom’s published character introduction](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1835871199302205). The tutorial footage separately establishes the listed command, strength, action order and state.

| Command in this collection | Official move name                   |
| -------------------------- | ------------------------------------ |
| `236LP`                    | Light Daloy ng Tubig                 |
| `236MP`                    | Medium Daloy ng Tubig                |
| `236HP`                    | Heavy Daloy ng Tubig                 |
| `236HP*`                   | Bayani-enhanced heavy Daloy ng Tubig |
| `6P`                       | Alon follow-up                       |
| `214PP`                    | OD Talim ng Hangin                   |
| `214MP`                    | Medium Talim ng Hangin               |
| `623HK`                    | Heavy Lipad ng Agila                 |
| `SA1`                      | Hiwa ng Kalangitan (Level 1)         |
