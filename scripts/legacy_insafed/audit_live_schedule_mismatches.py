#!/usr/bin/env python3
from __future__ import annotations
import argparse
import os
import sys
from pathlib import Path
from typing import Any
if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import iso_now, normalize_text, write_json, write_jsonl
    from scripts.legacy_insafed.export_parsers import parse_site_detail
    from scripts.legacy_insafed.legacy_client import LegacyInsafedClient
    from scripts.legacy_insafed.legacy_site_identity import (
        extract_legacy_site_id_from_memo,
        extract_legacy_site_id_from_schedule,
        is_conflicting_legacy_import_schedule,
    )
    from scripts.legacy_insafed.schedule_sync_helpers import parse_site_meta_envelope
    from scripts.legacy_insafed.target_client import TargetErpClient
else:
    from .common import iso_now, normalize_text, write_json, write_jsonl
    from .export_parsers import parse_site_detail
    from .legacy_client import LegacyInsafedClient
    from .legacy_site_identity import (
        extract_legacy_site_id_from_memo,
        extract_legacy_site_id_from_schedule,
        is_conflicting_legacy_import_schedule,
    )
    from .schedule_sync_helpers import parse_site_meta_envelope
    from .target_client import TargetErpClient
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Audit live ERP sites whose legacy-import schedules point to a different legacy site id.",
    )
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-email", required=True)
    parser.add_argument("--target-password", required=True)
    parser.add_argument("--legacy-base-url", default=os.environ.get("LEGACY_INSAFE_BASE_URL", ""))
    parser.add_argument("--legacy-email", default=os.environ.get("LEGACY_INSAFE_EMAIL", ""))
    parser.add_argument("--legacy-password", default=os.environ.get("LEGACY_INSAFE_PASSWORD", ""))
    parser.add_argument("--audit-dir", default=".artifacts/legacy-schedule-audit")
    return parser
def fetch_all_admin_schedules(client: TargetErpClient) -> list[dict[str, Any]]:
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
def summarize_schedule(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": normalize_text(row.get("id")),
        "planned_date": normalize_text(row.get("plannedDate") or row.get("planned_date")),
        "round_no": int(row.get("roundNo") or row.get("round_no") or 0),
        "selection_reason_label": normalize_text(
            row.get("selectionReasonLabel") or row.get("selection_reason_label")
        ),
        "selection_reason_memo": normalize_text(
            row.get("selectionReasonMemo") or row.get("selection_reason_memo")
        ),
        "imported_legacy_site_id": extract_legacy_site_id_from_schedule(row),
    }
def fetch_legacy_site_details(
    client: LegacyInsafedClient,
    legacy_site_ids: set[str],
) -> dict[str, dict[str, Any]]:
    details: dict[str, dict[str, Any]] = {}
    for legacy_site_id in sorted(legacy_site_ids):
        try:
            detail = parse_site_detail(client.fetch_site_detail(legacy_site_id))
            details[legacy_site_id] = {
                "site_name": normalize_text(detail.get("site_name")),
                "project_period": normalize_text(detail.get("project_period")),
                "total_rounds": detail.get("total_rounds"),
                "visit_history_count": len(detail.get("visit_history") or []),
            }
        except Exception as error:
            details[legacy_site_id] = {"error": str(error)}
    return details


def normalize_target_base_url(base_url: str) -> str:
    normalized = normalize_text(base_url).rstrip("/")
    if normalized.endswith("/api/v1") or normalized.endswith("/api/safety"):
        return normalized
    return f"{normalized}/api/safety"


def main() -> int:
    args = build_parser().parse_args()
    audit_dir = Path(args.audit_dir).resolve()
    target_base_url = normalize_target_base_url(args.target_base_url)
    token = TargetErpClient.issue_token(target_base_url, args.target_email, args.target_password)
    target_client = TargetErpClient(target_base_url, token, timeout=60, max_retries=3)
    sites = target_client.fetch_sites()
    schedules = fetch_all_admin_schedules(target_client)
    rows_by_site: dict[str, list[dict[str, Any]]] = {}
    for row in schedules:
        site_id = normalize_text(row.get("site_id"))
        if site_id:
            rows_by_site.setdefault(site_id, []).append(row)

    findings: list[dict[str, Any]] = []
    related_legacy_site_ids: set[str] = set()

    for site in sites:
        site_id = normalize_text(site.get("id"))
        expected_legacy_site_id = extract_legacy_site_id_from_memo(site.get("memo"))
        if not site_id or not expected_legacy_site_id:
            continue
        live_rows = [
            summarize_schedule(row)
            for row in rows_by_site.get(site_id, [])
            if is_conflicting_legacy_import_schedule(row, expected_legacy_site_id)
        ]
        envelope = parse_site_meta_envelope(site.get("memo"))
        memo_rows = [
            summarize_schedule(row)
            for row in envelope.get("schedules", [])
            if isinstance(row, dict)
            and is_conflicting_legacy_import_schedule(row, expected_legacy_site_id)
        ]
        if not live_rows and not memo_rows:
            continue
        imported_legacy_site_ids = sorted(
            {
                row["imported_legacy_site_id"]
                for row in [*live_rows, *memo_rows]
                if row["imported_legacy_site_id"]
            }
        )
        related_legacy_site_ids.add(expected_legacy_site_id)
        related_legacy_site_ids.update(imported_legacy_site_ids)
        findings.append(
            {
                "site_id": site_id,
                "site_name": normalize_text(site.get("site_name")),
                "headquarter_name": normalize_text(
                    site.get("headquarter_name")
                    or ((site.get("headquarter_detail") or {}) if isinstance(site.get("headquarter_detail"), dict) else {}).get("name")
                    or ((site.get("headquarter") or {}) if isinstance(site.get("headquarter"), dict) else {}).get("name")
                ),
                "expected_legacy_site_id": expected_legacy_site_id,
                "imported_legacy_site_ids": imported_legacy_site_ids,
                "live_rows": live_rows,
                "memo_rows": memo_rows,
            }
        )

    legacy_details: dict[str, dict[str, Any]] = {}
    if findings and args.legacy_base_url and args.legacy_email and args.legacy_password:
        legacy_client = LegacyInsafedClient(
            args.legacy_base_url,
            args.legacy_email,
            args.legacy_password,
            timeout=60,
        )
        legacy_client.login()
        legacy_details = fetch_legacy_site_details(legacy_client, related_legacy_site_ids)

    enriched_findings = [
        {
            **finding,
            "expected_legacy_site": legacy_details.get(finding["expected_legacy_site_id"], {}),
            "imported_legacy_sites": {
                legacy_site_id: legacy_details.get(legacy_site_id, {})
                for legacy_site_id in finding["imported_legacy_site_ids"]
            },
        }
        for finding in findings
    ]
    write_jsonl(audit_dir / "schedule-legacy-site-mismatches.jsonl", enriched_findings)
    write_json(
        audit_dir / "summary.json",
        {
            "generated_at": iso_now(),
            "mismatch_site_count": len(enriched_findings),
            "site_ids": [row["site_id"] for row in enriched_findings],
        },
    )
    print({"audit_dir": str(audit_dir), "mismatch_site_count": len(enriched_findings)})
    return 0
if __name__ == "__main__":
    raise SystemExit(main())
