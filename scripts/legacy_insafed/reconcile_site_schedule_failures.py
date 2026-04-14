#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import normalize_text, read_jsonl, write_jsonl
    from scripts.legacy_insafed.import_new_erp import (
        build_headquarter_payload,
        build_site_payload,
        ensure_active_assignment,
        find_headquarter_match,
        find_site_match,
        find_user_match,
        merge_update_payload,
        normalize_site_code_value,
        patch_site_schedules_via_memo,
        payload_differs,
        placeholder_email_for_inspector,
        resolve_conflicting_site_payload,
        upsert_inspector_user,
        upsert_worker,
    )
    from scripts.legacy_insafed.target_client import TargetErpClient, TargetErpError
else:
    from .common import normalize_text, read_jsonl, write_jsonl
    from .import_new_erp import (
        build_headquarter_payload,
        build_site_payload,
        ensure_active_assignment,
        find_headquarter_match,
        find_site_match,
        find_user_match,
        merge_update_payload,
        normalize_site_code_value,
        patch_site_schedules_via_memo,
        payload_differs,
        placeholder_email_for_inspector,
        resolve_conflicting_site_payload,
        upsert_inspector_user,
        upsert_worker,
    )
    from .target_client import TargetErpClient, TargetErpError


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Reconcile legacy site/schedule failures.")
    parser.add_argument("--export-root", required=True)
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-token", required=True)
    parser.add_argument("--update-missing-only", action="store_true")
    return parser


def unique_phase_ids(rows: list[dict[str, object]], phase: str) -> list[str]:
    seen: dict[str, None] = {}
    for row in rows:
        if normalize_text(row.get("phase")) != phase:
            continue
        legacy_site_id = normalize_text(row.get("legacy_site_id"))
        if legacy_site_id:
            seen.setdefault(legacy_site_id, None)
    return list(seen.keys())


def main() -> None:
    args = build_parser().parse_args()
    export_root = Path(args.export_root)
    failures = read_jsonl(export_root / "failures.jsonl")
    legacy_headquarters = read_jsonl(export_root / "headquarters.jsonl")
    legacy_sites = read_jsonl(export_root / "sites.jsonl")
    legacy_inspectors = read_jsonl(export_root / "admin" / "inspectors.jsonl")
    legacy_site_by_id = {
        normalize_text(item.get("legacy_site_id")): item
        for item in legacy_sites
        if normalize_text(item.get("legacy_site_id"))
    }

    client = TargetErpClient(args.target_base_url, args.target_token)
    headquarters = client.fetch_headquarters()
    sites = client.fetch_sites()
    users = client.fetch_users()
    assignments = client.fetch_assignments()
    print(
        {
            "headquarters": len(headquarters),
            "sites": len(sites),
            "users": len(users),
            "assignments": len(assignments),
        },
        flush=True,
    )

    site_conflict_ids = unique_phase_ids(failures, "import_site_conflict")
    schedule_failure_ids = unique_phase_ids(failures, "import_schedule")
    resolved_site_rows: list[dict[str, object]] = []
    unresolved_site_rows: list[dict[str, object]] = []
    resolved_schedule_rows: list[dict[str, object]] = []
    unresolved_schedule_rows: list[dict[str, object]] = []

    inspector_users_by_name: dict[str, dict[str, object]] = {}
    for inspector in legacy_inspectors:
        user = upsert_inspector_user(client, users, inspector)
        inspector_users_by_name[normalize_text(inspector.get("name"))] = user
    print({"inspector_users": len(inspector_users_by_name)}, flush=True)

    opening_number_counts: dict[str, int] = {}
    for legacy_site in legacy_sites:
        normalized_opening_number = normalize_site_code_value(legacy_site.get("opening_number"))
        if not normalized_opening_number:
            continue
        opening_number_counts[normalized_opening_number] = opening_number_counts.get(normalized_opening_number, 0) + 1

    headquarter_map: dict[str, str] = {}
    for record in legacy_headquarters:
        matched = find_headquarter_match(headquarters, record)
        if matched:
            headquarter_map[normalize_text(record.get("legacy_headquarter_id"))] = normalize_text(matched.get("id"))

    for index, legacy_site_id in enumerate(site_conflict_ids, start=1):
        record = legacy_site_by_id.get(legacy_site_id)
        if not record:
            unresolved_site_rows.append(
                {
                    "legacy_site_id": legacy_site_id,
                    "reason": "missing_legacy_site_record",
                    "action": "inspect_export",
                }
            )
            continue
        headquarter_id = headquarter_map.get(normalize_text(record.get("legacy_headquarter_id")))
        if not headquarter_id:
            unresolved_site_rows.append(
                {
                    "legacy_site_id": legacy_site_id,
                    "reason": "missing_headquarter_mapping",
                    "action": "reimport_headquarter",
                }
            )
            continue
        existing = find_site_match(sites, record, headquarter_id)
        payload = merge_update_payload(
            existing,
            build_site_payload(record, headquarter_id, normalize_text(existing.get("memo") if existing else "")),
            args.update_missing_only,
        )
        normalized_opening_number = normalize_site_code_value(record.get("opening_number"))
        if not normalized_opening_number or opening_number_counts.get(normalized_opening_number, 0) > 1:
            payload["site_code"] = existing.get("site_code") if existing and normalize_text(existing.get("site_code")) else None
        try:
            if existing and not payload_differs(existing, payload):
                site = existing
            else:
                site = client.update_site(existing["id"], payload) if existing else client.create_site(payload)
        except TargetErpError as error:
            fallback_payload = resolve_conflicting_site_payload(payload, error)
            try:
                if existing and fallback_payload is not None:
                    site = client.update_site(existing["id"], fallback_payload)
                elif not existing and fallback_payload is not None:
                    site = client.create_site(fallback_payload)
                else:
                    raise
            except Exception as nested_error:
                unresolved_site_rows.append(
                    {
                        "legacy_site_id": legacy_site_id,
                        "reason": str(nested_error),
                        "action": "manual_site_merge",
                    }
                )
                continue
        if not existing:
            sites.append(site)
        resolved_site_rows.append(
            {
                "legacy_site_id": legacy_site_id,
                "site_id": normalize_text(site.get("id")),
                "site_name": normalize_text(site.get("site_name")),
            }
        )
        if index % 25 == 0 or index == len(site_conflict_ids):
            print(
                {
                    "site_conflicts_processed": index,
                    "resolved": len(resolved_site_rows),
                    "unresolved": len(unresolved_site_rows),
                },
                flush=True,
            )

    for index, legacy_site_id in enumerate(schedule_failure_ids, start=1):
        record = legacy_site_by_id.get(legacy_site_id)
        if not record:
            unresolved_schedule_rows.append(
                {
                    "legacy_site_id": legacy_site_id,
                    "reason": "missing_legacy_site_record",
                    "action": "inspect_export",
                }
            )
            continue
        headquarter_id = headquarter_map.get(normalize_text(record.get("legacy_headquarter_id")), "")
        site = find_site_match(sites, record, headquarter_id) if headquarter_id else None
        if not site:
            unresolved_schedule_rows.append(
                {
                    "legacy_site_id": legacy_site_id,
                    "reason": "missing_target_site",
                    "action": "reimport_site_first",
                }
            )
            continue
        worker_name = normalize_text(record.get("assigned_worker_name"))
        if worker_name:
            user = inspector_users_by_name.get(worker_name) or upsert_worker(
                client,
                users,
                worker_name,
                legacy_site_id,
                normalize_text(record.get("headquarter_name")),
            )
            ensure_active_assignment(
                client,
                assignments,
                site_id=normalize_text(site.get("id")),
                user_id=normalize_text(user.get("id")),
                memo="legacy_insafed_import:reconcile_schedule",
            )

        assignee_lookup: dict[str, tuple[str, str]] = {}
        for visit in record.get("visit_history", []):
            visit_worker_name = normalize_text(visit.get("assigned_worker_name"))
            if not visit_worker_name:
                continue
            visit_user = inspector_users_by_name.get(visit_worker_name) or upsert_worker(
                client,
                users,
                visit_worker_name,
                legacy_site_id,
                normalize_text(record.get("headquarter_name")),
            )
            assignee_lookup[visit_worker_name] = (normalize_text(visit_user.get("id")), normalize_text(visit_user.get("name")))
        default_assignee_user_id = ""
        default_assignee_name = worker_name
        if worker_name:
            default_user = inspector_users_by_name.get(worker_name) or assignee_lookup.get(worker_name)
            if isinstance(default_user, tuple):
                default_assignee_user_id, default_assignee_name = default_user
            elif isinstance(default_user, dict):
                default_assignee_user_id = normalize_text(default_user.get("id"))
                default_assignee_name = normalize_text(default_user.get("name")) or worker_name
        try:
            updated = patch_site_schedules_via_memo(
                client,
                site,
                record.get("visit_history", []),
                assignee_lookup,
                int(record.get("total_rounds") or 0),
                default_assignee_user_id,
                default_assignee_name,
            )
            resolved_schedule_rows.append(
                {
                    "legacy_site_id": legacy_site_id,
                    "site_id": normalize_text(updated.get("id")),
                    "site_name": normalize_text(updated.get("site_name")),
                    "visit_history_count": len(record.get("visit_history", [])),
                }
            )
            if index % 25 == 0 or index == len(schedule_failure_ids):
                print(
                    {
                        "schedule_backfills_processed": index,
                        "resolved": len(resolved_schedule_rows),
                        "unresolved": len(unresolved_schedule_rows),
                    },
                    flush=True,
                )
        except Exception as error:
            unresolved_schedule_rows.append(
                {
                    "legacy_site_id": legacy_site_id,
                    "site_id": normalize_text(site.get("id")),
                    "reason": str(error),
                    "action": "manual_schedule_patch",
                }
            )
            if index % 25 == 0 or index == len(schedule_failure_ids):
                print(
                    {
                        "schedule_backfills_processed": index,
                        "resolved": len(resolved_schedule_rows),
                        "unresolved": len(unresolved_schedule_rows),
                    },
                    flush=True,
                )

    write_jsonl(export_root / "site-conflicts-resolved.jsonl", resolved_site_rows)
    write_jsonl(export_root / "site-conflicts-unresolved.jsonl", unresolved_site_rows)
    write_jsonl(export_root / "schedule-backfill-resolved.jsonl", resolved_schedule_rows)
    write_jsonl(export_root / "schedule-backfill-unresolved.jsonl", unresolved_schedule_rows)
    print(
        {
            "resolved_site_conflicts": len(resolved_site_rows),
            "unresolved_site_conflicts": len(unresolved_site_rows),
            "resolved_schedule_backfills": len(resolved_schedule_rows),
            "unresolved_schedule_backfills": len(unresolved_schedule_rows),
        }
    )


if __name__ == "__main__":
    main()
