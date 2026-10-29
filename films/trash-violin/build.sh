#!/bin/sh
# Rebuild 「쓰레기로 만든 바이올린」 from scratch: sh build.sh   (needs the Lemo-Opuscar library with the music tier and the vsco2ce, vcsl sample packs)
set -e
LIB=${LIB:-$HOME/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; SIZE=1080x1920
cd "$LIB"
[ -f "$HERE/paper.jpg" ] || (cd "$HERE" && $PY paper.py)                                # 0. the paper
[ -f "$HERE/fonts/fonts.css" ] || $PY "$HERE/fetch_fonts.py"                            #    font subsets (Google Fonts, OFL)
node core/render/events.mjs "$HERE" --size $SIZE                                         # 1. timeline → events.json
$PY "$HERE/music/score.py"                                                               # 2. original score
$PY "$HERE/mix.py"                                                                       # 3. ambience + foley + score → out/mix.wav
node "$HERE/subs.mjs" && $PY core/render/srt.py "$HERE/out/cues.json" "$HERE/trash-violin.srt"   # 4. subtitles
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size $SIZE --out "$HERE/out/video.mp4"   # 5. frame-by-frame render
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/trash-violin.mp4" 24 1         # 6. mux + −14 LUFS, light grain on the paper
ffmpeg -y -loglevel error -ss 42.5 -i "$HERE/trash-violin.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
