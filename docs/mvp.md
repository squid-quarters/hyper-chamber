# Local MVP

Hyper Chamber is a local fighting-game reference app, populated with source-reviewed Street Fighter 6 / Dhalsim, Ryu, Akuma and Manon examples. Dhalsim covers all seven demonstration chapters of its original tutorial; Ryu is a curated selection across three sources, Akuma draws from two Joe Ebios guides, and Manon adds a curated collection with medal and grab conditions. It uses the Chamber design system and Hourglass H identity.

## Run

Use Node 24 and pnpm 10.16.1 from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Open `http://127.0.0.1:5376`. Stop the preview with Ctrl+C in its terminal. Use `pnpm dev --host 127.0.0.1 --port 5376` for development instead.

## Included

- Individual references covering light confirms, punish routes, anti-air, Drive Impact, corner/stun routes, midscreen/corner oki, defensive responses and an explicitly labelled spacing failure. The [Dhalsim coverage index](source-coverage.md), [Ryu coverage index](ryu-source-coverage.md), [Akuma coverage index](akuma-source-coverage.md) and [Manon coverage index](manon-source-coverage.md) list every card and interval.
- A compact Dhalsim/Ryu/Akuma/Manon character selector, character-scoped search, type/situation/practice filters, Saved counts, related alternatives and Quick switch. URLs restore character context and existing entry links infer it. Learner backups retain all characters.
- Connected inputs, copy/selectable text notation, conditions, short notes and persistent source provenance.
- Local silent clips with tap-to-play/pause, relative horizontal dragging, pause-on-release, remembered full-clip loops, 0.5×/0.75× speed, key-moment inspection and 0.25-second time nudges. R/J/L and arrow shortcuts are scoped to focused clip controls; Space activates the video button. Native player controls remain available before enhancement; a JavaScript-disabled library links to the external guide.
- Full-width tile library and dedicated practice view, with all inputs above replay. Back/Escape restores library position and tile focus; Previous/Next follows filtered results. Quick switch (Ctrl/Cmd+K) searches current results, Saved or all entries, with keyboard selection. Narrow layouts use natural vertical flow.
- Browser-local favorites, notes and self-reported practice status; versioned JSON import/export, pending-edit recovery and preservation of unknown backup IDs.
- Clip retry/source fallback, storage retry/session export, keyboard-operated dialogs and timed action descriptions.

## Validation

`pnpm verify` covers formatting, lint, TypeScript/Svelte checks, unit tests, the static build and catalog/media validation. Domain boundary tests cover unique keyframe IDs and increasing times; player boundary tests cover relative seeking, gesture direction and loop-preference failures. Existing reference IDs, execution revisions and personal-data format are preserved.

The production player was exercised with actual mouse, keyboard and touch input: relative dragging, frame hold after release, cancellation/lost capture, a second finger, vertical page scrolling, native button activation, looping, playback speed and seek/retry paths. Nonvisual seek announcements are checked after explicit inspection and remain quiet during playback. Desktop and narrow layouts are inspected for overflow and readable controls.

Independent implementation, data and visual-source reviews check the code, prepared media and authored paths. The source audit records corrections, edited continuations and repeated examples. Source review and a green build do not replace in-game validation.

## Practical limits

Source review verifies what each dated demonstration shows. Current SF6 patch validity is not established, including for footage whose creator labels it Season 3 or Year 4. Execution, reversal coverage and usefulness during a real training session remain human checks. Source-only timings and statistics visible in the footage retain that historical context.

Personal data belongs to the browser origin. Sequential tab edits preserve unrelated fields; storage does not provide an atomic simultaneous-edit guarantee. Keep exported backups. The app has no accounts, cloud sync, installable PWA or gameplay capture/control.

The reviewed Dhalsim, Ryu, Akuma and Manon libraries are shown. Game profiles and participant-aware references support later expansion, while a real second game's content and long team sequences still need their own review and interface validation. The app is private development material; public deployment and media redistribution remain separate decisions.
