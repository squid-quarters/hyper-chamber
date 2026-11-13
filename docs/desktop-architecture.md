# Desktop architecture

Hyper Chamber is one local application with two ways to view it. Tauri owns a bundled
Node 24 server and opens its loopback web interface in a native window. When device
access is enabled, that server also accepts browsers on a separate local-network
listener. Both use the same SQLite database and installed reference packs.

The desktop bundle contains its runtime, server, interface, fonts and three complete
Dhalsim references. Users of an installed build do not need Node, pnpm, Rust or an AI
agent to set it up. Additional character content arrives as `.hcpack` archives.
Version `1.0.0-beta.1` is still unreleased: no installer, signed release or update
feed has been published. The static project site is published separately through
GitHub Pages; it does not host the running application or its library.

## Responsibilities

| Part                 | Responsibility                                                                  |
| -------------------- | ------------------------------------------------------------------------------- |
| `apps/desktop`       | Native window, owned server process, content picker, backups and device access  |
| `apps/server`        | SQLite, library identity, validated JSON catalogs, media streaming and HTTP API |
| `apps/web`           | Library, practice view and browser recovery drafts                              |
| `packages/reference` | Reference model, catalog validation and storage protocol schemas                |
| `content/games`      | Authored references and source provenance                                       |
| `tools/desktop`      | Resource preparation, content archives and source-run launcher                  |
| `apps/site`          | Static project information; separate from the private running library           |

The native host waits for the server's readiness message before opening the window.
Host commands require the owned window's exact origin and a random token held by
native code. Browser clients never receive the token or filesystem commands. The
primary listener is loopback-only; enabling sharing starts another listener without
changing the desktop address. LAN clients can read and edit the shared personal
library. There are no accounts, separate learner profiles or internet synchronization.
Sharing is plain HTTP for a trusted local network, not a public hosting service.

A second desktop launch restores the existing instance. Closing its window hides it
and keeps the host available to connected devices. Quit stops the owned server; a
parent-process watchdog handles an interrupted native host. Startup errors appear
in a native dialog, with server details in the library's `server.log`.

## Portable data

The application bundle can be replaced independently of its library folder. On
macOS, the default desktop location is:

```text
~/Library/Application Support/com.squidquarters.hyperchamber/library/
  hyper-chamber.sqlite
  packs/<pack-id>/
  snapshots/
  server.log
```

SQLite's WAL files can accompany the database while it is open. Quit before copying
or moving the folder. A whole-folder copy includes personal entries and installed
content; a database snapshot alone contains personal entries. `HYPER_CHAMBER_LIBRARY_DIR`
selects another folder before launch. Devices → Choose library folder validates an existing or empty folder, saves the choice and restarts the app. This opens a separate library; it does not move the previous folder. The default directory for the standalone
server CLI differs from the native app; source launchers pass an explicit directory.

The database is authoritative for saved references, notes and self-reported practice
status. It has a persistent UUID and a schema version. An existing schema is backed
up before an upgrade; failed migrations roll back, and newer or foreign databases
are refused. Removed or temporarily unavailable references do not cascade-delete
personal entries.

Each personal entry has an independent `rowVersion` for optimistic concurrency.
Its existing `revision` records which execution revision the learner assessed.
Those values have different purposes. Field patches carry an expected row version;
a conflicting save returns the current entry so the interface can preserve the draft
and ask which value to keep. Browsers include the expected library UUID in mutations,
preventing a stale page from writing to another library restarted at the same address.

Browser storage holds playback preferences and unsaved recovery drafts, scoped to
the library UUID. It is not the permanent notes database. Legacy browser entries are
imported idempotently: missing entries are inserted, identical entries are skipped,
and different server values are retained. The originals remain in browser storage.
Changing web addresses does not transfer that address's browser storage automatically.

## Reference packs

Each installed pack contains reviewed JSON catalogs and ordinary media files,
separate from learner data. A `.hcpack` is a ZIP archive with this root manifest:

```json
{
	"formatVersion": 1,
	"id": "sf6-dhalsim",
	"version": "1.0.0-beta.1",
	"games": ["games/sf6/game.json"],
	"catalogs": ["games/sf6/references/dhalsim.json"],
	"files": [{"path": "games/sf6/game.json", "sha256": "<64 hex characters>", "bytes": 123}]
}
```

The example is abbreviated; every payload file is listed, including the catalog and
media. The manifest itself is excluded from `files`. Authored `/media/...` URLs map
to relative `media/...` paths inside the pack; catalog responses contain no absolute
filesystem paths. Generated character packs retain authored IDs, execution revisions,
source attribution and verification notes. Related links are limited to references
included in that archive.

Imports extract directly into a staging directory, validate paths, sizes, SHA-256
hashes and the combined catalog, then activate the pack. Traversal, unexpected files,
duplicate paths and duplicate reference IDs within a pack are rejected. Archives
are limited to 2 GiB compressed, 20 GiB unpacked and 30,000 payload files. Before
parsing, combined installed JSON is limited to 128 MiB of reference catalogs and
16 MiB of game profiles. Referenced media accepts passive video, raster images and
VTT; media responses are sandboxed. Reimporting
the same version and manifest is idempotent; different files require a new pack
version. A previous pack is retained for recovery after replacement.

Overlapping packs can improve a stable reference ID. The highest execution revision
wins; at equal revisions, the most recently installed definition wins. Media must
belong to the selected execution revision, so an older pack cannot silently replace
newer footage. Replacing a pack cannot lower an existing reference execution
revision. Different references sharing a media URL must agree on its file hash.
The format permits metadata without installed media, but the bundled
starter and generated character packs contain complete demonstrations. Seeding runs
only for an empty pack library and does not overwrite an existing library on an
application upgrade.

Content remains a source-based reference. “Source reviewed” describes review against
the credited recording, not in-game verification or a current-patch guarantee. The
repository's existing publication record and third-party media limitations still
apply; creating a pack does not grant new redistribution rights.

## Contributor workflow

Use Node 24, pnpm 10.16.1, Rust and the platform's native build prerequisites. Native
validation currently targets macOS 13.5 or later with Xcode command-line tools. CI pins Node
24.14.1 and Rust 1.94.1, including rustfmt and Clippy. Linux runs the web/server checks;
a macOS job checks and compiles the native app. Other native platforms still need
their own build and runtime validation.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

This serves the development interface on `127.0.0.1:5173`, proxies its API to the
loopback server on port 5376, and uses `.local/dev-library`. For built source runs:

```sh
pnpm build
pnpm start
```

The built app is served on port 5376 with `.local/library`. Both source modes use the
full repository catalog and an explicit development media directory. Set the same
`HYPER_CHAMBER_LIBRARY_DIR` for both if they should share notes. `HYPER_CHAMBER_PORT`
changes the backend port, and `HYPER_CHAMBER_WEB_PORT` changes the development UI port.
Ctrl+C stops the processes owned by the source launcher.

To build and inspect the native app:

```sh
pnpm --filter @hyper-chamber/server build
pnpm --filter @hyper-chamber/web build
pnpm --filter @hyper-chamber/desktop prepare:resources
pnpm desktop:check
pnpm --filter @hyper-chamber/desktop exec tauri build --no-sign --bundles app
```

Resource preparation copies the current Node 24 executable and its license, the
server bundle and built interface, then generates the small starter pack. The Tauri
build hook prepares these resources again. Generated resources and native artifacts
stay out of Git. The local `.app` is under
`apps/desktop/src-tauri/target/release/bundle/macos/`; this command does not sign,
notarize, upload or publish it. `pnpm desktop:build` additionally builds the configured
unsigned disk image. Desktop development uses `pnpm desktop:dev`.

Create a character archive from existing curated content without changing originals:

```sh
pnpm desktop:pack --character dhalsim --output /path/to/dhalsim.hcpack
```

In the desktop app, open **Devices** and choose **Import content pack**. `HYPER_CHAMBER_PORT`,
`HYPER_CHAMBER_LIBRARY_DIR` and the developer-only `HYPER_CHAMBER_RESOURCES_DIR` can
isolate a native test from another running instance.

`pnpm verify` covers formatting, lint, TypeScript, tests, non-native builds and media
validation. `pnpm desktop:check` covers Rust formatting, Clippy and native tests.
The Verify workflow performs both and compiles an unsigned macOS app without
publishing it. A separate Project site workflow checks the microsite in pull
requests and deploys only `apps/site/build` from reviewed `develop` changes or a
manual run on that branch. Its Pages/OIDC permissions are confined to the deployment
job; desktop releases, reference packs and learner data are outside that artifact.
