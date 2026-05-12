#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import ensure_dir, normalize_text, write_json, write_jsonl
    from scripts.legacy_insafed.cutover_cleanup import fetch_all_admin_schedules, summarize_diff_rows
    from scripts.legacy_insafed.cutover_dataset import (
        build_live_site_indexes,
        filter_cutover_bundle,
        load_export_bundle,
        validate_export_root,
    )
    from scripts.legacy_insafed.cutover_recreate import recreate_legacy_scope
    from scripts.legacy_insafed.cutover_schedule_sync import build_schedule_diff_rows, sync_site_schedule_rows
    from scripts.legacy_insafed.target_client import TargetErpClient
else:
    from .common import ensure_dir, normalize_text, write_json, write_jsonl
    from .cutover_cleanup import fetch_all_admin_schedules, summarize_diff_rows
    from .cutover_dataset import build_live_site_indexes, filter_cutover_bundle, load_export_bundle, validate_export_root
    from .cutover_recreate import recreate_legacy_scope
    from .cutover_schedule_sync import build_schedule_diff_rows, sync_site_schedule_rows
    from .target_client import TargetErpClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Backfill missing legacy sites and resync all legacy schedules without deleting live data.",
    )
    parser.add_argument("--export-root", required=True)
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-email", required=True)
    parser.add_argument("--target-password", required=True)
    parser.add_argument("--audit-dir", default=".artifacts/legacy-schedule-parity")
    parser.add_argument("--execute", action="store_true")
    return parser


def build_missing_scope(
    scope_sites: list[dict[str, object]],
    scope_headquarters: list[dict[str, object]],
    scope_inspectors: list[dict[str, object]],
    live_by_legacy_id: dict[str, dict[str, object]],
) -> dict[str, list[dict[str, object]]]:
    missing_sites = [
        site
        for site in scope_sites
        if normalize_text(site.get("legacy_site_id"))
        and normalize_text(site.get("legacy_site_id")) not in live_by_legacy_id
    ]
    missing_headquarter_ids = {
        normalize_text(site.get("legacy_headquarter_id"))
        for site in missing_sites
        if normalize_text(site.get("legacy_headquarter_id"))
    }
    missing_site_ids = {
        normalize_text(site.get("legacy_site_id"))
        for site in missing_sites
        if normalize_text(site.get("legacy_site_id"))
    }
    missing_headquarters = [
        row
        for row in scope_headquarters
        if normalize_text(row.get("legacy_headquarter_id")) in missing_headquarter_ids
    ]
    missing_inspectors = []
    for inspector in scope_inspectors:
        assigned_sites = [
            item
            for item in inspector.get("assigned_sites", [])
            if normalize_text(item.get("legacy_site_id")) in missing_site_ids
        ]
        if assigned_sites:
            missing_inspectors.append({**inspector, "assigned_sites": assigned_sites})
    return {
        "headquarters": missing_headquarters,
        "inspectors": missing_inspectors,
        "sites": missing_sites,
    }


def build_user_lookup(users: list[dict[str, object]]) -> dict[str, tuple[str, str]]:
    return {
        normalize_text(user.get("name")): (
            normalize_text(user.get("id")),
            normalize_text(user.get("name")),
        )
        for user in users
        if normalize_text(user.get("name")) and normalize_text(user.get("id"))
    }


def main() -> int:
    args = build_parser().parse_args()
    export_root = Path(args.export_root).resolve()
    missing = validate_export_root(export_root)
    if missing:
        raise SystemExit(f"Export root is missing required files: {', '.join(missing)}")

    audit_dir = ensure_dir(Path(args.audit_dir).resolve())
    bundle = load_export_bundle(export_root)
    scope = filter_cutover_bundle(bundle)
    token = TargetErpClient.issue_token(args.target_base_url, args.target_email, args.target_password)
    client = TargetErpClient(args.target_base_url, token, timeout=60, max_retries=3)
    live_sites = client.fetch_sites()
    live_indexes = build_live_site_indexes(live_sites)
    before_rows = fetch_all_admin_schedules(client)
    before_diff = build_schedule_diff_rows(scope["sites"], live_indexes["live_by_legacy_id"], before_rows)
    missing_scope = build_missing_scope(
        scope["sites"],
        scope["headquarters"],
        scope["inspectors"],
        live_indexes["live_by_legacy_id"],
    )

    write_jsonl(audit_dir / "schedule-diff-before.jsonl", before_diff)
    write_jsonl(audit_dir / "missing-sites.jsonl", missing_scope["sites"])
    write_json(
        audit_dir / "preflight-summary.json",
        {
            "mode": "preflight" if not args.execute else "execute",
            "missing_site_count": len(missing_scope["sites"]),
            "schedule_diff_before": summarize_diff_rows(before_diff),
        },
    )
    if not args.execute:
        print(
            {
                "audit_dir": str(audit_dir),
                "mode": "preflight",
                "missing_site_count": len(missing_scope["sites"]),
                "schedule_diff_before": summarize_diff_rows(before_diff),
            }
        )
        return 0

    recreate_summary = recreate_legacy_scope(client, missing_scope, audit_dir)
    live_sites = client.fetch_sites()
    live_indexes = build_live_site_indexes(live_sites)
    user_by_name = build_user_lookup(client.fetch_users())
    sync_results = []
    for legacy_site in scope["sites"]:
        live_site = live_indexes["live_by_legacy_id"].get(normalize_text(legacy_site.get("legacy_site_id")))
        if not live_site:
            sync_results.append(
                {
                    "legacy_site_id": normalize_text(legacy_site.get("legacy_site_id")),
                    "site_name": normalize_text(legacy_site.get("site_name")),
                    "status": "missing_after_recreate",
                }
            )
            continue
        sync_site_schedule_rows(client, live_site, legacy_site, user_by_name)
        sync_results.append(
            {
                "legacy_site_id": normalize_text(legacy_site.get("legacy_site_id")),
                "site_id": normalize_text(live_site.get("id")),
                "site_name": normalize_text(live_site.get("site_name")),
                "status": "synced",
            }
        )

    after_rows = fetch_all_admin_schedules(client)
    after_diff = build_schedule_diff_rows(scope["sites"], live_indexes["live_by_legacy_id"], after_rows)
    write_jsonl(audit_dir / "schedule-sync-results.jsonl", sync_results)
    write_jsonl(audit_dir / "schedule-diff-after.jsonl", after_diff)
    write_json(
        audit_dir / "execute-summary.json",
        {
            "missing_site_count": len(missing_scope["sites"]),
            "recreated_site_count": len(recreate_summary["site_map"]),
            "schedule_diff_before": summarize_diff_rows(before_diff),
            "schedule_diff_after": summarize_diff_rows(after_diff),
            "synced_site_count": len([row for row in sync_results if row["status"] == "synced"]),
        },
    )
    print(
        {
            "audit_dir": str(audit_dir),
            "missing_site_count": len(missing_scope["sites"]),
            "recreated_site_count": len(recreate_summary["site_map"]),
            "schedule_diff_after": summarize_diff_rows(after_diff),
        }
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
