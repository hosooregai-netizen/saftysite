from __future__ import annotations

import argparse
from pathlib import Path

from .common import ensure_dir, read_json, read_jsonl, write_json
from .tg_format_contract import FORMAT_CONTRACT_ID


def pick_section(sections: list[dict[str, object]], key: str) -> dict[str, object] | None:
    return next((section for section in sections if section["sectionKey"] == key), None)


def evidence_refs(section: dict[str, object] | None) -> list[str]:
    if not section:
        return []
    refs = []
    for snippet in list(section.get("snippetRefs") or [])[:3]:
        refs.append(f'{section["sectionKey"]}#{snippet["id"]}')
    return refs


def build_field(
    manifest_row: dict[str, object],
    key: str,
    value: object,
    section: dict[str, object] | None,
) -> dict[str, object]:
    confidence_summary = manifest_row.get("confidence_summary") or {}
    return {
        "value": value,
        "confidence": float(confidence_summary.get(key) or 0.2),
        "evidenceRefs": evidence_refs(section),
        "extractor": "rule",
    }


def extract_report_meta(manifest_row: dict[str, object], sections: list[dict[str, object]]) -> dict[str, object]:
    estimated = manifest_row.get("estimated", {})
    report_meta_section = pick_section(sections, "report_meta")
    overview_section = pick_section(sections, "doc2")
    return {
        "reportTitle": build_field(
            manifest_row,
            "reportTitle",
            estimated.get("reportTitle") or "건설재해예방전문지도기관 기술지도 결과보고서",
            report_meta_section,
        ),
        "reportDate": build_field(manifest_row, "reportDate", estimated.get("reportDate") or "", overview_section),
        "siteName": build_field(manifest_row, "siteName", estimated.get("siteName") or "", report_meta_section),
        "drafter": build_field(manifest_row, "assigneeName", estimated.get("assigneeName") or "", overview_section),
        "visitRound": build_field(manifest_row, "visitRound", estimated.get("visitRound") or 0, overview_section),
        "totalRounds": build_field(manifest_row, "totalRounds", estimated.get("totalRounds") or 0, overview_section),
        "progressRate": build_field(manifest_row, "progressRate", estimated.get("progressRate") or "", overview_section),
    }


def extract_site_snapshot(manifest_row: dict[str, object], sections: list[dict[str, object]]) -> dict[str, object]:
    estimated = manifest_row.get("estimated", {})
    report_meta_section = pick_section(sections, "report_meta")
    overview_section = pick_section(sections, "doc2")
    return {
        "siteName": build_field(manifest_row, "siteName", estimated.get("siteName") or "", report_meta_section),
        "assigneeName": build_field(manifest_row, "assigneeName", estimated.get("assigneeName") or "", overview_section),
        "siteManagerName": build_field(
            manifest_row, "siteManagerName", estimated.get("siteManagerName") or "", report_meta_section
        ),
        "siteManagerPhone": build_field(
            manifest_row, "siteManagerPhone", estimated.get("siteManagerPhone") or "", report_meta_section
        ),
        "siteContactEmail": build_field(
            manifest_row, "siteContactEmail", estimated.get("siteContactEmail") or "", report_meta_section
        ),
        "siteAddress": build_field(manifest_row, "siteAddress", estimated.get("siteAddress") or "", report_meta_section),
        "companyName": build_field(manifest_row, "companyName", estimated.get("companyName") or "", report_meta_section),
        "constructionPeriod": build_field(
            manifest_row, "constructionPeriod", estimated.get("constructionPeriod") or "", report_meta_section
        ),
        "constructionAmount": build_field(
            manifest_row, "constructionAmount", estimated.get("constructionAmount") or "", report_meta_section
        ),
        "corporationRegistrationNumber": build_field(
            manifest_row,
            "corporationRegistrationNumber",
            estimated.get("corporationRegistrationNumber") or "",
            report_meta_section,
        ),
        "businessRegistrationNumber": build_field(
            manifest_row,
            "businessRegistrationNumber",
            estimated.get("businessRegistrationNumber") or "",
            report_meta_section,
        ),
        "licenseNumber": build_field(
            manifest_row, "licenseNumber", estimated.get("licenseNumber") or "", report_meta_section
        ),
    }


def section_structured_data(section: dict[str, object]) -> dict[str, object]:
    text = str(section.get("normalizedText") or "")
    section_key = str(section.get("sectionKey") or "")
    estimated_item_count = 0
    if section_key == "doc4":
        estimated_item_count = max(1, text.count("이행"))
    elif section_key == "doc7":
        estimated_item_count = max(text.count("조치 완료"), text.count("가능성 ("), 1)
    elif section_key == "doc8":
        estimated_item_count = max(text.count("비고"), 1)
    elif section_key == "doc10":
        estimated_item_count = max(text.count("측정"), 1)
    elif section_key == "doc11":
        estimated_item_count = max(text.count("교육"), 1)
    elif section_key == "doc12":
        estimated_item_count = max(text.count("활동"), 1)
    else:
        estimated_item_count = 1 if text else 0
    return {
        "charCount": len(text),
        "lineCount": len([line for line in str(section.get("rawText") or "").splitlines() if line.strip()]),
        "hasPhotoHints": any(token in text for token in ["사진", "전경", "교육자료"]),
        "estimatedItemCount": estimated_item_count,
    }


def build_canonical_report(manifest_row: dict[str, object], evidence_payload: dict[str, object]) -> dict[str, object]:
    sections = list(evidence_payload.get("sections") or [])
    unresolved = [flag for flag in manifest_row.get("quality_flags") or [] if str(flag).startswith("missing_")]
    return {
        "legacyReportId": manifest_row["legacy_report_id"],
        "variantProfileId": manifest_row["format_family"],
        "formatContractId": FORMAT_CONTRACT_ID,
        "reportMeta": extract_report_meta(manifest_row, sections),
        "siteSnapshot": extract_site_snapshot(manifest_row, sections),
        "sections": [
            {
              "sectionKey": section["sectionKey"],
              "title": section["title"],
              "structuredData": section_structured_data(section),
              "evidence": section,
            }
            for section in sections
        ],
        "extractionMeta": {
            "sourcePdfPath": manifest_row["source_pdf_path"],
            "pageCount": manifest_row["page_count"],
            "textPdf": manifest_row["text_pdf"],
            "formatFamily": manifest_row["format_family"],
            "parserVersion": "tg-corpus-v1",
            "modelVersion": None,
            "unresolvedFields": unresolved,
            "confidenceSummary": manifest_row.get("confidence_summary") or {},
            "qualityFlags": manifest_row.get("quality_flags") or [],
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize technical-guidance evidence into canonical JSON.")
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--evidence-root", required=True)
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    manifest_rows = read_jsonl(Path(args.manifest).expanduser())
    if args.limit > 0:
        manifest_rows = manifest_rows[: args.limit]
    evidence_root = Path(args.evidence_root).expanduser()
    output_root = ensure_dir(Path(args.output_root).expanduser())
    for row in manifest_rows:
        report_id = str(row["legacy_report_id"])
        evidence_path = evidence_root / "reports" / report_id / "evidence.json"
        if not evidence_path.exists():
            continue
        canonical = build_canonical_report(row, read_json(evidence_path, {}))
        write_json(output_root / f"{report_id}.json", canonical)


if __name__ == "__main__":
    main()
