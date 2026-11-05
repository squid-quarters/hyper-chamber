# Local MVP

Hyper Chamber is a local fighting-game reference app, initially populated with 13 Street Fighter 6 / Dhalsim examples. It uses the Chamber design system and Hourglass H identity.

## Run

Use Node 24 and pnpm 10.16.1 from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Open `http://127.0.0.1:5376`. Stop the preview with Ctrl+C in its terminal. Use `pnpm dev --host 127.0.0.1 --port 5376` for development instead.

## Included

- Thirteen individual references covering light confirms, punish routes, anti-air, Drive Impact, corner extensions and oki.
- Search, type/situation/practice filters, saved entries, related alternatives and URL-restored selection/history.
- Connected inputs, copy/selectable text notation, conditions, short notes and persistent source provenance.
- Local silent clips, replay, full-clip loops, 0.5×/0.75× speed, key-moment inspection and 0.25-second time nudges. R/J/L shortcuts are scoped to focused clip controls.
- Focus view and narrow layouts, with offscreen reference selection revealing its detail.
- Browser-local favorites, notes and self-reported practice status; versioned JSON import/export, pending-edit recovery and preservation of unknown backup IDs.
- Clip retry/source fallback, storage retry/session export, keyboard-operated dialogs and timed action descriptions.

## Validation

`pnpm verify` covers formatting, lint, TypeScript/Svelte checks, 92 unit tests, the static build, and 13 references/95 media references. Four boundary tests cover unique keyframe IDs and increasing times. The original five reference objects and media remain unchanged.

The production reader was exercised with `agent-browser`: every clip and its final keyframe, playback/loop/speed/time nudges, error recovery, repeated clipboard fallback, discovery/history, status changes, focus view, backups, sequential cross-tab edits, corrupt storage, quota failures, unsaved-note export and retry. Viewports from 320 to 1440 pixels showed no page overflow; frame images retained their proportions. Rendered text contrast and inverse-surface keyboard focus were checked.

Independent implementation and visual source reviews found and corrected a clipboard disclosure state bug, offscreen detail navigation, a mislabelled connecting kick, and two clip-boundary overlaps. There are no unresolved material findings in the reviewed local MVP. The temporary palette prototype was absorbed into the app and removed from the repository.

## Practical limits

Source review verifies the supplied July 2025 demonstrations, not the current SF6 patch. Execution, reversal coverage and usefulness during a real training session remain human checks. Source-only timings and statistics visible in the footage retain that historical context.

Personal data belongs to the browser origin. Sequential tab edits preserve unrelated fields; storage does not provide an atomic simultaneous-edit guarantee. Keep exported backups. The app has no accounts, cloud sync, installable PWA or gameplay capture/control.

Only the reviewed Dhalsim library is shown. Game profiles and participant-aware references support later expansion, while a real second game's content and long team sequences still need their own review and interface validation. The app is private development material; public deployment and media redistribution remain separate decisions.
