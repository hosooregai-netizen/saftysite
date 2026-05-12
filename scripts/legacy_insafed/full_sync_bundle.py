from __future__ import annotations

import shutil
from pathlib import Path
from typing import Any

from .common import ensure_dir, normalize_text, read_jsonl, write_json, write_jsonl
from .cutover_dataset import contains_test_name, filter_cutover_bundle, load_export_bundle


def _site_key(headquarter_name: Any, site_name: Any) -> tuple[str, str]:
    return (normalize_text(headquarter_name), normalize_text(site_name))


def _filter_worker_reports(
    rows: list[dict[str, Any]],
    allowed_site_ids: set[str],
    allowed_site_keys: set[tuple[str, str]],
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    kept: list[dict[str, Any]] = []
    excluded: list[dict[str, Any]] = []
    for row in rows:
        site_id = normalize_text(row.get("legacy_site_id") or row.get("legacy_site_ref"))
        site_key = _site_key(row.get("headquarter_name"), row.get("site_name"))
        is_test = contains_test_name(row.get("headquarter_name"), row.get("site_name"))
        is_allowed = (site_id and site_id in allowed_site_ids) or site_key in allowed_site_keys
        if is_test or not is_allowed:
            excluded.append(
                {
                    "legacy_report_id": normalize_text(row.get("legacy_report_id")),
                    "legacy_site_id": site_id,
                    "headquarter_name": normalize_text(row.get("headquarter_name")),
                    "reason": "test_or_unmatched",
                    "site_name": normalize_text(row.get("site_name")),
                }
            )
            continue
        kept.append(row)
    return kept, excluded


def build_filtered_working_export(export_root: Path, working_root: Path) -> dict[str, Any]:
    working_root = ensure_dir(working_root.resolve())
    ensure_dir(working_root / "admin" / "reports")
    ensure_dir(working_root / "reports")

    bundle = load_export_bundle(export_root)
    scope = filter_cutover_bundle(bundle)
    allowed_site_ids = {
        normalize_text(site.get("legacy_site_id"))
        for site in scope["sites"]
        if normalize_text(site.get("legacy_site_id"))
    }
    allowed_site_keys = {
        _site_key(site.get("headquarter_name"), site.get("site_name"))
        for site in scope["sites"]
        if normalize_text(site.get("site_name"))
    }

    worker_reports = read_jsonl(export_root / "reports" / "metadata.jsonl") or list(scope["reports"])
    filtered_worker_reports, excluded_worker_reports = _filter_worker_reports(
        worker_reports,
        allowed_site_ids,
        allowed_site_keys,
    )

    write_jsonl(working_root / "headquarters.jsonl", scope["headquarters"])
    write_jsonl(working_root / "sites.jsonl", scope["sites"])
    write_jsonl(working_root / "reports" / "metadata.jsonl", filtered_worker_reports)
    write_jsonl(working_root / "admin" / "inspectors.jsonl", scope["inspectors"])
    write_jsonl(working_root / "admin" / "reports" / "metadata.jsonl", scope["reports"])
    schedule_workbook_path = export_root / "schedules.xlsx"
    schedule_workbook_present = schedule_workbook_path.exists()
    if schedule_workbook_present:
        shutil.copy2(schedule_workbook_path, working_root / "schedules.xlsx")

    excluded_sites = [
        {
            "headquarter_name": normalize_text(site.get("headquarter_name")),
            "legacy_headquarter_id": normalize_text(site.get("legacy_headquarter_id")),
            "legacy_site_id": normalize_text(site.get("legacy_site_id")),
            "site_name": normalize_text(site.get("site_name")),
        }
        for site in scope["preserved_sites"]
    ]
    write_jsonl(working_root / "excluded-test-sites.jsonl", excluded_sites)
    write_jsonl(working_root / "excluded-test-sites-sample.jsonl", excluded_sites[:20])
    write_jsonl(working_root / "excluded-worker-reports.jsonl", excluded_worker_reports)
    (working_root / "target-legacy-site-ids.txt").write_text(
        "".join(f"{site_id}\n" for site_id in sorted(allowed_site_ids)),
        encoding="utf-8",
    )

    summary = {
        "excluded_test_site_count": len(excluded_sites),
        "filtered_admin_report_count": len(scope["reports"]),
        "filtered_headquarter_count": len(scope["headquarters"]),
        "filtered_inspector_count": len(scope["inspectors"]),
        "filtered_site_count": len(scope["sites"]),
        "filtered_worker_report_count": len(filtered_worker_reports),
        "schedule_workbook_present": schedule_workbook_present,
        "target_legacy_site_count": len(allowed_site_ids),
    }
    write_json(working_root / "bundle-summary.json", summary)
    return summary
