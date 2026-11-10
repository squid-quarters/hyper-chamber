# 0003: Select between populated character libraries

Status: accepted.

Ryu supplies a second reviewed Street Fighter 6 collection. The reader now exposes
a compact character selector while retaining the existing tile library and focused
practice layout. Each collection supplies its own references, situations, guide
destinations and additional notation help.

Stable reference IDs identify their character when opening an entry link, including
links created before the selector existed. A character-only URL opens that library.
Changing character resets the visible filters and returns to browsing; browser
history can restore an earlier character, reference, filters and library bookmark.
The default Dhalsim URL remains compatible with existing links.

Learner storage remains one versioned envelope keyed by global reference ID. Saved
counts, search and Quick switch are scoped to the active character. Backups preserve
all characters, including valid IDs absent from the current catalog. Switching
characters does not migrate or clear personal data.

Character metadata extends the existing game definition with optional guide links
and notation terms. Shared playback, input sequences, provenance and learner notes
continue to use the same components and schema. A future game still needs an
authored profile, reviewed content and validation of its actual interaction needs.
