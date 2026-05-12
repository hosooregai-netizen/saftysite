from __future__ import annotations

from pathlib import Path
from typing import Any

from .common import normalize_text, write_jsonl
from .cutover_dataset import parse_legacy_site_id


def fetch_all_reports(client: Any) -> list[dict[str, Any]]:
    return client.fetch_all("/reports", {"active_only": "false"}, limit=500)


def fetch_all_admin_schedules(client: Any) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    offset = 0
    while True:
        payload = client._request(
            "GET",
            "/api/admin/schedules",
            params={"month": "all", "limit": 5000, "offset": offset},
        ).json()
        page = payload.get("rows", [])
        if not isinstance(page, list):
            raise RuntimeError("Expected /api/admin/schedules to return a rows array.")
        rows.extend(page)
        if len(page) < 5000:
            return rows
        offset += len(page)


def build_preflight_summary(
    bundle: dict[str, list[dict[str, Any]]],
    scope: dict[str, list[dict[str, Any]]],
    live_indexes: dict[str, Any],
    live_reports: list[dict[str, Any]],
    before_diff_rows: list[dict[str, Any]],
) -> dict[str, Any]:
    export_site_ids = {normalize_text(site.get("legacy_site_id")) for site in scope["sites"]}
    live_site_ids = {parse_legacy_site_id(site.get("memo")) for site in live_indexes["cutover_legacy_sites"]}
    return {
        "export": {
            "headquarters": len(bundle["headquarters"]),
            "inspectors": len(bundle["inspectors"]),
            "reports": len(bundle["reports"]),
            "sites": len(bundle["sites"]),
        },
        "cutover_scope": {
            "headquarters": len(scope["headquarters"]),
            "inspectors": len(scope["inspectors"]),
            "preserved_reports": len(scope["preserved_reports"]),
            "preserved_sites": len(scope["preserved_sites"]),
            "reports": len(scope["reports"]),
            "sites": len(scope["sites"]),
        },
        "live": {
            "legacy_reports": len([row for row in live_reports if normalize_text(row.get("report_key")).startswith("legacy:")]),
            "legacy_tagged_sites": len(live_indexes["all_legacy_sites"]),
            "legacy_tagged_sites_cutover": len(live_indexes["cutover_legacy_sites"]),
            "legacy_tagged_sites_preserved": len(live_indexes["preserved_legacy_sites"]),
        },
        "site_diff": {
            "missing_in_live": sorted(export_site_ids - live_site_ids),
            "extra_in_live": sorted(live_site_ids - export_site_ids),
        },
        "schedule_diff_before": {
            "rows": len(before_diff_rows),
            "summary": summarize_diff_rows(before_diff_rows),
        },
    }


def summarize_diff_rows(rows: list[dict[str, Any]]) -> dict[str, int]:
    summary: dict[str, int] = {}
    for row in rows:
        kind = normalize_text(row.get("kind")) or "unknown"
        summary[kind] = summary.get(kind, 0) + 1
    return summary


def delete_legacy_scope(client: Any, live_sites: list[dict[str, Any]], audit_dir: Path) -> dict[str, int]:
    target_site_ids = {normalize_text(site.get("id")) for site in live_sites}
    assignments = client.fetch_all("/api/safety/assignments", {"active_only": "false"}, limit=500)
    deleted_assignment_rows = [
        assignment
        for assignment in assignments
        if normalize_text(assignment.get("site_id")) in target_site_ids
    ]
    deleted_site_rows = [
        {
            "id": normalize_text(site.get("id")),
            "legacy_site_id": parse_legacy_site_id(site.get("memo")),
            "site_name": normalize_text(site.get("site_name")),
        }
        for site in live_sites
    ]

    write_jsonl(audit_dir / "deleted-assignments.jsonl", deleted_assignment_rows)
    write_jsonl(audit_dir / "deleted-sites.jsonl", deleted_site_rows)

    for assignment in deleted_assignment_rows:
        client._request("DELETE", f"/api/safety/assignments/{normalize_text(assignment.get('id'))}")
    for site in live_sites:
        client._request("DELETE", f"/api/safety/sites/{normalize_text(site.get('id'))}")

    return {
        "deleted_assignments": len(deleted_assignment_rows),
        "deleted_sites": len(deleted_site_rows),
    }
