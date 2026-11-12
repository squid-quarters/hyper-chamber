#!/usr/bin/env python3
"""Restore source audio to reviewed clips without re-encoding their video."""

import argparse
import bisect
import functools
import hashlib
import json
import math
import os
import subprocess
import tempfile
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATIC = (ROOT / 'apps/web/static').resolve()


def finite(value, name, minimum=None):
    if not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f'{name} must be finite')
    if minimum is not None and value < minimum:
        raise ValueError(f'{name} must be at least {minimum}')
    return value


def digest(path):
    result = hashlib.sha256()
    with Path(path).open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()


def probe(path):
    return json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path),
    ], text=True))


def stream(info, kind):
    matches = [item for item in info['streams'] if item['codec_type'] == kind]
    if len(matches) != 1:
        raise ValueError(f'Expected exactly one {kind} stream, found {len(matches)}')
    return matches[0]


def duration(info, kind):
    item = stream(info, kind)
    value = item.get('duration', info.get('format', {}).get('duration'))
    return finite(float(value), f'{kind} duration', 0.000001)


def media_path(value):
    if not isinstance(value, str) or not value.startswith('/media/'):
        raise ValueError('Expected a /media/ clip path')
    path = (STATIC / value.lstrip('/')).resolve()
    if not path.is_relative_to(STATIC.resolve() / 'media') or path.suffix != '.mp4':
        raise ValueError('Clip output escapes the static media directory or is not MP4')
    return path


def video_signature(path):
    """Hash packet payloads and exact rational clocks, excluding container offsets."""
    info = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_streams', '-show_packets',
        '-show_data_hash', 'sha256', '-show_entries',
        'stream=codec_name,width,height,pix_fmt,time_base,extradata_hash:'
        'packet=pts,dts,duration,size,flags,data_hash', '-of', 'json', str(path),
    ], text=True))
    if len(info.get('streams', [])) != 1 or not info.get('packets'):
        raise ValueError('Clip must contain a video stream with packet timestamps')
    video = info['streams'][0]
    clock = Fraction(video['time_base'])
    rows = []
    times = []
    endpoints = []
    for packet in info['packets']:
        row = {key: packet[key] for key in ('size', 'flags', 'data_hash')}
        for key in ('pts', 'dts', 'duration'):
            if key not in packet:
                raise ValueError(f'Video packet has no {key}')
            row[key] = str(packet[key] * clock)
        rows.append(row)
        times.append(float(packet['pts'] * clock))
        endpoints.append(float((packet['pts'] + packet['duration']) * clock))
    result = {
        'stream': video,
        'packet_count': len(rows),
        'packet_sha256': hashlib.sha256(json.dumps(rows, sort_keys=True).encode()).hexdigest(),
        'presentation_times': sorted(times),
        'presentation_end': max(endpoints),
    }
    return result


def assert_same_video(before, after):
    if before != after:
        raise ValueError('Restoration changed the video payload, codec or presentation timestamps')


@functools.lru_cache(maxsize=2)
def _source_timeline(path, size, modified):
    # Packet PTS are sufficient for the reviewed H.264 sources. Read once per source;
    # do not decode an entire tutorial again for each late clip.
    info = probe(path)
    video = stream(info, 'video')
    origin = float(info.get('format', {}).get('start_time', 0))
    packets = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_packets',
        '-show_entries', 'packet=pts_time', '-of', 'json', str(path),
    ], text=True))['packets']
    times = sorted(float(packet['pts_time']) - origin for packet in packets if 'pts_time' in packet)
    if not times:
        raise ValueError('Source video has no presentation timestamps')
    return times, float(Fraction(video['time_base']))


def source_timeline(path):
    path = Path(path).resolve(strict=True)
    status = path.stat()
    return _source_timeline(str(path), status.st_size, status.st_mtime_ns)


def reference_bounds(reference):
    start = finite(reference['source']['start'], 'Source start', 0)
    end = finite(reference['source']['end'], 'Source end', 0)
    if end <= start:
        raise ValueError('Source end must follow source start')
    return start, end


def alignment(reference, video, video_source=None, video_offset=0,
              alignment_offset=None, uncertainty=0, note=''):
    start, end = reference_bounds(reference)
    finite(video_offset, 'Video source offset', 0)
    finite(uncertainty, 'Alignment uncertainty', 0)
    if video_source is not None:
        if alignment_offset is not None:
            raise ValueError('Choose a video source or an explicit alignment offset, not both')
        times, source_tick = source_timeline(video_source)
        local_start, local_end = start - video_offset, end - video_offset
        if local_start < 0:
            raise ValueError('Video source does not contain the requested start')
        first = bisect.bisect_left(times, local_start - 1e-7)
        last = bisect.bisect_left(times, local_end - 1e-7)
        selected = times[first:last]
        actual = video['presentation_times']
        tolerance = max(source_tick, float(Fraction(video['stream']['time_base']))) + 0.000002
        if len(selected) != len(actual) or not selected:
            raise ValueError('Source interval frame count does not match the prepared clip')
        first_presentation = actual[0]
        if any(abs((point - selected[0]) - (expected - first_presentation)) > tolerance
               for point, expected in zip(selected, actual)):
            raise ValueError('Source interval cadence does not match the prepared clip')
        first_source_frame = video_offset + selected[0]
        source_at_player_zero = first_source_frame - first_presentation
        audio_start = max(start, source_at_player_zero)
        leading_silence = max(0, start - source_at_player_zero)
        return {'mode': 'source-video-presentation-clock', 'audio_start': audio_start,
                'source_at_player_zero': source_at_player_zero,
                'first_source_frame': first_source_frame,
                'video_first_presentation': first_presentation,
                'leading_silence_seconds': leading_silence,
                'offset_from_authored_start': audio_start - start,
                'uncertainty_seconds': tolerance, 'source_video': str(Path(video_source).resolve()),
                'source_video_offset': video_offset, 'matched_frames': len(selected)}
    if alignment_offset is None or not note.strip():
        raise ValueError('Provide --video-source or an explicit audio alignment offset and note')
    finite(alignment_offset, 'Audio alignment offset')
    audio_start = start + alignment_offset
    if audio_start < start or audio_start >= end:
        raise ValueError('Explicit audio alignment must remain within the authored source interval')
    return {'mode': 'explicit-reviewed-offset', 'audio_start': audio_start,
            'video_first_presentation': video['presentation_times'][0],
            'leading_silence_seconds': 0, 'offset_from_authored_start': alignment_offset,
            'uncertainty_seconds': uncertainty, 'note': note.strip()}


def validate_audio_source(source, start, end):
    source = Path(source).resolve(strict=True)
    info = probe(source)
    audio = stream(info, 'audio')
    origin = float(info.get('format', {}).get('start_time', 0))
    audio_start = float(audio.get('start_time', origin)) - origin
    audio_end = audio_start + duration(info, 'audio')
    # Container/sample rounding is allowed, never a truncated tutorial or missing track.
    if start < max(0, audio_start) - 0.025 or end > audio_end + 0.025:
        raise ValueError('Source audio does not contain the complete authored excerpt')
    return info


def mux_audio(clip, source, output, start, end, clip_duration, leading_silence=0):
    finite(start, 'Local audio start', 0)
    finite(end, 'Local audio end', 0)
    finite(clip_duration, 'Clip duration', 0.000001)
    finite(leading_silence, 'Leading silence', 0)
    if leading_silence >= clip_duration:
        raise ValueError('Leading silence must not consume the complete clip')
    if end <= start:
        raise ValueError('Audio end must follow audio start')
    content_duration = min(end - start, clip_duration - leading_silence)
    # Accurate input-side seeking avoids repeatedly decoding the whole tutorial.
    # Re-encoding audio discards seek preroll. The filters then reset its clock and
    # pad only the fractional final video frame, without taking next-scene audio.
    leading_samples = round(leading_silence * 48000)
    audio_filter = (f'atrim=duration={content_duration:.12f},asetpts=PTS-STARTPTS,'
                    f'aresample=48000,adelay=delays={leading_samples}S:all=1,'
                    f'apad=whole_dur={clip_duration:.12f},atrim=duration={clip_duration:.12f}')
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-copyts',
        '-i', str(clip), '-ss', f'{start:.12f}', '-i', str(source),
        '-map', '0:v:0', '-map', '1:a:0', '-map_metadata', '0',
        '-c:v', 'copy', '-copytb', '1', '-af', audio_filter,
        '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2',
        '-avoid_negative_ts', 'disabled', '-movflags', '+faststart', str(output),
    ], check=True)


def verify_output(path, before, clip_duration):
    info = probe(path)
    audio = stream(info, 'audio')
    if audio['codec_name'] != 'aac' or int(audio['channels']) != 2:
        raise ValueError('Restored audio must be stereo AAC')
    if abs(float(audio.get('start_time', 0))) > 0.001:
        raise ValueError('Restored audio must begin on the zero presentation clock')
    audio_duration = duration(info, 'audio')
    if abs(audio_duration - clip_duration) > 0.002:
        raise ValueError('Restored audio duration differs from the retained video')
    assert_same_video(before, video_signature(path))
    subprocess.run([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-xerror', '-i', str(path),
        '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-',
    ], check=True, stdout=subprocess.DEVNULL)
    return audio_duration


def temporary_output(path):
    handle, name = tempfile.mkstemp(prefix=f'.{path.stem}-audio-', suffix=path.suffix, dir=path.parent)
    os.close(handle)
    return Path(name)


def restore_one(reference, source, source_offset=0, video_source=None, video_offset=0,
                alignment_offset=None, uncertainty=0, note='', source_sha256=None):
    finite(source_offset, 'Audio source offset', 0)
    start, end = reference_bounds(reference)
    clip = media_path(reference['media']['clip'])
    if not clip.is_file():
        raise ValueError(f'Prepared clip does not exist: {reference["id"]}')
    if Path(source).resolve() == clip:
        raise ValueError('Audio input must not be the output clip')
    original_info = probe(clip)
    video_stream_duration = duration(original_info, 'video')
    before = video_signature(clip)
    first_presentation = before['presentation_times'][0]
    if first_presentation < -0.0001:
        raise ValueError('Prepared clip must not have negative presentation timestamps')
    # Some legacy clips retain a one-frame positive PTS offset. Their stream
    # duration is a span, not the endpoint of the final displayed frame.
    clip_duration = before['presentation_end']
    timing = alignment(reference, before, video_source, video_offset,
                       alignment_offset, uncertainty, note)
    local_start, local_end = timing['audio_start'] - source_offset, end - source_offset
    finite(local_start, 'Local audio start', 0)
    validate_audio_source(source, local_start, local_end)
    # A long mismatch must not be concealed with generated silence.
    leading_silence = timing['leading_silence_seconds']
    tail_padding = max(0, clip_duration - (local_end - local_start + leading_silence))
    frame_duration = max((b - a for a, b in zip(before['presentation_times'],
                                               before['presentation_times'][1:])), default=clip_duration)
    if first_presentation > frame_duration + 0.002:
        raise ValueError('Legacy video lead exceeds one frame and needs explicit review')
    allowed_tail = frame_duration
    if timing['mode'] == 'explicit-reviewed-offset':
        # Authored-boundary fallback retains the old lead at player zero. That
        # lead and fractional final-frame rounding can both remain at the tail.
        allowed_tail += first_presentation
    if tail_padding > allowed_tail + 0.002:
        raise ValueError('Audio would require padding beyond the retained video-frame bounds')
    bytes_before = clip.stat().st_size
    output = temporary_output(clip)
    try:
        mux_audio(clip, source, output, local_start, local_end, clip_duration, leading_silence)
        audio_duration = verify_output(output, before, clip_duration)
        result = {
            'reference_id': reference['id'], 'source_id': reference['source']['id'],
            'source_start': start, 'source_end': end, 'clip': reference['media']['clip'],
            'audio_source_sha256': source_sha256 or digest(source), 'audio_source_offset': source_offset,
            'alignment': timing, 'tail_padding_seconds': tail_padding,
            'video_duration': clip_duration, 'video_endpoint': clip_duration,
            'video_stream_duration': video_stream_duration,
            'video_first_presentation': first_presentation, 'audio_duration': audio_duration,
            'video_packet_count': before['packet_count'],
            'video_packet_sha256': before['packet_sha256'], 'video_unchanged': True,
            'bytes_before': bytes_before, 'bytes_after': output.stat().st_size,
            'output_sha256': digest(output),
        }
        output.replace(clip)
        return result
    finally:
        output.unlink(missing_ok=True)


def write_report(path, report):
    path.parent.mkdir(parents=True, exist_ok=True)
    output = temporary_output(path)
    try:
        output.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
        output.replace(path)
    finally:
        output.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, help='Source recording or audio-only download')
    parser.add_argument('--catalog', type=Path, required=True)
    parser.add_argument('--source-id', required=True)
    parser.add_argument('--source-offset', type=float, default=0, help='Original time at audio file start')
    parser.add_argument('--video-source', type=Path, help='Retained original used to align video frames')
    parser.add_argument('--video-source-offset', type=float, default=0)
    parser.add_argument('--audio-alignment-offset', type=float, help='Explicit reviewed offset when original video is absent')
    parser.add_argument('--alignment-uncertainty', type=float, default=0)
    parser.add_argument('--alignment-note', default='')
    parser.add_argument('--ids', nargs='+')
    parser.add_argument('--report', type=Path, required=True, help='Private resumable JSON evidence, outside tracked media')
    args = parser.parse_args()
    try:
        finite(args.source_offset, 'Audio source offset', 0)
        finite(args.video_source_offset, 'Video source offset', 0)
        finite(args.alignment_uncertainty, 'Alignment uncertainty', 0)
        if args.audio_alignment_offset is not None:
            finite(args.audio_alignment_offset, 'Audio alignment offset')
        source = args.source.resolve(strict=True)
        catalog = json.loads(args.catalog.read_text(encoding='utf-8'))
        selected = [item for item in catalog if item['source']['id'] == args.source_id
                    and (not args.ids or item['id'] in args.ids)]
        if not selected or (args.ids and set(args.ids) != {item['id'] for item in selected}):
            raise ValueError('No matching references, or requested IDs do not belong to this source')
        report_path = args.report.resolve()
        protected = {source, args.catalog.resolve(), *(media_path(item['media']['clip']) for item in selected)}
        if args.video_source:
            protected.add(args.video_source.resolve(strict=True))
        if report_path in protected or report_path.is_relative_to((STATIC / 'media').resolve()):
            raise ValueError('Report must not overwrite inputs or live media')
        video_status = args.video_source.stat() if args.video_source else None
        request = {'algorithm_version': 2, 'source_id': args.source_id, 'audio_source_sha256': digest(source),
                   'audio_source_offset': args.source_offset,
                   'video_source': str(args.video_source.resolve()) if args.video_source else None,
                   'video_source_offset': args.video_source_offset,
                   'video_source_bytes': video_status.st_size if video_status else None,
                   'video_source_modified_ns': video_status.st_mtime_ns if video_status else None,
                   'audio_alignment_offset': args.audio_alignment_offset,
                   'alignment_uncertainty': args.alignment_uncertainty, 'alignment_note': args.alignment_note}
        report = {'schema_version': 1, 'request': request, 'references': {}}
        if report_path.exists():
            existing = json.loads(report_path.read_text(encoding='utf-8'))
            if existing.get('schema_version') != 1 or not isinstance(existing.get('references'), dict):
                raise ValueError('Existing report is not a restoration report')
            if existing.get('request') == request:
                report = existing
        for reference in selected:
            clip = media_path(reference['media']['clip'])
            previous = report['references'].get(reference['id'])
            verified = (previous and previous['source_start'] == reference['source']['start']
                        and previous['source_end'] == reference['source']['end']
                        and previous['clip'] == reference['media']['clip'] and clip.is_file()
                        and digest(clip) == previous['output_sha256'])
            if verified:
                print(f'Already verified {reference["id"]}', flush=True)
                continue
            result = restore_one(reference, source, args.source_offset, args.video_source,
                                 args.video_source_offset, args.audio_alignment_offset,
                                 args.alignment_uncertainty, args.alignment_note, request['audio_source_sha256'])
            report['references'][reference['id']] = result
            write_report(report_path, report)
            print(f'Restored {reference["id"]}', flush=True)
    except (ValueError, OSError, subprocess.CalledProcessError, KeyError, TypeError) as error:
        parser.exit(1, f'Audio restoration failed: {error}\n')


if __name__ == '__main__':
    main()
