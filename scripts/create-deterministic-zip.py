"""Create a byte-stable ZIP from a staging directory without directory entries."""
from __future__ import annotations

import os
import sys
import zipfile

source, destination = sys.argv[1], sys.argv[2]
files = []
for root, directories, names in os.walk(source):
    directories.sort()
    for name in sorted(names):
        files.append(os.path.join(root, name))

with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9, strict_timestamps=True) as archive:
    for path in files:
        relative = os.path.relpath(path, source).replace(os.sep, "/")
        info = zipfile.ZipInfo(relative, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o100644 & 0xFFFF) << 16
        with open(path, "rb") as handle:
            archive.writestr(info, handle.read(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
