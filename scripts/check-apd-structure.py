#!/usr/bin/env python3
"""Fail if the ACTIVE seed has stub lead-ins or unformatted APD markers."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "lib" / "seed" / "baseline-document.json"
PHRASE = "Working-copy baseline " + "text for"

FLUSH_NUMBER = re.compile(r"(?m)^\(\d+\) ")
FLUSH_LETTER = re.compile(r"(?m)^\([a-z]\) ")


def main() -> int:
    raw = SEED.read_text(encoding="utf-8")
    if PHRASE in raw:
        print(f"FAIL: stub lead-in still present in {SEED}")
        return 1
    doc = json.loads(raw)
    sections = [s for c in doc["chapters"] for s in c["sections"]]
    empty = [s["id"] for s in sections if not (s.get("body") or "").strip()]
    flush = [s["id"] for s in sections if FLUSH_NUMBER.search(s["body"]) or FLUSH_LETTER.search(s["body"])]
    if empty:
        print("FAIL: empty bodies:", ", ".join(empty))
        return 1
    if flush:
        print("FAIL: flush (1)/(a) markers (should be indented):", ", ".join(flush[:12]))
        return 1
    print(f"PASS: {len(sections)} official APD bodies, 0 stubs, numbered markers indented")
    return 0


if __name__ == "__main__":
    sys.exit(main())
