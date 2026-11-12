# Cammy source coverage and review

> Audio update, 12 November 2026: prepared clips now include their original source audio and start muted in the player. Earlier references to silent clips below describe the original source-review pass. Video, annotations and execution revisions are unchanged; see the [restoration record](../content/audio-restoration.json).

Reviewed on 12 November 2026. The collection contains **73 references** (15 preserved, 58 added): 29 combos, 35 setups and 9 responses, with 307 selected moments. The additions contribute 244 moments. All original objects, revisions, related links and media are preserved.

## Sources and provenance

- [Joe Ebios: SF6 CAMMY Beginner Guide: The ONLY Combos & Setups You Need](https://www.youtube.com/watch?v=B6ceWgQ2t3Q), published 2026-07-01 UTC; 332 seconds. Source key: `joe-ebios-cammy-beginner-2026`. Recording SHA-256: `20e4a8e646c1ce00828e8274120f463e896bbf5a948ea26a1bad8323240a3130`.
- [Joe Ebios: Classic CAMMY Combos & Setup Guide IN-DEPTH【STREET FIGHTER 6】](https://www.youtube.com/watch?v=XIZbb7en5RQ), published 2026-06-29 UTC; 1094 seconds. Source key: `joe-ebios-cammy-indepth-june-2026`. Recording SHA-256: `3f245a273a9e208b17e2664ccaaebd25de59115da4432a23d5630b60ae247888`.
- [dillyVerde: Cammy Anti-Air Combo](https://www.youtube.com/watch?v=20mUS0SJhK0), published 2024-04-14 UTC; 19 seconds. Source key: `dillyverde-cammy-anti-air-2024`. Recording SHA-256: `85810bc61a62c75ac9f0b208eb6e7f5fbbbd363203b42a4bc16dcd8397a4f665`.

The July starter and June companion remain separately identified and dated. The full-guide source record preserves the YouTube ID, creator, UTC timestamp date, reported upload-date field, chapters, full recording hash and exact downloaded-metadata hash. Original starter metadata is unchanged. The 2024 short anti-air replay is a verified candidate only: exact follow-up strengths are unestablished, so it contributes no authored recipe or media.

## Practical coverage

Normal light, low, medium and heavy confirms now sit alongside standing-only launch routes, forced-standing links, cross-up light kick, Lift/air-Strike conversions, heavy-target knockdowns, intentional Knuckle side switches, counter-hit jab links, blocked-DP and Drive-Reversal punishes, DI crumple/counter-DI/wall-splat routes, observed carry, and distinct one-, two- and three-stock choices.

Practical follow-ups cover medium-Arrow midscreen dash throw/shimmy/strike/low/reversal-block branches; corner low-kick and back-medium timing whiffs; heavy-Arrow dash choices; air-Strike dash choices; target-Arrow raw-Rush throw/shimmy/Counter-Hit strike; corner Hooligan kick hit, blocked-kick throw/shimmy, empty-landing DP bait and delayed command throw; heavy-target Hooligan slide pressure and downward-kick reset; corner forward-throw strike/throw/shimmy; and midscreen Punish-Counter-sweep dive-kick throw/shimmy/strike branches.

Responses include actual blocks against the displayed Ryu Drive Reversal and OD Shoryuken, two separate safe-jump knockdowns tested against that recorded OD DP, empty-Hooligan DP bait, the preserved throw-whiff response, and an actual air-to-air medium into airborne Level 2 and subsequent Rush juggle. The air-to-air card is explicitly tagged `Anti-air` and `Air-to-air`; it is not described as a grounded anti-air.

## Interpretation and limits

Every addition is `source-reviewed` with `gameVersion: null`; no current-patch in-game execution is claimed. Defender responses, range, standing-only links and Counter Hit/Punish Counter requirements are stated where observed. Source captions listing “any” or several enders do not establish every alternative as an extracted route.

`214P` is Quick Spin Knuckle; `236P` is Hooligan Combination. OD Knuckle and OD Hooligan have separate commands and costs. The Hooligan command throw is distinct from a normal ground throw. Heavy Knuckle that passes under the launcher intentionally whiffs; `(whiff)` appears directly in compact notation. Hooligan slide/kick pressure after an initial launch is identified as a reset when the hit counter restarts, not a continuous combo.

A printed `+F` result is remaining advantage, not an invented wait instruction. Explicit captioned delays remain qualitative and tied to the recorded spacing. Setup inputs and resource spend start after the named prerequisite; the earlier low-Rush cancel cost is separate. Several setup excerpts retain the prerequisite's last hit/recovery so the full first dash or timing whiff is visible.

`Corner` describes starting position. The heavy-link DP-punish take starts midscreen despite the overlay's corner timing note; its observed travel receives `Corner carry`. Super use alone is not a Cash-out goal: one- and two-stock choices remain stock choices, while full-spend light conversion, air-to-air two-Super conversion and OD command-throw Level 3 carry that explicit tag.

## Extraction disposition ledger

[The machine ledger](source-ledgers/cammy.json) includes exact authored intervals plus the full companion's source-family inventory. `covered` denotes performed extraction; `duplicate` identifies a selected equivalent decision; `excluded` marks bare timing, transitions or failed-response counterexamples; `ambiguous` records unestablished commands; and `unprocessed` means detailed extraction remains pending. Family locators can overlap exact rows and do not add reference counts.

All six supplied full-guide chapters and all 21 discovery pages were inspected. Their generic chapter names are discovery metadata, not gameplay annotations. Detailed source/action review covers the authored intervals and listed probes. The library is deep, not exhaustive: the remaining alternatives below are explicit, with no claim that useful footage is exhausted.

| Source                              | Locator           | Remaining family                                                    |
| ----------------------------------- | ----------------- | ------------------------------------------------------------------- |
| `joe-ebios-cammy-beginner-2026`     | 1:22.00–1:44.10   | Corner medium-Arrow back-medium-whiff throw and shimmy alternatives |
| `joe-ebios-cammy-beginner-2026`     | 2:55.85–3:04.10   | Low Rush/held-Arrow corner timing illustration                      |
| `joe-ebios-cammy-indepth-june-2026` | 0:32.00–0:38.00   | Medium-Arrow medium into target/medium Arrow                        |
| `joe-ebios-cammy-indepth-june-2026` | 0:38.00–0:45.00   | Medium-Arrow walk-low 2LP/LK variant                                |
| `joe-ebios-cammy-indepth-june-2026` | 0:45.00–0:55.00   | Medium-Arrow dash/walk Counter-Hit heavy vs fuzzy mash              |
| `joe-ebios-cammy-indepth-june-2026` | 1:18.00–1:27.00   | Corner low-kick delayed-heavy Counter-Hit fuzzy-mash conversion     |
| `joe-ebios-cammy-indepth-june-2026` | 1:27.00–1:33.00   | Corner low-kick delayed low with 2LP/LK links                       |
| `joe-ebios-cammy-indepth-june-2026` | 1:54.00–2:02.00   | Back-medium frame-kill throw                                        |
| `joe-ebios-cammy-indepth-june-2026` | 2:02.00–2:10.00   | Back-medium frame-kill shimmy                                       |
| `joe-ebios-cammy-indepth-june-2026` | 3:08.00–3:15.00   | Air-Strike dash/walk low-light confirm                              |
| `joe-ebios-cammy-indepth-june-2026` | 3:51.00–4:00.00   | Heavy-Arrow delayed-heavy fuzzy-mash conversion                     |
| `joe-ebios-cammy-indepth-june-2026` | 4:00.00–4:07.00   | Heavy-Arrow walk-low 2LP/LK variant                                 |
| `joe-ebios-cammy-indepth-june-2026` | 4:11.00–4:18.00   | Heavy-Arrow standing-LK delayed throw                               |
| `joe-ebios-cammy-indepth-june-2026` | 4:18.00–4:28.00   | Heavy-Arrow standing-LK shimmy                                      |
| `joe-ebios-cammy-indepth-june-2026` | 4:28.00–4:31.00   | Heavy-Arrow standing-LK heavy vs Drive Reversal                     |
| `joe-ebios-cammy-indepth-june-2026` | 4:31.00–4:40.00   | Heavy-Arrow standing-LK heavy-target strike                         |
| `joe-ebios-cammy-indepth-june-2026` | 4:40.00–4:48.00   | Heavy-Arrow standing-LK delayed-heavy fuzzy mash                    |
| `joe-ebios-cammy-indepth-june-2026` | 4:48.00–4:54.00   | Heavy-Arrow standing-LK delayed low                                 |
| `joe-ebios-cammy-indepth-june-2026` | 5:24.00–5:30.00   | Corner back-heavy/Arrow/Spike timing jab                            |
| `joe-ebios-cammy-indepth-june-2026` | 5:41.00–5:48.00   | Light Knuckle/heavy Spike route                                     |
| `joe-ebios-cammy-indepth-june-2026` | 5:48.00–5:54.00   | Knuckle/Spike corner timing jab                                     |
| `joe-ebios-cammy-indepth-june-2026` | 6:14.00–6:21.00   | Low Rush/Lift/heavy-Knuckle whiff side switch                       |
| `joe-ebios-cammy-indepth-june-2026` | 8:06.00–8:16.00   | Low double-Rush/Knuckle Level 1                                     |
| `joe-ebios-cammy-indepth-june-2026` | 8:45.00–8:58.00   | Forced-standing low Rush/medium Arrow/Spike                         |
| `joe-ebios-cammy-indepth-june-2026` | 8:58.00–9:04.00   | Low Rush/light Arrow/sweep knockdown                                |
| `joe-ebios-cammy-indepth-june-2026` | 9:11.00–9:21.00   | Post-combo-sweep Hooligan delayed throw                             |
| `joe-ebios-cammy-indepth-june-2026` | 9:21.00–9:31.00   | Post-combo-sweep Hooligan shimmy                                    |
| `joe-ebios-cammy-indepth-june-2026` | 9:31.00–9:42.00   | Post-combo-sweep Hooligan hit conversion                            |
| `joe-ebios-cammy-indepth-june-2026` | 9:42.00–9:51.00   | Post-combo-sweep empty Hooligan DP bait                             |
| `joe-ebios-cammy-indepth-june-2026` | 9:51.00–9:58.00   | Post-combo-sweep Hooligan command throw                             |
| `joe-ebios-cammy-indepth-june-2026` | 10:07.00–10:13.00 | Post-held-Arrow corner timing jab                                   |
| `joe-ebios-cammy-indepth-june-2026` | 10:13.00–10:19.00 | Standing-only double-back-heavy/Arrow/Spike                         |
| `joe-ebios-cammy-indepth-june-2026` | 10:33.00–10:42.00 | Double-back-heavy knockdown meaty target conversion                 |
| `joe-ebios-cammy-indepth-june-2026` | 10:42.00–10:58.00 | Double-back-heavy/Knuckle/Spike and low-kick timing                 |
| `joe-ebios-cammy-indepth-june-2026` | 10:58.00–11:13.00 | Low confirm/raw-Rush plus two cancels Level 3                       |
| `joe-ebios-cammy-indepth-june-2026` | 11:19.00–11:29.00 | Drive-Reversal medium/heavy target/medium Arrow                     |
| `joe-ebios-cammy-indepth-june-2026` | 12:34.00–12:41.00 | Plain heavy target/medium Arrow                                     |
| `joe-ebios-cammy-indepth-june-2026` | 12:41.00–12:49.00 | Heavy target Level 1                                                |
| `joe-ebios-cammy-indepth-june-2026` | 13:50.00–14:11.00 | Optimized long PC carry into Level 1/3 alternative                  |
| `joe-ebios-cammy-indepth-june-2026` | 14:19.00–14:28.00 | Corner PC double-back-heavy juggle                                  |
| `joe-ebios-cammy-indepth-june-2026` | 14:28.00–14:47.00 | Double-back-heavy PC cash-out                                       |
| `joe-ebios-cammy-indepth-june-2026` | 14:47.00–15:07.00 | Optimized PC medium-Knuckle/carry/Level 3                           |
| `joe-ebios-cammy-indepth-june-2026` | 16:12.00–16:29.00 | Corner OD Hooligan/raw-Rush/cancel/Level 3                          |
| `joe-ebios-cammy-indepth-june-2026` | 17:47.00–18:08.00 | Held-heavy Hooligan downward kick/long Level 3 conversion           |

Ambiguous material omitted from reviewed cards:

- `joe-ebios-cammy-indepth-june-2026` 13:39.00–13:50.00: Caption allows 236MHP; exact performed Hooligan punch strength not established. No guessed strength authored.
- `dillyverde-cammy-anti-air-2024` 0:00.00–0:19.00: The short replay visibly intercepts a jump, but has no input history. Exact special strengths in the full follow-up are not established, so no recipe is guessed.

## Media verification

The canonical `tools/ingest/prepare_media.py` helper generated silent, uncropped H.264 loops on a zero-based playback clock, full-resolution JPEG moments and matching WebVTT descriptions. Retained source originals were not modified. Every selected exported moment and both clip boundaries were inspected separately from discovery sheets. Complete affected media directories were regenerated after corrections, including actual timing-whiff frames, cross-up/air-normal/held-Spike stills, removal of trailing dash or timing-jab actions, removal of a next-take transition, and accurate starting-position labels.

The deterministic audit decodes every new clip and checks H.264/no audio, 1280×720 dimensions, expected duration, strictly increasing zero-based timestamps, moment bounds and JPEG integrity, exact authored VTT text and asset hashes. Local evidence is in `.local/depth/cammy/prepared-review/index.json`, `.local/depth/cammy/media-audit.json` and `.local/depth/cammy/source-review/`. Raw sources and tooling remain local. The repository owner has authorized public access to the prepared excerpts; third-party redistribution rights remain unassessed.

## Reference index

| Reference                                                                                                                | Type     | Source                              | Original interval |
| ------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------- | ----------------- |
| `cammy-ebios-light-medium-arrow` — Two jabs and light kick into medium Arrow                                             | combo    | `joe-ebios-cammy-beginner-2026`     | 0:00.70–0:04.65   |
| `cammy-ebios-low-rush-lift-arrow-spike` — Low Rush: Lift Combination into Arrow and Spike                                | combo    | `joe-ebios-cammy-beginner-2026`     | 2:50.15–2:55.85   |
| `cammy-ebios-crouching-heavy-medium-heavy-arrow` — Crouching heavy into medium and heavy Arrow                           | combo    | `joe-ebios-cammy-beginner-2026`     | 3:04.10–3:06.95   |
| `cammy-ebios-corner-forward-throw-walk-throw` — Corner throw: walk into another throw attempt                            | setup    | `joe-ebios-cammy-beginner-2026`     | 3:09.10–3:14.95   |
| `cammy-ebios-throw-whiff-back-heavy-air-level-one` — Throw whiff: back-heavy air catch into Level 1                      | response | `joe-ebios-cammy-beginner-2026`     | 3:35.10–3:43.35   |
| `cammy-ebios-drive-reversal-medium-heavy-arrow` — Drive Reversal punish: medium into heavy Arrow                         | combo    | `joe-ebios-cammy-beginner-2026`     | 3:44.25–3:48.35   |
| `cammy-ebios-corner-drive-reversal-target-arrow-spike` — Corner Drive Reversal punish: target combo into Arrow and Spike | combo    | `joe-ebios-cammy-beginner-2026`     | 3:50.10–3:55.85   |
| `cammy-ebios-heavy-punish-knuckle-jab-arrow` — Throw-whiff punish: heavy Knuckle into jab and Arrow                      | combo    | `joe-ebios-cammy-beginner-2026`     | 3:58.25–4:02.40   |
| `cammy-ebios-blocked-dp-crouching-heavy-arrow` — Blocked reversal: crouching heavy into heavy Arrow                      | combo    | `joe-ebios-cammy-beginner-2026`     | 4:11.30–4:15.25   |
| `cammy-ebios-blocked-dp-back-heavy-knuckle-level-one` — Blocked reversal: back-heavy juggle into Level 1                 | combo    | `joe-ebios-cammy-beginner-2026`     | 4:17.35–4:25.65   |
| `cammy-ebios-corner-blocked-dp-arrow-heavy-spike` — Corner reversal punish: back heavy, Arrow and heavy Spike            | combo    | `joe-ebios-cammy-beginner-2026`     | 4:27.20–4:32.40   |
| `cammy-ebios-counter-di-air-medium-heavy-strike` — Counter DI: Lift Combination into air medium and Strike               | combo    | `joe-ebios-cammy-beginner-2026`     | 4:34.25–4:41.85   |
| `cammy-ebios-counter-di-held-arrow-level-one-switch` — Counter DI: held heavy Arrow into Level 1 side switch             | combo    | `joe-ebios-cammy-beginner-2026`     | 4:43.30–4:53.90   |
| `cammy-ebios-wall-splat-knuckle-spike-jab-timing` — Blocked DI wall splat: Knuckle, Spike and jab timing                 | setup    | `joe-ebios-cammy-beginner-2026`     | 5:05.05–5:10.45   |
| `cammy-ebios-low-double-rush-held-spike-level-three` — Low confirm cash-out: two Rush cancels into Level 3               | combo    | `joe-ebios-cammy-beginner-2026`     | 5:11.15–5:26.30   |
| `cammy-depth-medium-arrow-dash-delayed-throw` — Medium Arrow: dash and delayed throw                                     | setup    | `joe-ebios-cammy-beginner-2026`     | 0:11.10–0:14.90   |
| `cammy-depth-medium-arrow-dash-shimmy` — Medium Arrow: dash shimmy                                                       | setup    | `joe-ebios-cammy-beginner-2026`     | 0:17.60–0:22.70   |
| `cammy-depth-medium-arrow-dash-medium-block-reversal` — Medium Arrow: meaty medium and block Drive Reversal              | response | `joe-ebios-cammy-beginner-2026`     | 0:25.70–0:28.50   |
| `cammy-depth-medium-arrow-dash-medium-heavy` — Medium Arrow: dash medium into heavy Arrow                                | setup    | `joe-ebios-cammy-beginner-2026`     | 0:31.15–0:35.45   |
| `cammy-depth-medium-arrow-dash-walk-low` — Medium Arrow: dash, walk and low lights                                       | setup    | `joe-ebios-cammy-beginner-2026`     | 0:37.90–0:41.90   |
| `cammy-depth-corner-medium-arrow-low-kill-reversal` — Corner medium Arrow: low-kick timing and reversal block            | response | `joe-ebios-cammy-beginner-2026`     | 0:49.45–0:52.60   |
| `cammy-depth-corner-medium-arrow-low-kill-heavy` — Corner medium Arrow: low-kick timing into target juggle               | setup    | `joe-ebios-cammy-beginner-2026`     | 0:55.15–1:00.60   |
| `cammy-depth-corner-medium-arrow-low-kill-low` — Corner medium Arrow: timing kick into delayed low                       | setup    | `joe-ebios-cammy-beginner-2026`     | 1:03.55–1:07.45   |
| `cammy-depth-corner-medium-arrow-low-kill-throw` — Corner medium Arrow: timing kick into delayed throw                   | setup    | `joe-ebios-cammy-beginner-2026`     | 1:09.65–1:13.85   |
| `cammy-depth-corner-medium-arrow-low-kill-shimmy` — Corner medium Arrow: low-kick timing into shimmy                     | setup    | `joe-ebios-cammy-beginner-2026`     | 1:16.35–1:21.90   |
| `cammy-depth-corner-medium-arrow-back-medium-strike` — Corner medium Arrow: back-medium timing into short confirm        | setup    | `joe-ebios-cammy-beginner-2026`     | 1:44.10–1:47.90   |
| `cammy-depth-corner-medium-arrow-di-reset` — Corner medium Arrow: wake-up DI reset                                       | setup    | `joe-ebios-cammy-beginner-2026`     | 1:50.45–1:54.30   |
| `cammy-depth-corner-medium-arrow-od-knuckle-switch` — Corner medium Arrow: OD Knuckle into side-switch reset             | setup    | `joe-ebios-cammy-beginner-2026`     | 1:56.35–2:00.90   |
| `cammy-depth-low-rush-heavy-arrow` — Low Rush confirm into heavy Arrow                                                   | combo    | `joe-ebios-cammy-beginner-2026`     | 2:01.90–2:06.35   |
| `cammy-depth-heavy-arrow-dash-heavy-reversal` — Heavy Arrow: dash heavy and block Drive Reversal                         | response | `joe-ebios-cammy-beginner-2026`     | 2:14.55–2:18.05   |
| `cammy-depth-heavy-arrow-dash-heavy-confirm` — Heavy Arrow: dash into crouching-heavy confirm                            | setup    | `joe-ebios-cammy-beginner-2026`     | 2:21.25–2:25.65   |
| `cammy-depth-heavy-arrow-dash-walk-low` — Heavy Arrow: dash and walk into low lights                                     | setup    | `joe-ebios-cammy-beginner-2026`     | 2:29.10–2:33.20   |
| `cammy-depth-heavy-arrow-dash-delayed-throw` — Heavy Arrow: dash and delayed throw                                       | setup    | `joe-ebios-cammy-beginner-2026`     | 2:36.65–2:40.95   |
| `cammy-depth-heavy-arrow-dash-shimmy` — Heavy Arrow: dash shimmy into Knuckle                                            | setup    | `joe-ebios-cammy-beginner-2026`     | 2:44.15–2:49.50   |
| `cammy-depth-corner-throw-walk-shimmy` — Corner throw: walk-in shimmy                                                    | setup    | `joe-ebios-cammy-beginner-2026`     | 3:18.25–3:24.25   |
| `cammy-depth-corner-throw-walk-medium` — Corner throw: walk into medium and light kick                                   | setup    | `joe-ebios-cammy-beginner-2026`     | 3:27.20–3:31.50   |
| `cammy-depth-corner-counter-di-held-arrow-spike` — Corner counter DI: Lift into held Arrow and heavy Spike               | combo    | `joe-ebios-cammy-beginner-2026`     | 4:55.10–5:02.30   |
| `cammy-depth-crossup-light-lift-air-strike` — Cross-up light kick into Lift and air Strike                               | combo    | `joe-ebios-cammy-indepth-june-2026` | 2:29.65–2:34.55   |
| `cammy-depth-air-strike-dash-walk-throw` — Air Strike: dash, walk and throw                                              | setup    | `joe-ebios-cammy-indepth-june-2026` | 2:41.15–2:45.70   |
| `cammy-depth-air-strike-dash-shimmy` — Air Strike: dash shimmy into Knuckle                                              | setup    | `joe-ebios-cammy-indepth-june-2026` | 2:48.30–2:53.65   |
| `cammy-depth-air-strike-dash-heavy-reversal` — Air Strike: crouching-heavy meaty and reversal block                      | response | `joe-ebios-cammy-indepth-june-2026` | 2:55.95–2:59.40   |
| `cammy-depth-air-strike-dash-heavy-target` — Air Strike: dash heavy into corner juggle                                   | setup    | `joe-ebios-cammy-indepth-june-2026` | 3:01.50–3:07.65   |
| `cammy-depth-counterhit-jab-medium-arrow` — Counter-hit jab into crouching medium and heavy Arrow                        | combo    | `joe-ebios-cammy-indepth-june-2026` | 3:15.35–3:18.65   |
| `cammy-depth-lights-double-rush-level-three` — Light confirm: double-Rush Level 3 cash-out                               | combo    | `joe-ebios-cammy-indepth-june-2026` | 4:55.25–5:10.90   |
| `cammy-depth-medium-light-kick-arrow` — Standing medium into light kick and medium Arrow                                 | combo    | `joe-ebios-cammy-indepth-june-2026` | 5:13.65–5:15.80   |
| `cammy-depth-standing-low-rush-back-heavy-arrow-spike` — Standing-target low Rush: back heavy into Arrow and Spike       | combo    | `joe-ebios-cammy-indepth-june-2026` | 5:17.85–5:23.35   |
| `cammy-depth-low-rush-light-knuckle-safe-jump` — Low Rush: light Knuckle into timing-kick safe jump                      | response | `joe-ebios-cammy-indepth-june-2026` | 5:35.30–5:40.90   |
| `cammy-depth-low-rush-knuckle-level-one` — Low Rush: back-heavy Knuckle into Level 1                                     | combo    | `joe-ebios-cammy-indepth-june-2026` | 5:53.85–6:01.45   |
| `cammy-depth-low-rush-medium-arrow-safe-jump` — Low Rush: back-heavy medium Arrow into DP-safe jump                      | response | `joe-ebios-cammy-indepth-june-2026` | 6:02.25–6:08.40   |
| `cammy-depth-low-rush-lift-air-strike` — Low Rush: Lift Combination into air Strike                                      | combo    | `joe-ebios-cammy-indepth-june-2026` | 6:09.15–6:12.40   |
| `cammy-depth-low-rush-heavy-knuckle-side-switch` — Low Rush: crouching-heavy launch into Knuckle side switch             | combo    | `joe-ebios-cammy-indepth-june-2026` | 6:20.75–6:24.80   |
| `cammy-depth-low-rush-heavy-target-medium-arrow` — Low Rush: heavy target into medium-Arrow knockdown                    | combo    | `joe-ebios-cammy-indepth-june-2026` | 6:31.05–6:36.40   |
| `cammy-depth-air-medium-super-two-to-one` — Air-to-air medium: Level 2 into Rush juggles and Level 1                     | response | `joe-ebios-cammy-indepth-june-2026` | 11:37.75–11:49.70 |
| `cammy-depth-target-arrow-rush-throw` — Target Arrow: Rush into throw                                                    | setup    | `joe-ebios-cammy-indepth-june-2026` | 6:40.85–6:45.60   |
| `cammy-depth-target-arrow-rush-shimmy` — Target Arrow: Rush shimmy into Knuckle                                          | setup    | `joe-ebios-cammy-indepth-june-2026` | 6:50.10–6:55.85   |
| `cammy-depth-target-arrow-rush-heavy-counterhit` — Target Arrow: Rush heavy catches wake-up jab                          | setup    | `joe-ebios-cammy-indepth-june-2026` | 7:00.05–7:05.85   |
| `cammy-depth-corner-target-arrow-hooligan-kick-throw` — Corner target Arrow: blocked Hooligan kick into throw            | setup    | `joe-ebios-cammy-indepth-june-2026` | 7:23.00–7:28.40   |
| `cammy-depth-corner-target-arrow-hooligan-kick-shimmy` — Corner target Arrow: Hooligan kick shimmy                       | setup    | `joe-ebios-cammy-indepth-june-2026` | 7:32.80–7:39.00   |
| `cammy-depth-corner-target-arrow-hooligan-kick-hit` — Corner target Arrow: Hooligan kick hit confirm                     | setup    | `joe-ebios-cammy-indepth-june-2026` | 7:43.55–7:49.35   |
| `cammy-depth-corner-target-arrow-hooligan-empty-dp` — Corner target Arrow: empty Hooligan blocks DP                      | response | `joe-ebios-cammy-indepth-june-2026` | 7:53.85–7:57.65   |
| `cammy-depth-corner-target-arrow-hooligan-delayed-throw` — Corner target Arrow: delayed Hooligan command throw           | setup    | `joe-ebios-cammy-indepth-june-2026` | 8:01.60–8:05.65   |
| `cammy-depth-low-double-rush-level-two` — Low confirm: double-Rush Level 2 finish                                        | combo    | `joe-ebios-cammy-indepth-june-2026` | 8:16.80–8:26.95   |
| `cammy-depth-target-hooligan-slide-throw` — Heavy target: Hooligan slide into throw                                      | setup    | `joe-ebios-cammy-indepth-june-2026` | 12:11.60–12:16.20 |
| `cammy-depth-target-hooligan-slide-shimmy` — Heavy target: blocked Hooligan slide shimmy                                 | setup    | `joe-ebios-cammy-indepth-june-2026` | 12:19.15–12:24.75 |
| `cammy-depth-heavy-target-hooligan-downward-kick` — Heavy target: Hooligan downward kick into corner juggle              | setup    | `joe-ebios-cammy-indepth-june-2026` | 12:25.20–12:33.20 |
| `cammy-depth-standing-heavy-arrow` — Standing heavy into heavy Arrow                                                     | combo    | `joe-ebios-cammy-indepth-june-2026` | 12:55.10–12:57.30 |
| `cammy-depth-blocked-dp-back-heavy-rush-carry` — Blocked DP: back-heavy raw-Rush carry                                   | combo    | `joe-ebios-cammy-indepth-june-2026` | 13:22.25–13:29.65 |
| `cammy-depth-corner-blocked-dp-heavy-rush-spike` — Blocked DP: heavy link into Arrow and Spike carry                     | combo    | `joe-ebios-cammy-indepth-june-2026` | 13:30.25–13:36.70 |
| `cammy-depth-sweep-pc-timing-dive-throw` — PC sweep: timing jab and dive kick into throw                                 | setup    | `joe-ebios-cammy-indepth-june-2026` | 15:25.50–15:30.45 |
| `cammy-depth-sweep-pc-timing-dive-shimmy` — PC sweep: blocked dive-kick shimmy                                           | setup    | `joe-ebios-cammy-indepth-june-2026` | 15:32.35–15:37.95 |
| `cammy-depth-sweep-pc-timing-dive-heavy-target` — PC sweep: dive-kick hit into heavy target                              | setup    | `joe-ebios-cammy-indepth-june-2026` | 15:39.45–15:44.65 |
| `cammy-depth-forward-heavy-pc-knuckle-level-one` — Forward-heavy PC: light Knuckle into Level 1                          | combo    | `joe-ebios-cammy-indepth-june-2026` | 15:49.55–15:56.75 |
| `cammy-depth-od-hooligan-pc-throw-level-three` — OD Hooligan PC throw into Level 3                                       | combo    | `joe-ebios-cammy-indepth-june-2026` | 15:57.80–16:11.35 |
