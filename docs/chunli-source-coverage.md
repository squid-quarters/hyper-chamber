# Chun-Li source coverage and review

Reviewed on 10 November 2026.

The Chun-Li collection contains 52 selected references: 40 combos, 9 setups and 3 defensive responses, with 298 annotated moments. Every reference has a silent looping replay, selected stills and timed action descriptions. This is a curated practice collection rather than an exhaustive character guide or a transcription of every source variation.

## Sources

- [Sea Leaf Dojo: SF6 S4 Chun-Li Practical Combo Guide with Input and Notes](https://www.youtube.com/watch?v=HGhnSWBphn8), 18 August 2026 UTC. The creator description labels this guide for version 20260803. 46 selections cover light/medium/low confirms, Serenity Stream, charged SBK, grounded and airborne juggles, Super finishes, late-hit overheads, anti-airs, projectile conversions, throw baits, spacing-specific punishes and DI responses.
- [Sea Leaf Dojo: Combos and okizeme you should learn when starting Chun-Li](https://www.youtube.com/watch?v=Rv0yFk0yxac), 22 August 2025 UTC. 6 selections isolate wake-up choices after light SBK and one specific Level 2 → air medium → heavy-SBK finish. This older companion is linked by the creator’s S4 guide; that link does not certify its timing on the current patch.

The source records in `content/sources/` retain exact titles, download-metadata UTC dates, creator version labels and original-recording SHA-256 values. Creator chapter descriptions helped locate sections, but did not establish exact actions or cuts. Authors inspected recipe panels, virtual controls, input history, hit/block results, frame meters and resource spend. Printed alternatives were not automatically copied into the selected take. Full recordings and extraction workfiles remain outside Git.

## Interpretation and limits

All entries use `verification.status: source-reviewed` and `gameVersion: null`. None has been re-tested in the current game. Creator version labels, displayed damage and frame values describe dated demonstrations; they do not certify current-patch execution, damage, punish windows or reversal safety.

Serenity Stream entry (`SS`, 214P) and its selected follow-up are separate actions. Standing HP, back HP and down-forward HP are also distinct. The meaty overhead uses `df.HP` / `3HP`; it is not the stance-heavy-punch overhead. Traditional charged SBK routes retain the source’s down-charge cue. A stance-follow-up route records the demonstrated down/up execution without inventing a general charge-time exception or minimum frame count. Kikoken retains its back-charge cue. Raw Drive Rush and Drive Rush cancels are distinguished in the inputs and resource notes.

Air-to-air jumping medium, airborne stomp responses and grounded standing-heavy anti-airs have different starting conditions. One-hit versus two-hit jumping medium, stomp counts, delays, landing before grounded Tensho and the chosen air-Legs strength are recorded per take. Grounded Tensho uses a double-down kick input; it is not a charged SBK or an air-Legs special.

Hurtbox, crouching-state, spacing, Counter Hit, Punish Counter and late-hit/meaty conditions remain beside each reference. A caption’s suggested alternative is not an extra action in the replay. The directional-medium Rush take is transcribed from its performed inputs and hits where those differ from the recipe panel. Uncertain conversions, repeated Super variants, forced-knockdown anti-air cases not selected for this set and the final cinematic montage are omitted.

The older oki excerpts start after their prerequisite knockdown. Inputs show only the wake-up approach and choice; they do not repeat the preceding damage combo. Source-labelled +33F light-SBK pressure and +30F pressure after the particular Level 2/air-medium/heavy-SBK ender remain separate. Strikes in these examples connect as Counter Hits against Juri. They are not universal meaty, throw or reversal-safety guarantees. The selected corner OD-SBK jump check visibly guards Ryu’s OD Shoryuken; another OD-SBK jump-pressure example only demonstrates guarded pressure, so it is not labelled a proven reversal-safe jump.

Counter-DI crumple, blocked-DI wall splat and burnout stun are separate states. The selected side-switch DI conversion begins with Chun-Li near the corner and uses character-relative directions before and after the switch. The wall-splat example uses two raw Rushes, not two three-bar cancels. The Drive Reversal punish starts by blocking Juri’s reversal; the source heading does not mean Chun-Li spends Drive on a Rush there.

## Media preparation

Both recordings present gameplay in a 1024×576 window at x=256, y=0 inside a 1280×720 composition. New clips crop to that complete gameplay window, preserving health, Drive/Super meters, input history, hit counters and frame meters. The surrounding recipe and commentary panels are represented in the authored inputs, conditions and notes. Attribution and exact source links stay visible in the app; full original recordings remain local. `content/media-chunli.json` and both source records document the crop.

Accurate lossless H.264 intermediates apply the reviewed interval and crop before the unchanged canonical ingestion helper encodes silent clips, resets presentation clocks to zero, exports stills and writes WebVTT action descriptions. Key-moment times describe the prepared video timeline, not one-frame SF6 simulation stepping. Every selected still and both endpoints are visually inspected, including repeated takes and crossfades. Assets are private development excerpts; public redistribution has not been assessed.

## Reference index

### S4 practical guide selections

| Reference                                                                                                        | Type     | Original interval |
| ---------------------------------------------------------------------------------------------------------------- | -------- | ----------------- |
| `chunli-sealeaf-early-lights-medium-legs` — Three lights into medium Legs                                        | combo    | 0:10.95–0:14.05   |
| `chunli-sealeaf-early-lights-light-sbk` — Three lights into light Spinning Bird Kick                             | combo    | 0:17.80–0:21.15   |
| `chunli-sealeaf-early-crouching-lights-light-sbk` — All-crouching lights into light SBK                          | combo    | 0:24.45–0:27.65   |
| `chunli-sealeaf-early-lights-rush-stance-low-sbk` — Light confirm into Rush, stance low and SBK                  | combo    | 0:31.05–0:36.45   |
| `chunli-sealeaf-early-lights-rush-air-legs` — Light confirm into stance launch and air Legs                      | combo    | 0:39.75–0:45.45   |
| `chunli-sealeaf-early-lights-rush-stomps-air-level1` — Light confirm into three stomps and air Level 1           | combo    | 0:58.55–1:05.75   |
| `chunli-sealeaf-early-corner-lights-od-kikoken-sbk` — Corner lights through OD Kikoken and OD SBK                | combo    | 2:41.35–2:48.95   |
| `chunli-sealeaf-early-corner-wide-crouch-od-kikoken-legs` — Corner wide crouch: OD Kikoken into OD Legs          | combo    | 4:24.40–4:30.00   |
| `chunli-sealeaf-early-raw-rush-low-heavy-sbk` — Raw Rush low into heavy SBK                                      | combo    | 5:46.50–5:51.65   |
| `chunli-sealeaf-early-counter-hit-jab-medium-sbk` — Counter-hit jab into medium kick and SBK                     | combo    | 6:03.15–6:06.85   |
| `chunli-sealeaf-early-od-sbk-medium-legs-jump-pressure` — OD SBK into medium Legs and jump pressure              | setup    | 6:18.20–6:24.70   |
| `chunli-sealeaf-early-od-sbk-rush-jab-heavy-sbk` — OD SBK into Rush jab and heavy SBK                            | combo    | 6:47.05–6:53.15   |
| `chunli-sealeaf-early-corner-od-sbk-stomps-safe-jump` — Corner OD SBK into stomps and a safe-jump check          | setup    | 7:27.20–7:35.15   |
| `chunli-sealeaf-early-medium-level2-stance-tensho` — Medium confirm into Level 2, stance and Tensho              | combo    | 7:38.30–7:48.40   |
| `chunli-sealeaf-early-level2-delayed-air-medium-side-switch` — Level 2 into delayed air medium and side switch   | setup    | 8:29.75–8:37.90   |
| `chunli-sealeaf-early-corner-lights-level3-cashout` — Corner lights into stance, air target and Level 3          | combo    | 3:16.45–3:27.65   |
| `chunli-sealeaf-middle-medium-charged-heavy-sbk` — Medium punches into charged heavy SBK                         | combo    | 9:58.55–10:02.65  |
| `chunli-sealeaf-middle-counter-medium-low-charged-sbk` — Counter-hit medium into a charged SBK link              | combo    | 10:48.72–10:51.45 |
| `chunli-sealeaf-middle-low-rush-stance-heavy-sbk` — Low Rush cancel into stance and heavy SBK                    | combo    | 11:10.60–11:15.45 |
| `chunli-sealeaf-middle-corner-low-legs-tensho` — Corner low confirm into Legs and Tensho                         | combo    | 13:21.35–13:26.60 |
| `chunli-sealeaf-middle-counter-low-stance-medium` — Counter-hit low into stance medium punch                     | combo    | 14:27.70–14:30.55 |
| `chunli-sealeaf-middle-punish-low-stance-medium-sbk` — Punish-counter low into stance and medium SBK             | combo    | 14:33.60–14:37.75 |
| `chunli-sealeaf-middle-raw-rush-low-stance-sbk` — Raw Rush low into stance and medium SBK                        | combo    | 15:12.70–15:16.60 |
| `chunli-sealeaf-middle-direction-medium-rush-stance-sbk` — Forward medium Rush confirm into heavy SBK            | combo    | 16:19.45–16:24.45 |
| `chunli-sealeaf-middle-counter-heavy-stance-medium-sbk` — Counter-hit heavy into stance light kick               | combo    | 16:27.75–16:31.70 |
| `chunli-sealeaf-middle-punish-heavy-stance-heavy-sbk` — Punish-counter heavy into stance medium kick             | combo    | 16:35.05–16:39.65 |
| `chunli-sealeaf-middle-meaty-overhead-lights-charged-sbk` — Meaty overhead into two lights and SBK               | combo    | 17:17.48–17:21.30 |
| `chunli-sealeaf-middle-rush-overhead-mediums-charged-sbk` — Rush overhead into medium punches and SBK            | combo    | 17:24.30–17:30.05 |
| `chunli-sealeaf-middle-stance-overhead-heavy-sbk` — Stance overhead into heavy SBK                               | combo    | 17:53.10–17:57.45 |
| `chunli-sealeaf-middle-stance-overhead-od-sbk-light-juggle` — Stance overhead into OD SBK and light SBK          | combo    | 18:00.55–18:06.10 |
| `chunli-sealeaf-middle-corner-rush-meaty-overhead-legs-tensho` — Corner Rush meaty overhead into Legs and Tensho | combo    | 17:43.95–17:50.15 |
| `chunli-sealeaf-late-air-medium-level1` — Air-to-air medium into airborne Level 1                                | combo    | 19:36.35–19:40.70 |
| `chunli-sealeaf-late-crossup-stomp-tensho` — Cross-up response: stomp into Tensho                                | combo    | 20:19.55–20:24.45 |
| `chunli-sealeaf-late-heavy-anti-air-stance-tensho` — Standing heavy anti-air into stance and Tensho              | combo    | 21:00.75–21:05.55 |
| `chunli-sealeaf-late-light-kikoken-rush-confirm` — Light Kikoken into Rush and a stance confirm                  | combo    | 22:54.45–23:00.45 |
| `chunli-sealeaf-late-od-legs-punish-stance-tensho` — OD Legs punish into dash, stance and Tensho                 | combo    | 23:43.40–23:50.30 |
| `chunli-sealeaf-late-medium-hazanshu-punish-charge` — Medium Hazanshu punish into charged SBK                    | combo    | 25:34.75–25:39.70 |
| `chunli-sealeaf-late-heavy-hazanshu-punish-stance` — Heavy Hazanshu punish into stance light kick                | combo    | 25:43.15–25:48.70 |
| `chunli-sealeaf-late-od-hazanshu-two-stomps` — OD Hazanshu into two stomps and air Legs                          | combo    | 26:48.10–26:53.30 |
| `chunli-sealeaf-late-throw-bait-stomp-confirm` — Air-stomp throw bait into a charged confirm                     | response | 28:31.65–28:37.25 |
| `chunli-sealeaf-late-forward-heavy-punish-sbk` — Forward heavy punish into stance and SBK                        | combo    | 30:39.35–30:44.30 |
| `chunli-sealeaf-late-block-drive-reversal-punish` — Block Drive Reversal into a stance punish                    | response | 33:43.65–33:49.55 |
| `chunli-sealeaf-late-counter-di-stance-sbk` — Counter DI into a stance SBK route                                 | combo    | 33:52.45–34:00.45 |
| `chunli-sealeaf-late-counter-di-side-switch` — Counter DI into a side-switch kick and SBK                        | combo    | 34:14.10–34:21.05 |
| `chunli-sealeaf-late-wall-splat-double-rush` — Blocked DI into two Rush juggles                                  | combo    | 34:34.15–34:43.80 |
| `chunli-sealeaf-late-rush-back-heavy-hazanshu` — Rush back-heavy punish into Hazanshu and SBK                    | response | 35:19.15–35:24.70 |

### Older beginner oki selections

| Reference                                                                                               | Type  | Original interval |
| ------------------------------------------------------------------------------------------------------- | ----- | ----------------- |
| `chunli-sealeaf-oki-light-sbk-dash-medium` — Light SBK: dash, walk, medium check                        | setup | 0:16.95–0:19.25   |
| `chunli-sealeaf-oki-light-sbk-dash-low` — Light SBK: dash, walk, low check                              | setup | 0:22.15–0:24.20   |
| `chunli-sealeaf-oki-light-sbk-dash-throw` — Light SBK: dash, walk, normal throw                         | setup | 0:27.25–0:30.80   |
| `chunli-sealeaf-oki-light-sbk-rush-overhead` — Light SBK: Rush delayed overhead                         | setup | 0:34.15–0:37.00   |
| `chunli-sealeaf-oki-light-sbk-rush-low` — Light SBK: Rush delayed low                                   | setup | 0:39.65–0:42.20   |
| `chunli-sealeaf-oki-level2-air-medium-sbk-rush-overhead` — Level 2 air-medium SBK finish: Rush overhead | setup | 1:42.15–1:44.65   |
