# Chamber design system

The MVP adopts the Chamber palette and Hourglass H identity from the design study. Canonical implementation lives in `apps/web/src/app.css`, `apps/web/src/lib/components/BrandMark.svelte` and `apps/web/static/favicon.svg`. The standalone comparison remains a chat artifact; the temporary prototype variants have been removed from the repository after adoption.

## Question

Can a static H mark suggest an hourglass, while a restrained tile system makes the interface feel suited to fighting-game practice? Compare the same Dhalsim reference in three palettes before choosing a direction. Palette and logo choices are independent. These are creative interpretations of time, training and martial arts, not official franchise colors or artwork.

## Foundation

- Use a compact angular H/hourglass monogram, with a separate readable wordmark. Check it in one color, on light and dark surfaces, and at small sizes. The mark stays static; it does not indicate loading or elapsed time.
- Keep the condensed display face for reference titles, a plain sans-serif for controls and notes, and monospace for authored move notation. Letter case and spacing should distinguish headings from inputs without reducing readability.
- Use flat rectangular modules, shared edges and consistent gaps. Reserve tiles for references, media and meaningful practice sections. Short notes and labels do not each need a separate card. Avoid a multicolored dashboard or ornamental counters.
- Keep the connected input sequence, with authored labels and cues. A connector still means order only. Footage supplies the main imagery and remains unfiltered across palettes.
- Show selection with a clear border or marker as well as color. Keyboard focus has its own visible treatment. Form controls retain native behavior and visible labels.

## Palette directions

The study held content, layout and typography constant so the color roles could be compared directly. Chamber is the implemented MVP direction; the other two remain ideas for later feedback.

| Direction   | Association being explored                                   | Main colors                     |
| ----------- | ------------------------------------------------------------ | ------------------------------- |
| Chamber     | A quiet room set apart for practice; the time-chamber homage | Ivory, ink and aged brass       |
| Dojo        | A more forceful martial-arts training identity               | Chalk, charcoal and vermillion  |
| After Hours | Late practice and arcade timing                              | Midnight, ice and electric blue |

The MVP uses Chamber. A second light/dark appearance should be evaluated during actual practice before adding another maintained theme.

## Token boundaries

The palette defines foreground/background pairs for canvas, panels, subtle surfaces, inverse panels, accent actions and notices. Secondary text, borders, focus, warnings and errors have explicit roles. A brand accent must not silently stand for learner progress, source review or current-game validity.

The implementation names display/UI/input fonts and uses squared controls and panels. Components consume semantic roles instead of embedding colors. Maintain a short spacing/type scale; changes must remain readable in narrow game-adjacent windows.

The notation panel, frame markers, selected references, saved/loop states, forms, notices and dialogs use the adopted roles. Preserve source/version disclosures, authored game notation, personal-data behavior, focus visibility and frame descriptions when extending the system. New inverse surfaces need their own readable focus color.

## Reference research

[YouTube's game library](https://mobbin.com/screens/51422fe7-611e-4ab3-a865-fa61050ff5ce) shows aligned image tiles with short labels underneath. [The New York Times Games](https://mobbin.com/screens/2d09cdf4-d99d-44a6-94a9-429b5b0c760f) shows repeated tile modules with a separate action area. Those screens inform grouping and alignment only. The logo, palette associations and component treatment are original design proposals by GPT-6 Astra.

## Practice feedback

Chamber and Hourglass H are the MVP baseline. Evaluate whether the tile density, input size and focus layout work beside a running game. Palette and mark refinements can follow that feedback without changing reference IDs, execution revisions or personal backups.
