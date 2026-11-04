# Design system exploration

This is a proposal awaiting visual feedback. The working compendium keeps its current design while the samples in `design/prototype/index.html` explore a replacement. Open that file directly in a browser; it needs no server or network. The prototype is outside the SvelteKit app and is not included in its build.

## Question

Can a static H mark suggest an hourglass, while a restrained tile system makes the interface feel suited to fighting-game practice? Compare the same Dhalsim reference in three palettes before choosing a direction. Palette and logo choices are independent. These are creative interpretations of time, training and martial arts, not official franchise colors or artwork.

## Candidate foundation

- Use a compact angular H/hourglass monogram, with a separate readable wordmark. Check it in one color, on light and dark surfaces, and at small sizes. The mark stays static; it does not indicate loading or elapsed time.
- Keep the condensed display face for reference titles, a plain sans-serif for controls and notes, and monospace for authored move notation. Letter case and spacing should distinguish headings from inputs without reducing readability.
- Use flat rectangular modules, shared edges and consistent gaps. Reserve tiles for references, media and meaningful practice sections. Short notes and labels do not each need a separate card. Avoid a multicolored dashboard or ornamental counters.
- Keep the connected input sequence, with authored labels and cues. A connector still means order only. Footage supplies the main imagery and remains unfiltered across palettes.
- Show selection with a clear border or marker as well as color. Keyboard focus has its own visible treatment. Form controls retain native behavior and visible labels.

## Palette directions

The samples hold content, layout and typography constant so the color roles can be compared directly.

| Direction   | Association being explored                                   | Main colors                     |
| ----------- | ------------------------------------------------------------ | ------------------------------- |
| Chamber     | A quiet room set apart for practice; the time-chamber homage | Ivory, ink and aged brass       |
| Dojo        | A more forceful martial-arts training identity               | Chalk, charcoal and vermillion  |
| After Hours | Late practice and arcade timing                              | Midnight, ice and electric blue |

These are alternatives, not three simultaneously active themes. Choose a base palette first; decide on a second light/dark appearance only if it helps actual practice.

## Token boundaries

The candidate palette must define foreground/background pairs for canvas, panels, subtle surfaces, inverse panels, accent actions and notices. Secondary text, borders, focus, warnings and errors have explicit roles. A brand accent must not silently stand for learner progress, source review or current-game validity.

The implementation should also name display/UI/input fonts, a short type scale, a spacing scale, and control/panel radii. Components consume semantic roles instead of embedding one palette's colors. The sample token export is a candidate contract, not a published API.

Adoption needs a deliberate migration: the current notation panel, frame markers, selected references, saved/loop states, forms, notices and dialogs still contain literal colors. Changing the existing accent variable alone would leave mixed palettes. Preserve source/version disclosures, authored game notation, personal-data behavior, focus visibility and frame descriptions during that migration.

## Reference research

[YouTube's game library](https://mobbin.com/screens/51422fe7-611e-4ab3-a865-fa61050ff5ce) shows aligned image tiles with short labels underneath. [The New York Times Games](https://mobbin.com/screens/2d09cdf4-d99d-44a6-94a9-429b5b0c760f) shows repeated tile modules with a separate action area. Those screens inform grouping and alignment only. The logo, palette associations and component treatment are original design proposals by GPT-6 Astra.

## Decision to capture

Pending user feedback: preferred palette, preferred H/hourglass mark, and whether the tile density feels useful beside a running game. After a direction is selected, absorb the approved tokens/assets into the app and remove the unused prototype variants. No production styling decision has been made by generating these samples.
