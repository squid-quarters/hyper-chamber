# Sagat source coverage and review

> Audio update, 12 November 2026: prepared clips now include their original source audio and start muted in the player. Earlier references to silent clips below describe the original source-review pass. Video, annotations and execution revisions are unchanged; see the [restoration record](../content/audio-restoration.json).

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

## Deep expansion

Reviewed 12 November 2026. The collection contains **52 references and 160 selected moments**. All13 original objects, revisions, related links and media remain unchanged.39 additions contain12 combos,19 setups and eight responses.

[Joe Ebios’s March Update guide](https://www.youtube.com/watch?v=KCw6T5PlLCE) was uploaded2026-04-04 UTC, despite its title. Metadata and recording hash are in `content/sources/joe-ebios-sagat-march-2026.json`; exact dispositions for both recordings are in `docs/source-ledgers/sagat.json`.36 additions use this recording and three use the preserved [VesperArcade recording](https://www.youtube.com/watch?v=0P24l4Nu1FE),2025-08-07 UTC. Sources are separately dated; source review is not current-patch gameplay certification.

The additions include a knee/light-uppercut core, shot/raw-Rush target confirms, first-hit heavy-kick cancels, held heavy uppercuts, neutral Level2 and practical Level1/Level3 spending choices. Setups separate light/medium/heavy-uppercut knockdowns, standing-only Greedy Tiger knockdowns, the meterless whiff-medium-knee approach, corner whiff-LK timing and a forward-throw/blocked-Rush-low throw. Overhead, low, throw, shimmy and strike branches each retain their actual prerequisite. The Mighty Tiger branches use standing advantage on hit and are Pressure without an Oki tag. Setup inputs and cost begin after the prerequisite, while the replay retains context.

Eight responses show the actual j.HP/landing-guard result against Ryu OD Shoryuken, a blocked-OD-DP forward-heavy-kick punish, a shot/Rush grounded anti-air, two back-heavy trade conversions, two forward-heavy-kick anti-airs and an air-to-air OD-knee carry. These use recorded opponent actions, not on-reaction or universal safety claims. The costly trade route starts with six Drive bars, performs one raw Rush and two cancel Rushes, and enters burnout; seven is the nominal sum, not starting-gauge capacity. The carry example starts away from the wall and reaches it for OD-knee extension.

Move properties were cross-checked with [Capcom’s character introduction](https://store.steampowered.com/news/posts/?enddate=1752623274&feed=steam_community_announcements): ordinary High Tiger Shot and Greedy Tiger have standing-target restrictions; held heavy uppercut and the four Level2 follow-ups are distinct choices. Footage establishes actual commands, strengths and selected branches. The neutral Level2 take is not silently replaced by a directional follow-up. Three Level1 takes use **cr.MP → st.HK**, confirmed by the actual kick glyph and animation; the other selected target branches use **cr.MP → st.HP**. Numeric +F captions remain dated advantage observations. Intentional framekills include **(whiff)** in compact/copied notation. The jumping-heavy-punch glyph was fine-checked at113.5; the corner medium-uppercut glyph at400.0 resolves an otherwise generic ender caption.

All39 new clips preserve the full1280×720 source, are silent H264 on a zero clock, and use the canonical media helper for exact selected JPEGs and timed VTT descriptions. Every prepared moment and both original clip endpoints are visually reviewed separately from candidate screening; mechanical audit checks full decode, streams, dimensions, clocks, duration, exact JPEG selection and descriptions. Local originals and author tooling remain outside Git.

This is substantial partial extraction. The ledger leaves large medium/heavy/Rush/DI and directional-Level2 sections unprocessed. The uncaptioned corner-throw shimmy extension and Vesper DP-strength alternatives remain ambiguous. No footage-exhaustion claim is made.

### Appended reference index

| Reference                                                                                                           | Type     | Source interval                            |
| ------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------ |
| `sagat-depth-back-heavy-knee-light-uppercut` — Back heavy punch into heavy knee and light uppercut                  | combo    | joe-ebios-sagat-march-2026 2.00–7.45       |
| `sagat-depth-light-uppercut-rush-overhead` — Light-uppercut knockdown: raw Rush overhead                            | setup    | joe-ebios-sagat-march-2026 7.75–16.30      |
| `sagat-depth-light-uppercut-rush-low` — Light-uppercut knockdown: raw Rush low into knee                            | setup    | joe-ebios-sagat-march-2026 16.65–26.45     |
| `sagat-depth-back-heavy-shot-rush-target` — Back heavy shot confirm: raw Rush target combo and heavy uppercut       | combo    | joe-ebios-sagat-march-2026 26.65–32.65     |
| `sagat-depth-heavy-uppercut-rush-medium` — Heavy-uppercut knockdown: Rush medium into back-heavy juggle             | setup    | joe-ebios-sagat-march-2026 32.80–44.55     |
| `sagat-depth-heavy-uppercut-rush-throw` — Heavy-uppercut knockdown: raw Rush into throw                             | setup    | joe-ebios-sagat-march-2026 57.75–69.00     |
| `sagat-depth-heavy-uppercut-rush-whiff-shimmy` — Heavy-uppercut knockdown: Rush jab whiff into shimmy               | setup    | joe-ebios-sagat-march-2026 69.65–79.65     |
| `sagat-depth-back-heavy-target-level-one` — Back-heavy shot/Rush target combo into Level 1                          | combo    | joe-ebios-sagat-march-2026 80.10–88.45     |
| `sagat-depth-heavy-knee-jump-guard` — Heavy-knee knockdown: jump heavy punch, then guard OD Shoryuken               | response | joe-ebios-sagat-march-2026 108.10–116.35   |
| `sagat-depth-back-heavy-single-kick-held` — Back heavy Rush confirm: one-hit heavy kick into held uppercut          | combo    | joe-ebios-sagat-march-2026 126.10–135.45   |
| `sagat-depth-back-heavy-single-kick-cashout` — Back heavy cash-out: delayed Rush pickup into Level 3                | combo    | joe-ebios-sagat-march-2026 158.15–170.45   |
| `sagat-depth-corner-forward-kick-held` — Corner back heavy: Rush forward heavy kick into held uppercut              | combo    | joe-ebios-sagat-march-2026 209.25–217.55   |
| `sagat-depth-corner-shot-forward-kick` — Corner shot juggle: forward heavy kick into medium uppercut                | combo    | joe-ebios-sagat-march-2026 251.90–257.65   |
| `sagat-depth-corner-forward-kick-level-two` — Corner Rush knee route into neutral Level 2                           | combo    | joe-ebios-sagat-march-2026 225.65–239.40   |
| `sagat-depth-medium-uppercut-rush-light` — Medium-uppercut knockdown: Rush forward light kick                       | setup    | joe-ebios-sagat-march-2026 297.55–305.50   |
| `sagat-depth-greedy-rush-overhead` — Greedy Tiger knockdown: raw Rush overhead                                      | setup    | joe-ebios-sagat-march-2026 314.05–322.50   |
| `sagat-depth-greedy-rush-low` — Greedy Tiger knockdown: raw Rush low into back heavy                                | setup    | joe-ebios-sagat-march-2026 322.65–332.45   |
| `sagat-depth-greedy-rush-throw` — Greedy Tiger knockdown: raw Rush throw                                            | setup    | joe-ebios-sagat-march-2026 332.65–340.45   |
| `sagat-depth-greedy-rush-shimmy` — Greedy Tiger knockdown: raw Rush shimmy                                          | setup    | joe-ebios-sagat-march-2026 340.65–349.30   |
| `sagat-depth-greedy-knee-whiff-throw` — Greedy Tiger knockdown: whiff medium knee into throw                        | setup    | joe-ebios-sagat-march-2026 354.05–362.50   |
| `sagat-depth-greedy-knee-whiff-shimmy` — Greedy Tiger knockdown: whiff medium knee into shimmy                      | setup    | joe-ebios-sagat-march-2026 362.65–371.45   |
| `sagat-depth-greedy-knee-whiff-low` — Greedy Tiger knockdown: whiff knee into low Nexus confirm                     | setup    | joe-ebios-sagat-march-2026 371.65–379.50   |
| `sagat-depth-corner-greedy-light-uppercut` — Corner light Nexus confirm into Greedy Tiger and light uppercut        | combo    | joe-ebios-sagat-march-2026 379.65–385.50   |
| `sagat-depth-corner-uppercut-whiff-light-medium` — Corner light-uppercut knockdown: whiff light kick into medium    | setup    | joe-ebios-sagat-march-2026 392.05–402.55   |
| `sagat-depth-corner-uppercut-whiff-light-throw` — Corner light-uppercut knockdown: whiff light kick and delay throw | setup    | joe-ebios-sagat-march-2026 402.70–411.50   |
| `sagat-depth-corner-uppercut-whiff-light-shimmy` — Corner light-uppercut knockdown: whiff light kick into shimmy    | setup    | joe-ebios-sagat-march-2026 411.70–421.55   |
| `sagat-depth-mighty-standing-throw` — Mighty Tiger standing hit: close throw                                        | setup    | joe-ebios-sagat-march-2026 425.65–433.45   |
| `sagat-depth-mighty-standing-low` — Mighty Tiger standing hit: low-light Nexus follow-up                            | setup    | joe-ebios-sagat-march-2026 433.65–439.45   |
| `sagat-depth-counter-jab-medium-uppercut` — Counter-hit crouching jab into medium and heavy uppercut                | combo    | joe-ebios-sagat-march-2026 439.75–444.50   |
| `sagat-depth-counter-jab-target-level-one` — Counter-hit jab target combo into Level 1                              | combo    | joe-ebios-sagat-march-2026 464.05–470.45   |
| `sagat-depth-punish-jab-back-heavy-knee` — Point-blank jab Punish Counter into back heavy and knee                  | combo    | joe-ebios-sagat-march-2026 484.80–490.45   |
| `sagat-depth-anti-air-back-heavy-shot-rush` — Anti-air back heavy: shot into raw-Rush knee conversion               | response | joe-ebios-sagat-march-2026 1115.05–1122.55 |
| `sagat-depth-anti-air-back-heavy-trade-knee` — Back-heavy anti-air trade: raw-Rush target into heavy knee           | response | joe-ebios-sagat-march-2026 1122.65–1129.20 |
| `sagat-depth-anti-air-trade-burnout-cashout` — Back-heavy anti-air trade: two Rush cancels into Level 3             | response | joe-ebios-sagat-march-2026 1129.65–1141.10 |
| `sagat-depth-corner-throw-rush-low-throw` — Corner throw knockdown: Rush low on block into another throw            | setup    | joe-ebios-sagat-march-2026 1209.65–1217.65 |
| `sagat-depth-anti-air-forward-heavy-level-one` — Anti-air forward heavy kick into Level 1                           | response | vesperarcade-sagat-2025 641.60–646.75      |
| `sagat-depth-anti-air-forward-heavy-rush-held` — Anti-air forward heavy kick: raw Rush into held uppercut           | response | vesperarcade-sagat-2025 656.60–663.70      |
| `sagat-depth-air-to-air-heavy-od-carry` — Air-to-air heavy kick: Rush target into OD-knee carry                     | response | vesperarcade-sagat-2025 687.35–694.65      |
| `sagat-depth-guard-od-dp-forward-heavy-level-one` — Block OD Shoryuken: two forward-heavy kicks into Level 1        | response | joe-ebios-sagat-march-2026 1070.85–1080.45 |
