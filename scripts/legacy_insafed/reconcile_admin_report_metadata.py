#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import append_jsonl, ensure_dir, read_jsonl, write_json, write_jsonl
    from scripts.legacy_insafed.legacy_client import LegacyInsafedClient
else:
    from .common import append_jsonl, ensure_dir, read_jsonl, write_json, write_jsonl
    from .legacy_client import LegacyInsafedClient


def normalize_text(value: object) -> str:
    return value.strip() if isinstance(value, str) else ""


def infer_report_kind(row: dict[str, object]) -> str:
    haystack = " ".join(
        normalize_text(row.get(key))
        for key in [
            "report_type",
            "report_title",
            "pdf_filename",
            "site_name",
            "headquarter_name",
        ]
    ).lower()
    if "분기" in haystack or "quarter" in haystack:
        return "quarterly_summary"
    return "technical_guidance"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Reconcile legacy admin report metadata with archived PDFs.")
    parser.add_argument("--out-root", required=True)
    parser.add_argument("--username")
    parser.add_argument("--password")
    parser.add_argument("--retry-missing", action="store_true")
    parser.add_argument("--retry-corrupt", action="store_true")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    out_root = Path(args.out_root)
    admin_root = out_root / "admin"
    metadata_path = admin_root / "reports" / "metadata.jsonl"
    pdf_dir = ensure_dir(admin_root / "reports" / "pdf")
    failures_path = out_root / "failures.jsonl"
    rows = read_jsonl(metadata_path)

    client: LegacyInsafedClient | None = None
    if (args.retry_missing or args.retry_corrupt) and args.username and args.password:
        client = LegacyInsafedClient(
            "http://console.insafed.com/insef/public",
            args.username,
            args.password,
            timeout=60,
        )
        client.login()

    summary = {
        "total": len(rows),
        "pdf_archived": 0,
        "metadata_only": 0,
        "corrupt": 0,
        "retried": 0,
        "retried_success": 0,
    }
    reconciled_rows: list[dict[str, object]] = []

    for row in rows:
        report_id = normalize_text(row.get("legacy_report_id"))
        pdf_path = pdf_dir / f"{report_id}.pdf"
        should_retry = (
            client is not None
            and (
                (args.retry_missing and not pdf_path.exists())
                or (args.retry_corrupt and pdf_path.exists() and pdf_path.stat().st_size == 0)
            )
        )
        if should_retry:
            summary["retried"] += 1
            try:
                file_name = client.download_report_pdf(report_id, pdf_path)
                if file_name:
                    row["pdf_filename"] = file_name
                    summary["retried_success"] += 1
            except Exception as error:
                append_jsonl(
                    failures_path,
                    {
                        "phase": "reconcile_admin_report_metadata",
                        "legacy_report_id": report_id,
                        "error": str(error),
                    },
                )

        if pdf_path.exists():
            pdf_size = pdf_path.stat().st_size
            row["pdf_exists"] = pdf_size > 0
            row["pdf_size_bytes"] = pdf_size
            row["pdf_filename"] = normalize_text(row.get("pdf_filename")) or pdf_path.name
            row["archive_status"] = "corrupt" if pdf_size == 0 else "pdf_archived"
        else:
            row["pdf_exists"] = False
            row["pdf_size_bytes"] = 0
            row["pdf_filename"] = normalize_text(row.get("pdf_filename")) or None
            row["archive_status"] = "metadata_only"

        row["report_kind"] = infer_report_kind(row)
        row["original_pdf_archive_path"] = str(pdf_path.resolve()) if pdf_path.exists() else ""

        archive_status = normalize_text(row.get("archive_status"))
        if archive_status == "pdf_archived":
            summary["pdf_archived"] += 1
        elif archive_status == "corrupt":
            summary["corrupt"] += 1
        else:
            summary["metadata_only"] += 1

        reconciled_rows.append(row)

    write_jsonl(metadata_path, reconciled_rows)
    write_json(admin_root / "reports" / "reconcile-summary.json", summary)
    print(summary)


if __name__ == "__main__":
    main()
