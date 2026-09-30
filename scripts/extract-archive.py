"""Index archive pages by a digest, preserving case-sensitive source paths on Windows."""

from pathlib import Path
import hashlib
import json
import sys
import tarfile

archive = Path(sys.argv[1]).resolve()
destination = Path(sys.argv[2]).resolve()
pages = destination / 'pages'
pages.mkdir(parents=True, exist_ok=True)
index = {}
with tarfile.open(archive) as source:
    for member in source.getmembers():
        if not member.isfile():
            continue
        marker = 'reference/en/'
        if marker not in member.name or not member.name.endswith('.html'):
            continue
        relative = member.name.split(marker, 1)[1]
        if not relative.startswith('cpp/'):
            continue
        filename = hashlib.sha256(relative.encode('utf-8')).hexdigest() + '.html'
        target = pages / filename
        if not target.resolve().is_relative_to(destination):
            raise ValueError('Unsafe archive target')
        target.write_bytes(source.extractfile(member).read())
        index[relative] = filename
(destination / 'index.json').write_text(json.dumps(index), encoding='utf-8')
print(f'Indexed {len(index)} case-preserved English C++ pages')
