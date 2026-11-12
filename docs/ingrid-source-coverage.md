# Ingrid source coverage and review

> Audio update, 12 November 2026: prepared clips now include their original source audio and start muted in the player. Earlier references to silent clips below describe the original source-review pass. Video, annotations and execution revisions are unchanged; see the [restoration record](../content/audio-restoration.json).

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

## Deep expansion

Reviewed 12 November 2026. The library now contains **49 references and 172 selected moments**. All 12 original objects, IDs, revisions, related links, source identity, manifest entries and media bytes remain exact. The additions contain 17 setups, 15 combos and 5 responses.

[Joe Ebios’s Classic Ingrid guide](https://www.youtube.com/watch?v=-4PaFZp7KI4), published 2026-05-29 UTC, supplies the knockdown pressure, held-Level-2 rain branches, Crest conversions and counter-DI exchanges. [VesperArcade’s annotated guide](https://www.youtube.com/watch?v=1o4EPXASNwg), 2026-05-30 UTC, supplies two actual grounded anti-air demonstrations in addition to the 12 preserved references. Source/metadata hashes and a complete non-overlapping source-clock disposition partition are in `docs/source-ledgers/ingrid.json`.

Knockdown setups distinguish medium Sun Rise from the Rush-cancel/heavy-Sun-Rise/light-Sun-Flare storage prerequisite. They show raw-Rush or meterless dash/walk throws, throw-bait shimmies, heavy-kick pressure, a Rush overhead, low confirms and a corner crouching-low whiff into overhead. Prerequisite commands/costs are separate from performed follow-ups. Intentional whiffs appear in compact/copied inputs. Printed +F overlays report advantage; no numerical wait is invented.

Five post-block rain setups keep the actually held heavy- or light-punch Level 2, recorded starting Crests, normal or back throw, shimmy, light-Flare refill and subsequent OD pickup. Their enders distinguish forward Vanishing Sun from repeated heavy **Sun Shot** projectiles and light/medium Sun Rise. These are demonstrated pressure branches, without universal frame-trap, gap or reversal-safety claims. The two left-corner back-throw demonstrations explicitly start with Ingrid’s back near the wall.

Conversions include the six-Drive/Level-3 cash-out, back-medium heavy target into storage, medium target into storage or two-Crest OD/down teleport, crouching-low Rush confirm, crouching-target-only medium links, normal versus Counter-Hit heavy kick, heavy-punch PC with meterless or raw-Rush pickup, heavy-Flare two-Crest juggles, the heavy-Rise air-normal/grounded-OD/forward-teleport extension and the short walking forward-heavy pickup. Starting stock and the actual spend/refill come from the live HUD. Intermediate Crest changes during an animation are not used to invent a different cost.

Responses show two actual incoming-jump interceptions with grounded back-heavy target chains and three recorded opening-jab/counter-DI conversions. The separate blocked-heavy/DI setup requires Ryu to be **already in Burnout**, starts at the shown near-corner Midscreen spacing and ends in wall stun. It is not labeled counter-DI or ordinary wall crush. The full-resource light confirm alone receives Cash-out; Super use alone does not.

[Capcom’s official Ingrid introduction](https://steamcommunity.com/games/1364780/announcements/detail/1830797770231820) explains Sun Crests, storage, enhanced Flare/Burst, Sun Shot, Sun Rise, Vanishing Sun and strength/hold-dependent Level-2 rain. Actual footage establishes the performed commands, strengths, stock state, target condition and result. A separate printed Level-1 candidate remains excluded because its intermediate Crest interpretation is unresolved. The library does not claim Level 1 grants a Crest.

Full-frame silent H264 loops use a zero playback clock. Selected JPEGs and canonical timed descriptions come from the ingestion helper. Every selected prepared moment and both original/generated boundaries receive visual review; mechanical checks cover full decode, clock/duration, exact stills, VTT, manifest mapping and baseline preservation. All additions are `source-reviewed`, `gameVersion: null`; none has current-patch gameplay certification. Originals and tooling remain local, outside Git.

This is substantial partial extraction. Both full recordings were surveyed, while most Vesper alternatives and Joe’s remaining air/corner/Super/raw-Rush/DI variants are explicitly unprocessed for extraction. The disposition ledger also names duplicates, excluded title/end cards and unresolved routes. Source availability is not exhausted.

### Appended reference index

| Reference                                                                                                          | Type     | Source interval                        |
| ------------------------------------------------------------------------------------------------------------------ | -------- | -------------------------------------- |
| `ingrid-depth-medium-rise-rush-throw` — Medium Sun Rise: Rush into wake-up throw                                   | setup    | joe-ebios-ingrid-2026 10.65–14.65      |
| `ingrid-depth-medium-rise-rush-shimmy` — Medium Sun Rise: Rush shimmy into heavy-kick conversion                   | setup    | joe-ebios-ingrid-2026 18.25–24.20      |
| `ingrid-depth-medium-rise-rush-overhead` — Medium Sun Rise: Rush overhead into medium target                       | setup    | joe-ebios-ingrid-2026 28.10–32.85      |
| `ingrid-depth-medium-rise-rush-heavy-kick` — Medium Sun Rise: Rush heavy kick into medium target                   | setup    | joe-ebios-ingrid-2026 37.15–42.60      |
| `ingrid-depth-medium-rise-dash-walk-throw` — Medium Sun Rise: dash, walk and throw                                 | setup    | joe-ebios-ingrid-2026 46.55–50.65      |
| `ingrid-depth-medium-rise-dash-walk-shimmy` — Medium Sun Rise: dash-walk shimmy conversion                         | setup    | joe-ebios-ingrid-2026 54.55–60.50      |
| `ingrid-depth-medium-rise-dash-walk-low` — Medium Sun Rise: dash-walk crouching low                                | setup    | joe-ebios-ingrid-2026 63.85–68.25      |
| `ingrid-depth-corner-medium-rise-whiff-low-overhead` — Corner Sun Rise: whiff low into overhead                    | setup    | joe-ebios-ingrid-2026 72.15–77.15      |
| `ingrid-depth-stored-flare-dash-throw` — Stored Sun Flare knockdown: dash into throw                               | setup    | joe-ebios-ingrid-2026 150.45–154.55    |
| `ingrid-depth-stored-flare-dash-shimmy` — Stored Sun Flare knockdown: dash shimmy conversion                       | setup    | joe-ebios-ingrid-2026 159.50–165.35    |
| `ingrid-depth-stored-flare-dash-low` — Stored Sun Flare knockdown: dash into crouching low                         | setup    | joe-ebios-ingrid-2026 169.45–173.65    |
| `ingrid-depth-heavy-rain-throw-refill` — Heavy Level-2 rain: throw, refill and OD pickup                           | setup    | joe-ebios-ingrid-2026 600.05–611.95    |
| `ingrid-depth-corner-heavy-rain-throw-uppercuts` — Corner heavy rain: throw into repeated heavy pickups            | setup    | joe-ebios-ingrid-2026 612.65–625.55    |
| `ingrid-depth-heavy-rain-shimmy-refill` — Heavy Level-2 rain: shimmy heavy kick and refill                         | setup    | joe-ebios-ingrid-2026 626.20–638.60    |
| `ingrid-depth-corner-light-rain-back-throw-forward-teleport` — Light Level-2 rain: back throw and forward teleport | setup    | joe-ebios-ingrid-2026 639.65–650.55    |
| `ingrid-depth-corner-light-rain-back-throw-heavy-pickups` — Light Level-2 rain: back throw and heavy pickups       | setup    | joe-ebios-ingrid-2026 651.65–663.65    |
| `ingrid-depth-anti-air-back-heavy-medium-rise` — Grounded anti-air: back-heavy target into medium Sun Rise         | response | vesperarcade-ingrid-2026 478.65–482.95 |
| `ingrid-depth-anti-air-back-heavy-crest-rush` — Grounded anti-air: Crested Flare and Rush forward heavy            | response | vesperarcade-ingrid-2026 484.75–490.80 |
| `ingrid-depth-lights-double-rush-level-three-cashout` — Light confirm: two Rush cancels into Level 3               | combo    | joe-ebios-ingrid-2026 78.35–94.95      |
| `ingrid-depth-back-medium-heavy-store-crest` — Back-medium target: heavy punch and Crest storage                   | combo    | joe-ebios-ingrid-2026 98.15–101.95     |
| `ingrid-depth-medium-target-flare-store` — Medium target: medium Flare and Crest storage                           | combo    | joe-ebios-ingrid-2026 108.25–112.25    |
| `ingrid-depth-medium-target-od-down-teleport` — Medium target: two-Crest OD Flare and down teleport                | combo    | joe-ebios-ingrid-2026 113.10–119.55    |
| `ingrid-depth-low-medium-rush-heavy-target` — Crouching medium kick: Rush heavy-kick target conversion             | combo    | joe-ebios-ingrid-2026 175.25–181.60    |
| `ingrid-depth-crouching-medium-crouching-target` — Crouching-target confirm: medium punch into target chain        | combo    | joe-ebios-ingrid-2026 188.25–193.55    |
| `ingrid-depth-crouching-medium-rush-store` — Crouching medium: Rush heavy Rise and Crest storage                   | combo    | joe-ebios-ingrid-2026 194.75–200.15    |
| `ingrid-depth-crouching-medium-two-crest-heavy-flare` — Crouching medium: two-Crest heavy-Flare juggle             | combo    | joe-ebios-ingrid-2026 201.50–209.15    |
| `ingrid-depth-crouching-medium-air-od-forward-teleport` — Crouching medium: heavy-Rise air normal and OD pickup    | combo    | joe-ebios-ingrid-2026 218.25–226.45    |
| `ingrid-depth-heavy-kick-light-links` — Normal-hit heavy kick: light links into medium Sun Rise                    | combo    | joe-ebios-ingrid-2026 286.95–292.05    |
| `ingrid-depth-heavy-kick-counter-medium-target` — Counter-Hit heavy kick: medium target conversion                 | combo    | joe-ebios-ingrid-2026 293.45–298.70    |
| `ingrid-depth-heavy-punish-forward-heavy-flare` — Heavy-punch punish: forward heavy into medium Flare              | combo    | joe-ebios-ingrid-2026 300.05–304.35    |
| `ingrid-depth-heavy-punish-raw-rush-store` — Heavy-punch punish: raw Rush heavy and Crest storage                  | combo    | joe-ebios-ingrid-2026 313.85–319.85    |
| `ingrid-depth-crouching-heavy-flare-store` — Crouching heavy: medium Flare and Crest storage                       | combo    | joe-ebios-ingrid-2026 350.55–354.15    |
| `ingrid-depth-forward-heavy-two-crest-walk-pickup` — Forward heavy: two-Crest Flare and walking pickup             | combo    | joe-ebios-ingrid-2026 378.25–383.35    |
| `ingrid-depth-burnout-blocked-heavy-di-stun` — Burnout pressure: blocked crouching heavy into DI stun              | setup    | joe-ebios-ingrid-2026 361.70–366.95    |
| `ingrid-depth-counter-di-back-heavy-store` — Counter DI: back-heavy target and Crest storage                       | response | joe-ebios-ingrid-2026 494.10–502.05    |
| `ingrid-depth-counter-di-two-crest-teleport` — Counter DI: two-Crest heavy Flare and forward teleport              | response | joe-ebios-ingrid-2026 503.15–512.45    |
| `ingrid-depth-counter-di-forward-heavy-crest` — Counter DI: forward-heavy two-Crest juggle                         | response | joe-ebios-ingrid-2026 523.15–532.15    |
