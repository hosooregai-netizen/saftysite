#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import append_jsonl, ensure_dir, iso_now, pick_first, write_json, write_jsonl
    from scripts.legacy_insafed.export_parsers import (
        parse_company_detail,
        parse_company_rows,
        parse_company_sites,
        parse_report_popup,
        parse_site_detail,
    )
    from scripts.legacy_insafed.legacy_client import LegacyInsafedClient
else:
    from .common import append_jsonl, ensure_dir, iso_now, pick_first, write_json, write_jsonl
    from .export_parsers import (
        parse_company_detail,
        parse_company_rows,
        parse_company_sites,
        parse_report_popup,
        parse_site_detail,
    )
    from .legacy_client import LegacyInsafedClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Export legacy InSEF worker data.")
    parser.add_argument("--legacy-base-url", default="http://console.insafed.com/insef/public")
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--out-root", required=True)
    parser.add_argument("--max-companies", type=int, default=0)
    parser.add_argument("--max-reports", type=int, default=0)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    started_at = iso_now()
    out_root = ensure_dir(Path(args.out_root))
    pdf_dir = ensure_dir(out_root / "reports" / "pdf")
    failures_path = out_root / "failures.jsonl"
    client = LegacyInsafedClient(args.legacy_base_url, args.username, args.password)
    client.login()
    client.download_schedule_workbook(out_root / "schedules.xlsx")
    companies: list[dict[str, object]] = []
    sites: list[dict[str, object]] = []
    exported = 0
    page = 1
    while True:
        company_rows = parse_company_rows(client.fetch_company_page(page))
        if not company_rows:
            break
        for row in company_rows:
            if args.max_companies and exported >= args.max_companies:
                break
            detail = parse_company_detail(client.fetch_company_detail(str(row["legacy_headquarter_id"])))
            company = {**row, **detail}
            companies.append(company)
            for site_summary in parse_company_sites(client.fetch_company_sites(str(row["legacy_headquarter_id"]))):
                try:
                    site = parse_site_detail(client.fetch_site_detail(str(site_summary["legacy_site_id"])))
                    sites.append({**site_summary, **site, "legacy_headquarter_id": row["legacy_headquarter_id"], "headquarter_name": company["name"]})
                except Exception as error:
                    append_jsonl(failures_path, {"phase": "export_site", "legacy_site_id": site_summary["legacy_site_id"], "error": str(error)})
            exported += 1
        if args.max_companies and exported >= args.max_companies:
            break
        page += 1
    write_jsonl(out_root / "headquarters.jsonl", companies)
    write_jsonl(out_root / "sites.jsonl", sites)
    site_lookup = {}
    for item in sites:
        site_lookup[(pick_first(item.get("headquarter_name")), pick_first(item.get("site_name")), pick_first(item.get("management_number")))] = item
        site_lookup[(pick_first(item.get("headquarter_name")), pick_first(item.get("site_name")), "")] = item
    reports: list[dict[str, object]] = []
    report_page = 1
    while True:
        payload = client.fetch_report_page(report_page).get("result", {})
        rows = payload.get("data", [])
        if not rows:
            break
        for row in rows:
            if args.max_reports and len(reports) >= args.max_reports:
                break
            popup = parse_report_popup(client.fetch_report_popup(row["su_id"]))
            matched_site = site_lookup.get((pick_first(popup.get("headquarter_name")), pick_first(popup.get("site_name")), pick_first(popup.get("management_number"))))
            if matched_site is None:
                matched_site = site_lookup.get((pick_first(popup.get("headquarter_name")), pick_first(popup.get("site_name")), ""))
            pdf_name = None
            archive_status = "metadata_only" if row.get("su_status") == "예약" else "pdf_archived"
            if archive_status == "pdf_archived":
                try:
                    pdf_name = client.download_report_pdf(row["su_id"], pdf_dir / f"{row['su_id']}.pdf")
                    if not pdf_name:
                        archive_status = "metadata_only"
                except Exception as error:
                    archive_status = "metadata_only"
                    append_jsonl(failures_path, {"phase": "export_report_pdf", "legacy_report_id": row["su_id"], "error": str(error)})
            reports.append(
                {
                    "legacy_report_id": row["su_id"],
                    "legacy_site_ref": row.get("su_cs_id"),
                    "legacy_site_id": matched_site.get("legacy_site_id") if matched_site else None,
                    "site_name": popup.get("site_name"),
                    "headquarter_name": popup.get("headquarter_name"),
                    "round_no": popup.get("round_no") or row.get("su_round"),
                    "visit_date": popup.get("visit_date") or row.get("su_supported_at"),
                    "status": row.get("su_status"),
                    "manager_name": popup.get("manager_name") or row.get("su_manager_name"),
                    "manager_phone": popup.get("manager_phone") or row.get("su_manager_hp"),
                    "manager_email": popup.get("manager_email") or row.get("su_manager_email"),
                    "assigned_worker_name": popup.get("assigned_worker_name"),
                    "pdf_filename": pdf_name,
                    "archive_status": archive_status,
                    "new_site_id": None,
                }
            )
        if args.max_reports and len(reports) >= args.max_reports:
            break
        if payload.get("current_page", 0) >= payload.get("last_page", 0):
            break
        report_page += 1
    write_jsonl(out_root / "reports" / "metadata.jsonl", reports)
    write_json(
        out_root / "migration-manifest.json",
        {
            "startedAt": started_at,
            "finishedAt": iso_now(),
            "counts": {
                "headquarters": len(companies),
                "sites": len(sites),
                "reports": len(reports),
                "pdfReports": len([item for item in reports if item.get("pdf_filename")]),
            },
            "paths": {
                "headquarters": "headquarters.jsonl",
                "sites": "sites.jsonl",
                "schedules": "schedules.xlsx",
                "reports": "reports/metadata.jsonl",
                "reportPdfDir": "reports/pdf",
                "failures": "failures.jsonl",
            },
        },
    )
    print(f"exported {len(companies)} headquarters, {len(sites)} sites, {len(reports)} reports -> {out_root}")


if __name__ == "__main__":
    main()
