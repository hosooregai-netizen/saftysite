from __future__ import annotations

import argparse
import json
from pathlib import Path

from scripts.legacy_insafed.schedule_sync_helpers import extract_legacy_selected_rounds, normalize_text
from scripts.legacy_insafed.target_client import TargetErpClient


def write_jsonl(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync legacy memo schedule selections into inspection_schedules.",
    )
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-token", required=True)
    parser.add_argument("--output-root", default=".")
    args = parser.parse_args()

    client = TargetErpClient(args.target_base_url, args.target_token)
    output_root = Path(args.output_root)
    resolved_rows: list[dict[str, object]] = []
    unresolved_rows: list[dict[str, object]] = []

    for site in client.fetch_sites():
        site_id = normalize_text(site.get("id") or site.get("_id"))
        site_name = normalize_text(site.get("site_name") or site.get("siteName"))
        selected_rounds = extract_legacy_selected_rounds(site)
        if not site_id or not selected_rounds:
            continue

        try:
            client.generate_site_schedules(site_id)
            synced_rows = client.fetch_site_schedules(site_id)
            synced_by_round = {
                int(row.get("roundNo") or row.get("round_no") or 0): row
                for row in synced_rows
                if int(row.get("roundNo") or row.get("round_no") or 0) > 0
            }
            missing_rounds: list[dict[str, object]] = []
            for selected in selected_rounds:
                synced = synced_by_round.get(selected["round_no"])
                synced_planned_date = normalize_text(
                    (synced or {}).get("plannedDate") or (synced or {}).get("planned_date")
                )
                if synced_planned_date == selected["planned_date"]:
                    continue
                missing_rounds.append(
                    {
                        "expected_planned_date": selected["planned_date"],
                        "round_no": selected["round_no"],
                        "synced_planned_date": synced_planned_date,
                    }
                )
            target = unresolved_rows if missing_rounds else resolved_rows
            target.append(
                {
                    "legacy_selected_rounds": selected_rounds,
                    "missing_rounds": missing_rounds,
                    "site_id": site_id,
                    "site_name": site_name,
                }
            )
        except Exception as error:
            unresolved_rows.append(
                {
                    "error": str(error),
                    "legacy_selected_rounds": selected_rounds,
                    "site_id": site_id,
                    "site_name": site_name,
                }
            )

    write_jsonl(output_root / "legacy-schedule-sync-resolved.jsonl", resolved_rows)
    write_jsonl(output_root / "legacy-schedule-sync-unresolved.jsonl", unresolved_rows)
    print(
        json.dumps(
            {
                "resolved": len(resolved_rows),
                "unresolved": len(unresolved_rows),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
