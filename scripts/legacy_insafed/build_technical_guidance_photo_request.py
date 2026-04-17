from __future__ import annotations

import argparse
from pathlib import Path

from .common import read_json, write_json
from .tg_format_contract import FORMAT_CONTRACT_ID


def parse_photo(value: str, index: int) -> dict[str, object]:
    intent, image_path = value.split("::", 1) if "::" in value else ("unknown", value)
    return {
        "photoId": f"photo-{index + 1}",
        "intent": intent,
        "imagePath": image_path,
        "caption": "",
        "observedHazards": [],
        "observedText": "",
        "locationHint": "",
        "confidence": 0.2,
    }


def build_previous_report_summary(payload: dict[str, object]) -> dict[str, object]:
    report_meta = payload.get("reportMeta") or {}
    site_snapshot = payload.get("siteSnapshot") or {}
    doc5 = next((section for section in payload.get("sections") or [] if section.get("sectionKey") == "doc5"), {})
    return {
        "legacyReportId": payload.get("legacyReportId") or "",
        "reportDate": ((report_meta.get("reportDate") or {}).get("value") or ""),
        "siteName": ((site_snapshot.get("siteName") or {}).get("value") or ""),
        "variantProfileId": payload.get("variantProfileId") or "",
        "doc5Summary": ((doc5.get("evidence") or {}).get("normalizedText") or "")[:300],
        "findingKeywords": [],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a photo-first draft request skeleton for technical guidance generation.")
    parser.add_argument("--canonical", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--photo", action="append", default=[])
    parser.add_argument("--previous-canonical", action="append", default=[])
    args = parser.parse_args()

    canonical = read_json(Path(args.canonical).expanduser(), {})
    report_meta = canonical.get("reportMeta") or {}
    site_snapshot = canonical.get("siteSnapshot") or {}

    payload = {
        "site": {
            "siteName": (site_snapshot.get("siteName") or {}).get("value") or "",
            "customerName": (site_snapshot.get("companyName") or {}).get("value") or "",
            "assigneeName": (site_snapshot.get("assigneeName") or {}).get("value") or "",
        },
        "reportMeta": {
            "reportDate": (report_meta.get("reportDate") or {}).get("value") or "",
            "reportTitle": (report_meta.get("reportTitle") or {}).get("value") or "",
            "drafter": (report_meta.get("drafter") or {}).get("value") or "",
        },
        "variantProfileId": canonical.get("variantProfileId") or "",
        "formatContractId": FORMAT_CONTRACT_ID,
        "photoObservations": [parse_photo(value, index) for index, value in enumerate(args.photo)],
        "previousReports": [
            build_previous_report_summary(read_json(Path(path).expanduser(), {}))
            for path in args.previous_canonical
        ],
    }
    write_json(Path(args.output).expanduser(), payload)


if __name__ == "__main__":
    main()
