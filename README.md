# Hyper Chamber

A visual fighting-game compendium for quick reference beside the game. The Street Fighter 6 / Dhalsim, Ryu and Akuma libraries keep input notation, conditions, individual replay clips, selected frames, and quick notes together. It covers light confirms, punish routes, anti-air conversions, Drive Impact, corner/stun routes and midscreen/corner oki from reviewed tutorial footage.

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

The local MVP uses the Chamber palette and Hourglass H identity. Choose Dhalsim, Ryu or Akuma, browse the tile library, filter by situation or your practice status, and open a reference in the dedicated practice view. Inputs sit above the replay. Back/Escape restores the originating tile and scroll position; Previous/Next follows the filtered set, and Ctrl/Cmd+K opens Quick switch. **Copy inputs** copies the authored sequence; if clipboard access is blocked, the selectable text notation opens instead.

Tap the video to play or pause. Drag sideways anywhere on the picture to inspect from the current moment; releasing holds that moment. Vertical touch gestures scroll the page. The timestamp and progress line appear during inspection or keyboard focus, with one compact toolbar for playback, replay, looping, speed and **−0.25s / +0.25s** inspection. Looping defaults on and remembers your choice on this browser; playback starts only when requested.

With the video focused, **Space** plays or pauses. With a clip control focused, **R** replays and **J / L** or **← / →** pause and nudge backward / forward. These shortcuts do not run while you type notes or while another application has focus. Key moments jump and pause at their annotated time, and nonvisual feedback announces completed seeks. A failed clip offers a retry and a link to its original source. Native controls remain available before player enhancement; the library requires JavaScript to open practice and links to the external guide when JavaScript is disabled.

```sh
pnpm verify
```

This runs formatting, lint, type checks, unit tests, the static build, and catalog/media validation. Svelte's compiler checks the templates. Build output is in `apps/web/build`.

## Your library

Saved references, practice status, and notes stay in this browser. Export/import a JSON backup from **Your library** to move them between browsers or keep a copy. Clearing site storage removes local data. Storage failures are shown in the interface; export a backup before closing if changes cannot be saved.

Practice status is self-reported. Filtering it keeps the selected entry open, including when that entry no longer matches. Sequential edits from another tab are rebased on current saved data; the browser store does not provide an atomic simultaneous-edit guarantee. Unknown reference IDs in backups are retained so future or temporarily unavailable references do not lose their notes.

## Content and provenance

The Dhalsim demonstrations are short, silent excerpts from [elieatscrayons' Dhalsim combo/oki tutorial](https://www.youtube.com/watch?v=UW6GlWHKy7o), published 4 July 2025. Each entry records the original source interval and review status. Source review confirms what the footage demonstrates; it does not establish validity on the current game patch. See the [source coverage index](docs/source-coverage.md) and [source audit](docs/source-audit.md).

Ryu adds selected demonstrations from Joe Ebios, ThisIsAMKIDD and オバハン. The [Ryu coverage and source review](docs/ryu-source-coverage.md) records each interval, source date, execution conditions and deliberate omissions.

Akuma adds selected demonstrations from Joe Ebios' beginner and Classic guides. The [Akuma coverage and source review](docs/akuma-source-coverage.md) records the inspected intervals and omissions, including uncertain patch-sensitive setups. These entries remain source-reviewed; current-patch execution has not been tested in-game.

Character-only URLs use `?character=ryu` or `?character=akuma`; existing `?entry=...` links infer their character. Search, Saved counts and Quick switch stay within the active character, while learner backups retain all characters.

This repository starts private. No open-source license or public media redistribution policy has been chosen. Attribution and source records must accompany media; public publication requires a separate asset review.

## Workspace

- `apps/web`: SvelteKit reader and browser-local personal library.
- `packages/reference`: shared catalog types, validation, and search.
- `content/games`: curated references, separate from personal data.
- `tools/ingest`: repeatable extraction and preparation tools.
- `docs`: product, source, design, and architecture decisions.

The repository starts on `develop`. Feature changes are reviewed through pull requests. CI verifies changes and does not deploy or publish the application. A release branch and deployment target can be introduced when needed.
