from __future__ import annotations

import re

from .common import normalize_text, parse_int

DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(01\d[- ]?\d{3,4}[- ]?\d{4}|0\d{1,2}[- ]?\d{3,4}[- ]?\d{4})")
ROUND_RE = re.compile(r"\(\s*(\d+)\s*\)\s*회차\s*/\s*총\s*\(\s*(\d+)\s*\)\s*회")
PERCENT_RE = re.compile(r"\d{1,3}%")

LABEL_LINES = {
    "현장", "본사", "현장명", "사업장관리번호", "(사업개시번호)", "공사기간", "공사금액",
    "책임자", "연락처", "(이메일)", "주소", "회사명", "법인등록번호", "(사업자등록번호)",
    "면허번호", "지도기관명", "기술지도실시일", "구분", "공정률", "횟수", "담당 요원",
    "이전 기술지도", "이행여부", "현장책임자 등", "통보 방법", "기타 특이사항",
}


def to_lines(text: str) -> list[str]:
    return [line for line in (normalize_text(part) for part in text.splitlines()) if line]


def find_label_index(lines: list[str], label: str, start: int = 0) -> int:
    for index in range(start, len(lines)):
        if lines[index] == label:
            return index
    return -1


def next_value(lines: list[str], label_index: int, heading_re: re.Pattern[str], max_lookahead: int = 4) -> str:
    for offset in range(1, max_lookahead + 1):
        candidate_index = label_index + offset
        if candidate_index >= len(lines):
            break
        candidate = lines[candidate_index]
        if candidate in LABEL_LINES or heading_re.match(candidate):
            break
        if candidate in {"-", "/"}:
            continue
        return candidate
    return ""


def value_after_label(
    lines: list[str],
    label: str,
    heading_re: re.Pattern[str],
    start: int = 0,
    max_lookahead: int = 4,
) -> str:
    label_index = find_label_index(lines, label, start=start)
    if label_index < 0:
        return ""
    return next_value(lines, label_index, heading_re=heading_re, max_lookahead=max_lookahead)


def estimate_report_fields(text: str, heading_re: re.Pattern[str]) -> dict[str, object]:
    lines = to_lines(text)
    manager_index = find_label_index(lines, "책임자")
    manager_contact_index = find_label_index(lines, "연락처", start=max(manager_index, 0))
    manager_phone = ""
    manager_email = ""
    if manager_contact_index >= 0:
        for line in lines[manager_contact_index + 1 : manager_contact_index + 6]:
            if not manager_phone:
                phone_match = PHONE_RE.search(line)
                if phone_match:
                    manager_phone = phone_match.group(1).replace(" ", "")
            if not manager_email:
                email_match = EMAIL_RE.search(line)
                if email_match:
                    manager_email = email_match.group(0)

    values: dict[str, object] = {
        "siteName": value_after_label(lines, "현장명", heading_re=heading_re),
        "reportDate": value_after_label(lines, "기술지도실시일", heading_re=heading_re),
        "assigneeName": value_after_label(lines, "담당 요원", heading_re=heading_re),
        "progressRate": value_after_label(lines, "공정률", heading_re=heading_re),
        "siteManagerName": value_after_label(lines, "책임자", heading_re=heading_re),
        "siteManagerPhone": manager_phone,
        "siteContactEmail": manager_email,
        "siteAddress": value_after_label(lines, "주소", heading_re=heading_re, start=max(manager_contact_index, 0)),
        "companyName": value_after_label(lines, "회사명", heading_re=heading_re),
        "constructionPeriod": value_after_label(lines, "공사기간", heading_re=heading_re),
        "constructionAmount": value_after_label(lines, "공사금액", heading_re=heading_re),
        "licenseNumber": value_after_label(lines, "면허번호", heading_re=heading_re),
        "headquartersAddress": value_after_label(
            lines,
            "주소",
            heading_re=heading_re,
            start=max(find_label_index(lines, "회사명"), 0),
        ),
    }
    corporation_index = find_label_index(lines, "법인등록번호")
    if corporation_index >= 0:
        identifiers = [
            line
            for line in lines[corporation_index + 1 : corporation_index + 5]
            if re.fullmatch(r"[0-9()-]+", line)
        ]
        values["corporationRegistrationNumber"] = identifiers[0] if identifiers else ""
        values["businessRegistrationNumber"] = identifiers[1] if len(identifiers) > 1 else ""
    round_match = ROUND_RE.search(text)
    values["visitRound"] = parse_int(round_match.group(1)) if round_match else None
    values["totalRounds"] = parse_int(round_match.group(2)) if round_match else None
    values["reportTitle"] = (
        "건설재해예방전문지도기관 기술지도 결과보고서"
        if "건설재해예방전문지도기관 기술지도 결과보고서" in normalize_text(text)
        else ""
    )
    return values


def build_confidence_summary(fields: dict[str, object]) -> dict[str, float]:
    summary: dict[str, float] = {}
    for key, value in fields.items():
        text = normalize_text(value)
        if key in {"visitRound", "totalRounds"}:
            summary[key] = 0.9 if isinstance(value, int) and value > 0 else 0.2
        elif key == "reportTitle":
            summary[key] = 0.95 if text == "건설재해예방전문지도기관 기술지도 결과보고서" else 0.2
        elif key == "reportDate":
            summary[key] = 0.95 if DATE_RE.fullmatch(text) else 0.2
        elif key == "siteContactEmail":
            summary[key] = 0.9 if EMAIL_RE.fullmatch(text) else 0.2
        elif key == "siteManagerPhone":
            summary[key] = 0.85 if PHONE_RE.fullmatch(text) else 0.2
        elif key == "progressRate":
            summary[key] = 0.85 if PERCENT_RE.fullmatch(text) else 0.2
        elif text and len(text) <= 80:
            summary[key] = 0.8
        elif text:
            summary[key] = 0.35
        else:
            summary[key] = 0.2
    return summary


def build_quality_flags(text_pdf: bool, fields: dict[str, object]) -> list[str]:
    flags = [] if text_pdf else ["scanned_pdf"]
    for key in ["siteName", "reportDate", "visitRound", "assigneeName"]:
        if not fields.get(key):
            flags.append(f"missing_{key}")
    for key in ["siteName", "assigneeName", "siteManagerName"]:
        if len(normalize_text(fields.get(key))) > 80:
            flags.append(f"suspicious_{key}")
    if fields.get("siteContactEmail") and not EMAIL_RE.fullmatch(normalize_text(fields.get("siteContactEmail"))):
        flags.append("suspicious_siteContactEmail")
    return flags
