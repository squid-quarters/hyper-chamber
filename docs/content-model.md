# Reference content model

The runtime schema in `packages/reference` is shared by the reader and content checks. `content/dhalsim/references.json` is the curated catalog.

- `id` is stable; `revision` changes when execution or its conditions materially change.
- `kind` describes combo, setup, or response; `situations` describes when it applies; `outcomes` describes what it achieves.
- `notation`, ordered `inputs`, `conditions`, and short `notes` stay with each entry.
- `source` preserves creator, video URL/date, and start/end seconds in the original video.
- `media.frames[].at` is relative to the prepared clip; `alt` describes the observed action and `label` supplies a short execution cue.
- `verification.status` distinguishes extraction drafts from reviewed footage; `gameVersion: null` explicitly leaves current patch validation unestablished.
- `relatedIds` links canonical alternatives without copying the same entry into several categories.

A media improvement preserves the entry ID. Source-specific conditions must survive a replacement demonstration. Numerical resource costs and damage/frame values should only be added when the source or a recorded in-game check establishes them.

Browser notes/status/favorites use a separate versioned JSON envelope. Unknown valid reference IDs survive backups so that temporarily unavailable references do not destroy personal notes. A later content-revision workflow should surface reassessment when stored and catalog revisions differ.
