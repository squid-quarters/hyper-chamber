# Hyper Chamber

A visual fighting-game compendium for quick reference beside the game. All 32 released Street Fighter 6 characters have populated libraries with input notation, conditions, individual replay clips, selected frames, and quick notes. It covers light confirms, punish routes, anti-air conversions, Drive Impact, corner/stun routes and midscreen/corner oki from reviewed tutorial footage.

Guides and longer lessons link to [SF6 Lab](https://sf6-lab.net/en/). Hyper Chamber focuses on finding and inspecting individual references.

## Run locally

Use Node 24 and pnpm 10.16.1.

```sh
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 5376
```

Open http://127.0.0.1:5376. Bundled fonts and prepared clips do not require a cloud account. Source and guide links require internet access. This version has no service worker or installable offline mode.

For the production build:

```sh
pnpm build
pnpm start
```

The local MVP uses the Chamber palette and Hourglass H identity. Choose a character, browse the tile library, filter by situation or your practice status, and open a reference in the dedicated practice view. Training goals offer Punishes, Corner carry, Oki, Anti-air and Cash-out, alongside type and advanced situation/outcome/status filters. Filters scroll with the tile library so they do not cover cards in short windows. Inputs sit above the replay. Back/Escape restores the originating tile and scroll position; prominent Previous/Next controls follow the filtered set, and Ctrl/Cmd+K opens Quick switch. **Copy inputs** copies the authored sequence; if clipboard access is blocked, the selectable text notation opens instead.

Tap the video to play or pause. Drag sideways anywhere on the picture to inspect from the current moment; releasing holds that moment. Vertical touch gestures scroll the page. The timestamp and progress line appear during inspection or keyboard focus, with one compact toolbar for playback, replay, looping, speed and **−0.25s / +0.25s** inspection. Looping defaults on and remembers your choice on this browser; playback starts only when requested.

With the video focused, **Space** plays or pauses. With a clip control focused, **R** replays and **J / L** or **← / →** pause and nudge backward / forward. These shortcuts do not run while you type notes or while another application has focus. Key moments jump and pause at their annotated time, and nonvisual feedback announces completed seeks. A failed clip offers a retry and a link to its original source. Native controls remain available before player enhancement; the library requires JavaScript to open practice and links to the external guide when JavaScript is disabled.

```sh
pnpm verify
```

This runs formatting, lint, type checks, unit tests, the static build, and catalog/media validation. Svelte's compiler checks the templates. Build output is in `apps/web/build`. Web build artifacts are regenerated without Turborepo caching because their prepared media would otherwise be archived in duplicate. Shared-package builds remain cached.

## Your library

Saved references, practice status, and notes stay in this browser. Export/import a JSON backup from **Your library** to move them between browsers or keep a copy. Clearing site storage removes local data. Storage failures are shown in the interface; export a backup before closing if changes cannot be saved.

Practice status is self-reported. Filtering it keeps the selected entry open, including when that entry no longer matches. Sequential edits from another tab are rebased on current saved data; the browser store does not provide an atomic simultaneous-edit guarantee. Unknown reference IDs in backups are retained so future or temporarily unavailable references do not lose their notes.

## Content and provenance

The [roster coverage index](docs/roster-source-coverage.md) lists 2068 references and 9099 selected moments across 32 characters. All 26 previously thin libraries have been expanded with 1341 independently reviewed demonstrations. Character pages and source ledgers record selected intervals, conditions and remaining unprocessed footage. These are practical selections rather than exhaustive guides.

Each reference records its creator, original video, publication date, interval and review status. Source review confirms what the dated footage demonstrates; it does not establish validity on the current game patch. Charge, stocks, stance, install, poison, medals, drinks and prerequisite knockdowns are stated beside the routes that need them. Media originals and extraction workfiles stay outside Git.

Character-only URLs use the profile ID, for example `?character=ken`, `?character=lily` or `?character=arjun`; existing `?entry=...` links infer their character. Search, Saved counts and Quick switch stay within the active character, while learner backups retain all characters.

GitHub repository visibility is public. Prepared media is labeled private-development in its manifests; no open-source license or public media redistribution policy has been chosen. New excerpts remain local pending the publication decision. Attribution and source records must accompany media.

## Workspace

- `apps/web`: SvelteKit reader and browser-local personal library.
- `packages/reference`: shared catalog types, validation, and search.
- `content/games`: curated references, separate from personal data.
- `tools/ingest`: repeatable extraction and preparation tools.
- `docs`: product, source, design, and architecture decisions.

The repository starts on `develop`. Feature changes are reviewed through pull requests. CI verifies changes and does not deploy or publish the application. A release branch and deployment target can be introduced when needed.
