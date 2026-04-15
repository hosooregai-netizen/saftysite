#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import read_jsonl
else:
    from .common import read_jsonl


def read_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Audit legacy report import completeness from import artifacts."
    )
    parser.add_argument("--export-root", required=True, help="Legacy export/import root directory.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    export_root = Path(args.export_root)
    reports_root = export_root / "admin" / "reports"

    summary_path = reports_root / "import-summary.json"
    metadata_path = reports_root / "metadata.jsonl"
    failures_path = reports_root / "import-failures.jsonl"
    archive_only_path = reports_root / "archive-only.jsonl"

    required_paths = [summary_path, metadata_path, failures_path, archive_only_path]
    missing = [str(path) for path in required_paths if not path.exists()]
    if missing:
        print(
            json.dumps(
                {
                    "ok": False,
                    "reason": "missing_artifacts",
                    "missing": missing,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return 1

    summary = read_json(summary_path)
    metadata_rows = read_jsonl(metadata_path)
    failure_rows = read_jsonl(failures_path)
    archive_only_rows = read_jsonl(archive_only_path)

    payload = {
        "ok": len(failure_rows) == 0,
        "summary": summary,
        "metadata_count": len(metadata_rows),
        "failure_count": len(failure_rows),
        "archive_only_count": len(archive_only_rows),
        "unresolved_legacy_report_ids": [
            str(row.get("legacy_report_id") or "").strip()
            for row in failure_rows + archive_only_rows
            if str(row.get("legacy_report_id") or "").strip()
        ],
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if payload["ok"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
