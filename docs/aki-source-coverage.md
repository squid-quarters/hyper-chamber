# A.K.I. source coverage and review

Reviewed on 12 November 2026.

The library contains **61 references** (31 combos, 20 setups and 10 responses), expanded from 12. The 49 additions supply heavy-Lash and poison-pool wake-up trees, five corner forward-throw branches, current-source low/medium links, poison-state punish conversions, four anti-air conversions and concrete DI/stun routes. [The source ledger](source-ledgers/aki.json) lists every selected interval and the exact unselected timeline complements. Whole-source extraction remains incomplete.

## Sources

- [VesperArcade: STREET FIGHTER 6 A.K.I. COMBOS! Starter Combo Guide](https://www.youtube.com/watch?v=Eb6Jx3507eI), 2023-09-28 UTC. Provenance: `content/sources/vesperarcade-aki-2023.json`.
- [Joe Ebios: SF6 Classic A.K.I. Combos & Setup Guide the March Update 【STREET FIGHTER 6】](https://www.youtube.com/watch?v=L0CwNWqhc8o), 2026-05-08 UTC. Provenance: `content/sources/joe-ebios-aki-2026.json`.

## Interpretation and practical limits

All original 12 reference objects, IDs, revisions, related links and media are retained exactly. The Vesper recording has recipe overlays without live input history. The new Joe recording retains its live buttons, training HUD and poison effects. Sources are marked `source-reviewed`, `gameVersion: null`; current-patch execution has not been tested in-game.

Poison before the starter is a real prerequisite, not an inferred property of every Lash route. The selected poisoned-light route requires a standing defender: the next source take shows medium Lash missing against a crouching Ryu. The force-stand overhead card demonstrates a separate way to address an initially crouching target. Counter-hit and punish-counter links, ordinary wall crush and Burnout stun remain distinct.

Setup loops begin after the named heavy-Lash, crouching-heavy, pool or forward-throw knockdown. Repeated prerequisite combos are not counted as more references. Frame-kill whiffs are present in compact/copy notation. Printed `+44`, `+38`, `+27`, `+7` and `+5` are remaining advantage, not invented waits. The midscreen Snake-Step shimmy retains the source’s back-recovery-only limit. Its whiffed-throw companion also shows back recovery.

The jump-heavy-kick landing block demonstrates Ryu OD uppercut specifically. Bubble plus OD Snake Step demonstrates Ryu Level 3 missing while A.K.I. changes sides; it does not certify every Super matchup. Poison anti-air Rush pickups retain the demonstrated separation/height limits. OD Pulse is an airborne counter-hit example, not a grounded-confirm promise.

Only the Supers performed in the clips are authored: source headings such as “any SA” do not become additional choices. OD/Rush/DI costs exclude prerequisite actions outside the loop. The stun pool conversion starts after the Burnout wall-DI, so that prior DI cost is explicitly separate.

## Media review and remaining work

Silent H.264 loops preserve the full source frame. Each new selected JPEG moment and both actual prepared endpoints are reviewed, with fine original input/boundary probes where needed. Several source dissolves into the following take were removed, the forward-heavy frame kill in the corner low branch was widened, and selected stills were aligned to the named actions before the final mechanical decode/timing/VTT/mapping audit. Original recordings and QA boards stay local; redistribution has not been assessed.

Remaining work includes the long double-DRC and stun cash-outs, other Toxic-Blossom special starters, light-Lash PC families and unselected pressure branches. The ledger records those gaps explicitly; the whole source is not claimed exhausted. Metadata-only companion links have no execution-review status.

## Reference index

| Reference                                                                                          | Type     | Source       | Original interval |
| -------------------------------------------------------------------------------------------------- | -------- | ------------ | ----------------- |
| `aki-lights-toxic-wreath` — Lights into Toxic Wreath                                               | combo    | VesperArcade | 0:22.35–0:27.35   |
| `aki-low-lights-heavy-lash` — Low lights into heavy Lash                                           | combo    | VesperArcade | 0:29.10–0:33.20   |
| `aki-poison-low-lash-juggle` — Poisoned low confirm into light Lash                                | combo    | VesperArcade | 0:35.95–0:40.20   |
| `aki-low-lights-level-three` — Low lights into Level 3                                             | combo    | VesperArcade | 1:03.15–1:16.35   |
| `aki-medium-pulse-chaser` — Medium confirm into Pulse and Chaser                                   | combo    | VesperArcade | 1:21.45–1:25.50   |
| `aki-close-medium-od-pulse` — Close medium confirm into OD Pulse                                   | combo    | VesperArcade | 1:27.25–1:32.30   |
| `aki-poison-medium-lash-juggle` — Poisoned medium confirm into Lash juggle                         | combo    | VesperArcade | 1:35.05–1:40.25   |
| `aki-low-medium-jab-lash` — Low medium kick into jab and Lash                                      | combo    | VesperArcade | 1:59.10–2:03.70   |
| `aki-forward-heavy-jabs` — Forward heavy kick into lights                                          | combo    | VesperArcade | 2:47.30–2:52.45   |
| `aki-heavy-slide-heel-strike` — Heavy kick into Sinister Slide                                     | combo    | VesperArcade | 2:59.45–3:05.55   |
| `aki-wall-splat-wreath-level-one` — Wall splat into Wreath and Level 1                             | combo    | VesperArcade | 3:48.20–3:58.80   |
| `aki-corner-poison-pool-ender` — Corner poison route into Orchid Spring                            | setup    | VesperArcade | 11:59.88–12:05.50 |
| `aki-depth-light-target-heavy-lash` — Four-light target chain to heavy Lash                        | combo    | Joe Ebios    | 0:03.10–0:06.80   |
| `aki-depth-heavy-lash-step-throw` — Heavy Lash: Snake Step into throw                              | setup    | Joe Ebios    | 0:16.55–0:20.40   |
| `aki-depth-heavy-lash-step-whiff-throw-lash` — Heavy Lash: whiffed throw into medium Lash          | setup    | Joe Ebios    | 0:24.05–0:28.90   |
| `aki-depth-heavy-lash-step-shimmy` — Heavy Lash: back-recovery shimmy conversion                   | setup    | Joe Ebios    | 0:31.75–0:43.40   |
| `aki-depth-heavy-lash-step-low` — Heavy Lash: Snake Step low confirm                               | setup    | Joe Ebios    | 0:46.45–0:54.00   |
| `aki-depth-heavy-lash-step-heavy-trade` — Heavy Lash: heavy-kick trade pickup                      | response | Joe Ebios    | 0:57.55–1:03.90   |
| `aki-depth-heavy-lash-jump-guard-ryu-od` — Heavy Lash: jump kick, land and guard OD DP             | response | Joe Ebios    | 1:07.55–1:11.20   |
| `aki-depth-corner-heavy-lash-kill-throw` — Corner heavy Lash: whiff forward heavy, throw           | setup    | Joe Ebios    | 1:20.00–1:24.40   |
| `aki-depth-corner-heavy-lash-kill-shimmy` — Corner heavy Lash: frame kill, shimmy and pool         | setup    | Joe Ebios    | 1:28.00–1:37.35   |
| `aki-depth-corner-heavy-lash-kill-low` — Corner heavy Lash: frame kill into low conversion         | setup    | Joe Ebios    | 1:40.70–1:49.80   |
| `aki-depth-corner-heavy-lash-kill-trade` — Corner heavy Lash: frame kill, heavy-kick trade         | response | Joe Ebios    | 1:53.00–1:59.10   |
| `aki-depth-poison-light-target-medium-lash` — Poisoned standing target: lights to medium Lash      | combo    | Joe Ebios    | 2:01.00–2:06.20   |
| `aki-depth-counterhit-jab-medium-heavy-lash` — Counter-hit jab to medium punch and heavy Lash      | combo    | Joe Ebios    | 2:13.10–2:17.30   |
| `aki-depth-low-light-heavy-lash` — Low kick, light kick, heavy Lash                                | combo    | Joe Ebios    | 2:21.10–2:25.10   |
| `aki-depth-medium-pair-heavy-lash` — Medium kick to medium punch and heavy Lash                    | combo    | Joe Ebios    | 2:26.60–2:30.20   |
| `aki-depth-counterhit-low-od-lash-target` — Counter-hit low check: OD Lash into light target chain | response | Joe Ebios    | 2:31.60–2:38.90   |
| `aki-depth-punish-medium-crouch-heavy` — Standing medium punish into crouching-heavy knockdown     | combo    | Joe Ebios    | 2:40.45–2:43.15   |
| `aki-depth-crouch-heavy-walk-throw` — Crouching-heavy knockdown: walk into throw                   | setup    | Joe Ebios    | 2:45.80–2:50.10   |
| `aki-depth-poison-forward-heavy-force-stand` — Poisoned croucher: forward-heavy force-stand route  | combo    | Joe Ebios    | 3:15.05–3:21.05   |
| `aki-depth-counterhit-forward-heavy-medium` — Counter-hit forward heavy to medium and Lash         | combo    | Joe Ebios    | 3:28.05–3:32.60   |
| `aki-depth-sweep-level-one` — Sweep cancel into Level 1                                            | combo    | Joe Ebios    | 3:33.80–3:41.25   |
| `aki-depth-punish-sweep-rush-light-heavy` — Punish-counter sweep: Rush light kick to heavy Lash    | combo    | Joe Ebios    | 3:43.00–3:47.65   |
| `aki-depth-poison-punish-sweep-two-rush` — Poisoned punish-counter sweep: two-Rush extension       | combo    | Joe Ebios    | 3:51.70–3:57.85   |
| `aki-depth-heavy-punish-fate-lights` — Heavy-kick punish: heavy Fate into lights                   | combo    | Joe Ebios    | 4:07.00–4:13.45   |
| `aki-depth-corner-heavy-punish-od-pulse` — Corner heavy punish: OD Pulse and two Lashes            | combo    | Joe Ebios    | 4:34.75–4:42.55   |
| `aki-depth-corner-heavy-punish-level-one` — Corner heavy punish: OD Pulse into Level 1             | combo    | Joe Ebios    | 4:43.70–4:55.20   |
| `aki-depth-corner-heavy-punish-level-three` — Corner heavy punish: light Lash into Level 3         | combo    | Joe Ebios    | 4:56.55–5:14.65   |
| `aki-depth-pool-heavy-kill-walk-throw` — Poison pool: whiff heavy kick, walk and throw             | setup    | Joe Ebios    | 7:30.70–7:35.00   |
| `aki-depth-pool-heavy-kill-mediums` — Poison pool: frame kill into medium confirm                  | setup    | Joe Ebios    | 8:03.65–8:12.95   |
| `aki-depth-pool-bubble-overhead` — Poison pool: bubble into overhead conversion                    | setup    | Joe Ebios    | 8:21.85–8:31.85   |
| `aki-depth-pool-bubble-od-step-ryu-super` — Poison pool: bubble and OD Step evade Ryu Level 3      | response | Joe Ebios    | 8:40.45–8:45.60   |
| `aki-depth-pool-rush-throw` — Poison pool: Drive Rush throw                                        | setup    | Joe Ebios    | 8:54.70–8:59.30   |
| `aki-depth-poison-antiair-heavy-medium` — Poison anti-air: heavy Lash into medium Lash             | response | Joe Ebios    | 10:40.35–10:44.40 |
| `aki-depth-poison-antiair-rush-heavy-medium` — Poison anti-air: Rush heavy kick, medium Lash       | response | Joe Ebios    | 10:46.25–10:51.20 |
| `aki-depth-poison-antiair-rush-stance` — Poison anti-air: Rush heavy kick, stance punch            | response | Joe Ebios    | 10:53.60–10:58.85 |
| `aki-depth-pool-heavy-kill-shimmy` — Poison pool: frame kill, shimmy and pool reset                | setup    | Joe Ebios    | 7:44.65–7:54.70   |
| `aki-depth-pool-rush-overhead` — Poison pool: Rush overhead into repeat pool                       | setup    | Joe Ebios    | 9:27.25–9:36.30   |
| `aki-depth-corner-throw-walk-throw` — Corner forward throw: walk and throw again                   | setup    | Joe Ebios    | 13:11.60–13:15.90 |
| `aki-depth-corner-throw-walk-shimmy` — Corner forward throw: walk, shimmy and punish               | setup    | Joe Ebios    | 13:18.60–13:25.90 |
| `aki-depth-corner-throw-walk-mediums` — Corner forward throw: walk into medium confirm             | setup    | Joe Ebios    | 13:28.70–13:33.15 |
| `aki-depth-corner-throw-walk-overhead` — Corner forward throw: overhead and light target chain     | setup    | Joe Ebios    | 13:35.65–13:40.90 |
| `aki-depth-corner-throw-counterhit-overhead` — Corner forward throw: counter-hit overhead link     | setup    | Joe Ebios    | 13:44.00–13:49.00 |
| `aki-depth-rush-low-light-medium` — Raw Rush low: crouching light kick to medium punch             | combo    | Joe Ebios    | 13:58.20–14:02.65 |
| `aki-depth-rush-low-stance-target` — Raw Rush medium low: heavy kick and stance-kick lights        | combo    | Joe Ebios    | 14:09.70–14:16.30 |
| `aki-depth-rush-overhead-medium` — Raw Rush overhead: medium punch into heavy Lash                 | combo    | Joe Ebios    | 14:17.65–14:22.40 |
| `aki-depth-od-pulse-air-hit-rush` — OD Pulse air hit: Rush heavy kick to light Lash                | response | Joe Ebios    | 14:32.40–14:38.75 |
| `aki-depth-counter-di-stance-target` — Counter Drive Impact: stance kick into light target chain   | response | Joe Ebios    | 15:09.35–15:17.90 |
| `aki-depth-wall-crush-wreath-pool` — Wall crush: Wreath and Rush into poison pool                  | combo    | Joe Ebios    | 15:19.10–15:27.10 |
| `aki-depth-stun-pool-jump-route` — Burnout stun: pool, jump kick and repeat pool                   | combo    | Joe Ebios    | 15:32.50–15:44.90 |
