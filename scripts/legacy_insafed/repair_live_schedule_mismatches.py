#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.audit_live_schedule_mismatches import normalize_target_base_url
    from scripts.legacy_insafed.common import iso_now, normalize_text, read_jsonl, write_json, write_jsonl
    from scripts.legacy_insafed.export_parsers import parse_site_detail
    from scripts.legacy_insafed.import_new_erp import (
        build_site_memo,
        build_site_payload,
        ensure_active_assignment,
        patch_site_schedules_via_memo,
        split_site_memo,
        upsert_worker,
    )
    from scripts.legacy_insafed.legacy_client import LegacyInsafedClient
    from scripts.legacy_insafed.cutover_schedule_sync import sync_site_schedule_rows
    from scripts.legacy_insafed.target_client import TargetErpClient
else:
    from .audit_live_schedule_mismatches import normalize_target_base_url
    from .common import iso_now, normalize_text, read_jsonl, write_json, write_jsonl
    from .export_parsers import parse_site_detail
    from .import_new_erp import (
        build_site_memo,
        build_site_payload,
        ensure_active_assignment,
        patch_site_schedules_via_memo,
        split_site_memo,
        upsert_worker,
    )
    from .legacy_client import LegacyInsafedClient
    from .cutover_schedule_sync import sync_site_schedule_rows
    from .target_client import TargetErpClient

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Repair live sites whose legacy schedules were attached to the wrong legacy site.")
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-email", required=True)
    parser.add_argument("--target-password", required=True)
    parser.add_argument("--legacy-base-url", default=os.environ.get("LEGACY_INSAFE_BASE_URL", ""))
    parser.add_argument("--legacy-email", default=os.environ.get("LEGACY_INSAFE_EMAIL", ""))
    parser.add_argument("--legacy-password", default=os.environ.get("LEGACY_INSAFE_PASSWORD", ""))
    parser.add_argument("--audit-path", default=".artifacts/legacy-schedule-audit/schedule-legacy-site-mismatches.jsonl")
    parser.add_argument("--audit-dir", default=".artifacts/legacy-schedule-repair")
    parser.add_argument("--site-id", default="")
    parser.add_argument("--limit", type=int, default=0)
    return parser
def strip_legacy_note_lines(note: str) -> str:
    return "\n".join(
        line for line in str(note).splitlines() if normalize_text(line) and not normalize_text(line).startswith("legacy_insafed_")
    )
def build_legacy_record(legacy_client: LegacyInsafedClient, legacy_base_url: str, legacy_site_id: str, headquarter_name: str) -> dict[str, Any]:
    detail = parse_site_detail(legacy_client.fetch_site_detail(legacy_site_id))
    return {
        **detail,
        "detail_href": f"{legacy_base_url.rstrip('/')}/cons?id={legacy_site_id}",
        "headquarter_name": headquarter_name,
        "legacy_site_id": legacy_site_id,
    }
def ensure_worker_links(
    client: TargetErpClient,
    users: list[dict[str, Any]],
    assignments: list[dict[str, Any]],
    site_id: str,
    headquarter_name: str,
    legacy_site_id: str,
    visits: list[dict[str, Any]],
    default_worker_name: str,
) -> dict[str, tuple[str, str]]:
    user_by_name = {
        normalize_text(user.get("name")): (normalize_text(user.get("id")), normalize_text(user.get("name")))
        for user in users
        if normalize_text(user.get("name")) and normalize_text(user.get("id"))
    }
    worker_names = {normalize_text(default_worker_name), *[normalize_text(visit.get("assigned_worker_name")) for visit in visits]}
    for worker_name in sorted(name for name in worker_names if name):
        user = next((item for item in users if normalize_text(item.get("name")) == worker_name), None)
        if not user:
            user = upsert_worker(client, users, worker_name, legacy_site_id, headquarter_name)
        user_by_name[worker_name] = (normalize_text(user.get("id")), normalize_text(user.get("name")))
        ensure_active_assignment(
            client,
            assignments,
            site_id=site_id,
            user_id=normalize_text(user.get("id")),
            memo="legacy_insafed_repair",
        )
    return user_by_name
def main() -> int:
    args = build_parser().parse_args()
    audit_dir = Path(args.audit_dir).resolve()
    findings = read_jsonl(Path(args.audit_path).resolve())
    if args.site_id:
        findings = [row for row in findings if normalize_text(row.get("site_id")) == normalize_text(args.site_id)]
    if args.limit > 0:
        findings = findings[: args.limit]
    target_base_url = normalize_target_base_url(args.target_base_url)
    token = TargetErpClient.issue_token(target_base_url, args.target_email, args.target_password)
    client = TargetErpClient(target_base_url, token, timeout=60, max_retries=3)
    legacy_client = LegacyInsafedClient(args.legacy_base_url, args.legacy_email, args.legacy_password, timeout=60)
    legacy_client.login()
    sites = client.fetch_sites()
    users = client.fetch_users()
    assignments = client.fetch_assignments()
    site_by_id = {normalize_text(site.get("id")): site for site in sites}
    results: list[dict[str, Any]] = []

    for finding in findings:
        site_id = normalize_text(finding.get("site_id"))
        site = site_by_id.get(site_id)
        if not site:
            results.append({"site_id": site_id, "status": "missing_site"})
            continue
        try:
            expected_legacy_site_id = normalize_text(finding.get("expected_legacy_site_id"))
            headquarter_id = normalize_text(site.get("headquarter_id"))
            headquarter_name = normalize_text(
                ((site.get("headquarter_detail") or {}) if isinstance(site.get("headquarter_detail"), dict) else {}).get("name")
                or ((site.get("headquarter") or {}) if isinstance(site.get("headquarter"), dict) else {}).get("name")
            )
            legacy_record = build_legacy_record(legacy_client, args.legacy_base_url, expected_legacy_site_id, headquarter_name)
            site_payload = build_site_payload(legacy_record, headquarter_id, "")
            note, envelope = split_site_memo(site.get("memo"))
            next_note = normalize_text(build_site_payload(legacy_record, headquarter_id, strip_legacy_note_lines(note)).get("memo"))
            update_payload = {key: value for key, value in site_payload.items() if key != "memo"}
            update_payload["memo"] = build_site_memo(next_note, envelope)
            try:
                updated_site = client.update_site(site_id, update_payload)
                site_for_sync = {**site, **updated_site, **update_payload, "legacy_site_id": expected_legacy_site_id}
            except Exception as error:
                if "같은 사업장 내 동일 현장명이 이미 존재합니다." not in str(error):
                    raise
                updated_site = {}
                site_for_sync = {**site, "legacy_site_id": expected_legacy_site_id}
            user_by_name = ensure_worker_links(client, users, assignments, site_id, headquarter_name, expected_legacy_site_id, legacy_record.get("visit_history", []), normalize_text(legacy_record.get("assigned_worker_name")))
            default_worker_name = normalize_text(legacy_record.get("assigned_worker_name"))
            default_assignee = user_by_name.get(default_worker_name, ("", default_worker_name))
            site_for_sync = patch_site_schedules_via_memo(client, site_for_sync, expected_legacy_site_id, legacy_record.get("visit_history", []), user_by_name, int(legacy_record.get("total_rounds") or 0), default_assignee[0], default_assignee[1])
            sync_site_schedule_rows(client, site_for_sync, legacy_record, user_by_name)
            results.append({"site_id": site_id, "site_name_before": normalize_text(site.get("site_name")), "site_name_after": normalize_text(update_payload.get("site_name")), "expected_legacy_site_id": expected_legacy_site_id, "imported_legacy_site_ids": finding.get("imported_legacy_site_ids", []), "status": "repaired"})
        except Exception as error:
            results.append({"site_id": site_id, "expected_legacy_site_id": normalize_text(finding.get("expected_legacy_site_id")), "status": "failed", "error": str(error)})
    write_jsonl(audit_dir / "repair-results.jsonl", results)
    write_json(
        audit_dir / "summary.json",
        {
            "generated_at": iso_now(),
            "requested_count": len(findings),
            "repaired_count": len([row for row in results if row.get("status") == "repaired"]),
            "failed_count": len([row for row in results if row.get("status") != "repaired"]),
        },
    )
    print({"audit_dir": str(audit_dir), "requested_count": len(findings), "repaired_count": len([row for row in results if row.get('status') == 'repaired'])})
    return 0
if __name__ == "__main__":
    raise SystemExit(main())
