# E. Honda source coverage and review

> Audio update, 12 November 2026: prepared clips now include their original source audio and start muted in the player. Earlier references to silent clips below describe the original source-review pass. Video, annotations and execution revisions are unchanged; see the [restoration record](../content/audio-restoration.json).

Reviewed on 12 November 2026.

This collection now contains **50 references** (27 combos, 19 setups and 4 responses), expanded from 13. It covers practical light/medium/heavy confirms, normal and counter-hit conversions, punish routes, Spirit/Drive/Super use, wall splats, side switches and separate Headbutt, Smash and throw-pressure branches. One focused companion supplies an anti-air reset. The remaining source candidates are explicitly listed in [the extraction ledger](source-ledgers/ehonda.json); this count does not imply complete extraction.

## Sources

- [Joe Ebios: Classic HONDA Combos & Setup Guide POST-PATCH【STREET FIGHTER 6】](https://www.youtube.com/watch?v=-fyURA3Ha94), 2026-03-28 UTC. Provenance and full-recording hash: `content/sources/joe-ebios-ehonda-2026.json`.
- [RyuApprentice: SF6 Honda Guide! How to Convert Your Anti Air into a Mixup Opportunity!](https://www.youtube.com/watch?v=s4MheNxmaiA), 2024-02-22 UTC. Provenance and full-recording hash: `content/sources/ryuapprentice-ehonda-anti-air-2024.json`.

## Interpretation and limits

Every reference is `source-reviewed` with `gameVersion: null`. Source review does not certify current-patch execution. Conditions separate the prerequisite knockdown from the following wake-up interaction; throws, shimmies, reset attempts and reversal baits are not continuous combos. The Ryu DP-bait loops include the actual medium-heavy punish that follows the missed reversal. JP and Ed/Cammy examples in the source limit those ideas rather than establishing universal safety.

Input-history review resolves the source overlay’s generic `28K` into the actual light, medium or heavy Smash for each selected take. The strength of the prerequisite Smash matters too. Charge brackets mean hold before releasing the next direction. Sumo Dash `236K` and its down-punch Lift/follow-up commands retain the source’s command structure. Double Slaps names the light-medium target sequence; the Dash punch follow-ups are Teppo Triple Slap.

The older RyuApprentice recording has no input-history display. Its selected two-action anti-air reset uses the creator’s explicit standing-heavy/OD-Dash narration together with matching animation, gold OD effect and Drive expenditure. Additional follow-up buttons and fixed advantage are not inferred.

## Media and evidence

The full source frame is retained, including the training HUD and input history when the recording shows it. The canonical ingestion helper creates silent H.264 excerpts, zero-based presentation clocks, exact selected JPEGs and timed WebVTT descriptions. Every new selected moment and both prepared boundaries are visually checked; a separate mechanical audit covers full decoding, duration, clock order, image integrity, source mappings and description timing. Originals and audit boards remain local. Public redistribution has not been assessed.

## Reference index

| Reference                                                                                           | Type     | Source        | Original interval |
| --------------------------------------------------------------------------------------------------- | -------- | ------------- | ----------------- |
| `ehonda-low-lights-headbutt` — Low lights into medium Headbutt                                      | combo    | Joe Ebios     | 0:02.65–0:06.25   |
| `ehonda-corner-headbutt-frame-kill-throw` — Corner Headbutt oki: frame kill into throw              | setup    | Joe Ebios     | 0:57.75–1:02.20   |
| `ehonda-lights-medium-smash` — Low lights into medium Sumo Smash                                    | combo    | Joe Ebios     | 1:37.35–1:41.65   |
| `ehonda-smash-jab-kill-oicho` — Sumo Smash oki: jab frame kill into Oicho                           | setup    | Joe Ebios     | 2:31.35–2:35.00   |
| `ehonda-lights-medium-hands` — Low lights into medium Hundred Hand Slap                             | combo    | Joe Ebios     | 2:54.75–2:58.35   |
| `ehonda-lights-rush-lift-smash` — Lights into Rush, Lift and Smash                                  | combo    | Joe Ebios     | 2:58.75–3:05.25   |
| `ehonda-spirit-light-cashout` — Sumo Spirit light confirm into Level 3                              | combo    | Joe Ebios     | 3:23.35–3:39.55   |
| `ehonda-low-medium-double-slaps` — Low medium into Double Slaps and Dash                            | combo    | Joe Ebios     | 6:20.45–6:25.60   |
| `ehonda-medium-rush-lift-smash` — Medium confirm into Rush, Lift and Smash                          | combo    | Joe Ebios     | 6:59.55–7:05.40   |
| `ehonda-counter-medium-headbutt` — Counter-hit medium into crouching medium                         | combo    | Joe Ebios     | 7:31.40–7:36.65   |
| `ehonda-heavy-punish-lift-smash` — Heavy Punish Counter into Lift and Smash                         | combo    | Joe Ebios     | 8:07.05–8:13.00   |
| `ehonda-rush-overhead-lights` — Rush overhead into light conversion                                 | combo    | Joe Ebios     | 12:12.10–12:18.15 |
| `ehonda-corner-counter-di-lift-headbutt` — Corner counter DI into Lift and Headbutt                 | combo    | Joe Ebios     | 23:10.85–23:20.35 |
| `ehonda-depth-headbutt-rush-medium` — Headbutt oki: Rush medium into heavy Headbutt                 | setup    | Joe Ebios     | 0:08.65–0:13.00   |
| `ehonda-depth-headbutt-corner-overhead` — Corner Headbutt oki: frame kill into overhead             | setup    | Joe Ebios     | 0:20.65–0:25.25   |
| `ehonda-depth-headbutt-ryu-dp-bait` — Corner Headbutt oki: make Ryu’s DP miss                       | response | Joe Ebios     | 0:28.55–0:34.55   |
| `ehonda-depth-headbutt-corner-di-reset` — Corner Headbutt oki: light-kick frame kill into DI        | setup    | Joe Ebios     | 0:48.00–0:51.10   |
| `ehonda-depth-headbutt-shimmy` — Corner Headbutt oki: frame kill and shimmy                         | setup    | Joe Ebios     | 1:04.55–1:12.45   |
| `ehonda-depth-headbutt-meaty-medium` — Corner Headbutt oki: meaty medium conversion                 | setup    | Joe Ebios     | 1:15.50–1:22.00   |
| `ehonda-depth-headbutt-blocked-meaty-oicho` — Corner Headbutt oki: blocked medium into Oicho        | setup    | Joe Ebios     | 1:24.60–1:29.10   |
| `ehonda-depth-headbutt-blocked-meaty-low` — Corner Headbutt oki: blocked medium into low lights     | setup    | Joe Ebios     | 1:32.00–1:36.40   |
| `ehonda-depth-smash-meaty-overhead` — Sumo Smash oki: overhead into jab and Smash                   | setup    | Joe Ebios     | 1:49.35–1:53.45   |
| `ehonda-depth-smash-ryu-dp-bait` — Sumo Smash oki: overhead bait against Ryu DP                     | response | Joe Ebios     | 1:56.50–2:02.35   |
| `ehonda-depth-smash-jab-kill-normal-throw` — Sumo Smash oki: jab frame kill into normal throw       | setup    | Joe Ebios     | 2:23.85–2:28.10   |
| `ehonda-depth-smash-jab-kill-shimmy` — Sumo Smash oki: jab frame kill and shimmy                    | setup    | Joe Ebios     | 2:38.05–2:45.20   |
| `ehonda-depth-smash-jab-kill-medium-target` — Sumo Smash oki: jab frame kill into medium and target | setup    | Joe Ebios     | 2:48.00–2:53.45   |
| `ehonda-depth-delayed-smash-overhead-oicho` — Delayed Smash oki: overhead into heavy Oicho          | setup    | Joe Ebios     | 3:18.30–3:22.90   |
| `ehonda-depth-spirit-target-headbutt` — Sumo Spirit target into heavy Hands and Headbutt            | combo    | Joe Ebios     | 5:58.05–6:03.45   |
| `ehonda-depth-pc-jab-medium-smash` — Jab Punish Counter into crouching medium and Smash             | combo    | Joe Ebios     | 6:05.55–6:09.35   |
| `ehonda-depth-pc-jab-heavy-lift-smash` — Jab Punish Counter into heavy-kick Lift juggle             | combo    | Joe Ebios     | 6:11.65–6:16.50   |
| `ehonda-depth-low-medium-jab-smash` — Low medium into jab and Sumo Smash                            | combo    | Joe Ebios     | 6:26.05–6:30.55   |
| `ehonda-depth-spirit-low-od-hands-target` — Sumo Spirit low medium into OD Hands and target         | combo    | Joe Ebios     | 6:34.05–6:40.65   |
| `ehonda-depth-medium-target-slaps` — Standing medium into light-medium target and Teppo Slap        | combo    | Joe Ebios     | 6:47.25–6:52.65   |
| `ehonda-depth-medium-od-hands-lights-smash` — Standing medium into OD Hands, jabs and Smash         | combo    | Joe Ebios     | 6:53.05–6:58.40   |
| `ehonda-depth-medium-double-rush-level-three` — Standing medium double-Rush Level 3 cash-out        | combo    | Joe Ebios     | 7:06.25–7:17.55   |
| `ehonda-depth-pc-medium-heavy-lift` — Medium Punish Counter into heavy and Lift                     | combo    | Joe Ebios     | 7:38.60–7:44.55   |
| `ehonda-depth-pc-medium-headbutt` — Medium Punish Counter into another medium and Headbutt          | combo    | Joe Ebios     | 7:45.35–7:49.55   |
| `ehonda-depth-counter-medium-od-lift` — Counter-hit medium into OD Dash and Lift                    | combo    | Joe Ebios     | 7:50.65–7:55.50   |
| `ehonda-depth-normal-heavy-lift-smash` — Normal-hit heavy punch into Lift and Smash                 | combo    | Joe Ebios     | 8:00.40–8:06.45   |
| `ehonda-depth-pc-heavy-raw-rush-lift` — Heavy Punish Counter into raw Rush and Lift                 | combo    | Joe Ebios     | 8:13.65–8:20.55   |
| `ehonda-depth-heavy-kick-lift-smash` — First heavy-kick hit into Lift and Smash                     | combo    | Joe Ebios     | 8:21.25–8:26.55   |
| `ehonda-depth-forward-throw-rush-low` — Corner forward-throw oki: Rush low                          | setup    | Joe Ebios     | 12:35.60–12:38.60 |
| `ehonda-depth-forward-throw-walk-medium` — Corner forward-throw oki: walk into medium target        | setup    | Joe Ebios     | 12:41.25–12:45.55 |
| `ehonda-depth-back-throw-dash-light-oicho` — Back-throw oki: dash into light Oicho                  | setup    | Joe Ebios     | 12:57.90–13:02.55 |
| `ehonda-depth-back-throw-dash-target` — Back-throw oki: dash into target and Headbutt               | setup    | Joe Ebios     | 13:05.10–13:08.55 |
| `ehonda-depth-back-throw-rush-throw` — Back-throw oki: Rush into another normal throw               | setup    | Joe Ebios     | 13:11.25–13:16.55 |
| `ehonda-depth-wall-splat-heavy-kick-lift` — Blocked-DI wall splat into heavy kick and Lift          | combo    | Joe Ebios     | 23:21.65–23:29.10 |
| `ehonda-depth-drive-reversal-heavy-oicho` — Block Ryu’s Drive Reversal and punish with Oicho        | response | Joe Ebios     | 23:31.55–23:36.65 |
| `ehonda-depth-heavy-kick-side-switch-super` — Heavy-kick side switch into Level 1                   | combo    | Joe Ebios     | 23:51.35–24:01.65 |
| `ehonda-depth-anti-air-od-dash-reset` — Anti-air heavy punch into OD Dash reset                     | response | RyuApprentice | 1:59.65–2:02.10   |
