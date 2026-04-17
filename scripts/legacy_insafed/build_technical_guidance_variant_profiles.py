from __future__ import annotations

import argparse
from pathlib import Path

from .common import read_json, read_jsonl, write_json
from .tg_corpus_heuristics import summarize_family_shapes


DEFAULT_FIELD_ALIASES = {
    "siteName": ["현장명", "현장"],
    "reportDate": ["기술지도실시일", "지도일"],
    "assigneeName": ["담당 요원", "담당자"],
    "siteManagerName": ["책임자", "현장책임자"],
    "progressRate": ["공정률"],
}


def build_profiles(manifest_rows: list[dict[str, object]], evidence_root: Path) -> list[dict[str, object]]:
    profiles = summarize_family_shapes(manifest_rows)
    for profile in profiles:
        family = str(profile["profileId"])
        family_rows = [row for row in manifest_rows if row["format_family"] == family]
        example_sections = []
        if family_rows:
            report_id = str(family_rows[0]["legacy_report_id"])
            evidence = read_json(evidence_root / "reports" / report_id / "evidence.json", {})
            example_sections = [section["sectionKey"] for section in evidence.get("sections") or []]
        profile["sectionOrder"] = example_sections or profile.get("sectionOrder") or []
        profile["fieldAliases"] = DEFAULT_FIELD_ALIASES
        profile["repeatBlockRules"] = {
            "doc7": "repeat by extracted findings or fallback placeholder",
            "doc10": "repeat by extracted measurements or default 3 slots",
            "doc11": "repeat by extracted education records or default 1 slot",
            "doc12": "repeat by extracted activities or default 4 slots",
        }
        profile["layoutHints"] = {"textPdfPreferred": True, "sourceCount": len(family_rows)}
    return profiles


def main() -> None:
    parser = argparse.ArgumentParser(description="Build technical-guidance variant profiles from manifest/evidence.")
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--evidence-root", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    manifest_rows = read_jsonl(Path(args.manifest).expanduser())
    profiles = build_profiles(manifest_rows, Path(args.evidence_root).expanduser())
    write_json(Path(args.output).expanduser(), profiles)


if __name__ == "__main__":
    main()
