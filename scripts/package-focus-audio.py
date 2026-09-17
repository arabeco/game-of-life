"""Package the existing public focus loops as Opus. Originals stay in ignored temp/."""
from pathlib import Path
import concurrent.futures
import hashlib
import json
import subprocess
import urllib.request
import re
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'temp' / 'focus-audio-source'
OUTPUT = ROOT / 'public' / 'audio'
SOURCE.mkdir(parents=True, exist_ok=True)
OUTPUT.mkdir(parents=True, exist_ok=True)
TRACKS = ['brown-noise', 'rain', '528-healing', '432-focus', 'tibetan', 'pub', 'fireplace', 'lo-fi', 'quiet-city']
BASE = 'https://klmsdcncmhtgnlcejzdi.supabase.co/storage/v1/object/public/audio/'
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

def duration(path):
    info = subprocess.run([FFMPEG, '-hide_banner', '-i', str(path)], capture_output=True, text=True).stderr
    match = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', info)
    if not match:
        raise ValueError(f'No duration: {path}')
    return int(match[1])*3600 + int(match[2])*60 + float(match[3])

def encode(name):
    original, result = SOURCE / f'{name}.mp3', OUTPUT / f'{name}.ogg'
    if not original.exists():
        with urllib.request.urlopen(BASE + original.name, timeout=90) as response:
            original.write_bytes(response.read())
    subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', str(original),
                    '-map', '0:a:0', '-vn', '-c:a', 'libopus', '-b:a', '72k', '-vbr', 'constrained',
                    '-application', 'audio', '-map_metadata', '-1', str(result)], check=True)
    # Decode the complete result: a header alone does not prove a playable stream.
    subprocess.run([FFMPEG, '-v', 'error', '-xerror', '-i', str(result), '-f', 'null', '-'], check=True)
    source_duration, result_duration = duration(original), duration(result)
    assert abs(source_duration-result_duration) < .15, f'Truncated audio: {name}'
    record = {'file': result.name, 'sourceBytes': original.stat().st_size,
              'sourceSeconds': source_duration, 'seconds': result_duration,
              'bytes': result.stat().st_size, 'sha256': hashlib.sha256(result.read_bytes()).hexdigest()}
    print(json.dumps(record), flush=True)
    return record

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    tracks = list(pool.map(encode, TRACKS))
manifest = {'codec': 'Opus', 'container': 'Ogg', 'targetBitrate': 72000, 'vbr': 'constrained',
            'source': 'Existing MP3 loops; no WAV/FLAC originals found in tools/public.',
            'sourceBytes': sum(t['sourceBytes'] for t in tracks),
            'totalBytes': sum(t['bytes'] for t in tracks), 'tracks': tracks}
(OUTPUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps({k: v for k, v in manifest.items() if k != 'tracks'}), flush=True)
