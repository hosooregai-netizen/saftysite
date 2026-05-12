from __future__ import annotations

from typing import Any


def _safe_text(value: object) -> str:
    return str(value or "").strip()


def _sentence(value: str) -> str:
    text = _safe_text(value).rstrip(".。")
    if not text:
        return ""
    if text.endswith(("다", "요", "음", "함", "것", "필요")):
        return text
    return f"{text}"


def _is_unknown(value: object) -> bool:
    text = _safe_text(value)
    return not text or "확인 필요" in text


def _natural_location(location: str) -> str:
    return "현장 해당 작업구간" if _is_unknown(location) else _safe_text(location)


def _natural_accident(accident_type: str) -> str:
    text = _safe_text(accident_type)
    if not text or text == "확인 필요":
        return "재해"
    if text == "떨어짐":
        return "추락"
    return text


def compose_section4_hazard_text(
    *,
    location: str,
    hazard: str,
    accident_type: str,
    causative_agent: str = "",
) -> str:
    location_text = _natural_location(location)
    hazard_text = _sentence(hazard) or "사진 기반 위험요인"
    accident_text = _natural_accident(accident_type)
    agent_text = _safe_text(causative_agent)
    if agent_text and agent_text not in hazard_text:
        return f"{location_text}에서 {agent_text} 관련 {hazard_text}가 확인되어 {accident_text} 재해 위험이 있음"
    return f"{location_text}에서 {hazard_text}가 확인되어 {accident_text} 재해 위험이 있음"


def compose_section4_improvement_plan(
    *,
    location: str,
    hazard: str,
    accident_type: str,
    guidance: str,
) -> str:
    location_text = _natural_location(location)
    hazard_text = _sentence(hazard) or "해당 위험요인"
    accident_text = _natural_accident(accident_type)
    guidance_text = _sentence(guidance) or "현장 확인 후 적정 안전조치를 이행"
    if guidance_text.startswith("확인 필요"):
        return f"{location_text}의 {hazard_text}에 대해 {guidance_text}"
    return f"{location_text}의 {hazard_text}로 인한 {accident_text} 재해를 예방하기 위해 {guidance_text}"


def compose_section5_hazard(*, process_name: str, hazard: str) -> str:
    process_text = _safe_text(process_name) or "향후 진행공정"
    hazard_text = _sentence(hazard) or "유해·위험요인"
    if "확인 필요" in process_text:
        return f"향후 진행공정 작업 시 위험요인으로 {hazard_text}이 예상되므로 현장 확인 필요"
    return f"향후 {process_text} 작업 시 위험요인으로 {hazard_text}이 예상되므로 사전 점검 필요"


def compose_section5_countermeasure(
    *,
    process_name: str,
    hazard: str,
    countermeasure: str,
) -> str:
    process_text = _safe_text(process_name) or "향후 진행공정"
    hazard_text = _sentence(hazard) or "유해·위험요인"
    countermeasure_text = _sentence(countermeasure) or "현장 여건에 맞는 예방대책을 수립"
    if countermeasure_text.startswith("확인 필요"):
        return f"{process_text}의 {hazard_text}에 대해 {countermeasure_text}"
    return f"{process_text}의 {hazard_text} 예방을 위해 {countermeasure_text}"


def review_reason_for_observation(observation: dict[str, Any], *, confidence: float) -> str:
    risk = observation.get("observedRiskStructured")
    risk = risk if isinstance(risk, dict) else {}
    reasons = list(observation.get("reviewReasons") or [])
    if _is_unknown(risk.get("locationText")):
        return "위험장소가 불명확하여 위치 확인이 필요합니다."
    if _safe_text(risk.get("accidentType")) == "확인 필요":
        return "재해형태가 불명확하여 현장 확인이 필요합니다."
    if _is_unknown(risk.get("causativeAgent")):
        return "기인물이 불명확하여 현장 확인이 필요합니다."
    if confidence < 0.75:
        return "사진 판독 신뢰도가 낮아 위험요인과 조치 우선순위 확인이 필요합니다."
    if reasons:
        return _safe_text(reasons[0])
    return "AI 관찰카드 확인이 필요합니다."


def review_reason_for_finding(finding: dict[str, Any]) -> str:
    if _is_unknown(finding.get("location")):
        return "위험장소가 불명확하여 위치 확인이 필요합니다."
    if not _safe_text(finding.get("standardRiskRuleId")):
        return "표준 위험 규칙 후보가 불명확하여 지적사항 확인이 필요합니다."
    return "지적사항 초안은 현장 여건 확인 후 확정이 필요합니다."


def review_reason_for_plan(plan: dict[str, Any]) -> str:
    if _is_unknown(plan.get("processName")):
        return "향후 진행공정이 불명확하여 공정명 확인이 필요합니다."
    if not _safe_text(plan.get("standardRiskRuleId")):
        return "표준 위험 규칙 후보가 불명확하여 예방대책 확인이 필요합니다."
    return "향후 공정 예방대책은 실제 작업계획 확인 후 확정이 필요합니다."


def _education_topic(source: dict[str, Any], observations: list[dict[str, Any]]) -> str:
    for observation_id in list(source.get("photoObservationIds") or []):
        observation = next(
            (
                item
                for item in observations
                if _safe_text(item.get("id")) == _safe_text(observation_id)
            ),
            None,
        )
        if not observation:
            continue
        ai_text = observation.get("aiText") if isinstance(observation.get("aiText"), dict) else {}
        topic = _safe_text(ai_text.get("educationTopic"))
        if topic:
            return topic
    hazard = _safe_text(source.get("hazardDescription")) or _safe_text(source.get("hazard"))
    if "사다리" in hazard:
        return "사다리 작업 추락·전도 예방 교육"
    if "철근" in hazard:
        return "철근 돌출부 찔림·넘어짐 예방 교육"
    if "개구부" in hazard or "단부" in hazard:
        return "단부·개구부 추락방지 교육"
    return "현장 위험요인별 안전조치 교육"


def compose_section6_drafts(
    *,
    source: dict[str, Any],
    photo_observations: list[dict[str, Any]],
) -> dict[str, Any]:
    hazard = _safe_text(source.get("hazardDescription")) or _safe_text(source.get("hazard"))
    countermeasure = _safe_text(source.get("improvementPlan")) or _safe_text(source.get("countermeasure"))
    location = _safe_text(source.get("location"))
    photo_observation_ids = list(source.get("photoObservationIds") or [])
    evidence_photo_ids = list(source.get("linkedPhotoIds") or source.get("evidencePhotoIds") or [])
    confidence = min(float(source.get("confidence") or 0.65), 0.74)
    topic = _education_topic(source, photo_observations)
    location_prefix = f"{_natural_location(location)}의 " if location else ""
    hazard_text = hazard or "사진에서 확인된 위험요인"
    countermeasure_text = countermeasure or "필요 안전조치"
    education_content = (
        f"{location_prefix}{hazard_text}에 대해 재해유형, 기인물, 작업 전 점검사항, "
        f"{countermeasure_text} 이행 방법을 근로자에게 안내 필요"
    )
    support_content = (
        f"{location_prefix}{hazard_text} 관련 안전조치 이행 상태를 현장에서 재점검하고, "
        f"{countermeasure_text}가 작업 전 유지되도록 관리감독자에게 보완 안내 필요"
    )
    memo_body = (
        f"{hazard_text} 관련 사진 기반 초안입니다. 교육 참석인원, 실제 조치일자, "
        "현장 적용 여부는 담당자가 확인 후 확정 필요"
    )
    return {
        "doc11": [
            {
                "topic": topic,
                "attendeeCount": "확인 필요",
                "content": education_content,
                "confidence": confidence,
                "photoObservationIds": photo_observation_ids,
                "evidencePhotoIds": evidence_photo_ids,
                "needsReview": True,
            }
        ],
        "doc12": [
            {
                "activityType": "위험요인 안전조치 이행 지원",
                "content": support_content,
                "confidence": confidence,
                "photoObservationIds": photo_observation_ids,
                "evidencePhotoIds": evidence_photo_ids,
                "needsReview": True,
            }
        ],
        "doc14": {
            "title": "AI 초안 확인 메모",
            "body": memo_body,
            "confidence": confidence,
            "photoObservationIds": photo_observation_ids,
            "evidencePhotoIds": evidence_photo_ids,
            "needsReview": True,
        },
    }
