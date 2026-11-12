# Hyper Chamber design system

Hyper Chamber is a practice reference, used beside a fighting game. Put character selection, a searchable library, ordered inputs and replay controls within reach. The interface does not need promotional copy.

## Identity and surfaces

Keep the static Hourglass H, condensed Barlow reference titles and DM Sans interface text. Chamber remains a light palette of ivory, ink and restrained brass. Semantic colors are defined in apps/web/src/app.css; components consume those roles.

Use the canvas for browsing and the footer, white for reference content, and a second neutral surface for grouped controls. Keep the dark masthead and source-video stage. Brass is reserved for a small number of actions and saved state. Footage and portrait crops supply the imagery.

Keep controls slightly rounded and tiles rectangular. One border groups a region; repeated outlines and nested cards do not establish hierarchy. Selected controls use a filled surface, weight or a checkmark. A selected keyframe has a toned caption and a short bottom marker. Keyboard focus uses a separate two-pixel outline. Forced-color mode may use the platform highlight outline for selection.

Use one icon family, Lucide, alongside authored geometric direction and sequence diagrams. Use monospace for inputs and timings, not general labels. No slogans, ornamental heading prefixes, decorative statistics or page-load animations.

## Library and character selection

The character heading contains a portrait, name, game and reference count. Search, All references/Saved, training goals and reference type precede the tiles. Starting situation, outcome and practice status remain separate refinements. The result count shares a row with the refinements. Filters scroll with the library so they cannot cover references.

A tile places its title before its source still, then starting conditions, outcomes and a short execution summary. Long titles and tags wrap. The tile is a real link; browser open-in-new-tab behavior remains available.

The character trigger shows the current portrait and name. It opens a non-modal searchable roster, with portrait/name rows and a checkmark for the current character. Search accepts names without punctuation. Arrow keys navigate the visible grid, Enter chooses, and Escape dismisses without leaving the current reference. Native popover behavior supplies light dismissal; browsers without it use the same visible picker with an explicit fallback. The roster scrolls independently while its search remains visible.

Portraits are crops of the existing source recordings. Keep their source and crop provenance with the assets. They do not imply new character artwork or a different media license.

## Practice

Previous and Next remain the primary actions, with targets at least 48 CSS pixels high, a visible filtered-result position and disabled ends. Back to library and Quick switch stay secondary. Preserve URL state, browser history, saved references, personal notes and the originating library scroll/focus.

Inputs precede the replay. Compact move nodes wrap in reading order and use SVG connectors for order only. They do not imply a cancel, link, branch or timing window. Authored move labels and execution cues remain in the expanded explanations. Plain-text notation and copy fallback remain available.

Keep inputs, replay and playback controls together in a laptop window. Longer disclosures and notes grow the page. Phones use natural vertical flow. Playback stays explicit and silent; picture dragging, timing nudges and selected frames retain their existing behavior.

## Notation and supporting content

The notation key pairs a direction pad with the game's button layout, then shows the authored definitions in a readable grid. Character-specific terms stay with the selected character. The direction pad states which way the character faces. Do not infer move timing or resource costs from the presentation.

Conditions, execution notes, learner notes and source/version information follow the replay. Keep source review distinct from current-patch in-game testing. Use short, factual labels and actionable recovery messages; remove text that only restates the heading.

The page, footer and root share a continuous canvas, including beyond the document's scroll edge. Do not implement a JavaScript scroll trap. Narrow layouts, zoom, reduced motion, forced colors, keyboard use, empty filters and unavailable media are part of verification.

## References

The earlier [design exploration](docs/design-system-exploration.md) records the adopted Hourglass H and Chamber identity. [Wrangle](https://mobbin.com/screens/8bf2342f-1b0a-4ebc-843e-eb1a9de59702) and [Delphi](https://mobbin.com/screens/3bd2e734-61a0-40f5-ad42-4447060ec985) provide viewed examples of searchable portrait/name selection. [Duolingo](https://mobbin.com/screens/f11c28b3-230d-4971-9b17-409364020123) provides a viewed example of a visual selection with a toned state. Their structure informed the roster; its placement and Chamber styling are project decisions.

Impeccable's Operate, copy and craft guidance informed this revision. The skill is installed at user scope; it is not vendored into this repository, and no detector hook is required to run the app.
