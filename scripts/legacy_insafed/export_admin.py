#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.admin_parsers import (
        parse_data_rows,
        parse_inspector_detail,
        parse_inspector_rows,
        parse_max_page,
        parse_sendlog_rows,
        parse_support_agent_rows,
        parse_support_list_rows,
    )
    from scripts.legacy_insafed.common import append_jsonl, ensure_dir, iso_now, pick_first, write_json, write_jsonl
    from scripts.legacy_insafed.report_archive import export_report_archive
    from scripts.legacy_insafed.legacy_client import LegacyInsafedClient
else:
    from .admin_parsers import (
        parse_data_rows,
        parse_inspector_detail,
        parse_inspector_rows,
        parse_max_page,
        parse_sendlog_rows,
        parse_support_agent_rows,
        parse_support_list_rows,
    )
    from .common import append_jsonl, ensure_dir, iso_now, pick_first, write_json, write_jsonl
    from .report_archive import export_report_archive
    from .legacy_client import LegacyInsafedClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Export legacy InSEF admin data.")
    parser.add_argument("--legacy-base-url", default="http://console.insafed.com/insef/public")
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--out-root", required=True)
    parser.add_argument("--include-schedule-workbook", action="store_true")
    parser.add_argument("--include-report-pdfs", action="store_true")
    parser.add_argument("--max-reports", type=int, default=0)
    parser.add_argument("--report-workers", type=int, default=8)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    started_at = iso_now()
    out_root = ensure_dir(Path(args.out_root))
    admin_root = ensure_dir(out_root / "admin")
    raw_root = ensure_dir(admin_root / "raw")
    failures_path = out_root / "failures.jsonl"
    client = LegacyInsafedClient(args.legacy_base_url, args.username, args.password, timeout=60)
    client.login()

    def fetch_text(path: str, params: dict[str, str] | None = None) -> str:
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                return client.get_text(path, params=params)
            except Exception as error:
                last_error = error
                time.sleep(attempt + 1)
        raise last_error or RuntimeError(f"Failed to fetch {path}")

    snapshots = {
        name: fetch_text(name)
        for name in ["manager", "support", "support/list", "support/agent", "report", "data", "sendlog", "form", "mypage", "board"]
    }
    for name, html in snapshots.items():
        (raw_root / f"{name.replace('/', '--')}.html").write_text(html, encoding="utf-8")

    schedule_workbook_exported = False
    if args.include_schedule_workbook:
        try:
            client.download_schedule_workbook(admin_root / "schedules.xlsx")
            schedule_workbook_exported = True
        except Exception as error:
            append_jsonl(failures_path, {"phase": "export_admin_schedule_workbook", "error": str(error)})

    inspector_html = fetch_text("inspector")
    inspectors = parse_inspector_rows(inspector_html)
    inspector_details = []
    for inspector in inspectors:
        detail = parse_inspector_detail(fetch_text(f"inspector/{inspector['legacy_inspector_id']}"))
        inspector_details.append({**inspector, **detail})
    write_jsonl(admin_root / "inspectors.jsonl", inspector_details)

    support_list_rows: list[dict[str, object]] = []
    support_html = fetch_text("support/list")
    for page in range(1, parse_max_page(support_html) + 1):
        html = fetch_text(
            "support/list",
            params={"page": str(page), "su_us_id": "", "cc_name": "", "cs_name": "", "su_status": ""},
        )
        support_list_rows.extend(parse_support_list_rows(html))
    write_jsonl(admin_root / "support-list.jsonl", support_list_rows)

    support_agent_rows = parse_support_agent_rows(fetch_text("support/agent"))
    write_jsonl(admin_root / "support-agent-summary.jsonl", support_agent_rows)

    data_rows: list[dict[str, object]] = []
    data_html = fetch_text("data")
    for page in range(1, parse_max_page(data_html) + 1):
        data_rows.extend(parse_data_rows(fetch_text("data", params={"page": str(page)})))
    write_jsonl(admin_root / "data-management.jsonl", data_rows)

    sendlog_rows = parse_sendlog_rows(fetch_text("sendlog", params={"s_date": "2000-01-01", "e_date": "2100-12-31"}))
    write_jsonl(admin_root / "sendlog.jsonl", sendlog_rows)

    site_lookup: dict[tuple[str, str, str], dict[str, object]] = {}
    for site in (out_root / "sites.jsonl").read_text(encoding="utf-8").splitlines():
        if not site.strip():
            continue
        import json

        item = json.loads(site)
        site_lookup[(pick_first(item.get("headquarter_name")), pick_first(item.get("site_name")), pick_first(item.get("management_number")))] = item
        site_lookup[(pick_first(item.get("headquarter_name")), pick_first(item.get("site_name")), "")] = item

    report_counts = export_report_archive(
        client=client,
        failures_path=failures_path,
        metadata_path=admin_root / "reports" / "metadata.jsonl",
        pdf_dir=admin_root / "reports" / "pdf",
        site_lookup=site_lookup,
        include_pdfs=args.include_report_pdfs,
        max_reports=args.max_reports,
        workers=args.report_workers,
    )

    write_json(
        admin_root / "manifest.json",
        {
            "startedAt": started_at,
            "finishedAt": iso_now(),
            "counts": {
                "inspectors": len(inspector_details),
                "supportListRows": len(support_list_rows),
                "supportAgentRows": len(support_agent_rows),
                "dataRows": len(data_rows),
                "sendlogRows": len(sendlog_rows),
                **report_counts,
            },
            "paths": {
                "inspectors": "admin/inspectors.jsonl",
                "supportList": "admin/support-list.jsonl",
                "supportAgentSummary": "admin/support-agent-summary.jsonl",
                "schedulesWorkbook": "admin/schedules.xlsx" if schedule_workbook_exported else None,
                "dataManagement": "admin/data-management.jsonl",
                "sendlog": "admin/sendlog.jsonl",
                "reports": "admin/reports/metadata.jsonl",
                "reportPdfDir": "admin/reports/pdf",
                "rawPages": "admin/raw",
            },
        },
    )
    print(f"exported admin datasets -> {admin_root}")


if __name__ == "__main__":
    main()
