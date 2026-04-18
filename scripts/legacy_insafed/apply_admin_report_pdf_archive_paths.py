#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import append_jsonl, ensure_dir, normalize_text, read_jsonl
    from scripts.legacy_insafed.target_client import TargetErpClient
else:
    from .common import append_jsonl, ensure_dir, normalize_text, read_jsonl
    from .target_client import TargetErpClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Apply rewritten original_pdf_archive_path values to existing legacy reports."
    )
    parser.add_argument("--metadata-path", required=True)
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--state-dir", default=".artifacts/legacy-admin-report-pdf-transfer/apply")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--login-timeout", type=int, default=30)
    parser.add_argument("--request-timeout", type=int, default=60)
    parser.add_argument("--login-retries", type=int, default=2)
    parser.add_argument("--request-retries", type=int, default=2)
    parser.add_argument("--dry-run", action="store_true")
    return parser


def infer_report_kind(row: dict[str, Any]) -> str:
    kind = normalize_text(row.get("report_kind"))
    return "quarterly_summary" if kind == "quarterly_summary" else "technical_guidance"


def build_report_key(row: dict[str, Any]) -> str:
    report_id = normalize_text(row.get("legacy_report_id"))
    return f"legacy:{infer_report_kind(row)}:{report_id}"


def build_upsert_payload(report: dict[str, Any], archive_path: str) -> dict[str, Any]:
    meta = report.get("meta")
    next_meta = dict(meta) if isinstance(meta, dict) else {}
    next_meta["original_pdf_archive_path"] = archive_path
    next_meta["originalPdfArchivePath"] = archive_path

    return {
        "report_key": normalize_text(report.get("report_key")),
        "report_title": normalize_text(report.get("report_title")),
        "site_id": normalize_text(report.get("site_id")),
        "headquarter_id": report.get("headquarter_id"),
        "schedule_id": report.get("schedule_id"),
        "assigned_user_id": report.get("assigned_user_id"),
        "visit_date": report.get("visit_date"),
        "visit_round": report.get("visit_round"),
        "total_round": report.get("total_round"),
        "progress_rate": report.get("progress_rate"),
        "document_kind": report.get("document_kind"),
        "payload": report.get("payload") if isinstance(report.get("payload"), dict) else {},
        "meta": next_meta,
        "status": report.get("status"),
        "create_revision": False,
        "revision_reason": "manual_save",
    }


def main() -> int:
    args = build_parser().parse_args()
    metadata_path = Path(args.metadata_path).resolve()
    if not metadata_path.exists():
        raise SystemExit(f"Metadata path does not exist: {metadata_path}")

    state_dir = ensure_dir(Path(args.state_dir).resolve())
    success_path = state_dir / "success.jsonl"
    failure_path = state_dir / "failure.jsonl"

    rows = [
        row
        for row in read_jsonl(metadata_path)
        if normalize_text(row.get("legacy_report_id")) and normalize_text(row.get("original_pdf_archive_path"))
    ]
    rows.sort(key=lambda row: build_report_key(row))
    if args.limit > 0:
        rows = rows[: args.limit]

    if not rows:
        print("[pdf-transfer-apply] no rows to update", flush=True)
        return 0

    token = TargetErpClient.issue_token(
        args.target_base_url,
        args.email,
        args.password,
        timeout=max(1, args.login_timeout),
        max_retries=max(1, args.login_retries),
    )
    client = TargetErpClient(
        args.target_base_url,
        token,
        timeout=max(1, args.request_timeout),
        max_retries=max(1, args.request_retries),
    )

    print(f"[pdf-transfer-apply] targets={len(rows)}", flush=True)
    for index, row in enumerate(rows, start=1):
        report_key = build_report_key(row)
        archive_path = normalize_text(row.get("original_pdf_archive_path"))
        try:
            report = client.fetch_report_by_key(report_key)
            payload = build_upsert_payload(report, archive_path)
            if not args.dry_run:
                client.upsert_report(payload)
            append_jsonl(
                success_path,
                {
                    "report_key": report_key,
                    "legacy_report_id": normalize_text(row.get("legacy_report_id")),
                    "original_pdf_archive_path": archive_path,
                    "dry_run": args.dry_run,
                },
            )
            print(
                f"[pdf-transfer-apply] updated {index}/{len(rows)} report_key={report_key}",
                flush=True,
            )
        except Exception as error:
            append_jsonl(
                failure_path,
                {
                    "report_key": report_key,
                    "legacy_report_id": normalize_text(row.get("legacy_report_id")),
                    "original_pdf_archive_path": archive_path,
                    "error": str(error),
                },
            )
            print(
                f"[pdf-transfer-apply] failed {index}/{len(rows)} report_key={report_key}: {error}",
                flush=True,
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
