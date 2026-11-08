# 0002: Game context around a shared reference reader

Status: accepted.

Hyper Chamber is a fighting-game reference product. Street Fighter 6 / Dhalsim remains its only populated library. The user's interest in other fighting games broadens the product scope; it does not establish a verified second-game catalog.

## Shared and game-specific responsibilities

Keep reference playback, annotated frames, quick notes, favorites, personal status and source verification shared. A game definition supplies the displayed game name, character names, notation help, resource labels and outbound guide links. The reader loads one authored library context for now; a game selector needs another populated destination before it is useful.

Keep the broad reference kinds combo, setup and response. Situation and outcome tags come from the active library's authored content, so one game's categories do not become a universal vocabulary. Game profiles can later supply additional category metadata if actual content requires it; no taxonomy engine is introduced now.

Each reference declares its game and one or more participants. A participant has a local instance ID and a character ID scoped by that game. Individual input steps can identify their actor. Single-participant entries can omit actor IDs; multiple-participant sequences require explicit attribution. Do not assign permanent active/assist roles or infer actors from notation: those roles may change during an execution.

The current ordered step model remains. When a genuine long sequence needs it, introduce labeled phases that group existing step IDs and optionally identify clip-relative sections. Validate that interaction with real content before implementing branching or a timeline editor.

## Identity and migration

Reference IDs are global stable identities, not paths or display labels. Preserve the five existing IDs, their execution revisions, personal-library storage key and entry query links. Adding game metadata or reorganizing content does not change an execution or reset practice status. New entries across games must have unique IDs; character IDs can repeat across different games.

Files under a game's references directory are authoring groups, not a requirement that each reference belongs to exactly one fighter. Team material can declare several participants without being duplicated under each member.

## Initial boundaries

Only an SF6 profile and Dhalsim references are shipped. No 2XKO data, team construction screen, game picker, actor timeline, universal input translator or current-patch claim is added. The shared schema prepares actor attribution; presentation for a real multi-participant library will be designed and verified with that content.
