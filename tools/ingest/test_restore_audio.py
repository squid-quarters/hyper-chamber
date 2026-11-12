"""Source-audio alignment and lossless-video restoration integration checks."""

import array
import contextlib
import io
import json
import math
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import prepare_media as media
import restore_audio as audio


def ffmpeg(*arguments):
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *arguments], check=True)


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'FFmpeg and ffprobe required')
class AudioRestorationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture = tempfile.TemporaryDirectory()
        cls.fixture_root = Path(cls.fixture.name).resolve()
        cls.video = cls.fixture_root / 'source-video.mp4'
        cls.sound = cls.fixture_root / 'source.wav'
        cls.legacy_video = cls.fixture_root / 'source-5994.mp4'
        ffmpeg('-f', 'lavfi', '-i', 'testsrc2=s=64x36:r=10:d=2',
               '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(cls.video))
        ffmpeg('-f', 'lavfi', '-i', 'testsrc2=s=64x36:r=60000/1001:d=2',
               '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-video_track_timescale', '60000',
               str(cls.legacy_video))
        ffmpeg('-f', 'lavfi', '-i', 'sine=frequency=330:duration=1:sample_rate=48000',
               '-f', 'lavfi', '-i', 'sine=frequency=990:duration=1:sample_rate=48000',
               '-filter_complex', '[0:a][1:a]concat=n=2:v=0:a=1[a]',
               '-map', '[a]', '-c:a', 'pcm_s16le', str(cls.sound))

    @classmethod
    def tearDownClass(cls):
        cls.fixture.cleanup()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        for module in (media, audio):
            previous = module.STATIC
            module.STATIC = self.root / 'static'
            self.addCleanup(setattr, module, 'STATIC', previous)

    def reference(self, start=0.12, end=1.44, identifier='audio-example'):
        return {'id': identifier, 'source': {'id': 'original', 'start': start, 'end': end},
                'media': {'clip': f'/media/{identifier}/clip.mp4',
                          'frames': [{'id': 'first', 'src': f'/media/{identifier}/first.jpg',
                                      'at': 0, 'alt': 'First observed frame', 'label': 'First'}]}}

    def prepared(self, **kwargs):
        reference = self.reference(**kwargs)
        media.prepare(reference, self.video, 0, allow_silent=True)
        return reference, audio.media_path(reference['media']['clip'])

    def legacy_prepared(self):
        reference = self.reference(start=8 * 1001 / 60000, end=1.44)
        media.prepare(reference, self.legacy_video, 0, allow_silent=True)
        clip = audio.media_path(reference['media']['clip'])
        shifted = clip.with_name('shifted.mp4')
        ffmpeg('-copyts', '-i', str(clip), '-map', '0:v:0', '-c:v', 'copy',
               '-output_ts_offset', str(1001 / 60000), '-video_track_timescale', '60000',
               '-avoid_negative_ts', 'disabled', str(shifted))
        shifted.replace(clip)
        self.assertAlmostEqual(audio.video_signature(clip)['presentation_times'][0],
                               1001 / 60000, places=6)
        return reference, clip

    def pcm(self, clip, at, length=0.1):
        raw = subprocess.check_output([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', str(at), '-i', str(clip),
            '-t', str(length), '-vn', '-ac', '1', '-ar', '48000', '-f', 'f32le', '-',
        ])
        samples = array.array('f')
        samples.frombytes(raw)
        self.assertGreater(len(samples), 100)
        return samples

    def frequency(self, clip, at):
        samples = self.pcm(clip, at)
        crossings = sum(1 for first, second in zip(samples, samples[1:]) if first <= 0 < second)
        return crossings * 48000 / len(samples)

    def restore(self, reference, source=None, **kwargs):
        return audio.restore_one(reference, source or self.sound, video_source=self.video, **kwargs)

    def test_restoration_preserves_every_video_packet_and_aligns_at_first_retained_frame(self):
        reference, clip = self.prepared()
        before = audio.video_signature(clip)
        still = media.STATIC / 'media/audio-example/first.jpg'
        caption = clip.with_suffix('.vtt')
        original_still, original_caption = still.read_bytes(), caption.read_bytes()
        result = self.restore(reference)
        self.assertEqual(audio.video_signature(clip), before)
        self.assertAlmostEqual(result['alignment']['audio_start'], 0.2, places=5)
        self.assertTrue(result['video_unchanged'])
        self.assertAlmostEqual(self.frequency(clip, 0.65), 330, delta=15)
        self.assertAlmostEqual(self.frequency(clip, 0.9), 990, delta=15)
        self.assertEqual(still.read_bytes(), original_still)
        self.assertEqual(caption.read_bytes(), original_caption)
        self.assertAlmostEqual(result['audio_duration'], result['video_duration'], delta=0.002)

    def test_legacy_nonzero_first_frame_keeps_video_clocks_and_full_audio_endpoint(self):
        reference, clip = self.legacy_prepared()
        before = audio.video_signature(clip)
        before_info = audio.probe(clip)
        endpoint = before['presentation_times'][-1] + 1001 / 60000
        result = audio.restore_one(reference, self.sound, alignment_offset=0,
                                   uncertainty=0.034, note='Reviewed authored boundary fallback')
        self.assertEqual(audio.video_signature(clip), before)
        self.assertAlmostEqual(result['video_first_presentation'], 1001 / 60000, places=6)
        self.assertAlmostEqual(result['video_endpoint'], endpoint, places=6)
        self.assertAlmostEqual(result['audio_duration'], endpoint, delta=0.002)
        self.assertAlmostEqual(result['video_stream_duration'],
                               audio.duration(before_info, 'video'), places=6)
        self.assertAlmostEqual(audio.duration(audio.probe(clip), 'video'),
                               audio.duration(before_info, 'video'), places=6)
        self.assertGreaterEqual(float(audio.probe(clip)['format']['duration']), endpoint - 0.001)
        self.assertAlmostEqual(self.frequency(clip, 0.7), 330, delta=15)
        self.assertAlmostEqual(self.frequency(clip, 0.95), 990, delta=15)

    def test_original_clock_alignment_pads_before_authored_start_for_legacy_video_offset(self):
        reference, clip = self.legacy_prepared()
        before = audio.video_signature(clip)
        result = audio.restore_one(reference, self.sound, video_source=self.legacy_video)
        self.assertEqual(audio.video_signature(clip), before)
        timing = result['alignment']
        self.assertAlmostEqual(timing['leading_silence_seconds'], 1001 / 60000, delta=0.000002)
        self.assertGreaterEqual(timing['audio_start'], reference['source']['start'])
        early = self.pcm(clip, 0.002, length=0.004)
        rms = math.sqrt(sum(value * value for value in early) / len(early))
        self.assertLess(rms, 0.02)
        self.assertAlmostEqual(self.frequency(clip, 0.7), 330, delta=15)
        self.assertAlmostEqual(self.frequency(clip, 0.95), 990, delta=15)

    def test_audio_segment_offset_and_input_side_seek_keep_the_original_timeline(self):
        reference, clip = self.prepared(start=0.62, end=1.54)
        segment = self.root / 'audio-from-half-second.wav'
        ffmpeg('-ss', '0.5', '-i', str(self.sound), '-c:a', 'pcm_s16le', str(segment))
        result = self.restore(reference, segment, source_offset=0.5)
        self.assertAlmostEqual(result['alignment']['audio_start'], 0.7, places=5)
        self.assertAlmostEqual(self.frequency(clip, 0.15), 330, delta=15)
        self.assertAlmostEqual(self.frequency(clip, 0.45), 990, delta=15)

    def test_fractional_final_frame_is_padded_instead_of_taking_audio_after_authored_end(self):
        reference, clip = self.prepared(end=1.04)
        result = self.restore(reference)
        self.assertAlmostEqual(result['tail_padding_seconds'], 0.06, places=5)
        samples = self.pcm(clip, 0.88, length=0.015)
        rms = math.sqrt(sum(value * value for value in samples) / len(samples))
        self.assertLess(rms, 0.002)

    def test_missing_audio_track_or_truncated_source_leaves_original_clip_untouched(self):
        reference, clip = self.prepared()
        original = clip.read_bytes()
        with self.assertRaisesRegex(ValueError, 'audio stream'):
            self.restore(reference, self.video)
        short = self.root / 'truncated.wav'
        ffmpeg('-i', str(self.sound), '-t', '1', '-c:a', 'pcm_s16le', str(short))
        with self.assertRaisesRegex(ValueError, 'complete authored excerpt'):
            self.restore(reference, short)
        with self.assertRaises(FileNotFoundError):
            self.restore(reference, self.root / 'missing.wav')
        self.assertEqual(clip.read_bytes(), original)
        self.assertEqual(list(clip.parent.glob('.clip-audio-*')), [])

    def test_invalid_offset_and_source_video_mismatch_do_not_replace_the_clip(self):
        reference, clip = self.prepared()
        original = clip.read_bytes()
        with self.assertRaisesRegex(ValueError, 'finite'):
            self.restore(reference, source_offset=float('nan'))
        alternate = self.root / 'different-cadence.mp4'
        ffmpeg('-f', 'lavfi', '-i', 'testsrc2=s=64x36:r=20:d=2',
               '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(alternate))
        with self.assertRaisesRegex(ValueError, 'frame count'):
            audio.restore_one(reference, self.sound, video_source=alternate)
        self.assertEqual(clip.read_bytes(), original)

    def test_verification_failure_removes_temporary_output_and_preserves_original(self):
        reference, clip = self.prepared()
        original = clip.read_bytes()
        with patch.object(audio, 'verify_output', side_effect=ValueError('video changed')):
            with self.assertRaisesRegex(ValueError, 'video changed'):
                self.restore(reference)
        self.assertEqual(clip.read_bytes(), original)
        self.assertEqual(list(clip.parent.glob('.clip-audio-*')), [])

    def test_missing_original_requires_explicit_alignment_and_records_its_uncertainty(self):
        reference, clip = self.prepared()
        with self.assertRaisesRegex(ValueError, 'explicit audio alignment'):
            audio.restore_one(reference, self.sound)
        result = audio.restore_one(reference, self.sound, alignment_offset=0.08,
                                   uncertainty=0.034, note='Reviewed source grid; original unavailable')
        self.assertEqual(result['alignment']['mode'], 'explicit-reviewed-offset')
        self.assertEqual(result['alignment']['uncertainty_seconds'], 0.034)
        self.assertAlmostEqual(self.frequency(clip, 0.9), 990, delta=15)

    def test_output_path_cannot_escape_media_root(self):
        reference = self.reference()
        reference['media']['clip'] = '/media/../../outside.mp4'
        with self.assertRaisesRegex(ValueError, 'escapes'):
            audio.restore_one(reference, self.sound, video_source=self.video)

    def test_symlinked_media_directory_cannot_redirect_outputs_outside_static(self):
        outside = self.root / 'outside'
        outside.mkdir()
        audio.STATIC.mkdir(parents=True)
        (audio.STATIC / 'media').symlink_to(outside, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'escapes'):
            audio.media_path('/media/redirected/clip.mp4')

    def test_cli_selects_only_matching_source_and_resumes_verified_output(self):
        reference, clip = self.prepared()
        other = self.reference(identifier='unselected')
        other['source']['id'] = 'another-source'
        catalog = self.root / 'catalog.json'
        catalog.write_text(json.dumps([reference, other]))
        report = self.root / 'restoration.json'
        arguments = ['restore_audio.py', str(self.sound), '--catalog', str(catalog),
                     '--source-id', 'original', '--video-source', str(self.video), '--report', str(report)]
        with patch.object(sys, 'argv', arguments), contextlib.redirect_stdout(io.StringIO()):
            audio.main()
        saved = json.loads(report.read_text())
        self.assertEqual(list(saved['references']), ['audio-example'])
        self.assertEqual(saved['references']['audio-example']['output_sha256'], audio.digest(clip))
        with patch.object(sys, 'argv', arguments), patch.object(audio, 'restore_one') as restore:
            with contextlib.redirect_stdout(io.StringIO()):
                audio.main()
            restore.assert_not_called()

    def test_new_media_requires_audio_or_explicit_silence_and_preserves_separate_audio(self):
        reference = self.reference()
        with self.assertRaisesRegex(ValueError, 'Source has no audio'):
            media.prepare(reference, self.video, 0)
        clip = audio.media_path(reference['media']['clip'])
        self.assertFalse(clip.exists())
        media.prepare(reference, self.video, 0, audio_source=self.sound)
        self.assertEqual(audio.stream(audio.probe(clip), 'audio')['codec_name'], 'aac')
        self.assertAlmostEqual(self.frequency(clip, 0.9), 990, delta=15)

    def test_new_media_preserves_audio_embedded_in_original_recording(self):
        combined = self.root / 'source-with-audio.mp4'
        ffmpeg('-i', str(self.video), '-i', str(self.sound), '-map', '0:v:0', '-map', '1:a:0',
               '-c:v', 'copy', '-c:a', 'aac', str(combined))
        reference = self.reference()
        media.prepare(reference, combined, 0)
        clip = audio.media_path(reference['media']['clip'])
        self.assertEqual(audio.stream(audio.probe(clip), 'audio')['codec_name'], 'aac')
        self.assertAlmostEqual(self.frequency(clip, 0.65), 330, delta=15)


if __name__ == '__main__':
    unittest.main()
