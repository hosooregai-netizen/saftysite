from __future__ import annotations

from pathlib import Path
from typing import Any

from .common import ensure_dir, normalize_text, read_json, read_jsonl, write_json, write_jsonl
from .cutover_cleanup import fetch_all_admin_schedules
from .cutover_dataset import build_live_site_indexes, filter_cutover_bundle, load_export_bundle
from .cutover_schedule_sync import build_schedule_diff_rows
from .target_client import TargetErpClient


def _count_jsonl(path: Path) -> int:
    return len(read_jsonl(path))


def validate_export_counts(raw_root: Path, working_root: Path, audit_dir: Path) -> dict[str, Any]:
    audit_dir = ensure_dir(audit_dir)
    raw_manifest = read_json(raw_root / "migration-manifest.json", {})
    admin_manifest = read_json(raw_root / "admin" / "manifest.json", {})
    counts = {
        "raw_headquarters_rows": _count_jsonl(raw_root / "headquarters.jsonl"),
        "raw_sites_rows": _count_jsonl(raw_root / "sites.jsonl"),
        "raw_worker_reports_rows": _count_jsonl(raw_root / "reports" / "metadata.jsonl"),
        "raw_admin_inspectors_rows": _count_jsonl(raw_root / "admin" / "inspectors.jsonl"),
        "raw_admin_reports_rows": _count_jsonl(raw_root / "admin" / "reports" / "metadata.jsonl"),
        "working_headquarters_rows": _count_jsonl(working_root / "headquarters.jsonl"),
        "working_sites_rows": _count_jsonl(working_root / "sites.jsonl"),
        "working_worker_reports_rows": _count_jsonl(working_root / "reports" / "metadata.jsonl"),
        "working_admin_inspectors_rows": _count_jsonl(working_root / "admin" / "inspectors.jsonl"),
        "working_admin_reports_rows": _count_jsonl(working_root / "admin" / "reports" / "metadata.jsonl"),
        "raw_manifest_counts": raw_manifest.get("counts", {}),
        "admin_manifest_counts": admin_manifest.get("counts", {}),
    }
    write_json(audit_dir / "export-validation.json", counts)
    return counts


def audit_live_state(working_root: Path, client: TargetErpClient, audit_dir: Path) -> dict[str, Any]:
    audit_dir = ensure_dir(audit_dir)
    scope = filter_cutover_bundle(load_export_bundle(working_root))
    live_sites = client.fetch_sites()
    live_indexes = build_live_site_indexes(live_sites)
    schedule_rows = fetch_all_admin_schedules(client)
    schedule_diff = build_schedule_diff_rows(scope["sites"], live_indexes["live_by_legacy_id"], schedule_rows)
    write_jsonl(audit_dir / "schedule-diff-after.jsonl", schedule_diff)

    sample_site_rows: list[dict[str, Any]] = []
    for legacy_site in scope["sites"][:20]:
        legacy_site_id = normalize_text(legacy_site.get("legacy_site_id"))
        live_site = live_indexes["live_by_legacy_id"].get(legacy_site_id) or {}
        sample_site_rows.append(
            {
                "legacy_headquarter_name": normalize_text(legacy_site.get("headquarter_name")),
                "legacy_site_id": legacy_site_id,
                "legacy_site_name": normalize_text(legacy_site.get("site_name")),
                "live_id": normalize_text(live_site.get("id")),
                "live_memo": normalize_text(live_site.get("memo")),
                "live_site_name": normalize_text(live_site.get("site_name")),
                "matched": bool(live_site),
            }
        )
    write_jsonl(audit_dir / "site-sample-checks.jsonl", sample_site_rows)

    report_rows = read_jsonl(working_root / "admin" / "reports" / "metadata.jsonl")
    report_sample_rows: list[dict[str, Any]] = []
    for row in report_rows[:20]:
        kind = "quarterly_summary" if normalize_text(row.get("report_kind")) == "quarterly_summary" else "technical_guidance"
        report_key = f"legacy:{kind}:{normalize_text(row.get('legacy_report_id'))}"
        report = client.fetch_report_by_key(report_key)
        report_sample_rows.append(
            {
                "legacy_report_id": normalize_text(row.get("legacy_report_id")),
                "meta_legacy_report_id": normalize_text(
                    (report.get("meta") if isinstance(report.get("meta"), dict) else {}).get("legacy_report_id")
                ),
                "report_key": normalize_text(report.get("report_key")),
                "site_id": normalize_text(report.get("site_id")),
                "status": normalize_text(report.get("status")),
                "visit_round": report.get("visit_round"),
            }
        )
    write_jsonl(audit_dir / "report-sample-checks.jsonl", report_sample_rows)

    summary = {
        "missing_live_sites": len([row for row in sample_site_rows if not row["matched"]]),
        "report_sample_count": len(report_sample_rows),
        "schedule_diff_summary": _summarize(schedule_diff),
        "site_sample_count": len(sample_site_rows),
    }
    write_json(audit_dir / "live-audit-summary.json", summary)
    return summary


def _summarize(rows: list[dict[str, Any]]) -> dict[str, int]:
    summary: dict[str, int] = {}
    for row in rows:
        kind = normalize_text(row.get("kind")) or "unknown"
        summary[kind] = summary.get(kind, 0) + 1
    return summary
