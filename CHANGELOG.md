# Changelog

## Unreleased

- Keep the character selector and Previous/Next controls within their targets on small phones.
- Fit the character roster to the visible viewport when the on-screen keyboard opens, with a single-column roster on narrow phones.
- Keep touch-device search and note fields readable in landscape.
- Let the header scroll away in short landscape windows and fit the replay with its playback controls.
- Document Android Chrome permissions that can block access to a local library.

## 1.0.0-beta.1 (2026-11-13)

- Use B / N for previous / next references and keep training-goal and reference-type controls stationary as filter counts change.
- Add a Tauri desktop host with a bundled Node runtime and local SQLite library.
- Share the same library with phones and tablets on the local network, with device access controlled from the desktop app.
- Load references from content packs, separate from learner data and application updates; include a small complete Dhalsim starter.
- Transfer existing browser notes without removing the originals. Preserve failed edits and ask before replacing conflicting notes.
- Publish the project site with screenshots, platform information and release links.
- Publish macOS and Windows beta installers, character content packs and installation instructions, with an official Homebrew tap for macOS.

## 0.3.3 (2026-11-13)

- Align the Refine results button with the library controls and tiles, balance its row spacing, and keep wrapped result counts aligned to the right.

## 0.3.2 (2026-11-13)

- Group Save and Copy inputs beside the reference title, with a shared row on phones.
- Give Key moments and move explanations one consistent disclosure treatment; remove duplicate playback and library dividers.
- Omit empty Conditions and Execution notes sections while keeping resource information visible.

## 0.3.1 (2026-11-13)

- Unify secondary, quiet and icon actions, heading alignment, popup spacing and responsive playback controls.
- Make Copy inputs a framed icon button with stable confirmation feedback; align Input sequence and Replay reference on the same content edges.
- Simplify secondary filtering to Refine results, with active counts and full-width fields; group Clear filters with the applied selections.
- Move replay gesture instructions into on-demand Controls help, available by mouse, touch and keyboard.
- Remove duplicate filter actions, status hints and native tooltips from labeled controls.

## 0.3.0 (2026-11-12)

- Restore original source audio to all 2,068 references while preserving encoded video, timestamps, selected moments and reference revisions. Start muted and remember the sound preference.
- Replace native playback and filter dropdowns with a shared custom selection component.
- Group autoplay and keyboard preferences in Playback settings, with readable shortcut rows and a designed single-key toggle. Opening settings keeps the replay in place.
- Align component spacing, states and touch targets across the library, practice view and dialogs.
- Preserve audio in future media preparation; add resumable source batches and video-integrity checks for restoration.

## 0.2.0 (2026-11-12)

- Add Follow playback, Always play and Start paused options for opening references. Preserve loop and speed settings across references.
- Clarify game-wide notation and selected-fighter terms, and simplify the input toolbar to Copy inputs with a selectable fallback.
- Add P/N reference navigation, K play/pause and R replay hotkeys, with editing and overlay guards.
- Give phone practice larger navigation, input steps and playback controls, with a compact practice app bar.
- Refine the hourglass H and matching favicons, chamber framing, source attribution and related references.
- Display the app version and project links in the footer.

Earlier development is recorded in the repository's commit and pull-request history.
