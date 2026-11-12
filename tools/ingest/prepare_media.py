#!/usr/bin/env python3
"""Prepare reviewed excerpts from a local source file; never guess clip boundaries."""

import argparse
import json
import math
import subprocess
from pathlib import Path

import restore_audio as audio_tools

ROOT = Path(__file__).resolve().parents[2]
STATIC = (ROOT / 'apps/web/static').resolve()
CATALOG = ROOT / 'content/games/sf6/references/dhalsim.json'


def media_path(value):
    if not isinstance(value, str) or not value.startswith('/media/'):
        raise ValueError('Expected a /media/ asset path')
    path = (STATIC / value.lstrip('/')).resolve()
    if not path.is_relative_to(STATIC / 'media'):
        raise ValueError('Media output escapes the static media directory')
    return path


def run(*args):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args], check=True)


def seconds(value):
    milliseconds = round(value * 1000)
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    return f'{hours:02}:{minutes:02}:{secs:02}.{millis:03}'


def descriptions(reference, duration):
    frames = reference['media']['frames']
    lines = ['WEBVTT', '']
    for index, frame in enumerate(frames):
        start = 0 if index == 0 else frame['at']
        end = frames[index + 1]['at'] if index + 1 < len(frames) else duration
        if end <= start:
            raise ValueError('Frame times must increase within the clip')
        text = frame['alt'].replace('-->', '→').replace('\n', ' ')
        lines.extend([str(index + 1), f'{seconds(start)} --> {seconds(end)}', text, ''])
    clip = media_path(reference['media']['clip'])
    clip.with_suffix('.vtt').write_text('\n'.join(lines), encoding='utf-8')


def prepare(reference, source, offset, audio_source=None, audio_source_offset=0, allow_silent=False):
    audio_tools.finite(offset, 'Video source offset', 0)
    audio_tools.finite(audio_source_offset, 'Audio source offset', 0)
    source = Path(source).resolve(strict=True)
    start = reference['source']['start'] - offset
    duration = reference['source']['end'] - reference['source']['start']
    if not math.isfinite(start) or not math.isfinite(duration) or start < 0 or duration <= 0:
        raise ValueError(f"Invalid source boundaries for {reference['id']}")
    probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                            '-of', 'default=noprint_wrappers=1:nokey=1', str(source)],
                           check=True, capture_output=True, text=True)
    if start + duration > float(probe.stdout) + 0.05:
        raise ValueError(f"Source file does not contain the complete {reference['id']} excerpt")
    chosen_audio = Path(audio_source).resolve(strict=True) if audio_source is not None else source
    chosen_audio_offset = audio_source_offset if audio_source is not None else offset
    audio_info = audio_tools.probe(chosen_audio)
    has_audio = any(item['codec_type'] == 'audio' for item in audio_info['streams'])
    if not has_audio and (audio_source is not None or not allow_silent):
        raise ValueError('Source has no audio; provide --audio-source or explicitly use --allow-silent')
    if has_audio:
        audio_tools.validate_audio_source(chosen_audio,
                                         reference['source']['start'] - chosen_audio_offset,
                                         reference['source']['end'] - chosen_audio_offset)
    clip = media_path(reference['media']['clip'])
    clip.parent.mkdir(parents=True, exist_ok=True)
    stage = audio_tools.temporary_output(clip)
    restored = None
    try:
        # Video is prepared independently so audio starts at its actual retained
        # first frame, not before that frame when an authored cut is unaligned.
        run('-i', str(source), '-vf',
            f'trim=start={start}:end={start + duration},setpts=PTS-STARTPTS',
            '-fps_mode', 'passthrough', '-an', '-c:v', 'libx264',
            '-preset', 'fast', '-crf', '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(stage))
        if has_audio:
            signature = audio_tools.video_signature(stage)
            first = audio_tools.alignment(reference, signature, source, offset)['audio_start']
            actual_duration = audio_tools.duration(audio_tools.probe(stage), 'video')
            restored = audio_tools.temporary_output(clip)
            audio_tools.mux_audio(stage, chosen_audio, restored, first - chosen_audio_offset,
                                  reference['source']['end'] - chosen_audio_offset, actual_duration)
            audio_tools.verify_output(restored, signature, actual_duration)
            restored.replace(clip)
        else:
            stage.replace(clip)
    finally:
        stage.unlink(missing_ok=True)
        if restored is not None:
            restored.unlink(missing_ok=True)
    timing = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                             '-show_entries', 'frame=best_effort_timestamp_time', '-of', 'json', str(clip)],
                            check=True, capture_output=True, text=True)
    frame_times = [float(frame['best_effort_timestamp_time'])
                   for frame in json.loads(timing.stdout)['frames']]
    if not frame_times or abs(frame_times[0]) > 0.0001:
        raise ValueError('Prepared clip must have a zero-based presentation timeline')
    for frame in reference['media']['frames']:
        at = frame['at']
        if not math.isfinite(at) or at < 0 or at >= duration:
            raise ValueError('Frame timestamp falls outside its clip')
        image = media_path(frame['src'])
        image.parent.mkdir(parents=True, exist_ok=True)
        # Select the frame presented at this time, rather than rounding a second seek up.
        index = max((index for index, presented_at in enumerate(frame_times)
                     if presented_at <= at + 1e-9), default=0)
        run('-i', str(clip), '-vf', f'select=eq(n\\,{index})', '-fps_mode', 'passthrough',
            '-frames:v', '1', '-q:v', '3', '-update', '1', str(image))
    descriptions(reference, duration)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, help='Full video or an accurately bounded source segment')
    parser.add_argument('--catalog', type=Path, default=CATALOG, help='Reference JSON file to prepare')
    parser.add_argument('--source-offset', type=float, default=0,
                        help='Original-video time at which this source file begins')
    parser.add_argument('--audio-source', type=Path, help='Separate source audio when the retained video has none')
    parser.add_argument('--audio-source-offset', type=float, default=0,
                        help='Original-video time at which the separate audio file begins')
    parser.add_argument('--allow-silent', action='store_true', help='Explicitly permit a source with no audio')
    parser.add_argument('--ids', nargs='+', required=True, help='Reviewed reference IDs to prepare')
    args = parser.parse_args()
    if not args.source.is_file() or not math.isfinite(args.source_offset) or args.source_offset < 0:
        parser.error('Provide a local source file and a finite nonnegative offset')
    if not math.isfinite(args.audio_source_offset) or args.audio_source_offset < 0:
        parser.error('Provide a finite nonnegative audio source offset')
    if args.audio_source is not None and not args.audio_source.is_file():
        parser.error('Provide an existing audio source file')
    catalog = json.loads(args.catalog.read_text(encoding='utf-8'))
    selected = [entry for entry in catalog if entry['id'] in args.ids]
    missing = set(args.ids) - {entry['id'] for entry in selected}
    if missing:
        parser.error(f'Unknown reference IDs: {", ".join(sorted(missing))}')
    for reference in selected:
        prepare(reference, args.source, args.source_offset, args.audio_source,
                args.audio_source_offset, args.allow_silent)
        print(f"Prepared {reference['id']}")


if __name__ == '__main__':
    main()
