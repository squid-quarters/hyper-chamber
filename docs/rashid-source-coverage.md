# Rashid source coverage and review

Reviewed on 12 November 2026.

The collection contains **52 references** (17 combos, 28 setups and 7 responses), expanded from 12. New material adds medium-Mixer and medium-Eagle-Spike wake-up trees, throw baits, defender-specific reversal interactions, wind-enhanced conversions and Ysaar pressure/pickups. [The extraction ledger](source-ledgers/rashid.json) records selected intervals and all unselected source gaps. Several surveyed branches remain unprocessed; whole-source extraction is incomplete.

## Sources

- [Orang: SF6 RASHID COMBO GUIDE // Bread n' Butter Combos](https://www.youtube.com/watch?v=ozUcaHUQWKs), 2023-07-25 UTC. Recording provenance: `content/sources/orang-rashid-2023.json`.
- [4shika / Yoshika: 【スト６】これ一本でラシードの起き攻めを完全マスター！中イーグル・スパイク、セットプレイ集！！！【ストリートファイター6/SF6】](https://www.youtube.com/watch?v=OIPIa0D9Hoc), 2024-08-23 UTC. Recording provenance: `content/sources/yoshika-rashid-eagle-spike-oki-2024.json`.
- [4shika / Yoshika: 【スト６】ラシード使いは絶対に覚えたい！SA2の使い方を解説！入門講座第2弾【ストリートファイター6/SF6/イウサール/初心者】](https://www.youtube.com/watch?v=phybdiHvjjo), 2024-07-18 UTC. Recording provenance: `content/sources/yoshika-rashid-ysaar-2024.json`.

## Source interpretation and limits

These are dated 2023/2024 demonstrations, marked `source-reviewed` with `gameVersion: null`. Source action order, live input history, strengths, selected moments and loop boundaries are reviewed; current-patch execution is not tested in-game. One Orang text recipe calls a standing-heavy-punch continuation, while the recorded command and animation are standing heavy kick; the new reference follows the actual kick.

The medium-Spike creator added an explicit warning that the **24 September 2024 update made Cyclone-meaty wake-up pressure Perfect-Parry punishable**. Those raw Cyclone-meaty families are excluded. Cyclone used inside an already-confirmed combo is a separate case. None of the remaining oki is certified against the current patch or every defender option.

A setup begins after its named prerequisite knockdown. Intentional frame-kill whiffs remain in compact input notation. Source-reported `+F` describes remaining advantage; it never becomes an invented wait count. Blocked pressure followed by a counter hit or throw is annotated as separate interactions. The Wing-Stroke jump response only demonstrates landing to block Luke OD Rising Uppercut; Ed SA1, OD DP and SA3 responses retain their exact recorded matchup limits. The Ysaar spacing check shows Luke’s regular DP **whiff**, rather than block it. No manual walk-guard timing is inferred from that take. Its exact regular strength is not resolved by the P1-only input display; no OD reversal is claimed for that response.

Ysaar activation and already-active tornado pickups have separate resource labels. The corner counter-DI cash-out shows Critical Art at low health and three OD spends, reaching Burnout; expenditures throughout a regenerating DI exchange are not a seven-bar starting-meter requirement. Charged and unheld Whirlwind, medium/heavy Eagle Spike, air/ground OD Spike and distinct Cyclone follow-ups stay separate.

## Media and remaining work

Silent H.264 loops preserve the full original training frame, selected JPEG moments and timed WebVTT descriptions. Every new moment and both prepared endpoints are visually inspected, followed by the mechanical decode/timing/caption/mapping audit. Original recordings and QA boards remain local; public redistribution has not been assessed.

The source ledger retains unprocessed long left/right corner branches, aerial/two-touch conversions, alternate medium-Spike pressure and advanced wind juggles. Dedicated anti-projectile and broader anti-air/defensive coverage remain gaps; the old anti-air reference is preserved, not duplicated to inflate the count.

## Reference index

| Reference                                                                                                     | Type     | Source           | Original interval |
| ------------------------------------------------------------------------------------------------------------- | -------- | ---------------- | ----------------- |
| `rashid-low-lights-mixer` — Low kick and jabs into light Mixer                                                | combo    | Orang            | 0:06.20–0:08.35   |
| `rashid-crouching-jabs-mixer` — Three crouching jabs into light Mixer                                         | combo    | Orang            | 0:08.65–0:11.20   |
| `rashid-target-od-shot-rush-roll` — Target combo into OD Whirlwind Shot and Rush juggle                       | combo    | Orang            | 0:26.10–0:30.95   |
| `rashid-low-rush-od-cyclone-eagle` — Low medium into Rush and OD Cyclone                                      | combo    | Orang            | 0:32.85–0:37.40   |
| `rashid-crouching-medium-rush-air-finish` — Crouching medium Rush confirm into airborne heavy kick            | combo    | Orang            | 0:37.35–0:41.90   |
| `rashid-heavy-rush-eagle` — Heavy punch Rush confirm into medium Eagle Spike                                  | combo    | Orang            | 1:14.35–1:17.90   |
| `rashid-anti-air-heavy-mixer` — Anti-air heavy kick into medium Mixer                                         | response | Orang            | 1:18.30–1:20.95   |
| `rashid-counter-di-corner-escape` — Corner counter DI: run through the crumple                                | combo    | Orang            | 1:50.65–1:57.10   |
| `rashid-counter-di-jump-heavy-roll` — Midscreen counter DI into jump heavy and roll kick                      | combo    | Orang            | 2:00.65–2:05.95   |
| `rashid-wall-splat-heavy-roll` — Blocked DI wall splat into heavy kick and roll kick                          | combo    | Orang            | 2:07.65–2:12.00   |
| `rashid-corner-heavy-punish-level-one` — Corner heavy punish through OD specials into Level 1                 | combo    | Orang            | 2:34.90–2:44.45   |
| `rashid-midscreen-heavy-punish-cashout` — Midscreen crouching-heavy punish into Level 3                       | combo    | Orang            | 2:45.15–3:00.35   |
| `rashid-depth-counter-hit-jab-wing` — Counter-hit jab into Wing Stroke air finish                             | combo    | Orang            | 0:11.75–0:15.35   |
| `rashid-depth-block-deejay-od-dp` — Block Dee Jay OD Jackknife into Level 1 punish                            | response | Orang            | 0:15.40–0:25.25   |
| `rashid-depth-mixer-rush-overhead-block` — Medium Mixer: Rush overhead pressure                               | setup    | Orang            | 1:26.65–1:29.55   |
| `rashid-depth-mixer-rush-forward-kick-block` — Medium Mixer: Rush forward-heavy-kick pressure                 | setup    | Orang            | 1:31.10–1:34.20   |
| `rashid-depth-mixer-forward-kick-counter-confirm` — Medium Mixer: blocked Rush kick into counter-hit confirm  | setup    | Orang            | 1:35.45–1:39.70   |
| `rashid-depth-mixer-overhead-jab-counter-confirm` — Medium Mixer: blocked Rush overhead into counter-hit jab  | setup    | Orang            | 1:42.75–1:47.50   |
| `rashid-depth-wing-knockdown-jump-block-luke` — Air-heavy knockdown: jump medium and block Luke OD DP         | response | Orang            | 1:39.70–1:41.70   |
| `rashid-depth-corner-counter-di-level-three` — Corner counter-DI into three-OD Critical Art route             | combo    | Orang            | 2:14.55–2:32.60   |
| `rashid-depth-wind-pc-spike-level-two-one` — Wind-enhanced punish-counter Spike into Level 2 and Level 1      | combo    | Orang            | 3:01.05–3:17.15   |
| `rashid-depth-corner-stun-charged-whirl-level-three` — Corner stun: charged Whirlwind into Level 3            | combo    | Orang            | 3:18.25–3:37.25   |
| `rashid-depth-eagle-dash-front-flip` — Medium Spike: dash into Front Flip                                     | setup    | 4shika / Yoshika | 0:22.70–0:25.40   |
| `rashid-depth-eagle-jab-flip-throw` — Medium Spike: jab kill, Front Flip and throw                            | setup    | 4shika / Yoshika | 0:47.20–0:50.75   |
| `rashid-depth-eagle-jab-flip-block-ed-sa1` — Medium Spike: jab-and-Flip timing blocks Ed Level 1              | response | 4shika / Yoshika | 0:53.20–0:57.65   |
| `rashid-depth-eagle-charged-whirl-meaty` — Medium Spike: charged heavy Whirlwind on wake-up                   | setup    | 4shika / Yoshika | 1:12.00–1:15.05   |
| `rashid-depth-eagle-medium-kick-overhead-confirm` — Medium Spike: medium-kick kill into overhead confirm      | setup    | 4shika / Yoshika | 1:52.00–1:56.40   |
| `rashid-depth-eagle-low-kill-front-flip` — Medium Spike: low-kick kill into Front Flip                        | setup    | 4shika / Yoshika | 2:12.00–2:13.75   |
| `rashid-depth-eagle-low-heavy-shimmy` — Medium Spike: low-and-heavy kills into throw bait                     | setup    | 4shika / Yoshika | 2:41.70–2:46.35   |
| `rashid-depth-eagle-low-kill-di` — Corner medium Spike: low frame kill into DI                                | setup    | 4shika / Yoshika | 3:45.80–3:49.75   |
| `rashid-depth-eagle-double-medium-meaty-confirm` — Medium Spike: two medium kills into meaty-medium juggle    | setup    | 4shika / Yoshika | 3:56.65–4:01.75   |
| `rashid-depth-eagle-medium-kill-whirl` — Medium Spike: medium kill into heavy Whirlwind                       | setup    | 4shika / Yoshika | 4:05.00–4:07.95   |
| `rashid-depth-eagle-dash-rush-overhead-confirm` — Medium Spike: dash and Rush overhead conversion             | setup    | 4shika / Yoshika | 5:20.00–5:25.20   |
| `rashid-depth-eagle-heavy-kill-rush-flip-punish` — Medium Spike: heavy kill and Rush Flip into punish         | setup    | 4shika / Yoshika | 5:40.75–5:46.20   |
| `rashid-depth-eagle-jump-cross-under` — Medium Spike: jump cross-under and landing-medium whiff               | setup    | 4shika / Yoshika | 6:24.00–6:27.40   |
| `rashid-depth-eagle-dash-low-kill-medium-confirm` — Medium Spike: dash and low kill into meaty medium         | setup    | 4shika / Yoshika | 6:41.20–6:45.80   |
| `rashid-depth-eagle-dash-rush-medium-space-trap` — Medium Spike: Rush medium space trap                       | setup    | 4shika / Yoshika | 6:56.20–7:00.65   |
| `rashid-depth-eagle-dash-rush-block-ed-dp` — Medium Spike: dash and Rush blocks Ed OD DP                      | response | 4shika / Yoshika | 7:04.00–7:08.60   |
| `rashid-depth-eagle-dash-light-kill-forward-kick` — Medium Spike: dash and light-kick kill into forward heavy | setup    | 4shika / Yoshika | 7:16.00–7:19.80   |
| `rashid-depth-eagle-dash-light-kill-overhead` — Medium Spike: dash and light-kick kill into overhead          | setup    | 4shika / Yoshika | 8:01.00–8:04.20   |
| `rashid-depth-eagle-double-dash-rush-jab-confirm` — Medium Spike: two dashes and Rush jab confirm             | setup    | 4shika / Yoshika | 8:13.40–8:17.90   |
| `rashid-depth-eagle-double-dash-jab-block-ed-sa3` — Medium Spike: two dashes and Rush jab blocks Ed Level 3   | response | 4shika / Yoshika | 8:28.00–8:32.75   |
| `rashid-depth-eagle-double-dash-rush-throw` — Medium Spike: two dashes and Rush throw                         | setup    | 4shika / Yoshika | 9:02.00–9:06.00   |
| `rashid-depth-eagle-double-dash-rush-medium-kick` — Medium Spike: two dashes and Rush medium-kick confirm     | setup    | 4shika / Yoshika | 9:10.00–9:13.75   |
| `rashid-depth-eagle-sweep-kill-rush-jab-space-trap` — Medium Spike: sweep kill and Rush-jab space trap        | setup    | 4shika / Yoshika | 9:34.00–9:39.90   |
| `rashid-depth-eagle-sweep-low-kill-jab-heavy-spike` — Medium Spike: sweep and low kills into jab confirm      | setup    | 4shika / Yoshika | 9:48.00–9:53.50   |
| `rashid-depth-ysaar-mixer-dash-throw` — Medium Mixer: Ysaar, dash and throw                                   | setup    | 4shika / Yoshika | 1:16.45–1:22.20   |
| `rashid-depth-ysaar-walk-guard-luke-dp-whiff` — Ysaar: Luke uppercut spacing check                            | response | 4shika / Yoshika | 1:59.95–2:01.85   |
| `rashid-depth-ysaar-overhead-throw` — Ysaar: overhead hit into separate throw                                 | setup    | 4shika / Yoshika | 2:11.40–2:16.90   |
| `rashid-depth-ysaar-light-mixer-pressure-throw` — Active Ysaar: three light Mixers into throw                 | setup    | 4shika / Yoshika | 2:30.75–2:38.75   |
| `rashid-depth-ysaar-heavy-kick-light-spike` — Active Ysaar launch: heavy kick into light Spike                | combo    | 4shika / Yoshika | 3:15.90–3:19.75   |
| `rashid-depth-ysaar-corner-heavy-kick-heavy-mixer` — Active Ysaar corner launch: heavy kick into heavy Mixer  | combo    | 4shika / Yoshika | 3:21.20–3:26.90   |
