# Local library server

The desktop application launches this server with its bundled Node 24 runtime. One
SQLite library backs both the desktop window and browsers connected through optional
network sharing. No database or media is written into the installed application.

For development, build the workspace and run:

```sh
node apps/server/dist/cli.mjs \
  --library-dir /path/to/library \
  --web-dir apps/web/build \
  --seed-dir content \
  --media-dir apps/web/static/media \
  --port 5376
```

`--seed-dir` accepts an unpacked content pack or the repository's `content` folder.
Seeding runs only when the library has no installed packs. `--media-dir` is an
explicit development fallback; packaged applications serve media from installed packs.
The first stdout line beginning with `HYPER_CHAMBER_READY ` contains the selected
port, loopback URL and persistent library identity. Use `--port 0` for an ephemeral
port. `HYPER_CHAMBER_PARENT_PID` enables the native launcher's orphan watchdog.

## Library folder

- `hyper-chamber.sqlite`: saved references, practice status and notes. SQLite WAL
  files may accompany it while the application is open.
- `packs/<pack-id>/`: reviewed JSON catalogs and their ordinary media files.
- `snapshots/`: consistent SQLite snapshots created before schema upgrades and by
  the host's backup command.
- `packs/.previous-*`: prior content retained after replacing an installed pack.
  An interrupted replacement can be recovered on the next launch.

Stop the application before moving or copying the whole folder. A database snapshot
contains personal entries; the complete portable library also needs its `packs`.
Reference execution revisions and personal-entry `rowVersion` values are independent.
Unknown valid reference IDs survive content changes and legacy imports.

## Content packs

A `.hcpack` file is a ZIP archive containing `manifest.json` and its listed payload
files. The manifest has `formatVersion: 1`, `id`, `version`, `games` and `catalogs`
(relative JSON paths), and `files: [{path, sha256, bytes}]`. The manifest itself is
not listed in `files`. Reference media paths such as `/media/dhalsim/.../clip.mp4`
map to `media/dhalsim/.../clip.mp4` inside the pack.

Imports reject traversal, extra files, duplicate paths and reference IDs, invalid
catalogs, mismatched checksums, archives over 2 GiB and unpacked data over 20 GiB.
Combined installed JSON is limited to 128 MiB of reference catalogs and 16 MiB of
game profiles before parsing. Referenced media is limited to passive video, raster
images and VTT; media responses are sandboxed. Everything is validated in a staging
directory before activation. Reimporting the
same pack version and manifest is idempotent; different payloads need a new pack
version. Packs can add media for the same stable reference IDs. The highest
execution revision wins; its replay cannot be replaced by older-revision footage.
Replacement packs cannot lower an installed reference execution revision. Distinct
references sharing a media URL must agree on its file hash.

## Application API

Public endpoints use same-origin HTTP. There is no broad CORS policy. Every practice
mutation additionally requires `X-Hyper-Chamber-Library` with the identity returned
by the current snapshot, preventing a stale browser from writing into another
library that happens to use the same address.

- `GET /api/health`, `/api/runtime`, `/api/catalog`, `/api/practice`
- `PATCH /api/practice/:id`: `{patch, expectedVersion}`; stale row versions return
  HTTP 409 with `error.code: "conflict"` and the current entry.
- `POST /api/practice/import`: `{version: 1, entries}`; inserts missing entries,
  keeps conflicting server values, and reports imported/unchanged/conflicting IDs.

Host commands require `X-Hyper-Chamber-Host`, matching the native launcher's
`HYPER_CHAMBER_ADMIN_TOKEN`, and are accepted only on the primary loopback listener:

- `POST /api/admin/sharing`: `{enabled: boolean}`
- `POST /api/admin/content/import`: `{path: "/absolute/path/to/character.hcpack"}`
- `POST /api/admin/backup`: `{}`
- `POST /api/admin/shutdown`: `{}`

Sharing creates a separate LAN listener and leaves the desktop URL stable. Connected
browsers use the same personal library. Disabling sharing closes that listener.
