# Arjun source coverage and review

Reviewed on 11 November 2026.

This first collection contains 13 selected references and 51 annotated moments. Each reference has a silent individual replay clip, selected stills and timed action descriptions. It is a curated practice collection, not complete tutorial coverage or current-patch certification.

## Source

[アルジュンの立ち回りから必須コンボまで！アルジュンの使い方解説【スト6】](https://www.youtube.com/watch?v=dBag9IiElmU), 煌月ソウル【スト6解説】, 2026-10-18 UTC. Original metadata, chapter outline and recording SHA-256 are retained in `content/sources/soul-arjun-2026.json`. Chapters and recipe panels locate candidates; actual action order, hit results, resource displays, state and clip boundaries establish the authored reference.

## Interpretation and limits

The source is a Japanese Classic-controls guide with printed numpad recipes, live input history, a button display, training frame meter and hit/resource HUD. The initial collection separates standing and crouching light links, ordinary and OD Arm of Justice, the special punch continuation, ordinary light Cruel Shoulder, raw and cancel Drive Rush, a two-cancel Level 3 cash-out and a blocked-DI Breathing Ring juggle. The ring route specifically uses the medium-punch shockwave branch.

The source also demonstrates blocked strings, failed challenges, counter-DI answers and post-combo pillar placement. Those demonstrations are not presented as clean combo hits. The Perfect Parry reference explicitly includes that defensive prerequisite and its damage scaling. Ordinary Cruel Shoulder routes require no active Divine Pillar because an existing pillar changes the move into Justice Beyond. Longer pillar setplay, command throws and Super branches remain outside this first collection. The Arm continuation is written as forward plus punch: the source shows that separate follow-up action with punch shortcuts rather than another strength-selected special.

All entries are `source-reviewed` with `gameVersion: null`. None was re-tested in-game on the current patch. Source damage, advantage, safety and matchup behavior remain properties of the dated demonstration; they do not prove universal execution or safety. Longer lessons remain external links.

## Media preparation

The complete 1280×720 source frame is preserved. Accurate lossless excerpts are prepared before the canonical ingestion helper encodes silent H.264 clips, resets playback timestamps to zero, exports selected stills on that clock and writes WebVTT action descriptions. Source intervals and key-moment timestamps use separate clocks. Every selected moment and both clip endpoints are visually checked. Mechanical audits validate full decode, silence, H.264, dimensions, duration, presentation clocks, JPEG integrity, exact descriptions and manifest mappings. Full originals and tooling workfiles stay outside Git. Public redistribution has not been assessed.

## Reference index

| Reference                                                                                            | Type  | Original interval |
| ---------------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `arjun-soul-jab-chain-light-arm` — Standing jab into crouching jab and light Arm of Justice          | combo | 6:49.18–6:51.00   |
| `arjun-soul-light-kick-light-arm` — Standing light kick into light Arm of Justice                    | combo | 7:12.70–7:14.70   |
| `arjun-soul-medium-od-arm-follow` — Standing medium into OD Arm and follow-up                        | combo | 7:31.05–7:34.35   |
| `arjun-soul-medium-light-arm` — Standing medium punch into light Arm of Justice                      | combo | 7:49.65–7:51.60   |
| `arjun-soul-medium-kick-light-shoulder` — Standing medium kick into light Cruel Shoulder             | combo | 8:02.30–8:04.80   |
| `arjun-soul-crouching-heavy-od-arm` — Crouching heavy punch into OD Arm and follow-up                | combo | 8:12.00–8:15.80   |
| `arjun-soul-rush-medium-kick-shoulder` — Drive Rush medium punch into medium kick and shoulder       | combo | 8:25.30–8:28.85   |
| `arjun-soul-rush-low-medium-shoulder` — Drive Rush low medium into standing medium kick and shoulder | combo | 8:34.80–8:38.30   |
| `arjun-soul-cancel-rush-medium-shoulder` — Medium confirm through cancel Rush into shoulder          | combo | 8:56.55–9:00.85   |
| `arjun-soul-double-cancel-level3` — Two Rush cancels into heavy Arm and Level 3                      | combo | 9:05.35–9:19.65   |
| `arjun-soul-wall-ring-arm-follow` — Wall splat through Breathing Ring into light Arm                 | combo | 9:31.08–9:37.50   |
| `arjun-soul-punish-medium-heavy-arm` — Punish-counter medium punch into heavy Arm and follow-up      | combo | 11:21.18–11:25.20 |
| `arjun-soul-perfect-parry-low-shoulder` — Perfect-parry low punish into medium kick and shoulder     | combo | 11:31.35–11:35.70 |

## Official move-name cross-check

Names and character-specific resource behavior were checked against [Capcom’s published character introduction](https://steamstore-a.akamaihd.net/news/externalpost/steam_community_announcements/1842846814454209). The tutorial footage separately establishes the listed command, strength, action order and state.

| Command in this collection | Official move name         |
| -------------------------- | -------------------------- |
| `236LP`                    | Light Arm of Justice       |
| `236HP`                    | Heavy Arm of Justice       |
| `236PP`                    | OD Arm of Justice          |
| `6P`                       | Arm of Justice follow-up   |
| `623LP`                    | Light Cruel Shoulder       |
| `236LK`                    | Light Breathing Ring       |
| `6MP`                      | Medium Breathing Shockwave |
| `SA3`                      | Yaksha’s Order (Level 3)   |

## Deep expansion

Reviewed 12 November 2026. The library contains **46 references and 176 selected moments**. All 13 original objects, IDs, revisions, related links, original source, manifest entries and media bytes remain exact. The additions contain 33 references: 20 combos, 10 setups and 3 responses.

[The retained annotated guide](https://www.youtube.com/watch?v=dBag9IiElmU), published 18 October 2026 UTC by 煌月ソウル【スト6解説】, supplies the knockdown/Pillar pressure and recorded defenses. [MC MuraFGC’s combo and setup guide](https://www.youtube.com/watch?v=YLaJEsawNpU), 13 October 2026 UTC, adds low/light confirms, normal and target conversions, conditional links, a complete light-to-Rush-cancel command grab, a heavy-kick PC/Pillar/stance route and Super branches. Verified recording/metadata hashes and complete non-overlapping source-clock dispositions are in `docs/source-ledgers/arjun.json`.

The source captions are locators. One comma-separated caption lists alternate specials rather than a performed multi-special chain. The light-to-command-grab recording visibly starts with crouching light kick, crouching jab and standing jab before a **three-bar Rush cancel**, Rush jab and light command grab. The Counter-Hit low/medium route continues through its heavy-kick target into Level 1. These actual actions override the abbreviated captions. Two other Rush-caption candidates remain unresolved and are excluded from this expansion.

The setups add corner dash/throw and raw-Rush medium pressure; OD-Pillar command throw or failed-grab/Pillar-hit light-Shoulder/stance contingency after Justice Beyond; meterless light-Pillar/jab/heavy-Arm pressure; heavy-Pillar/Shoulder cover; a held-stance/Moral-Breakdown/Level-2 extension; a whiffed medium Shoulder beside a guarded Pillar, followed by the recorded parry-punish command throw; and held-Pillar overhead blocked/hit branches with the actual light-Shoulder pickup. The prerequisites and prior costs are stated separately. All four OD Pillar steps preserve the performed kick pair. The missed-grab contingency performs light Shoulder, automatic Pillar club, held heavy-kick stance and neutral heavy-punch Moral Breakdown; the other Soul stance route also uses neutral HP. A repeated truncated Pillar/Shoulder prefix was removed, and four successful confirms stop before unlisted failed or blocked extra specials. Held buttons are explicit; source +F overlays are remaining advantage, not numerical delay commands.

Justice Beyond automatically grabs and swings the **Pillar** after Shoulder contact. It is not a command grab on the defender. Blocked Pillar/Shoulder takes remain pressure demonstrations. Ghastly Interrogation is the separate half-circle-back punch grab; its damage interaction with existing recoverable health is not a stock or install requirement. No fixed damage guarantee is inferred.

Two actual grounded anti-airs intercept Luke’s shown front/far jumps using crouching heavy punch or standing heavy kick. The source’s failed cross-up/late-Shoulder examples remain explicit limitations. The corner raw-Rush/standing-jab-whiff feint guards the recorded **Ryu OD uppercut**, without an added punish or universal reversal-safety claim. A different OD-Pillar/command-throw attempt loses to Ryu’s OD uppercut and is excluded from success claims.

[Capcom’s official character guide](https://www.youtube.com/watch?v=6l9RFvk3fec), 1 October 2026 UTC, supplies primary on-screen English naming/mechanics context. Its automatic captions contain game voices, so the embedded text and animations were reviewed directly. It supplies no selected practice excerpt here. Actual independent-guide inputs, starting HUD, hit/block results and the selected source interval govern every authored recipe.

Canonical silent full-frame H264 loops have a zero playback clock, exact selected JPEGs and matching timed descriptions. Every final selected moment and both original/generated endpoints receive visual review. Mechanical checks cover clock/duration, full decode, exact stills, VTT, asset inventory, manifest mapping and baseline preservation. All additions are `source-reviewed`, with `gameVersion: null`; none is certified on the current gameplay patch. Originals and authoring evidence remain local.

This is substantial partial extraction. The retained guide still has neutral, Arm/Ring pressure, projectile defense, Pillar/stance, DI/PC and high-damage alternatives. MC Mura has more Pillar/Rush-overhead, parry, reversal and Super branches requiring exact command review. The ledger lists these unprocessed families and all intervening unselected intervals. Source availability is not exhausted, and Super use alone has not been tagged Cash-out.

### Appended reference index

| Reference                                                                                                               | Type     | Source interval                     |
| ----------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------- |
| `arjun-depth-low-three-lights-arm` — Low confirm: crouching kick and two jabs                                           | combo    | mc-murafgc-arjun-2026 26.45–28.80   |
| `arjun-depth-low-medium-jab-arm` — Crouching medium kick: jab into light Arm                                            | combo    | mc-murafgc-arjun-2026 32.50–33.95   |
| `arjun-depth-medium-kick-medium-arm` — Medium kick: medium Arm ender                                                    | combo    | mc-murafgc-arjun-2026 36.35–38.85   |
| `arjun-depth-medium-kick-od-pillar` — Medium kick: OD Pillar knockdown                                                  | combo    | mc-murafgc-arjun-2026 44.40–47.40   |
| `arjun-depth-medium-target-level-one` — Medium-kick target into Level 1                                                 | combo    | mc-murafgc-arjun-2026 47.90–52.80   |
| `arjun-depth-medium-pillar` — Standing medium: medium Pillar knockdown                                                  | combo    | mc-murafgc-arjun-2026 66.10–69.15   |
| `arjun-depth-medium-od-shoulder` — Standing medium: OD Shoulder launch                                                  | combo    | mc-murafgc-arjun-2026 69.90–72.45   |
| `arjun-depth-heavy-target-kick-knockdown` — Heavy target: two punches and kick knockdown                                | combo    | mc-murafgc-arjun-2026 72.70–75.35   |
| `arjun-depth-triple-heavy-level-three` — Three-punch target into Level 3                                                | combo    | mc-murafgc-arjun-2026 75.45–88.08   |
| `arjun-depth-heavy-kick-punch-target` — Heavy-kick target into heavy punch                                              | combo    | mc-murafgc-arjun-2026 88.15–91.30   |
| `arjun-depth-crouching-heavy-medium-shoulder` — Crouching heavy: medium Shoulder ender                                  | combo    | mc-murafgc-arjun-2026 91.40–94.50   |
| `arjun-depth-rush-jab-command-grab` — Lights into Rush-cancel jab and command grab                                      | combo    | mc-murafgc-arjun-2026 105.55–111.80 |
| `arjun-depth-medium-rush-heavy-arm` — Medium confirm: Rush crouching heavy into heavy Arm                               | combo    | mc-murafgc-arjun-2026 124.10–127.10 |
| `arjun-depth-counter-jab-medium-shoulder` — Counter-Hit crouching jab: medium kick and light Shoulder                   | combo    | mc-murafgc-arjun-2026 145.00–148.85 |
| `arjun-depth-counter-jab-light-kick-arm` — Counter-Hit jab: light-kick link and light Arm                               | combo    | mc-murafgc-arjun-2026 149.30–151.10 |
| `arjun-depth-counter-low-medium-shoulder` — Counter-Hit low: medium target into Level 1                                 | combo    | mc-murafgc-arjun-2026 152.55–157.50 |
| `arjun-depth-counter-heavy-heavy-arm` — Counter-Hit crouching heavy into heavy Arm                                      | combo    | mc-murafgc-arjun-2026 157.75–160.10 |
| `arjun-depth-counter-medium-arm-level-one` — Counter-Hit medium Arm into linked Level 1                                 | combo    | mc-murafgc-arjun-2026 161.65–166.30 |
| `arjun-depth-punish-low-medium-link` — Punish-Counter low: crouching medium-punch link                                  | combo    | mc-murafgc-arjun-2026 169.60–171.75 |
| `arjun-depth-punish-heavy-rush-pillar-stance` — Heavy-kick punish: raw Rush, Pillar and held stance                     | combo    | mc-murafgc-arjun-2026 179.00–186.15 |
| `arjun-depth-corner-throw-dash-throw` — Corner forward throw: dash and throw again                                      | setup    | soul-arjun-2026 881.10–883.70       |
| `arjun-depth-corner-throw-rush-medium` — Corner forward throw: Rush medium and OD Arm                                   | setup    | soul-arjun-2026 898.25–902.95       |
| `arjun-depth-justice-od-pillar-command-throw` — Justice Beyond knockdown: OD Pillar and command throw                   | setup    | soul-arjun-2026 927.00–932.70       |
| `arjun-depth-justice-od-pillar-hit-confirm` — Justice Beyond knockdown: missed grab into Pillar-hit Shoulder and stance | setup    | soul-arjun-2026 938.05–944.35       |
| `arjun-depth-justice-light-pillar-low-arm` — Justice Beyond knockdown: light Pillar, jab and heavy Arm                  | setup    | soul-arjun-2026 949.25–951.80       |
| `arjun-depth-arm-heavy-pillar-heavy-shoulder` — Arm knockdown: heavy Pillar into heavy Shoulder                         | setup    | soul-arjun-2026 960.15–964.45       |
| `arjun-depth-arm-pillar-held-stance-level-two` — Arm knockdown: Pillar grab and held stance into Level 2                | setup    | soul-arjun-2026 971.30–981.30       |
| `arjun-depth-arm-pillar-medium-shoulder-parry-grab` — Pillar guard: whiffed Shoulder and parry-punish grab              | setup    | soul-arjun-2026 988.30–995.50       |
| `arjun-depth-held-pillar-forward-heavy-pressure` — Held Pillar: forward-heavy and crouching-heavy pressure              | setup    | soul-arjun-2026 1001.65–1005.10     |
| `arjun-depth-held-pillar-overhead-hit-pickup` — Held Pillar: overhead hit and light Shoulder pickup                     | setup    | soul-arjun-2026 1006.75–1013.25     |
| `arjun-depth-anti-air-crouching-heavy` — Grounded anti-air: crouching heavy punch                                       | response | soul-arjun-2026 193.30–195.25       |
| `arjun-depth-anti-air-standing-heavy-kick` — Grounded anti-air: far standing heavy kick                                 | response | soul-arjun-2026 206.55–208.85       |
| `arjun-depth-corner-throw-rush-feint-od-uppercut` — Corner throw: Rush jab feint and OD-uppercut guard                  | response | soul-arjun-2026 915.50–918.85       |
