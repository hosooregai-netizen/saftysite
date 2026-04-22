from __future__ import annotations
from typing import Any
from .common import normalize_text
from .import_new_erp import build_site_memo, split_site_memo
from .schedule_sync_helpers import parse_site_meta_envelope
from .target_mapping import map_legacy_schedule_status
def schedule_round_no(row: dict[str, Any]) -> int:
    return int(row.get("round_no") or row.get("roundNo") or 0)

def build_schedule_diff_rows(
    legacy_sites: list[dict[str, Any]],
    live_by_legacy_id: dict[str, dict[str, Any]],
    schedule_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    rows_by_site: dict[str, dict[int, dict[str, Any]]] = {}
    for row in schedule_rows:
        site_id = normalize_text(row.get("site_id"))
        round_no = schedule_round_no(row)
        if site_id and round_no > 0:
            rows_by_site.setdefault(site_id, {})[round_no] = row
    diff_rows: list[dict[str, Any]] = []
    for legacy_site in legacy_sites:
        legacy_site_id = normalize_text(legacy_site.get("legacy_site_id"))
        live_site = live_by_legacy_id.get(legacy_site_id)
        if not live_site:
            diff_rows.append({"kind": "missing_site", "legacy_site_id": legacy_site_id, "site_name": normalize_text(legacy_site.get("site_name"))})
            continue
        live_rows = rows_by_site.get(normalize_text(live_site.get("id")), {})
        expected_rounds = {int(visit.get("round_no") or 0): visit for visit in legacy_site.get("visit_history", []) if int(visit.get("round_no") or 0) > 0}
        for round_no, visit in expected_rounds.items():
            live_row = live_rows.get(round_no)
            if not live_row:
                diff_rows.append({"kind": "missing_round", "legacy_site_id": legacy_site_id, "round_no": round_no})
                continue
            expected_date = normalize_text(visit.get("visit_date"))
            live_date = normalize_text(live_row.get("planned_date"))
            if expected_date != live_date:
                diff_rows.append({"kind": "date_mismatch", "expected": expected_date, "legacy_site_id": legacy_site_id, "live": live_date, "round_no": round_no})
            expected_status = map_legacy_schedule_status(normalize_text(visit.get("status")))
            live_status = normalize_text(live_row.get("status"))
            if expected_status != live_status:
                diff_rows.append({"kind": "status_mismatch", "expected": expected_status, "legacy_site_id": legacy_site_id, "live": live_status, "round_no": round_no})
        for round_no, live_row in live_rows.items():
            if round_no in expected_rounds:
                continue
            if is_legacy_selected(live_row, legacy_site_id):
                diff_rows.append({"kind": "extra_legacy_selected_row", "legacy_site_id": legacy_site_id, "round_no": round_no})
    return diff_rows

def build_memo_diff_rows(live_sites: list[dict[str, Any]], schedule_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows_by_site: dict[str, dict[int, dict[str, Any]]] = {}
    for row in schedule_rows:
        site_id = normalize_text(row.get("site_id"))
        round_no = schedule_round_no(row)
        if site_id and round_no > 0:
            rows_by_site.setdefault(site_id, {})[round_no] = row
    diff_rows: list[dict[str, Any]] = []
    for site in live_sites:
        site_id = normalize_text(site.get("id"))
        upstream_rows = rows_by_site.get(site_id, {})
        memo_rows = {
            int(item.get("roundNo") or 0): item
            for item in parse_site_meta_envelope(site.get("memo")).get("schedules", [])
            if isinstance(item, dict) and int(item.get("roundNo") or 0) > 0
        }
        all_rounds = sorted(set(upstream_rows) | set(memo_rows))
        for round_no in all_rounds:
            upstream = upstream_rows.get(round_no)
            memo = memo_rows.get(round_no)
            if not upstream or not memo:
                diff_rows.append({"kind": "memo_missing_round", "round_no": round_no, "site_id": site_id, "site_name": normalize_text(site.get("site_name"))})
                continue
            if serialize_memo_row(memo) != serialize_schedule_row(upstream):
                diff_rows.append({"kind": "memo_mismatch", "round_no": round_no, "site_id": site_id, "site_name": normalize_text(site.get("site_name"))})
    return diff_rows

def sync_site_schedule_rows(
    client: Any,
    site: dict[str, Any],
    legacy_site: dict[str, Any],
    user_by_name: dict[str, tuple[str, str]],
    report_keys_by_round: dict[int, str] | None = None,
) -> dict[str, Any]:
    client.generate_site_schedules(normalize_text(site.get("id")))
    current_rows = client.fetch_site_schedules(normalize_text(site.get("id")))
    rows_by_round = {schedule_round_no(row): row for row in current_rows if schedule_round_no(row) > 0}
    visit_by_round = {int(visit.get("round_no") or 0): visit for visit in legacy_site.get("visit_history", []) if int(visit.get("round_no") or 0) > 0}
    max_round = max([int(legacy_site.get("total_rounds") or 0), *visit_by_round.keys(), *rows_by_round.keys()], default=0)
    default_assignee = resolve_assignee(site, user_by_name, normalize_text(legacy_site.get("assigned_worker_name")))
    audit_rows: list[dict[str, Any]] = []

    for round_no in range(1, max_round + 1):
        current_row = rows_by_round.get(round_no)
        if not current_row:
            audit_rows.append({"kind": "missing_round_after_generate", "legacy_site_id": normalize_text(legacy_site.get("legacy_site_id")), "round_no": round_no})
            continue
        visit = visit_by_round.get(round_no)
        if visit:
            assignee = resolve_assignee(site, user_by_name, normalize_text(visit.get("assigned_worker_name"))) or default_assignee
            report_key = (report_keys_by_round or {}).get(round_no, "")
            status = map_legacy_schedule_status(normalize_text(visit.get("status")))
            if status == "completed" and not report_key:
                status = "planned"
            payload = {
                "actual_visit_date": normalize_text(visit.get("visit_date")) if status == "completed" else "",
                "assignee_user_id": assignee[0],
                "linked_report_key": report_key,
                "planned_date": normalize_text(visit.get("visit_date")),
                "selection_reason_label": "Legacy InSEF import",
                "selection_reason_memo": f"legacy_site_id={normalize_text(legacy_site.get('legacy_site_id'))} round={round_no}",
                "status": status,
            }
        else:
            payload = {
                "actual_visit_date": "",
                "assignee_user_id": default_assignee[0],
                "linked_report_key": "",
                "planned_date": "",
                "selection_reason_label": "",
                "selection_reason_memo": "",
                "status": "planned",
            }
        update_schedule_with_fallback(client, normalize_text(current_row.get("id")), payload)
        audit_rows.append({"kind": "schedule_synced", "legacy_site_id": normalize_text(legacy_site.get("legacy_site_id")), "round_no": round_no})

    refreshed_rows = client.fetch_site_schedules(normalize_text(site.get("id")))
    sync_site_memo_with_rows(client, site, refreshed_rows)
    return {"audit_rows": audit_rows, "rows": refreshed_rows}

def resolve_assignee(site: dict[str, Any], user_by_name: dict[str, tuple[str, str]], preferred_name: str) -> tuple[str, str]:
    if preferred_name and preferred_name in user_by_name:
        return user_by_name[preferred_name]
    assigned_user = site.get("assigned_user") if isinstance(site.get("assigned_user"), dict) else {}
    return (
        normalize_text(assigned_user.get("id")),
        normalize_text(assigned_user.get("name")) or preferred_name,
    )

def update_schedule_with_fallback(client: Any, schedule_id: str, payload: dict[str, Any]) -> None:
    try:
        client.update_schedule(schedule_id, payload)
    except Exception:
        client.update_schedule(
            schedule_id,
            {key: payload[key] for key in ("assignee_user_id", "planned_date", "selection_reason_label", "selection_reason_memo", "status")},
        )

def sync_site_memo_with_rows(client: Any, site: dict[str, Any], rows: list[dict[str, Any]]) -> None:
    note, envelope = split_site_memo(site.get("memo"))
    next_envelope = {**envelope, "schedules": [serialize_schedule_row(row) for row in sorted(rows, key=schedule_round_no)]}
    memo = build_site_memo(note, next_envelope)
    if normalize_text(memo) == normalize_text(site.get("memo")):
        return
    updated = client.update_site(normalize_text(site.get("id")), {"memo": memo})
    site.update(updated)

def is_legacy_selected(row: dict[str, Any], legacy_site_id: str) -> bool:
    return normalize_text(row.get("selection_reason_label")) == "Legacy InSEF import" or f"legacy_site_id={legacy_site_id}" in normalize_text(row.get("selection_reason_memo"))

def serialize_memo_row(row: dict[str, Any]) -> dict[str, str | int]:
    return {
        "actualVisitDate": normalize_text(row.get("actualVisitDate")),
        "assigneeUserId": normalize_text(row.get("assigneeUserId")),
        "linkedReportKey": normalize_text(row.get("linkedReportKey")),
        "plannedDate": normalize_text(row.get("plannedDate")),
        "roundNo": int(row.get("roundNo") or 0),
        "selectionReasonLabel": normalize_text(row.get("selectionReasonLabel")),
        "selectionReasonMemo": normalize_text(row.get("selectionReasonMemo")),
        "status": normalize_text(row.get("status")),
        "windowEnd": normalize_text(row.get("windowEnd")),
        "windowStart": normalize_text(row.get("windowStart")),
    }

def serialize_schedule_row(row: dict[str, Any]) -> dict[str, str | int]:
    return {
        "actualVisitDate": normalize_text(row.get("actual_visit_date") or row.get("actualVisitDate")),
        "assigneeName": normalize_text(row.get("assignee_name") or row.get("assigneeName")),
        "assigneeUserId": normalize_text(row.get("assignee_user_id") or row.get("assigneeUserId")),
        "exceptionMemo": normalize_text(row.get("exception_memo") or row.get("exceptionMemo")),
        "exceptionReasonCode": normalize_text(row.get("exception_reason_code") or row.get("exceptionReasonCode")),
        "headquarterId": normalize_text(row.get("headquarter_id") or row.get("headquarterId")),
        "headquarterName": normalize_text(row.get("headquarter_name") or row.get("headquarterName")),
        "id": normalize_text(row.get("id")),
        "linkedReportKey": normalize_text(row.get("linked_report_key") or row.get("linkedReportKey")),
        "plannedDate": normalize_text(row.get("planned_date") or row.get("plannedDate")),
        "roundNo": schedule_round_no(row),
        "selectionConfirmedAt": normalize_text(row.get("selection_confirmed_at") or row.get("selectionConfirmedAt")),
        "selectionConfirmedByName": normalize_text(row.get("selection_confirmed_by_name") or row.get("selectionConfirmedByName")),
        "selectionConfirmedByUserId": normalize_text(row.get("selection_confirmed_by_user_id") or row.get("selectionConfirmedByUserId")),
        "selectionReasonLabel": normalize_text(row.get("selection_reason_label") or row.get("selectionReasonLabel")),
        "selectionReasonMemo": normalize_text(row.get("selection_reason_memo") or row.get("selectionReasonMemo")),
        "siteId": normalize_text(row.get("site_id") or row.get("siteId")),
        "siteName": normalize_text(row.get("site_name") or row.get("siteName")),
        "status": normalize_text(row.get("status")),
        "totalRounds": int(row.get("total_rounds") or row.get("totalRounds") or 0),
        "windowEnd": normalize_text(row.get("window_end") or row.get("windowEnd")),
        "windowStart": normalize_text(row.get("window_start") or row.get("windowStart")),
    }
