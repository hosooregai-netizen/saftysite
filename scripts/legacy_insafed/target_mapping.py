from __future__ import annotations

from typing import Any

from .common import merge_memo_tag, normalize_text, parse_date


LEGACY_HEADQUARTER_TAG = "legacy_insafed_headquarter_id:"
LEGACY_SITE_TAG = "legacy_insafed_site_id:"


def build_headquarter_tag(legacy_headquarter_id: str) -> str:
    return f"{LEGACY_HEADQUARTER_TAG}{legacy_headquarter_id}"


def build_site_tag(legacy_site_id: str) -> str:
    return f"{LEGACY_SITE_TAG}{legacy_site_id}"


def append_memo_entries(existing_memo: str, entries: list[str]) -> str:
    memo = existing_memo
    for entry in entries:
        text = normalize_text(entry)
        if text:
            memo = merge_memo_tag(memo, text)
    return memo


def resolve_per_visit_amount(record: dict[str, Any]) -> int | None:
    total_contract_amount = record.get("total_contract_amount")
    total_rounds = record.get("total_rounds")
    if not isinstance(total_contract_amount, (int, float)):
        return None
    if not isinstance(total_rounds, (int, float)):
        return None
    if total_contract_amount <= 0 or total_rounds <= 0:
        return None
    return int(round(total_contract_amount / total_rounds))


def build_headquarter_payload(record: dict[str, Any], existing_memo: str = "") -> dict[str, Any]:
    memo = append_memo_entries(
        existing_memo,
        [
            build_headquarter_tag(str(record.get("legacy_headquarter_id"))),
            f"legacy_insafed_representative_email:{normalize_text(record.get('representative_email'))}",
            f"legacy_insafed_detail_href:{normalize_text(record.get('detail_href'))}",
            f"legacy_insafed_sites_href:{normalize_text(record.get('sites_href'))}",
        ],
    )
    return {
        "name": normalize_text(record.get("name")),
        "business_registration_no": normalize_text(record.get("business_registration_no")) or None,
        "corporate_registration_no": normalize_text(record.get("corporate_registration_no")) or None,
        "license_no": normalize_text(record.get("license_no")) or None,
        "contact_name": normalize_text(record.get("representative_name")) or None,
        "contact_phone": normalize_text(record.get("representative_phone") or record.get("representative_mobile")) or None,
        "address": normalize_text(record.get("address")) or None,
        "is_active": True,
        "memo": memo,
    }


def build_site_payload(record: dict[str, Any], headquarter_id: str, existing_memo: str = "") -> dict[str, Any]:
    project_period = normalize_text(record.get("project_period"))
    start_date, end_date = "", ""
    if "~" in project_period:
        left, right = [part.strip() for part in project_period.split("~", 1)]
        start_date, end_date = left, right
    visit_history = record.get("visit_history") if isinstance(record.get("visit_history"), list) else []
    memo = append_memo_entries(
        existing_memo,
        [
            build_site_tag(str(record.get("legacy_site_id"))),
            f"legacy_insafed_detail_href:{normalize_text(record.get('detail_href'))}",
            f"legacy_insafed_management_number:{normalize_text(record.get('management_number'))}",
            f"legacy_insafed_opening_number:{normalize_text(record.get('opening_number'))}",
            f"legacy_insafed_amount_period:{normalize_text(record.get('amount_period'))}",
            f"legacy_insafed_progress_status:{normalize_text(record.get('progress_status'))}",
            f"legacy_insafed_start_round:{normalize_text(record.get('start_round'))}",
            f"legacy_insafed_visit_history_count:{len(visit_history)}",
        ],
    )
    return {
        "headquarter_id": headquarter_id,
        "site_name": normalize_text(record.get("site_name")),
        "site_code": normalize_text(record.get("opening_number")) or None,
        "management_number": normalize_text(record.get("management_number")) or None,
        "labor_office": normalize_text(record.get("labor_office")) or None,
        "guidance_officer_name": normalize_text(record.get("guidance_branch_name")) or None,
        "project_start_date": parse_date(start_date) or None,
        "project_end_date": parse_date(end_date) or None,
        "project_amount": record.get("project_amount"),
        "project_scale": normalize_text(record.get("project_scale")) or None,
        "project_kind": normalize_text(record.get("project_kind")) or None,
        "client_business_name": normalize_text(record.get("client_business_name")) or None,
        "manager_name": normalize_text(record.get("primary_manager_name")) or None,
        "inspector_name": normalize_text(record.get("assigned_worker_name")) or None,
        "contract_contact_name": normalize_text(record.get("primary_manager_name")) or None,
        "manager_phone": normalize_text(record.get("primary_manager_phone")) or None,
        "site_contact_email": normalize_text(record.get("primary_manager_email")) or None,
        "site_address": normalize_text(record.get("site_address")) or None,
        "contract_date": parse_date(start_date) or None,
        "contract_start_date": parse_date(start_date) or None,
        "contract_end_date": parse_date(end_date) or None,
        "contract_status": "active",
        "total_rounds": record.get("total_rounds"),
        "per_visit_amount": resolve_per_visit_amount(record),
        "total_contract_amount": record.get("total_contract_amount"),
        "memo": memo,
    }


def map_legacy_schedule_status(value: str) -> str:
    normalized = normalize_text(value)
    if normalized == "완료":
        return "completed"
    if normalized in {"취소", "종료"}:
        return "canceled"
    return "planned"
