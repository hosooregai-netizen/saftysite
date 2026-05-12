#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import ensure_dir, normalize_text, write_json, write_jsonl
    from scripts.legacy_insafed.cutover_cleanup import (
        build_preflight_summary,
        delete_legacy_scope,
        fetch_all_admin_schedules,
        fetch_all_reports,
        summarize_diff_rows,
    )
    from scripts.legacy_insafed.cutover_dataset import build_live_site_indexes, filter_cutover_bundle, load_export_bundle, validate_export_root
    from scripts.legacy_insafed.cutover_recreate import recreate_legacy_scope
    from scripts.legacy_insafed.cutover_reports import (
        build_report_round_map,
        prepare_report_reimport_export,
        run_pdf_archive_apply,
        run_report_reimport,
        write_report_verification,
    )
    from scripts.legacy_insafed.cutover_schedule_sync import build_memo_diff_rows, build_schedule_diff_rows, sync_site_schedule_rows
    from scripts.legacy_insafed.target_client import TargetErpClient
else:
    from .common import ensure_dir, normalize_text, write_json, write_jsonl
    from .cutover_cleanup import build_preflight_summary, delete_legacy_scope, fetch_all_admin_schedules, fetch_all_reports, summarize_diff_rows
    from .cutover_dataset import build_live_site_indexes, filter_cutover_bundle, load_export_bundle, validate_export_root
    from .cutover_recreate import recreate_legacy_scope
    from .cutover_reports import build_report_round_map, prepare_report_reimport_export, run_pdf_archive_apply, run_report_reimport, write_report_verification
    from .cutover_schedule_sync import build_memo_diff_rows, build_schedule_diff_rows, sync_site_schedule_rows
    from .target_client import TargetErpClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Single-cutover reconciliation for legacy InSEF sites, reports, and schedules.")
    parser.add_argument("--export-root", required=True)
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-email", required=True)
    parser.add_argument("--target-password", required=True)
    parser.add_argument("--legacy-base-url", default="http://console.insafed.com/insef/public")
    parser.add_argument("--legacy-email", default="")
    parser.add_argument("--legacy-password", default="")
    parser.add_argument("--audit-dir", default=".artifacts/legacy-cutover")
    parser.add_argument("--execute", action="store_true", help="Apply destructive site cleanup and full reimport. Without this flag the script only writes preflight audits.")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    export_root = Path(args.export_root).resolve()
    audit_dir = ensure_dir(Path(args.audit_dir).resolve())
    missing = validate_export_root(export_root)
    if missing:
        raise SystemExit(f"Export root is missing required files: {', '.join(missing)}")

    bundle = load_export_bundle(export_root)
    scope = filter_cutover_bundle(bundle)
    token = TargetErpClient.issue_token(args.target_base_url, args.target_email, args.target_password)
    client = TargetErpClient(args.target_base_url, token, timeout=60, max_retries=3)
    live_sites = client.fetch_sites()
    live_reports = fetch_all_reports(client)
    live_indexes = build_live_site_indexes(live_sites)
    before_schedules = fetch_all_admin_schedules(client)
    before_diff = build_schedule_diff_rows(scope["sites"], live_indexes["live_by_legacy_id"], before_schedules)

    write_jsonl(audit_dir / "preserved-test-sites.jsonl", scope["preserved_sites"])
    write_jsonl(audit_dir / "preserved-test-reports.jsonl", scope["preserved_reports"])
    write_jsonl(audit_dir / "schedule-diff-before.jsonl", before_diff)
    write_json(audit_dir / "preflight-summary.json", build_preflight_summary(bundle, scope, live_indexes, live_reports, before_diff))

    if not args.execute:
        print({"audit_dir": str(audit_dir), "mode": "preflight", "schedule_diff_before": summarize_diff_rows(before_diff)}, flush=True)
        return 0

    delete_summary = delete_legacy_scope(client, live_indexes["cutover_legacy_sites"], audit_dir)
    recreate_summary = recreate_legacy_scope(client, scope, audit_dir)

    live_sites = client.fetch_sites()
    live_indexes = build_live_site_indexes(live_sites)
    live_users = client.fetch_users()
    user_by_name = {
        normalize_text(user.get("name")): (normalize_text(user.get("id")), normalize_text(user.get("name")))
        for user in live_users
        if normalize_text(user.get("name")) and normalize_text(user.get("id"))
    }
    for legacy_site in scope["sites"]:
        live_site = live_indexes["live_by_legacy_id"].get(normalize_text(legacy_site.get("legacy_site_id")))
        if live_site:
            sync_site_schedule_rows(client, live_site, legacy_site, user_by_name)

    working_export_root = ensure_dir(audit_dir / "working-export")
    metadata_path = prepare_report_reimport_export(
        export_root,
        working_export_root,
        scope["sites"],
        scope["reports"],
        recreate_summary["site_map"],
    )
    run_report_reimport(
        Path(__file__).resolve().parents[2],
        working_export_root,
        args.target_base_url,
        args.target_email,
        args.target_password,
        args.legacy_base_url,
        args.legacy_email,
        args.legacy_password,
    )
    run_pdf_archive_apply(
        Path(__file__).resolve().parents[2],
        metadata_path,
        args.target_base_url,
        args.target_email,
        args.target_password,
        audit_dir / "pdf-archive-apply",
    )

    report_round_map = build_report_round_map(scope["reports"])
    live_sites = client.fetch_sites()
    live_indexes = build_live_site_indexes(live_sites)
    for legacy_site in scope["sites"]:
        legacy_site_id = normalize_text(legacy_site.get("legacy_site_id"))
        live_site = live_indexes["live_by_legacy_id"].get(legacy_site_id)
        if live_site:
            sync_site_schedule_rows(client, live_site, legacy_site, user_by_name, report_round_map.get(legacy_site_id, {}))

    live_reports = fetch_all_reports(client)
    report_verification = write_report_verification(audit_dir / "reimported-reports.jsonl", scope["reports"], live_reports)
    after_schedules = fetch_all_admin_schedules(client)
    after_diff = build_schedule_diff_rows(scope["sites"], live_indexes["live_by_legacy_id"], after_schedules)
    memo_diff = build_memo_diff_rows(live_indexes["cutover_legacy_sites"], after_schedules)
    write_jsonl(audit_dir / "schedule-diff-after.jsonl", after_diff)
    write_jsonl(audit_dir / "memo-diff-after.jsonl", memo_diff)
    write_json(
        audit_dir / "cutover-summary.json",
        {
            "delete_summary": delete_summary,
            "report_verification": report_verification,
            "schedule_diff_after": summarize_diff_rows(after_diff),
            "schedule_diff_before": summarize_diff_rows(before_diff),
            "memo_diff_after": len(memo_diff),
        },
    )
    print({"audit_dir": str(audit_dir), "mode": "execute", "schedule_diff_after": summarize_diff_rows(after_diff)}, flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
