"""Media-clock regression checks. Run with Python 3, FFmpeg and ffprobe installed."""

import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

import prepare_media as media


@unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'FFmpeg and ffprobe required')
class PresentationClockTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        previous = media.STATIC
        media.STATIC = self.root / 'static'
        self.addCleanup(setattr, media, 'STATIC', previous)
        self.source = self.root / 'source.mp4'
        subprocess.run([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
            '-f', 'lavfi', '-i', 'color=c=red:s=64x36:r=10:d=1',
            '-f', 'lavfi', '-i', 'color=c=blue:s=64x36:r=10:d=1',
            '-filter_complex', '[0:v][1:v]concat=n=2:v=1:a=0[v]',
            '-map', '[v]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(self.source),
        ], check=True)

    def reference(self, end, times):
        return {
            'id': 'clock-example',
            'source': {'start': 0.12, 'end': end},
            'media': {
                'clip': '/media/clock-example/clip.mp4',
                'frames': [{'id': f'frame-{index}', 'src': f'/media/clock-example/{index}.png',
                            'at': at, 'alt': 'Observed color', 'label': 'Color'}
                           for index, at in enumerate(times)],
            },
        }

    def color(self, path):
        self.assertTrue(path.is_file(), 'The requested presentation frame must be exported')
        rgb = subprocess.check_output([
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', str(path),
            '-vf', 'scale=1:1', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-',
        ])
        return rgb[0], rgb[2]

    def test_stills_match_the_frame_presented_at_each_requested_time(self):
        # The first retained source frame is at 0.2s; blue starts at clip time 0.8s.
        # A second rounded-up seek used to show blue prematurely at 0.79s.
        reference = self.reference(1.04, [0.79, 0.82])
        media.prepare(reference, self.source, 0, allow_silent=True)
        clip = media.STATIC / 'media/clock-example/clip.mp4'
        probe = json.loads(subprocess.check_output([
            'ffprobe', '-v', 'error', '-show_entries', 'stream=start_time', '-of', 'json', str(clip),
        ], text=True))
        self.assertAlmostEqual(float(probe['streams'][0]['start_time']), 0, places=5)
        red, blue = self.color(media.STATIC / 'media/clock-example/0.png')
        self.assertGreater(red, 200)
        self.assertLess(blue, 40)
        red, blue = self.color(media.STATIC / 'media/clock-example/1.png')
        self.assertLess(red, 40)
        self.assertGreater(blue, 200)

    def test_trimming_before_a_source_cut_excludes_the_next_take(self):
        reference = self.reference(0.99, [0.78])
        media.prepare(reference, self.source, 0, allow_silent=True)
        red, blue = self.color(media.STATIC / 'media/clock-example/0.png')
        self.assertGreater(red, 200)
        self.assertLess(blue, 40)


if __name__ == '__main__':
    unittest.main()
