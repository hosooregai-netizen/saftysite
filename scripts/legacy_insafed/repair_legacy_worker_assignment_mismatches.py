#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import ensure_dir, normalize_text, write_json, write_jsonl
    from scripts.legacy_insafed.cutover_schedule_sync import sync_site_schedule_rows
    from scripts.legacy_insafed.export_parsers import parse_site_detail
    from scripts.legacy_insafed.legacy_client import LegacyInsafedClient
    from scripts.legacy_insafed.legacy_site_identity import extract_legacy_site_id_from_memo
    from scripts.legacy_insafed.target_client import TargetErpClient
else:
    from .common import ensure_dir, normalize_text, write_json, write_jsonl
    from .cutover_schedule_sync import sync_site_schedule_rows
    from .export_parsers import parse_site_detail
    from .legacy_client import LegacyInsafedClient
    from .legacy_site_identity import extract_legacy_site_id_from_memo
    from .target_client import TargetErpClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Repair legacy imported sites whose active assignee was attached to the wrong live user.")
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-email", required=True)
    parser.add_argument("--target-password", required=True)
    parser.add_argument("--legacy-base-url", required=True)
    parser.add_argument("--legacy-email", required=True)
    parser.add_argument("--legacy-password", required=True)
    parser.add_argument("--suspect-name", default="전현우")
    parser.add_argument("--audit-dir", default=".artifacts/legacy-worker-assignment-repair")
    parser.add_argument("--execute", action="store_true")
    return parser


def build_user_lookup(users: list[dict[str, object]]) -> dict[str, tuple[str, str]]:
    return {
        normalize_text(user.get("name")): (normalize_text(user.get("id")), normalize_text(user.get("name")))
        for user in users
        if normalize_text(user.get("name")) and normalize_text(user.get("id"))
    }


def find_candidate_sites(sites: list[dict[str, object]], suspect_name: str) -> list[dict[str, object]]:
    candidates: list[dict[str, object]] = []
    for site in sites:
        assigned_user = site.get("assigned_user") if isinstance(site.get("assigned_user"), dict) else {}
        active_name = normalize_text(assigned_user.get("name"))
        inspector_name = normalize_text(site.get("inspector_name"))
        legacy_site_id = extract_legacy_site_id_from_memo(site.get("memo"))
        if active_name != suspect_name or not inspector_name or inspector_name == suspect_name or not legacy_site_id:
            continue
        candidates.append(site)
    return candidates


def ensure_assignment_state(
    client: TargetErpClient,
    assignments: list[dict[str, object]],
    *,
    site_id: str,
    user_id: str,
    is_active: bool,
) -> None:
    matched = next(
        (
            row
            for row in assignments
            if normalize_text(row.get("site_id")) == site_id and normalize_text(row.get("user_id")) == user_id
        ),
        None,
    )
    if matched:
        if bool(matched.get("is_active", True)) != is_active:
            updated = client.update_assignment(normalize_text(matched.get("id")), {"is_active": is_active})
            matched.update(updated)
        return
    if not is_active:
        return
    created = client.create_assignment(
        {
            "site_id": site_id,
            "user_id": user_id,
            "role_on_site": "Legacy imported field agent",
            "memo": "legacy_insafed_assignment_repair",
        }
    )
    assignments.append(created)


def main() -> int:
    args = build_parser().parse_args()
    audit_dir = ensure_dir(Path(args.audit_dir).resolve())
    token = TargetErpClient.issue_token(args.target_base_url, args.target_email, args.target_password)
    target_client = TargetErpClient(args.target_base_url, token, timeout=60, max_retries=3)
    legacy_client = LegacyInsafedClient(args.legacy_base_url, args.legacy_email, args.legacy_password, timeout=60)
    legacy_client.login()

    sites = target_client.fetch_sites()
    users = target_client.fetch_users()
    assignments = target_client.fetch_all("/api/safety/assignments", {"active_only": "false"}, limit=500)
    candidates = find_candidate_sites(sites, normalize_text(args.suspect_name))
    user_by_name = build_user_lookup(users)
    findings: list[dict[str, object]] = []

    for site in candidates:
        legacy_site_id = extract_legacy_site_id_from_memo(site.get("memo"))
        expected_name = normalize_text(site.get("inspector_name"))
        assigned_user = site.get("assigned_user") if isinstance(site.get("assigned_user"), dict) else {}
        findings.append(
            {
                "legacy_site_id": legacy_site_id,
                "site_id": normalize_text(site.get("id")),
                "site_name": normalize_text(site.get("site_name")),
                "expected_worker_name": expected_name,
                "current_active_name": normalize_text(assigned_user.get("name")),
            }
        )

    write_jsonl(audit_dir / "candidates.jsonl", findings)
    if not args.execute:
        write_json(audit_dir / "summary.json", {"candidate_count": len(findings), "suspect_name": args.suspect_name})
        print({"candidate_count": len(findings), "suspect_name": args.suspect_name})
        return 0

    results: list[dict[str, object]] = []
    for site in candidates:
        site_id = normalize_text(site.get("id"))
        site_name = normalize_text(site.get("site_name"))
        legacy_site_id = extract_legacy_site_id_from_memo(site.get("memo"))
        expected_name = normalize_text(site.get("inspector_name"))
        current_active_name = normalize_text(((site.get("assigned_user") if isinstance(site.get("assigned_user"), dict) else {}) or {}).get("name"))
        target_user = user_by_name.get(expected_name)
        suspect_user = user_by_name.get(normalize_text(args.suspect_name))
        if not legacy_site_id or not target_user or not suspect_user:
            results.append(
                {
                    "legacy_site_id": legacy_site_id,
                    "site_id": site_id,
                    "site_name": site_name,
                    "status": "skipped",
                    "expected_worker_name": expected_name,
                    "current_active_name": current_active_name,
                }
            )
            continue
        ensure_assignment_state(target_client, assignments, site_id=site_id, user_id=target_user[0], is_active=True)
        ensure_assignment_state(target_client, assignments, site_id=site_id, user_id=suspect_user[0], is_active=False)
        legacy_record = parse_site_detail(legacy_client.fetch_site_detail(legacy_site_id))
        legacy_record["legacy_site_id"] = legacy_site_id
        sync_site_schedule_rows(target_client, site, legacy_record, user_by_name)
        results.append(
            {
                "legacy_site_id": legacy_site_id,
                "site_id": site_id,
                "site_name": site_name,
                "status": "repaired",
                "expected_worker_name": expected_name,
                "previous_active_name": current_active_name,
            }
        )
        print({"legacy_site_id": legacy_site_id, "site_name": site_name, "expected_worker_name": expected_name}, flush=True)

    write_jsonl(audit_dir / "results.jsonl", results)
    write_json(
        audit_dir / "summary.json",
        {
            "candidate_count": len(findings),
            "repaired_count": len([row for row in results if row["status"] == "repaired"]),
            "skipped_count": len([row for row in results if row["status"] == "skipped"]),
            "suspect_name": args.suspect_name,
        },
    )
    print(
        {
            "candidate_count": len(findings),
            "repaired_count": len([row for row in results if row["status"] == "repaired"]),
            "skipped_count": len([row for row in results if row["status"] == "skipped"]),
            "suspect_name": args.suspect_name,
        }
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
