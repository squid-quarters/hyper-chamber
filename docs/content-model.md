# Reference content model

The runtime schema in `packages/reference` is shared by the reader and content checks. `content/games/sf6/references/dhalsim.json` is the curated catalog.

- `id` is stable; `revision` changes when execution or its conditions materially change.
- `kind` describes combo, setup, or response; `situations` describes when it applies; `outcomes` describes what it achieves.
- `notation`, ordered `inputs`, `conditions`, and short `notes` stay with each entry.
- `source` preserves creator, video URL/date, and start/end seconds in the original video.
- `media.frames[].at` is relative to the prepared clip; `alt` describes the observed action and `label` supplies a short execution cue.
- `verification.status` distinguishes extraction drafts from reviewed footage; `gameVersion: null` explicitly leaves current patch validation unestablished.
- `relatedIds` links canonical alternatives without copying the same entry into several categories.

A media improvement preserves the entry ID. Source-specific conditions must survive a replacement demonstration. Numerical resource costs and damage/frame values should only be added when the source or a recorded in-game check establishes them.

Browser notes/status/favorites use a separate versioned JSON envelope. Unknown valid reference IDs survive backups so that temporarily unavailable references do not destroy personal notes. A later content-revision workflow should surface reassessment when stored and catalog revisions differ.

## Game and participant context

`content/games/<gameId>/game.json` defines game-facing labels and help. References are grouped under that game's `references/` directory. The current catalog is `content/games/sf6/references/dhalsim.json`.

- `gameId` identifies the rules and vocabulary context. Profile-aware catalog validation checks character IDs and resource keys against that game definition.
- `participants` contains local participant IDs and game-scoped character IDs; it can represent more than one performer without fixing permanent team roles.
- `inputs[].actorId` names a declared participant. It can be omitted for one participant; multiple-participant entries require explicit attribution on every step.
- `resources` is a keyed set of authored display values. The game profile supplies the labels. SF6 currently uses drive and super; those are not universal resource fields.
- `kind` remains a broad shared reference type; situation and outcome strings belong to the active game's authored library.
- IDs remain globally unique, related references stay within their game, and `filterReferences` can explicitly scope by game.

Adding game context and moving a file preserves the reference ID, existing links, learner data and execution revision. The schema supports participant attribution; a real multi-participant reference must still receive an appropriately designed and verified presentation before it is published.
