# README screenshots

Captured from Hyper Chamber v1.0.0-beta.1 on 13 November 2026, using the compiled browser interface at commit `dc52154039f798253e0d5cdc5b79bf14fda50e86` (merged as `fad62e2b51bb3ad0f94c499422bca4509c71511c`). These are real app screens in a fresh browser session, converted to WebP without retouching. Each image is one viewport, rather than a stitched page capture.

The capture used an isolated local SQLite library initialized with the full development catalog; no learner notes are shown. These screens include the final B / N navigation and stationary filter controls. It shows the interface with that content available; the desktop app's bundled starter contains three Dhalsim demonstrations, and additional references need their character packs.

| Image                     | Viewport    | App route                                 |
| ------------------------- | ----------- | ----------------------------------------- |
| [Practice](practice.webp) | 1440 × 1000 | `?entry=ryu-joe-lights-od-tatsu-heavy-dp` |
| [Library](library.webp)   | 1440 × 1000 | `?character=dhalsim`                      |
| [Phone](phone.webp)       | 390 × 844   | `?entry=ryu-joe-lights-od-tatsu-heavy-dp` |

The practice and phone views show Joe Ebios' [Classic RYU Combos & Setup guide season 3](https://www.youtube.com/watch?v=Nxe9bFjbD0I&t=248), from the 4:08–4:13 source excerpt, paused 2.25 seconds into the prepared clip. Dhalsim's library shows its actual 130-reference collection; gameplay previews come from elieatscrayons' [DHALSIM COMBO/OKI GUIDE SF6](https://www.youtube.com/watch?v=UW6GlWHKy7o).

Original creators retain credit for their footage; capture does not establish redistribution permission. The illustrated character portraits are generated assets with [reference records](../character-portraits.json). The project site copies these same screenshots and this source record during its build.

## Capture integrity

The captured assets match the final UI capture record. SHA-256 values identify the WebP files copied into the project site build.

| Image           |   Bytes | SHA-256                                                            |
| --------------- | ------: | ------------------------------------------------------------------ |
| `practice.webp` |  96,828 | `44bd80f3950fa603e5e343499f3faad5e79a3f95ec09c2805e5e658aa5922598` |
| `library.webp`  | 114,456 | `32c5f95266d4d16bceb5708ffe2dfc8f8f5eec4f60bfb0f0837951406b74fd86` |
| `phone.webp`    |  38,560 | `d7f9852a5573216efdf3166b203081651d026d85dd4516827c5a9e7c7bb24edf` |
