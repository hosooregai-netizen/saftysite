from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

import httpx

from ..config import (
    AI_VISION_ENABLED,
    AI_VISION_FALLBACK_ENABLED,
    OPENAI_API_KEY,
    OPENAI_CHAT_MODEL,
)


OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions"

_ACTION_KEY_BY_CAUSATIVE_KEY = {
    "ladder": "LADDER_FALL_PREVENTION",
    "portable_ladder": "LADDER_FALL_PREVENTION",
    "rebar": "REBAR_IMPALEMENT_PREVENTION",
    "opening": "OPENING_FALL_COVER",
    "temporary_structure": "OPENING_FALL_COVER",
    "aerial_lift": "AERIAL_LIFT_FALL_PREVENTION",
    "temporary_power": "TEMPORARY_POWER_ELECTRIC_SHOCK",
    "compressor": "COMPRESSOR_HOSE_TRIP_PRESSURE",
    "housekeeping": "HOUSEKEEPING_TRIP_FALL",
    "material_stack": "MATERIAL_STACK_COLLAPSE",
    "grinder": "GRINDER_CUTTING_INJURY",
    "welding_equipment": "WELDING_FIRE_PREVENTION",
}


def _safe_text(value: object) -> str:
    return str(value or "").strip()


def _as_float(value: object, fallback: float = 0.0) -> float:
    try:
        return max(0.0, min(float(value), 1.0))
    except (TypeError, ValueError):
        return fallback


def _as_list(value: object) -> list[str]:
    if isinstance(value, list):
        return [_safe_text(item) for item in value if _safe_text(item)]
    if _safe_text(value):
        return [_safe_text(value)]
    return []


def _as_visual_objects(value: object) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not isinstance(value, list):
        return rows
    for item in value:
        if isinstance(item, dict):
            label = _safe_text(item.get("label") or item.get("name") or item.get("object"))
            if not label:
                continue
            rows.append(
                {
                    "label": label,
                    "category": _safe_text(item.get("category")),
                    "confidence": _as_float(item.get("confidence"), 0.5),
                }
            )
            continue
        label = _safe_text(item)
        if label:
            rows.append({"label": label, "category": "vision", "confidence": 0.5})
    return rows


def _extract_json_object(text: str) -> dict[str, Any] | None:
    normalized = text.strip()
    try:
        parsed = json.loads(normalized)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        start = normalized.find("{")
        end = normalized.rfind("}")
        if start < 0 or end <= start:
            return None
        try:
            parsed = json.loads(normalized[start : end + 1])
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None


def _assistant_content(payload: dict[str, Any]) -> str:
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return ""
    message = choices[0].get("message") if isinstance(choices[0], dict) else {}
    content = message.get("content") if isinstance(message, dict) else ""
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        return "\n".join(
            _safe_text(part.get("text")) for part in content if isinstance(part, dict)
        ).strip()
    return ""


def _default_card(report_id: str, photo: dict[str, Any], role: str) -> dict[str, Any]:
    created_at = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    photo_id = _safe_text(photo.get("id")) or _safe_text(photo.get("photoAssetId")) or "photo"
    return {
        "id": f"obs-{role}-{photo_id}",
        "reportId": report_id,
        "photoAssetId": photo_id,
        "photoRole": role,
        "observedProcess": "확인 필요 공정",
        "observedRisk": "사진 기반 위험요인 확인 필요",
        "observedProcessStructured": {
            "majorProcess": "확인 필요",
            "detailProcess": "현재 공정 점검",
            "confidence": 0.35,
        },
        "observedRiskStructured": {
            "locationText": _safe_text(photo.get("location_hint")) or "확인 필요 위치",
            "accidentType": "확인 필요",
            "causativeAgent": "",
            "causativeAgentKey": "",
            "hazardSummary": "사진 기반 위험요인 확인 필요",
            "recommendedActionKey": "",
            "riskLevel": "확인 필요",
            "confidence": 0.35,
        },
        "visualObjects": [],
        "workContext": {
            "majorProcess": "확인 필요",
            "detailProcess": "현재 공정 점검",
            "locationText": _safe_text(photo.get("location_hint")) or "확인 필요 위치",
            "confidence": 0.35,
        },
        "riskContext": {
            "accidentType": "확인 필요",
            "causativeAgent": "",
            "causativeAgentKey": "",
            "hazardSummary": "사진 기반 위험요인 확인 필요",
            "unsafeCondition": "",
            "unsafeBehavior": "",
            "riskLevel": "확인 필요",
            "confidence": 0.35,
        },
        "standardMapping": {
            "ruleKey": "",
            "matchScore": 0.0,
            "matchedBy": [],
            "fallbackReason": "Vision 분석 전 fallback 관찰카드입니다.",
        },
        "aiText": {
            "section4Finding": "사진 기반 위험요인 확인 필요",
            "section5Plan": "현장 확인 후 예방대책을 선택해 주세요.",
            "locationCandidate": _safe_text(photo.get("location_hint")) or "확인 필요 위치",
            "hazardDescription": "사진 기반 위험요인 확인 필요",
            "improvementPlan": "현장 확인 후 표준 위험요인과 개선대책을 확정해 주세요.",
            "preventiveMeasure": "현장 확인 후 예방대책을 선택해 주세요.",
            "educationTopic": "사진 기반 안전교육 주제 확인",
            "supportMemo": "사진 기반 지원사항 확인 필요",
        },
        "rawAiNotes": "Vision 분석을 수행하지 못해 fallback 관찰카드를 생성했습니다.",
        "confidence": 0.35,
        "needsHumanReview": True,
        "reviewReasons": ["Vision 분석 전 fallback 결과로 현장 확인이 필요합니다."],
        "createdAt": created_at,
    }


def _merge_vision_payload(
    fallback_card: dict[str, Any],
    vision: dict[str, Any],
) -> dict[str, Any]:
    work_context = vision.get("workContext") if isinstance(vision.get("workContext"), dict) else {}
    risk_context = vision.get("riskContext") if isinstance(vision.get("riskContext"), dict) else {}
    ai_text = vision.get("aiText") if isinstance(vision.get("aiText"), dict) else {}
    visual_objects = _as_visual_objects(vision.get("visualObjects"))

    major_process = _safe_text(work_context.get("majorProcess")) or _safe_text(
        fallback_card.get("workContext", {}).get("majorProcess")
    ) or "확인 필요"
    detail_process = _safe_text(work_context.get("detailProcess")) or _safe_text(
        fallback_card.get("workContext", {}).get("detailProcess")
    ) or "현재 공정 점검"
    location_text = _safe_text(work_context.get("locationText")) or _safe_text(
        risk_context.get("locationText")
    ) or _safe_text(fallback_card.get("workContext", {}).get("locationText"))
    work_confidence = _as_float(work_context.get("confidence"), 0.5)

    accident_type = _safe_text(risk_context.get("accidentType")) or "확인 필요"
    causative_agent = _safe_text(risk_context.get("causativeAgent"))
    causative_agent_key = _safe_text(risk_context.get("causativeAgentKey"))
    hazard_summary = _safe_text(risk_context.get("hazardSummary")) or _safe_text(
        ai_text.get("hazardDescription")
    ) or _safe_text(fallback_card.get("observedRisk"))
    risk_level = _safe_text(risk_context.get("riskLevel")) or "확인 필요"
    risk_confidence = _as_float(risk_context.get("confidence"), 0.5)
    rule_key = _safe_text(vision.get("standardMapping", {}).get("ruleKey")) if isinstance(vision.get("standardMapping"), dict) else ""
    action_key = rule_key or _ACTION_KEY_BY_CAUSATIVE_KEY.get(causative_agent_key, "")
    confidence = round(min(work_confidence, risk_confidence), 2)
    review_reasons = _as_list(vision.get("reviewReasons"))
    if confidence < 0.75:
        review_reasons.append("Vision confidence가 낮아 현장 확인이 필요합니다.")
    if not action_key:
        review_reasons.append("표준 위험 규칙 후보가 불명확합니다.")

    merged = {
        **fallback_card,
        "visualObjects": visual_objects or _as_visual_objects(fallback_card.get("visualObjects")),
        "workContext": {
            "majorProcess": major_process,
            "detailProcess": detail_process,
            "locationText": location_text,
            "confidence": work_confidence,
        },
        "riskContext": {
            "accidentType": accident_type,
            "causativeAgent": causative_agent,
            "causativeAgentKey": causative_agent_key,
            "hazardSummary": hazard_summary,
            "unsafeCondition": _safe_text(risk_context.get("unsafeCondition")),
            "unsafeBehavior": _safe_text(risk_context.get("unsafeBehavior")),
            "riskLevel": risk_level,
            "confidence": risk_confidence,
        },
        "standardMapping": {
            "ruleKey": action_key,
            "matchScore": _as_float(
                vision.get("standardMapping", {}).get("matchScore"),
                confidence,
            )
            if isinstance(vision.get("standardMapping"), dict)
            else confidence,
            "matchedBy": _as_list(vision.get("standardMapping", {}).get("matchedBy"))
            if isinstance(vision.get("standardMapping"), dict)
            else ["vision"],
            "fallbackReason": "",
        },
        "aiText": {
            "section4Finding": _safe_text(ai_text.get("section4Finding"))
            or _safe_text(ai_text.get("hazardDescription"))
            or hazard_summary,
            "section5Plan": _safe_text(ai_text.get("section5Plan"))
            or _safe_text(ai_text.get("preventiveMeasure"))
            or _safe_text(ai_text.get("improvementPlan")),
            "locationCandidate": _safe_text(ai_text.get("locationCandidate")) or location_text,
            "hazardDescription": _safe_text(ai_text.get("hazardDescription")) or hazard_summary,
            "improvementPlan": _safe_text(ai_text.get("improvementPlan")),
            "preventiveMeasure": _safe_text(ai_text.get("preventiveMeasure")),
            "educationTopic": _safe_text(ai_text.get("educationTopic")),
            "supportMemo": _safe_text(ai_text.get("supportMemo")),
        },
        "observedProcess": detail_process or major_process,
        "observedRisk": hazard_summary,
        "observedProcessStructured": {
            "majorProcess": major_process,
            "detailProcess": detail_process,
            "confidence": work_confidence,
        },
        "observedRiskStructured": {
            "locationText": location_text,
            "accidentType": accident_type,
            "causativeAgent": causative_agent,
            "causativeAgentKey": causative_agent_key,
            "hazardSummary": hazard_summary,
            "recommendedActionKey": action_key,
            "riskLevel": risk_level,
            "confidence": risk_confidence,
        },
        "rawAiNotes": "OpenAI Vision 기반 관찰카드",
        "confidence": confidence,
        "needsHumanReview": bool(review_reasons),
        "reviewReasons": review_reasons,
    }
    return merged


def _mark_fallback(card: dict[str, Any], reason: str) -> dict[str, Any]:
    reasons = _as_list(card.get("reviewReasons"))
    if reason and reason not in reasons:
        reasons.append(reason)
    standard_mapping = card.get("standardMapping")
    if not isinstance(standard_mapping, dict):
        standard_mapping = {}
    fallback_reason = _safe_text(standard_mapping.get("fallbackReason")) or reason
    return {
        **card,
        "needsHumanReview": True,
        "reviewReasons": reasons or [reason],
        "standardMapping": {
            "ruleKey": standard_mapping.get("ruleKey"),
            "matchScore": _as_float(standard_mapping.get("matchScore"), 0.0),
            "matchedBy": _as_list(standard_mapping.get("matchedBy")),
            "fallbackReason": fallback_reason,
        },
    }


def extract_photo_observation_with_vision(
    *,
    report_id: str,
    photo: dict[str, Any],
    role: str,
    report_meta: dict[str, Any],
    standard_context: dict[str, Any],
    fallback_card: dict[str, Any] | None = None,
) -> dict[str, Any]:
    card = fallback_card or _default_card(report_id, photo, role)
    if not AI_VISION_FALLBACK_ENABLED:
        return card
    if not AI_VISION_ENABLED:
        return _mark_fallback(card, "AI_VISION_ENABLED가 꺼져 있어 keyword fallback을 사용했습니다.")
    if not OPENAI_API_KEY:
        return _mark_fallback(card, "OPENAI_API_KEY가 없어 keyword fallback을 사용했습니다.")

    data_url = _safe_text(photo.get("data_url")) or _safe_text(photo.get("imageUrl"))
    if not data_url:
        return _mark_fallback(card, "분석 가능한 image data_url이 없어 keyword fallback을 사용했습니다.")

    system_prompt = """
너는 건설현장 기술지도 보고서용 사진 분석기다.
반드시 JSON 하나만 반환한다. 없는 정보는 만들지 말고 confidence를 낮춘다.
사진에서 보이는 객체, 공정, 위험요인, 재해형태, 기인물, 개선대책, 교육/지원 메모를 구조화한다.
사고유형은 추락, 낙하, 충돌, 붕괴, 감전, 화재, 협착, 전도, 확인 필요 중 하나로 고른다.
기본 기인물 key 후보는 ladder, rebar, opening, aerial_lift, temporary_power, compressor, housekeeping, material_stack, grinder, welding_equipment 중에서 고른다.
응답 필드는 visualObjects, workContext, riskContext, aiText, standardMapping, reviewReasons만 사용한다.
""".strip()
    user_text = {
        "photoRole": role,
        "filename": photo.get("filename", ""),
        "locationHint": photo.get("location_hint", ""),
        "reportMeta": report_meta,
        "standardContext": standard_context,
    }

    try:
        response = httpx.post(
            OPENAI_CHAT_COMPLETIONS_URL,
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": OPENAI_CHAT_MODEL,
                "temperature": 0.1,
                "max_tokens": 900,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": json.dumps(user_text, ensure_ascii=False),
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": data_url},
                            },
                        ],
                    },
                ],
            },
            timeout=45,
        )
        response.raise_for_status()
        payload = response.json()
    except Exception as exc:  # pragma: no cover - live network path
        return _mark_fallback(card, f"Vision 요청 실패로 keyword fallback을 사용했습니다: {exc}")

    parsed = _extract_json_object(_assistant_content(payload))
    if parsed is None:
        return _mark_fallback(card, "Vision 응답을 JSON으로 해석하지 못해 keyword fallback을 사용했습니다.")
    return _merge_vision_payload(card, parsed)
