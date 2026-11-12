# Ryu source coverage and review

> Audio update, 12 November 2026: prepared clips now include their original source audio and start muted in the player. Earlier references to silent clips below describe the original source-review pass. Video, annotations and execution revisions are unchanged; see the [restoration record](../content/audio-restoration.json).

Reviewed on 10 November 2026.

The Ryu collection contains 50 selected references: 26 combos, 23 setups and one defensive response, with 246 annotated moments. Each has a silent replay, selected stills and timed action descriptions. This is a curated training collection; repeated cash-out variants and unclear demonstrations are omitted.

## Sources

- [Joe Ebios: Classic RYU Combos & Setup guide season3](https://www.youtube.com/watch?v=Nxe9bFjbD0I), 28 November 2025. Thirty-five references cover light and medium confirms, Drive Rush, Denjin, punish routes, Drive Impact, wall splat, stun and corner oki. The indexed chapter labels did not match the footage; the authors followed actual input captions, input history and hit/block results.
- [ThisIsAMKIDD: Season 3 Ryu Ultimate Guide](https://www.youtube.com/watch?v=2cN27UUF95g), June 2025. Three selected routes add a jump-in OD Tatsu to Level 1, a dash-under side switch, and the slightly held Level 2 corner juggle. The source metadata reports 18 June; some search indexes display 17 June.
- [オバハン: Year4 midscreen oki](https://www.youtube.com/watch?v=JWskwGQzYOM), 22 August 2026. Twelve setups cover Tatsu and Shoryuken knockdowns, approach/throw/shimmy choices, meaty strikes, a reversal bait, Denjin charging and sweep pressure. The creator's Year4 label records the source context.

Source records and original-recording SHA-256 values are in `content/sources/`. Full source recordings, contact sheets and extraction workfiles remain outside Git. Ray's shortlisted video was unavailable to the downloader, so it supplied no imported content. Raidhyn's older guide was downloaded as a fallback but supplied no imported references.

## Interpretation and limits

All entries use `verification.status: source-reviewed` and `gameVersion: null`. Authors inspected footage and its visible inputs; execution has not been re-tested in the current game. Source captions or Japanese speech helped locate material, but summaries and automatic chapter labels did not establish the input paths.

A setup may start at a knockdown and list only the follow-up actions. Its conditions identify the required ender and spacing. Throws, guarded pressure, charging and conditional punish opportunities remain separate from uninterrupted damage combos. Clip-relative frame times describe video presentation, not one-frame SF6 simulation stepping.

Numerical advantage notes in the newer oki examples are explicitly attributed to the source. They are not current-patch guarantees or universal reversal-safety claims. Near-corner spacing and the demonstrated opponent response remain part of each reference's conditions.

Material authoring corrections included replacing a caption-inconsistent light-confirm take, excluding a failed medium link, adding a visibly performed Denjin charge to its setup, distinguishing counter-DI from blocked wall splat, trimming crossfades/repeats, and aligning still labels to actual presented actions. The Level 2 raw-Rush route uses no Overdrive move; its resource label reflects that distinction.

Unclear safe-jump follow-ups, an ambiguous Hashogeki strength and an overhead whose secondary summary disagreed with the source were omitted. Future recordings or in-game checks can improve these references while preserving their stable IDs and recording any material execution revision.

## Media preparation

The committed ingestion helper encodes the reviewed intervals and selects the frame actually presented at or before each authored key moment. For the batch, short lossless H.264 intermediates retained the precisely trimmed source frames and zero-based presentation clock before the canonical encoding pass. A decoded-frame comparison of a prepared side-switch clip matched all 174 frames from a direct full-source trim. Originals were not stream-copied into approximate keyframe cuts or passed through lossy proxies.

The source intervals below retain original-video times. Some short oki clips deliberately isolate a single wake-up interaction and stop before unlisted follow-ups. Creator overlays remain visible. `content/media-ryu.json` records owner-authorized public-repository excerpts; public redistribution has not been assessed.

## Reference index

### Joe Ebios

| Reference                                                                                                | Type     | Original interval |
| -------------------------------------------------------------------------------------------------------- | -------- | ----------------- |
| `ryu-joe-lights-heavy-dp` — Three lights into heavy Shoryuken                                            | combo    | 0:13.55–0:15.95   |
| `ryu-joe-lights-light-tatsu` — Three lights into light Tatsu                                             | combo    | 2:10.40–2:14.10   |
| `ryu-joe-lights-light-donkey` — Two lights into Donkey Kick and Denjin                                   | setup    | 3:23.70–3:27.45   |
| `ryu-joe-lights-od-tatsu-heavy-dp` — Corner lights into OD Tatsu and heavy Shoryuken                     | combo    | 4:08.05–4:13.65   |
| `ryu-joe-lights-od-tatsu-sa3` — Corner light confirm into Level 3                                        | combo    | 3:53.10–4:07.65   |
| `ryu-joe-rush-low-medium-dp` — Drive Rush low into medium punches and Shoryuken                          | combo    | 0:56.25–0:59.95   |
| `ryu-joe-rush-overhead-medium-dp` — Drive Rush overhead into Shoryuken                                   | combo    | 1:03.15–1:07.65   |
| `ryu-joe-medium-heavy-dp` — Medium punches into heavy Shoryuken                                          | combo    | 5:47.45–5:50.75   |
| `ryu-joe-medium-light-tatsu` — Medium punches into light Tatsu                                           | combo    | 5:55.05–5:57.85   |
| `ryu-joe-medium-light-donkey` — Medium punches into light Donkey Kick                                    | combo    | 5:59.25–6:01.45   |
| `ryu-joe-medium-heavy-tatsu-switch` — Medium confirm into heavy Tatsu side switch                        | combo    | 6:03.20–6:06.65   |
| `ryu-joe-medium-od-donkey-carry` — OD Donkey Kick into airborne Tatsu carry                              | combo    | 6:07.30–6:11.60   |
| `ryu-joe-corner-dp-medium-meaty` — Corner Shoryuken into medium-kick frame kill                          | setup    | 1:26.50–1:30.70   |
| `ryu-joe-corner-dp-light-overhead` — Corner Shoryuken into light-kick overhead setup                     | setup    | 2:02.75–2:08.45   |
| `ryu-joe-corner-tatsu-jab-overhead` — Corner Tatsu into jab frame kill and overhead                      | setup    | 3:04.70–3:10.55   |
| `ryu-joe-corner-tatsu-hasho-confirm` — Corner Tatsu into meaty Hashogeki confirm                         | setup    | 3:16.10–3:22.95   |
| `ryu-joe-corner-donkey-medium-overhead` — Corner Donkey Kick into medium-punch frame kill                | setup    | 3:38.75–3:44.30   |
| `ryu-joe-corner-od-tatsu-framekill-confirm` — OD Tatsu knockdown into two frame kills and medium confirm | setup    | 4:53.95–5:03.50   |
| `ryu-joe-mp-od-blade-dp` — Medium confirm into OD Blade Kick and DP                                      | combo    | 6:35.25–6:39.25   |
| `ryu-joe-corner-medium-blade-dp` — Corner medium confirm into Blade Kick and DP                          | combo    | 7:42.80–7:46.50   |
| `ryu-joe-low-drive-dp` — Low confirm into Drive Rush and DP                                              | combo    | 8:55.00–8:59.80   |
| `ryu-joe-heavy-drive-dp` — Heavy confirm into Drive Rush kick and DP                                     | combo    | 9:32.00–9:36.20   |
| `ryu-joe-drive-overhead-dp` — Drive Rush overhead into DP                                                | combo    | 11:11.50–11:15.70 |
| `ryu-joe-solar-plexus-dp` — Solar Plexus into medium and DP                                              | combo    | 11:59.20–12:03.40 |
| `ryu-joe-shimmy-hasho-tatsu` — Shimmy punish into Tatsu and dash-up                                      | setup    | 12:39.00–12:43.80 |
| `ryu-joe-drive-reversal-punish` — Block Drive Reversal into medium punish                                | response | 12:52.20–12:57.00 |
| `ryu-joe-denjin-low-tatsu` — Denjin low confirm into Tatsu and dash-up                                   | setup    | 12:58.60–13:04.20 |
| `ryu-joe-heavy-punish-charge` — Heavy punish into sweep and Denjin charge                                | setup    | 15:33.80–15:38.30 |
| `ryu-joe-heavy-punish-side-switch` — Heavy punish into side-switch Tatsu                                 | combo    | 15:56.15–16:00.35 |
| `ryu-joe-di-solar-plexus-dp` — Counter DI into Solar Plexus and DP                                       | combo    | 17:33.80–17:40.20 |
| `ryu-joe-di-tatsu` — Counter DI into Tatsu and dash-up                                                   | setup    | 17:41.60–17:48.70 |
| `ryu-joe-corner-di-blade-dp` — Corner counter DI into Blade Kick and DP                                  | combo    | 18:30.40–18:37.60 |
| `ryu-joe-wall-splat-blade` — Blocked DI into heavy Blade Kick                                            | combo    | 20:06.20–20:09.40 |
| `ryu-joe-stun-denjin-meterless` — Stun: charge into a meterless jump-in route                            | combo    | 21:00.40–21:06.70 |
| `ryu-joe-stun-charged-sa2-dp` — Stun: charged Level 2 into Rush and DP                                   | combo    | 22:23.60–22:33.25 |

### ThisIsAMKIDD

| Reference                                                                          | Type  | Original interval |
| ---------------------------------------------------------------------------------- | ----- | ----------------- |
| `ryu-amkidd-jump-od-tatsu-sa1` — Jump-in into OD Tatsu and Level 1                 | combo | 0:21.30–0:28.55   |
| `ryu-amkidd-hashogeki-side-switch` — Heavy Hashogeki into a dash-under side switch | combo | 0:50.45–0:56.25   |
| `ryu-amkidd-corner-sa2-rush-juggle` — Corner Level 2 into three Rush juggles       | combo | 1:39.75–1:49.80   |

### オバハン

| Reference                                                                                   | Type  | Original interval |
| ------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `ryu-obahan-light-tatsu-dash-throw` — Light Tatsu: dash, walk and throw                     | setup | 0:16.00–0:18.35   |
| `ryu-obahan-light-tatsu-shimmy` — Light Tatsu: walk back and punish throw                   | setup | 0:23.90–0:25.28   |
| `ryu-obahan-light-tatsu-hasho-throw` — Light Tatsu: heavy Hashogeki pressure                | setup | 0:49.20–0:52.22   |
| `ryu-obahan-light-tatsu-jab-reversal-bait` — Light Tatsu: whiff jab and block reversal      | setup | 1:51.00–1:53.28   |
| `ryu-obahan-light-tatsu-drive-rush-jab` — Light Tatsu: dash into Drive Rush jab             | setup | 2:09.50–2:10.88   |
| `ryu-obahan-medium-tatsu-corner-solar-plexus` — Medium Tatsu: late Solar Plexus near corner | setup | 3:05.95–3:07.03   |
| `ryu-obahan-medium-tatsu-light-hadoken` — Medium Tatsu: meaty light Hadoken                 | setup | 3:38.17–3:39.25   |
| `ryu-obahan-hasho-tatsu-meaty-medium-punch` — Hashogeki–Tatsu: dash into meaty medium punch | setup | 4:19.77–4:21.32   |
| `ryu-obahan-heavy-dp-dash-solar-plexus` — Heavy DP: dash into Solar Plexus                  | setup | 5:27.64–5:29.06   |
| `ryu-obahan-heavy-dp-dash-whirlwind` — Heavy DP: dash into Whirlwind Kick                   | setup | 5:43.10–5:44.16   |
| `ryu-obahan-medium-blade-denjin-charge` — Medium Blade route into Denjin Charge             | setup | 6:20.15–6:24.65   |
| `ryu-obahan-sweep-double-dash-throw` — Sweep route: two dashes into throw                   | setup | 6:38.18–6:43.80   |
