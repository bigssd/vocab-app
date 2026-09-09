#!/usr/bin/env python3
"""Generate the plain PWA icon PNGs without third-party packages."""

import struct
import zlib
from pathlib import Path


def chunk(kind: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )


def rounded_inside(x: int, y: int, x1: int, x2: int, y1: int, y2: int, r: int) -> bool:
    if x < x1 or x > x2 or y < y1 or y > y2:
        return False
    cx = min(max(x, x1 + r), x2 - r)
    cy = min(max(y, y1 + r), y2 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def make_icon(size: int) -> bytes:
    s = size
    rows = bytearray()
    bg = (29, 78, 216)
    card = (248, 250, 252)
    blue = (37, 99, 235)
    light = (147, 197, 253)
    gray = (203, 213, 225)

    x1, x2 = int(s * 0.22), int(s * 0.78)
    y1, y2 = int(s * 0.17), int(s * 0.83)
    r = int(s * 0.085)

    for y in range(s):
        rows.append(0)
        for x in range(s):
            color = bg
            if rounded_inside(x, y, x1, x2, y1, y2, r):
                color = card
                ratio = y / s
                if abs(ratio - 0.36) < 0.028:
                    color = blue
                elif abs(ratio - 0.47) < 0.028:
                    color = light
                elif abs(ratio - 0.58) < 0.028:
                    color = gray
            rows.extend(color)

    raw = zlib.compress(bytes(rows), 9)
    ihdr = struct.pack(">IIBBBBB", s, s, 8, 2, 0, 0, 0)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", raw)
        + chunk(b"IEND", b"")
    )


def main() -> None:
    public = Path(__file__).resolve().parent.parent / "public"
    for size in (192, 512):
        (public / f"icon-{size}.png").write_bytes(make_icon(size))
        print(f"Wrote icon-{size}.png")


if __name__ == "__main__":
    main()
