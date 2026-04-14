#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import normalize_text, read_jsonl, write_jsonl
else:
    from .common import normalize_text, read_jsonl, write_jsonl


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Map legacy admin data rows to new ERP content payloads.")
    parser.add_argument("--data-path", required=True)
    parser.add_argument("--out-path", required=True)
    parser.add_argument("--unmapped-path", required=True)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    rows = read_jsonl(Path(args.data_path))
    mapped: list[dict[str, object]] = []
    unmapped: list[dict[str, object]] = []
    for row in rows:
        title = normalize_text(
            row.get("measures")
            or row.get("hazardous_type")
            or row.get("element_factor")
            or row.get("rule")
        )
        body = normalize_text(row.get("measures_detail"))
        if not title and not body:
            unmapped.append(row)
            continue
        mapped.append(
            {
                "legacy_data_id": row.get("legacy_data_id"),
                "content_type": "legal_reference",
                "title": title or f"Legacy data {row.get('legacy_data_id')}",
                "code": f"legacy-admin-data-{row.get('legacy_data_id')}",
                "body": {
                    "body": body,
                    "legacyDivision": row.get("division_label"),
                    "legacyRule": row.get("rule"),
                    "legacyElement": row.get("element"),
                    "legacyFactor": row.get("factor"),
                    "legacyElementFactor": row.get("element_factor"),
                    "legacyHazardousType": row.get("hazardous_type"),
                },
                "tags": [tag for tag in [normalize_text(row.get("division_label")), "legacy-admin-data"] if tag],
                "sort_order": 0,
                "is_active": True,
            }
        )
    write_jsonl(Path(args.out_path), mapped)
    write_jsonl(Path(args.unmapped_path), unmapped)
    print(f"mapped {len(mapped)} content items, unmapped {len(unmapped)} rows")


if __name__ == "__main__":
    main()
