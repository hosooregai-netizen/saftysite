from __future__ import annotations

import re
from typing import Any

from bs4 import BeautifulSoup

from .common import extract_query_value, normalize_text, parse_int, pick_first


def _table_pairs(soup: BeautifulSoup) -> dict[str, str]:
    pairs: dict[str, str] = {}
    for row in soup.select("tr"):
        cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in row.select("th,td")]
        if len(cells) < 2:
            continue
        for index in range(0, len(cells) - 1, 2):
            label = cells[index].replace(" :", "").strip()
            value = cells[index + 1].strip()
            if label and value and label not in pairs:
                pairs[label] = value
    return pairs


def _extract_labeled_cell(html: str, label: str) -> str:
    matched = re.search(
        rf"<th[^>]*>\s*{re.escape(label)}\s*</th>\s*<td[^>]*>(.*?)</td>",
        html,
        re.S,
    )
    if not matched:
        return ""
    return normalize_text(BeautifulSoup(matched.group(1), "html.parser").get_text(" ", strip=True))


def parse_company_rows(html: str) -> list[dict[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    rows: list[dict[str, str]] = []
    for row in soup.select("table tbody tr"):
        cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in row.select("td")]
        links = row.select("a[href]")
        if len(cells) < 8 or len(links) < 2:
            continue
        company_href = links[0].get("href", "")
        sites_href = links[1].get("href", "")
        company_id = company_href.rstrip("/").split("/")[-1]
        rows.append(
            {
                "legacy_headquarter_id": company_id,
                "name": cells[1],
                "business_registration_no": cells[2].split("(")[0].strip(),
                "representative_name": cells[3],
                "address": cells[4],
                "detail_href": company_href,
                "sites_href": sites_href,
            }
        )
    return rows


def parse_company_detail(html: str) -> dict[str, str]:
    pairs = _table_pairs(BeautifulSoup(html, "html.parser"))
    return {
        "name": pairs.get("건설사명", ""),
        "corporate_registration_no": pairs.get("법인등록번호", ""),
        "business_registration_no": pairs.get("사업자등록번호", ""),
        "license_no": pairs.get("면허번호", ""),
        "representative_name": pairs.get("대표 성명", ""),
        "representative_phone": pairs.get("대표 전화번호", ""),
        "representative_mobile": pairs.get("대표 휴대전화", ""),
        "representative_email": pairs.get("대표 이메일", ""),
        "address": pairs.get("소재지", ""),
    }


def parse_company_sites(html: str) -> list[dict[str, Any]]:
    soup = BeautifulSoup(html, "html.parser")
    rows: list[dict[str, Any]] = []
    for row in soup.select("table tbody tr"):
        cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in row.select("td")]
        if len(cells) < 10:
            continue
        detail_link = row.select_one('a[href*="/cons?id="]')
        if detail_link is None:
            continue
        detail_href = detail_link.get("href", "")
        rows.append(
            {
                "legacy_site_id": extract_query_value(detail_href, "id"),
                "management_number": cells[1],
                "site_name": cells[2],
                "project_kind": cells[3],
                "site_address": cells[4],
                "amount_period": cells[5],
                "assigned_worker_name": cells[6],
                "progress_status": cells[7],
                "detail_href": detail_href,
            }
        )
    return rows


def parse_site_detail(html: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    pairs = _table_pairs(soup)
    text = normalize_text(soup.get_text("\n"))
    manager_match = re.search(r' name="ma_name" value="([^"]+)".*?name="ma_contact" value="([^"]*)".*?name="ma_email" value="([^"]*)"', html, re.S)
    manager_field = _extract_labeled_cell(html, "현장 책임자")
    manager_field_match = re.match(r"([^,(]+)\s*\(([^)]+)\)", manager_field)
    history = parse_site_visit_history(soup)
    primary_manager = parse_primary_manager(soup)
    return {
        "site_name": _extract_labeled_cell(html, "현장명") or pairs.get("현장명", "") or normalize_text(re.search(r"현장명\s+(.+?)\s+고용부 관할", text).group(1) if re.search(r"현장명\s+(.+?)\s+고용부 관할", text) else ""),
        "management_number": pairs.get("사업장관리번호", "") or normalize_text(re.search(r"사업장관리번호\s+(.+?)\s+사업장개시번호", text).group(1) if re.search(r"사업장관리번호\s+(.+?)\s+사업장개시번호", text) else ""),
        "opening_number": pairs.get("사업장개시번호", "") or normalize_text(re.search(r"사업장개시번호\s+(.+?)\s+현장명", text).group(1) if re.search(r"사업장개시번호\s+(.+?)\s+현장명", text) else ""),
        "labor_office": pairs.get("고용부 관할 (지)청", "") or normalize_text(re.search(r"고용부 관할 \(지\)청\s+(.+?)\s+지도원", text).group(1) if re.search(r"고용부 관할 \(지\)청\s+(.+?)\s+지도원", text) else ""),
        "guidance_branch_name": pairs.get("지도원", "") or normalize_text(re.search(r"지도원\s+(.+?)\s+공사 금액", text).group(1) if re.search(r"지도원\s+(.+?)\s+공사 금액", text) else ""),
        "project_amount": parse_int(pairs.get("공사 금액", "") or (re.search(r"공사 금액\s+([\d,]+)\s+원", text).group(1) if re.search(r"공사 금액\s+([\d,]+)\s+원", text) else "")),
        "project_period": pairs.get("공사 기간", "") or normalize_text(re.search(r"공사 기간\s+(.+?)\s+건설 현장 주소", text).group(1) if re.search(r"공사 기간\s+(.+?)\s+건설 현장 주소", text) else ""),
        "site_address": pairs.get("건설 현장 주소", "") or normalize_text(re.search(r"건설 현장 주소\s+(.+?)\s+공사 구분", text).group(1) if re.search(r"건설 현장 주소\s+(.+?)\s+공사 구분", text) else ""),
        "project_kind": pairs.get("공사 구분", "") or normalize_text(re.search(r"공사 구분\s+(.+?)\s+발주자", text).group(1) if re.search(r"공사 구분\s+(.+?)\s+발주자", text) else ""),
        "project_scale": pairs.get("공사 종류", "") or normalize_text(re.search(r"공사 종류\s+(.+?)\s+기술지도 대가", text).group(1) if re.search(r"공사 종류\s+(.+?)\s+기술지도 대가", text) else ""),
        "client_business_name": pairs.get("발주자", "") or normalize_text(re.search(r"발주자\s+(.+?)\s+공사 종류", text).group(1) if re.search(r"발주자\s+(.+?)\s+공사 종류", text) else ""),
        "total_contract_amount": parse_int(pairs.get("기술지도 대가(총액)", "") or (re.search(r"기술지도 대가\(총액\)\s+([\d,]+)\s+원", text).group(1) if re.search(r"기술지도 대가\(총액\)\s+([\d,]+)\s+원", text) else "")),
        "total_rounds": parse_int(pairs.get("기술지도 횟수", "") or (re.search(r"기술지도 횟수\s+(\d+)", text).group(1) if re.search(r"기술지도 횟수\s+(\d+)", text) else "")),
        "start_round": parse_int(pairs.get("시작 차수", "") or (re.search(r"시작 차수\s+(\d+)", text).group(1) if re.search(r"시작 차수\s+(\d+)", text) else "")),
        "assigned_worker_name": pairs.get("담당요원", "") or normalize_text(re.search(r"담당요원\s+(.+?)\s+현장 책임자", text).group(1) if re.search(r"담당요원\s+(.+?)\s+현장 책임자", text) else ""),
        "primary_manager_name": primary_manager.get("name", "") or (manager_field_match.group(1) if manager_field_match else "") or (manager_match.group(1) if manager_match else ""),
        "primary_manager_phone": primary_manager.get("phone", "") or (manager_field_match.group(2) if manager_field_match else "") or (manager_match.group(2) if manager_match else ""),
        "primary_manager_email": primary_manager.get("email", "") or (manager_match.group(3) if manager_match else ""),
        "visit_history": history,
    }


def parse_site_visit_history(soup: BeautifulSoup) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for table in soup.select("table"):
        headers = [normalize_text(cell.get_text(" ", strip=True)) for cell in table.select("thead th")]
        if not headers:
            headers = [normalize_text(cell.get_text(" ", strip=True)) for cell in table.select("tr:first-child th, tr:first-child td")]
        if "차수" not in headers or "방문일자" not in headers:
            continue
        for tr in table.select("tbody tr"):
            cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in tr.select("td")]
            if len(cells) < 6 or not cells[0].isdigit():
                continue
            rows.append(
                {
                    "round_no": parse_int(cells[0]),
                    "visit_date": cells[1],
                    "manager_name": cells[2],
                    "manager_phone": cells[3],
                    "assigned_worker_name": cells[4],
                    "status": cells[5],
                    "has_result_report": "결과보고서" in cells[6] if len(cells) > 6 else False,
                    "has_notice_report": "불이행" in cells[6] if len(cells) > 6 else False,
                }
            )
        if rows:
            return rows
    return rows


def parse_primary_manager(soup: BeautifulSoup) -> dict[str, str]:
    for table in soup.select("table"):
        headers = [normalize_text(cell.get_text(" ", strip=True)) for cell in table.select("tr:first-child th, tr:first-child td")]
        if "주 책임자" not in " ".join(headers):
            continue
        for tr in table.select("tr")[1:]:
            cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in tr.select("td")]
            if len(cells) >= 4 and cells[0] == "주":
                return {"name": cells[1], "phone": cells[2], "email": cells[3]}
        for tr in table.select("tr")[1:]:
            cells = [normalize_text(cell.get_text(" ", strip=True)) for cell in tr.select("td")]
            if len(cells) >= 4:
                return {"name": cells[1], "phone": cells[2], "email": cells[3]}
    return {"name": "", "phone": "", "email": ""}


def parse_report_popup(html: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    pairs = _table_pairs(soup)
    text = normalize_text(soup.get_text("\n"))
    report_pair = pairs.get("사업장관리번호 (사업개시번호)", "")
    matched = re.match(r"(.+?)\s*\((.+?)\)", report_pair)
    rounds = pairs.get("횟수", "")
    round_match = re.search(r"\(\s*(\d+)\s*\)\s*회차\s*/\s*총\s*\(\s*(\d+)\s*\)", rounds)
    manager = pairs.get("연락처 (이메일)", "")
    manager_match = re.match(r"([0-9-]+)\s*\(([^)]+)\)", manager)
    return {
        "site_name": pairs.get("현장명", "") or normalize_text(re.search(r"현장명\s+(.+?)\s+사업장관리번호", text).group(1) if re.search(r"현장명\s+(.+?)\s+사업장관리번호", text) else ""),
        "headquarter_name": pairs.get("회사명", "") or normalize_text(re.search(r"회사명\s+(.+?)\s+법인등록번호", text).group(1) if re.search(r"회사명\s+(.+?)\s+법인등록번호", text) else ""),
        "management_number": matched.group(1).strip() if matched else normalize_text(re.search(r"사업장관리번호\s*\(사업개시번호\)\s+(.+?)\s+\(", text).group(1) if re.search(r"사업장관리번호\s*\(사업개시번호\)\s+(.+?)\s+\(", text) else report_pair),
        "opening_number": matched.group(2).strip() if matched else "",
        "visit_date": pairs.get("기술지도실시일", "") or normalize_text(re.search(r"기술지도실시일\s+([0-9-]+)", text).group(1) if re.search(r"기술지도실시일\s+([0-9-]+)", text) else ""),
        "round_no": int(round_match.group(1)) if round_match else parse_int(re.search(r"횟수\s+\(\s*(\d+)\s*\)", text).group(1) if re.search(r"횟수\s+\(\s*(\d+)\s*\)", text) else None),
        "total_rounds": int(round_match.group(2)) if round_match else parse_int(re.search(r"총\s+\(\s*(\d+)\s*\)\s*회", text).group(1) if re.search(r"총\s+\(\s*(\d+)\s*\)\s*회", text) else None),
        "assigned_worker_name": pick_first(pairs.get("담당 요원"), pairs.get("담당요원"), normalize_text(re.search(r"담당 요원\s+(.+?)\s+이전 기술지도", text).group(1) if re.search(r"담당 요원\s+(.+?)\s+이전 기술지도", text) else "")),
        "manager_name": pairs.get("책임자", "") or normalize_text(re.search(r"책임자\s+(.+?)\s+연락처", text).group(1) if re.search(r"책임자\s+(.+?)\s+연락처", text) else ""),
        "manager_phone": manager_match.group(1) if manager_match else normalize_text(re.search(r"연락처\s*\(이메일\)\s+([0-9-]+)", text).group(1) if re.search(r"연락처\s*\(이메일\)\s+([0-9-]+)", text) else manager),
        "manager_email": manager_match.group(2) if manager_match else normalize_text(re.search(r"연락처\s*\(이메일\)\s+[0-9-]+\s+\(([^)]+)\)", text).group(1) if re.search(r"연락처\s*\(이메일\)\s+[0-9-]+\s+\(([^)]+)\)", text) else ""),
        "site_address": pairs.get("주소", "") or normalize_text(re.search(r"주소\s+(.+?)\s+본사", text).group(1) if re.search(r"주소\s+(.+?)\s+본사", text) else ""),
    }
