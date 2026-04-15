#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import append_jsonl, iso_now, read_jsonl
    from scripts.legacy_insafed.legacy_client import LegacyInsafedClient
else:
    from .common import append_jsonl, iso_now, read_jsonl
    from .legacy_client import LegacyInsafedClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Resume downloading missing legacy admin report PDFs.")
    parser.add_argument("--legacy-base-url", default="http://console.insafed.com/insef/public")
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--export-root", required=True)
    parser.add_argument("--sleep-seconds", type=int, default=10)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    export_root = Path(args.export_root).resolve()
    reports_root = export_root / "admin" / "reports"
    metadata_path = reports_root / "metadata.jsonl"
    pdf_dir = reports_root / "pdf"
    failures_path = export_root / "failures.jsonl"
    rows = read_jsonl(metadata_path)

    targets = [
        row
        for row in rows
        if str(row.get("archive_status") or "").strip() != "pdf_archived"
        or not bool(row.get("pdf_exists"))
        or int(row.get("pdf_size_bytes") or 0) <= 0
    ]

    client = LegacyInsafedClient(args.legacy_base_url, args.username, args.password, timeout=60)
    client.login()

    print(f"[resume-pdfs] {iso_now()} targets={len(targets)}", flush=True)

    for index, row in enumerate(targets, start=1):
        report_id = str(row.get("legacy_report_id") or "").strip()
        if not report_id:
            continue
        pdf_path = pdf_dir / f"{report_id}.pdf"
        try:
            if pdf_path.exists() and pdf_path.stat().st_size > 0:
                continue
            client.download_report_pdf(report_id, pdf_path)
            print(
                f"[resume-pdfs] downloaded {index}/{len(targets)} report_id={report_id} size={pdf_path.stat().st_size}",
                flush=True,
            )
        except Exception as error:
            append_jsonl(
                failures_path,
                {
                    "phase": "resume_admin_report_pdfs",
                    "legacy_report_id": report_id,
                    "error": str(error),
                },
            )
            print(f"[resume-pdfs] failed report_id={report_id}: {error}", flush=True)
            time.sleep(args.sleep_seconds)
            continue

    print(f"[resume-pdfs] completed at {iso_now()}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
