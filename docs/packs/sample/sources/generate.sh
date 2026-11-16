#!/bin/sh
# Developer-only reproduction of the original sample assets. App users do not need these tools.
set -eu
sample_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
render_dir=$(mktemp -d "${TMPDIR:-/tmp}/hc-demo-render.XXXXXX")
trap 'rm -f "$render_dir/phase-1.png" "$render_dir/phase-2.png"; rmdir "$render_dir"' EXIT
magick "$sample_dir/sources/phase-1.svg" "$render_dir/phase-1.png"
magick "$sample_dir/sources/phase-2.svg" "$render_dir/phase-2.png"
ffmpeg -hide_banner -loglevel error -y -loop 1 -t 2 -i "$render_dir/phase-1.png" -loop 1 -t 2 -i "$render_dir/phase-2.png" -filter_complex '[0:v][1:v]concat=n=2:v=1:a=0,format=yuv420p' -c:v libx264 -an -movflags +faststart "$sample_dir/media/demo-placeholder/clip.mp4"
magick "$render_dir/phase-1.png" -quality 88 "$sample_dir/media/demo-placeholder/poster.jpg"
