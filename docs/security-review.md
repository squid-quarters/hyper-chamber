# Security review — 16 November 2026

This review covers the Tauri host, local HTTP/SQLite server, browser interface,
content-pack importer, dependencies and release tooling. It started from
`e79375e` (v1.0.0 plus issue templates). The fixes below are **unreleased** until
new installers are published. An existing v1.0.0 installation does not change
when source fixes merge.

No remote code-execution path or native administration bypass was found. This
is a source review with targeted adversarial tests, not a security certification
or a claim that every platform dependency is free of vulnerabilities.

## Trust model

- The desktop host and bundled code are trusted. The webview gets no general
  shell or filesystem permission. Host commands require the owned window's exact
  backend origin; privileged HTTP calls use a random token retained by native
  code, with redirects and proxies disabled.
- The primary server listens on loopback. Explicit device sharing opens a
  separate LAN listener. Clients on that network can read and edit the personal
  library without accounts. Sharing is plain HTTP: use a trusted network, never
  expose the port to the internet. Host administration remains loopback-only.
- Websites and imported `.hcpack` files are untrusted. Packs provide validated
  data and passive media, not executable application files. Checksums detect
  corruption; a checksum inside a pack does not establish its publisher's identity.
- A library is a user-selected writable folder. Fixed child-path checks reject
  prepared links; they are not isolation from an actively malicious process
  running as the same OS user. The deliberately chosen root may itself resolve
  through a legitimate link.

## Confirmed findings and fixes

Severity reflects this application's prerequisites, not a generic internet server.

| Finding                                                                                                                                                                 | Severity and prerequisite                                                                                      | Fix and regression evidence                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ZIP directory entries bypassed import resource accounting. Unstarted entries retained compressed payloads in the decoder; empty entries bypassed the entry-count bound. | Medium; user imports a hostile pack. Memory exhaustion or an unresponsive app, not execution.                  | Count every entry, reject oversized advertised entries and nonempty directory payloads, and start/drain valid empty directories. Tests cover actual bytes, forged sizes, the entry-count boundary and streaming descriptors; rejected imports preserve the installed catalog.        |
| Application HTML could be framed by another origin.                                                                                                                     | Low; user visits a hostile page while the app is reachable. Click deception could change practice state.       | HTML responses deny framing with CSP and `X-Frame-Options`; media keeps its separate sandbox. Header tests include GET, HEAD, SPA fallback, ranges and 304. Chromium reproduced framing before the fix and blocked it after.                                                         |
| `server.log` followed a final symlink; a FIFO could also block startup.                                                                                                 | Low; user selects a prepared library folder. Log output could append outside it.                               | Open without following the final link, inspect the opened descriptor, and require a regular file. Unix also opens nonblocking. Tests cover create/append, directories, Unix symlinks and FIFOs; actual backend startup rejects the linked log without changing the outside sentinel. |
| The fixed `packs` child could redirect seed/import operations outside the chosen library.                                                                               | Low; user selects a prepared library folder. Outside paths could be relocated/replaced during pack activation. | Require an ordinary directory at startup and before import. Sentinel regressions check that rejected folders leave outside paths and the current catalog unchanged. This is not protection against concurrent same-user directory replacement.                                       |

## Dependency disposition

- Bundled Node moves from **24.14.1 to 24.22.3**, including the
  [November security release](https://nodejs.org/en/blog/vulnerability/november-2026-security-releases/).
  Packaging, CI and source-build pins agree. The official Apple-silicon binary
  passes the application's macOS 13.5 minimum check. Hyper Chamber uses HTTP/1;
  the announcement's HTTP/2 and TLS-server findings are not demonstrated app exploits.
- **fflate 0.8.3** fixes the
  [malformed ZIP64 `unzipSync` loop](https://github.com/advisories/GHSA-px8p-9vwx-vf98).
  Runtime imports use the streaming decoder, so that advisory is distinct from
  the confirmed directory-entry bug above. Both direct dependencies and the lockfile are updated.
- The remaining npm audit result is
  [deepmerge 4.3.1, low severity, no upstream patch](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).
  It merges trusted Vite/Svelte build configuration, is not shipped as application
  runtime code, and receives no pack or request data. Retain and reassess when the build plugin changes; do not hide the advisory.
- OSV checked all **470 registry packages** in Cargo.lock. Hits were glib 0.18.5
  (RUSTSEC-2024-0429) and unmaintained proc-macro-error, zvariant, zvariant_derive
  and zbus_names versions. Locked target graphs exclude all five from the shipped
  macOS ARM64, macOS x64 and Windows x64 builds. Reassess before adding Linux support.

## Verification and limits

Tests use disposable libraries; no installed app, personal library or OS security
setting is changed. HTTP probes cover Host/DNS rebinding, Origin and cross-site
writes, JSON/body limits, traversal, native tokens and library identity. Manual
review also covered prepared SQL statements, escaped rendering, passive-media
containment, process arguments, navigation restrictions and release provenance.
The built interface loads direct reference URLs, plays clips and saves literal
notes with the new headers. A tile-navigation failure was reproduced with both
the new headers and those headers removed; that existing behavior is outside
this security patch.

Semgrep OSS security-audit rules scanned 77 tracked source/tooling files with no
findings. A bounded credential-pattern scan covered 351 current tracked text
files with no matches; it did not scan Git history or private user files. Neither
scan substitutes for the behavior tests and independent review recorded on the PR.

Windows file-reparse rejection is compiled and regular-log behavior is tested in
CI; its final file-symlink case is exercised on Unix, not on a Windows machine.
Media-decoder fuzzing, a hostile same-user process and resource exhaustion by an
untrusted LAN peer are outside this review's guarantees. Import limits allow up
to 20 GiB unpacked, so disk capacity still matters.

Mac notarization and Windows publisher signing remain deferred. Installers run
with the user's normal privileges and there is no automatic update feed. Use
OS-approved first-launch flows and publish new, checksummed installers to deliver
these fixes; do not disable quarantine or replace an existing release's assets.
