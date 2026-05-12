from __future__ import annotations

from collections import Counter
from datetime import datetime
from typing import Any

from .common import normalize_text
from .legacy_site_identity import extract_legacy_site_id_from_memo


def iter_months(start_date: str, end_date: str) -> list[str]:
    current = datetime.strptime(start_date, "%Y-%m-%d").replace(day=1)
    end = datetime.strptime(end_date, "%Y-%m-%d")
    months: list[str] = []
    while current < end:
        months.append(current.strftime("%Y-%m"))
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)
    return months


def fetch_legacy_calendar_events(client: Any, start_date: str, end_date: str) -> list[dict[str, str]]:
    payload = client.get_json(
        "support/calendarData",
        {"start": start_date, "end": end_date, "company_id": "208", "su_us_id": ""},
    )
    rows = payload if isinstance(payload, list) else payload.get("data", payload)
    events: list[dict[str, str]] = []
    for row in rows:
        description = row.get("description") if isinstance(row.get("description"), dict) else {}
        planned_date = normalize_text(row.get("start") or row.get("date"))
        legacy_site_id = normalize_text(description.get("su_cs_id"))
        site_name = normalize_text(description.get("cs_name"))
        if not planned_date or not site_name:
            continue
        events.append(
            {
                "company_name": normalize_text(description.get("cc_name")),
                "legacy_site_id": legacy_site_id,
                "planned_date": planned_date,
                "site_name": site_name,
            }
        )
    return events


def fetch_live_calendar_events(client: Any, live_sites: list[dict[str, Any]], start_date: str, end_date: str) -> list[dict[str, str]]:
    legacy_id_by_site_id = {
        normalize_text(site.get("id")): extract_legacy_site_id_from_memo(site.get("memo"))
        for site in live_sites
        if normalize_text(site.get("id"))
    }
    events: list[dict[str, str]] = []
    for month in iter_months(start_date, end_date):
        payload = client._request("GET", "/api/admin/schedules/calendar", params={"month": month}).json()
        rows = payload if isinstance(payload, list) else payload.get("rows", payload.get("items", payload))
        for row in rows:
            planned_date = normalize_text(row.get("planned_date") or row.get("plannedDate") or row.get("date") or row.get("day"))
            if not planned_date or planned_date < start_date or planned_date >= end_date:
                continue
            site_id = normalize_text(row.get("site_id") or row.get("siteId"))
            site_name = normalize_text(row.get("site_name") or row.get("siteName") or row.get("title"))
            if not site_name:
                continue
            events.append(
                {
                    "legacy_site_id": legacy_id_by_site_id.get(site_id, ""),
                    "planned_date": planned_date,
                    "site_id": site_id,
                    "site_name": site_name,
                }
            )
    return events


def diff_calendar_events(
    legacy_events: list[dict[str, str]],
    live_events: list[dict[str, str]],
) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    legacy_company_by_key = {
        (row["planned_date"], row["legacy_site_id"], row["site_name"]): row["company_name"]
        for row in legacy_events
    }
    legacy_counter = Counter((row["planned_date"], row["legacy_site_id"], row["site_name"]) for row in legacy_events)
    live_counter = Counter((row["planned_date"], row["legacy_site_id"], row["site_name"]) for row in live_events)
    missing = [
        {
            "planned_date": planned_date,
            "legacy_site_id": legacy_site_id,
            "site_name": site_name,
            "company_name": legacy_company_by_key.get((planned_date, legacy_site_id, site_name), ""),
        }
        for planned_date, legacy_site_id, site_name in (legacy_counter - live_counter).elements()
    ]
    extra = [
        {
            "planned_date": planned_date,
            "legacy_site_id": legacy_site_id,
            "site_name": site_name,
        }
        for planned_date, legacy_site_id, site_name in (live_counter - legacy_counter).elements()
    ]
    return missing, extra
