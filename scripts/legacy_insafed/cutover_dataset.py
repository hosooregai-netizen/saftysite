from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from .common import normalize_text, read_jsonl
from .target_mapping import LEGACY_SITE_TAG

REQUIRED_EXPORT_FILES = (
    "headquarters.jsonl",
    "sites.jsonl",
    "admin/inspectors.jsonl",
    "admin/reports/metadata.jsonl",
    "schedules.xlsx",
)


def contains_test_name(*values: Any) -> bool:
    return any("테스트" in normalize_text(value) for value in values)


def infer_report_kind(row: dict[str, Any]) -> str:
    return "quarterly_summary" if normalize_text(row.get("report_kind")) == "quarterly_summary" else "technical_guidance"


def build_report_key(row: dict[str, Any]) -> str:
    legacy_report_id = normalize_text(row.get("legacy_report_id"))
    return f"legacy:{infer_report_kind(row)}:{legacy_report_id}"


def parse_legacy_site_id(memo: Any) -> str:
    matched = re.search(rf"{re.escape(LEGACY_SITE_TAG)}([^\s]+)", normalize_text(memo))
    return matched.group(1).strip() if matched else ""


def validate_export_root(export_root: Path, *, require_schedule_workbook: bool = True) -> list[str]:
    missing: list[str] = []
    for relative_path in REQUIRED_EXPORT_FILES:
        if not require_schedule_workbook and relative_path == "schedules.xlsx":
            continue
        if not (export_root / relative_path).exists():
            missing.append(relative_path)
    return missing


def load_export_bundle(export_root: Path) -> dict[str, list[dict[str, Any]]]:
    return {
        "headquarters": read_jsonl(export_root / "headquarters.jsonl"),
        "inspectors": read_jsonl(export_root / "admin" / "inspectors.jsonl"),
        "reports": read_jsonl(export_root / "admin" / "reports" / "metadata.jsonl"),
        "sites": read_jsonl(export_root / "sites.jsonl"),
    }


def filter_cutover_bundle(bundle: dict[str, list[dict[str, Any]]]) -> dict[str, list[dict[str, Any]]]:
    preserved_sites: list[dict[str, Any]] = []
    cutover_sites: list[dict[str, Any]] = []
    preserved_site_ids: set[str] = set()
    preserved_site_keys: set[tuple[str, str]] = set()
    worker_names: set[str] = set()

    for site in bundle["sites"]:
        legacy_site_id = normalize_text(site.get("legacy_site_id"))
        site_key = (
            normalize_text(site.get("headquarter_name")),
            normalize_text(site.get("site_name")),
        )
        if contains_test_name(site.get("site_name")):
            preserved_sites.append(site)
            if legacy_site_id:
                preserved_site_ids.add(legacy_site_id)
            preserved_site_keys.add(site_key)
            continue
        cutover_sites.append(site)
        assigned_worker_name = normalize_text(site.get("assigned_worker_name"))
        if assigned_worker_name:
            worker_names.add(assigned_worker_name)
        for visit in site.get("visit_history", []):
            visit_worker_name = normalize_text(visit.get("assigned_worker_name"))
            if visit_worker_name:
                worker_names.add(visit_worker_name)

    cutover_site_ids = {normalize_text(site.get("legacy_site_id")) for site in cutover_sites}
    cutover_headquarter_ids = {
        normalize_text(site.get("legacy_headquarter_id")) for site in cutover_sites if normalize_text(site.get("legacy_headquarter_id"))
    }

    preserved_reports: list[dict[str, Any]] = []
    cutover_reports: list[dict[str, Any]] = []
    for report in bundle["reports"]:
        legacy_site_id = normalize_text(report.get("legacy_site_id"))
        site_key = (
            normalize_text(report.get("headquarter_name")),
            normalize_text(report.get("site_name")),
        )
        if contains_test_name(report.get("site_name")) or legacy_site_id in preserved_site_ids or site_key in preserved_site_keys:
            preserved_reports.append(report)
            continue
        if legacy_site_id and legacy_site_id not in cutover_site_ids:
            continue
        cutover_reports.append(report)

    cutover_inspectors: list[dict[str, Any]] = []
    for inspector in bundle["inspectors"]:
        inspector_name = normalize_text(inspector.get("name"))
        assigned_sites = [
            assigned_site
            for assigned_site in inspector.get("assigned_sites", [])
            if normalize_text(assigned_site.get("legacy_site_id")) in cutover_site_ids
        ]
        if inspector_name not in worker_names and not assigned_sites:
            continue
        cutover_inspectors.append({**inspector, "assigned_sites": assigned_sites})

    return {
        "headquarters": [
            headquarter
            for headquarter in bundle["headquarters"]
            if normalize_text(headquarter.get("legacy_headquarter_id")) in cutover_headquarter_ids
        ],
        "inspectors": cutover_inspectors,
        "preserved_reports": preserved_reports,
        "preserved_sites": preserved_sites,
        "reports": cutover_reports,
        "sites": cutover_sites,
    }


def build_live_site_indexes(live_sites: list[dict[str, Any]]) -> dict[str, Any]:
    all_legacy_sites: list[dict[str, Any]] = []
    cutover_legacy_sites: list[dict[str, Any]] = []
    preserved_legacy_sites: list[dict[str, Any]] = []
    live_by_legacy_id: dict[str, dict[str, Any]] = {}

    for site in live_sites:
        legacy_site_id = parse_legacy_site_id(site.get("memo"))
        if not legacy_site_id:
            continue
        all_legacy_sites.append(site)
        live_by_legacy_id[legacy_site_id] = site
        if contains_test_name(site.get("site_name")):
            preserved_legacy_sites.append(site)
        else:
            cutover_legacy_sites.append(site)

    return {
        "all_legacy_sites": all_legacy_sites,
        "cutover_legacy_sites": cutover_legacy_sites,
        "live_by_legacy_id": live_by_legacy_id,
        "preserved_legacy_sites": preserved_legacy_sites,
    }
