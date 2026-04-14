from __future__ import annotations

import json
import re
from typing import Any

from bs4 import BeautifulSoup

from .common import extract_query_value, normalize_text, parse_int


def parse_max_page(html: str) -> int:
    pages = [
        parse_int(link.get("href", "").split("page=")[-1].split("&")[0])
        for link in BeautifulSoup(html, "html.parser").select('a[href*="page="]')
    ]
    return max([page for page in pages if page], default=1)


def parse_inspector_rows(html: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for row in BeautifulSoup(html, "html.parser").select("table tbody tr"):
        cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in row.select("td")]
        detail_link = row.select_one('a[href*="/inspector/"]')
        if len(cells) < 8 or detail_link is None:
            continue
        detail_href = detail_link.get("href", "")
        rows.append(
            {
                "legacy_inspector_id": detail_href.rstrip("/").split("/")[-1],
                "name": cells[1],
                "username": cells[2],
                "branch_name": cells[3],
                "phone": cells[4],
                "email": cells[5],
                "assigned_site_count": parse_int(cells[6]),
                "account_status": cells[7],
                "detail_href": detail_href,
            }
        )
    return rows


def parse_inspector_detail(html: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    profile_table = soup.select("table")[1]
    assigned_table = soup.select("table")[2]
    pairs: dict[str, str] = {}
    for row in profile_table.select("tr"):
        cells = row.select("th,td")
        for index in range(0, len(cells) - 1, 2):
            label = normalize_text(cells[index].get_text(" ", strip=True))
            value = normalize_text(cells[index + 1].get_text(" ", strip=True))
            if label and value:
                pairs[label] = value
    assigned_sites: list[dict[str, Any]] = []
    for row in assigned_table.select("tbody tr"):
        cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in row.select("td")]
        site_link = row.select_one('a[href*="/cons?id="]')
        headquarter_link = row.select_one('a[href*="/conscompany/"]')
        if len(cells) < 7:
            continue
        assigned_sites.append(
            {
                "sequence": parse_int(cells[0]),
                "headquarter_name": cells[1],
                "site_name": cells[2],
                "guidance_count": parse_int(cells[3]),
                "round_progress": cells[4],
                "status": cells[5],
                "legacy_headquarter_id": headquarter_link.get("href", "").rstrip("/").split("/")[-1]
                if headquarter_link
                else "",
                "legacy_site_id": extract_query_value(site_link.get("href", ""), "id") if site_link else "",
            }
        )
    return {
        "name": pairs.get("이름", ""),
        "phone": pairs.get("전화번호", ""),
        "username": pairs.get("아이디", ""),
        "email": pairs.get("이메일", ""),
        "account_status": pairs.get("계정 상태", ""),
        "assigned_sites": assigned_sites,
    }


def parse_support_list_rows(html: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    table = BeautifulSoup(html, "html.parser").select("table")[-1]
    for row in table.select("tr")[1:]:
        cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in row.select("td")]
        links = [link.get("href", "") for link in row.select('a[href]')]
        if len(cells) < 11:
            continue
        rows.append(
            {
                "sequence": parse_int(cells[0]),
                "visit_date": cells[1],
                "site_name": cells[2],
                "headquarter_name": cells[3],
                "round_no": parse_int(cells[4]),
                "manager_name": cells[5],
                "manager_phone": cells[6],
                "assigned_worker_name": cells[7],
                "status": cells[8],
                "review_status": cells[9],
                "result_report_url": links[0] if len(links) > 0 else "",
                "notice_report_url": links[2] if len(links) > 2 else "",
            }
        )
    return rows


def parse_support_agent_rows(html: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    table = BeautifulSoup(html, "html.parser").select("table")[-1]
    for row in table.select("tr")[1:]:
        cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in row.select("td")]
        if len(cells) < 7:
            continue
        name, _, joined_at = cells[0].partition("(")
        rows.append(
            {
                "name": normalize_text(name),
                "joined_at": normalize_text(joined_at.rstrip(")")),
                "phone": cells[1],
                "reserved_count": parse_int(cells[2]) or 0,
                "in_progress_count": parse_int(cells[3]) or 0,
                "completed_count": parse_int(cells[4]) or 0,
                "last_visit_date": cells[5],
                "paid_start_date": cells[6],
            }
        )
    return rows


def parse_data_rows(html: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    table = BeautifulSoup(html, "html.parser").select("table")[3]
    for row in table.select("tr")[1:]:
        cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in row.select("td")]
        edit_button = row.select_one('button[onclick*="modalOpen("]')
        if len(cells) < 10 or edit_button is None:
            continue
        matched = re.search(r"modalOpen\((\{.*\})\);", edit_button.get("onclick", ""))
        payload = json.loads(matched.group(1)) if matched else {}
        rows.append(
            {
                "legacy_data_id": payload.get("id") or payload.get("ar_id"),
                "division": payload.get("division"),
                "division_label": cells[1],
                "rule": normalize_text(payload.get("ar_rule")),
                "element": normalize_text(payload.get("ar_element")),
                "factor": normalize_text(payload.get("ar_factor")),
                "element_factor": normalize_text(payload.get("ar_element_factor")),
                "hazardous_type": normalize_text(payload.get("ar_hazardous_type")),
                "measures": normalize_text(payload.get("ar_measures")),
                "measures_detail": normalize_text(str(payload.get("ar_measures_detail", "")).replace(";", "\n")),
                "updated_at": normalize_text(payload.get("ar_updated_at")),
                "created_at": normalize_text(payload.get("ar_created_at")),
                "owner_user_id": payload.get("us_id"),
                "source_page_sequence": parse_int(cells[0]),
            }
        )
    return rows


def parse_sendlog_rows(html: str) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    table = BeautifulSoup(html, "html.parser").select("table")[-1]
    for row in table.select("tr")[1:]:
        cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in row.select("td")]
        if len(cells) < 9:
            continue
        rows.append(
            {
                "sequence": parse_int(cells[0]),
                "channel": cells[1],
                "recipient_name": cells[2],
                "headquarter_name": cells[3],
                "site_name": cells[4],
                "recipient_address": cells[5],
                "result": cells[6],
                "sent_at": cells[7],
                "read_status": cells[8],
            }
        )
    return rows
