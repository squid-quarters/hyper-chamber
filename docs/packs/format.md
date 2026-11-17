# Pack Format and Tool Reference

This reference describes the Hyper Chamber 1.1.0 development tools. Legacy packs
from 1.0.0 remain readable. Older applications do not understand format-2 packs.

## Editable Workspace

A workspace is a folder containing `workspace.json` and its referenced media:

```text
my-pack/
  workspace.json
  media/
    <pack-id>/
      <reference-id>/
        clip-<unique-id>.mp4
        moment-<unique-id>.jpg
```

`workspace.json` records `workspaceVersion: 1`, a stable pack `id`, an independent
semantic `version`, a title, author, game profiles and references. `editRevision`
detects stale writes; the tools advance it when saving. `lastExport` records the
last exported edition and its content fingerprint. Preserve these fields when
using the save command. Hidden SQLite maintenance files are tool-owned locks, not
learner data or files to include in a distributed pack.

New workspaces generate their identities. New reference IDs use the pack's
namespace. Keep those IDs when editing your own collection. Forking remaps IDs
and asset paths and records `derivedFrom`; it does not silently override a pack
someone else installed.

## Distributed Pack

A `.hcpack` is a ZIP containing a root `manifest.json`, JSON catalogs and ordinary
media files. Format 2 extends the legacy layout with descriptive creator metadata:

```json
{
	"formatVersion": 2,
	"id": "community-example",
	"version": "1.0.0",
	"title": "Example references",
	"author": "Your name or handle",
	"games": ["games/example.json"],
	"catalogs": ["catalogs/references.json"],
	"files": []
}
```

That is an abbreviated shape, not a complete importable pack: the exporter fills
`files` with every payload's path, byte size and SHA-256 hash. Do not construct a
manifest by guessing those values. Paths are relative, traversal is rejected, and
media is limited to passive video, raster images and VTT. Packs contain no plugins
or executable database migrations. Author labels and internal checksums do not
prove publisher identity.

Format 1 retains its original manifest and edition strings. Format 2 uses semantic
editions and supports original-recording provenance. A source marked
`kind: "recording"` has a creator and segment times without needing a YouTube URL.
Legacy YouTube sources retain their URL and excerpt times.

## Four Different Changes

- Application version changes when a desktop build ships.
- Pack edition changes when that collection's exported content changes.
- Execution revision changes when a reference's inputs, conditions or execution
  materially change; a title correction alone keeps its revision.
- Learner data has its own database schema and concurrency versions. Importing a
  content pack does not replace it.

The tools raise an execution revision when structured execution fields change,
and return the saved workspace. Reload that result before making a later edit.
A change after export needs a new pack edition; the manual editor handles the
usual increment. An advanced author can set a deliberate semantic edition.

## JSON Tool Protocol

On an installed Mac build:

```sh
"/Applications/Hyper Chamber.app/Contents/MacOS/hyper-chamber-desktop" --pack --json < request.json
```

On Windows, use `hyper-chamber-desktop.exe` from the installed app's location.
These commands run without opening the window or library and need no separate
Node installation or repository checkout.

For a source checkout:

```sh
pnpm --filter @hyper-chamber/authoring build
node packages/authoring/dist/cli.mjs --json < request.json
```

Start by requesting the shipped game profiles:

```json
{"command": "profiles"}
```

Run the installed app with `--pack --json`, send one UTF-8 JSON request on standard
input, and wait for the process to finish. A successful response is
`{"ok":true,"result":...}`. An error returns `ok:false`, an error message and a
nonzero exit code.

| Command       | Required request fields                                                     |
| ------------- | --------------------------------------------------------------------------- |
| `profiles`    | No other fields; returns shipped game profiles.                             |
| `create`      | `directory`, `title`, `author`, `games`                                     |
| `read`        | `directory`                                                                 |
| `save`        | `directory`, complete `workspace` including current `editRevision`          |
| `validate`    | `directory`                                                                 |
| `add-media`   | `directory`, `sourcePath`, `referenceId`                                    |
| `write-asset` | `directory`, `path`, base64 image bytes in `base64`                         |
| `export`      | `directory`, new `.hcpack` output path in `output`                          |
| `fork`        | `directory`, source `.hcpack` path in `archive`, `author`; optional `title` |

Use absolute filesystem paths in requests. `add-media` copies MP4/WebM clips to
unique paths; `write-asset` accepts bounded JPEG, PNG or WebP frame images and does
not replace an existing image filename. Export streams its files rather than
loading a full video archive into memory. Concurrent writers receive a busy or
stale-edit error; reload and reconcile instead of retrying an old save blindly.

Exports are staged before the workspace's edition ledger is saved. Publishing
refuses to replace an existing output file. A failed publication can leave the
ledger advanced; reload the workspace and retry the identical export at a new
path. If you change the content instead, use a new edition. On a filesystem
without hard links, final publication uses an exclusive copy. Interrupting that
copy can leave an incomplete output; the importer rejects it. These safeguards
do not promise an atomic transaction across a database, files and power failure.
