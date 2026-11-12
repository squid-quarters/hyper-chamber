# Hyper Chamber product scope

Hyper Chamber is a fast, visual fighting-game compendium. Its Street Fighter 6 libraries cover all 32 released characters, with selected demonstrations and explicit coverage gaps in the [roster index](roster-source-coverage.md). Its name pays homage to the Hyperbolic Time Chamber. The project has its own Squid Quarters repository and can be linked or integrated into the main website later.

The core unit is an individual reference: a combo, setup, or response. A reference combines conditions, persistent notation, selected visual moments, a dedicated replayable clip, and short notes. Search and filters should answer “I remember a route starting with this move; help me find and inspect it.”

## First version

- Choose a populated character library, then browse and search by notation, move name, situation, and outcome text.
- Use Punishes, Corner carry, Oki, Anti-air and Cash-out training goals alongside type, starting situation, outcome and self-reported practice status. Save references and follow related alternatives.
- Keep entry selection and filters in a shareable URL; restore through browser history.
- Tap a clip to play or pause, drag horizontally to inspect, and release to hold a moment. Loop, slow down, seek from a keyframe, or nudge by 0.25 seconds. Scoped R/J/L and arrow shortcuts work when a clip control has focus; Space activates the focused video button. Loop preference is remembered without autoplaying new references.
- Copy the authored input sequence, with selectable text when clipboard access is unavailable.
- A tile library opens a dedicated practice view, with inputs above replay and extra information below. Back restores library position; Previous/Next and Quick switch keep filtered or saved references in reach.
- Personal status, notes, and favorites live in browser storage with JSON backup. Failed writes preserve pending changes and offer retry/export; failed clips offer retry/source access.
- SF6 Lab supplies linked guides and longer explanations. Its organization informs terminology, not copied page layouts or an imported guide database.

## Boundaries

This is not a lesson sequence or a mastery assessment. Personal status is self-reported. The application does not detect gameplay, diagnose failed inputs, capture video, control SF6, or offer global keyboard shortcuts while the game has focus.

No accounts, cloud synchronization, public authoring editor, live frame-data feed, public hosting, or current-patch verification is part of this first version. The local web app is not yet an installable offline PWA. Other games and characters can be added as reviewed content becomes available. No empty game or character destinations are shown.

## Evidence and next content

Review individual source intervals visually. Keep draft interpretations separate from reviewed entries. A technique's kind, starting situation, and outcome are separate fields; one canonical entry can be found through several queries without duplicating it.

Test the compendium during actual practice: time to locate a route, effort to replay a transition, and ease of retaining the important conditions and inputs. Add future sources and dedicated recordings after their execution and annotations have been reviewed.

## Multiple games

The product structure is game → character or team context → individual reference. SF6 / Dhalsim was the first library; the released SF6 roster now has a library for each character with selections and gaps recorded individually; 2XKO and other games are future content interests. Game definitions own vocabulary, notation help, resource labels and guide destinations. Situation and outcome categories are supplied by each library's content.

Long sequences should remain easy to inspect: retain the full ordered execution, then add labeled phases and clear actor changes when a real multi-character reference needs them. A different game should not require a second player, note system or source-review workflow. The exact long-sequence interface remains to be validated with genuine content.
