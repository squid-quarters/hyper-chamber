# Yasmine source coverage and review

> Audio update, 12 November 2026: prepared clips now include their original source audio and start muted in the player. Earlier references to silent clips below describe the original source-review pass. Video, annotations and execution revisions are unchanged; see the [restoration record](../content/audio-restoration.json).

Reviewed on 12 November 2026.

This collection contains 54 references and 162 annotated moments. All 12 original references are preserved unchanged; 42 additions contain 14 combos, 23 setups and five responses. Each reference has a silent individual replay clip, selected stills and timed action descriptions. It is a curated practice collection, not complete tutorial coverage or current-patch certification.

## Source

[Street Fighter 6 Yasmine Combos Guide! Annotations & Timestamps](https://www.youtube.com/watch?v=zclm5B9jVys), VesperArcade, 2026-08-05 UTC. Original metadata, chapter outline and recording SHA-256 are retained in `content/sources/vesperarcade-yasmine-2026.json`. Chapters and recipe panels locate candidates; actual action order, hit results, resource displays, state and clip boundaries establish the authored reference.

## Interpretation and limits

The preserved original selection distinguishes ordinary Alon routes from the Bayani-enhanced heavy Alon juggle. The forward-punch Alon continuation is its own follow-up input. The Bayani example begins with the visible powered-state gauge; it must not be substituted for the ordinary heavy Alon take. The light and medium target-combo continuations remain separate steps. A blocked-DI wall splat, a standing-jab Punish Counter and a raw Drive Rush low confirm round out the initial collection.

The original selection omitted longer Rush, anti-air and corner-pressure branches. The expansion below adds extensive Rush, knockdown and pressure material from a second source. Dedicated grounded anti-air remains unextracted. Optional alternative finishers are not silently combined.

All entries are `source-reviewed` with `gameVersion: null`. None was re-tested in-game on the current patch. Source damage, advantage, safety and matchup behavior remain properties of the dated demonstration; they do not prove universal execution or safety. Longer lessons remain external links.

## Media preparation

The complete 1280×720 source frame is preserved. Accurate lossless excerpts are prepared before the canonical ingestion helper encodes silent H.264 clips, resets playback timestamps to zero, exports selected stills on that clock and writes WebVTT action descriptions. Source intervals and key-moment timestamps use separate clocks. Every selected moment and both clip endpoints are visually checked. Mechanical audits validate full decode, silence, H.264, dimensions, duration, presentation clocks, JPEG integrity, exact descriptions and manifest mappings. Full originals and tooling workfiles stay outside Git. Public redistribution has not been assessed.

## Preserved original reference index

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

## Deep expansion

[Classic YASMINE DAY1 Combos & Setup Guide 【STREET FIGHTER 6】](https://www.youtube.com/watch?v=2oprUYMR4Rk), Joe Ebios, 2026-08-04 UTC. Metadata and original recording hash: `content/sources/joe-ebios-yasmine-2026.json`. Full disposition ledger: `docs/source-ledgers/yasmine.json`. The source was screened throughout; the ledger still marks every unprocessed or excluded gap. This is substantial partial extraction, not a source-exhaustion claim.

The additions separate wake-up oki after medium/heavy Alon, Level 1, Bayani light Alon, forward throw and two different boomerang-covered knockdowns from pressure after standing-hit light Alon and explicitly blocked medium Daloy. Those pressure branches are tagged Pressure, without an Oki tag. Throw, low, overhead, shimmy, blocked pressure and cover-renewal branches have their own demonstrated prerequisites. Setup input sequences begin after those prerequisites, while clips retain context. Numeric +F labels report remaining advantage rather than prescribed waits.

The five responses show a blocked Drive Reversal punish, two resource-distinct OD-Shoryuken punish routes, a late jumping-heavy-kick/guard response to Ryu’s wake-up OD Shoryuken, and a crouching-medium trade conversion after the shown +2F cover setup. They record actual opponent behavior, not universal safety. Counter-DI crumple conversions include a jump-heavy-kick Rush pickup, a side-switch special continuation and a dash/medium-Talim pickup; the duplicate blocked-DI wall-splat route remains excluded because the original library already covers it.

Bayani is an explicit state, not an invented stock count. [Capcom’s introduction](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1835871199302205) explains that connected Alon, Talim and Level 1 can activate it; powered Alon consumes the state, while OD Alon and active Level 2 have different persistence. Footage and input history establish the selected commands and actual powered branches. The ordinary light Alon entries use standing advantage on hit: their combo counter rises and the hit activates Bayani. They are not mislabeled as blocked-string pressure. The same official article describes the range-dependent boomerang Pangil sa Likuran. The references use neutral **22HP/22MP boomerang** labels because the article does not provide their command mapping. These actions are not mislabeled as a Bayani charge or install, and no unsupported stock gain/cost is asserted.

Dedicated grounded anti-air/anti-projectile responses, advanced two-button boomerang routes, later +2F blocked-pressure variations and large parts of the preserved Vesper source remain further extraction opportunities. Source review is not current-patch in-game certification.

### Appended reference index

| Reference                                                                                                            | Type     | Original interval (seconds) |
| -------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------- |
| `yasmine-depth-medium-alon-walk-throw` — Medium Alon knockdown: dash, walk and throw                                 | setup    | 13.40–20.55                 |
| `yasmine-depth-medium-alon-shimmy` — Medium Alon knockdown: dash into a Bayani shimmy punish                         | setup    | 21.20–34.55                 |
| `yasmine-depth-medium-alon-low-bayani` — Medium Alon knockdown: dash low into Bayani light rising kick               | setup    | 35.30–45.35                 |
| `yasmine-depth-light-alon-standing-throw` — Light Alon standing hit: close-range throw                               | setup    | 51.25–57.30                 |
| `yasmine-depth-light-alon-standing-shimmy` — Light Alon standing hit: back away and punish the throw                 | setup    | 57.85–70.35                 |
| `yasmine-depth-light-alon-standing-low-bayani` — Light Alon standing hit: low-light Bayani conversion                | setup    | 70.80–79.65                 |
| `yasmine-depth-low-od-talim-level-one` — Low medium into OD Talim, heavy punch and Level 1                           | combo    | 89.45–97.85                 |
| `yasmine-depth-corner-level-one-dash-throw` — Corner Level 1 knockdown: dash into throw                              | setup    | 113.90–118.55               |
| `yasmine-depth-corner-level-one-shimmy` — Corner Level 1 knockdown: dash back into a Bayani punish                   | setup    | 125.00–136.35               |
| `yasmine-depth-corner-level-one-low` — Corner Level 1 knockdown: dash into low target combo                          | setup    | 143.20–150.15               |
| `yasmine-depth-low-double-od-level-three` — Low cash-out: OD Talim and OD Alon into Level 3                          | combo    | 150.80–167.30               |
| `yasmine-depth-corner-od-talim-cover-throw` — OD Talim knockdown: 22HP cover into throw                              | setup    | 175.20–181.70               |
| `yasmine-depth-corner-od-talim-cover-medium` — OD Talim knockdown: 22HP into blocked medium pressure                 | setup    | 182.30–188.45               |
| `yasmine-depth-blocked-medium-heavy-pressure` — Blocked medium Daloy: heavy into medium Alon pressure                | setup    | 189.25–197.50               |
| `yasmine-depth-blocked-medium-delay-throw` — Blocked medium Daloy: delay into throw                                  | setup    | 198.15–206.65               |
| `yasmine-depth-blocked-medium-shimmy-cover` — Blocked medium Daloy: shimmy into a new 22HP cover                     | setup    | 207.30–222.15               |
| `yasmine-depth-corner-cover-hit-renew` — Corner 22HP cover: medium Alon into renewed cover                           | setup    | 222.20–233.30               |
| `yasmine-depth-low-rush-heavy-alon` — Low Rush confirm into crouching heavy and heavy Alon                           | combo    | 233.65–239.65               |
| `yasmine-depth-heavy-alon-double-dash-throw` — Heavy Alon knockdown: two dashes into delayed throw                   | setup    | 247.15–255.45               |
| `yasmine-depth-heavy-alon-double-dash-shimmy` — Heavy Alon knockdown: two-dash shimmy conversion                     | setup    | 256.10–271.65               |
| `yasmine-depth-heavy-alon-double-dash-meaty` — Heavy Alon knockdown: two dashes into medium pressure                 | setup    | 272.15–282.55               |
| `yasmine-depth-raw-rush-overhead-heavy-alon` — Raw Rush overhead into medium and heavy Alon                          | combo    | 283.45–289.65               |
| `yasmine-depth-low-double-rush-level-three` — Low cash-out: two crouching-heavy Rush extensions                      | combo    | 290.20–306.85               |
| `yasmine-depth-guard-drive-reversal-heavy-alon` — Block Drive Reversal: crouching-medium punish into heavy Alon      | response | 307.65–314.60               |
| `yasmine-depth-heavy-kick-punish-raw-rush` — Punish-counter heavy kick into Rush Talim juggle                        | combo    | 324.15–331.45               |
| `yasmine-depth-od-alon-level-two-second-od` — OD Alon through Level 2 into a second OD Alon                          | combo    | 332.15–344.45               |
| `yasmine-depth-shimmy-heavy-punish-heavy-alon` — Shimmy heavy-punch punish into crouching medium and heavy Alon      | combo    | 345.85–351.45               |
| `yasmine-depth-guard-od-dp-rush-22mp` — Block OD Shoryuken: Rush crouching-heavy 22MP conversion                     | response | 352.25–361.45               |
| `yasmine-depth-guard-od-dp-22mp-cashout` — Block OD Shoryuken: corner 22MP cash-out                                  | response | 362.25–382.45               |
| `yasmine-depth-bayani-light-alon-knockdown` — Bayani light Alon: two jabs into the long knockdown                    | combo    | 417.45–422.25               |
| `yasmine-depth-bayani-light-alon-jump-guard` — Bayani light Alon knockdown: jump heavy kick, then guard OD Shoryuken | response | 422.65–428.65               |
| `yasmine-depth-corner-bayani-alon-overhead` — Corner Bayani Alon knockdown: dash overhead into low target combo      | setup    | 429.25–438.55               |
| `yasmine-depth-bayani-medium-target-heavy-rise` — Bayani medium target combo into heavy-punch rising-kick juggle     | combo    | 445.70–452.35               |
| `yasmine-depth-bayani-heavy-alon-raw-rush` — Bayani heavy Alon: raw Rush Talim extension                             | combo    | 452.75–462.35               |
| `yasmine-depth-corner-22hp-short-throw` — Corner 22HP cover after the Rush route: throw                              | setup    | 473.15–482.45               |
| `yasmine-depth-corner-22hp-trade-confirm` — Corner 22HP pressure: convert the crouching-medium trade                 | response | 554.25–565.00               |
| `yasmine-depth-corner-throw-walk-throw` — Corner throw: dash, walk and throw                                         | setup    | 572.25–578.55               |
| `yasmine-depth-corner-throw-shimmy` — Corner throw: dash shimmy into heavy Alon                                      | setup    | 578.95–586.65               |
| `yasmine-depth-corner-throw-low-target` — Corner throw: dash low target combo into medium Alon                       | setup    | 587.30–594.65               |
| `yasmine-depth-counter-di-air-kick-rush` — Counter DI: jump heavy kick into raw-Rush Talim juggle                    | combo    | 597.45–608.35               |
| `yasmine-depth-counter-di-light-kick-side-switch` — Counter DI: light-kick special continuation switches sides       | combo    | 609.35–618.30               |
| `yasmine-depth-counter-di-dash-medium-talim` — Counter DI: dash into crouching heavy and medium Talim                | combo    | 618.70–628.35               |
