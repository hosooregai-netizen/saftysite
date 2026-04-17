#!/usr/bin/env python3

from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path
from typing import Any

import requests

if __package__ in {None, ""}:
    import sys

    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import append_jsonl, ensure_dir, normalize_text, read_jsonl
    from scripts.legacy_insafed.target_client import TargetErpClient
else:
    from .common import append_jsonl, ensure_dir, normalize_text, read_jsonl
    from .target_client import TargetErpClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Upload recent legacy admin report PDFs to the ERP asset store.")
    parser.add_argument("--metadata-path", required=True)
    parser.add_argument("--pdf-dir", required=True)
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--months", type=int, default=6)
    parser.add_argument("--state-dir", default=".artifacts/legacy-admin-report-pdf-uploads/last-six-months")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--dry-run", action="store_true")
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


def login_target(base_url: str, email: str, password: str) -> str:
    last_error: Exception | None = None
    for attempt in range(1, 6):
        try:
            response = requests.post(
                f"{base_url.rstrip('/')}/auth/token",
                data={"username": email.strip(), "password": password},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=60,
            )
            response.raise_for_status()
            payload = response.json()
            token = normalize_text(payload.get("access_token"))
            if not token:
                raise RuntimeError("Target token response did not include access_token.")
            return token
        except Exception as error:
            last_error = error
            if attempt == 5:
                break
    raise RuntimeError(f"Target login failed after retries: {last_error}")


def build_upload_filename(row: dict[str, Any]) -> str:
    report_id = normalize_text(row.get("legacy_report_id")) or "unknown"
    visit_date = normalize_text(row.get("visit_date"))[:10] or "undated"
    return f"legacy-admin-report-{visit_date}-{report_id}.pdf"


def main() -> int:
    args = build_parser().parse_args()
    metadata_path = Path(args.metadata_path).resolve()
    pdf_dir = Path(args.pdf_dir).resolve()
    state_dir = ensure_dir(Path(args.state_dir).resolve())
    success_path = state_dir / "success.jsonl"
    failure_path = state_dir / "failure.jsonl"

    cutoff = subtract_months(date.today(), args.months)
    uploaded_ids = {
        normalize_text(row.get("legacy_report_id"))
        for row in read_jsonl(success_path)
        if normalize_text(row.get("legacy_report_id"))
    }
    rows = read_jsonl(metadata_path)
    targets: list[dict[str, Any]] = []
    for row in rows:
        report_id = normalize_text(row.get("legacy_report_id"))
        visit_date = parse_visit_date(row.get("visit_date"))
        pdf_path = pdf_dir / f"{report_id}.pdf"
        if not report_id or report_id in uploaded_ids or visit_date is None or visit_date < cutoff:
            continue
        if not pdf_path.exists() or pdf_path.stat().st_size <= 0:
            continue
        row["_pdf_path"] = str(pdf_path)
        targets.append(row)

    targets.sort(key=lambda row: normalize_text(row.get("visit_date")))
    if args.limit > 0:
        targets = targets[: args.limit]

    print(
        f"[recent-pdf-upload] cutoff={cutoff.isoformat()} targets={len(targets)} already_uploaded={len(uploaded_ids)}",
        flush=True,
    )
    if args.dry_run or not targets:
        return 0

    token = login_target(args.target_base_url, args.email, args.password)
    client = TargetErpClient(args.target_base_url, token, timeout=120)

    for index, row in enumerate(targets, start=1):
        report_id = normalize_text(row.get("legacy_report_id"))
        pdf_path = Path(str(row["_pdf_path"]))
        upload_filename = build_upload_filename(row)
        try:
            asset = client.upload_content_asset(pdf_path, upload_filename=upload_filename)
            append_jsonl(
                success_path,
                {
                    "legacy_report_id": report_id,
                    "visit_date": normalize_text(row.get("visit_date")),
                    "site_name": normalize_text(row.get("site_name")),
                    "source_pdf_path": str(pdf_path),
                    "upload_filename": upload_filename,
                    "asset_path": asset.get("path"),
                    "asset_file_name": asset.get("file_name"),
                    "asset_size": asset.get("size"),
                },
            )
            print(
                f"[recent-pdf-upload] uploaded {index}/{len(targets)} report_id={report_id} date={row.get('visit_date')} file={upload_filename}",
                flush=True,
            )
        except Exception as error:
            append_jsonl(
                failure_path,
                {
                    "legacy_report_id": report_id,
                    "visit_date": normalize_text(row.get("visit_date")),
                    "site_name": normalize_text(row.get("site_name")),
                    "source_pdf_path": str(pdf_path),
                    "upload_filename": upload_filename,
                    "error": str(error),
                },
            )
            print(
                f"[recent-pdf-upload] failed {index}/{len(targets)} report_id={report_id}: {error}",
                flush=True,
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
