from __future__ import annotations

import argparse
import json
from pathlib import Path

import fitz

A4 = (595.0, 842.0)
MARGIN = 36.0
FONT = "/System/Library/Fonts/Supplemental/AppleGothic.ttf"


def text(page: fitz.Page, rect: fitz.Rect, value: str, size: float = 10, align: int = 0, color=(0, 0, 0)):
    page.insert_font(fontname="kfont", fontfile=FONT)
    page.insert_textbox(rect, value, fontsize=size, fontname="kfont", align=align, color=color, lineheight=1.3)


def box(page: fitz.Page, rect: fitz.Rect, title: str):
    page.draw_rect(rect, color=(0.75, 0.75, 0.75), width=0.8)
    head = fitz.Rect(rect.x0, rect.y0, rect.x1, rect.y0 + 20)
    page.draw_rect(head, color=(0.85, 0.9, 0.98), fill=(0.85, 0.9, 0.98), width=0.8)
    text(page, head + (8, 3, -8, -3), title, 10, 0, (0.08, 0.18, 0.35))


def image(page: fitz.Page, rect: fitz.Rect, path: str, caption: str = ""):
    page.draw_rect(rect, color=(0.8, 0.8, 0.8), width=0.6)
    page.insert_image(rect, filename=path, keep_proportion=True)
    if caption:
      text(page, fitz.Rect(rect.x0, rect.y1 + 3, rect.x1, rect.y1 + 18), caption, 8, 1, (0.25, 0.25, 0.25))


def load(path: Path):
    return json.loads(path.read_text("utf-8"))


def page1(doc: fitz.Document, cfg: dict):
    page = doc.new_page(width=A4[0], height=A4[1])
    meta = cfg["meta"]
    snap = cfg["adminSiteSnapshot"]
    ov = cfg["overview"]
    text(page, fitz.Rect(MARGIN, 40, A4[0] - MARGIN, 90), meta["reportTitle"], 18, 1, (0.05, 0.15, 0.3))
    text(page, fitz.Rect(MARGIN, 92, A4[0] - MARGIN, 120), f"{meta['siteName']} / 지도일 {meta['reportDate']}", 11, 1)
    left = fitz.Rect(MARGIN, 135, A4[0] - MARGIN, 360)
    box(page, left, "1. 기술지도 대상사업장")
    rows = [
        ("고객사", snap["customerName"]), ("현장명", snap["siteName"]), ("책임자", snap["siteManagerName"]),
        ("연락처", snap["siteContactEmail"]), ("공사기간", snap["constructionPeriod"]), ("공사금액", snap["constructionAmount"]),
        ("시공사", snap["companyName"]), ("현장주소", snap["siteAddress"]),
    ]
    y = 165
    for label, value in rows:
        text(page, fitz.Rect(MARGIN + 10, y, MARGIN + 100, y + 18), label, 10)
        text(page, fitz.Rect(MARGIN + 104, y, A4[0] - MARGIN - 10, y + 18), str(value), 10)
        y += 23
    overview = fitz.Rect(MARGIN, 385, A4[0] - MARGIN, 790)
    box(page, overview, "2. 기술지도 개요")
    text(page, fitz.Rect(MARGIN + 10, 415, A4[0] - MARGIN - 10, 520), "\n".join([
        f"공사종류: {ov['constructionType']}",
        f"진도율 / 회차: {ov['progressRate']} / {ov['visitCount']}차 ({ov['totalVisitCount']}차 중)",
        f"담당자 / 통보방식: {ov['assignee']} / {ov['notificationMethod']}",
        f"작업인원 / 장비: {ov['processWorkerCount']} / {ov['processEquipment']}",
        f"작업내용: {ov['processWorkContent']}",
        f"작업장소: {ov['processWorkLocation']}",
        f"주변여건: {ov['processSurroundings']}",
    ]), 10)
    text(page, fitz.Rect(MARGIN + 10, 535, A4[0] - MARGIN - 10, 760), ov["processAndNotes"], 10)


def page2(doc: fitz.Document, cfg: dict):
    page = doc.new_page(width=A4[0], height=A4[1])
    box(page, fitz.Rect(MARGIN, 36, A4[0] - MARGIN, 800), "3. 현장 전경 및 주요 진행공정")
    scenes = cfg["doc3Scenes"]
    slots = [(54, 72, 279, 290), (307, 72, 541, 290), (54, 360, 279, 578), (307, 360, 541, 578)]
    for item, slot in zip(scenes, slots):
        rect = fitz.Rect(*slot)
        image(page, fitz.Rect(rect.x0, rect.y0, rect.x1, rect.y1 - 18), item["photoPath"], item["title"])
        text(page, fitz.Rect(rect.x0, rect.y1 - 10, rect.x1, rect.y1 + 38), item["description"], 8)


def page3(doc: fitz.Document, cfg: dict):
    page = doc.new_page(width=A4[0], height=A4[1])
    box(page, fitz.Rect(MARGIN, 36, A4[0] - MARGIN, 800), "5. 총평 / 7. 현존 유해·위험요인 세부 지적")
    text(page, fitz.Rect(48, 68, 547, 150), cfg["doc5Summary"], 10)
    findings = cfg["doc7Findings"]
    top1, top2 = fitz.Rect(54, 170, 250, 345), fitz.Rect(268, 170, 464, 345)
    image(page, top1, findings[0]["photoPath"], "지적사진 1")
    image(page, top2, findings[0]["photoPath2"], "지적사진 2")
    text(page, fitz.Rect(54, 355, 541, 480), "\n".join([
        f"[지적 1] 위치: {findings[0]['location']}",
        f"재해유형 / 기인물: {findings[0]['accidentType']} / {findings[0]['causativeAgentKey']}",
        f"위험도: {findings[0]['riskLevel']}",
        f"중점사항: {findings[0]['emphasis']}",
        f"개선방안: {findings[0]['improvementPlan']}",
    ]), 10)
    image(page, fitz.Rect(54, 510, 250, 690), findings[1]["photoPath"], "지적사진 3")
    text(page, fitz.Rect(268, 510, 541, 710), "\n".join([
        f"[지적 2] 위치: {findings[1]['location']}",
        f"재해유형 / 기인물: {findings[1]['accidentType']} / {findings[1]['causativeAgentKey']}",
        f"위험도: {findings[1]['riskLevel']}",
        f"중점사항: {findings[1]['emphasis']}",
        f"개선방안: {findings[1]['improvementPlan']}",
    ]), 10)


def page4(doc: fitz.Document, cfg: dict):
    page = doc.new_page(width=A4[0], height=A4[1])
    left, right = fitz.Rect(MARGIN, 36, 332, 800), fitz.Rect(350, 36, 559, 800)
    box(page, left, "8. 향후 진행공정 위험요인 및 안전대책")
    y = 68
    for index, item in enumerate(cfg["doc8Plans"], start=1):
        text(page, fitz.Rect(48, y, 320, y + 140), "\n".join([
            f"[{index}] 공정: {item['processName']}",
            f"위험요인: {item['hazard']}",
            f"대책: {item['countermeasure']}",
            f"비고: {item.get('note', '')}",
        ]), 9)
        y += 170
    box(page, right, "10. 계측점검")
    m = cfg["doc10Measurements"][0]
    image(page, fitz.Rect(366, 74, 543, 310), m["photoPath"], "계측 사진")
    text(page, fitz.Rect(366, 332, 543, 520), "\n".join([
        f"기기: {m['instrumentType']}",
        f"위치: {m['measurementLocation']}",
        f"측정값: {m['measuredValue']}",
        f"기준: {m['safetyCriteria']}",
        f"조치: {m['actionTaken']}",
    ]), 9)


def page5(doc: fitz.Document, cfg: dict):
    page = doc.new_page(width=A4[0], height=A4[1])
    top, bottom = fitz.Rect(MARGIN, 36, A4[0] - MARGIN, 375), fitz.Rect(MARGIN, 405, A4[0] - MARGIN, 800)
    box(page, top, "11. 안전교육")
    edu = cfg["doc11EducationRecords"][0]
    image(page, fitz.Rect(54, 74, 250, 270), edu["photoPath"], "교육 자료")
    text(page, fitz.Rect(272, 82, 541, 270), "\n".join([
        f"참석인원: {edu['attendeeCount']}",
        f"주제: {edu['topic']}",
        f"내용: {edu['content']}",
    ]), 10)
    box(page, bottom, "12. 활동 실적")
    act = cfg["doc12Activities"][0]
    image(page, fitz.Rect(54, 445, 250, 650), act["photoPath"], "정리정돈 지도")
    image(page, fitz.Rect(272, 445, 468, 650), act["photoPath2"], "작업 전 점검")
    text(page, fitz.Rect(54, 670, 541, 770), f"활동유형: {act['activityType']}\n내용: {act['content']}", 10)


def main():
    parser = argparse.ArgumentParser(description="Build a local-layout technical-guidance sample PDF from photo config.")
    parser.add_argument("--config", required=True)
    parser.add_argument("--output")
    args = parser.parse_args()
    cfg_path = Path(args.config).expanduser().resolve()
    cfg = load(cfg_path)
    out = Path(args.output).expanduser().resolve() if args.output else (Path(cfg["outDir"]).resolve() / "photo-sample-report.local-layout.pdf")
    out.parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open()
    page1(doc, cfg)
    page2(doc, cfg)
    page3(doc, cfg)
    page4(doc, cfg)
    page5(doc, cfg)
    doc.save(out)
    manifest = {"configPath": str(cfg_path), "outputPdf": str(out), "pageCount": len(doc), "sourcePhotos": 11}
    (out.parent / "photo-sample-report.local-layout.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
