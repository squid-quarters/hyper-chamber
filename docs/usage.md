# Using Hyper Chamber

## Finding a reference

Choose a character, browse the tile library, filter by situation or your practice status, and open a reference in the dedicated practice view. Training goals offer Punishes, Corner carry, Oki, Anti-air and Cash-out, alongside reference type. Open **Refine results** for starting situation, outcome and practice status; its count shows active refinements, and selected filters remain visible when collapsed. Clear filters sits beside those selections. Filters scroll with the tile library so they do not cover cards in short windows. Inputs sit above the replay. Back/Escape restores the originating tile and scroll position; prominent Previous/Next controls follow the filtered set, and Ctrl/Cmd+K opens Quick switch. **Save** and **Copy inputs** sit together beside the reference title, or below it on phones. Save adds the reference to your saved collection. Copy inputs copies the authored sequence; if clipboard access is blocked, the selectable original sequence appears instead.

## Playback

**Controls**, beside Replay reference, opens gesture help without interrupting the clip. Click or tap the video to play or pause. Drag sideways anywhere on the picture to inspect from the current moment; releasing holds that moment. Vertical touch gestures scroll the page. The timestamp and progress line appear during inspection or keyboard focus, with one compact toolbar for playback, replay, looping, speed and **−0.25s / +0.25s** inspection. Looping defaults on. Sound starts muted; use Sound to enable the original recording's audio, including any commentary or music. The choice is remembered. Playback settings controls reference changes: Follow playback (default) carries the current play/pause state, Always play starts each newly opened clip, and Start paused leaves each new clip paused. Sound, speed, looping and autoplay choices are remembered on this browser. Changing the mode leaves the current clip alone. If a browser blocks automatic playback, the player keeps a usable Play button.

## Keyboard shortcuts

In practice, **P / N** open the previous / next reference, **K** plays or pauses, and **R** replays. **Cmd/Ctrl+K** opens Quick switch. With the video focused, **Space** plays or pauses; with a clip control focused, **J / L** or **← / →** pause and nudge backward / forward. Single-key shortcuts stay inactive while editing or using an overlay, and can be disabled in **Playback settings**. Cmd/Ctrl+K and focused controls remain available. Keyboard controls apply only while this page has focus. Key moments jump and pause at their annotated time, and nonvisual feedback announces completed seeks. A failed clip offers a retry and a link to its original source. Native controls remain available before player enhancement; the library requires JavaScript to open practice and links to the external guide when JavaScript is disabled.

## Notes and progress

Saved references, practice status, and notes stay in this browser. Clearing site storage removes local data. Storage failures preserve pending edits and offer retry or a download of unsaved notes. Self-hosted SQLite, with one PC serving the app to phones and tablets, is planned; the current static app still uses browser storage. Accounts, login and synchronization remain outside this pass.

Practice status is self-reported. Filtering it keeps the selected entry open, including when that entry no longer matches. Sequential edits from another tab are rebased on current saved data; the browser store does not provide an atomic simultaneous-edit guarantee. The internal JSON recovery format retains unknown reference IDs so temporarily unavailable references do not lose their notes.

## Availability

The library requires JavaScript. Bundled fonts and prepared clips do not need a cloud account, while original source videos and guide links require internet access. There is no service worker or installable offline mode in this version.

Character-only URLs use the profile ID, for example `?character=ken` or `?character=lily`; existing `?entry=...` links infer their character. Search, Saved counts and Quick switch stay within the active character, while learner data retains all characters.

## Builds and versions

Build output is in `apps/web/build`. Web build artifacts are regenerated without Turborepo caching because their prepared media would otherwise be archived in duplicate. Shared-package builds remain cached.

Include a version and changelog update in the same PR as a user-facing app change: a minor version for new capabilities, a patch for fixes. Workspace package versions are independent. Documentation-only updates do not change the app version.
