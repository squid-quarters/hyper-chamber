# Initial Dhalsim source audit

Reviewed on 3 November 2026.

Source: [DHALSIM COMBO/OKI GUIDE SF6](https://www.youtube.com/watch?v=UW6GlWHKy7o), by **elieatscrayons**, published 4 July 2025, duration 13:28.

## Evidence and limits

Metadata and chapter markers were extracted from YouTube. Selected 720p video sections were downloaded and inspected visually. Automatic English captions were listed, but their retrieval was rate-limited; they were not used or guessed. Input overlays, the visible input history, hit results and resource displays informed the initial entries.

The initial 46–80 second excerpt has a zero-based media timeline and a measured duration of 34.02995 seconds. The selected additional excerpts begin at 276 and 457 seconds. Source timestamps in the catalog are computed from those segment offsets. Prepared clips are re-encoded after decoding the input, rather than copied at arbitrary keyframes. Frame timestamps refer to the resulting clip's zero-based timeline.

All references are **source-reviewed**, with `gameVersion: null`. They have not been tested in the current SF6 training mode. No damage, current advantage, or exact cancel-window guarantees were added. Source-only numerical overlays remain visible in the footage and are historical evidence, not a new current-patch assertion.

The first route at the beginning of the 46-second sample was already in progress and was omitted. The medium-Blast Drive Rush route's back-medium image was corrected during visual review after an earlier sample caught the preceding crouching light punch.

## Extracted references

| Reference                      | Source interval | Reviewed content                                                                                                                             |
| ------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dhalsim-light-blast`          | 0:53.32–0:55.82 | Standing light punch, crouching light punch, medium Yoga Blast. The source explicitly restricts this route to a standing opponent.           |
| `dhalsim-low-sa3`              | 1:03.80–1:09.73 | Crouching light kick, crouching light punch, Level 3. Only the demonstrated Level 3 branch is included.                                      |
| `dhalsim-light-drive-blast`    | 1:09.73–1:12.75 | Light starter, cancel Drive Rush, crouching light punch, back medium punch, medium Blast. The heavy-Blast extension is separate.             |
| `dhalsim-counter-hit-anti-air` | 4:43.00–4:46.44 | Back heavy punch on an airborne counter hit, Drive Rush, back medium punch, heavy Blast, heavy slide. The slide follows the Blast.           |
| `dhalsim-blast-teleport`       | 7:38.35–7:40.08 | Grounded medium Blast into forward ground teleport, showing a side change and arrival position. No subsequent strike or throw is prescribed. |

Clips are silent. Persistent input notation, conditions, quick notes, annotated frame descriptions, and accompanying WebVTT descriptions carry the instructional information. Existing creator overlays are retained.

## MVP expansion

On 5 November 2026, eight more references were reviewed from the full 720p source, bringing the catalog to 13. The full file starts at PTS 0; a frame at 54 seconds independently matches the earlier reviewed light-Blast demonstration. New clips were decoded before cutting with source offset 0. The original five entries and their media remain unchanged.

| Reference                          | Source interval   | Reviewed content                                                                                                                                    |
| ---------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dhalsim-punish-heavy-blast`       | 3:34.30–3:37.15   | Standing heavy-kick punish counter, crouching heavy punch, heavy Blast. Only the heavy-Blast ender is included.                                     |
| `dhalsim-punish-rush-flame`        | 3:39.75–3:43.05   | Standing heavy-kick punish counter, raw Drive Rush, crouching heavy punch, heavy Flame.                                                             |
| `dhalsim-drive-impact-blast`       | 5:14.85–5:18.60   | DI crumple, back heavy punch, heavy Blast.                                                                                                          |
| `dhalsim-drive-impact-side-switch` | 5:25.05–5:29.24   | DI, instant air teleport, jumping light kick and standing heavy kick change sides; light Fire follows as blocked wake-up pressure.                  |
| `dhalsim-corner-double-blast`      | 5:44.55–5:46.40   | Heavy Blast into light Blast as a corner ender extension; the earlier starter is outside this reference.                                            |
| `dhalsim-corner-blast-flame`       | 9:56.75–9:59.65   | Medium-Blast corner juggle, connecting down-back heavy kick, then heavy Flame pressure after knockdown. The Flame is blocked in the footage.        |
| `dhalsim-corner-throw-fire`        | 11:25.30–11:29.90 | The source's “down throw” into light Fire pressure. The throw's button command is not inferred.                                                     |
| `dhalsim-midscreen-float-heavy`    | 8:04.62–8:06.95   | Medium Blast into float heavy kick after knockdown. “Safe jump” is attributed to the source rather than guaranteed against current-patch reversals. |

The additional footage is 29.97 fps; earlier excerpts were prepared from a 60 fps source variant. Reader timing nudges are measured in seconds and do not claim to step one SF6 simulation frame. Every new reference has a silent clip, annotated keyframes and WebVTT action descriptions. The catalog check enforces unique frame IDs and increasing frame times.

## Completion review — 7 November 2026

The completion pass covers all seven demonstration chapters: midscreen combos, punishes, anti-airs, Drive Impact, corner/stun routes, midscreen oki and corner oki. The [coverage index](source-coverage.md) lists each individual reference and its source interval. Distinct defensive outcomes and counter-hit conversions have their own cards. Repeated confirmations and text-only explanations are associated with their existing reference rather than counted as duplicate routes. Edited continuations explicitly state where the source omits the opener. A demonstrated Level-1 spacing failure is labelled as a failure, with successful alternatives linked nearby.

The supplied Gemini files were candidate indexes, not reviewed content or project instructions. The video's opening contains chapter markers rather than the claimed notation translation table. Numerous candidate strings and timestamps differ from the footage. Authors reviewed the original source, visible inputs, hit counters and prepared keyframes; independent reviewers checked the other author's source intervals and execution paths.

Material corrections include heavy versus medium Blast strengths, connecting corner down-back heavy kick versus a timing whiff, the timing slide after OD Flame, and the spacing example where standing heavy kick connects but the following Level 1 misses. Drive costs include the opening Drive Impact or approach when they are part of the indexed path. Source-only safe-jump and reversal demonstrations remain attributed to the July 2025 footage; they do not establish current-patch coverage.

The full 720p original has SHA-256 `a0d62151bc844bf914627e19c651e9630b3eaaace3220482a0619f26812af4fb` and remains outside Git. All new excerpts are prepared with source offset zero. A timing review at 438.95 seconds found that nonzero MP4 start times and a second rounded seek could select a still one frame ahead; that frame crossed into the next source take. Both input- and output-seek encodes exhibited the phase issue. The final preparation method trims original presentation timestamps, resets each clip's presentation clock to zero, and exports stills by the frame actually presented at or before the authored time. Real shot boundaries were corrected separately. Synthetic timing regressions fail with the previous method and pass with the final method. All new clips and stills were regenerated and checked again. No lossy proxy sections or stream-copy cuts are used.

All entries remain source-reviewed with `gameVersion: null`. Later work should verify execution and the applicable game version in SF6, and can replace tutorial footage with dedicated recordings while preserving stable reference IDs and source attribution.

## Provenance and publication

The GitHub repository is public. The repository owner confirmed public access, including prepared YouTube excerpts, on 12 November 2026; [publication metadata](../content/publication.json) records the scope. Third-party media licensing, permissions and redistribution rights remain unassessed. No media license or creator permission is implied by downloading the user-selected source or by licensing the application code. Publication authorization is separate from source review and in-game verification.

SF6 Lab remains an outbound resource for guides and broader reference: [Dhalsim overview](https://sf6-lab.net/en/fighters/dhalsim). Its content was not copied into the initial cards.
