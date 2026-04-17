from __future__ import annotations

import argparse
from pathlib import Path

from .common import normalize_text, read_json, write_json
from .tg_format_contract import (
    FORMAT_CONTRACT_ID,
    REQUIRED_META_FIELDS,
    REQUIRED_SECTION_ORDER,
    REQUIRED_SITE_SNAPSHOT_FIELDS,
    build_format_contract,
)


def read_field_value(record: dict[str, object], key: str) -> str:
    value = record.get(key)
    if isinstance(value, dict) and "value" in value:
        return normalize_text(value.get("value"))
    return normalize_text(value)


def resolve_repo_path(repo_root: Path, value: object) -> str:
    text = normalize_text(value)
    if not text:
        return ""
    path = Path(text)
    return str((repo_root / path).resolve()) if not path.is_absolute() else str(path.resolve())


def validate_relative_order(section_keys: list[str]) -> list[str]:
    filtered = [key for key in section_keys if key in REQUIRED_SECTION_ORDER]
    expected = REQUIRED_SECTION_ORDER[: len(filtered)]
    return [] if filtered == expected else [f"section_order:{' > '.join(filtered)}"]


def validate_payload(canonical_path: Path, draft_path: Path, repo_root: Path) -> dict[str, object]:
    canonical = read_json(canonical_path, {})
    draft = read_json(draft_path, {})
    format_contract = build_format_contract(repo_root)
    issues: list[str] = []

    if canonical.get("formatContractId") != FORMAT_CONTRACT_ID:
        issues.append("canonical_format_contract_id_mismatch")

    meta = canonical.get("reportMeta") or {}
    snapshot = canonical.get("siteSnapshot") or {}
    section_keys = [str(section.get("sectionKey")) for section in canonical.get("sections") or []]

    for key in REQUIRED_META_FIELDS:
        if not read_field_value(meta, key):
            issues.append(f"missing_meta:{key}")
    for key in REQUIRED_SITE_SNAPSHOT_FIELDS:
        if not read_field_value(snapshot, key):
            issues.append(f"missing_site_snapshot:{key}")
    issues.extend(validate_relative_order(section_keys))

    draft_contract = draft.get("formatContract") or {}
    if draft_contract.get("id") != FORMAT_CONTRACT_ID:
        issues.append("draft_format_contract_id_mismatch")
    if resolve_repo_path(repo_root, draft_contract.get("templatePath")) != normalize_text(
        format_contract["templatePath"]
    ):
        issues.append("draft_template_path_mismatch")

    review_checklist = draft.get("reviewChecklist") or []
    if not review_checklist:
        issues.append("missing_review_checklist")

    return {
        "canonicalPath": str(canonical_path),
        "draftPath": str(draft_path),
        "formatContract": format_contract,
        "sectionKeys": section_keys,
        "issues": issues,
        "ok": len(issues) == 0,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate strict format coupling for technical-guidance draft outputs.")
    parser.add_argument("--canonical", required=True)
    parser.add_argument("--draft", required=True)
    parser.add_argument("--output", default="")
    args = parser.parse_args()

    repo_root = Path.cwd()
    payload = validate_payload(
        Path(args.canonical).expanduser(),
        Path(args.draft).expanduser(),
        repo_root,
    )
    if args.output:
        write_json(Path(args.output).expanduser(), payload)
    else:
        print(payload)

    if not payload["ok"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
