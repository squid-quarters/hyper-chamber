# Desktop architecture

Hyper Chamber is one local application with two ways to view it. Tauri owns a bundled
Node 24 server and opens its loopback web interface in a native window. When device
access is enabled, that server also accepts browsers on a separate local-network
listener. Both use the same SQLite database and installed reference packs.

The desktop bundle contains its runtime, server, interface, fonts and three complete
Dhalsim references. Users of an installed build do not need Node, pnpm, Rust or an AI
agent to set it up. Additional character content arrives as `.hcpack` archives.
The published stable version is `1.0.0`, distributed through GitHub Releases
and the Squid Quarters Homebrew tap. The source tree targets `1.1.0`; its registry,
recovery controls and creator are development features until new installers ship.
Mac installers are ad-hoc signed and not notarized; Windows setup is unsigned. No automatic update feed is configured.
The static project site is published separately through GitHub Pages; it does not
host the running application or its library.

## Responsibilities

| Part                 | Responsibility                                                                  |
| -------------------- | ------------------------------------------------------------------------------- |
| `apps/desktop`       | Native window, owned server process, content picker, backups and device access  |
| `apps/server`        | SQLite, library identity, validated JSON catalogs, media streaming and HTTP API |
| `apps/web`           | Library, practice view, native pack creator and browser recovery drafts         |
| `packages/authoring` | Shared editable-workspace, validation, media-copy and export tools              |
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
  packs/
    <legacy-pack-id>/
    .generations/<generation-id>/
  snapshots/
  server.log
```

SQLite's WAL files can accompany the database while it is open. Quit before copying
or moving the folder. A whole-folder copy includes personal entries and installed
content. A database snapshot contains database state, not the video files; the
supported restore copies only personal entries and keeps the current pack registry.
`HYPER_CHAMBER_LIBRARY_DIR` selects another folder before launch. **Library & devices
→ Choose library folder** validates an existing or empty folder, saves the choice
and restarts the app. This opens a separate library; it does not move the previous
folder. The standalone server CLI has a different default location; source
launchers pass an explicit directory.

The development reader uses SQLite schema **2** and API protocol **2**. The database
records personal entries, library UUID, active pack pointers, catalog generation
and maintenance revision. Before changing it, startup checks database compatibility
and validates legacy packs. A consistent SQLite snapshot precedes migration; SQL
and the legacy registry backfill commit together. Existing pack paths are adopted
in place, without copying videos. A failed backup or migration stops startup.
Newer or foreign databases are refused rather than replaced with an empty library.

One host owns a library through a separate SQLite OS lock. App updates remain
manual: **Quit**, replace the bundle and reopen the same library. Closing the window
only hides it. Released `1.0.0` does not provide the new preflight guarantees and
must not open an upgraded library; rollback needs a compatible whole-library copy.
Migration snapshots are retained. They are not a complete rollback of historical
media after older generations have been reclaimed.

**Restore notes and progress** validates a snapshot from the same library, snapshots
the current database, then replaces personal entries in a transaction while keeping
the active pack registry. It preserves the library UUID, advances row versions and
the maintenance revision, and requires connected clients to reload before saving.
It replaces newer personal edits; it never silently restores on startup.

Each personal entry has an independent `rowVersion` for optimistic concurrency.
Its `revision` records which execution revision the learner assessed. Field patches
carry the expected row version; conflicts preserve the draft and expose the current
entry. Writes also require the expected library UUID and maintenance revision.
Protocol compatibility, catalog generation and maintenance revision are separate
checks: an app restart, a content update and a notes restore are different events.

Browser storage holds playback preferences and unsaved recovery drafts, scoped to
the library UUID. It is not the permanent notes database. Legacy browser entries are
imported idempotently: missing entries are inserted, identical entries are skipped,
and different server values are retained. The originals remain in browser storage.
Changing web addresses does not transfer that address's browser storage automatically.

## Reference packs

A `.hcpack` contains JSON catalogs and passive media, separate from learner data.
Format **1** remains readable; new authoring exports use format **2**, with creator
metadata, semantic editions and original-recording provenance. Legacy
YouTube sources and edition strings stay readable. The [format guide](packs/format.md)
contains the manifest and tool contract. Author labels and SHA-256 checksums do
not prove publisher identity. Packs cannot contain executable migrations or plugins.

SQLite's active-pack registry is authoritative. Imports stage and validate files,
paths, hashes, storage limits and the combined catalog before committing a pointer
to a complete immutable generation. A failed preview/import leaves the prior
selection active. An identical healthy edition and manifest is a no-op; changed content
needs a new edition. The manager previews overlaps, disappearing references and
older-edition/execution fallbacks and requires the relevant confirmation.

Removal commits absence before reclaiming media, including retained editions.
Initialization is recorded separately, so an intentionally empty library stays
empty. Notes, saved flags and practice status are never cascade-deleted; unavailable
references stay accessible in a notes list and reconnect when the same IDs return.
A missing or damaged registered pack is reported for reimport/removal while healthy
content remains usable. Do not manage installations by deleting folders.

The reader retains at most one prior edition per installed pack. Cleanup is
serialized with maintenance and waits for active media readers; generation-qualified
media URLs prevent a replay from silently receiving a replacement edition's bytes.
An obsolete generation can become unavailable and require reload. These transaction
boundaries do not promise survival of every filesystem or power failure.

App versions, pack editions and reference execution revisions are independent.
An app update does not refresh existing packs or reinstall the starter. Official
character pack editions change when their exported content changes; keep IDs and
unchanged media stable. The bundled starter seeds only an uninitialized library.

## Pack creator and tools

The development desktop app edits separate workspace folders; drafts never modify
installed content. Its first creator accepts already-trimmed MP4/WebM recordings,
captures selected moments/posters, edits inputs and provenance, previews a saved
reference and exports a `.hcpack`. It does not trim/transcode long videos or require
a separately installed ffmpeg. The installed app bundles its tools.

`packages/authoring` serves both the editor and the packaged `--pack --json` CLI.
Workspaces have stable generated IDs, edit revisions for stale-write detection and
an export-edition ledger. Editing your own workspace preserves identities; forking
a pack creates independent IDs and records its origin. Export does not install or
publish content. Publication and third-party media rights remain separate choices.
Technical validation does not establish combo validity or current-patch accuracy.

The [pack guides](packs/index.md) cover manual creation, the portable
[AI skill](packs/ai.md), updates and recovery. Their canonical Markdown is rendered
into the project's GitHub Pages documentation. The guides clearly separate
development `1.1.0` tools from the published `1.0.0` download.

## Contributor workflow

Use Node 24.22.3, pnpm 10.16.1, Rust 1.94.1 and the platform's native build
prerequisites. CI pins those Node and Rust versions, including rustfmt and Clippy.
Linux runs the web/server checks. The native installer matrix covers Mac Apple
silicon, Intel Mac and Windows x64 on matching runners. It mounts each Mac disk
image or installs Windows setup into an isolated directory, then checks the
packaged app with a disposable library: startup, starter media, compiled interface,
SQLite notes surviving restart and owned-process cleanup. These checks cover the packaged runtime and library flows; they do not establish compatibility with every computer.

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
ad-hoc-signed disk image. Desktop development uses `pnpm desktop:dev`.

Create a character archive from existing curated content without changing originals:

```sh
pnpm desktop:pack --character dhalsim --output /path/to/dhalsim.hcpack
```

In the development desktop app, open **Library & devices → Installed packs → Import pack**. Published `1.0.0` uses **Devices → Import content pack**. `HYPER_CHAMBER_PORT`,
`HYPER_CHAMBER_LIBRARY_DIR` and the developer-only `HYPER_CHAMBER_RESOURCES_DIR` can
isolate a native test from another running instance.

`pnpm verify` covers formatting, lint, TypeScript, tests, non-native builds and media
validation. `pnpm desktop:check` covers Rust formatting, Clippy and native tests.
The [performance checks](performance.md) use disposable libraries and report resource
cleanup and bounded workloads without telemetry or a leak-free claim.
The Verify workflow performs both and compiles an unsigned macOS app without
publishing it. A separate Project site workflow checks the microsite in pull
requests and deploys only `apps/site/build` from reviewed `develop` changes or a
manual run on that branch. Its Pages/OIDC permissions are confined to the deployment
job; desktop releases, reference packs and learner data are outside that artifact.

## Public distribution

GitHub Releases provides version `1.0.0` for macOS Apple silicon, macOS Intel and Windows 64-bit, with checksums and build records. Platform smoke checks do not establish compatibility with every computer or current-patch accuracy for the reference library.

The installed application includes its runtime and a small Dhalsim starter. User installation instructions belong in the root README and project site; source-build prerequisites remain in this document. Homebrew tap details and signing status must match the published release artifacts before their installation commands are advertised.

Publish the release assets and checksums before switching the project site to direct download links. Keep the application version, platform requirements and first-launch signing limits visible. Content-pack availability is a separate distribution decision and must not be inferred from the development library screenshots.

### Installer contract

The release tag is `v1.0.0`. Release downloads use these asset names:

- `Hyper-Chamber_1.0.0_aarch64.dmg`: macOS Apple silicon, minimum macOS 13.5.
- `Hyper-Chamber_1.0.0_x64.dmg`: macOS Intel, minimum macOS 13.5.
- `Hyper-Chamber_1.0.0_x64-setup.exe`: Windows 10+ x64; setup downloads WebView2 if it is missing.

Mac builds are ad-hoc signed with the hardened runtime and are not Apple-notarized. The Windows installer is unsigned. Public installation notes must describe these first-launch limits; do not replace them with commands that disable quarantine or operating-system security checks.

The official Homebrew repository is `squid-quarters/homebrew-tap`, with stable cask token `hyper-chamber`. Advertise `brew install --cask squid-quarters/tap/hyper-chamber` only after the release files and reviewed tap recipe are public. The cask must preserve the user’s library on uninstall. The separate `hyper-chamber@beta` cask is retained for beta releases; users must uninstall that cask before installing the stable one because both use the same application bundle.

The release includes one `.hcpack` per Street Fighter 6 character, covering 32 character libraries and 2,068 references. The bundled three-demo starter works without extra packs. Learner notes and progress remain separate from application and content updates.
