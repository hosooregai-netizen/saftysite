from __future__ import annotations

import json
from typing import Any

SITE_META_MARKER = "[SAFETY_SITE_META]"


def normalize_text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def parse_site_meta_envelope(memo: Any) -> dict[str, Any]:
    normalized = normalize_text(memo)
    if SITE_META_MARKER not in normalized:
        return {}
    marker_index = normalized.rfind(SITE_META_MARKER)
    payload = normalized[marker_index + len(SITE_META_MARKER) :].strip()
    if not payload:
        return {}
    try:
        parsed = json.loads(payload)
    except Exception:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def is_legacy_selected_schedule(item: dict[str, Any]) -> bool:
    planned_date = normalize_text(item.get("plannedDate"))
    if not planned_date:
        return False
    reason_label = normalize_text(item.get("selectionReasonLabel"))
    reason_memo = normalize_text(item.get("selectionReasonMemo"))
    return reason_label == "Legacy InSEF import" or "legacy_site_id=" in reason_memo


def extract_legacy_selected_rounds(site: dict[str, Any]) -> list[dict[str, Any]]:
    envelope = parse_site_meta_envelope(site.get("memo"))
    schedules = envelope.get("schedules")
    if not isinstance(schedules, list):
        return []
    rows: list[dict[str, Any]] = []
    for item in schedules:
        if not isinstance(item, dict) or not is_legacy_selected_schedule(item):
            continue
        round_no = int(item.get("roundNo") or 0)
        if round_no <= 0:
            continue
        rows.append(
            {
                "planned_date": normalize_text(item.get("plannedDate")),
                "round_no": round_no,
                "selection_reason_label": normalize_text(item.get("selectionReasonLabel")),
                "selection_reason_memo": normalize_text(item.get("selectionReasonMemo")),
            }
        )
    return sorted(rows, key=lambda row: row["round_no"])
