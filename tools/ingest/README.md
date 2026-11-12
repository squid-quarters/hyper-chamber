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

The catalog is `content/games/sf6/references/dhalsim.json`. Its source start/end values are absolute seconds in the original video; frame `at` values are relative seconds in the prepared clip. The tool checks that the entire requested excerpt exists in the supplied file, re-encodes accurate cuts, preserves source audio, and exports images plus timed WebVTT descriptions next to the clip. Outputs are restricted to the static media directory.

The five initial references use three source segments:

| Segment begins at | Reference IDs                                                         |
| ----------------- | --------------------------------------------------------------------- |
| 46                | `dhalsim-light-blast`, `dhalsim-low-sa3`, `dhalsim-light-drive-blast` |
| 276               | `dhalsim-counter-hit-anti-air`                                        |
| 457               | `dhalsim-blast-teleport`                                              |

The source metadata and chapter outline are in `content/sources/`. The initial media publication state is recorded separately in `content/media.json`. Review that state before any public distribution.

To add a reference: inspect the demonstration and input display, define its exact boundaries and conditions, select explanatory frames, run the tool, inspect the outputs, then validate the catalog with the shared application schema. Keep unreviewed interpretations as drafts. Changing footage should not change the reference ID.

For another authored library, supply `--catalog path/to/references.json`. The default remains the reviewed SF6 / Dhalsim catalog. Asset output is still confined to the application's media directory. The tool does not infer game mechanics, actors or notation from a file path.

## Audio in newly prepared references

Audio is retained by default. A video-only source requires a separate audio recording or an explicit `--allow-silent` decision. The tool never creates a silent clip merely because an earlier download omitted audio.

```sh
python3 tools/ingest/prepare_media.py /absolute/path/to/video-only.mp4 \
  --audio-source /absolute/path/to/original-audio.m4a \
  --catalog content/games/sf6/references/ryu.json \
  --ids ryu-joe-lights-od-tatsu-heavy-dp
```

`--source-offset` describes the video segment's original start; `--audio-source-offset` independently describes a separate audio segment's original start. Both default to zero. The audio begins at the actual first retained video frame and ends at the authored source boundary. A fractional final displayed frame is padded with silence instead of including audio from the next scene. AAC audio uses 128 kbps stereo at 48 kHz. The browser's initial mute state is a separate playback preference.

## Restoring audio in existing clips

Use the restoration tool to add audio without re-encoding reviewed video or regenerating stills and descriptions. Work one source at a time; an audio-only download is sufficient when the retained original has no audio. Keep downloads and reports under an ignored local work directory, and remove newly downloaded source audio only after the batch and its report pass review. Do not delete retained source originals.

```sh
python3 tools/ingest/restore_audio.py /absolute/path/to/original-audio.m4a \
  --catalog content/games/sf6/references/ryu.json \
  --source-id joe-ebios-ryu-2025 \
  --video-source /absolute/path/to/reviewed-original-video.mp4 \
  --report .local/audio-batches/ryu-joe/restoration.json
```

Supply `--ids` to try a small subset first. The source ID must match each selected reference. Use `--source-offset` for an audio segment and `--video-source-offset` for a video segment; each is an original-video timestamp, not the prepared clip's zero clock.

The retained original must be the recording identified by the source ledger. The tool caches its presentation timestamps once and checks each prepared clip's frame count and cadence against the requested interval. This locates the first retained frame after an unaligned authored cut. Frame-clock matching supports alignment; it does not establish a recording's identity or current-patch gameplay validity.

When the original variant is unavailable, restoration requires an explicit reviewed `--audio-alignment-offset` relative to the authored start, an `--alignment-note`, and the known `--alignment-uncertainty` in seconds. Record limitations honestly instead of describing an assumed source boundary as exact synchronization.

```sh
python3 tools/ingest/restore_audio.py /absolute/path/to/original-audio.m4a \
  --catalog content/games/sf6/references/dhalsim.json \
  --source-id elieatscrayons-dhalsim-2025 \
  --audio-alignment-offset 0 \
  --alignment-uncertainty 0.034 \
  --alignment-note 'Authored boundary; original video variant unavailable for frame-clock comparison.' \
  --report .local/audio-batches/dhalsim/restoration.json
```

Legacy clips may retain a positive first-frame timestamp. Restoration preserves that timestamp and every later video clock; it does not move the video to zero. Audio ends at the last video packet's presentation time plus its duration, which can differ from a legacy container's reported duration. For original-clock alignment, the source time at player time zero is the matched first source-frame time minus the retained first video timestamp. If that would precede the authored interval, the tool inserts a short leading silence rather than taking audio from outside the reviewed boundary. An explicit fallback offset instead describes the source time at player zero directly; its bounded trailing pad can include both the retained initial timestamp and fractional final-frame rounding. The report records the retained first timestamp, presentation endpoint, video-stream duration and any leading or trailing padding separately.

Each reference is processed through one temporary MP4 beside the live clip. Only audio is encoded. Before atomic replacement, the tool checks stereo AAC and duration, fully decodes both streams, and compares every video packet's payload hash, PTS, DTS and duration plus codec metadata. Missing/truncated audio, a source-clock mismatch or failed verification leaves the previous clip intact and removes the temporary output. Source audio uses accurate input-side seeking, avoiding repeated full-tutorial decoding for late excerpts.

The private JSON report records source hashes, canonical boundaries, actual alignment and uncertainty, packet evidence, durations, file sizes and output hashes. It is written after each completed clip. Repeating the same command skips outputs whose request, reference boundaries and file hash still match; interrupted or changed outputs are verified again. A failed batch can therefore resume without keeping full copies of every intermediate clip.

## Presentation timing

The tool trims original presentation timestamps, resets the prepared clip's clock to zero, and exports the frame presented at or before each authored key-moment time. This avoids MP4 start-time normalization and a second rounded seek moving a still across a shot boundary. Source intervals describe provenance; key-moment times describe the prepared playback timeline. Review both clip ends and every exported still after preparation.

Run the media-clock integration regressions:

```sh
python3 -m unittest discover -s tools/ingest -p 'test_*.py' -v
```

The tests generate small color and audio-tone transitions. They check presentation-clock cuts and stills, source-audio alignment and segment offsets, exact video preservation, resume behavior, explicit silent-source handling and atomic failures. They explicitly skip when FFmpeg or ffprobe is unavailable. They do not need the tutorial or any downloaded fixture.
