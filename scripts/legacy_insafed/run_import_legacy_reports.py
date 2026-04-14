#!/usr/bin/env python3

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from pathlib import Path

if __package__ in {None, ""}:
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from scripts.legacy_insafed.common import iso_now, read_json, write_json
else:
    from .common import iso_now, read_json, write_json


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run legacy report import in resumable chunks.")
    parser.add_argument("--repo-root", default=str(Path(__file__).resolve().parents[2]))
    parser.add_argument("--export-root", required=True)
    parser.add_argument("--target-base-url", required=True)
    parser.add_argument("--target-email", required=True)
    parser.add_argument("--target-password", required=True)
    parser.add_argument("--legacy-base-url", default="http://console.insafed.com/insef/public")
    parser.add_argument("--legacy-email", default="")
    parser.add_argument("--legacy-password", default="")
    parser.add_argument("--chunk-size", type=int, default=100)
    parser.add_argument("--sleep-seconds", type=int, default=15)
    parser.add_argument("--max-retries", type=int, default=0)
    return parser


def count_rows(metadata_path: Path) -> int:
    return sum(1 for line in metadata_path.read_text(encoding="utf-8").splitlines() if line.strip())


def build_command(args: argparse.Namespace, offset: int) -> list[str]:
    command = [
        "node",
        "./node_modules/.bin/tsx",
        "scripts/legacy_insafed/import_legacy_reports.ts",
        "--export-root",
        args.export_root,
        "--target-base-url",
        args.target_base_url,
        "--target-email",
        args.target_email,
        "--target-password",
        args.target_password,
        "--legacy-base-url",
        args.legacy_base_url,
        "--offset",
        str(offset),
        "--limit",
        str(args.chunk_size),
        "--skip-existing",
    ]
    if args.legacy_email:
        command.extend(["--legacy-email", args.legacy_email])
    if args.legacy_password:
        command.extend(["--legacy-password", args.legacy_password])
    return command


def main() -> int:
    args = build_parser().parse_args()
    repo_root = Path(args.repo_root).resolve()
    export_root = Path(args.export_root).resolve()
    metadata_path = export_root / "admin" / "reports" / "metadata.jsonl"
    state_path = export_root / "admin" / "reports" / "import-runner-state.json"
    total_rows = count_rows(metadata_path)
    state = read_json(
        state_path,
        {
            "chunk_size": args.chunk_size,
            "completed_offsets": [],
            "failed_offsets": [],
            "last_attempted_offset": None,
            "started_at": iso_now(),
            "updated_at": iso_now(),
        },
    )
    completed_offsets = {int(value) for value in state.get("completed_offsets", [])}
    failed_offsets = {int(value) for value in state.get("failed_offsets", [])}

    offsets = list(range(0, total_rows, args.chunk_size))
    for offset in offsets:
        if offset in completed_offsets:
            continue

        attempt = 0
        while True:
            attempt += 1
            print(
                f"[runner] {iso_now()} offset={offset} attempt={attempt} "
                f"chunk_size={args.chunk_size}",
                flush=True,
            )
            state["last_attempted_offset"] = offset
            state["updated_at"] = iso_now()
            write_json(state_path, state)

            result = subprocess.run(
                build_command(args, offset),
                cwd=repo_root,
                text=True,
            )
            if result.returncode == 0:
                completed_offsets.add(offset)
                failed_offsets.discard(offset)
                state["completed_offsets"] = sorted(completed_offsets)
                state["failed_offsets"] = sorted(failed_offsets)
                state["updated_at"] = iso_now()
                write_json(state_path, state)
                break

            failed_offsets.add(offset)
            state["failed_offsets"] = sorted(failed_offsets)
            state["updated_at"] = iso_now()
            write_json(state_path, state)

            if args.max_retries > 0 and attempt >= args.max_retries:
                print(
                    f"[runner] giving up offset={offset} after {attempt} attempts",
                    flush=True,
                )
                return 1

            print(
                f"[runner] retrying offset={offset} in {args.sleep_seconds}s",
                flush=True,
            )
            time.sleep(args.sleep_seconds)

    state["finished_at"] = iso_now()
    state["updated_at"] = iso_now()
    write_json(state_path, state)
    print("[runner] completed all chunks", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
