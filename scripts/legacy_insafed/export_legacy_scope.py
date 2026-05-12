#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import append_jsonl, ensure_dir, iso_now, write_json, write_jsonl
    from scripts.legacy_insafed.export_parsers import parse_company_detail, parse_company_rows, parse_company_sites, parse_site_detail
    from scripts.legacy_insafed.legacy_client import LegacyInsafedClient
else:
    from .common import append_jsonl, ensure_dir, iso_now, write_json, write_jsonl
    from .export_parsers import parse_company_detail, parse_company_rows, parse_company_sites, parse_site_detail
    from .legacy_client import LegacyInsafedClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Export legacy InSEF headquarters/sites without report PDFs.")
    parser.add_argument("--legacy-base-url", default="http://console.insafed.com/insef/public")
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--out-root", required=True)
    parser.add_argument("--max-companies", type=int, default=0)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    started_at = iso_now()
    out_root = ensure_dir(Path(args.out_root))
    ensure_dir(out_root / "reports")
    failures_path = out_root / "failures.jsonl"
    client = LegacyInsafedClient(args.legacy_base_url, args.username, args.password)
    client.login()

    schedule_workbook_exported = False
    try:
        client.download_schedule_workbook(out_root / "schedules.xlsx")
        schedule_workbook_exported = True
    except Exception as error:
        append_jsonl(failures_path, {"phase": "export_schedule_workbook", "error": str(error)})

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
            try:
                site_rows = parse_company_sites(client.fetch_company_sites(str(row["legacy_headquarter_id"])))
            except Exception as error:
                append_jsonl(
                    failures_path,
                    {"phase": "export_company_sites", "legacy_headquarter_id": row["legacy_headquarter_id"], "error": str(error)},
                )
                exported += 1
                continue
            for site_summary in site_rows:
                try:
                    site = parse_site_detail(client.fetch_site_detail(str(site_summary["legacy_site_id"])))
                    sites.append(
                        {
                            **site_summary,
                            **site,
                            "legacy_headquarter_id": row["legacy_headquarter_id"],
                            "headquarter_name": company["name"],
                        }
                    )
                except Exception as error:
                    append_jsonl(
                        failures_path,
                        {"phase": "export_site", "legacy_site_id": site_summary["legacy_site_id"], "error": str(error)},
                    )
            exported += 1
            if exported % 25 == 0:
                print({"companies": exported, "sites": len(sites), "page": page}, flush=True)
        if args.max_companies and exported >= args.max_companies:
            break
        page += 1

    write_jsonl(out_root / "headquarters.jsonl", companies)
    write_jsonl(out_root / "sites.jsonl", sites)
    write_jsonl(out_root / "reports" / "metadata.jsonl", [])
    write_json(
        out_root / "migration-manifest.json",
        {
            "startedAt": started_at,
            "finishedAt": iso_now(),
            "counts": {"headquarters": len(companies), "reports": 0, "sites": len(sites)},
            "paths": {
                "headquarters": "headquarters.jsonl",
                "sites": "sites.jsonl",
                "schedules": "schedules.xlsx" if schedule_workbook_exported else None,
                "reports": "reports/metadata.jsonl",
                "failures": "failures.jsonl",
            },
        },
    )
    print(f"exported {len(companies)} headquarters and {len(sites)} sites -> {out_root}", flush=True)


if __name__ == "__main__":
    main()
