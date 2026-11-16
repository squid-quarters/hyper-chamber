# Library updates and pack authoring

**Approved 16 November 2026; implemented in source for 1.1.0.** Published installers remain 1.0.0. The [implementation decision](../adr/0005-library-and-authoring.md) records the resulting contracts; verification belongs to the implementation PR. This plan started from canonical commit `239b744`.

Make application updates routine, preserve learner data, and let people create,
modify and share reference packs without developer tools or an AI agent.

## Version boundaries

| Version                               | Changes when                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| Application, e.g. `1.0.1`             | A new desktop build ships.                                                                  |
| SQLite schema, now `2`                | Persistent tables or stored-data meaning change.                                            |
| Pack format, read `1`/`2`, export `2` | The reader needs a different manifest/catalog structure.                                    |
| Pack edition                          | That pack's exported content changes, independently of app releases.                        |
| Reference execution revision          | Inputs, conditions or execution materially change. Wording fixes alone do not increment it. |

Preserve existing pack and reference IDs. A new app version does not require new
pack editions or video downloads. New exports use ordered semantic versions per
pack; legacy edition strings stay readable and are not assigned a guessed order.
Keep a format-1 reader when introducing a new
format; adding fields to today's strict manifest would otherwise break readers.

## Application and database updates

Keep the application identifier, default library locations and chosen-folder
setting stable. Updating replaces the application bundle, not the library.
Users Quit the running host before replacement; closing its window only hides it.
Phones reconnect after restart and retain unsaved drafts if the host is unavailable.
Check the existing API protocol version before resuming writes; incompatible cached
clients keep their drafts and receive a Reload prompt. Content-generation refresh
and API compatibility are separate checks.

Preflight database and pack compatibility before seeding, recovering or modifying
content. Unsupported libraries receive a useful error and recovery path. Never
silently create a fresh library in place of one that failed to open. Enforce one
maintenance owner per library across desktop and source hosts, covering migration,
activation, removal, restore and cleanup; a per-process import flag is insufficient.

The existing SQLite migration mechanism already backs up supported databases,
applies pending SQL in a transaction, rolls back failure and refuses newer/foreign
databases. Keep released migrations immutable and apply missing steps in order.
Use SQLite's backup API for a consistent snapshot, not a live database-file copy.
A failed backup blocks migration. Preserve the library UUID, entries, row versions
and learner-assessed execution revisions. Packs never supply executable migrations.

Do not automatically downgrade a database or restore a snapshot. The normal recovery
action is **Restore notes and progress**: stop writes, validate the snapshot/library
identity, preserve the current database, and restore learner data in a transaction
while keeping the current pack registry. Do not rewind concurrency versions;
advance a maintenance revision checked by write requests, retain the stable library
UUID, and require connected clients to reload before saving. Explain
which newer edits the restore replaces.

Once SQLite also records pack pointers, an old database snapshot is not a complete
library rollback: its historical media may have been reclaimed. Whole-library
rollback is a separate advanced recovery path that requires compatible database
and pack generations. Never activate old registry pointers blindly. Stronger
preflight guarantees apply to releases implementing them; released v1.0.0 opens
the catalog before checking the database and must not be used on an upgraded
library. A rollback uses a compatible saved library, not the live upgraded one. Keep migration
snapshots until deliberately removed; ordinary optional snapshots can have a
separate bounded retention policy.

For now, continue installer/Homebrew updates with clear instructions and a simple
Check for updates link to the release page. A later
in-app updater can share the same shutdown and migration path. Its cryptographic
update signing is a separate concern from OS publisher signing/notarization.

## Installed pack lifecycle

Today import/replacement is validated, but there is no supported removal. Deleting
a folder can cause `.previous-*` recovery to restore it; an empty pack directory
also triggers starter seeding. Official pack editions currently follow the app
release version, and retired copies accumulate without a bound.

Use **one active-pack registry in SQLite**, with pack editions stored in separate
immutable directories. Avoid a second competing index or recovery journal.

- **Add/update:** extract to a temporary directory inside the library, validate
  checksums, schemas, compatibility and the combined catalog, then move the complete
  generation into place before committing its active pointer in SQLite. Failure
  before the commit leaves the previous selection active. Unreferenced files are
  cleanup candidates, never evidence that a pack should become installed.
- **Remove:** commit the pack's absence before reclaiming its files. Record library
  initialization separately so deliberately empty libraries stay empty. Reclaim retained editions of the removed pack too. Show an
  empty-library view rather than silently reinstalling the starter.
- **Personal data:** never cascade-delete notes, saved flags or practice status.
  Unavailable references remain accessible through a small notes list. Reimporting
  the same IDs reconnects them. A changed execution prompts reassessment.
- **Overlaps:** preview references that disappear or fall back to another pack,
  including older executions. Do not silently replace a newer execution on removal.
  Apply explicit conflict handling to shared game profiles as well as reference IDs.
- **Space/recovery:** serialize maintenance; preflight staging space, retain at
  most one prior edition per installed pack, and reclaim abandoned temporary and
  retired files after active readers release them. Make retained storage visible.
  Keep a previous generation until activation is durable. Test process interruption
  at each boundary; do not claim arbitrary power-loss guarantees without testing.

Migrate existing format-1 installations without changing IDs, editions or personal
entries. Validate their existing folders and register those paths as immutable
legacy generations in the schema-2 transaction. Do not copy or relocate the videos
just to introduce the registry. Later updates use the new generation directories.
Recovery follows committed state, not folder absence.

**Installed packs** shows title, edition, size, references and problems, with
Import, Update and Remove actions. An import preview explains additions, changed
executions, disappearing entries, conflicts and required app versions. Identical
reimports do nothing. Older-edition rollback is explicit and compatibility-checked.
A catalog generation lets connected browsers refresh safely while preserving
notes; versioned media access keeps an old replay from receiving a new edition's
bytes during a change.

## Creating and editing packs

Build the manual helper **inside Hyper Chamber**. Keep editable workspaces separate
from installed packs. One shared authoring/validation/export core serves the editor
and a packaged command-line interface for agents; it must not assume this repo's
`content/` and `apps/web/static/` layout.

The manual path is: create a pack, choose game/characters, add a short recording,
mark its clip and key moments, enter inputs/categories/notes and provenance, preview
it in the practice view, then export a `.hcpack`. Generate posters and frames.
Use the existing game profiles first. Bundle any required trimming/transcoding
runtime with the app so users do not install ffmpeg, Node or development tools.
An initial smaller editor can accept already-trimmed playable clips explicitly.

Add an honest provenance choice for **own recording**; references currently require
YouTube URLs. Preserve legacy YouTube sources through the format adapter. Source
review and in-game verification remain distinct; uncertain inputs/timings remain
drafts. Technical validation does not prove that a combo works.

New workspaces generate stable pack/reference identities that avoid collisions.
Editing one's own pack preserves IDs; exporting changed content creates a new
edition. Forking someone else's pack defaults to independent identities and records
its origin/attribution. Overriding existing reference IDs is explicit, not an
accidental consequence of installation order. Author labels are descriptive, not
proof of publisher identity. Draft edits do not change installed references until
the user exports and imports the validated result.

Publish a portable **Hyper Chamber pack-authoring skill** alongside the tool:
create/open a workspace, extract proposed annotations with evidence, preserve
identity and provenance, validate, preview and export. The agent uses the same
packaged tools as the editor. It checks tool/format compatibility and does not
invent inputs, timings or verification. Export is local; publishing a pack remains
a separate user action. Test the skill with an independent agent using a real
sample workspace and import its output into a disposable library.

## Public documentation

Keep canonical Markdown guides in the repository and render them into the existing
GitHub Pages site. Add a Create packs entry point with: first manual pack, editing
and updating, the AI skill/install instructions, importing/removing packs, recovery,
and an advanced format/schema reference. Supply a small attributed sample workspace
and pack, document supported app/pack-format versions, and label future capabilities
until they ship. Publish the actual guides with working tools, not placeholder commands.

## Release order and acceptance

First establish and test the upgrade contract. The security patch can keep schema 1
and existing packs; it need not wait for the full editor. Next ship registry-backed
management/removal, then the editor, shared command-line tools, skill and public guides.

Use fixtures produced by released v1.0.0, not a developer's real library. Test
installer replacement on Mac/Windows, custom-folder preservation, repeated/skipped
upgrades, failed backup/migration, incompatible downgrade and complete recovery.
Test add/update/remove/reimport, last-pack removal, overlaps, insufficient space,
interrupted activation/removal and restart. Assert unchanged UUID, notes, progress
and assessed revisions. Unsupported library preflight must leave packs unchanged.
