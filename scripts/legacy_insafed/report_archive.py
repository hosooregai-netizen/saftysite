from __future__ import annotations

import json
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

from .common import append_jsonl, pick_first, write_jsonl
from .export_parsers import parse_report_popup
from .legacy_client import LegacyInsafedClient


def export_report_archive(
    *,
    client: LegacyInsafedClient,
    failures_path: Path,
    metadata_path: Path,
    pdf_dir: Path,
    site_lookup: dict[tuple[str, str, str], dict[str, Any]],
    include_pdfs: bool,
    max_reports: int,
    workers: int,
) -> dict[str, int]:
    report_rows: list[dict[str, Any]] = []
    page = 1
    while True:
        payload = client.fetch_report_page(page).get("result", {})
        data = payload.get("data", [])
        if not data:
            break
        report_rows.extend(data)
        if max_reports and len(report_rows) >= max_reports:
            report_rows = report_rows[:max_reports]
            break
        if payload.get("current_page", 0) >= payload.get("last_page", 0):
            break
        page += 1

    thread_local = threading.local()

    def get_client() -> LegacyInsafedClient:
        current = getattr(thread_local, "client", None)
        if current is None:
            current = LegacyInsafedClient(client.base_url.rstrip("/"), client.username, client.password)
            current.login()
            thread_local.client = current
        return current

    def retry(operation, *args, retries: int = 3):
        last_error: Exception | None = None
        for attempt in range(retries):
            try:
                return operation(*args)
            except Exception as error:
                last_error = error
                if attempt == retries - 1:
                    raise
                time.sleep(attempt + 1)
        raise last_error or RuntimeError("retry failed")

    def build_record(row: dict[str, Any]) -> dict[str, Any]:
        report_id = str(row["su_id"])
        session_client = get_client()
        popup = parse_report_popup(retry(session_client.fetch_report_popup, report_id))
        matched_site = site_lookup.get(
            (
                pick_first(popup.get("headquarter_name")),
                pick_first(popup.get("site_name")),
                pick_first(popup.get("management_number")),
            )
        ) or site_lookup.get(
            (pick_first(popup.get("headquarter_name")), pick_first(popup.get("site_name")), "")
        )
        pdf_name = None
        archive_status = "metadata_only" if row.get("su_status") == "예약" or not include_pdfs else "pdf_archived"
        pdf_path = pdf_dir / f"{report_id}.pdf"
        if include_pdfs and archive_status == "pdf_archived":
            try:
                if not pdf_path.exists() or pdf_path.stat().st_size == 0:
                    pdf_name = retry(session_client.download_report_pdf, report_id, pdf_path)
                else:
                    pdf_name = pdf_path.name
                if not pdf_name:
                    archive_status = "metadata_only"
            except Exception as error:
                archive_status = "metadata_only"
                append_jsonl(
                    failures_path,
                    {"phase": "export_report_pdf", "legacy_report_id": report_id, "error": str(error)},
                )
        return {
            "legacy_report_id": report_id,
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

    reports: list[dict[str, Any]] = []
    pdf_dir.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        futures = {pool.submit(build_record, row): row for row in report_rows}
        for future in as_completed(futures):
            row = futures[future]
            try:
                reports.append(future.result())
            except Exception as error:
                append_jsonl(
                    failures_path,
                    {"phase": "export_report", "legacy_report_id": row.get("su_id"), "error": str(error)},
                )
    reports.sort(key=lambda item: int(item["legacy_report_id"]))
    write_jsonl(metadata_path, reports)
    return {
        "reports": len(reports),
        "pdfReports": sum(1 for item in reports if item.get("pdf_filename")),
    }
