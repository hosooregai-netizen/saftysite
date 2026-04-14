#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import append_jsonl, iso_now, normalize_text, read_json, read_jsonl, slugify, write_json, write_jsonl
    from scripts.legacy_insafed.target_client import TargetErpClient, TargetErpError
    from scripts.legacy_insafed.target_mapping import (
        LEGACY_HEADQUARTER_TAG,
        LEGACY_SITE_TAG,
        build_headquarter_payload,
        build_site_payload,
        map_legacy_schedule_status,
    )
else:
    from .common import append_jsonl, iso_now, normalize_text, read_json, read_jsonl, slugify, write_json, write_jsonl
    from .target_client import TargetErpClient, TargetErpError
    from .target_mapping import (
        LEGACY_HEADQUARTER_TAG,
        LEGACY_SITE_TAG,
        build_headquarter_payload,
        build_site_payload,
        map_legacy_schedule_status,
    )


SITE_META_MARKER = "[SAFETY_SITE_META]"


def find_by_memo(rows: list[dict[str, object]], tag_prefix: str, legacy_id: str) -> dict[str, object] | None:
    tag = f"{tag_prefix}{legacy_id}"
    return next((row for row in rows if tag in normalize_text(row.get("memo"))), None)


def normalize_identifier(value: object) -> str:
    return re.sub(r"[^0-9A-Za-z가-힣]+", "", normalize_text(value)).lower()


def normalize_site_code_value(value: object) -> str:
    normalized = normalize_text(value)
    if not normalized:
        return ""
    digits_only = re.sub(r"[^0-9]", "", normalized)
    if digits_only and set(digits_only) == {"0"}:
        return ""
    return normalized


def find_headquarter_match(rows: list[dict[str, object]], record: dict[str, object]) -> dict[str, object] | None:
    matched = find_by_memo(rows, LEGACY_HEADQUARTER_TAG, str(record["legacy_headquarter_id"]))
    if matched:
        return matched
    business_no = normalize_identifier(record.get("business_registration_no"))
    if business_no:
        matched = next((row for row in rows if normalize_identifier(row.get("business_registration_no")) == business_no), None)
        if matched:
            return matched
    name = normalize_text(record.get("name"))
    return next((row for row in rows if normalize_text(row.get("name")) == name), None)


def find_site_match(rows: list[dict[str, object]], record: dict[str, object], headquarter_id: str) -> dict[str, object] | None:
    matched = find_by_memo(rows, LEGACY_SITE_TAG, str(record["legacy_site_id"]))
    if matched:
        return matched
    management_number = normalize_identifier(record.get("management_number"))
    site_code = normalize_identifier(normalize_site_code_value(record.get("opening_number")))
    for row in rows:
        if str(row.get("headquarter_id")) != headquarter_id:
            continue
        if management_number and normalize_identifier(row.get("management_number")) == management_number:
            return row
        if site_code and normalize_identifier(row.get("site_code")) == site_code:
            return row
    site_name = normalize_text(record.get("site_name"))
    return next((row for row in rows if str(row.get("headquarter_id")) == headquarter_id and normalize_text(row.get("site_name")) == site_name), None)


def placeholder_email(worker_name: str, legacy_site_id: str) -> str:
    return f"legacy-field-agent-{slugify(worker_name)}-{slugify(legacy_site_id)}@placeholder.example.com"


def placeholder_email_for_inspector(inspector: dict[str, object]) -> str:
    legacy_id = normalize_text(inspector.get("legacy_inspector_id")) or slugify(inspector.get("name"))
    return f"legacy-field-agent-{slugify(legacy_id)}@placeholder.example.com"


def has_meaningful_value(value: object) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(normalize_text(value))
    return True


def merge_update_payload(
    existing: dict[str, object] | None,
    proposed: dict[str, object],
    update_missing_only: bool,
) -> dict[str, object]:
    if not existing:
        return proposed
    if not update_missing_only:
        return proposed
    merged: dict[str, object] = {}
    for key, value in proposed.items():
        if key == "memo":
            merged[key] = value
            continue
        existing_value = existing.get(key)
        if has_meaningful_value(existing_value):
            merged[key] = existing_value
            continue
        merged[key] = value
    return merged


def payload_differs(existing: dict[str, object], payload: dict[str, object]) -> bool:
    for key, value in payload.items():
        if key == "memo":
            if normalize_text(existing.get(key)) != normalize_text(value):
                return True
            continue
        existing_value = existing.get(key)
        if isinstance(value, str) or isinstance(existing_value, str):
            if normalize_text(existing_value) != normalize_text(value):
                return True
            continue
        if existing_value != value:
            return True
    return False


def resolve_conflicting_site_payload(payload: dict[str, object], error: Exception) -> dict[str, object] | None:
    message = normalize_text(error)
    if "409" not in message:
        return None
    retried = dict(payload)
    changed = False
    if "site_code" in message and retried.get("site_code") is not None:
        retried["site_code"] = None
        changed = True
    if "management_number" in message and retried.get("management_number") is not None:
        retried["management_number"] = None
        changed = True
    return retried if changed else None


def is_placeholder_user(user: dict[str, object]) -> bool:
    email = normalize_text(user.get("email")).lower()
    return email.endswith("@placeholder.example.com")


def normalize_account_active(value: object) -> bool:
    normalized = normalize_text(value)
    if not normalized:
        return True
    return "승인" in normalized or "재직" in normalized or normalized in {"사용", "활성", "active"}


def build_inspector_user_payload(inspector: dict[str, object], fallback_email: str | None = None) -> dict[str, object]:
    email = normalize_text(inspector.get("email")) or normalize_text(inspector.get("username")) or normalize_text(fallback_email)
    return {
        "name": normalize_text(inspector.get("name")),
        "email": email or None,
        "phone": normalize_text(inspector.get("phone")) or None,
        "role": "field_agent",
        "position": "Legacy InSEF field agent",
        "organization_name": normalize_text(inspector.get("branch_name")) or None,
        "is_active": normalize_account_active(inspector.get("account_status")),
        "auto_provisioned_from_excel": True,
    }


def merge_user_update_payload(existing: dict[str, object], proposed: dict[str, object]) -> dict[str, object]:
    payload: dict[str, object] = {
        "name": proposed.get("name") or existing.get("name"),
        "role": existing.get("role") or proposed.get("role") or "field_agent",
        "auto_provisioned_from_excel": True,
    }
    if is_placeholder_user(existing) and normalize_text(proposed.get("email")):
        payload["email"] = proposed.get("email")
    elif not has_meaningful_value(existing.get("email")) and normalize_text(proposed.get("email")):
        payload["email"] = proposed.get("email")
    if not has_meaningful_value(existing.get("phone")) and normalize_text(proposed.get("phone")):
        payload["phone"] = proposed.get("phone")
    elif is_placeholder_user(existing) and normalize_text(proposed.get("phone")):
        payload["phone"] = proposed.get("phone")
    if not has_meaningful_value(existing.get("organization_name")) and normalize_text(proposed.get("organization_name")):
        payload["organization_name"] = proposed.get("organization_name")
    elif is_placeholder_user(existing) and normalize_text(proposed.get("organization_name")):
        payload["organization_name"] = proposed.get("organization_name")
    if not has_meaningful_value(existing.get("position")) and normalize_text(proposed.get("position")):
        payload["position"] = proposed.get("position")
    payload["is_active"] = bool(proposed.get("is_active", existing.get("is_active", True)))
    return payload


def find_user_match(
    users: list[dict[str, object]],
    *,
    name: object,
    email: object = "",
    phone: object = "",
) -> dict[str, object] | None:
    normalized_name = normalize_text(name)
    normalized_email = normalize_text(email).lower()
    normalized_phone = normalize_identifier(phone)
    if normalized_email:
        matched = next((user for user in users if normalize_text(user.get("email")).lower() == normalized_email), None)
        if matched:
            return matched
    if normalized_phone:
        phone_matches = [user for user in users if normalize_identifier(user.get("phone")) == normalized_phone]
        if len(phone_matches) == 1:
            return phone_matches[0]
    if normalized_name:
        exact_name = [user for user in users if normalize_text(user.get("name")) == normalized_name]
        if len(exact_name) == 1:
            return exact_name[0]
        placeholder_matches = [user for user in exact_name if is_placeholder_user(user)]
        if len(placeholder_matches) == 1:
            return placeholder_matches[0]
    return None


def ensure_active_assignment(
    client: TargetErpClient,
    assignments: list[dict[str, object]],
    *,
    site_id: str,
    user_id: str,
    memo: str,
) -> str:
    existing_assignment = next(
        (
            item
            for item in assignments
            if str(item.get("site_id")) == str(site_id) and str(item.get("user_id")) == str(user_id)
        ),
        None,
    )
    if existing_assignment and not existing_assignment.get("is_active", True):
        client.update_assignment(
            str(existing_assignment["id"]),
            {
                "is_active": True,
                "role_on_site": existing_assignment.get("role_on_site") or "Legacy imported field agent",
            },
        )
        existing_assignment["is_active"] = True
        return "reactivated"
    if existing_assignment:
        return "existing"
    try:
        assignments.append(
            client.create_assignment(
                {
                    "site_id": site_id,
                    "user_id": user_id,
                    "role_on_site": "Legacy imported field agent",
                    "memo": memo,
                }
            )
        )
        return "created"
    except TargetErpError as error:
        if "활성 배정 정보가 존재" not in str(error):
            raise
        refreshed_assignments = client.fetch_assignments()
        assignments[:] = refreshed_assignments
        return "existing"


def upsert_inspector_user(client: TargetErpClient, users: list[dict[str, object]], inspector: dict[str, object]) -> dict[str, object]:
    proposed = build_inspector_user_payload(inspector, placeholder_email_for_inspector(inspector))
    existing = find_user_match(
        users,
        name=inspector.get("name"),
        email=proposed.get("email"),
        phone=proposed.get("phone"),
    )
    if existing:
        payload = merge_user_update_payload(existing, proposed)
        if not payload_differs(existing, payload):
            return existing
        updated = client.update_user(str(existing["id"]), payload)
        users[:] = [updated if str(user.get("id")) == str(updated["id"]) else user for user in users]
        return updated
    create_payload = {
        **proposed,
        "email": proposed.get("email") or placeholder_email_for_inspector(inspector),
        "password": f"LegacyImport!{slugify(inspector.get('legacy_inspector_id') or inspector.get('name'))}",
    }
    created = client.create_user(create_payload)
    users.append(created)
    return created


def upsert_worker(client: TargetErpClient, users: list[dict[str, object]], worker_name: str, legacy_site_id: str, org_name: str) -> dict[str, object]:
    normalized_name = normalize_text(worker_name)
    matched = find_user_match(users, name=normalized_name)
    if matched:
        if is_placeholder_user(matched) and normalize_text(org_name):
            updated = client.update_user(
                str(matched["id"]),
                {
                    "name": matched.get("name") or worker_name,
                    "organization_name": normalize_text(org_name),
                    "position": matched.get("position") or "Legacy InSEF field agent",
                    "role": matched.get("role") or "field_agent",
                    "auto_provisioned_from_excel": True,
                },
            )
            users[:] = [updated if str(user.get("id")) == str(updated["id"]) else user for user in users]
            return updated
        return matched
    email = placeholder_email(worker_name, legacy_site_id)
    existing = next((user for user in users if normalize_text(user.get("email")) == email), None)
    if existing:
        return existing
    user = client.create_user(
        {
            "name": worker_name,
            "email": email,
            "password": f"LegacyImport!{slugify(legacy_site_id)}",
            "role": "field_agent",
            "position": "Legacy InSEF field agent",
            "organization_name": org_name or None,
            "is_active": True,
            "auto_provisioned_from_excel": True,
        }
    )
    users.append(user)
    return user


def parse_date_value(value: object) -> datetime | None:
    normalized = normalize_text(value)
    if not normalized:
        return None
    try:
        return datetime.strptime(normalized, "%Y-%m-%d")
    except ValueError:
        return None


def format_date_value(value: datetime | None) -> str:
    return value.strftime("%Y-%m-%d") if value else ""


def split_site_memo(memo: object) -> tuple[str, dict[str, object]]:
    normalized = normalize_text(memo)
    if SITE_META_MARKER not in normalized:
        return normalized, {}
    marker_index = normalized.rfind(SITE_META_MARKER)
    note = normalized[:marker_index].strip()
    json_text = normalized[marker_index + len(SITE_META_MARKER) :].strip()
    if not json_text:
        return note, {}
    try:
        parsed = json.loads(json_text)
    except Exception:
        return note, {}
    return note, parsed if isinstance(parsed, dict) else {}


def build_site_memo(note: str, envelope: dict[str, object]) -> str | None:
    normalized_note = normalize_text(note)
    compact_envelope = {
        key: value for key, value in envelope.items() if value not in (None, "", [], {})
    }
    if not normalized_note and not compact_envelope:
        return None
    meta = f"{SITE_META_MARKER}{json.dumps(compact_envelope, ensure_ascii=False, separators=(',', ':'))}"
    return f"{normalized_note}\n\n{meta}" if normalized_note else meta


def build_schedule_from_visit(
    site: dict[str, object],
    visit: dict[str, object],
    assignee_user_id: str,
    assignee_name: str,
) -> dict[str, object] | None:
    round_no = int(visit.get("round_no") or 0)
    visit_date = normalize_text(visit.get("visit_date"))
    if round_no <= 0:
        return None
    contract_date = parse_date_value(site.get("contract_date")) or parse_date_value(site.get("project_start_date"))
    if contract_date:
        window_start = contract_date + timedelta(days=(round_no - 1) * 15)
        window_end = window_start + timedelta(days=14)
    else:
        visit_day = parse_date_value(visit_date)
        window_start = visit_day
        window_end = visit_day
    headquarter_detail = site.get("headquarter_detail") if isinstance(site.get("headquarter_detail"), dict) else {}
    headquarter = site.get("headquarter") if isinstance(site.get("headquarter"), dict) else {}
    return {
        "id": f"schedule:{site.get('id')}:{round_no}",
        "siteId": str(site.get("id") or ""),
        "roundNo": round_no,
        "plannedDate": visit_date,
        "windowStart": format_date_value(window_start),
        "windowEnd": format_date_value(window_end),
        "assigneeUserId": assignee_user_id,
        "assigneeName": assignee_name,
        "status": map_legacy_schedule_status(normalize_text(visit.get("status"))),
        "exceptionReasonCode": "",
        "exceptionMemo": "",
        "selectionConfirmedAt": "",
        "selectionConfirmedByName": "",
        "selectionConfirmedByUserId": "",
        "selectionReasonLabel": "Legacy InSEF import",
        "selectionReasonMemo": f"legacy_site_id={site.get('legacy_site_id')} round={round_no}",
        "linkedReportKey": "",
        "siteName": normalize_text(site.get("site_name")),
        "headquarterId": normalize_text(site.get("headquarter_id")),
        "headquarterName": normalize_text(headquarter_detail.get("name")) or normalize_text(headquarter.get("name")),
        "isConflicted": False,
        "isOutOfWindow": False,
        "isOverdue": False,
    }


def build_default_schedule(
    site: dict[str, object],
    round_no: int,
    assignee_user_id: str,
    assignee_name: str,
) -> dict[str, object] | None:
    if round_no <= 0:
        return None
    contract_date = parse_date_value(site.get("contract_date")) or parse_date_value(site.get("project_start_date"))
    if not contract_date:
        return None
    window_start = contract_date + timedelta(days=(round_no - 1) * 15)
    window_end = window_start + timedelta(days=14)
    headquarter_detail = site.get("headquarter_detail") if isinstance(site.get("headquarter_detail"), dict) else {}
    headquarter = site.get("headquarter") if isinstance(site.get("headquarter"), dict) else {}
    return {
        "id": f"schedule:{site.get('id')}:{round_no}",
        "siteId": str(site.get("id") or ""),
        "roundNo": round_no,
        "plannedDate": "",
        "windowStart": format_date_value(window_start),
        "windowEnd": format_date_value(window_end),
        "assigneeUserId": assignee_user_id,
        "assigneeName": assignee_name,
        "status": "planned",
        "exceptionReasonCode": "",
        "exceptionMemo": "",
        "selectionConfirmedAt": "",
        "selectionConfirmedByName": "",
        "selectionConfirmedByUserId": "",
        "selectionReasonLabel": "",
        "selectionReasonMemo": "",
        "linkedReportKey": "",
        "siteName": normalize_text(site.get("site_name")),
        "headquarterId": normalize_text(site.get("headquarter_id")),
        "headquarterName": normalize_text(headquarter_detail.get("name")) or normalize_text(headquarter.get("name")),
        "isConflicted": False,
        "isOutOfWindow": False,
        "isOverdue": False,
    }


def patch_site_schedules_via_memo(
    client: TargetErpClient,
    site: dict[str, object],
    visits: list[dict[str, object]],
    assignee_lookup: dict[str, tuple[str, str]],
    total_rounds: int,
    default_assignee_user_id: str,
    default_assignee_name: str,
) -> dict[str, object]:
    note, envelope = split_site_memo(site.get("memo"))
    existing_by_round: dict[int, dict[str, object]] = {}
    current_schedules = envelope.get("schedules")
    if isinstance(current_schedules, list):
        for item in current_schedules:
            if not isinstance(item, dict):
                continue
            round_no = int(item.get("roundNo") or 0)
            if round_no > 0:
                existing_by_round[round_no] = item
    for round_no in range(1, max(total_rounds, 0) + 1):
        next_schedule = build_default_schedule(
            site,
            round_no,
            default_assignee_user_id,
            default_assignee_name,
        )
        if not next_schedule:
            continue
        existing_by_round[round_no] = {**next_schedule, **existing_by_round.get(round_no, {})}
    for visit in visits:
        worker_name = normalize_text(visit.get("assigned_worker_name"))
        assignee_user_id, assignee_name = assignee_lookup.get(
            worker_name,
            (default_assignee_user_id, worker_name or default_assignee_name),
        )
        next_schedule = build_schedule_from_visit(site, visit, assignee_user_id, assignee_name)
        if not next_schedule:
            continue
        round_no = int(next_schedule["roundNo"])
        existing_by_round[round_no] = {**existing_by_round.get(round_no, {}), **next_schedule}
    envelope["schedules"] = [existing_by_round[key] for key in sorted(existing_by_round)]
    updated = client.update_site(str(site["id"]), {"memo": build_site_memo(note, envelope)})
    site.update(updated)
    return updated


def main() -> None:
    parser = argparse.ArgumentParser(description="Import legacy InSEF export into the new ERP.")
    parser.add_argument("--export-root", required=True)
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-token", required=True)
    parser.add_argument(
        "--headquarters-sites-only",
        action="store_true",
        help="Only import headquarters and sites. Skip users, assignments, schedules, and report reconciliation.",
    )
    parser.add_argument(
        "--update-missing-only",
        action="store_true",
        help="When a matching headquarter/site already exists, only fill blank target fields instead of overwriting populated values.",
    )
    args = parser.parse_args()
    export_root = Path(args.export_root)
    failures_path = export_root / "failures.jsonl"
    manifest_path = export_root / "migration-manifest.json"
    client = TargetErpClient(args.target_base_url, args.target_token)
    legacy_headquarters = read_jsonl(export_root / "headquarters.jsonl")
    legacy_sites = read_jsonl(export_root / "sites.jsonl")
    opening_number_counts: dict[str, int] = {}
    for legacy_site in legacy_sites:
        normalized_opening_number = normalize_site_code_value(legacy_site.get("opening_number"))
        if not normalized_opening_number:
            continue
        opening_number_counts[normalized_opening_number] = opening_number_counts.get(normalized_opening_number, 0) + 1
    legacy_inspectors = read_jsonl(export_root / "admin" / "inspectors.jsonl")
    report_metadata = read_jsonl(export_root / "reports" / "metadata.jsonl")
    headquarters = client.fetch_headquarters()
    sites = client.fetch_sites()
    users = client.fetch_users() if not args.headquarters_sites_only else []
    assignments = client.fetch_assignments() if not args.headquarters_sites_only else []
    headquarter_map: dict[str, str] = {}
    site_map: dict[str, str] = {}
    summary = {
        "created_headquarters": 0,
        "updated_headquarters": 0,
        "created_sites": 0,
        "updated_sites": 0,
        "created_users": 0,
        "updated_users": 0,
        "created_assignments": 0,
        "reactivated_assignments": 0,
        "updated_schedules": 0,
        "skipped_worker_links": 0,
        "skipped_schedules": 0,
        "reports_reconciled": 0,
    }
    inspector_users_by_name: dict[str, dict[str, object]] = {}
    for index, record in enumerate(legacy_headquarters, start=1):
        existing = find_headquarter_match(headquarters, record)
        payload = merge_update_payload(
            existing,
            build_headquarter_payload(record, normalize_text(existing.get("memo") if existing else "")),
            args.update_missing_only,
        )
        try:
            if existing and not payload_differs(existing, payload):
                headquarter = existing
            else:
                headquarter = client.update_headquarter(existing["id"], payload) if existing else client.create_headquarter(payload)
        except TargetErpError as error:
            if existing or "409" not in str(error):
                raise
            headquarters = client.fetch_headquarters()
            existing = find_headquarter_match(headquarters, record)
            if not existing:
                append_jsonl(
                    failures_path,
                    {
                        "phase": "import_headquarter_conflict",
                        "legacy_headquarter_id": record.get("legacy_headquarter_id"),
                        "name": record.get("name"),
                        "business_registration_no": record.get("business_registration_no"),
                        "error": str(error),
                    },
                )
                continue
            payload = merge_update_payload(
                existing,
                build_headquarter_payload(record, normalize_text(existing.get("memo") if existing else "")),
                args.update_missing_only,
            )
            headquarter = client.update_headquarter(existing["id"], payload)
        if not existing:
            headquarters.append(headquarter)
            summary["created_headquarters"] += 1
        else:
            summary["updated_headquarters"] += 1
        headquarter_map[str(record["legacy_headquarter_id"])] = str(headquarter["id"])
        if index % 100 == 0 or index == len(legacy_headquarters):
            print(
                f"[headquarters] {index}/{len(legacy_headquarters)} "
                f"(created {summary['created_headquarters']}, updated {summary['updated_headquarters']})",
                flush=True,
            )
    if not args.headquarters_sites_only:
        existing_user_ids = {str(user.get("id")) for user in users}
        for index, inspector in enumerate(legacy_inspectors, start=1):
            user = upsert_inspector_user(client, users, inspector)
            inspector_users_by_name[normalize_text(inspector.get("name"))] = user
            if str(user.get("id")) in existing_user_ids:
                summary["updated_users"] += 1
            else:
                summary["created_users"] += 1
                existing_user_ids.add(str(user.get("id")))
            if index % 10 == 0 or index == len(legacy_inspectors):
                print(
                    f"[users] {index}/{len(legacy_inspectors)} "
                    f"(created {summary['created_users']}, updated {summary['updated_users']})",
                    flush=True,
                )
    for index, record in enumerate(legacy_sites, start=1):
        headquarter_id = headquarter_map.get(str(record["legacy_headquarter_id"]))
        if not headquarter_id:
            append_jsonl(failures_path, {"phase": "import_site", "legacy_site_id": record.get("legacy_site_id"), "error": "missing_headquarter_mapping"})
            continue
        existing = find_site_match(sites, record, headquarter_id)
        payload = merge_update_payload(
            existing,
            build_site_payload(record, headquarter_id, normalize_text(existing.get("memo") if existing else "")),
            args.update_missing_only,
        )
        normalized_opening_number = normalize_site_code_value(record.get("opening_number"))
        if not normalized_opening_number or opening_number_counts.get(normalized_opening_number, 0) > 1:
            payload["site_code"] = existing.get("site_code") if existing and has_meaningful_value(existing.get("site_code")) else None
        try:
            if existing and not payload_differs(existing, payload):
                site = existing
            else:
                site = client.update_site(existing["id"], payload) if existing else client.create_site(payload)
        except TargetErpError as error:
            fallback_payload = resolve_conflicting_site_payload(payload, error)
            if existing and fallback_payload is not None:
                site = client.update_site(existing["id"], fallback_payload)
                payload = fallback_payload
            elif not existing and fallback_payload is not None:
                try:
                    site = client.create_site(fallback_payload)
                    payload = fallback_payload
                except TargetErpError as fallback_error:
                    if "409" not in str(fallback_error):
                        raise
                    sites = client.fetch_sites()
                    existing = find_site_match(sites, record, headquarter_id)
                    if not existing:
                        append_jsonl(
                            failures_path,
                            {
                                "phase": "import_site_conflict",
                                "legacy_site_id": record.get("legacy_site_id"),
                                "site_name": record.get("site_name"),
                                "management_number": record.get("management_number"),
                                "opening_number": record.get("opening_number"),
                                "error": str(fallback_error),
                            },
                        )
                        continue
                    payload = merge_update_payload(
                        existing,
                        build_site_payload(record, headquarter_id, normalize_text(existing.get("memo") if existing else "")),
                        args.update_missing_only,
                    )
                    fallback_payload = resolve_conflicting_site_payload(payload, fallback_error)
                    if fallback_payload is not None:
                        payload = fallback_payload
                    site = client.update_site(existing["id"], payload)
            elif existing or "409" not in str(error):
                raise
            else:
                sites = client.fetch_sites()
                existing = find_site_match(sites, record, headquarter_id)
                if not existing:
                    append_jsonl(
                        failures_path,
                        {
                            "phase": "import_site_conflict",
                            "legacy_site_id": record.get("legacy_site_id"),
                            "site_name": record.get("site_name"),
                            "management_number": record.get("management_number"),
                            "opening_number": record.get("opening_number"),
                            "error": str(error),
                        },
                    )
                    continue
                payload = merge_update_payload(
                    existing,
                    build_site_payload(record, headquarter_id, normalize_text(existing.get("memo") if existing else "")),
                    args.update_missing_only,
                )
                fallback_payload = resolve_conflicting_site_payload(payload, error)
                if fallback_payload is not None:
                    payload = fallback_payload
                site = client.update_site(existing["id"], payload)
        if not existing:
            sites.append(site)
            summary["created_sites"] += 1
        else:
            summary["updated_sites"] += 1
        site_map[str(record["legacy_site_id"])] = str(site["id"])
        if args.headquarters_sites_only:
            summary["skipped_worker_links"] += 1
            summary["skipped_schedules"] += len(record.get("visit_history", []))
            if index % 100 == 0 or index == len(legacy_sites):
                print(
                    f"[sites] {index}/{len(legacy_sites)} "
                    f"(created {summary['created_sites']}, updated {summary['updated_sites']})",
                    flush=True,
                )
            continue
        worker_name = normalize_text(record.get("assigned_worker_name"))
        if worker_name:
            user = inspector_users_by_name.get(worker_name) or upsert_worker(
                client,
                users,
                worker_name,
                str(record["legacy_site_id"]),
                normalize_text(record.get("headquarter_name")),
            )
            assignment_result = ensure_active_assignment(
                client,
                assignments,
                site_id=str(site["id"]),
                user_id=str(user["id"]),
                memo="legacy_insafed_import",
            )
            if assignment_result == "reactivated":
                summary["reactivated_assignments"] += 1
            elif assignment_result == "created":
                summary["created_assignments"] += 1
        assignee_lookup: dict[str, tuple[str, str]] = {}
        for visit in record.get("visit_history", []):
            visit_worker_name = normalize_text(visit.get("assigned_worker_name"))
            if not visit_worker_name:
                continue
            visit_user = inspector_users_by_name.get(visit_worker_name) or upsert_worker(
                client,
                users,
                visit_worker_name,
                str(record["legacy_site_id"]),
                normalize_text(record.get("headquarter_name")),
            )
            assignee_lookup[visit_worker_name] = (str(visit_user["id"]), str(visit_user["name"]))
        default_assignee_user_id = ""
        default_assignee_name = worker_name
        if worker_name:
            default_user = inspector_users_by_name.get(worker_name) or assignee_lookup.get(worker_name)
            if isinstance(default_user, tuple):
                default_assignee_user_id, default_assignee_name = default_user
            elif isinstance(default_user, dict):
                default_assignee_user_id = str(default_user.get("id") or "")
                default_assignee_name = str(default_user.get("name") or worker_name)
        total_rounds = int(record.get("total_rounds") or 0)
        if total_rounds > 0 or record.get("visit_history"):
            site = patch_site_schedules_via_memo(
                client,
                site,
                record.get("visit_history", []),
                assignee_lookup,
                total_rounds,
                default_assignee_user_id,
                default_assignee_name,
            )
            summary["updated_schedules"] += max(total_rounds, len(record.get("visit_history", [])))
        if index % 100 == 0 or index == len(legacy_sites):
            print(
                f"[sites] {index}/{len(legacy_sites)} "
                f"(created {summary['created_sites']}, updated {summary['updated_sites']}, "
                f"assignments+ {summary['created_assignments']}, schedules+ {summary['updated_schedules']})",
                flush=True,
            )
    if not args.headquarters_sites_only:
        for inspector in legacy_inspectors:
            user = inspector_users_by_name.get(normalize_text(inspector.get("name")))
            if not user:
                continue
            for assigned_site in inspector.get("assigned_sites", []):
                legacy_site_id = normalize_text(assigned_site.get("legacy_site_id"))
                site_id = site_map.get(legacy_site_id)
                if not site_id:
                    continue
                assignment_result = ensure_active_assignment(
                    client,
                    assignments,
                    site_id=site_id,
                    user_id=str(user["id"]),
                    memo="legacy_insafed_import:assigned_site",
                )
                if assignment_result == "reactivated":
                    summary["reactivated_assignments"] += 1
                elif assignment_result == "created":
                    summary["created_assignments"] += 1
    if args.headquarters_sites_only:
        updated_reports = report_metadata
    else:
        updated_reports = []
        site_name_map = {(normalize_text(site.get("site_name")), normalize_text(site.get("headquarter_name"))): site for site in legacy_sites}
        for item in report_metadata:
            mapped_site_id = site_map.get(str(item.get("legacy_site_id") or ""))
            if not mapped_site_id:
                matched = site_name_map.get((normalize_text(item.get("site_name")), normalize_text(item.get("headquarter_name"))))
                if matched:
                    mapped_site_id = site_map.get(str(matched.get("legacy_site_id")))
            item["new_site_id"] = mapped_site_id
            updated_reports.append(item)
        write_jsonl(export_root / "reports" / "metadata.jsonl", updated_reports)
        summary["reports_reconciled"] = len(updated_reports)
    manifest = read_json(manifest_path, {})
    manifest["import"] = {
        "headquarters": len(headquarter_map),
        "sites": len(site_map),
        "reports_reconciled": summary["reports_reconciled"],
        "headquarters_sites_only": args.headquarters_sites_only,
        "update_missing_only": args.update_missing_only,
        "summary": summary,
    }
    manifest["importFinishedAt"] = iso_now()
    write_json(manifest_path, manifest)
    print(
        f"imported {len(headquarter_map)} headquarters and {len(site_map)} sites from {export_root} "
        f"(created HQ {summary['created_headquarters']}, updated HQ {summary['updated_headquarters']}, "
        f"created sites {summary['created_sites']}, updated sites {summary['updated_sites']})"
    )


if __name__ == "__main__":
    main()
