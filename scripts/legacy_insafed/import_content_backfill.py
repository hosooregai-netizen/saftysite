#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import read_jsonl
    from scripts.legacy_insafed.target_client import TargetErpClient
else:
    from .common import read_jsonl
    from .target_client import TargetErpClient


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Import legacy admin data-management rows into ERP content-items.")
    parser.add_argument("--candidates-path", required=True)
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-token", required=True)
    parser.add_argument("--dry-run", action="store_true")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    client = TargetErpClient(args.target_base_url, args.target_token, timeout=60)
    candidates = read_jsonl(Path(args.candidates_path))
    existing = {str(item.get("code") or ""): item for item in client.fetch_content_items()}
    created = 0
    updated = 0
    skipped = 0
    for candidate in candidates:
        code = str(candidate.get("code") or "")
        body = {
            "content_type": candidate["content_type"],
            "title": candidate["title"],
            "code": code,
            "body": candidate["body"],
            "tags": candidate.get("tags", []),
            "sort_order": candidate.get("sort_order", 0),
            "is_active": candidate.get("is_active", True),
        }
        current = existing.get(code)
        if current is None:
            if not args.dry_run:
                created_item = client.create_content_item(body)
                existing[code] = created_item
            created += 1
            continue
        changed = any(current.get(key) != body.get(key) for key in body.keys())
        if not changed:
            skipped += 1
            continue
        if not args.dry_run:
            client.update_content_item(str(current["id"]), body)
        updated += 1
    print(f"created={created} updated={updated} skipped={skipped}")


if __name__ == "__main__":
    main()
