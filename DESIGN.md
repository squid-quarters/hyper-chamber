# Hyper Chamber design system

Hyper Chamber is a practice reference, used beside a fighting game. Put character selection, a searchable library, ordered inputs and replay controls within reach. The interface does not need promotional copy.

## Identity and surfaces

Keep the static Hourglass H with bevelled pillars, a narrow waist and detached chamber rails, condensed Barlow reference titles and DM Sans interface text. Chamber remains a light palette of ivory, ink and restrained brass. Semantic colors are defined in apps/web/src/app.css; components consume those roles.

Use the canvas for browsing and the footer, white for reference content, and a second neutral surface for grouped controls. Keep the dark masthead and source-video stage. Brass highlights the wordmark, a fine masthead seam, replay aperture corners and a small number of actions and saved states. The chamber details are static so repeated practice stays calm. Source footage supplies the demonstrations. Generated character portraits use a consistent ivory-and-brass ink illustration style. A quiet generated stone-chamber backdrop spans wide viewports behind solid content surfaces; the masthead spans the viewport without boxed white side gutters.

Keep controls slightly rounded and tiles rectangular. One border groups a region; repeated outlines and nested cards do not establish hierarchy. Selected controls use a filled surface, weight or a checkmark. A selected keyframe has a toned caption and a short bottom marker. Keyboard focus uses a separate two-pixel outline. Forced-color mode may use the platform highlight outline for selection.

Use one icon family, Lucide, alongside authored geometric direction and sequence diagrams. Use monospace for inputs and timings, not general labels. No slogans, ornamental heading prefixes, decorative statistics or page-load animations.

## Library and character selection

The character heading contains a portrait, name, game and reference count. Search, All references/Saved, training goals and reference type precede the tiles. Starting situation, outcome and practice status remain separate refinements. The result count shares a row with the refinements. Filters scroll with the library so they cannot cover references.

A tile places its title before its source still, then starting conditions, outcomes and a short execution summary. Long titles and tags wrap. The tile is a real link; browser open-in-new-tab behavior remains available.

The character trigger shows the current portrait and name. It opens a non-modal searchable roster, with portrait/name rows and a checkmark for the current character. Search accepts names without punctuation. Arrow keys navigate the visible grid, Enter chooses, and Escape dismisses without leaving the current reference. Native popover behavior supplies light dismissal; browsers without it use the same visible picker with an explicit fallback. The roster scrolls independently while its search remains visible.

Portraits are 512-pixel generated illustrations based on high-resolution SF6 identity artwork. Preserve online identity-reference URLs, dimensions and hashes, generation prompts and output hashes in docs/character-portraits.json. They are unofficial interface illustrations, not Capcom artwork or gameplay evidence. Keep source downloads and native generation originals out of version control.

## Practice

Previous and Next remain the primary actions, with targets at least 48 CSS pixels high, a visible filtered-result position and disabled ends. Back to library and Quick switch stay secondary. Preserve URL state, browser history, saved references, personal notes and the originating library scroll/focus. P/N navigate references, K plays or pauses and R replays; show desktop navigation key hints and keep shortcuts inactive while editing, composing text or using an overlay. Provide a remembered single-key shortcut opt-out under Shortcuts; preserve Cmd/Ctrl+K and focused native controls when disabled. Arrow keys remain scoped to clip inspection.

Inputs precede the replay. Compact move nodes wrap in reading order and use SVG connectors for order only. They do not imply a cancel, link, branch or timing window. Authored move labels and execution cues remain in the expanded explanations. The compact input toolbar has one Copy inputs action. Notation help stays in the app bar; selectable original notation is shown automatically if copying fails.

Keep inputs, replay and playback controls together in a laptop window. Longer disclosures and notes grow the page. Phones use natural vertical flow, 56-pixel Previous/Next controls, larger input tokens and 44-pixel playback controls. A compact practice app bar keeps the fighter picker and utility icons available while preserving room for the route and replay. Browsing retains the full wordmark. Playback is silent. Autoplay offers Follow playback (default), Always play and Start paused for reference changes. Follow playback carries the current play/pause state; Quick switch preserves the state from before its temporary pause. A naturally ended non-looping clip counts as paused. Loop, speed and autoplay preferences persist separately from learner data, and remain usable in memory if storage is blocked. Changing the mode does not interrupt the current clip. Picture dragging, timing nudges and selected frames pause for inspection.

## Notation and supporting content

The notation key uses three keyboard-accessible sections: Inputs, Game terms and Fighter terms. The header names the game; the selected fighter's portrait and an explicit Selected fighter label appear only within Fighter terms. Inputs pairs a direction pad with the game's button layout. Authored definitions appear one to three per page according to viewport space with explicit previous/next controls, keeping a bounded dialog readable on phones and short laptop windows. Use a bounded 544-pixel dialog and retain scrolling as a fallback for zoom and unusually short viewports. Active tabs retain a system highlight outline in forced colors. Character-specific terms stay with the selected character. The direction pad states which way the character faces. Do not infer move timing or resource costs from the presentation.

Conditions, execution notes and learner notes follow the replay. A grouped Source & review section separates the linked source title and creator/excerpt metadata from the review status, authored review note and game version. Related references follow in a responsive grid. Keep source review distinct from current-patch in-game testing. Use short, factual labels and actionable recovery messages; remove text that only restates the heading.

The page, footer and root share a continuous warm ivory canvas, including beyond the document's scroll edge. Reserve a stable root scrollbar gutter across library, practice and dialog states; never toggle root overflow to lock a modal. Do not implement a JavaScript scroll trap. Narrow layouts, zoom, reduced motion, forced colors, keyboard use, empty filters and unavailable media are part of verification.

## References

The earlier [design exploration](docs/design-system-exploration.md) records the adopted Hourglass H and Chamber identity. [Wrangle](https://mobbin.com/screens/8bf2342f-1b0a-4ebc-843e-eb1a9de59702) and [Delphi](https://mobbin.com/screens/3bd2e734-61a0-40f5-ad42-4447060ec985) provide viewed examples of searchable portrait/name selection. [Duolingo](https://mobbin.com/screens/f11c28b3-230d-4971-9b17-409364020123) provides a viewed example of a visual selection with a toned state. Their structure informed the roster; its placement and Chamber styling are project decisions.

Impeccable's Operate, copy and craft guidance informed this revision. The skill is installed at user scope; it is not vendored into this repository, and no detector hook is required to run the app.

## App footer and version

Display the web app version from apps/web/package.json, linked to the repository changelog. Attribute the app to Squid Quarters and keep only the project repository link accessible in a quiet footer with the small chamber mark. Add the Squid Quarters website only when its destination is ready. These are app versions, separate from each reference's game-version verification.
