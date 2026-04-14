from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


def normalize_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").replace("\xa0", " ")).strip()


def slugify(value: Any) -> str:
    normalized = normalize_text(value).lower()
    normalized = normalized.replace(",", " ")
    normalized = re.sub(r"[^0-9a-z가-힣]+", "-", normalized).strip("-")
    return normalized or "item"


def parse_int(value: Any) -> int | None:
    text = normalize_text(value)
    if not text:
        return None
    digits = re.sub(r"[^0-9-]", "", text)
    if not digits or digits == "-":
        return None
    return int(digits)


def parse_date(value: Any) -> str:
    return normalize_text(value)


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def append_jsonl(path: Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def merge_memo_tag(existing: Any, tag: str) -> str:
    current = normalize_text(existing)
    if not current:
        return tag
    lines = [line.strip() for line in str(existing).splitlines() if line.strip()]
    if tag in lines or tag in current:
        return current
    return "\n".join([current, tag])


def extract_query_value(url: str, key: str) -> str:
    matched = re.search(rf"[?&]{re.escape(key)}=([^&]+)", url)
    return matched.group(1) if matched else ""


def pick_first(*values: Any) -> str:
    for value in values:
        text = normalize_text(value)
        if text:
            return text
    return ""
