from __future__ import annotations

from typing import Any

from .photo_observation_cards import build_photo_observation_cards
from .standard_report_composer import compose_standard_report_draft
from .standard_risk_library import match_observations_to_risk_library


def _safe_text(value: object) -> str:
    return str(value or "").strip()


def _observed_process_label(observation: dict[str, Any]) -> str:
    structured = observation.get("observedProcessStructured")
    if isinstance(structured, dict):
        major = _safe_text(structured.get("majorProcess"))
        detail = _safe_text(structured.get("detailProcess"))
        if major and detail and major != "확인 필요":
            return f"{major} - {detail}"
        if detail:
            return detail
        if major:
            return major
    return _safe_text(observation.get("observedProcess")) or "확인 필요 공정"


def _observed_risk_label(observation: dict[str, Any]) -> str:
    structured = observation.get("observedRiskStructured")
    if isinstance(structured, dict):
        summary = _safe_text(structured.get("hazardSummary"))
        if summary:
            return summary
    return _safe_text(observation.get("observedRisk")) or "사진 기반 위험요인 확인 필요"


def _build_evidence_for_photo(
    report_id: str,
    photo: dict[str, Any],
    *,
    category: str,
    source_step: str,
    observation: dict[str, Any] | None,
    index: int,
) -> dict[str, Any]:
    risk_structured = (
        observation.get("observedRiskStructured")
        if isinstance(observation, dict) and isinstance(observation.get("observedRiskStructured"), dict)
        else {}
    )
    accident_candidates = []
    causative_candidates = []
    if risk_structured:
        accident_type = _safe_text(risk_structured.get("accidentType"))
        causative = _safe_text(risk_structured.get("causativeAgent"))
        if accident_type:
            accident_candidates.append(accident_type)
        if causative:
            causative_candidates.append(causative)

    return {
        "photoAssetId": photo["id"],
        "category": category,
        "sourceStep": source_step,
        "filename": photo.get("filename", ""),
        "imageUrl": photo.get("data_url", ""),
        "aiCategorySuggestion": category,
        "aiCategoryConfidence": float(observation.get("confidence") or 0) if observation else 0.5,
        "aiCategoryReason": "사진 단계와 구조화된 관찰카드를 기준으로 범주를 유지했습니다.",
        "sceneType": "construction-photo",
        "processType": _observed_process_label(observation or {}),
        "locationHint": _safe_text(risk_structured.get("locationText"))
        or _safe_text(photo.get("location_hint"))
        or f"{index}번 사진 작업구간",
        "ppeSignals": ["보호구 착용 상태 재확인 필요"],
        "hazardSignals": [_observed_risk_label(observation or {})],
        "accidentTypeCandidates": accident_candidates,
        "causativeAgentCandidates": causative_candidates,
        "measurementContext": "",
        "educationContext": "",
        "activityContext": "",
        "confidence": round(float(observation.get("confidence") or 0) if observation else 0.5, 2),
        "notes": f"{report_id} 사진 {index} 기반 구조화 관찰값",
    }


def _build_photo_observation_for_manual_photo(report_id: str, photo: dict[str, Any], index: int) -> dict[str, Any]:
    category = str(photo.get("category") or "")
    if category == "hazard":
        observations = build_photo_observation_cards(report_id, [], [photo])
        return observations[0]
    observations = build_photo_observation_cards(report_id, [photo], [])
    observation = observations[0]
    observation["id"] = f"obs-manual-{index}"
    return observation


def _build_observation_provenance(
    report_id: str,
    *,
    photo_observations: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    provenance: list[dict[str, Any]] = []
    for index, observation in enumerate(photo_observations):
        observation_id = observation.get("id") or f"observation:{index}"
        provenance.append(
            {
                "fieldPath": f"photoObservations[{index}]",
                "source": "AI_PHOTO",
                "sourceId": observation_id,
                "evidencePhotoIds": [observation.get("photoAssetId")],
                "photoObservationIds": [observation_id],
                "confidence": float(observation.get("confidence") or 0),
                "needsReview": bool(observation.get("needsHumanReview", True)),
                "note": f"{report_id} 사진 관찰카드 저장 결과",
            }
        )
    return provenance


def _compose_risk_library_draft(
    report_id: str,
    *,
    report_meta: dict[str, Any] | None,
    photo_observations: list[dict[str, Any]],
    photo_evidence: list[dict[str, Any]],
) -> dict[str, Any]:
    composed = compose_standard_report_draft(
        report_id,
        report_meta=report_meta or {},
        photo_observations=photo_observations,
        photo_evidence=photo_evidence,
        risk_matches=match_observations_to_risk_library(photo_observations),
    )
    composed["fieldProvenance"] = [
        *_build_observation_provenance(report_id, photo_observations=photo_observations),
        *list(composed.get("fieldProvenance") or []),
    ]
    return composed


def build_draft_from_photos(
    report_id: str,
    photos: list[dict[str, Any]],
    *,
    report_meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    photo_observations = [
        _build_photo_observation_for_manual_photo(report_id, photo, index)
        for index, photo in enumerate(photos, start=1)
    ]
    photo_evidence = []
    for index, photo in enumerate(photos, start=1):
        observation = photo_observations[index - 1]
        category = str(photo.get("category") or "hazard")
        source_step = "step2_hazard" if category == "hazard" else "manual_override"
        photo_evidence.append(
            _build_evidence_for_photo(
                report_id,
                photo,
                category=category,
                source_step=source_step,
                observation=observation,
                index=index,
            )
        )

    return _compose_risk_library_draft(
        report_id,
        report_meta=report_meta,
        photo_observations=photo_observations,
        photo_evidence=photo_evidence,
    )


def build_draft_from_guided_photos(
    report_id: str,
    overview_photos: list[dict[str, Any]],
    hazard_photos: list[dict[str, Any]],
    *,
    report_meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    photo_observations = build_photo_observation_cards(report_id, overview_photos, hazard_photos)
    overview_observations = [item for item in photo_observations if item.get("photoRole") == "step1_overview"]
    hazard_observations = [item for item in photo_observations if item.get("photoRole") == "step2_hazard"]
    photo_evidence: list[dict[str, Any]] = []

    for index, photo in enumerate(overview_photos, start=1):
        observation = overview_observations[index - 1] if index - 1 < len(overview_observations) else None
        photo_evidence.append(
            _build_evidence_for_photo(
                report_id,
                photo,
                category="site_overview" if index == 1 else "process",
                source_step="step1_overview",
                observation=observation,
                index=index,
            )
        )

    for index, photo in enumerate(hazard_photos, start=1):
        observation = hazard_observations[index - 1] if index - 1 < len(hazard_observations) else None
        photo_evidence.append(
            _build_evidence_for_photo(
                report_id,
                photo,
                category="hazard",
                source_step="step2_hazard",
                observation=observation,
                index=index + len(overview_photos),
            )
        )

    return _compose_risk_library_draft(
        report_id,
        report_meta=report_meta,
        photo_observations=photo_observations,
        photo_evidence=photo_evidence,
    )
