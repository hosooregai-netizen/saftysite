#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import shlex
import subprocess
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path, PurePosixPath
from typing import Any

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import ensure_dir, normalize_text, write_json, write_jsonl
else:
    from .common import ensure_dir, normalize_text, write_json, write_jsonl


@dataclass
class PreparedTransfer:
    rows: list[dict[str, Any]]
    transfer_files: list[str]
    skipped_missing: int
    skipped_empty: int
    selected_count: int


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Prepare direct filesystem or URL-based admin report PDF archive transfer."
    )
    parser.add_argument("--metadata-path", required=True)
    parser.add_argument("--pdf-dir", required=True)
    parser.add_argument(
        "--archive-root",
        required=True,
        help="Filesystem root (e.g. /srv/app/uploads/legacy-admin-reports) or URL base where PDFs will live.",
    )
    parser.add_argument("--months", type=int, default=6)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument(
        "--state-dir",
        default=".artifacts/legacy-admin-report-pdf-transfer",
    )
    parser.add_argument(
        "--out-metadata-path",
        default="",
        help="Output metadata.jsonl path. Defaults to <state-dir>/metadata.filesystem-transfer.jsonl.",
    )
    parser.add_argument(
        "--target",
        default="",
        help="Optional rsync target path such as /mnt/archive or user@host:/srv/archive.",
    )
    parser.add_argument("--rsync-bin", default="rsync")
    parser.add_argument("--execute-rsync", action="store_true")
    return parser


def subtract_months(source: date, months: int) -> date:
    year = source.year
    month = source.month - months
    while month <= 0:
        month += 12
        year -= 1
    day = min(source.day, 28)
    return date(year, month, day)


def parse_visit_date(value: Any) -> date | None:
    text = normalize_text(value)[:10]
    if len(text) != 10:
        return None
    try:
        year, month, day = [int(part) for part in text.split("-")]
        return date(year, month, day)
    except Exception:
        return None


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def build_archive_pointer(archive_root: str, file_name: str) -> str:
    normalized_root = archive_root.strip()
    normalized_file = file_name.strip().lstrip("/")
    if not normalized_root:
        raise ValueError("archive_root is required")
    if normalized_root.startswith(("http://", "https://")):
        return f"{normalized_root.rstrip('/')}/{normalized_file}"
    return str(PurePosixPath(normalized_root) / normalized_file)


def prepare_transfer_rows(
    rows: list[dict[str, Any]],
    pdf_dir: Path,
    archive_root: str,
    *,
    cutoff: date | None,
    limit: int,
) -> PreparedTransfer:
    selected: list[dict[str, Any]] = []
    transfer_files: list[str] = []
    skipped_missing = 0
    skipped_empty = 0

    for row in rows:
        report_id = normalize_text(row.get("legacy_report_id"))
        visit_date = parse_visit_date(row.get("visit_date"))
        if not report_id:
            continue
        if cutoff is not None and (visit_date is None or visit_date < cutoff):
            continue

        file_name = f"{report_id}.pdf"
        pdf_path = pdf_dir / file_name
        if not pdf_path.exists():
            skipped_missing += 1
            continue
        if pdf_path.stat().st_size <= 0:
            skipped_empty += 1
            continue

        next_row = dict(row)
        next_row["pdf_exists"] = True
        next_row["pdf_size_bytes"] = pdf_path.stat().st_size
        next_row["pdf_filename"] = normalize_text(row.get("pdf_filename")) or file_name
        next_row["archive_status"] = "pdf_archived"
        next_row["original_pdf_archive_path"] = build_archive_pointer(archive_root, file_name)
        selected.append(next_row)
        transfer_files.append(file_name)

    selected.sort(
        key=lambda row: (
            normalize_text(row.get("visit_date")),
            normalize_text(row.get("legacy_report_id")),
        )
    )
    if limit > 0:
        selected = selected[:limit]
    transfer_files = [f"{normalize_text(row.get('legacy_report_id'))}.pdf" for row in selected]

    return PreparedTransfer(
        rows=selected,
        transfer_files=transfer_files,
        skipped_missing=skipped_missing,
        skipped_empty=skipped_empty,
        selected_count=len(selected),
    )


def build_rsync_command(rsync_bin: str, files_from: Path, source_dir: Path, target: str) -> list[str]:
    return [
        rsync_bin,
        "-av",
        "--ignore-existing",
        "--files-from",
        str(files_from),
        f"{source_dir.resolve()}/",
        target,
    ]


def main() -> int:
    args = build_parser().parse_args()
    metadata_path = Path(args.metadata_path).resolve()
    pdf_dir = Path(args.pdf_dir).resolve()
    if not metadata_path.exists():
        raise SystemExit(f"Metadata path does not exist: {metadata_path}")
    if not pdf_dir.exists():
        raise SystemExit(f"PDF directory does not exist: {pdf_dir}")
    if args.execute_rsync and not normalize_text(args.target):
        raise SystemExit("Provide --target when using --execute-rsync.")

    state_dir = ensure_dir(Path(args.state_dir).resolve())
    out_metadata_path = (
        Path(args.out_metadata_path).resolve()
        if normalize_text(args.out_metadata_path)
        else state_dir / "metadata.filesystem-transfer.jsonl"
    )
    transfer_list_path = state_dir / "transfer-files.txt"
    summary_path = state_dir / "summary.json"

    rows = read_jsonl(metadata_path)
    cutoff = subtract_months(date.today(), args.months) if args.months > 0 else None
    prepared = prepare_transfer_rows(
        rows,
        pdf_dir,
        args.archive_root,
        cutoff=cutoff,
        limit=max(0, args.limit),
    )

    write_jsonl(out_metadata_path, prepared.rows)
    transfer_list_path.write_text(
        "".join(f"{file_name}\n" for file_name in prepared.transfer_files),
        encoding="utf-8",
    )

    summary = {
        "metadata_path": str(metadata_path),
        "pdf_dir": str(pdf_dir),
        "archive_root": args.archive_root,
        "cutoff": cutoff.isoformat() if cutoff else None,
        "selected_count": prepared.selected_count,
        "skipped_missing": prepared.skipped_missing,
        "skipped_empty": prepared.skipped_empty,
        "out_metadata_path": str(out_metadata_path),
        "transfer_list_path": str(transfer_list_path),
        "target": normalize_text(args.target) or None,
    }

    if normalize_text(args.target):
        rsync_command = build_rsync_command(args.rsync_bin, transfer_list_path, pdf_dir, args.target)
        summary["rsync_command"] = " ".join(shlex.quote(part) for part in rsync_command)
        print(f"[pdf-transfer] rsync_command={summary['rsync_command']}", flush=True)
        if args.execute_rsync:
            subprocess.run(rsync_command, check=True)

    write_json(summary_path, summary)
    print(
        "[pdf-transfer] "
        f"selected={prepared.selected_count} skipped_missing={prepared.skipped_missing} "
        f"skipped_empty={prepared.skipped_empty}",
        flush=True,
    )
    print(f"[pdf-transfer] metadata={out_metadata_path}", flush=True)
    print(f"[pdf-transfer] files={transfer_list_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
