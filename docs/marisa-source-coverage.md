# Marisa source coverage and review

> Audio update, 12 November 2026: prepared clips now include their original source audio and start muted in the player. Earlier references to silent clips below describe the original source-review pass. Video, annotations and execution revisions are unchanged; see the [restoration record](../content/audio-restoration.json).

Reviewed on 12 November 2026.

The collection now has **85 references and 405 selected moments**, up from 14 references and 59 moments. The 71 additions comprise 10 combos, 45 setups and 16 responses. The original 14 reference objects, revisions, related links, media and source record are preserved exactly.

## Sources

- [Joe Ebios: Classic Marisa Combos & Setup guide season3](https://www.youtube.com/watch?v=kB_QYkNRvBs), published 31 January 2026 UTC. The retained recording is 1308.914 seconds; the source reports 1309. Existing source identity and SHA-256 remain unchanged.
- [iZonk Gaming: Marisa beginner guide](https://www.youtube.com/watch?v=BZoam-rO1A0), published 7 June 2023 UTC. Three successful jump responses are selected from a limited chapter review. The retained recording is 1064.183333 seconds; the source reports 1064. Narration and visible animation corroborate the actions; this companion recording hides input history.

Exact source records are in `content/sources/`. [The source ledger](source-ledgers/marisa.json) records both original MP4 and metadata hashes, publication dates, surveyed intervals and a full clock partition for each recording. Every selected interval binds to a reference. All remaining intervals are explicitly unprocessed for execution extraction. A whole-source discovery survey does not establish full extraction or source exhaustion.

## Practice coverage

The expansion adds light-, medium- and heavy-Dimachaerus knockdown branches; normal and held-button confirms; crouching-medium and medium-kick punishes; forward-medium links; counter-hit and Drive-Rush options; guard-to-punish and counter-Impact responses. Corner practice includes light-Phalanx knockdowns, whiffed jab/medium frame kills, held-heavy and low conversions, recorded trades, throw versus shimmy choices, held-Level-1 aftermath and forward/back-throw trees. Enfold practice includes strike/throw approaches and separate recorded reversal responses for Ryu, Juri, Cammy, Guile and Ed. Three companion clips demonstrate grounded Scutum interception, crouching-heavy jump interception and a jumping-medium target response.

The original libraries already contain corner counter-Impact, wall-splat and cash-out samples. This expansion does not repeat those solely to increase a count. Additional source resource permutations, maximum-damage routes and most companion-guide chapters remain unprocessed. This is a practical, broader compendium; it is not complete matchup coverage or current-patch certification.

## Interpretation and limits

Every entry is `source-reviewed` with `gameVersion: null`. That records review against dated footage, not an in-game test on the current patch. Captions support the review, while native HUD, input history, action order and opponent behavior decide the recipe. The companion guide's hidden input display is called out rather than inferred.

- Prerequisite knockdown, opponent response, spacing and available resources are explicit. Resources spent before the selected clip are separate from the listed sequence cost.
- Printed +31, +35, +36, +42 and +47 are source advantage observations, not extra wait commands. Delays without a verified numeric count remain nonnumeric.
- Held standing HP, held back HP and held crouching HP are distinct, even when the standing hold animation lowers Marisa's posture. Dimachaerus includes its separate forward-punch follow-up.
- The seven Phalanx setups require the recorded light `623LP` juggle ender and corner spacing. A generic source `623P` caption is not evidence that every strength gives the same setup.
- Whiffed timing normals, blocked pressure, clean hits, Counter Hits, Punish Counters and trades are not interchangeable. No throw or shimmy is guaranteed against every defensive choice.
- The two safe-jump demonstrations show forward jump and jumping HP missing the recorded Ryu OD reversal, followed by landing guard. They do not certify universal reversal safety.
- Normal light-kick Scutum can briefly flash gold. The demonstrated `214LK` throws are not mislabeled as OD.
- Enfold versus Ryu evades the recorded OD Shoryuken through the throw-recovery posture. Juri, Cammy and Guile examples absorb 100, 300 and 300 damage through armor; they are not damage-free blocks or demonstrated follow-up punishes. The Ed example crouch-blocks after the whiffed jab and guards later active hits. Caption-only opponent names are not presented as recorded demonstrations.

## Media preparation

Full 1280×720 frames retain HUD, inputs and overlays. Each new reference has a short silent H.264 loop, selected JPEG action moments and canonical WebVTT descriptions on a zero-based presentation clock. All 346 new moments and 142 actual first/last decoded frames were visually inspected; affected loops and moments were regenerated and rechecked to remove source transitions and incorrect action timing. Mechanical decoding, image, duration and description checks are recorded separately. Originals, captions, probes and review sheets stay outside Git.

`content/media-marisa.json` records owner-authorized public-repository status. Public redistribution remains unassessed. Long lessons remain external links.

## Selected reference index

| Reference                                                                                                                         | Type     | Source       | Original seconds |
| --------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------ | ---------------- |
| `marisa-ebios-three-jabs-light-dimachaerus` — Three crouching jabs into light Dimachaerus                                         | combo    | Joe Ebios    | 3.05–7.30        |
| `marisa-ebios-counter-jab-light-kick-dimachaerus` — Counter-hit jab: light kick into Dimachaerus                                  | combo    | Joe Ebios    | 96.15–100.30     |
| `marisa-ebios-counter-light-target-medium-dimachaerus` — Counter-hit light target into medium Dimachaerus                         | combo    | Joe Ebios    | 101.10–104.95    |
| `marisa-ebios-medium-target-od-held-heavy` — Medium target: OD Dimachaerus into held heavy                                        | combo    | Joe Ebios    | 626.15–631.95    |
| `marisa-ebios-corner-medium-rush-quadriga-phalanx` — Corner medium target: Rush into OD Quadriga and Phalanx                      | combo    | Joe Ebios    | 633.10–638.70    |
| `marisa-ebios-medium-target-double-rush-level-three` — Medium-target cash-out: double Rush into Level 3                           | combo    | Joe Ebios    | 640.05–650.90    |
| `marisa-ebios-corner-crouching-medium-punish-quadriga` — Crouching-medium punish: OD Quadriga into Phalanx                        | combo    | Joe Ebios    | 659.05–664.05    |
| `marisa-ebios-overhead-counter-jab-dimachaerus` — Overhead Counter Hit: jab into light Dimachaerus                                | combo    | Joe Ebios    | 671.05–675.50    |
| `marisa-ebios-shimmy-back-heavy-medium-target` — Shimmy punish: back heavy into medium target                                     | combo    | Joe Ebios    | 683.65–689.50    |
| `marisa-ebios-heavy-punish-medium-target` — Heavy Punish Counter: medium target into Dimachaerus                                  | combo    | Joe Ebios    | 712.70–717.10    |
| `marisa-ebios-corner-counter-di-held-quadriga` — Corner counter DI: held back heavy into OD Quadriga                              | combo    | Joe Ebios    | 1259.90–1268.50  |
| `marisa-ebios-wall-splat-od-phalanx-held-kick` — Blocked DI wall splat: OD Phalanx into held kick                                 | combo    | Joe Ebios    | 1269.15–1276.35  |
| `marisa-ebios-corner-phalanx-dash-jab-throw` — Corner Phalanx knockdown: dash, whiff jab and throw                                | setup    | Joe Ebios    | 357.45–361.45    |
| `marisa-ebios-corner-forward-throw-rush-throw` — Corner forward throw: Rush into delayed throw                                    | setup    | Joe Ebios    | 1149.20–1155.25  |
| `marisa-depth-light-knockdown-rush-overhead` — Light Dimachaerus knockdown: Rush overhead into three jabs                         | setup    | Joe Ebios    | 10.80–15.30      |
| `marisa-depth-light-knockdown-rush-delayed-low` — Light Dimachaerus knockdown: delayed Rush low into medium target                | setup    | Joe Ebios    | 20.10–24.80      |
| `marisa-depth-light-knockdown-rush-command-throw` — Light Dimachaerus knockdown: delayed Rush Scutum throw                        | setup    | Joe Ebios    | 28.75–33.60      |
| `marisa-depth-corner-light-whiff-jab-held-back-heavy` — Corner light Dimachaerus: whiff jab into held-heavy conversion            | setup    | Joe Ebios    | 42.75–49.30      |
| `marisa-depth-corner-light-whiff-jab-trade-quadriga` — Corner light Dimachaerus: held-heavy trade into OD Quadriga                | setup    | Joe Ebios    | 53.10–58.60      |
| `marisa-depth-corner-light-whiff-jab-command-throw` — Corner light Dimachaerus: whiff jab into Scutum throw                       | setup    | Joe Ebios    | 62.25–66.35      |
| `marisa-depth-corner-light-whiff-medium-throw` — Corner light Dimachaerus: whiff medium punch into normal throw                   | setup    | Joe Ebios    | 75.65–78.80      |
| `marisa-depth-corner-light-whiff-medium-shimmy` — Corner light Dimachaerus: whiff medium punch and shimmy                         | setup    | Joe Ebios    | 82.55–88.10      |
| `marisa-depth-corner-light-whiff-medium-low` — Corner light Dimachaerus: whiff medium punch into low confirm                      | setup    | Joe Ebios    | 91.50–94.65      |
| `marisa-depth-counter-light-target-two-rush-level-three` — Counter-hit light target: double-Rush Level 3 cash-out                 | combo    | Joe Ebios    | 105.65–116.90    |
| `marisa-depth-raw-rush-low-light-kick-dimachaerus` — Raw Rush low: standing light kick into light Dimachaerus                     | combo    | Joe Ebios    | 118.15–121.95    |
| `marisa-depth-guard-drive-reversal-jab-heavy-punish` — Guard Drive Reversal: jab punish into held heavy punch                     | response | Joe Ebios    | 123.15–128.95    |
| `marisa-depth-raw-rush-low-counter-heavy` — Raw Rush low Counter Hit: back heavy into held-heavy ender                            | combo    | Joe Ebios    | 130.55–136.10    |
| `marisa-depth-raw-rush-jab-heavy` — Raw Rush jab: back heavy into held-heavy ender                                                | combo    | Joe Ebios    | 137.15–142.15    |
| `marisa-depth-scutum-grounded-jump-interception` — Grounded Scutum: intercept the recorded jump                                   | response | iZonk Gaming | 74.75–77.00      |
| `marisa-depth-crouching-heavy-jump-interception` — Grounded crouching heavy: intercept the incoming jump                          | response | iZonk Gaming | 83.90–86.35      |
| `marisa-depth-air-to-air-medium-target` — Air-to-air medium target: two punches in one jump                                       | response | iZonk Gaming | 94.40–96.90      |
| `marisa-depth-heavy-knockdown-empty-jump-throw` — Held-heavy knockdown: empty forward jump into throw                             | setup    | Joe Ebios    | 154.20–158.50    |
| `marisa-depth-heavy-knockdown-dash-walk-throw` — Held-heavy knockdown: dash, walk and normal throw                                | setup    | Joe Ebios    | 162.25–166.80    |
| `marisa-depth-heavy-knockdown-dash-held-forward-kick` — Held-heavy knockdown: dash into held forward-heavy-kick juggle            | setup    | Joe Ebios    | 171.85–178.00    |
| `marisa-depth-held-level-one-rush-medium-heavy` — Held Level 1 knockdown: Rush medium kick into heavy juggle                      | setup    | Joe Ebios    | 223.20–229.15    |
| `marisa-depth-held-level-one-rush-heavy-medium-target` — Held Level 1 knockdown: Rush heavy punch into medium target              | setup    | Joe Ebios    | 234.15–238.90    |
| `marisa-depth-held-level-one-rush-low-medium-target` — Held Level 1 knockdown: Rush low into medium target                        | setup    | Joe Ebios    | 244.15–248.95    |
| `marisa-depth-corner-held-level-one-dash-medium-target` — Corner held Level 1: dash medium kick into target combo                 | setup    | Joe Ebios    | 253.30–257.65    |
| `marisa-depth-corner-held-level-one-dash-scutum-throw` — Corner held Level 1: dash into Scutum throw                              | setup    | Joe Ebios    | 262.85–267.85    |
| `marisa-depth-near-corner-heavy-target-safe-jump` — Near-corner heavy target: jump heavy punch and guard Ryu OD                   | response | Joe Ebios    | 318.75–321.70    |
| `marisa-depth-corner-phalanx-dash-held-heavy` — Corner Phalanx: dash into held-back-heavy juggle                                  | setup    | Joe Ebios    | 339.40–345.50    |
| `marisa-depth-corner-phalanx-dash-whiff-jab-low` — Corner Phalanx: dash, whiff jab and low confirm                                | setup    | Joe Ebios    | 366.00–370.35    |
| `marisa-depth-corner-phalanx-whiff-medium-held-heavy` — Corner Phalanx: whiff crouching medium into held-heavy juggle             | setup    | Joe Ebios    | 381.70–388.30    |
| `marisa-depth-corner-phalanx-whiff-medium-trade` — Corner Phalanx: whiff medium, heavy trade and OD wall bounce                   | setup    | Joe Ebios    | 393.15–398.95    |
| `marisa-depth-corner-phalanx-whiff-low-medium-target` — Corner Phalanx: whiff crouching kick into meaty medium target             | setup    | Joe Ebios    | 410.40–414.85    |
| `marisa-depth-corner-phalanx-whiff-low-scutum-throw` — Corner Phalanx: whiff crouching kick into Scutum throw                     | setup    | Joe Ebios    | 419.90–424.85    |
| `marisa-depth-corner-phalanx-safe-jump` — Corner Phalanx: jump heavy punch and guard Ryu OD                                       | response | Joe Ebios    | 429.80–432.30    |
| `marisa-depth-medium-knockdown-rush-throw` — Medium Dimachaerus knockdown: Rush into normal throw                                 | setup    | Joe Ebios    | 474.25–478.45    |
| `marisa-depth-medium-knockdown-rush-whiff-jab-shimmy` — Medium Dimachaerus knockdown: Rush whiff-jab shimmy                       | setup    | Joe Ebios    | 482.25–488.40    |
| `marisa-depth-medium-knockdown-rush-held-overhead-block-throw` — Medium knockdown: blocked Rush overhead into delayed throw       | setup    | Joe Ebios    | 497.20–501.45    |
| `marisa-depth-medium-knockdown-rush-held-overhead-block-shimmy` — Medium knockdown: blocked Rush overhead into shimmy             | setup    | Joe Ebios    | 504.85–511.75    |
| `marisa-depth-medium-knockdown-rush-held-overhead-hit` — Medium knockdown: held Rush overhead hit conversion                      | setup    | Joe Ebios    | 515.65–521.00    |
| `marisa-depth-medium-knockdown-rush-held-kick-block-throw` — Medium knockdown: blocked held Rush kick into delayed throw          | setup    | Joe Ebios    | 530.65–535.35    |
| `marisa-depth-medium-knockdown-rush-held-kick-block-shimmy` — Medium knockdown: blocked held Rush kick into shimmy                | setup    | Joe Ebios    | 538.45–545.00    |
| `marisa-depth-medium-knockdown-rush-held-kick-hit-target-ender` — Medium knockdown: held Rush kick into heavy target ender        | setup    | Joe Ebios    | 548.65–555.20    |
| `marisa-depth-medium-knockdown-rush-delayed-scutum` — Medium Dimachaerus knockdown: delayed Rush Scutum throw                     | setup    | Joe Ebios    | 558.70–563.95    |
| `marisa-depth-corner-medium-whiff-jab-held-heavy` — Corner medium knockdown: whiff standing jab into held-heavy juggle            | setup    | Joe Ebios    | 568.10–574.50    |
| `marisa-depth-corner-medium-whiff-jab-scutum` — Corner medium knockdown: whiff standing jab into delayed Scutum throw             | setup    | Joe Ebios    | 578.25–583.75    |
| `marisa-depth-corner-medium-whiff-jab-rush-low-block-throw` — Corner medium knockdown: blocked Rush low into normal throw         | setup    | Joe Ebios    | 592.15–596.50    |
| `marisa-depth-corner-medium-whiff-jab-rush-low-shimmy` — Corner medium knockdown: blocked Rush low into shimmy                    | setup    | Joe Ebios    | 600.25–606.95    |
| `marisa-depth-corner-medium-whiff-jab-rush-low-hit` — Corner medium knockdown: Rush low into heavy juggle                         | setup    | Joe Ebios    | 610.95–617.30    |
| `marisa-depth-corner-medium-whiff-forward-medium-throw` — Corner medium knockdown: whiff forward medium into throw                | setup    | Joe Ebios    | 620.80–624.35    |
| `marisa-depth-crouching-medium-rush-heavy` — Crouching medium confirm: Rush kick into held-heavy ender                            | combo    | Joe Ebios    | 651.95–658.35    |
| `marisa-depth-medium-kick-punish-held-heavy` — Standing medium punish: back heavy into held-heavy ender                           | combo    | Joe Ebios    | 664.80–670.35    |
| `marisa-depth-forward-medium-punish-standing-light-kick` — Forward-medium punish: standing light kick into light Dimachaerus      | combo    | Joe Ebios    | 676.45–680.65    |
| `marisa-depth-corner-rush-low-shimmy-heavy-phalanx` — Corner Rush low: shimmy into heavy-Dimachaerus punish                       | setup    | Joe Ebios    | 699.20–705.80    |
| `marisa-depth-counter-heavy-two-jabs-light-dimachaerus` — Counter-hit standing heavy: two jabs into light Dimachaerus             | combo    | Joe Ebios    | 707.70–712.30    |
| `marisa-depth-guard-ryu-od-held-heavy-punish` — Guard Ryu OD: held-heavy punish without meter                                     | response | Joe Ebios    | 724.40–731.35    |
| `marisa-depth-guard-ryu-od-held-heavy-double-rush-level-three` — Guard Ryu OD: held-heavy double-Rush Level 3 cash-out            | response | Joe Ebios    | 731.85–746.45    |
| `marisa-depth-corner-guard-od-held-heavy-quadriga-level-one` — Corner OD punish: held heavy, OD wall bounce and Level 1           | response | Joe Ebios    | 791.90–800.70    |
| `marisa-depth-guard-ryu-held-crouching-heavy-rush-level-one` — Shoryuken punish: charged crouching-heavy juggle into held Level 1 | response | Joe Ebios    | 950.05–961.70    |
| `marisa-depth-heavy-kick-punish-rush-target-sweep` — Standing heavy-kick punish: Rush target into sweep ender                     | combo    | Joe Ebios    | 1028.35–1035.85  |
| `marisa-depth-near-corner-heavy-kick-rush-od-quadriga` — Near-corner heavy-kick punish: Rush into OD wall bounce                  | combo    | Joe Ebios    | 1108.60–1115.30  |
| `marisa-depth-midscreen-counter-impact-heavy-juggle` — Midscreen counter-DI: held-heavy conversion without OD                     | response | Joe Ebios    | 1249.65–1259.15  |
| `marisa-depth-corner-forward-throw-rush-heavy` — Corner forward throw: Rush heavy into corner juggle                              | setup    | Joe Ebios    | 1141.85–1148.35  |
| `marisa-depth-corner-back-throw-rush-delayed-throw` — Corner back throw: Rush into delayed normal throw                           | setup    | Joe Ebios    | 1158.65–1162.80  |
| `marisa-depth-corner-back-throw-rush-whiff-jab-shimmy` — Corner back throw: Rush whiff-jab shimmy                                 | setup    | Joe Ebios    | 1166.10–1172.75  |
| `marisa-depth-corner-back-throw-rush-held-heavy` — Corner back throw: held Rush heavy into corner juggle                          | setup    | Joe Ebios    | 1175.85–1182.75  |
| `marisa-depth-enfold-rush-medium-heavy` — Enfold knockdown: Rush medium kick into heavy juggle                                    | setup    | Joe Ebios    | 1187.80–1193.80  |
| `marisa-depth-enfold-rush-medium-trade-heavy` — Enfold knockdown: Rush medium-kick trade conversion                               | setup    | Joe Ebios    | 1198.80–1205.20  |
| `marisa-depth-enfold-rush-whiff-throw-ryu-od` — After Enfold versus Ryu OD: Rush and whiff a throw                                | response | Joe Ebios    | 1210.15–1213.20  |
| `marisa-depth-enfold-rush-od-scutum-juri` — After Enfold versus Juri OD: Rush into OD Scutum                                      | response | Joe Ebios    | 1218.45–1220.85  |
| `marisa-depth-enfold-rush-light-gladius-cammy` — After Enfold versus Cammy OD: Rush into light Gladius                            | response | Joe Ebios    | 1226.10–1228.75  |
| `marisa-depth-enfold-rush-held-od-gladius-guile` — After Enfold versus Guile OD: Rush into held OD Gladius                        | response | Joe Ebios    | 1234.65–1238.20  |
| `marisa-depth-enfold-rush-whiff-jab-ed` — After Enfold versus Ed OD: Rush, whiff jab and guard                                    | response | Joe Ebios    | 1243.20–1245.20  |
