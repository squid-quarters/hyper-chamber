# Guile source coverage and review

Reviewed on 10 November 2026.

The Guile collection contains 55 selected references: 43 combos, 9 setups and 3 anti-air responses, with 317 annotated moments. Each has a silent looping clip, selected stills and timed action descriptions. This is a curated practice collection, not a complete Guile guide or a current-patch combo certification.

## Sources

- [ThisIsAMKIDD: Guile Starter Guide #1](https://www.youtube.com/watch?v=cxlo_vwedkQ), 1 August 2023 UTC. 27 selections cover basic charge confirms, Counter Hit and Punish Counter conversions, corner routes, wall-splat and counter-DI states, and three normal anti-air responses. These are explicitly dated launch-era demonstrations.
- [GUILESGARDEN: Raw Damage](https://www.youtube.com/watch?v=OZ7ju2hwi9s), 3 October 2026 UTC. 14 selections cover forward-heavy-punch punishes, different Hurricane versions, corner extensions, Critical Art finishes and a carry route away from the wall. The title’s body-type claim is not treated as independent matchup verification; references identify the demonstrated standing or crouching Manon state.
- [GUILESGARDEN: New Boom Loops 2026](https://www.youtube.com/watch?v=Y4P48Z8hXo4), 12 August 2026 UTC. 6 selections show different standing/crouching entries, light versus medium Boom inserts, single and double Level 1 finishes, a no-Super heavy-kick ender and one guarded-Blade pressure choice leading to an on-hit overhead conversion.
- [Kajiba: Seven Guile Setplays](https://www.youtube.com/watch?v=Ro3xFARS76g), 16 May 2026 UTC. 8 selections isolate frame kills, light Blade into guard, conditional jump pressure, heavy Level 1 wake-up choices, a delayed counter-DI side switch, Level 3 Rush Knee Bazooka and midscreen pressure after a Punish Counter normal throw. The source’s named setplays include alternative takes; this collection separates eight useful demonstrations rather than assuming the title is a reference count.

Exact original titles, creator names, UTC download-metadata dates, chapter outlines and recording SHA-256 values are retained in `content/sources/`. Chapters and recipe panels locate demonstrations. Actual action order, button strength, state, resource spend, clip boundaries and key moments are established from footage, virtual controls, input history, hit results and the training frame display. Full original recordings and extraction workfiles remain outside Git.

## Interpretation and limits

All entries use `verification.status: source-reviewed` and `gameVersion: null`. None has been re-tested in the current game. Dated damage, frame advantage, Super hit patterns and matchup demonstrations do not establish current-patch execution or universal safety. The older starter guide and May setplays remain distinguishable from the later 2026 Garden recordings.

Charge brackets describe holding a direction before releasing the listed input. Directions are character-relative and mirror after a side switch. Back charge for Boom and Hurricane differs from down charge for Flash Kick; individual references retain their execution cues. Perfect Booms are identified only in demonstrated routes that use them. No exact minimum charge or Perfect-input window is inferred.

Recoil Cannon’s back-heavy-punch target follow-up is distinct from a separately linked back heavy punch. Double Bullet’s two crouching medium punches are distinct from repeated arbitrary links. Crouching-medium-kick Punish Counter into Flash Kick is recorded as a link where demonstrated, rather than described as a normal special cancel. DI crumple, blocked-DI wall splat and corner positioning have separate conditions. The three normal anti-air responses show the specific spacing and jump they answer, not a blanket answer to every air approach.

The newer loop footage changes normal inserts, Boom strength and finish according to the shown standing/crouching target. A printed headline ending in standing HK does not erase actual Supers performed afterward. Conversely, no-Super takes ending in standing HK are not labelled knockdowns. Light Blade guarded before an overhead sequence is pressure before the combo, not another damage-combo hit or evidence of a gapless blockstring.

The setplay inputs start after their named prerequisite knockdown when that is what the excerpt isolates. Crouching MK is the heavy-Level-1 jump timing move; crouching MP times the double-dash throw. The +41F jump example guards the shown OD reversal but the source also demonstrates losing to a faster light anti-air. The separate +42F heavy-Level-1 example has a different frame kill and recorded timing. Both remain dated, qualified examples. Guard-only clips stop before Guile begins the later punish.

The counter-DI side switch waits for the kneeling crumple before standing HK. The Rush Knee Bazooka example records +3F in its selected take, while another timing in the surrounding source is approximately neutral. The Punish Counter throw into forward HP is limited to midscreen; the source explicitly shows that strike missing in the corner. None is presented as an unavoidable throw loop or a universal reversal-safe setup.

Solid Puncher, further matchup-specific loop variations and uncertain extended sequences are not included as execution references. Long-form guides remain external links.

## Media preparation

The complete 1280×720 source frames are retained without cropping. This preserves virtual controls, command history, health, Drive/Super meters, frame displays and source overlays. Short accurate lossless excerpts are prepared first; the unchanged canonical ingestion helper encodes silent clips, resets presentation timestamps to zero, selects stills on the prepared playback clock and writes WebVTT action descriptions.

Every selected moment and both clip endpoints are visually reviewed. Mechanical audits check full decode, silent H.264 video, dimensions, duration, monotonic zero-based presentation clocks, JPEG integrity and exact timed descriptions. Original hashes and source intervals are separate from the prepared-media clock. `content/media-guile.json` maps each selected excerpt to its source and records private development status. Public redistribution has not been assessed.

## Reference index

### Older starter demonstrations

| Reference                                                                                                    | Type     | Original interval |
| ------------------------------------------------------------------------------------------------------------ | -------- | ----------------- |
| `guile-amkidd-crouching-medium-flash` — Crouching medium punch into heavy Flash Kick                         | combo    | 2:12.30–2:15.35   |
| `guile-amkidd-double-crouching-medium-flash` — Double crouching medium into heavy Flash Kick                 | combo    | 2:16.40–2:19.20   |
| `guile-amkidd-low-jab-flash` — Low kick and crouching jab into heavy Flash Kick                              | combo    | 2:20.05–2:23.30   |
| `guile-amkidd-double-jab-flash` — Two crouching jabs into heavy Flash Kick                                   | combo    | 2:24.05–2:27.20   |
| `guile-amkidd-low-medium-jab-flash` — Low medium kick into jab and heavy Flash Kick                          | combo    | 2:28.05–2:31.65   |
| `guile-amkidd-standing-medium-crouching-medium-flash` — Standing medium into crouching medium and Flash Kick | combo    | 2:32.05–2:39.15   |
| `guile-amkidd-standing-medium-double-medium-flash` — Standing medium into Double Shot and Flash Kick         | combo    | 2:39.55–2:43.85   |
| `guile-amkidd-recoil-cannon-flash` — Recoil Cannon into heavy Flash Kick                                     | combo    | 2:46.05–2:49.60   |
| `guile-amkidd-punish-heavy-high-kick-flash` — Punish-counter heavy into high kick and Flash Kick             | combo    | 2:52.15–2:55.48   |
| `guile-amkidd-punish-back-knuckle-medium-flash` — Punish-counter back knuckle into medium and Flash Kick     | combo    | 2:58.50–3:01.95   |
| `guile-amkidd-punish-heavy-medium-flash` — Punish-counter heavy into medium and Flash Kick                   | combo    | 3:04.55–3:07.75   |
| `guile-amkidd-punish-low-medium-flash` — Punish-counter low medium into linked Flash Kick                    | combo    | 3:10.05–3:13.25   |
| `guile-amkidd-punish-sweep-phantom-flash` — Punish-counter sweep into Phantom Cutter and Flash Kick          | combo    | 3:16.55–3:20.45   |
| `guile-amkidd-punish-sobat-medium-flash` — Punish-counter Sobat into medium and Flash Kick                   | combo    | 3:21.50–3:24.85   |
| `guile-amkidd-punish-sobat-double-medium-flash` — Punish-counter Sobat into Double Shot and Flash Kick       | combo    | 3:25.95–3:29.70   |
| `guile-amkidd-counter-sobat-jab-flash` — Counter-hit Sobat into jab and Flash Kick                           | combo    | 3:30.05–3:33.25   |
| `guile-amkidd-punish-reverse-kick-flash` — Punish-counter reverse kick into Flash Kick                       | combo    | 3:34.55–3:38.25   |
| `guile-amkidd-corner-reverse-kick-sweep-flash` — Corner reverse-kick crumple into sweep and Flash Kick       | combo    | 3:38.85–3:43.70   |
| `guile-amkidd-corner-reverse-kick-double-flash` — Corner reverse-kick punish into two Flash Kicks            | combo    | 3:44.20–3:50.70   |
| `guile-amkidd-corner-recoil-blade-flash` — Corner Recoil Cannon into Blade and Flash Kick                    | combo    | 3:51.75–3:57.25   |
| `guile-amkidd-wall-di-sweep-flash` — Blocked DI wall splat into sweep and Flash Kick                         | combo    | 3:58.40–4:02.65   |
| `guile-amkidd-wall-di-sweep-double-flash` — Blocked DI wall splat into two Flash Kicks                       | combo    | 4:02.95–4:08.20   |
| `guile-amkidd-wall-di-heavy-blade-flash` — Blocked DI wall splat into heavy, Blade and Flash Kick            | combo    | 4:08.75–4:13.25   |
| `guile-amkidd-counter-di-high-kick-flash` — Counter DI into high kick and Flash Kick                         | combo    | 4:14.85–4:20.70   |
| `guile-amkidd-anti-air-crouching-heavy` — Anti-air with crouching heavy punch                                | response | 4:22.05–4:23.70   |
| `guile-amkidd-anti-air-standing-medium-kick` — Anti-air with standing medium kick                            | response | 4:24.35–4:26.75   |
| `guile-amkidd-anti-air-upside-down-kick` — Anti-air with Upside Down Kick                                    | response | 4:27.15–4:29.30   |

### October 2026 punish and damage routes

| Reference                                                                                                                           | Type  | Original interval |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `guile-garden-damage-pc-target-hurricane-od-flash` — Punish backfist: target combo, Hurricane and OD Flash Kick                     | combo | 0:56.85–1:03.05   |
| `guile-garden-damage-pc-link-hurricane-walk-od-flash` — Punish backfist: linked heavy, Hurricane and micro-walk kick                | combo | 1:05.00–1:10.72   |
| `guile-garden-damage-pc-double-hurricane` — Punish backfist into two Hurricane versions                                             | combo | 1:14.35–1:21.45   |
| `guile-garden-damage-pc-od-boom-hurricane` — Punish backfist into OD Boom and MP Hurricane                                          | combo | 1:24.15–1:30.30   |
| `guile-garden-damage-corner-heavy-medium-od-boom-flash` — Corner Rush heavy into OD Boom and heavy Flash Kick                       | combo | 1:35.90–1:40.70   |
| `guile-garden-damage-corner-target-hurricane-od-flash` — Corner Rush target combo into Hurricane and OD Flash Kick                  | combo | 1:43.05–1:49.00   |
| `guile-garden-damage-corner-high-kick-od-boom-flash` — Corner Rush medium into high kick and OD Boom                                | combo | 1:51.60–1:56.35   |
| `guile-garden-damage-corner-linked-heavy-double-hurricane` — Corner Rush medium into linked heavy and double Hurricane              | combo | 1:58.75–2:06.10   |
| `guile-garden-damage-corner-crouching-heavy-hurricane-od-flash` — Corner crouching-heavy juggle through Hurricane and OD Flash Kick | combo | 2:17.85–2:24.90   |
| `guile-garden-damage-corner-heavy-boom-critical-art` — Corner Rush medium into crouching heavy and Critical Art                     | combo | 3:37.10–3:45.60   |
| `guile-garden-damage-corner-standing-high-kick-critical-art` — Standing corner target: high kick into Critical Art                  | combo | 4:25.65–4:34.85   |
| `guile-garden-damage-corner-standing-rush-extension-critical-art` — Standing corner target: extra Rush heavy before Critical Art    | combo | 4:38.35–4:48.65   |
| `guile-garden-damage-corner-crouching-rush-extension-critical-art` — Crouching corner target: extra Rush heavy before Critical Art  | combo | 5:19.65–5:29.25   |
| `guile-garden-damage-away-from-wall-rush-extension-critical-art` — Away from the wall: Rush juggle carry into Critical Art          | combo | 5:46.65–6:00.65   |

### August 2026 loop variations

| Reference                                                                                                      | Type  | Original interval |
| -------------------------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `guile-garden-loops-standing-rush-knee-double-level1` — Standing target: Rush knee into two Level 1s           | combo | 1:59.20–2:08.45   |
| `guile-garden-loops-crouching-rush-heavy-level1` — Crouching target: Rush heavy kick into Level 1              | combo | 2:09.65–2:16.70   |
| `guile-garden-loops-standing-rush-low-three-booms` — Standing target: Rush low into three light Booms          | combo | 3:39.85–3:47.35   |
| `guile-garden-loops-crouching-rush-low-mixed-booms` — Crouching target: Rush low with light–medium–light Booms | combo | 3:57.90–4:03.50   |
| `guile-garden-loops-blocked-blade-rush-overhead-loop` — Blocked Blade into Rush overhead and a three-Boom loop | setup | 8:59.35–9:08.35   |
| `guile-garden-loops-crouching-big-rush-medium-loop` — Crouching Zangief: Rush medium into a short Boom loop    | combo | 9:33.80–9:39.30   |

### May 2026 setplays

| Reference                                                                                                     | Type  | Original interval |
| ------------------------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `guile-kajiba-oki-heavy-flash-high-frame-kill` — Heavy Flash Kick: Guile High timing                          | setup | 0:20.30–0:21.70   |
| `guile-kajiba-oki-heavy-flash-light-blade-guard` — Heavy Flash Kick: light Blade into guard                   | setup | 1:00.05–1:01.50   |
| `guile-kajiba-oki-double-bullet-heavy-flash-jump-guard` — Double Bullet ender: conditional jump and guard     | setup | 1:42.32–1:44.50   |
| `guile-kajiba-oki-heavy-level1-medium-kick-jump-guard` — Heavy Level 1: medium-kick frame kill into jump      | setup | 2:09.62–2:11.60   |
| `guile-kajiba-oki-heavy-level1-double-dash-throw` — Heavy Level 1: frame kill, two dashes and throw           | setup | 2:26.12–2:28.25   |
| `guile-kajiba-oki-counter-di-late-heavy-level1-side-switch` — Counter DI: delayed heavy kick into side switch | setup | 2:39.05–2:46.40   |
| `guile-kajiba-oki-level3-rush-knee-bazooka` — Level 3: Rush Knee Bazooka pressure                             | setup | 3:13.32–3:15.60   |
| `guile-kajiba-oki-punish-throw-midscreen-back-knuckle` — Punish-counter throw: midscreen back knuckle         | setup | 3:37.75–3:42.20   |
