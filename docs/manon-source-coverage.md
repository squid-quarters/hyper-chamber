# Manon source coverage and review

Reviewed on 10 November 2026.

The Manon collection contains 45 selected references: 16 combos, 25 setups and 4 defensive responses, with 230 annotated moments. Every reference has a silent looping replay, selected stills and timed action descriptions. This is a curated practice collection rather than a complete character guide.

## Sources

- [Joe Ebios: SF6 MANON Fundamentals Guide](https://www.youtube.com/watch?v=-DQtYTEInTA), August 2026. Eighteen selections cover the light confirm, heavy Rond-point knockdown choices, corner frame kills, Renversé and Dégagé pressure, command-grab approaches, reversal baits and a two-Rush Level 3 cash-out.
- [Joe Ebios: Classic MANON Complete Combos & Setup Guide](https://www.youtube.com/watch?v=L4UazTzprJw), August 2026. Twenty-seven selections add reversal-block responses, corner meaty-hit routes, raw Rush conversions, Counter Hit and Punish Counter target combos, jump-in and anti-air medal routes, normal-throw setups, side switches, counter-DI versus blocked wall splat, and Super finishes.

Both creator titles identify a “2026.08.03 update”. Download metadata records UTC upload dates of 14 and 13 August 2026 respectively; some search indexes show the previous calendar day. The source records in `content/sources/` retain those dates, the creator’s version label and original-recording SHA-256 values. Automatically indexed chapters did not establish actions or boundaries; authors inspected actual captions, input history, medal counters, Super spend and hit/block results. Full recordings and extraction workfiles stay outside Git.

## Interpretation and limits

All entries use `verification.status: source-reviewed` and `gameVersion: null`. None has been re-tested in the current game. A dated version label and an advantage displayed in a video are provenance, not current-patch certification.

Manège Doré is the command grab; Renversé is the striking hit grab that can end a damage combo. Normal forward/back throws are separate prerequisite knockdowns and do not build medals. Medal counts in Notes record the visible demonstration, not an inferred minimum requirement. The corner forward-throw Renversé take carries two medals in from an earlier demonstration and finishes at three. The grounded Counter Hit target-kick take also shows two to three; most selected medal routes show one to two. These are not interchangeable starting-state claims.

Setups identify their prerequisite knockdown and spacing in Conditions. Some excerpts isolate only wake-up actions, so the prerequisite combo or throw is not repeated in Inputs. Guarded pressure, command-grab choices, shimmies and jumps after a knockdown are setups rather than uninterrupted damage combos. The heavy Dégagé pressure example is visibly blocked and ends at the source’s −9F; it is not labelled safe pressure. Reversal-block responses are qualified to the demonstrated Ryu or Dee Jay attack, without a universal matchup-safety claim.

Both hits of the selected HP.HP punish-counter target strings connect, with Punish Counter on the first hit. The grounded b.MK.MK Counter Hit and Punish Counter strings also connect with both hits. The anti-air target-kick juggle separately requires the demonstrated delayed follow-up and airborne height. Back heavy punch (`b.HP` / `4HP`) is not standing HP or its target follow-up. Raw Drive Rush and Drive Rush cancel costs remain distinguished.

Independent review found swapped SA1/SA2 captions in the corner OD Rond-point demonstrations around 6:38–6:55. The footage’s Super spend and input history contradict those captions; both takes are omitted. Repeated routes, alternate Super endings, ambiguous continuations and unselected later variations are also omitted. The selected Super examples are identified from the actual demonstrated action and meter spend. New recordings and in-game checks can extend this set while preserving stable reference IDs and recording material execution revisions.

## Media preparation

The canonical ingestion helper encoded the reviewed intervals, removed audio, reset presentation clocks to zero, exported selected stills and wrote WebVTT action descriptions. Short lossless H.264 intermediates avoided decoding the full tutorial for each excerpt. Key-moment times describe the prepared video timeline, not one-frame SF6 simulation stepping. Clip endpoints and every selected still were inspected, including crossfades between takes.

Creator overlays remain visible. `content/media-manon.json` records these assets as private development excerpts. Public redistribution has not been assessed.

## Reference index

### Fundamentals guide

| Reference                                                                                                | Type  | Original interval |
| -------------------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `manon-joe-fundamentals-lights-heavy-wheel` — Two lights into heavy Rond-point                           | combo | 0:00.75–0:04.50   |
| `manon-joe-fundamentals-wheel-dash-walk-grab` — Heavy Rond-point: dash, walk, command grab               | setup | 0:11.05–0:14.15   |
| `manon-joe-fundamentals-wheel-rush-low` — Heavy Rond-point: blocked Rush medium into low                 | setup | 0:31.95–0:35.95   |
| `manon-joe-fundamentals-wheel-rush-heavy` — Heavy Rond-point: blocked Rush medium into heavy             | setup | 0:38.85–0:43.30   |
| `manon-joe-fundamentals-wheel-rush-grab` — Heavy Rond-point: blocked Rush medium into grab               | setup | 0:47.20–0:51.10   |
| `manon-joe-fundamentals-wheel-rush-hit-confirm` — Heavy Rond-point: Rush medium hit confirm              | setup | 1:00.35–1:05.20   |
| `manon-joe-fundamentals-corner-wheel-heavy-grab` — Corner Rond-point: whiff heavy into command grab      | setup | 1:34.55–1:37.90   |
| `manon-joe-fundamentals-corner-wheel-neutral-shimmy` — Corner Rond-point: whiff heavy, stay neutral      | setup | 1:41.40–1:43.85   |
| `manon-joe-fundamentals-corner-wheel-meaty-confirm` — Corner Rond-point: whiff medium, meaty heavy       | setup | 1:58.15–2:02.55   |
| `manon-joe-fundamentals-corner-wheel-meaty-grab` — Corner Rond-point: blocked meaty into grab            | setup | 2:06.65–2:10.15   |
| `manon-joe-fundamentals-renverse-rush-medium` — Renversé: Rush medium into medium Dégagé                 | setup | 2:40.05–2:44.00   |
| `manon-joe-fundamentals-renverse-rush-throw-bait` — Renversé: whiff Rush throw to bait DP                | setup | 3:11.85–3:14.50   |
| `manon-joe-fundamentals-light-degage-rush-low` — Light Dégagé: meaty Rush low confirm                    | setup | 3:17.45–3:22.25   |
| `manon-joe-fundamentals-light-degage-rush-grab` — Light Dégagé: Rush light command grab                  | setup | 3:38.05–3:41.80   |
| `manon-joe-fundamentals-corner-medium-degage-meaty-grab` — Corner medium Dégagé: blocked meaty into grab | setup | 4:06.65–4:10.60   |
| `manon-joe-fundamentals-command-grab-rush-heavy` — Command grab: Rush heavy pressure                     | setup | 4:42.05–4:44.50   |
| `manon-joe-fundamentals-command-grab-rush-jab-bait` — Command grab: whiff Rush jab to bait DP            | setup | 4:47.30–4:49.80   |
| `manon-joe-fundamentals-medium-double-rush-sa3` — Standing medium: double Rush into SA3                  | combo | 5:38.05–5:53.05   |

### Complete guide selections

| Reference                                                                                                              | Type     | Original interval |
| ---------------------------------------------------------------------------------------------------------------------- | -------- | ----------------- |
| `manon-joe-complete-light-degage-rush-low-reversal-block` — Light Dégagé: Rush low, block Drive Reversal               | response | 0:16.60–0:19.95   |
| `manon-joe-complete-light-degage-rush-dp-block` — Light Dégagé: Rush, block OD DP                                      | response | 0:37.55–0:40.50   |
| `manon-joe-complete-corner-medium-degage-meaty-heavy-link` — Corner medium Dégagé: two back heavies                    | setup    | 1:20.55–1:26.15   |
| `manon-joe-complete-corner-medium-degage-whiff-medium-command-grab` — Corner medium Dégagé: whiff medium, command grab | setup    | 1:41.35–1:45.60   |
| `manon-joe-complete-heavy-rond-dash-rush-jab-deejay-level2-block` — Heavy Rond-point: jab, block Dee Jay Level 2       | response | 3:00.40–3:04.75   |
| `manon-joe-complete-corner-heavy-rond-whiff-heavy-low` — Corner heavy Rond-point: frame kill into low                  | setup    | 3:38.50–3:42.35   |
| `manon-joe-complete-crouching-medium-punish-renverse` — Crouching medium punish into medal                             | combo    | 5:16.40–5:21.05   |
| `manon-joe-complete-crouching-medium-punish-od-extension` — Crouching medium punish: OD juggle extension               | combo    | 5:23.75–5:30.80   |
| `manon-joe-complete-standing-medium-rush-target-low` — Standing medium: Rush into kick target combo                    | combo    | 5:37.75–5:42.65   |
| `manon-joe-complete-raw-rush-low-light-degage` — Raw Rush low into light Dégagé                                        | combo    | 6:16.65–6:20.65   |
| `manon-joe-complete-raw-rush-low-level2` — Raw Rush low into Level 2                                                   | combo    | 6:21.55–6:28.55   |
| `manon-joe-complete-anti-air-delayed-target-medal` — Anti-air target kick into a medal                                 | combo    | 6:56.85–7:03.00   |
| `manon-joe-complete-counter-hit-target-light-renverse` — Counter-hit target kicks into light Renversé                  | combo    | 7:04.10–7:09.05   |
| `manon-joe-complete-punish-counter-target-od-low` — Punish-counter target kicks into a low ender                       | combo    | 7:09.85–7:14.85   |
| `manon-joe-complete-jump-heavy-od-renverse-medal` — Jump heavy into an OD Renversé medal route                         | combo    | 7:56.85–8:04.40   |
| `manon-joe-complete-punish-heavy-target-level1` — Heavy target punish into Level 1                                     | combo    | 8:33.15–8:39.45   |
| `manon-joe-complete-punish-heavy-target-side-switch` — Heavy target punish into a side switch                          | setup    | 8:57.85–9:01.70   |
| `manon-joe-complete-punish-sweep-double-dash-grab` — Punish sweep into double-dash command grab                        | setup    | 9:23.15–9:28.05   |
| `manon-joe-complete-punish-slide-sweep` — Punish-counter slide into sweep                                              | combo    | 9:33.20–9:36.90   |
| `manon-joe-complete-forward-throw-rush-low-confirm` — Forward throw into a Rush confirm                                | setup    | 9:59.55–10:04.05  |
| `manon-joe-complete-corner-forward-throw-heavy-medal` — Corner forward throw into a medal confirm                      | setup    | 10:18.65–10:23.35 |
| `manon-joe-complete-corner-back-throw-walk-command-grab` — Corner back throw into light command grab                   | setup    | 10:34.70–10:38.90 |
| `manon-joe-complete-command-grab-heavy-overhead-pressure` — Command grab into heavy overhead pressure                  | setup    | 10:41.85–10:44.10 |
| `manon-joe-complete-counter-di-medal` — Counter DI into a medal                                                        | combo    | 11:19.65–11:27.45 |
| `manon-joe-complete-wall-splat-medal` — Blocked DI wall splat into a medal                                             | combo    | 11:40.35–11:46.05 |
| `manon-joe-complete-anti-air-od-rond-medal` — OD Rond-point anti-air into a medal                                      | combo    | 11:57.85–12:03.20 |
| `manon-joe-complete-heavy-overhead-punish-level3` — Heavy overhead punish into Level 3                                 | response | 12:32.85–12:47.30 |
