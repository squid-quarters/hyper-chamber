# 0005: Version the local library and editable reference packs

Status: accepted; implemented for development `1.1.0`. Published stable remains `1.0.0`.

## Context

The app is a personal training reference, also usable by browsers beside a running
desktop host. Users need ordinary application updates, safe content removal and a
way to author packs without a source checkout. Shared references remain separate
from learner notes and self-reported progress.

## Decision

Keep the Tauri/Node/SQLite architecture and manual installer/Homebrew updates. Quit
the host before replacement; closing its window only hides it. Bundle the tools
needed by installed users. No accounts, sync, telemetry or automatic updater are
introduced.

Treat these versions separately:

| Boundary                | Development contract                                               |
| ----------------------- | ------------------------------------------------------------------ |
| Application             | `1.1.0` source; published installers remain `1.0.0` until released |
| SQLite schema           | `2`: personal data, active-pack registry and maintenance state     |
| Browser/server protocol | `2`: compatibility checked before writes                           |
| Pack format             | Read `1` and `2`; authoring exports `2`                            |
| Pack edition            | Independent; new exports use semantic versions                     |
| Execution revision      | Changes for material execution differences, not copy edits         |

Legacy edition strings remain readable without a guessed ordering.

Use a single active-pack registry in SQLite and immutable media generations. Stage
and validate an import before committing its pointer. Commit removal before
reclaiming files. Keep at most one prior edition and release retired media after
readers finish. Track initialization explicitly so removing the final pack does not
reinstall the starter. Keep personal entries for unavailable reference IDs.

Preflight compatibility before content mutation. Snapshot supported databases before
migration, and register legacy packs in place within the schema-2 transaction.
Preserve library UUID, notes, row versions and learner-assessed execution revisions.
A separate SQLite OS lock enforces one maintenance owner per library. Refuse
unsupported databases; never substitute an empty library for a failed open.

Recover through **Restore notes and progress**, not by replacing the live database
with old pack pointers. Validate the same-library snapshot, preserve current data,
restore personal entries transactionally and advance concurrency/maintenance
versions. Keep currently installed packs. Connected clients reload before writing.
Catalog generation and media leases address content changes separately.

Put manual authoring in the native app, backed by the same portable tools as the
packaged JSON CLI and AI skill. Workspaces are editable sources outside installed
packs. The first editor accepts already-trimmed MP4/WebM clips and captures moments;
it does not trim/transcode long footage. Own recordings have explicit provenance.
Editing preserves IDs; a fork gets independent identities and attribution. Export
is local and does not install or publish the result.

## Consequences

App replacement does not require unchanged video packs to be downloaded again.
A database snapshot cannot recreate reclaimed historical media. Released `1.0.0`
must not open an upgraded library; deliberate rollback requires a compatible saved
whole library. Current transaction tests do not establish arbitrary power-loss
safety or leak-free operation.

The [pack guides](../packs/index.md) document both manual and AI workflows and feed
the public project site. The [architecture](../desktop-architecture.md) records
storage/update details; [performance checks](../performance.md) provide repeatable,
disposable workloads. Source review remains distinct from in-game verification.
