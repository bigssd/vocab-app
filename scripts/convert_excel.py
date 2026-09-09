#!/usr/bin/env python3
"""Convert the exam frequency workbook into the frontend data file.

The generated JSON is intentionally independent from Excel. The script keeps
the source row number as a stable id, sorts records by frequency descending,
and normalizes placeholder cells without deleting original fields.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


def clean(value: object) -> str:
    if value is None:
        return ""
    return str(value).replace("\r\n", "\n").replace("\r", "\n").strip()


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "source",
        nargs="?",
        default=root / "2013.10-2026.4真题单词汇总(词频表).xlsm",
        help="Path to the xlsm source file",
    )
    parser.add_argument(
        "output",
        nargs="?",
        default=root / "src" / "data" / "words.json",
        help="Output JSON path",
    )
    args = parser.parse_args()

    try:
        import openpyxl
    except ImportError as exc:
        print("openpyxl is required: python3 -m pip install openpyxl", file=sys.stderr)
        return 2

    source = Path(args.source)
    workbook = openpyxl.load_workbook(source, data_only=True, read_only=True)
    if "词频顺序" not in workbook.sheetnames:
        print("Expected a sheet named '词频顺序'.", file=sys.stderr)
        return 2
    sheet = workbook["词频顺序"]
    rows = sheet.iter_rows(values_only=True)
    header = next(rows)
    expected = (
        "序号",
        "单词",
        "音标",
        "词典释义",
        "词频",
        "例句",
        "考试大纲释义",
        "单词默写",
        "单词默写",
        "单词默写",
        "单词默写",
        "难度自查",
    )
    if tuple(str(value) for value in header) != expected:
        print("Unexpected header shape:", header, file=sys.stderr)
        return 2

    records = []
    errors = []
    for row_number, row in enumerate(rows, start=2):
        word_id = row_number - 1
        word = clean(row[1])
        if not word:
            continue
        if word_id != int(row[0]):
            errors.append(f"row {row_number}: 序号 mismatch {row[0]}")
        if word.lower() != word:
            errors.append(f"row {row_number}: non-lowercase word {word}")
        if " " in word or "\t" in word:
            errors.append(f"row {row_number}: word contains whitespace {word}")

        phonetic = clean(row[2])
        dictionary_meaning = clean(row[3])
        example = clean(row[5])
        exam_meaning = clean(row[6])
        try:
            frequency = int(float(str(row[4])))
        except (TypeError, ValueError):
            frequency = None
        if frequency is None:
            errors.append(f"row {row_number}: invalid frequency {row[4]}")
            continue

        records.append(
            {
                "id": word_id,
                "word": word,
                "phonetic": phonetic or None,
                "dictionaryMeaning": dictionary_meaning or None,
                "frequency": frequency,
                "example": example or None,
                "examMeaning": None if exam_meaning == "-" else exam_meaning,
            }
        )

    if errors:
        for error in errors[:40]:
            print(error, file=sys.stderr)
        print(f"{len(errors)} validation error(s)", file=sys.stderr)
        return 2

    records.sort(key=lambda item: (-item["frequency"], item["id"]))
    words = []
    seen_ids = set()
    seen_words = set()
    for rank, record in enumerate(records, start=1):
        if record["id"] in seen_ids:
            print(f"Duplicate id: {record['id']}", file=sys.stderr)
            return 2
        seen_ids.add(record["id"])
        if record["word"] in seen_words:
            print(f"Duplicate word: {record['word']}", file=sys.stderr)
            return 2
        seen_words.add(record["word"])
        words.append({"rank": rank, **record})

    payload = {
        "meta": {
            "source": source.name,
            "sheet": "词频顺序",
            "count": len(words),
            "sortedBy": "frequency descending, original row order as tie breaker",
        },
        "words": words,
    }

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    print(
        "Converted "
        f"{len(words)} words "
        f"(phonetics {sum(bool(w['phonetic']) for w in words)}, "
        f"examples {sum(bool(w['example']) for w in words)}, "
        f"exam meanings {sum(bool(w['examMeaning']) for w in words)}) -> {output}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
