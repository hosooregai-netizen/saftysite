from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from .vision_photo_extractor import extract_photo_observation_with_vision


def _safe_text(value: object) -> str:
    return str(value or "").strip()


def _normalize_hint(photo: dict[str, Any]) -> str:
    location_hint = _safe_text(photo.get("location_hint"))
    filename = _safe_text(photo.get("filename"))
    return f"{location_hint} {filename}".lower()


def _contains_any(text: str, keywords: list[str]) -> bool:
    return any(keyword.lower() in text for keyword in keywords)


def _risk_ai_text(risk: dict[str, Any]) -> dict[str, str]:
    location = _safe_text(risk.get("locationText")) or "확인 필요 위치"
    hazard = _safe_text(risk.get("hazardSummary")) or "사진 기반 위험요인 확인 필요"
    action = _safe_text(risk.get("standardAction")) or "현장 확인 후 적정 안전조치 이행 여부를 점검"
    education = _safe_text(risk.get("educationTopic")) or "사진 기반 위험요인 안전교육"
    return {
        "section4Finding": hazard,
        "section5Plan": action,
        "locationCandidate": location,
        "hazardDescription": hazard,
        "improvementPlan": action,
        "preventiveMeasure": action,
        "educationTopic": education,
        "supportMemo": f"{location}의 {hazard}에 대한 안전조치 이행 여부 재점검 안내",
    }


def _visual_objects_from_risk(risk: dict[str, Any]) -> list[dict[str, Any]]:
    objects = [
        _safe_text(risk.get("causativeAgent")),
        _safe_text(risk.get("locationText")),
    ]
    return [
        {
            "label": item,
            "category": "risk_context",
            "confidence": float(risk.get("confidence") or 0.0),
        }
        for item in objects
        if item and "확인 필요" not in item
    ]


def _review_reasons_for_card(
    *,
    risk: dict[str, Any],
    confidence: float,
    has_rule_hint: bool,
) -> list[str]:
    reasons: list[str] = []
    if confidence < 0.75:
        reasons.append("AI 관찰 confidence가 낮아 현장 확인이 필요합니다.")
    if not has_rule_hint:
        reasons.append("표준 위험 규칙 후보가 불명확합니다.")
    if "확인 필요" in _safe_text(risk.get("locationText")):
        reasons.append("위험장소가 불명확합니다.")
    if _safe_text(risk.get("accidentType")) == "확인 필요":
        reasons.append("재해형태가 불명확합니다.")
    return reasons


def _infer_overview_process_structured(photo: dict[str, Any]) -> dict[str, Any]:
    combined = _normalize_hint(photo)
    if _contains_any(combined, ["사다리", "ladder", "a형"]):
        return {
            "majorProcess": "내부 마감공사",
            "detailProcess": "사다리 사용 작업",
            "confidence": 0.78,
        }
    if _contains_any(combined, ["철근", "rebar", "배근"]):
        return {
            "majorProcess": "골조공사",
            "detailProcess": "철근 배근 및 돌출부 관리",
            "confidence": 0.76,
        }
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
    if _contains_any(combined, ["사다리", "ladder", "a형"]):
        return {
            "locationText": location_text,
            "accidentType": "추락",
            "causativeAgent": "이동식 사다리",
            "causativeAgentKey": "ladder",
            "hazardSummary": "이동식 사다리 사용 중 전도 및 추락 위험",
            "recommendedActionKey": "LADDER_FALL_PREVENTION",
            "riskLevel": "중",
            "confidence": 0.78,
            "standardAction": "사다리 전도방지 조치, 2인1조 작업 및 안전대 사용 상태 확인 필요",
            "educationTopic": "이동식 사다리 안전작업 교육",
        }
    if _contains_any(combined, ["철근", "rebar", "배근", "돌출"]):
        return {
            "locationText": location_text,
            "accidentType": "절단/베임/찔림",
            "causativeAgent": "돌출 철근",
            "causativeAgentKey": "rebar",
            "hazardSummary": "철근 돌출부 접촉에 따른 찔림 및 넘어짐 위험",
            "recommendedActionKey": "REBAR_IMPALEMENT_PREVENTION",
            "riskLevel": "중",
            "confidence": 0.76,
            "standardAction": "철근 돌출부 보호캡 설치, 통로 정리 및 접근통제 조치 확인 필요",
            "educationTopic": "철근 돌출부 찔림 예방 교육",
        }
    if _contains_any(combined, ["개구부", "난간", "발판", "opening", "단부"]):
        return {
            "locationText": location_text,
            "accidentType": "추락",
            "causativeAgent": "단부 및 개구부",
            "causativeAgentKey": "opening",
            "hazardSummary": "개구부 및 작업발판 주변 추락 위험",
            "recommendedActionKey": "OPENING_FALL_COVER",
            "riskLevel": "상",
            "confidence": 0.86,
            "standardAction": "개구부 덮개 고정, 안전난간 설치 및 위험표지 부착 상태 확인 필요",
            "educationTopic": "개구부 및 단부 추락방지 교육",
        }
    if _contains_any(combined, ["고소작업대", "리프트", "aerial", "lift"]):
        return {
            "locationText": location_text,
            "accidentType": "추락",
            "causativeAgent": "고소작업대",
            "causativeAgentKey": "aerial_lift",
            "hazardSummary": "고소작업대 사용 중 추락 및 협착 위험",
            "recommendedActionKey": "AERIAL_LIFT_FALL_PREVENTION",
            "riskLevel": "중",
            "confidence": 0.78,
            "standardAction": "고소작업대 난간, 안전대 체결, 바닥 지지상태 및 협착위험 구간 확인 필요",
            "educationTopic": "고소작업대 안전작업 교육",
        }
    if _contains_any(combined, ["전선", "분전", "전기", "케이블", "temporary power"]):
        return {
            "locationText": location_text,
            "accidentType": "감전",
            "causativeAgent": "가설전기 및 전선",
            "causativeAgentKey": "temporary_power",
            "hazardSummary": "가설전기 배선 손상 및 정리 미흡에 따른 감전 위험",
            "recommendedActionKey": "TEMPORARY_POWER_ELECTRIC_SHOCK",
            "riskLevel": "중",
            "confidence": 0.76,
            "standardAction": "누전차단기 작동상태, 배선 피복 손상 여부 및 전선 정리상태 확인 필요",
            "educationTopic": "가설전기 감전예방 교육",
        }
    if _contains_any(combined, ["컴프레서", "압축기", "호스", "compressor"]):
        return {
            "locationText": location_text,
            "accidentType": "전도",
            "causativeAgent": "공기압축기 및 호스",
            "causativeAgentKey": "compressor",
            "hazardSummary": "공기압축기 호스 방치에 따른 넘어짐 및 압력 위험",
            "recommendedActionKey": "COMPRESSOR_HOSE_TRIP_PRESSURE",
            "riskLevel": "중",
            "confidence": 0.74,
            "standardAction": "호스 정리, 압력장치 이상 여부 및 통로 확보 상태 확인 필요",
            "educationTopic": "공기압축기 및 호스 안전관리 교육",
        }
    if _contains_any(combined, ["적재", "자재더미", "materials", "stack"]):
        return {
            "locationText": location_text,
            "accidentType": "붕괴",
            "causativeAgent": "적재 자재",
            "causativeAgentKey": "material_stack",
            "hazardSummary": "자재 적재 불량에 따른 전도 및 붕괴 위험",
            "recommendedActionKey": "MATERIAL_STACK_COLLAPSE",
            "riskLevel": "중",
            "confidence": 0.75,
            "standardAction": "자재 적재높이, 받침, 결속 및 통로 분리 상태 확인 필요",
            "educationTopic": "자재 적재 및 정리정돈 안전교육",
        }
    if _contains_any(combined, ["그라인더", "연삭", "절단", "grinder"]):
        return {
            "locationText": location_text,
            "accidentType": "협착",
            "causativeAgent": "그라인더 및 절단기",
            "causativeAgentKey": "grinder",
            "hazardSummary": "그라인더 사용 중 절단·비산 및 접촉 위험",
            "recommendedActionKey": "GRINDER_CUTTING_INJURY",
            "riskLevel": "중",
            "confidence": 0.75,
            "standardAction": "방호덮개, 보안경, 불티비산 방지 및 작업자세 확인 필요",
            "educationTopic": "그라인더 절단작업 안전교육",
        }
    if _contains_any(combined, ["정리", "청소", "폐기물", "통로", "housekeeping"]):
        return {
            "locationText": location_text,
            "accidentType": "전도",
            "causativeAgent": "정리되지 않은 통로",
            "causativeAgentKey": "housekeeping",
            "hazardSummary": "통로 정리정돈 미흡에 따른 넘어짐 위험",
            "recommendedActionKey": "HOUSEKEEPING_TRIP_FALL",
            "riskLevel": "하",
            "confidence": 0.73,
            "standardAction": "통로 장애물 제거, 폐기물 정리 및 보행동선 확보 필요",
            "educationTopic": "정리정돈 및 보행통로 확보 교육",
        }
    if "인양" in combined or "자재" in combined or "크레인" in combined:
        return {
            "locationText": location_text,
            "accidentType": "낙하",
            "causativeAgent": "인양 자재 및 크레인",
            "causativeAgentKey": "lifting_load",
            "hazardSummary": "인양 자재 하부 접근에 따른 충돌·낙하 위험",
            "recommendedActionKey": "LIFTING_STRUCK_BY_LOAD",
            "riskLevel": "중",
            "confidence": 0.82,
            "standardAction": "인양 작업반경 내 출입통제, 신호수 배치 및 하부 접근금지 조치 확인 필요",
            "educationTopic": "양중작업 낙하물 예방 교육",
        }
    if "굴착" in combined:
        return {
            "locationText": location_text,
            "accidentType": "붕괴",
            "causativeAgent": "굴착 사면 및 장비 작업반경",
            "causativeAgentKey": "excavation_edge",
            "hazardSummary": "굴착부 주변 접근 및 붕괴 위험",
            "recommendedActionKey": "EXCAVATION_COLLAPSE_ACCESS",
            "riskLevel": "중",
            "confidence": 0.8,
            "standardAction": "굴착부 주변 출입통제, 사면 안정상태 및 장비 작업반경 확인 필요",
            "educationTopic": "굴착부 붕괴 및 장비접촉 예방 교육",
        }
    return {
        "locationText": location_text,
        "accidentType": "확인 필요",
        "causativeAgent": "",
        "causativeAgentKey": "",
        "hazardSummary": "사진 기반 현존 위험요인 추가 확인 필요",
        "recommendedActionKey": "",
        "riskLevel": "확인 필요",
        "confidence": 0.46,
    }


def build_photo_observation_cards(
    report_id: str,
    overview_photos: list[dict[str, Any]],
    hazard_photos: list[dict[str, Any]],
    *,
    report_meta: dict[str, Any] | None = None,
    standard_context: dict[str, Any] | None = None,
    use_vision: bool = True,
) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    created_at = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    report_meta = report_meta or {}
    standard_context = standard_context or {}

    for index, photo in enumerate(overview_photos, start=1):
        process = _infer_overview_process_structured(photo)
        risk = _infer_overview_risk_structured(photo, process)
        confidence = round(min(float(process["confidence"]), float(risk["confidence"])), 2)
        action_key = _safe_text(risk.get("recommendedActionKey"))
        review_reasons = _review_reasons_for_card(
            risk=risk,
            confidence=confidence,
            has_rule_hint=bool(action_key),
        )
        card = {
            "id": f"obs-overview-{index}",
            "reportId": report_id,
            "photoAssetId": photo["id"],
            "photoRole": "step1_overview",
            "observedProcess": str(process["detailProcess"] or process["majorProcess"]),
            "observedRisk": str(risk["hazardSummary"]),
            "observedProcessStructured": process,
            "observedRiskStructured": risk,
            "visualObjects": _visual_objects_from_risk(risk),
            "workContext": {
                "majorProcess": _safe_text(process.get("majorProcess")),
                "detailProcess": _safe_text(process.get("detailProcess")),
                "locationText": _safe_text(risk.get("locationText")),
                "confidence": float(process["confidence"]),
            },
            "riskContext": {
                "accidentType": _safe_text(risk.get("accidentType")),
                "causativeAgent": _safe_text(risk.get("causativeAgent")),
                "causativeAgentKey": _safe_text(risk.get("causativeAgentKey")),
                "hazardSummary": _safe_text(risk.get("hazardSummary")),
                "unsafeCondition": _safe_text(risk.get("standardAction")),
                "unsafeBehavior": "",
                "riskLevel": _safe_text(risk.get("riskLevel")),
                "confidence": float(risk["confidence"]),
            },
            "standardMapping": {
                "ruleKey": action_key,
                "matchScore": confidence,
                "matchedBy": ["keywordFallback"] if action_key else [],
                "fallbackReason": "" if action_key else "텍스트 힌트로 표준 위험 규칙을 확정하지 못했습니다.",
            },
            "aiText": _risk_ai_text(risk),
            "rawAiNotes": "사진에서 확인 가능한 현재 공정과 향후 위험 후보를 구조화함",
            "confidence": confidence,
            "needsHumanReview": bool(review_reasons),
            "reviewReasons": review_reasons,
            "createdAt": created_at,
        }
        cards.append(
            extract_photo_observation_with_vision(
                report_id=report_id,
                photo=photo,
                role="step1_overview",
                report_meta=report_meta,
                standard_context=standard_context,
                fallback_card=card,
            )
            if use_vision
            else card
        )

    for index, photo in enumerate(hazard_photos, start=1):
        risk = _infer_hazard_risk_structured(photo)
        action_key = _safe_text(risk.get("recommendedActionKey"))
        confidence = float(risk["confidence"])
        review_reasons = _review_reasons_for_card(
            risk=risk,
            confidence=confidence,
            has_rule_hint=bool(action_key),
        )
        card = {
            "id": f"obs-hazard-{index}",
            "reportId": report_id,
            "photoAssetId": photo["id"],
            "photoRole": "step2_hazard",
            "observedProcess": "현재 위험요인 점검",
            "observedRisk": str(risk["hazardSummary"]),
            "observedProcessStructured": {
                "majorProcess": "기타" if not action_key else "확인 필요",
                "detailProcess": "현재 위험요인 점검",
                "confidence": confidence,
            },
            "observedRiskStructured": risk,
            "visualObjects": _visual_objects_from_risk(risk),
            "workContext": {
                "majorProcess": "확인 필요",
                "detailProcess": "현재 위험요인 점검",
                "locationText": _safe_text(risk.get("locationText")),
                "confidence": confidence,
            },
            "riskContext": {
                "accidentType": _safe_text(risk.get("accidentType")),
                "causativeAgent": _safe_text(risk.get("causativeAgent")),
                "causativeAgentKey": _safe_text(risk.get("causativeAgentKey")),
                "hazardSummary": _safe_text(risk.get("hazardSummary")),
                "unsafeCondition": _safe_text(risk.get("standardAction")),
                "unsafeBehavior": "",
                "riskLevel": _safe_text(risk.get("riskLevel")),
                "confidence": confidence,
            },
            "standardMapping": {
                "ruleKey": action_key,
                "matchScore": confidence,
                "matchedBy": ["keywordFallback"] if action_key else [],
                "fallbackReason": "" if action_key else "텍스트 힌트로 표준 위험 규칙을 확정하지 못했습니다.",
            },
            "aiText": _risk_ai_text(risk),
            "rawAiNotes": "행정 사실값 없이 위험장소/재해유형/기인물을 구조화함",
            "confidence": confidence,
            "needsHumanReview": bool(review_reasons),
            "reviewReasons": review_reasons,
            "createdAt": created_at,
        }
        cards.append(
            extract_photo_observation_with_vision(
                report_id=report_id,
                photo=photo,
                role="step2_hazard",
                report_meta=report_meta,
                standard_context=standard_context,
                fallback_card=card,
            )
            if use_vision
            else card
        )

    return cards
