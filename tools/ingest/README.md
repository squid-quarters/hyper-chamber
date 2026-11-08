# Reviewed media preparation

The ingestion tool prepares already-reviewed clip boundaries and frame selections. It does not infer valid SF6 routes or claim current-patch testing.

Requirements: Python 3.10+, FFmpeg with libx264, and ffprobe. It uses Python's standard library only. Source recordings remain outside Git.

Run from the repository root with a full local source recording:

```sh
python3 tools/ingest/prepare_media.py /absolute/path/to/source.mp4 \
  --ids dhalsim-light-blast dhalsim-low-sa3 dhalsim-light-drive-blast
```

For a source segment beginning at original-video time 46 seconds:

```sh
python3 tools/ingest/prepare_media.py /absolute/path/to/sample.mp4 \
  --source-offset 46 \
  --ids dhalsim-light-blast dhalsim-low-sa3 dhalsim-light-drive-blast
```

The catalog is `content/games/sf6/references/dhalsim.json`. Its source start/end values are absolute seconds in the original video; frame `at` values are relative seconds in the prepared clip. The tool checks that the entire requested excerpt exists in the supplied file, re-encodes accurate cuts, removes audio, and exports images plus timed WebVTT descriptions next to the clip. Outputs are restricted to the static media directory.

The five initial references use three source segments:

| Segment begins at | Reference IDs                                                         |
| ----------------- | --------------------------------------------------------------------- |
| 46                | `dhalsim-light-blast`, `dhalsim-low-sa3`, `dhalsim-light-drive-blast` |
| 276               | `dhalsim-counter-hit-anti-air`                                        |
| 457               | `dhalsim-blast-teleport`                                              |

The source metadata and chapter outline are in `content/sources/`. The initial media publication state is recorded separately in `content/media.json`. Review that state before any public distribution.

To add a reference: inspect the demonstration and input display, define its exact boundaries and conditions, select explanatory frames, run the tool, inspect the outputs, then validate the catalog with the shared application schema. Keep unreviewed interpretations as drafts. Changing footage should not change the reference ID.

For another authored library, supply `--catalog path/to/references.json`. The default remains the reviewed SF6 / Dhalsim catalog. Asset output is still confined to the application's media directory. The tool does not infer game mechanics, actors or notation from a file path.

## Presentation timing

The tool trims original presentation timestamps, resets the prepared clip's clock to zero, and exports the frame presented at or before each authored key-moment time. This avoids MP4 start-time normalization and a second rounded seek moving a still across a shot boundary. Source intervals describe provenance; key-moment times describe the prepared playback timeline. Review both clip ends and every exported still after preparation.

Run the media-clock integration regressions:

```sh
python3 -m unittest discover -s tools/ingest -p 'test_*.py' -v
```

The tests generate a tiny source with a known color transition. They check an unaligned cut, the still immediately before and after that transition, and exclusion of the next take. They explicitly skip when FFmpeg or ffprobe is unavailable. They do not need the tutorial or any downloaded fixture.
