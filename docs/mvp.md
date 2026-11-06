# Local MVP

Hyper Chamber is a local fighting-game reference app, populated with source-reviewed Street Fighter 6 / Dhalsim examples from all seven demonstration chapters of the supplied tutorial. It uses the Chamber design system and Hourglass H identity.

## Run

Use Node 24 and pnpm 10.16.1 from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Open `http://127.0.0.1:5376`. Stop the preview with Ctrl+C in its terminal. Use `pnpm dev --host 127.0.0.1 --port 5376` for development instead.

## Included

- Individual references covering light confirms, punish routes, anti-air, Drive Impact, corner/stun routes, midscreen/corner oki, defensive responses and an explicitly labelled spacing failure. The [source coverage index](source-coverage.md) lists every card and interval.
- Search, type/situation/practice filters, saved entries, related alternatives and URL-restored selection/history.
- Connected inputs, copy/selectable text notation, conditions, short notes and persistent source provenance.
- Local silent clips with tap-to-play/pause, relative horizontal dragging, pause-on-release, remembered full-clip loops, 0.5×/0.75× speed, key-moment inspection and 0.25-second time nudges. R/J/L and arrow shortcuts are scoped to focused clip controls; Space activates the video button. Native controls remain the no-JavaScript fallback.
- Focus view and narrow layouts, with offscreen reference selection revealing its detail.
- Browser-local favorites, notes and self-reported practice status; versioned JSON import/export, pending-edit recovery and preservation of unknown backup IDs.
- Clip retry/source fallback, storage retry/session export, keyboard-operated dialogs and timed action descriptions.

## Validation

`pnpm verify` covers formatting, lint, TypeScript/Svelte checks, unit tests, the static build and catalog/media validation. Domain boundary tests cover unique keyframe IDs and increasing times; player boundary tests cover relative seeking, gesture direction and loop-preference failures. Existing reference IDs, execution revisions and personal-data format are preserved.

The production player was exercised with actual mouse, keyboard and touch input: relative dragging, frame hold after release, cancellation/lost capture, a second finger, vertical page scrolling, native button activation, looping, playback speed and seek/retry paths. Nonvisual seek announcements are checked after explicit inspection and remain quiet during playback. Desktop and narrow layouts are inspected for overflow and readable controls.

Independent implementation, data and visual-source reviews check the code, prepared media and authored paths. The source audit records corrections, edited continuations and repeated examples. Source review and a green build do not replace in-game validation.

## Practical limits

Source review verifies the supplied July 2025 demonstrations, not the current SF6 patch. Execution, reversal coverage and usefulness during a real training session remain human checks. Source-only timings and statistics visible in the footage retain that historical context.

Personal data belongs to the browser origin. Sequential tab edits preserve unrelated fields; storage does not provide an atomic simultaneous-edit guarantee. Keep exported backups. The app has no accounts, cloud sync, installable PWA or gameplay capture/control.

Only the reviewed Dhalsim library is shown. Game profiles and participant-aware references support later expansion, while a real second game's content and long team sequences still need their own review and interface validation. The app is private development material; public deployment and media redistribution remain separate decisions.
