# Zangief source coverage and review

> Audio update, 12 November 2026: prepared clips now include their original source audio and start muted in the player. Earlier references to silent clips below describe the original source-review pass. Video, annotations and execution revisions are unchanged; see the [restoration record](../content/audio-restoration.json).

Reviewed on 12 November 2026.

The collection now contains **62 references** (24 combos, 31 setups and 7 responses), expanded from 12. The original references and media remain unchanged; 50 distinct practice demonstrations have been appended. Each has an individual silent replay, selected moments and timed action descriptions.

## Source and coverage

[SF6 Zangief Fundamentals Guide: The ONLY Combos & Setups You Need(2026.08.03 update)](https://www.youtube.com/watch?v=LsEr6opeOUE), Joe Ebios, 24 August 2026 UTC. Recording and original metadata hashes remain in `content/sources/joe-ebios-zangief-2026.json`. The entire recording was visually surveyed; selected actions, input strengths, relevant HUD state and cut boundaries received finer review. The exact selected/reused intervals and unprocessed gaps are recorded in [the source ledger](source-ledgers/zangief.json). Screening is not complete extraction or a claim that every source frame has been execution-reviewed.

The additions include the close OD-Lariat low-light confirm; separate strike/throw/shimmy trees after normal and OD Lariat; light-string reset, reversal and jump-read branches; normal and punish-counter forward-throw oki; heavy-SPD Rush follow-ups; actual blocked Drive Reversal punishment; counter-DI and blocked-DI wall routes; held-Level-2 air-throw/Level-1 alternatives; and three distinct stun punishes. Corner position is the starting position, while the resulting knockdown is recorded separately.

## Interpretation and limits

All entries are `source-reviewed` with `gameVersion: null`. No current-patch in-game execution test was performed. Printed `+F` values are source-reported advantage, not invented delay instructions. Actual delays remain unquantified. Intentional crouching-medium frame kills explicitly contain `(whiff)` in compact/copied notation.

Setup input sequences start after their prerequisite knockdown; clips retain a brief recovery context before the first authored action. Conditions specify the exact ender, forward-held Lariat spacing and normal-versus-punish-counter throw state. Additional Drive spend is separate from the prerequisite. Medium, heavy and light SPD inputs are resolved from the recording rather than treating all strengths as interchangeable.

The jump-medium example shows landing guard against Manon Level 1, and three approaches show guarding Ryu OD Shoryuken. These are recorded matchup results, not universal safe-jump or reversal coverage. Level 1 catches of Ryu's defensive jump occur after reset gaps; they are reads, not guaranteed jab/throw combos. Where the overlay lists SA2 or SA3, only the demonstrated SA3 has been authored. The back-jump stun route lands before its normal Lariat; it does not perform an air Lariat.

A separate 2024 Baldy anti-air candidate was screened in the 52–150 and 213–301 second windows. It did not yield an unambiguous additional complete command/strength/success demonstration. Its unscreened remainder and ambiguous tests remain explicit in the ledger, rather than being labeled source-reviewed from captions or glow. No broad grounded-Lariat anti-air or dedicated carry lesson is claimed. Trade duplicates, repeated prerequisite knockdowns and a dash-only advantage illustration are not counted as extra references.

## Media review

Complete source frames retain the training HUD and input history. Accurate original-clock cuts are encoded as silent H.264 loops with zero-based playback, JPEG moments and WebVTT descriptions. Every new selected moment and both prepared endpoints are visually checked. The mechanical audit checks full decode, clocks, duration, silence, image integrity, exact caption timing/text, source-manifest mappings and orphan inventory. Originals and QA tooling remain local. Public redistribution has not been assessed.

## Reference index

| Reference                                                                                        | Type     | Original interval |
| ------------------------------------------------------------------------------------------------ | -------- | ----------------- |
| `zangief-low-lights-rush-lariat` — Low lights into Rush and Lariat                               | combo    | 1:44.95–1:50.20   |
| `zangief-headbutt-hellstab-lariat` — Headbutt into Hellstab and Lariat                           | combo    | 3:47.10–3:51.90   |
| `zangief-headbutt-od-lariat` — Headbutt into OD Lariat                                           | combo    | 3:52.00–3:56.75   |
| `zangief-headbutt-rush-level-three` — Headbutt conversion into Level 3                           | combo    | 3:57.15–4:12.45   |
| `zangief-rush-medium-target` — Drive Rush medium target combo                                    | combo    | 3:42.15–3:46.75   |
| `zangief-dp-punish-wheel-kick` — Blocked uppercut: Wheel Kick punish                             | combo    | 4:20.50–4:26.35   |
| `zangief-corner-wheel-kick-air-throw` — Corner punish into OD air throw                          | combo    | 4:27.20–4:36.65   |
| `zangief-counter-di-headbutt` — Counter Drive Impact into Headbutt                               | combo    | 7:05.25–7:11.95   |
| `zangief-wall-splat-od-air-throw` — Wall splat into OD Lariat and air throw                      | combo    | 7:39.15–7:47.70   |
| `zangief-held-level-two-lariat` — Held Level 2 into dash and Lariat                              | combo    | 7:48.80–7:57.55   |
| `zangief-od-lariat-blocked-headbutt-grab` — OD Lariat oki: blocked Headbutt into SPD             | setup    | 0:13.80–0:22.30   |
| `zangief-forward-throw-dash-hellstab` — Forward throw oki: dash into Hellstab                    | setup    | 4:53.00–5:00.35   |
| `zangief-depth-low-lights-od-lariat` — Low light confirm into close OD Lariat                    | combo    | 0:00.55–0:04.85   |
| `zangief-depth-od-lariat-blocked-headbutt-strike` — OD Lariat: blocked Rush Headbutt into strike | setup    | 0:08.10–0:12.65   |
| `zangief-depth-od-lariat-meaty-headbutts` — OD Lariat: Rush meaty into two Headbutts             | setup    | 0:25.25–0:31.10   |
| `zangief-depth-od-lariat-rush-low` — OD Lariat: Rush low into Lariat                             | setup    | 0:34.15–0:38.75   |
| `zangief-depth-od-lariat-jump-medium` — OD Lariat: jumping medium into Hellstab                  | setup    | 0:42.10–0:46.15   |
| `zangief-depth-od-lariat-jump-block-manon` — OD Lariat: jump medium and block Manon Level 1      | response | 0:49.15–0:53.60   |
| `zangief-depth-od-lariat-rush-medium-spd` — OD Lariat: raw Rush into medium SPD                  | setup    | 0:56.50–1:02.15   |
| `zangief-depth-od-lariat-rush-forward-throw` — OD Lariat: raw Rush into forward throw            | setup    | 1:05.10–1:09.60   |
| `zangief-depth-od-lariat-rush-block-dp` — OD Lariat: Rush and block Ryu OD DP                    | response | 1:12.70–1:16.15   |
| `zangief-depth-corner-od-lariat-walk-headbutt` — Corner OD Lariat: walk into Headbutt conversion | setup    | 1:19.10–1:23.75   |
| `zangief-depth-corner-od-lariat-walk-heavy-spd` — Corner OD Lariat: walk into heavy SPD          | setup    | 1:27.10–1:32.15   |
| `zangief-depth-corner-od-lariat-shimmy` — Corner OD Lariat: shimmy into OD air throw             | setup    | 1:35.10–1:44.65   |
| `zangief-depth-lariat-rush-target-combo` — Normal Lariat: Rush into medium target combo          | setup    | 1:54.45–1:59.45   |
| `zangief-depth-lariat-rush-sweep` — Normal Lariat: raw Rush into sweep                           | setup    | 2:03.00–2:06.90   |
| `zangief-depth-lariat-rush-light-spd` — Normal Lariat: raw Rush into light SPD                   | setup    | 2:11.15–2:16.20   |
| `zangief-depth-corner-lariat-walk-headbutt` — Corner normal Lariat: walk into Headbutt           | setup    | 2:19.75–2:24.75   |
| `zangief-depth-corner-lariat-heavy-spd` — Corner normal Lariat: walk into heavy SPD              | setup    | 2:28.85–2:34.15   |
| `zangief-depth-corner-lariat-shimmy` — Corner normal Lariat: shimmy into OD air throw            | setup    | 2:38.10–2:46.70   |
| `zangief-depth-rush-jab-reset-headbutt` — Rush jab reset into Headbutt                           | setup    | 2:47.60–2:53.40   |
| `zangief-depth-rush-jab-reset-heavy-spd` — Rush jab reset into delayed heavy SPD                 | setup    | 2:59.55–3:05.65   |
| `zangief-depth-rush-jab-reset-block-dp` — Rush jab reset: block Ryu OD DP                        | response | 3:06.25–3:10.85   |
| `zangief-depth-rush-jab-reset-level-one-jump` — Rush jab reset: Level 1 catches the jump         | response | 3:11.55–3:19.50   |
| `zangief-depth-low-two-rush-cashout` — Low starter: two Rush cancels into burnout                | combo    | 3:20.25–3:26.70   |
| `zangief-depth-low-rush-od-level-three` — Low starter: OD Lariat into Level 3                    | combo    | 3:27.35–3:40.85   |
| `zangief-depth-drive-reversal-heavy-spd` — Block Drive Reversal into heavy SPD                   | response | 4:13.25–4:19.20   |
| `zangief-depth-corner-shimmy-od-air-throw` — Corner throw-whiff punish into OD air throw         | combo    | 4:37.30–4:47.55   |
| `zangief-depth-forward-throw-dash-medium-spd` — Forward throw: dash into delayed medium SPD      | setup    | 5:03.10–5:08.20   |
| `zangief-depth-forward-throw-rush-headbutts` — Forward throw: Rush into two Headbutts            | setup    | 5:11.25–5:17.15   |
| `zangief-depth-forward-throw-rush-throw` — Forward throw: raw Rush into another forward throw    | setup    | 5:20.30–5:25.00   |
| `zangief-depth-forward-throw-rush-heavy-spd` — Forward throw: raw Rush into heavy SPD            | setup    | 5:28.10–5:33.20   |
| `zangief-depth-forward-throw-rush-block-dp` — Forward throw: Rush and block Ryu OD DP            | response | 5:36.30–5:40.10   |
| `zangief-depth-pc-forward-throw-headbutt` — Punish-counter throw: walk into Headbutt             | setup    | 5:42.75–5:47.75   |
| `zangief-depth-pc-forward-throw-heavy-spd` — Punish-counter throw: walk into heavy SPD           | setup    | 5:50.75–5:56.15   |
| `zangief-depth-pc-forward-throw-shimmy-spd` — Punish-counter throw: shimmy into heavy SPD        | setup    | 5:59.25–6:05.15   |
| `zangief-depth-spd-rush-sweep` — Heavy SPD: raw Rush into sweep                                  | setup    | 6:10.10–6:14.10   |
| `zangief-depth-spd-rush-wheel-kick` — Heavy SPD: raw Rush into Wheel Kick                        | setup    | 6:18.00–6:22.10   |
| `zangief-depth-spd-rush-light-low-confirm` — Heavy SPD: Rush light kick into low conversion      | setup    | 6:26.10–6:32.10   |
| `zangief-depth-spd-blocked-light-heavy-spd` — Heavy SPD: blocked Rush light into command grab    | setup    | 6:36.00–6:42.15   |
| `zangief-depth-spd-throw-whiff-level-one` — Heavy SPD: throw whiff into Level 1 jump catch       | response | 6:46.10–6:54.10   |
| `zangief-depth-spd-rush-od-running-grab` — Heavy SPD: raw Rush into OD running grab              | setup    | 6:58.10–7:03.15   |
| `zangief-depth-counter-di-od-lariat` — Counter-DI: Headbutt into OD Lariat                       | combo    | 7:13.05–7:21.10   |
| `zangief-depth-corner-counter-di-air-throw` — Corner counter-DI: walk Hellstab into OD air throw | combo    | 7:22.05–7:33.10   |
| `zangief-depth-wall-splat-normal-lariat` — Blocked-DI wall crush into normal Lariat              | combo    | 7:33.75–7:38.65   |
| `zangief-depth-held-level-two-air-throw` — Held Level 2: dash Hellstab into OD air throw         | combo    | 7:59.10–8:10.15   |
| `zangief-depth-held-level-two-level-one` — Held Level 2: dash Hellstab into Level 1              | combo    | 8:10.65–8:22.65   |
| `zangief-depth-corner-level-two-air-throw` — Corner held Level 2: medium-kill OD air throw       | combo    | 8:23.10–8:35.15   |
| `zangief-depth-corner-level-two-level-one` — Corner held Level 2: medium kill into Level 1       | combo    | 8:36.10–8:49.15   |
| `zangief-depth-stun-back-jump-air-throw` — Stun: back-jump spacing into OD air throw             | combo    | 8:52.65–9:02.65   |
| `zangief-depth-stun-jump-level-three` — Stun: neutral-jump heavy into Level 3                    | combo    | 9:04.65–9:19.10   |
| `zangief-depth-stun-rush-level-three` — Stun: Rush extension into Level 3                        | combo    | 9:22.65–9:38.90   |
