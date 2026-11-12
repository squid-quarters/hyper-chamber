# Akuma source coverage and review

Reviewed on 10 November 2026.

The Akuma collection contains 46 selected references: 20 combos, 23 setups and 3 defensive responses, with 246 annotated moments. Every reference has a silent looping replay, selected stills and timed action descriptions. This is a curated practice collection rather than a complete character guide.

## Sources

- [Joe Ebios: SF6 AKUMA Beginner Guide](https://www.youtube.com/watch?v=YxtKvL-r9-4), June 2026. Eighteen selections cover a light confirm, medium target combo, heavy-Shoryuken pressure, ground-hit versus air-juggle Tatsu knockdowns, Adamant Flame approaches, a corner OD Flame route and a low-confirm Level 3 finish.
- [Joe Ebios: Classic AKUMA Combos & Setup guide season3](https://www.youtube.com/watch?v=HncekXkv4NQ), December 2025. Twenty-eight selections add frame kills, corner throw pressure, medium and low Drive Rush confirms, counter-hit overheads, Level 1/2 extensions, counter-DI versus blocked wall splat, air-to-air conversions and blocked-reversal punishes.

Download metadata records UTC upload dates of 3 June 2026 and 5 December 2025 respectively; some search indexes show the previous calendar day. The source records in `content/sources/` preserve these dates, the creator's version label and original-recording SHA-256 values. Automatically indexed chapters did not establish actions or boundaries; the authors inspected actual captions, input history and hit/block results. Full recordings and extraction workfiles stay outside Git.

## Interpretation and limits

All entries use `verification.status: source-reviewed` and `gameVersion: null`. None has been re-tested in the current game. A Season 3 title and an advantage displayed in a dated video are provenance, not current-patch certification.

Setups identify their prerequisite knockdown and spacing in Conditions. Some excerpts isolate only the wake-up actions, so the prerequisite combo is not repeated in Inputs. Throw/shimmy choices and guarded pressure are setups, not uninterrupted damage combos. A source-qualified safe-jump example demonstrates blocking Ryu's OD Shoryuken; it does not establish safety against every reversal.

Ground-hit heavy Tatsu and air-juggle heavy Tatsu lead to different source-labelled timing situations. Their frame kills and throw timings remain separate cards. Likewise, counter-DI crumple and blocked DI wall splat use different conversions. The air-to-air examples begin with a jumping medium-punch Counter Hit; they are not grounded anti-air punishes.

Known or uncertain patch-sensitive suggestions, including old light-Tatsu-to-sweep timing assumptions and direct crouching-medium-kick-to-OD-Flame routes, are not recommended by this collection. Unclear demonstrations, repeated cash-out variants, the unreviewed later continuations and Raging Demon setups are omitted. New recordings and in-game checks can extend the collection while preserving stable reference IDs and recording material execution revisions.

## Media preparation

The canonical ingestion helper encoded the reviewed intervals, removed audio, reset presentation clocks to zero, exported selected stills and wrote WebVTT action descriptions. Short lossless H.264 intermediates avoided decoding the full tutorial for each excerpt. Key-moment times describe the prepared video timeline, not one-frame SF6 simulation stepping. Clip endpoints and every selected still were inspected, including crossfades between takes.

Creator overlays remain visible. `content/media-akuma.json` records their owner-authorized public-repository status. Public redistribution has not been assessed.

## Reference index

### Beginner guide

| Reference                                                                                       | Type  | Original interval |
| ----------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `akuma-joe-beginner-lights-heavy-dp` — Three lights into heavy DP                               | combo | 0:01.45–0:04.95   |
| `akuma-joe-beginner-dp-rush-throw` — Heavy DP: Rush into throw                                  | setup | 0:08.60–0:12.25   |
| `akuma-joe-beginner-dp-rush-shimmy` — Heavy DP: Rush, retreat and punish                        | setup | 0:17.05–0:18.75   |
| `akuma-joe-beginner-dp-rush-forward-medium` — Heavy DP: Rush forward-medium into Tatsu          | setup | 0:26.35–0:31.15   |
| `akuma-joe-beginner-corner-dp-mk-throw` — Corner DP: medium-kick frame kill into throw          | setup | 0:49.65–0:53.25   |
| `akuma-joe-beginner-corner-dp-mk-shimmy` — Corner DP: medium-kick frame kill into shimmy        | setup | 0:57.45–0:59.22   |
| `akuma-joe-beginner-corner-dp-mk-meaty` — Corner DP: frame kill into medium confirm             | setup | 1:08.10–1:11.45   |
| `akuma-joe-beginner-medium-target-heavy-tatsu` — Medium target combo into heavy Tatsu           | combo | 1:20.50–1:24.20   |
| `akuma-joe-beginner-tatsu-rush-heavy-flame` — Ground Tatsu: Rush heavy punches into Flame       | setup | 1:28.60–1:32.90   |
| `akuma-joe-beginner-corner-ground-tatsu-mk-throw` — Ground Tatsu: frame kill into delayed throw | setup | 1:42.70–1:46.25   |
| `akuma-joe-beginner-corner-ground-tatsu-mk-shimmy` — Ground Tatsu: frame kill into shimmy       | setup | 1:51.15–1:52.72   |
| `akuma-joe-beginner-corner-ground-tatsu-mk-meaty` — Ground Tatsu: meaty medium into two Tatsus  | setup | 2:02.50–2:07.10   |
| `akuma-joe-beginner-corner-air-tatsu-mk-throw` — Juggle Tatsu: frame kill into throw            | setup | 2:54.10–2:57.30   |
| `akuma-joe-beginner-corner-air-tatsu-mk-shimmy` — Juggle Tatsu: frame kill into shimmy          | setup | 3:03.25–3:04.80   |
| `akuma-joe-beginner-flame-double-dash-throw` — Heavy Flame: two dashes, walk and throw          | setup | 3:38.45–3:41.90   |
| `akuma-joe-beginner-flame-double-dash-shimmy` — Heavy Flame: two dashes into shimmy             | setup | 3:48.38–3:50.18   |
| `akuma-joe-beginner-corner-od-flame-fireball-tatsu` — Corner OD Flame into fireball and Tatsu   | combo | 2:36.35–2:41.20   |
| `akuma-joe-beginner-low-cashout-sa3` — Low confirm: two Rush cancels into Level 3               | combo | 5:22.05–5:36.10   |

### Classic Season 3 guide

| Reference                                                                                                               | Type     | Original interval |
| ----------------------------------------------------------------------------------------------------------------------- | -------- | ----------------- |
| `akuma-joe-classic-corner-dp-double-jab-throw` — Corner DP: two jab frame kills into throw                              | setup    | 1:44.70–1:48.50   |
| `akuma-joe-classic-corner-dp-double-jab-meaty` — Corner DP: two jab frame kills into medium confirm                     | setup    | 2:07.85–2:13.40   |
| `akuma-joe-classic-lights-tatsu-sa2` — Light confirm into Tatsu and Level 2                                             | combo    | 3:17.10–3:26.75   |
| `akuma-joe-classic-medium-tatsu-dash-throw` — Medium Tatsu: dash, walk and throw                                        | setup    | 3:35.80–3:42.10   |
| `akuma-joe-classic-medium-tatsu-jump-block` — Medium Tatsu: jump-in and reversal block                                  | setup    | 4:00.30–4:06.65   |
| `akuma-joe-classic-corner-light-rush-medium-kill-throw` — Corner Tatsu juggle: crouching-medium frame kill into throw   | setup    | 4:52.45–4:57.75   |
| `akuma-joe-classic-corner-light-rush-medium-kill-meaty` — Corner Tatsu juggle: crouching-medium frame kill into confirm | setup    | 5:12.55–5:18.20   |
| `akuma-joe-classic-corner-throw-rush-jab-throw` — Corner throw: Rush and whiff jab into another throw                   | setup    | 5:59.10–6:05.35   |
| `akuma-joe-classic-corner-throw-dash-meaty` — Corner throw: dash into medium-kick meaty                                 | setup    | 6:12.60–6:20.35   |
| `akuma-joe-classic-medium-rush-medium-tatsu` — Crouching medium Rush confirm into medium Tatsu                          | combo    | 6:52.10–6:57.40   |
| `akuma-joe-classic-medium-rush-heavy-flame` — Crouching medium Rush confirm into heavy Flame                            | combo    | 7:06.00–7:10.85   |
| `akuma-joe-classic-corner-medium-rush-flame-dp` — Corner heavy Flame into light DP juggle                               | combo    | 7:21.50–7:29.25   |
| `akuma-joe-classic-corner-flame-dp-medium-kill-throw` — Flame–DP corner knockdown: medium-kick frame kill into throw    | setup    | 8:29.55–8:33.40   |
| `akuma-joe-classic-low-rush-target-medium-tatsu` — Low Rush confirm into target combo and medium Tatsu                  | combo    | 9:30.65–9:35.20   |
| `akuma-joe-classic-overhead-counter-dp` — Counter-hit overhead into crouching medium and DP                             | combo    | 10:20.85–10:24.75 |
| `akuma-joe-classic-overhead-punish-sweep` — Punish-counter overhead into sweep                                          | combo    | 10:25.75–10:28.75 |
| `akuma-joe-late-corner-od-tatsu` — Corner OD Flame into two Tatsu juggles                                               | combo    | 10:56.35–11:04.80 |
| `akuma-joe-late-corner-sa1` — Corner OD Flame into Level 1                                                              | combo    | 11:27.65–11:36.85 |
| `akuma-joe-late-corner-sa2-tatsu` — Corner Level 2 into heavy Tatsu                                                     | combo    | 12:26.50–12:37.80 |
| `akuma-joe-late-drive-reversal-punish` — Block Drive Reversal into a corner Tatsu juggle                                | response | 15:04.05–15:09.70 |
| `akuma-joe-late-counter-di-medium-tatsu` — Counter DI into two crouching mediums                                        | combo    | 15:34.10–15:42.25 |
| `akuma-joe-late-counter-di-fireball-juggle` — Counter DI into fireball, Rush and corner Shoryuken                       | combo    | 16:03.25–16:13.10 |
| `akuma-joe-late-wall-splat-fireball` — Blocked DI into fireball and heavy Tatsu                                         | combo    | 16:26.35–16:32.30 |
| `akuma-joe-late-wall-splat-od-flame` — Blocked DI into OD Flame and heavy Tatsu                                         | combo    | 16:34.10–16:40.20 |
| `akuma-joe-late-air-to-air-fireball` — Air-to-air medium into fireball and Rush                                         | combo    | 20:32.25–20:37.70 |
| `akuma-joe-late-air-to-air-sa1-tatsu` — Air-to-air Level 1 into dash and Tatsu                                          | combo    | 21:09.15–21:15.35 |
| `akuma-joe-late-reversal-punish-carry` — Block Shoryuken into an OD Flame carry route                                   | response | 22:19.00–22:27.30 |
| `akuma-joe-late-reversal-punish-demon-flip` — Heavy Flame punish into OD Demon Flip                                     | response | 22:40.05–22:48.35 |
