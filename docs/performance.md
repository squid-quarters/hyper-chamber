# Performance and stability checks

These are local development checks with disposable libraries. They do not add
telemetry, collect user data or leave a background monitor running. Use the same
Node version and machine when comparing runs. Preserve the JSON output with the
review evidence; the tools return a failing exit code for functional/resource
cleanup failures, not for an arbitrary heap-size threshold.

## Repeatable workloads

Build the server, then exercise the complete authored catalog without downloading
or copying its video library:

```sh
pnpm --filter @hyper-chamber/server build
node tools/performance/server-soak.mjs --iterations 100 --output .local/performance/server.json
```

The tool creates its own temporary library, starts a separate server process and
loads the current SF6 catalog. Each iteration reads catalog JSON, requests a media
range, cancels a larger transfer, and checks that a saved fixture note and library
identity remain intact. A synthetic 2 MiB payload tests streaming only; it is not
a playable clip, a gameplay demonstration or an exported reference pack.

Samples record the server's heap, external memory, RSS, CPU and active resources.
Memory is sampled before and after forced GC in the test process only. On systems
with `lsof`, each settled sample also checks for leaked media descriptors before
GC can hide them. Unsupported descriptor inspection is reported as unavailable,
not as zero. The load generator runs separately from the measured server.

For a built interface with the three real starter demonstrations:

```sh
pnpm build
pnpm --filter @hyper-chamber/desktop prepare:resources
node tools/performance/browser-soak.mjs --iterations 20 --output .local/performance/browser.json
```

This additionally requires the `agent-browser` development CLI. Set
`AGENT_BROWSER_EXECUTABLE` when its native executable is not on PATH. It opens a
unique browser session against another disposable library, visits a reference,
plays it, switches next/previous, opens/closes settings and returns to the library.
It checks that replay elements, persistent global listeners and object URLs do not
accumulate, removed videos are paused and unloaded, no uncaught browser errors
occur, and notes survive. Each tool closes its browser/server and removes its
own temporary library on completion or failure.

The focused unavailable-notes regression uses the same built resources and a real
disposable API:

```sh
node tools/performance/unavailable-notes.mjs --output .local/performance/unavailable-notes.json
```

It recovers a conflicting draft for a removed reference, resolves it without
reinstalling a pack, then handles multiple unsaved versions for an unavailable ID
with no saved entry. It checks the chosen note, preserved fixture data and cleanup.

Browser cycle timings include automation overhead and are **not INP**. Optional
Chromium heap readings have unforced GC and caching effects. The browser probe
keeps numeric/string samples and weak references, not detached video elements.
The persistent-listener count excludes automatically cleaned `once` and `signal`
registrations. These measurements are evidence for a workload, not proof of an
absence of leaks.

## Findings from the November 2026 review

- **Disconnected file responses:** a client could disconnect during asynchronous
  file lookup/opening before the response's stream cleanup listener existed.
  Twelve controlled cancelled requests retained twelve media descriptors. The
  cancellation guards close opened handles and avoid starting a stream for an
  already disconnected response; the same probe then retained **zero** descriptors.
  Regression tests cover cancellation before open, during open and during stat.
- **Detached replay transfers:** pausing and removing a video left a throttled
  MP4 transfer active in Chromium even with no video elements in the document.
  Removing its source and resetting resource selection cancelled the transfer.
  Replay teardown now pauses, clears `src` and calls `load()` after invalidating
  pending play attempts. [Media reset behavior](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/load)
  includes aborting pending operations and play promises.
- **Navigation test correction:** the apparent card-navigation failure was an
  automation hit-target error. A partly visible large card's centre fell below a
  577px viewport, so the click hit the document rather than the card. Clicking its
  visible heading opened the reference correctly. The browser soak targets and
  scrolls the heading; this was not an application navigation bug.

A macOS arm64 server run on Node 24.22.3 loaded all 2,068 authored references,
with ten warm-up and 100 measured cycles. Median cycle time was 38.7 ms and p95
44.4 ms. All eleven settled samples had zero open media descriptors before GC
and no file-handle cleanup warnings. Post-GC heap ranged from 26.1–27.6 MiB and
RSS from 217–220 MiB; these are workload measurements, not memory limits. The
fixture note and library identity survived. The media payload was synthetic, so
this measures server catalog/streaming behavior rather than video decoding.

A final macOS Chromium run used three starter demonstrations, three warm-up
cycles and ten measured cycles. All 39 replay unmounts were paused and had their
source removed. Library DOM count stayed at 450; tracked persistent listeners and
object URLs stayed at zero. No uncaught browser errors occurred, the fixture note
and library identity survived, and the settled host had zero media descriptors
before GC. Median automation cycle time was 5.05 seconds, including CLI overhead.
This short run does not substitute for native WebKit or long-session testing.

The pack-management UI was separately exercised at 360, 768 and 1280px, with an
additional 320px empty state. Its test-only native bridge used canned inventory
and recorded requests, while the built app and browser APIs ran against a
disposable host. It covered update/removal previews, overlap and older-edition
consent, cancellation/discard, recovery confirmation, error/retry and success
notices across reloads. That verifies interface behavior, not OS file pickers or
real pack mutations; server/native tests cover those contracts separately.

The creator was exercised through create → choose clip → capture moment → save →
practice preview → export → import, using the real authoring core and server with
a test-only native file-picker bridge. A title-only edit retained its description
track, review note and execution revision. The compiled macOS JSON CLI also
validated, forked and exported the synthetic sample without opening a window.
An actual 130-reference Dhalsim pack passed install → remove (three starter
fallbacks) → reimport with notes and library identity intact. Its rebuilt archive
and manifest matched the published 1.0.0 checksums. These do not replace OS picker
or installed Windows smoke checks.

## Ongoing review

Check the resources a feature owns: timers, observers, event listeners, pending
requests, media elements, object URLs, archive streams and file handles. Cancel or
release them when the view/workspace closes. Keep caches bounded and distinguish
intentional recovery data from abandoned temporary files. Pause optional polling
while the page is hidden. Avoid recurring full-catalog transfers when a generation
check is sufficient.

Compare repeated warmed runs rather than a single peak. Investigate a rising
post-GC retained heap, media descriptors that remain open after cancellation,
accumulating global listeners/object URLs, or progressively slower interactions.
RSS can remain high because allocators and decoders retain reusable memory;
[Node resource information](https://nodejs.org/docs/latest-v24.x/api/process.html#processgetactiveresourcesinfo)
only describes resources keeping the event loop alive and does not enumerate every allocation.

Before release, also exercise a longer native session and real phone/tablet use.
Headless Chromium on a fast Mac does not establish WebKit, Windows or low-end
Android memory/decoder behavior. Pack import/export and the creator need their own
repeated open/edit/cancel/close checks as those workflows change.
