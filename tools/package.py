#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, zipfile
root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'manifest.json').read_text())['version']
files = ['manifest.json', 'background.js', 'market.js', 'popup.html', 'popup.js', 'popup.css', 'PRIVACY.md', 'README.md', 'LICENSE']
files += [f'icons/{size}.png' for size in [16, 32, 48, 128]]
dist = root / 'dist'
dist.mkdir(exist_ok=True)
archive = dist / f'robotcyb-cicadafarm-{version}.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as zipped:
    for name in sorted(files):
        info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        zipped.writestr(info, (root / name).read_bytes())
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix('.zip.sha256').write_text(f'{digest}  {archive.name}\n')
print(archive.name, archive.stat().st_size, digest)
