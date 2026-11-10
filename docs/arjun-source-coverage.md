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
