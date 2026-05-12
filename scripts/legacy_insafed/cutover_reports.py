from __future__ import annotations

import subprocess
import sys
from pathlib import Path
from typing import Any

from .common import normalize_text, write_jsonl
from .cutover_dataset import build_report_key


def prepare_report_reimport_export(
    export_root: Path,
    temp_export_root: Path,
    cutover_sites: list[dict[str, Any]],
    cutover_reports: list[dict[str, Any]],
    site_map: dict[str, str],
) -> Path:
    temp_export_root.mkdir(parents=True, exist_ok=True)
    (temp_export_root / "admin" / "reports").mkdir(parents=True, exist_ok=True)
    write_jsonl(temp_export_root / "sites.jsonl", cutover_sites)
    write_jsonl(
        temp_export_root / "admin" / "reports" / "metadata.jsonl",
        [{**row, "new_site_id": site_map.get(normalize_text(row.get("legacy_site_id")))} for row in cutover_reports],
    )
    return temp_export_root / "admin" / "reports" / "metadata.jsonl"


def run_report_reimport(
    repo_root: Path,
    export_root: Path,
    target_base_url: str,
    target_email: str,
    target_password: str,
    legacy_base_url: str,
    legacy_email: str,
    legacy_password: str,
) -> None:
    command = [
        "node",
        "./node_modules/.bin/tsx",
        "scripts/legacy_insafed/import_legacy_reports.ts",
        "--export-root",
        str(export_root),
        "--target-base-url",
        target_base_url,
        "--target-email",
        target_email,
        "--target-password",
        target_password,
        "--legacy-base-url",
        legacy_base_url,
    ]
    if legacy_email:
        command.extend(["--legacy-email", legacy_email])
    if legacy_password:
        command.extend(["--legacy-password", legacy_password])
    subprocess.run(command, cwd=repo_root, check=True)


def run_pdf_archive_apply(
    repo_root: Path,
    metadata_path: Path,
    target_base_url: str,
    target_email: str,
    target_password: str,
    state_dir: Path,
) -> None:
    subprocess.run(
        [
            sys.executable,
            "scripts/legacy_insafed/apply_admin_report_pdf_archive_paths.py",
            "--metadata-path",
            str(metadata_path),
            "--target-base-url",
            target_base_url,
            "--email",
            target_email,
            "--password",
            target_password,
            "--state-dir",
            str(state_dir),
        ],
        cwd=repo_root,
        check=True,
    )


def build_report_round_map(report_rows: list[dict[str, Any]]) -> dict[str, dict[int, str]]:
    mapped: dict[str, dict[int, str]] = {}
    for row in report_rows:
        if normalize_text(row.get("report_kind")) == "quarterly_summary":
            continue
        legacy_site_id = normalize_text(row.get("legacy_site_id"))
        round_no = int(row.get("round_no") or 0)
        if legacy_site_id and round_no > 0:
            mapped.setdefault(legacy_site_id, {})[round_no] = build_report_key(row)
    return mapped


def write_report_verification(
    audit_path: Path,
    expected_reports: list[dict[str, Any]],
    live_reports: list[dict[str, Any]],
) -> dict[str, int]:
    live_by_key = {normalize_text(row.get("report_key")): row for row in live_reports}
    verification_rows = []
    for row in expected_reports:
        report_key = build_report_key(row)
        live = live_by_key.get(report_key)
        verification_rows.append(
            {
                "exists": bool(live),
                "legacy_report_id": normalize_text(row.get("legacy_report_id")),
                "report_key": report_key,
                "site_id": normalize_text((live or {}).get("site_id")),
            }
        )
    write_jsonl(audit_path, verification_rows)
    return {
        "expected": len(verification_rows),
        "verified": len([row for row in verification_rows if row["exists"]]),
    }
