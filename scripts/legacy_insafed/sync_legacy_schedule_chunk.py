#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import ensure_dir, normalize_text, write_jsonl
    from scripts.legacy_insafed.cutover_dataset import build_live_site_indexes, filter_cutover_bundle, load_export_bundle, validate_export_root
    from scripts.legacy_insafed.cutover_schedule_sync import sync_site_schedule_rows
    from scripts.legacy_insafed.target_client import TargetErpClient
else:
    from .common import ensure_dir, normalize_text, write_jsonl
    from .cutover_dataset import build_live_site_indexes, filter_cutover_bundle, load_export_bundle, validate_export_root
    from .cutover_schedule_sync import sync_site_schedule_rows
    from .target_client import TargetErpClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Sync a chunk of legacy sites into live admin schedules.")
    parser.add_argument("--export-root", required=True)
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-email", required=True)
    parser.add_argument("--target-password", required=True)
    parser.add_argument("--audit-dir", default=".artifacts/legacy-schedule-sync-chunks")
    parser.add_argument("--offset", type=int, default=0)
    parser.add_argument("--limit", type=int, default=200)
    return parser


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
    missing = validate_export_root(export_root, require_schedule_workbook=False)
    if missing:
        raise SystemExit(f"Export root is missing required files: {', '.join(missing)}")

    audit_dir = ensure_dir(Path(args.audit_dir).resolve())
    bundle = load_export_bundle(export_root)
    scope = filter_cutover_bundle(bundle)
    ordered_sites = sorted(
        scope["sites"],
        key=lambda row: (
            normalize_text(row.get("legacy_headquarter_id")),
            normalize_text(row.get("legacy_site_id")),
        ),
    )
    chunk_sites = ordered_sites[args.offset : args.offset + args.limit]
    token = TargetErpClient.issue_token(args.target_base_url, args.target_email, args.target_password)
    client = TargetErpClient(args.target_base_url, token, timeout=60, max_retries=3)
    live_indexes = build_live_site_indexes(client.fetch_sites())
    user_by_name = build_user_lookup(client.fetch_users())
    results = []

    for index, legacy_site in enumerate(chunk_sites, start=1):
        legacy_site_id = normalize_text(legacy_site.get("legacy_site_id"))
        live_site = live_indexes["live_by_legacy_id"].get(legacy_site_id)
        if not live_site:
            results.append(
                {
                    "legacy_site_id": legacy_site_id,
                    "site_name": normalize_text(legacy_site.get("site_name")),
                    "status": "missing_live_site",
                }
            )
            continue
        sync_site_schedule_rows(client, live_site, legacy_site, user_by_name)
        results.append(
            {
                "legacy_site_id": legacy_site_id,
                "site_id": normalize_text(live_site.get("id")),
                "site_name": normalize_text(live_site.get("site_name")),
                "status": "synced",
            }
        )
        if index % 25 == 0:
            print(
                {
                    "chunk_offset": args.offset,
                    "processed": index,
                    "chunk_total": len(chunk_sites),
                    "last_legacy_site_id": legacy_site_id,
                },
                flush=True,
            )

    out_path = audit_dir / f"sync-results-{args.offset:04d}-{args.offset + len(chunk_sites):04d}.jsonl"
    write_jsonl(out_path, results)
    print(
        {
            "chunk_offset": args.offset,
            "chunk_total": len(chunk_sites),
            "missing_live_sites": len([row for row in results if row["status"] == "missing_live_site"]),
            "result_path": str(out_path),
            "synced": len([row for row in results if row["status"] == "synced"]),
        },
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
