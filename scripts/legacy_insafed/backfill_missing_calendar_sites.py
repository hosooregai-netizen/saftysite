#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import ensure_dir, normalize_text, write_json, write_jsonl
    from scripts.legacy_insafed.cutover_recreate import recreate_legacy_scope
    from scripts.legacy_insafed.cutover_schedule_sync import sync_site_schedule_rows
    from scripts.legacy_insafed.export_parsers import parse_company_detail, parse_company_rows, parse_site_detail
    from scripts.legacy_insafed.legacy_client import LegacyInsafedClient
    from scripts.legacy_insafed.legacy_site_identity import extract_legacy_site_id_from_memo
    from scripts.legacy_insafed.target_client import TargetErpClient
else:
    from .common import ensure_dir, normalize_text, write_json, write_jsonl
    from .cutover_recreate import recreate_legacy_scope
    from .cutover_schedule_sync import sync_site_schedule_rows
    from .export_parsers import parse_company_detail, parse_company_rows, parse_site_detail
    from .legacy_client import LegacyInsafedClient
    from .legacy_site_identity import extract_legacy_site_id_from_memo
    from .target_client import TargetErpClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Backfill legacy calendar sites missing from the new ERP exact-date schedule view.")
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-email", required=True)
    parser.add_argument("--target-password", required=True)
    parser.add_argument("--legacy-base-url", required=True)
    parser.add_argument("--legacy-email", required=True)
    parser.add_argument("--legacy-password", required=True)
    parser.add_argument("--target-date", default="2026-04-01")
    parser.add_argument("--audit-dir", default=".artifacts/legacy-calendar-backfill")
    return parser


def normalize_company_name(value: Any) -> str:
    normalized = normalize_text(value).replace("주식회사", "").replace("(주)", "").replace("㈜", "")
    return re.sub(r"[^0-9A-Za-z가-힣]+", "", normalized).lower()


def fetch_legacy_calendar_sites(client: LegacyInsafedClient, target_date: str) -> list[dict[str, str]]:
    end_date = (datetime.strptime(target_date, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")
    payload = client.get_json("support/calendarData", {"start": target_date, "end": end_date, "company_id": "208", "su_us_id": ""})
    rows = payload if isinstance(payload, list) else payload.get("data", payload)
    by_site_id: dict[str, dict[str, str]] = {}
    for row in rows:
        description = row.get("description") if isinstance(row.get("description"), dict) else {}
        site_id = normalize_text(description.get("su_cs_id"))
        event_date = normalize_text(row.get("start") or row.get("date"))
        if not site_id or event_date != target_date:
            continue
        by_site_id[site_id] = {
            "legacy_site_id": site_id,
            "company_name": normalize_text(description.get("cc_name")),
            "site_name": normalize_text(description.get("cs_name")),
        }
    return list(by_site_id.values())


def fetch_live_site_names_for_date(client: TargetErpClient, target_date: str) -> set[str]:
    payload = client._request("GET", "/api/admin/schedules", params={"month": target_date[:7], "planned_date": target_date, "limit": 5000, "offset": 0}).json()
    return {normalize_text(row.get("site_name")) for row in payload.get("rows", []) if normalize_text(row.get("site_name"))}


def crawl_company_rows(client: LegacyInsafedClient, target_names: set[str]) -> dict[str, dict[str, Any]]:
    found: dict[str, dict[str, Any]] = {}
    for page in range(1, 401):
        rows = parse_company_rows(client.fetch_company_page(page))
        if not rows and page > 50:
            break
        for row in rows:
            key = normalize_company_name(row.get("name"))
            if key in target_names and key not in found:
                found[key] = row
        if target_names.issubset(found):
            return found
    missing = sorted(target_names - set(found))
    raise RuntimeError(f"Could not resolve legacy companies: {missing}")


def build_scope(client: LegacyInsafedClient, legacy_base_url: str, missing_sites: list[dict[str, str]]) -> dict[str, list[dict[str, Any]]]:
    company_rows = crawl_company_rows(client, {normalize_company_name(site["company_name"]) for site in missing_sites})
    headquarters: dict[str, dict[str, Any]] = {}
    sites: list[dict[str, Any]] = []
    for item in missing_sites:
        company = company_rows[normalize_company_name(item["company_name"])]
        company_detail = parse_company_detail(client.fetch_company_detail(company["legacy_headquarter_id"]))
        headquarters[company["legacy_headquarter_id"]] = {**company, **company_detail}
        site_detail = parse_site_detail(client.fetch_site_detail(item["legacy_site_id"]))
        sites.append(
            {
                **site_detail,
                "detail_href": f"{legacy_base_url.rstrip('/')}/cons?id={item['legacy_site_id']}",
                "headquarter_name": normalize_text(company.get("name")),
                "legacy_headquarter_id": normalize_text(company.get("legacy_headquarter_id")),
                "legacy_site_id": item["legacy_site_id"],
            }
        )
    return {"headquarters": list(headquarters.values()), "inspectors": [], "sites": sites}


def build_live_by_legacy_id(sites: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {
        extract_legacy_site_id_from_memo(site.get("memo")): site
        for site in sites
        if extract_legacy_site_id_from_memo(site.get("memo"))
    }


def main() -> int:
    args = build_parser().parse_args()
    audit_dir = ensure_dir(Path(args.audit_dir).resolve())
    token = TargetErpClient.issue_token(args.target_base_url, args.target_email, args.target_password)
    target_client = TargetErpClient(args.target_base_url, token, timeout=60, max_retries=3)
    legacy_client = LegacyInsafedClient(args.legacy_base_url, args.legacy_email, args.legacy_password, timeout=60)
    legacy_client.login()
    legacy_sites = fetch_legacy_calendar_sites(legacy_client, args.target_date)
    live_site_names = fetch_live_site_names_for_date(target_client, args.target_date)
    missing_sites = [site for site in legacy_sites if site["site_name"] not in live_site_names]
    write_jsonl(audit_dir / "legacy-calendar-sites.jsonl", legacy_sites)
    write_jsonl(audit_dir / "missing-calendar-sites.jsonl", missing_sites)
    if not missing_sites:
        write_json(audit_dir / "summary.json", {"target_date": args.target_date, "legacy_count": len(legacy_sites), "new_count": len(live_site_names), "backfilled_count": 0})
        print({"target_date": args.target_date, "legacy_count": len(legacy_sites), "new_count": len(live_site_names), "backfilled_count": 0})
        return 0
    scope = build_scope(legacy_client, args.legacy_base_url, missing_sites)
    recreate_legacy_scope(target_client, scope, audit_dir)
    live_sites = target_client.fetch_sites()
    live_users = target_client.fetch_users()
    live_by_legacy_id = build_live_by_legacy_id(live_sites)
    user_by_name = {normalize_text(user.get("name")): (normalize_text(user.get("id")), normalize_text(user.get("name"))) for user in live_users if normalize_text(user.get("name"))}
    for site in scope["sites"]:
        live_site = live_by_legacy_id.get(normalize_text(site.get("legacy_site_id")))
        if live_site:
            sync_site_schedule_rows(target_client, live_site, site, user_by_name)
    next_live_names = fetch_live_site_names_for_date(target_client, args.target_date)
    remaining = [site for site in legacy_sites if site["site_name"] not in next_live_names]
    write_json(
        audit_dir / "summary.json",
        {
            "target_date": args.target_date,
            "legacy_count": len(legacy_sites),
            "new_count_after": len(next_live_names),
            "backfilled_count": len(missing_sites) - len(remaining),
            "remaining_missing": [site["site_name"] for site in remaining],
        },
    )
    print({"target_date": args.target_date, "legacy_count": len(legacy_sites), "new_count_after": len(next_live_names), "backfilled_count": len(missing_sites) - len(remaining), "remaining_missing": [site["site_name"] for site in remaining]})
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
