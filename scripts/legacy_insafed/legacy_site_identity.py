from __future__ import annotations

import re
from typing import Any

from .common import normalize_text
from .target_mapping import LEGACY_SITE_TAG


LEGACY_SCHEDULE_SITE_ID_RE = re.compile(r"legacy_site_id=([^\s]+)")


def extract_legacy_site_id_from_memo(memo: Any) -> str:
    normalized = normalize_text(memo)
    matched = re.search(rf"{re.escape(LEGACY_SITE_TAG)}([^\s]+)", normalized)
    return matched.group(1) if matched else ""


def extract_legacy_site_id_from_schedule(schedule: dict[str, Any]) -> str:
    reason_memo = normalize_text(
        schedule.get("selectionReasonMemo") or schedule.get("selection_reason_memo")
    )
    matched = LEGACY_SCHEDULE_SITE_ID_RE.search(reason_memo)
    return matched.group(1) if matched else ""


def is_legacy_import_schedule(schedule: dict[str, Any]) -> bool:
    label = normalize_text(
        schedule.get("selectionReasonLabel") or schedule.get("selection_reason_label")
    )
    return label == "Legacy InSEF import" or bool(
        extract_legacy_site_id_from_schedule(schedule)
    )


def has_conflicting_legacy_site_tag(memo: Any, legacy_site_id: str) -> bool:
    current_legacy_site_id = extract_legacy_site_id_from_memo(memo)
    return bool(
        current_legacy_site_id
        and legacy_site_id
        and current_legacy_site_id != normalize_text(legacy_site_id)
    )


def is_conflicting_legacy_import_schedule(
    schedule: dict[str, Any],
    legacy_site_id: str,
) -> bool:
    imported_legacy_site_id = extract_legacy_site_id_from_schedule(schedule)
    return bool(
        legacy_site_id
        and imported_legacy_site_id
        and imported_legacy_site_id != normalize_text(legacy_site_id)
        and is_legacy_import_schedule(schedule)
    )
