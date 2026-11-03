# Initial Dhalsim source audit

Reviewed on 3 November 2026.

Source: [DHALSIM COMBO/OKI GUIDE SF6](https://www.youtube.com/watch?v=UW6GlWHKy7o), by **elieatscrayons**, published 4 July 2025, duration 13:28.

## Evidence and limits

Metadata and chapter markers were extracted from YouTube. Selected 720p video sections were downloaded and inspected visually. Automatic English captions were listed, but their retrieval was rate-limited; they were not used or guessed. Input overlays, the visible input history, hit results and resource displays informed the initial entries.

The initial 46–80 second excerpt has a zero-based media timeline and a measured duration of 34.02995 seconds. The selected additional excerpts begin at 276 and 457 seconds. Source timestamps in the catalog are computed from those segment offsets. Prepared clips are re-encoded after decoding the input, rather than copied at arbitrary keyframes. Frame timestamps refer to the resulting clip's zero-based timeline.

All five references are **source-reviewed**, with `gameVersion: null`. They have not been tested in the current SF6 training mode. No damage, current advantage, or exact cancel-window guarantees were added. Source-only numerical overlays remain visible in the footage and are historical evidence, not a new current-patch assertion.

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

## Remaining extraction

The remainder of the general-combo chapter, punish routes, Drive Impact routes, corner/stun routes, other anti-air alternatives, remaining midscreen oki, and corner oki are not yet extracted into individual entries. Chapter metadata is preserved for later work; no empty entries imply coverage.

Later work should verify the exact execution and applicable game version in SF6, and can replace tutorial footage with dedicated recordings while preserving stable reference IDs and source attribution.

## Provenance and publication

The GitHub repository starts private. `content/media.json` records the excerpts as private development assets, with public redistribution not assessed. No media license or creator permission is implied by downloading the user-selected source or by licensing the application code. Keep that publishing decision separate from source review and in-game verification.

SF6 Lab remains an outbound resource for guides and broader reference: [Dhalsim overview](https://sf6-lab.net/en/fighters/dhalsim). Its content was not copied into the initial cards.
