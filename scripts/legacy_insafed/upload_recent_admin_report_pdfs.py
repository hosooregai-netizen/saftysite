#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os
import time
from datetime import date
from pathlib import Path
from typing import Any

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
    parser.add_argument("--export-root")
    parser.add_argument("--metadata-path")
    parser.add_argument("--pdf-dir")
    parser.add_argument(
        "--target-base-url",
        default=os.environ.get("LEGACY_IMPORT_TARGET_BASE_URL", "").strip(),
    )
    parser.add_argument(
        "--email",
        default=os.environ.get("LEGACY_IMPORT_TARGET_EMAIL", "").strip(),
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("LEGACY_IMPORT_TARGET_PASSWORD", ""),
    )
    parser.add_argument("--months", type=int, default=6)
    parser.add_argument("--state-dir", default=".artifacts/legacy-admin-report-pdf-uploads/last-six-months")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sleep-seconds", type=float, default=5.0)
    parser.add_argument("--failure-cooldown-seconds", type=float, default=30.0)
    parser.add_argument("--max-consecutive-failures", type=int, default=3)
    parser.add_argument("--max-file-size-mb", type=float, default=0.0)
    parser.add_argument("--login-timeout", type=int, default=30)
    parser.add_argument("--request-timeout", type=int, default=90)
    parser.add_argument("--login-retries", type=int, default=2)
    parser.add_argument("--request-retries", type=int, default=2)
    parser.add_argument("--repeat", action="store_true")
    parser.add_argument("--repeat-sleep-seconds", type=float, default=120.0)
    parser.add_argument("--max-cycles", type=int, default=0)
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


def resolve_export_paths(
    export_root: str | None,
    metadata_path: str | None,
    pdf_dir: str | None,
) -> tuple[Path, Path]:
    root = Path(export_root).resolve() if normalize_text(export_root) else None
    resolved_metadata = (
        Path(metadata_path).resolve()
        if normalize_text(metadata_path)
        else (root / "admin" / "reports" / "metadata.jsonl" if root else None)
    )
    resolved_pdf_dir = (
        Path(pdf_dir).resolve()
        if normalize_text(pdf_dir)
        else (root / "admin" / "reports" / "pdf" if root else None)
    )
    if resolved_metadata is None or resolved_pdf_dir is None:
        raise ValueError("Provide either --export-root or both --metadata-path and --pdf-dir.")
    if not resolved_metadata.exists():
        raise ValueError(f"Metadata path does not exist: {resolved_metadata}")
    if not resolved_pdf_dir.exists():
        raise ValueError(f"PDF directory does not exist: {resolved_pdf_dir}")
    return resolved_metadata, resolved_pdf_dir


def build_upload_filename(row: dict[str, Any]) -> str:
    report_id = normalize_text(row.get("legacy_report_id")) or "unknown"
    visit_date = normalize_text(row.get("visit_date"))[:10] or "undated"
    return f"legacy-admin-report-{visit_date}-{report_id}.pdf"


def format_megabytes(size_bytes: int) -> str:
    return f"{size_bytes / 1024 / 1024:.2f}MB"


def run_once(args: argparse.Namespace) -> int:
    metadata_path, pdf_dir = resolve_export_paths(args.export_root, args.metadata_path, args.pdf_dir)
    target_base_url = normalize_text(args.target_base_url)
    email = normalize_text(args.email)
    password = args.password

    state_dir = ensure_dir(Path(args.state_dir).resolve())
    success_path = state_dir / "success.jsonl"
    failure_path = state_dir / "failure.jsonl"

    cutoff = subtract_months(date.today(), args.months)
    max_file_size_bytes = int(args.max_file_size_mb * 1024 * 1024) if args.max_file_size_mb > 0 else 0
    uploaded_ids = {
        normalize_text(row.get("legacy_report_id"))
        for row in read_jsonl(success_path)
        if normalize_text(row.get("legacy_report_id"))
    }
    rows = read_jsonl(metadata_path)
    targets: list[dict[str, Any]] = []
    oversized_rows: list[tuple[str, int]] = []
    for row in rows:
        report_id = normalize_text(row.get("legacy_report_id"))
        visit_date = parse_visit_date(row.get("visit_date"))
        pdf_path = pdf_dir / f"{report_id}.pdf"
        if not report_id or report_id in uploaded_ids or visit_date is None or visit_date < cutoff:
            continue
        if not pdf_path.exists():
            continue
        file_size = pdf_path.stat().st_size
        if file_size <= 0:
            continue
        if max_file_size_bytes > 0 and file_size > max_file_size_bytes:
            oversized_rows.append((report_id, file_size))
            continue
        row["_pdf_path"] = str(pdf_path)
        row["_pdf_size"] = file_size
        targets.append(row)

    targets.sort(key=lambda row: normalize_text(row.get("visit_date")))
    if args.limit > 0:
        targets = targets[: args.limit]

    print(
        f"[recent-pdf-upload] cutoff={cutoff.isoformat()} targets={len(targets)} already_uploaded={len(uploaded_ids)}",
        flush=True,
    )
    if oversized_rows:
        print(
            "[recent-pdf-upload] "
            f"skipped_oversized={len(oversized_rows)} max_file_size_mb={args.max_file_size_mb:.2f}",
            flush=True,
        )
    if args.dry_run or not targets:
        return 0

    try:
        token = TargetErpClient.issue_token(
            target_base_url,
            email,
            password,
            timeout=max(1, args.login_timeout),
            max_retries=max(1, args.login_retries),
        )
    except Exception as error:
        print(f"[recent-pdf-upload] login failed: {error}", flush=True)
        return 1
    client = TargetErpClient(
        target_base_url,
        token,
        timeout=max(1, args.request_timeout),
        max_retries=max(1, args.request_retries),
    )

    consecutive_failures = 0
    for index, row in enumerate(targets, start=1):
        report_id = normalize_text(row.get("legacy_report_id"))
        pdf_path = Path(str(row["_pdf_path"]))
        pdf_size = int(row.get("_pdf_size") or 0)
        upload_filename = build_upload_filename(row)
        try:
            asset = client.upload_content_asset(pdf_path, upload_filename=upload_filename)
            consecutive_failures = 0
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
                "[recent-pdf-upload] "
                f"uploaded {index}/{len(targets)} report_id={report_id} date={row.get('visit_date')} "
                f"size={format_megabytes(pdf_size)} file={upload_filename}",
                flush=True,
            )
            if args.sleep_seconds > 0 and index < len(targets):
                time.sleep(args.sleep_seconds)
        except Exception as error:
            consecutive_failures += 1
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
                "[recent-pdf-upload] "
                f"failed {index}/{len(targets)} report_id={report_id} size={format_megabytes(pdf_size)} "
                f"consecutive_failures={consecutive_failures}: {error}",
                flush=True,
            )
            if consecutive_failures >= max(1, args.max_consecutive_failures):
                print(
                    "[recent-pdf-upload] "
                    f"stopping after {consecutive_failures} consecutive failures to let the server recover",
                    flush=True,
                )
                return 1
            if args.failure_cooldown_seconds > 0:
                time.sleep(args.failure_cooldown_seconds)
    return 0


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        resolve_export_paths(args.export_root, args.metadata_path, args.pdf_dir)
    except ValueError as error:
        parser.error(str(error))

    target_base_url = normalize_text(args.target_base_url)
    email = normalize_text(args.email)
    password = args.password
    if not target_base_url:
        parser.error("Missing --target-base-url or LEGACY_IMPORT_TARGET_BASE_URL.")
    if not email:
        parser.error("Missing --email or LEGACY_IMPORT_TARGET_EMAIL.")
    if not password:
        parser.error("Missing --password or LEGACY_IMPORT_TARGET_PASSWORD.")
    if args.repeat and args.dry_run:
        parser.error("--repeat cannot be combined with --dry-run.")

    if not args.repeat:
        return run_once(args)

    cycle = 0
    last_exit_code = 0
    while True:
        cycle += 1
        print(f"[recent-pdf-upload] cycle={cycle} starting", flush=True)
        last_exit_code = run_once(args)
        if args.max_cycles > 0 and cycle >= args.max_cycles:
            print(f"[recent-pdf-upload] reached max cycles ({args.max_cycles}), stopping", flush=True)
            return last_exit_code
        if args.repeat_sleep_seconds > 0:
            print(
                f"[recent-pdf-upload] cycle={cycle} finished exit_code={last_exit_code}; "
                f"sleeping {args.repeat_sleep_seconds:.1f}s before next cycle",
                flush=True,
            )
            time.sleep(args.repeat_sleep_seconds)


if __name__ == "__main__":
    raise SystemExit(main())
