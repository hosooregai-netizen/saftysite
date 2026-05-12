#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.backfill_missing_calendar_sites import build_scope
    from scripts.legacy_insafed.common import ensure_dir, normalize_text, write_json, write_jsonl
    from scripts.legacy_insafed.cutover_dataset import build_live_site_indexes
    from scripts.legacy_insafed.cutover_recreate import recreate_legacy_scope
    from scripts.legacy_insafed.cutover_schedule_sync import sync_site_schedule_rows
    from scripts.legacy_insafed.export_parsers import parse_site_detail
    from scripts.legacy_insafed.legacy_client import LegacyInsafedClient
    from scripts.legacy_insafed.live_calendar_parity import diff_calendar_events, fetch_legacy_calendar_events, fetch_live_calendar_events
    from scripts.legacy_insafed.target_client import TargetErpClient
else:
    from .backfill_missing_calendar_sites import build_scope
    from .common import ensure_dir, normalize_text, write_json, write_jsonl
    from .cutover_dataset import build_live_site_indexes
    from .cutover_recreate import recreate_legacy_scope
    from .cutover_schedule_sync import sync_site_schedule_rows
    from .export_parsers import parse_site_detail
    from .legacy_client import LegacyInsafedClient
    from .live_calendar_parity import diff_calendar_events, fetch_legacy_calendar_events, fetch_live_calendar_events
    from .target_client import TargetErpClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Compare live legacy calendar vs official new calendar for a date range and repair missing schedules.")
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-email", required=True)
    parser.add_argument("--target-password", required=True)
    parser.add_argument("--legacy-base-url", required=True)
    parser.add_argument("--legacy-email", required=True)
    parser.add_argument("--legacy-password", required=True)
    parser.add_argument("--start-date", required=True)
    parser.add_argument("--end-date", required=True)
    parser.add_argument("--audit-dir", default=".artifacts/live-calendar-range-repair")
    parser.add_argument("--execute", action="store_true")
    return parser


def build_user_lookup(users: list[dict[str, object]]) -> dict[str, tuple[str, str]]:
    return {
        normalize_text(user.get("name")): (normalize_text(user.get("id")), normalize_text(user.get("name")))
        for user in users
        if normalize_text(user.get("name")) and normalize_text(user.get("id"))
    }


def first_by_legacy_id(rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    mapped: dict[str, dict[str, str]] = {}
    for row in rows:
        legacy_site_id = normalize_text(row.get("legacy_site_id"))
        if legacy_site_id and legacy_site_id not in mapped:
            mapped[legacy_site_id] = row
    return mapped


def build_summary(rows: list[dict[str, str]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in rows:
        counts[row["planned_date"]] = counts.get(row["planned_date"], 0) + 1
    return counts


def main() -> int:
    args = build_parser().parse_args()
    audit_dir = ensure_dir(Path(args.audit_dir).resolve())
    token = TargetErpClient.issue_token(args.target_base_url, args.target_email, args.target_password)
    target_client = TargetErpClient(args.target_base_url, token, timeout=60, max_retries=3)
    legacy_client = LegacyInsafedClient(args.legacy_base_url, args.legacy_email, args.legacy_password, timeout=60)
    legacy_client.login()

    legacy_events = fetch_legacy_calendar_events(legacy_client, args.start_date, args.end_date)
    live_sites = target_client.fetch_sites()
    live_events = fetch_live_calendar_events(target_client, live_sites, args.start_date, args.end_date)
    missing_before, extra_before = diff_calendar_events(legacy_events, live_events)
    write_jsonl(audit_dir / "legacy-events.jsonl", legacy_events)
    write_jsonl(audit_dir / "live-events-before.jsonl", live_events)
    write_jsonl(audit_dir / "missing-before.jsonl", missing_before)
    write_jsonl(audit_dir / "extra-before.jsonl", extra_before)
    preflight = {
        "start_date": args.start_date,
        "end_date": args.end_date,
        "legacy_count": len(legacy_events),
        "live_count": len(live_events),
        "missing_count": len(missing_before),
        "extra_count": len(extra_before),
        "missing_by_date": build_summary(missing_before),
        "extra_by_date": build_summary(extra_before),
    }
    write_json(audit_dir / "preflight-summary.json", preflight)
    if not args.execute:
        print(preflight)
        return 0

    live_indexes = build_live_site_indexes(live_sites)
    missing_sites = [
        row
        for row in first_by_legacy_id(missing_before).values()
        if normalize_text(row.get("legacy_site_id")) not in live_indexes["live_by_legacy_id"]
    ]
    if missing_sites:
        recreate_legacy_scope(target_client, build_scope(legacy_client, args.legacy_base_url, missing_sites), audit_dir)
        live_sites = target_client.fetch_sites()
        live_indexes = build_live_site_indexes(live_sites)
    affected_legacy_ids = {
        normalize_text(row.get("legacy_site_id"))
        for row in [*missing_before, *extra_before]
        if normalize_text(row.get("legacy_site_id"))
    }
    user_by_name = build_user_lookup(target_client.fetch_users())
    sync_results = []
    for legacy_site_id in sorted(affected_legacy_ids):
        live_site = live_indexes["live_by_legacy_id"].get(legacy_site_id)
        if not live_site:
            sync_results.append({"legacy_site_id": legacy_site_id, "status": "missing_live_site"})
            continue
        print({"phase": "sync", "legacy_site_id": legacy_site_id, "site_name": normalize_text(live_site.get("site_name"))}, flush=True)
        try:
            legacy_record = parse_site_detail(legacy_client.fetch_site_detail(legacy_site_id))
            legacy_record["legacy_site_id"] = legacy_site_id
            sync_site_schedule_rows(target_client, live_site, legacy_record, user_by_name)
            sync_results.append(
                {
                    "legacy_site_id": legacy_site_id,
                    "site_id": normalize_text(live_site.get("id")),
                    "site_name": normalize_text(live_site.get("site_name")),
                    "status": "synced",
                }
            )
        except Exception as error:
            sync_results.append(
                {
                    "legacy_site_id": legacy_site_id,
                    "site_id": normalize_text(live_site.get("id")),
                    "site_name": normalize_text(live_site.get("site_name")),
                    "status": "sync_failed",
                    "error": str(error),
                }
            )
    live_events_after = fetch_live_calendar_events(target_client, target_client.fetch_sites(), args.start_date, args.end_date)
    missing_after, extra_after = diff_calendar_events(legacy_events, live_events_after)
    write_jsonl(audit_dir / "sync-results.jsonl", sync_results)
    write_jsonl(audit_dir / "live-events-after.jsonl", live_events_after)
    write_jsonl(audit_dir / "missing-after.jsonl", missing_after)
    write_jsonl(audit_dir / "extra-after.jsonl", extra_after)
    summary = {
        "start_date": args.start_date,
        "end_date": args.end_date,
        "legacy_count": len(legacy_events),
        "live_count_after": len(live_events_after),
        "recreated_missing_site_count": len(missing_sites),
        "synced_site_count": len([row for row in sync_results if row["status"] == "synced"]),
        "missing_count_before": len(missing_before),
        "missing_count_after": len(missing_after),
        "extra_count_before": len(extra_before),
        "extra_count_after": len(extra_after),
        "missing_by_date_after": build_summary(missing_after),
    }
    write_json(audit_dir / "execute-summary.json", summary)
    print(summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
