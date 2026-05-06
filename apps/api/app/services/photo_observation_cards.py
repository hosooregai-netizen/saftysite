from __future__ import annotations

from datetime import datetime
from typing import Any


def _safe_text(value: object) -> str:
    return str(value or "").strip()


def _normalize_hint(photo: dict[str, Any]) -> str:
    location_hint = _safe_text(photo.get("location_hint"))
    filename = _safe_text(photo.get("filename"))
    return f"{location_hint} {filename}".lower()


def _infer_overview_process_structured(photo: dict[str, Any]) -> dict[str, Any]:
    combined = _normalize_hint(photo)
    if "굴착" in combined or "터파기" in combined:
        return {
            "majorProcess": "기초 및 토공사",
            "detailProcess": "굴착 작업",
            "confidence": 0.82,
        }
    if "철골" in combined:
        return {
            "majorProcess": "골조공사",
            "detailProcess": "철골 조립",
            "confidence": 0.8,
        }
    if "패널" in combined or "외장" in combined:
        return {
            "majorProcess": "외부 마감공사",
            "detailProcess": "외장 패널 취부",
            "confidence": 0.78,
        }
    if "지붕" in combined or "방수" in combined:
        return {
            "majorProcess": "지붕공사",
            "detailProcess": "방수 및 지붕 작업",
            "confidence": 0.76,
        }
    return {
        "majorProcess": "확인 필요",
        "detailProcess": "현재 공정 점검",
        "confidence": 0.58,
    }


def _infer_overview_risk_structured(
    photo: dict[str, Any],
    process: dict[str, Any],
) -> dict[str, Any]:
    combined = _normalize_hint(photo)
    location_text = _safe_text(photo.get("location_hint")) or "향후 작업구간 확인 필요"
    major_process = _safe_text(process.get("majorProcess"))
    detail_process = _safe_text(process.get("detailProcess"))

    if "굴착" in combined or major_process == "기초 및 토공사":
        return {
            "locationText": location_text,
            "accidentType": "붕괴",
            "causativeAgent": "굴착 사면 및 장비 작업반경",
            "hazardSummary": "향후 굴착부 주변 접근 및 사면 붕괴 위험 검토 필요",
            "recommendedActionKey": "EXCAVATION_COLLAPSE_ACCESS",
            "riskLevel": "중",
            "confidence": 0.78,
        }
    if "철골" in combined or detail_process == "철골 조립":
        return {
            "locationText": location_text,
            "accidentType": "추락",
            "causativeAgent": "철골 작업발판 및 외곽 단부",
            "hazardSummary": "향후 철골 조립 및 외곽부 작업 시 추락 위험 검토 필요",
            "recommendedActionKey": "STEEL_FRAME_FALL_PROTECTION",
            "riskLevel": "중",
            "confidence": 0.8,
        }
    if "패널" in combined or "외장" in combined or detail_process == "외장 패널 취부":
        return {
            "locationText": location_text,
            "accidentType": "추락",
            "causativeAgent": "외곽 작업부 및 이동식 작업발판",
            "hazardSummary": "향후 외장 패널 취부 작업 시 외곽부 추락 위험 검토 필요",
            "recommendedActionKey": "EXTERIOR_PANEL_EDGE_FALL",
            "riskLevel": "중",
            "confidence": 0.77,
        }
    if "지붕" in combined or "방수" in combined or major_process == "지붕공사":
        return {
            "locationText": location_text,
            "accidentType": "추락",
            "causativeAgent": "지붕 단부 및 채광창",
            "hazardSummary": "향후 지붕 및 방수 작업 시 단부·개구부 추락 위험 검토 필요",
            "recommendedActionKey": "ROOF_EDGE_FALL_PROTECTION",
            "riskLevel": "중",
            "confidence": 0.75,
        }
    return {
        "locationText": location_text,
        "accidentType": "확인 필요",
        "causativeAgent": "",
        "hazardSummary": "현재 공정 사진만으로 향후 진행공정 위험요인 추가 확인 필요",
        "recommendedActionKey": "",
        "riskLevel": "확인 필요",
        "confidence": 0.44,
    }


def _infer_hazard_risk_structured(photo: dict[str, Any]) -> dict[str, Any]:
    combined = _normalize_hint(photo)
    location_text = _safe_text(photo.get("location_hint")) or "확인 필요 위치"
    if "개구부" in combined or "난간" in combined or "발판" in combined:
        return {
            "locationText": location_text,
            "accidentType": "추락",
            "causativeAgent": "단부 및 개구부",
            "hazardSummary": "개구부 및 작업발판 주변 추락 위험",
            "recommendedActionKey": "OPENING_FALL_COVER",
            "riskLevel": "상",
            "confidence": 0.86,
        }
    if "인양" in combined or "자재" in combined or "크레인" in combined:
        return {
            "locationText": location_text,
            "accidentType": "낙하",
            "causativeAgent": "인양 자재 및 크레인",
            "hazardSummary": "인양 자재 하부 접근에 따른 충돌·낙하 위험",
            "recommendedActionKey": "LIFTING_STRUCK_BY_LOAD",
            "riskLevel": "중",
            "confidence": 0.82,
        }
    if "굴착" in combined:
        return {
            "locationText": location_text,
            "accidentType": "붕괴",
            "causativeAgent": "굴착 사면 및 장비 작업반경",
            "hazardSummary": "굴착부 주변 접근 및 붕괴 위험",
            "recommendedActionKey": "EXCAVATION_COLLAPSE_ACCESS",
            "riskLevel": "중",
            "confidence": 0.8,
        }
    return {
        "locationText": location_text,
        "accidentType": "확인 필요",
        "causativeAgent": "",
        "hazardSummary": "사진 기반 현존 위험요인 추가 확인 필요",
        "recommendedActionKey": "",
        "riskLevel": "확인 필요",
        "confidence": 0.46,
    }


def build_photo_observation_cards(
    report_id: str,
    overview_photos: list[dict[str, Any]],
    hazard_photos: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    created_at = datetime.utcnow().replace(microsecond=0).isoformat() + "Z"

    for index, photo in enumerate(overview_photos, start=1):
        process = _infer_overview_process_structured(photo)
        risk = _infer_overview_risk_structured(photo, process)
        cards.append(
            {
                "id": f"obs-overview-{index}",
                "reportId": report_id,
                "photoAssetId": photo["id"],
                "photoRole": "step1_overview",
                "observedProcess": str(process["detailProcess"] or process["majorProcess"]),
                "observedRisk": str(risk["hazardSummary"]),
                "observedProcessStructured": process,
                "observedRiskStructured": risk,
                "rawAiNotes": "사진에서 확인 가능한 현재 공정과 향후 위험 후보를 구조화함",
                "confidence": round(min(float(process["confidence"]), float(risk["confidence"])), 2),
                "needsHumanReview": True,
                "createdAt": created_at,
            }
        )

    for index, photo in enumerate(hazard_photos, start=1):
        risk = _infer_hazard_risk_structured(photo)
        cards.append(
            {
                "id": f"obs-hazard-{index}",
                "reportId": report_id,
                "photoAssetId": photo["id"],
                "photoRole": "step2_hazard",
                "observedProcess": "현재 위험요인 점검",
                "observedRisk": str(risk["hazardSummary"]),
                "observedRiskStructured": risk,
                "rawAiNotes": "행정 사실값 없이 위험장소/재해유형/기인물을 구조화함",
                "confidence": float(risk["confidence"]),
                "needsHumanReview": True,
                "createdAt": created_at,
            }
        )

    return cards
