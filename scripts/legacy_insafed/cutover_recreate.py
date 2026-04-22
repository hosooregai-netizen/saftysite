from __future__ import annotations

from pathlib import Path
from typing import Any

from .common import append_jsonl, normalize_text, write_jsonl
from .import_new_erp import (
    ensure_active_assignment,
    find_by_memo,
    find_headquarter_match,
    has_meaningful_value,
    merge_update_payload,
    normalize_site_code_value,
    payload_differs,
    resolve_conflicting_site_payload,
    upsert_inspector_user,
    upsert_worker,
)
from .target_client import TargetErpError
from .target_mapping import LEGACY_SITE_TAG, build_headquarter_payload, build_site_payload


def recreate_legacy_scope(client: Any, scope: dict[str, list[dict[str, Any]]], audit_dir: Path) -> dict[str, Any]:
    failures_path = audit_dir / "recreate-failures.jsonl"
    headquarters = client.fetch_headquarters()
    sites = client.fetch_sites()
    users = client.fetch_users()
    assignments = client.fetch_all("/api/safety/assignments", {"active_only": "false"}, limit=500)
    headquarter_map: dict[str, str] = {}
    site_map: dict[str, str] = {}
    recreated_site_rows: list[dict[str, Any]] = []
    reassigned_rows: list[dict[str, Any]] = []
    inspector_users: dict[str, dict[str, Any]] = {}
    opening_number_counts: dict[str, int] = {}

    for site in scope["sites"]:
        opening_number = normalize_site_code_value(site.get("opening_number"))
        if opening_number:
            opening_number_counts[opening_number] = opening_number_counts.get(opening_number, 0) + 1

    for record in scope["headquarters"]:
        existing = find_headquarter_match(headquarters, record)
        payload = merge_update_payload(
            existing,
            build_headquarter_payload(record, normalize_text(existing.get("memo") if existing else "")),
            False,
        )
        if existing and not payload_differs(existing, payload):
            headquarter = existing
        else:
            headquarter = client.update_headquarter(existing["id"], payload) if existing else client.create_headquarter(payload)
        if not existing:
            headquarters.append(headquarter)
        headquarter_map[normalize_text(record.get("legacy_headquarter_id"))] = normalize_text(headquarter.get("id"))

    for inspector in scope["inspectors"]:
        user = upsert_inspector_user(client, users, inspector)
        inspector_users[normalize_text(inspector.get("name"))] = user

    for record in scope["sites"]:
        legacy_site_id = normalize_text(record.get("legacy_site_id"))
        headquarter_id = headquarter_map.get(normalize_text(record.get("legacy_headquarter_id")))
        if not legacy_site_id or not headquarter_id:
            append_jsonl(failures_path, {"kind": "missing_headquarter", "legacy_site_id": legacy_site_id})
            continue
        existing = find_by_memo(sites, LEGACY_SITE_TAG, legacy_site_id)
        payload = build_site_payload(record, headquarter_id, normalize_text(existing.get("memo") if existing else ""))
        opening_number = normalize_site_code_value(record.get("opening_number"))
        if not opening_number or opening_number_counts.get(opening_number, 0) > 1:
            payload["site_code"] = existing.get("site_code") if existing and has_meaningful_value(existing.get("site_code")) else None
        try:
            if existing and not payload_differs(existing, payload):
                site = existing
            elif existing:
                site = client.update_site(existing["id"], payload)
            else:
                site = client.create_site(payload)
        except TargetErpError as error:
            fallback_payload = resolve_conflicting_site_payload(payload, error)
            if not existing and fallback_payload is not None:
                try:
                    site = client.create_site(fallback_payload)
                except Exception as fallback_error:
                    append_jsonl(failures_path, {"kind": "create_site_failed", "legacy_site_id": legacy_site_id, "error": str(fallback_error)})
                    continue
            elif existing and fallback_payload is not None:
                site = client.update_site(existing["id"], fallback_payload)
            else:
                append_jsonl(failures_path, {"kind": "create_site_failed", "legacy_site_id": legacy_site_id, "error": str(error)})
                continue
        if not existing:
            sites.append(site)
        site_map[legacy_site_id] = normalize_text(site.get("id"))
        recreated_site_rows.append(
            {
                "headquarter_id": normalize_text(site.get("headquarter_id")),
                "legacy_site_id": legacy_site_id,
                "site_id": normalize_text(site.get("id")),
                "site_name": normalize_text(site.get("site_name")),
            }
        )
        worker_names = {
            normalize_text(record.get("assigned_worker_name")),
            *[normalize_text(visit.get("assigned_worker_name")) for visit in record.get("visit_history", [])],
        }
        for worker_name in sorted(name for name in worker_names if name):
            user = inspector_users.get(worker_name) or upsert_worker(
                client,
                users,
                worker_name,
                legacy_site_id,
                normalize_text(record.get("headquarter_name")),
            )
            result = ensure_active_assignment(
                client,
                assignments,
                site_id=normalize_text(site.get("id")),
                user_id=normalize_text(user.get("id")),
                memo="legacy_insafed_cutover",
            )
            if result != "existing":
                reassigned_rows.append(
                    {
                        "legacy_site_id": legacy_site_id,
                        "result": result,
                        "site_id": normalize_text(site.get("id")),
                        "user_id": normalize_text(user.get("id")),
                        "worker_name": worker_name,
                    }
                )

    for inspector in scope["inspectors"]:
        user = inspector_users.get(normalize_text(inspector.get("name")))
        if not user:
            continue
        for assigned_site in inspector.get("assigned_sites", []):
            site_id = site_map.get(normalize_text(assigned_site.get("legacy_site_id")))
            if not site_id:
                continue
            result = ensure_active_assignment(
                client,
                assignments,
                site_id=site_id,
                user_id=normalize_text(user.get("id")),
                memo="legacy_insafed_cutover:assigned_site",
            )
            if result != "existing":
                reassigned_rows.append(
                    {
                        "legacy_site_id": normalize_text(assigned_site.get("legacy_site_id")),
                        "result": result,
                        "site_id": site_id,
                        "user_id": normalize_text(user.get("id")),
                        "worker_name": normalize_text(inspector.get("name")),
                    }
                )

    write_jsonl(audit_dir / "recreated-sites.jsonl", recreated_site_rows)
    write_jsonl(audit_dir / "reassigned-assignments.jsonl", reassigned_rows)
    return {
        "headquarter_map": headquarter_map,
        "inspector_users": inspector_users,
        "site_map": site_map,
    }
