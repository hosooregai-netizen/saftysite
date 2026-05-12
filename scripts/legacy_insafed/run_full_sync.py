#!/usr/bin/env python3
from __future__ import annotations
import argparse
import subprocess
import sys
from datetime import date
from pathlib import Path
if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import ensure_dir, iso_now, write_json
    from scripts.legacy_insafed.full_sync_bundle import build_filtered_working_export
    from scripts.legacy_insafed.full_sync_target import resolve_target_base_url
    from scripts.legacy_insafed.full_sync_verify import audit_live_state, validate_export_counts
    from scripts.legacy_insafed.target_client import TargetErpClient
else:
    from .common import ensure_dir, iso_now, write_json
    from .full_sync_bundle import build_filtered_working_export
    from .full_sync_target import resolve_target_base_url
    from .full_sync_verify import audit_live_state, validate_export_counts
    from .target_client import TargetErpClient
def _run(command: list[str], cwd: Path) -> None:
    print({"command": command, "cwd": str(cwd)}, flush=True)
    subprocess.run(command, cwd=cwd, check=True)
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the legacy InSEF -> live ERP full sync flow.")
    parser.add_argument("--legacy-base-url", default="http://console.insafed.com/insef/public")
    parser.add_argument("--legacy-email", required=True)
    parser.add_argument("--legacy-password", required=True)
    parser.add_argument("--target-base-url", default="https://saftysite-seven.vercel.app/")
    parser.add_argument("--target-email", required=True)
    parser.add_argument("--target-password", required=True)
    parser.add_argument("--work-root", default="")
    parser.add_argument("--report-chunk-size", type=int, default=100)
    parser.add_argument("--report-sleep-seconds", type=int, default=15)
    parser.add_argument("--pdf-archive-root", default="")
    parser.add_argument("--include-admin-report-pdfs", action="store_true")
    return parser
def main() -> int:
    args = build_parser().parse_args()
    repo_root = Path(__file__).resolve().parents[2]
    target_base_url = resolve_target_base_url(args.target_base_url, repo_root)
    dated_root = f"{date.today().isoformat()}-full-sync"
    work_root = ensure_dir(Path(args.work_root).resolve() if args.work_root else repo_root / ".artifacts" / "legacy-insafed-sync" / dated_root)
    raw_root = ensure_dir(work_root / "raw-export")
    working_root = ensure_dir(work_root / "working-export")
    audit_root = ensure_dir(work_root / "audit")
    pdf_root = ensure_dir(work_root / "pdf-archive")
    _run(
        [
            sys.executable,
            "scripts/legacy_insafed/export_legacy_scope.py",
            "--legacy-base-url",
            args.legacy_base_url,
            "--username",
            args.legacy_email,
            "--password",
            args.legacy_password,
            "--out-root",
            str(raw_root),
        ],
        repo_root,
    )
    export_admin_command = [
        sys.executable,
        "scripts/legacy_insafed/export_admin.py",
        "--legacy-base-url",
        args.legacy_base_url,
        "--username",
        args.legacy_email,
        "--password",
        args.legacy_password,
        "--out-root",
        str(raw_root),
        "--include-schedule-workbook",
    ]
    if args.include_admin_report_pdfs:
        export_admin_command.append("--include-report-pdfs")
    _run(export_admin_command, repo_root)
    bundle_summary = build_filtered_working_export(raw_root, working_root)
    export_validation = validate_export_counts(raw_root, working_root, audit_root)
    token = TargetErpClient.issue_token(target_base_url, args.target_email, args.target_password)

    _run(
        [
            sys.executable,
            "scripts/legacy_insafed/import_new_erp.py",
            "--export-root",
            str(working_root),
            "--target-base-url",
            target_base_url,
            "--target-token",
            token,
        ],
        repo_root,
    )
    _run(
        [
            sys.executable,
            "scripts/legacy_insafed/sync_legacy_schedule_targets.py",
            "--export-root",
            str(working_root),
            "--legacy-site-ids-path",
            str(working_root / "target-legacy-site-ids.txt"),
            "--target-base-url",
            target_base_url,
            "--target-email",
            args.target_email,
            "--target-password",
            args.target_password,
            "--audit-dir",
            str(audit_root / "schedule-sync"),
        ],
        repo_root,
    )
    _run(
        [
            sys.executable,
            "scripts/legacy_insafed/run_import_legacy_reports.py",
            "--repo-root",
            str(repo_root),
            "--export-root",
            str(working_root),
            "--target-base-url",
            target_base_url,
            "--target-email",
            args.target_email,
            "--target-password",
            args.target_password,
            "--legacy-base-url",
            args.legacy_base_url,
            "--legacy-email",
            args.legacy_email,
            "--legacy-password",
            args.legacy_password,
            "--chunk-size",
            str(args.report_chunk_size),
            "--sleep-seconds",
            str(args.report_sleep_seconds),
        ],
        repo_root,
    )

    archive_root = args.pdf_archive_root or str((raw_root / "admin" / "reports" / "pdf").resolve())
    prepared_metadata = pdf_root / "metadata.filesystem-transfer.jsonl"
    _run(
        [
            sys.executable,
            "scripts/legacy_insafed/prepare_admin_report_pdf_archive_transfer.py",
            "--metadata-path",
            str(working_root / "admin" / "reports" / "metadata.jsonl"),
            "--pdf-dir",
            str(raw_root / "admin" / "reports" / "pdf"),
            "--archive-root",
            archive_root,
            "--months",
            "0",
            "--state-dir",
            str(pdf_root),
            "--out-metadata-path",
            str(prepared_metadata),
        ],
        repo_root,
    )
    _run(
        [
            sys.executable,
            "scripts/legacy_insafed/apply_admin_report_pdf_archive_paths.py",
            "--metadata-path",
            str(prepared_metadata),
            "--target-base-url",
            target_base_url,
            "--email",
            args.target_email,
            "--password",
            args.target_password,
            "--state-dir",
            str(pdf_root / "apply"),
        ],
        repo_root,
    )

    client = TargetErpClient(target_base_url, TargetErpClient.issue_token(target_base_url, args.target_email, args.target_password))
    live_audit = audit_live_state(working_root, client, audit_root)
    summary = {
        "archive_root": archive_root,
        "bundle_summary": bundle_summary,
        "completed_at": iso_now(),
        "export_validation": export_validation,
        "live_audit": live_audit,
        "target_base_url": target_base_url,
        "work_root": str(work_root),
    }
    write_json(work_root / "run-summary.json", summary)
    print(summary, flush=True)
    return 0
if __name__ == "__main__":
    raise SystemExit(main())
