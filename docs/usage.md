# Using Hyper Chamber

## Finding a reference

Choose a character, browse the tile library, filter by situation or your practice status, and open a reference in the dedicated practice view. Training goals offer Punishes, Corner carry, Oki, Anti-air and Cash-out, alongside reference type. Open **Refine results** for starting situation, outcome and practice status; its count shows active refinements, and selected filters remain visible when collapsed. Clear filters sits beside those selections. Filters scroll with the tile library so they do not cover cards in short windows. Inputs sit above the replay. Back/Escape restores the originating tile and scroll position; prominent Previous/Next controls follow the filtered set, and Ctrl/Cmd+K opens Quick switch. **Save** and **Copy inputs** sit together beside the reference title, or below it on phones. Save adds the reference to your saved collection. Copy inputs copies the authored sequence; if clipboard access is blocked, the selectable original sequence appears instead.

## Playback

**Controls**, beside Replay reference, opens gesture help without interrupting the clip. Click or tap the video to play or pause. Drag sideways anywhere on the picture to inspect from the current moment; releasing holds that moment. Vertical touch gestures scroll the page. The timestamp and progress line appear during inspection or keyboard focus, with one compact toolbar for playback, replay, looping, speed and **−0.25s / +0.25s** inspection. Looping defaults on. Sound starts muted; use Sound to enable the original recording's audio, including any commentary or music. The choice is remembered. Playback settings controls reference changes: Follow playback (default) carries the current play/pause state, Always play starts each newly opened clip, and Start paused leaves each new clip paused. Sound, speed, looping and autoplay choices are remembered on this browser. Changing the mode leaves the current clip alone. If a browser blocks automatic playback, the player keeps a usable Play button.

## Keyboard shortcuts

In practice, **P / N** open the previous / next reference, **K** plays or pauses, and **R** replays. **Cmd/Ctrl+K** opens Quick switch. With the video focused, **Space** plays or pauses; with a clip control focused, **J / L** or **← / →** pause and nudge backward / forward. Single-key shortcuts stay inactive while editing or using an overlay, and can be disabled in **Playback settings**. Cmd/Ctrl+K and focused controls remain available. Keyboard controls apply only while this page has focus. Key moments jump and pause at their annotated time, and nonvisual feedback announces completed seeks. A failed clip offers a retry and a link to its original source. Native controls remain available before player enhancement; the library requires JavaScript to open practice and links to the external guide when JavaScript is disabled.

## Notes and progress

Saved references, practice status and notes are stored in the running application's SQLite library. The desktop window and connected browsers edit the same data. Playback preferences remain specific to each browser.

Notes save after a short pause in typing. Pending edits are also kept as browser recovery drafts, tied to the library's identity. If the server cannot be reached, the app keeps the draft and offers retry or a download of unsaved notes. Keep the window open until it reports a successful save if browser recovery storage is unavailable. Clearing browser storage removes drafts and playback preferences; it does not remove notes already saved in SQLite.

Edits carry a row version. Changes to separate fields can be rebased; if another tab or device changed the same field, the app keeps the draft and shows a choice between your edits and the saved version. Conflicting recovered drafts also need a choice. Other-device updates are refreshed when the window regains focus or reconnects; this is not a live collaboration session. Practice status is self-reported, and changing its filter does not close an already selected reference.

When legacy browser notes exist at the current web address, the app imports missing entries without removing the originals. Different existing library values are kept and reported. Browser storage belongs to an address: notes from an older port, hostname or browser are not automatically visible at a new one. Valid reference IDs survive imports and content changes even when their references are temporarily unavailable.

## Library and devices

In the desktop app, **Devices** opens **Library & devices** settings for importing a `.hcpack` content archive, creating a database snapshot, and enabling device access. These controls are available only to the desktop host. Additional packs include reference metadata and media; the starter contains three Dhalsim demonstrations. Installing a pack keeps existing notes and practice status.

Device access starts off. Enable it to show a local-network address, then open that address on a phone or tablet while the computer stays awake and Hyper Chamber is running. The OS firewall must allow the connection. Every connected browser uses the same library and can edit its notes and status; there are no accounts or separate user profiles. Sharing uses local HTTP and is intended for a network you trust. Turning it off closes the network listener without changing the desktop connection.

Closing the desktop window leaves the library running. Use the application's **Quit** command to stop it; reopen the app to restore the window. Moving or copying a library requires quitting first. A database snapshot contains personal entries; copying the whole library folder also preserves the installed packs. The default desktop path on macOS is `~/Library/Application Support/com.squidquarters.hyperchamber/library`.

When running from source, `pnpm dev` uses `.local/dev-library` and serves the interface on port 5173 with its backend on 5376. `pnpm start` serves the built interface directly on port 5376 and uses `.local/library`. Set `HYPER_CHAMBER_LIBRARY_DIR` if both commands should use the same library. `HYPER_CHAMBER_PORT` changes the backend port; `HYPER_CHAMBER_WEB_PORT` changes the development interface port. Browser-only source runs do not expose native host settings.

## Availability

The library requires JavaScript. Installed references, bundled fonts and clips work without an internet connection while the host is running. Original YouTube videos and external guide links need internet access. A phone or tablet still needs a connection to the running host; there is no service worker or independent offline browser installation.

Character-only URLs use the profile ID, for example `?character=ken` or `?character=lily`; existing `?entry=...` links infer their character. Search, Saved counts and Quick switch stay within the active character, while learner data retains all characters.

## Builds and versions

Web build output is in `apps/web/build`; the server bundle is in `apps/server/dist`. Native resources are generated separately from these outputs and exclude the full media directory. Character archives and starter resources are generated from the same authored catalog. See [Desktop architecture](desktop-architecture.md) for the library layout, pack format and native build commands.

The current beta is unreleased. Version and changelog changes belong in the same PR as user-facing changes. The project site and installers are not published by the validation workflow.
