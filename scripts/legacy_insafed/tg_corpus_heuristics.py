from __future__ import annotations

import re
from collections import Counter

from .common import normalize_text
from .tg_corpus_fields import (
    build_confidence_summary,
    build_quality_flags,
    estimate_report_fields,
    to_lines,
)

HEADING_RE = re.compile(r"^\s*(\d{1,2})\.\s*(.+?)\s*$")

def extract_heading_lines(text: str) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for line in to_lines(text):
        matched = HEADING_RE.match(line)
        if matched:
            rows.append({"number": int(matched.group(1)), "title": matched.group(2)})
    return rows


def classify_format_family(sample_text: str, page_count: int) -> str:
    text = normalize_text(sample_text)
    if "건설재해예방전문지도기관 기술지도 결과보고서" in text:
        headings = extract_heading_lines(sample_text)
        heading_numbers = {int(row["number"]) for row in headings}
        if {1, 2, 3}.issubset(heading_numbers):
            return "tg-numbered-sections-v1"
        return "tg-header-ledger-v1"
    if page_count >= 12:
        return "tg-longform-unclassified"
    return "tg-unclassified"


def guess_section_key(number: int, title: str) -> str:
    normalized = normalize_text(title)
    if number == 1:
        return "report_meta"
    if "개요" in normalized:
        return "doc2"
    if "전경사진" in normalized or "전경 사진" in normalized:
        return "doc3"
    if "이행여부" in normalized:
        return "doc4"
    if "총평" in normalized or "요약" in normalized:
        return "doc5"
    if "현재 공정" in normalized or "현존하는 위험성" in normalized:
        return "doc7"
    if "향후" in normalized and "공정" in normalized:
        return "doc8"
    if "기인물" in normalized:
        return "doc6"
    if "유해" in normalized and "위험" in normalized:
        return "doc7"
    if "tbm" in normalized.lower() or "위험성평가" in normalized or "안전점검" in normalized:
        return "doc9"
    if "계측" in normalized:
        return "doc10"
    if "안전교육" in normalized:
        return "doc11"
    if "활동실적" in normalized or "활동 실적" in normalized:
        return "doc12"
    return f"legacy_section_{number}"


def looks_like_section_heading(number: int, title: str) -> bool:
    normalized = normalize_text(title)
    if number == 1 and "기술지도 대상사업장" in normalized:
        return True
    heading_tokens = (
        "기술지도 개요",
        "전경사진",
        "이전 기술지도 사항 이행여부",
        "현재 공정",
        "현존하는 위험성",
        "향후 진행공정",
        "위험성평가",
        "안전점검",
        "계측",
        "안전교육",
        "활동실적",
        "사업장 지원 사항",
        "기타 사항",
    )
    return any(token in normalized for token in heading_tokens)


def split_sections(pages: list[dict[str, object]]) -> list[dict[str, object]]:
    sections: list[dict[str, object]] = []
    active: dict[str, object] | None = None

    def flush_segment(page_number: int, segment_lines: list[str]) -> None:
        if active is None:
            return
        segment_text = "\n".join(line for line in segment_lines if line.strip()).strip()
        if not segment_text:
            return
        if not active["pageRefs"] or active["pageRefs"][-1] != page_number:
            active["pageRefs"].append(page_number)
        active["parts"].append(segment_text)

    for page in pages:
        raw = str(page.get("rawText") or "")
        segment_lines: list[str] = []
        for raw_line in raw.splitlines():
            normalized = normalize_text(raw_line)
            matched = HEADING_RE.match(normalized)
            if matched and not looks_like_section_heading(int(matched.group(1)), matched.group(2)):
                matched = None
            unnumbered_doc3 = normalized in {"전경사진", "전경 사진"}
            if matched or unnumbered_doc3:
                flush_segment(int(page["page"]), segment_lines)
                segment_lines = []
                if matched:
                    number = int(matched.group(1))
                    title = matched.group(2)
                    active = {
                        "sectionKey": guess_section_key(number, title),
                        "title": title,
                        "pageRefs": [],
                        "parts": [],
                    }
                else:
                    active = {
                        "sectionKey": "doc3",
                        "title": "전경사진",
                        "pageRefs": [],
                        "parts": [],
                    }
                sections.append(active)
            if active is None:
                active = {"sectionKey": "preface", "title": "preface", "pageRefs": [], "parts": []}
                sections.append(active)
            segment_lines.append(raw_line.rstrip())
        flush_segment(int(page["page"]), segment_lines)
    if len(sections) >= 2 and sections[0]["sectionKey"] == "preface" and sections[1]["sectionKey"] == "report_meta":
        sections[1]["pageRefs"] = sections[0]["pageRefs"] + sections[1]["pageRefs"]
        sections[1]["parts"] = sections[0]["parts"] + sections[1]["parts"]
        sections = sections[1:]
    return sections


def summarize_family_shapes(manifest_rows: list[dict[str, object]]) -> list[dict[str, object]]:
    grouped: dict[str, list[dict[str, object]]] = {}
    for row in manifest_rows:
        grouped.setdefault(str(row.get("format_family") or "tg-unclassified"), []).append(row)
    profiles = []
    for family, rows in grouped.items():
        headings = Counter(tuple(row.get("heading_titles") or []) for row in rows)
        profiles.append(
            {
                "profileId": family,
                "familyName": family,
                "sectionOrder": list(headings.most_common(1)[0][0]) if headings else [],
                "sectionPresenceRules": {"sampleCount": len(rows)},
            }
        )
    return profiles
