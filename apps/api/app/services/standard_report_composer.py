from __future__ import annotations

from typing import Any

from .standard_risk_library import (
    get_standard_risk_rule,
    recommend_future_process_rules,
)
from .standard_report_writers import (
    compose_section4_hazard_text,
    compose_section4_improvement_plan,
    compose_section5_countermeasure,
    compose_section5_hazard,
    compose_section6_drafts,
    review_reason_for_finding,
    review_reason_for_observation,
    review_reason_for_plan,
)


def _safe_text(value: object) -> str:
    return str(value or "").strip()


def _observation_process(observation: dict[str, Any]) -> dict[str, Any]:
    structured = observation.get("observedProcessStructured")
    return structured if isinstance(structured, dict) else {}


def _observation_risk(observation: dict[str, Any]) -> dict[str, Any]:
    structured = observation.get("observedRiskStructured")
    return structured if isinstance(structured, dict) else {}


def _empty_section_drafts() -> dict[str, Any]:
    return {
        "doc5": {
            "progressOverview": "",
            "accidentTrend": "",
            "findingCase": "",
            "workEnvironmentRisk": "",
            "futureProcessFocus": "",
        },
        "doc7": [],
        "doc8": [],
        "doc11": [],
        "doc12": [],
        "doc13": [],
        "doc14": {
            "title": "",
            "body": "",
            "confidence": 0.0,
        },
    }


def _match_by_observation_id(risk_matches: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {
        _safe_text(item.get("observationId")): item
        for item in risk_matches
        if _safe_text(item.get("observationId"))
    }


def _observation_confidence(observation: dict[str, Any], match: dict[str, Any]) -> float:
    values = []
    for value in (observation.get("confidence"), match.get("matchScore")):
        try:
            values.append(float(value or 0))
        except (TypeError, ValueError):
            continue
    return round(max(values or [0.0]), 2)


def _risk_structured_confidence(observation: dict[str, Any]) -> float:
    risk = _observation_risk(observation)
    try:
        return float(risk.get("confidence") or 0)
    except (TypeError, ValueError):
        return 0.0


def _process_structured_confidence(observation: dict[str, Any]) -> float:
    process = _observation_process(observation)
    try:
        return float(process.get("confidence") or 0)
    except (TypeError, ValueError):
        return 0.0


def _process_name(observation: dict[str, Any]) -> str:
    process = _observation_process(observation)
    major = _safe_text(process.get("majorProcess"))
    detail = _safe_text(process.get("detailProcess"))
    if major and detail and major != "확인 필요":
        return f"{major}({detail})"
    if detail:
        return detail
    if major:
        return major
    return _safe_text(observation.get("observedProcess")) or "확인 필요 공정"


def _risk_location(observation: dict[str, Any], rule: dict[str, Any] | None) -> str:
    risk = _observation_risk(observation)
    return _safe_text(risk.get("locationText")) or _safe_text((rule or {}).get("locationFallback")) or "확인 필요 위치"


def _location_needs_review(
    observation: dict[str, Any],
    match: dict[str, Any],
    location: str,
) -> bool:
    if not location or "확인 필요" in location:
        return True
    location_confidence = _risk_structured_confidence(observation)
    combined_confidence = _observation_confidence(observation, match)
    return location_confidence < 0.75 or combined_confidence < 0.75


def _fallback_guidance_text(match: dict[str, Any]) -> str:
    fallback_reason = _safe_text(match.get("fallbackReason"))
    if fallback_reason:
        return f"확인 필요: {fallback_reason}"
    return "확인 필요: 표준 위험 규칙이 충분히 매칭되지 않아 현장 확인 후 지적사항을 보완해 주세요."


def _fallback_countermeasure_text(match: dict[str, Any]) -> str:
    fallback_reason = _safe_text(match.get("fallbackReason"))
    if fallback_reason:
        return f"확인 필요: {fallback_reason} 다음 공정에 맞는 예방대책을 선택해 주세요."
    return "확인 필요: 다음 공정에 맞는 표준 예방대책을 현장 확인 후 선택해 주세요."


def _finding_guidance_text(match: dict[str, Any]) -> str:
    guidance = _safe_text(match.get("standardGuidanceText")) or _fallback_guidance_text(match)
    preventive = _safe_text(match.get("standardPreventiveMeasure"))
    if guidance.startswith("확인 필요") or not preventive or preventive in guidance:
        return guidance
    return f"{guidance} 또한 {preventive}"


def _observation_hazard(observation: dict[str, Any]) -> str:
    risk = _observation_risk(observation)
    return _safe_text(risk.get("hazardSummary")) or _safe_text(observation.get("observedRisk")) or "사진 기반 위험요인 확인 필요"


def _observation_accident_type(observation: dict[str, Any]) -> str:
    risk = _observation_risk(observation)
    return _safe_text(risk.get("accidentType")) or "확인 필요"


def _observation_causative_agent(observation: dict[str, Any]) -> str:
    risk = _observation_risk(observation)
    return _safe_text(risk.get("causativeAgent"))


def _observation_by_id(
    photo_observations: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    return {
        _safe_text(item.get("id")): item
        for item in photo_observations
        if _safe_text(item.get("id"))
    }


def _review_item_id(field_path: str) -> str:
    sanitized = "".join(character if character.isalnum() else "-" for character in field_path)
    return f"rq-{sanitized.strip('-') or 'item'}"


def _queue_item(
    *,
    field_path: str,
    section: str,
    field: str,
    label: str,
    source: str,
    confidence: float,
    reason: str,
    severity: str,
    suggested_value: str = "",
    current_value: str = "",
    evidence_photo_ids: list[str] | None = None,
    resolved: bool = False,
) -> dict[str, Any]:
    return {
        "id": _review_item_id(field_path),
        "section": section,
        "field": field,
        "fieldPath": field_path,
        "label": label,
        "value": current_value,
        "currentValue": current_value,
        "suggestedValue": suggested_value,
        "source": source,
        "confidence": round(confidence, 2),
        "reason": reason,
        "severity": severity,
        "needsReview": not resolved,
        "status": "confirmed" if resolved else "pending",
        "evidencePhotoIds": list(evidence_photo_ids or []),
        "resolved": resolved,
        "notes": reason,
    }


def _finding_emphasis() -> str:
    return "□ 추후 이행여부 확인 필요"


def _future_plan_note() -> str:
    return "□ 추후 이행여부 확인 필요"


def _future_process_name(rule: dict[str, Any] | None) -> str:
    if not rule:
        return "확인 필요"
    major = _safe_text(rule.get("majorProcess"))
    detail = _safe_text(rule.get("detailProcess"))
    if major and detail:
        return f"{major}({detail})"
    return detail or major or "확인 필요"


def _related_hazard_observation_ids(
    photo_observations: list[dict[str, Any]],
    risk_matches: list[dict[str, Any]],
    *,
    target_major_process: str,
) -> list[str]:
    matches_by_id = _match_by_observation_id(risk_matches)
    ids: list[str] = []
    for observation in photo_observations:
        if _safe_text(observation.get("photoRole")) != "step2_hazard":
            continue
        observation_id = _safe_text(observation.get("id"))
        match = matches_by_id.get(observation_id, {})
        matched_rule = get_standard_risk_rule(_safe_text(match.get("ruleKey")))
        if matched_rule is None or matched_rule["majorProcess"] != target_major_process:
            continue
        ids.append(observation_id)
    return ids


def _future_process_review_required(
    overview_observation: dict[str, Any],
    overview_match: dict[str, Any],
    *,
    process_name: str,
    has_rule: bool,
    linked_hazard_observations: list[dict[str, Any]],
) -> bool:
    if not has_rule or not process_name or "확인 필요" in process_name:
        return True
    if bool(overview_observation.get("needsHumanReview", True)):
        return True
    if bool(overview_match.get("needsHumanReview", True)):
        return True
    if _process_structured_confidence(overview_observation) < 0.75:
        return True
    if _observation_confidence(overview_observation, overview_match) < 0.75:
        return True
    return any(bool(item.get("needsHumanReview", True)) for item in linked_hazard_observations)


def build_section4_findings(
    photo_observations: list[dict[str, Any]],
    risk_matches: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    matches_by_id = _match_by_observation_id(risk_matches)
    rows: list[dict[str, Any]] = []
    for observation in photo_observations:
        if _safe_text(observation.get("photoRole")) != "step2_hazard":
            continue
        observation_id = _safe_text(observation.get("id"))
        match = matches_by_id.get(observation_id, {})
        rule = get_standard_risk_rule(_safe_text(match.get("ruleKey")))
        rule_id = _safe_text(match.get("ruleKey"))
        location = _risk_location(observation, rule)
        guidance_item = _finding_guidance_text(match)
        base_hazard_text = _safe_text(match.get("standardHazardText")) or _observation_hazard(observation)
        accident_type = _observation_accident_type(observation)
        hazard_text = compose_section4_hazard_text(
            location=location,
            hazard=base_hazard_text,
            accident_type=accident_type,
            causative_agent=_observation_causative_agent(observation),
        )
        improvement_plan = compose_section4_improvement_plan(
            location=location,
            hazard=base_hazard_text,
            accident_type=accident_type,
            guidance=guidance_item,
        )
        needs_review = (
            bool(match.get("needsHumanReview", True))
            or _location_needs_review(observation, match, location)
            or not rule_id
            or guidance_item.startswith("확인 필요")
        )
        row = {
            "linkedPhotoIds": [_safe_text(observation.get("photoAssetId"))],
            "photoObservationIds": [observation_id] if observation_id else [],
            "source": "AI_PHOTO_AND_RISK_LIBRARY",
            "location": location,
            "hazardDescription": hazard_text,
            "accidentType": accident_type,
            "causativeAgentKey": _safe_text((rule or {}).get("causativeAgentKey")) or _observation_causative_agent(observation),
            "riskLevel": _safe_text(match.get("riskLevel")) or _safe_text((rule or {}).get("defaultRiskLevel")) or "중",
            "improvementPlan": improvement_plan,
            "emphasis": _finding_emphasis(),
            "legalReferenceCandidates": list((rule or {}).get("legalReferenceCandidates") or []),
            "referenceMaterialCandidates": list((rule or {}).get("referenceMaterialCandidates") or []),
            "confidence": _observation_confidence(observation, match),
            "needsReview": needs_review,
        }
        if rule_id:
            row["standardRiskRuleId"] = rule_id
        rows.append(row)
    return rows


def build_section5_future_plans(
    photo_observations: list[dict[str, Any]],
    risk_matches: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    matches_by_id = _match_by_observation_id(risk_matches)
    observations_by_id = _observation_by_id(photo_observations)
    rows: list[dict[str, Any]] = []
    seen_rule_ids: set[str] = set()
    for observation in photo_observations:
        if _safe_text(observation.get("photoRole")) != "step1_overview":
            continue
        observation_id = _safe_text(observation.get("id"))
        match = matches_by_id.get(observation_id, {})
        recommended_rules = recommend_future_process_rules(
            observation,
            match,
            photo_observations=photo_observations,
            risk_matches=risk_matches,
            limit=3,
        )
        if not recommended_rules:
            rows.append(
                {
                    "processName": "확인 필요",
                    "hazard": compose_section5_hazard(
                        process_name="확인 필요",
                        hazard="다음 공정 위험요인 현장 확인 필요",
                    ),
                    "countermeasure": compose_section5_countermeasure(
                        process_name="확인 필요",
                        hazard="다음 공정 위험요인 현장 확인 필요",
                        countermeasure=_fallback_countermeasure_text(match),
                    ),
                    "note": _future_plan_note(),
                    "confidence": _observation_confidence(observation, match),
                    "photoObservationIds": [observation_id] if observation_id else [],
                    "evidencePhotoIds": [
                        _safe_text(observation.get("photoAssetId"))
                    ]
                    if _safe_text(observation.get("photoAssetId"))
                    else [],
                    "needsReview": True,
                    "source": "AI_PHOTO_AND_RISK_LIBRARY",
                }
            )
            continue

        for rule in recommended_rules:
            rule_id = _safe_text(rule.get("key"))
            if not rule_id or rule_id in seen_rule_ids:
                continue
            seen_rule_ids.add(rule_id)
            hazard_observation_ids = _related_hazard_observation_ids(
                photo_observations,
                risk_matches,
                target_major_process=_safe_text(rule.get("majorProcess")),
            )
            linked_hazard_observations = [
                observations_by_id[item_id]
                for item_id in hazard_observation_ids
                if item_id in observations_by_id
            ]
            photo_observation_ids = [
                item
                for item in [observation_id, *hazard_observation_ids]
                if item
            ]
            evidence_photo_ids = [
                item
                for item in [
                    _safe_text(observation.get("photoAssetId")),
                    *[
                        _safe_text(linked_observation.get("photoAssetId"))
                        for linked_observation in linked_hazard_observations
                    ],
                ]
                if item
            ]
            needs_review = _future_process_review_required(
                observation,
                match,
                process_name=_future_process_name(rule),
                has_rule=True,
                linked_hazard_observations=linked_hazard_observations,
            )
            rows.append(
                {
                    "processName": _future_process_name(rule),
                    "hazard": compose_section5_hazard(
                        process_name=_future_process_name(rule),
                        hazard=_safe_text(rule.get("standardHazardText"))
                        or "다음 공정 위험요인 현장 확인 필요",
                    ),
                    "countermeasure": compose_section5_countermeasure(
                        process_name=_future_process_name(rule),
                        hazard=_safe_text(rule.get("standardHazardText"))
                        or "다음 공정 위험요인 현장 확인 필요",
                        countermeasure=_safe_text(rule.get("standardPreventiveMeasure"))
                        or _fallback_countermeasure_text(match),
                    ),
                    "note": _future_plan_note(),
                    "confidence": _observation_confidence(observation, match),
                    "standardRiskRuleId": rule_id,
                    "photoObservationIds": photo_observation_ids,
                    "evidencePhotoIds": evidence_photo_ids,
                    "needsReview": needs_review,
                    "source": "AI_PHOTO_AND_RISK_LIBRARY",
                }
            )
            if len(rows) >= 3:
                return rows[:3]
    for observation in photo_observations:
        if len(rows) >= 3:
            break
        if _safe_text(observation.get("photoRole")) != "step2_hazard":
            continue
        observation_id = _safe_text(observation.get("id"))
        match = matches_by_id.get(observation_id, {})
        rule_id = _safe_text(match.get("ruleKey"))
        rule = get_standard_risk_rule(rule_id)
        if rule_id and rule_id in seen_rule_ids:
            continue
        if rule_id:
            seen_rule_ids.add(rule_id)
        process_name = _future_process_name(rule) if rule else _process_name(observation)
        hazard_text = (
            _safe_text((rule or {}).get("standardHazardText"))
            or _safe_text(match.get("standardHazardText"))
            or _observation_hazard(observation)
        )
        countermeasure = (
            _safe_text((rule or {}).get("standardPreventiveMeasure"))
            or _safe_text(match.get("standardPreventiveMeasure"))
            or _fallback_countermeasure_text(match)
        )
        confidence = _observation_confidence(observation, match)
        row = {
            "processName": process_name,
            "hazard": compose_section5_hazard(
                process_name=process_name,
                hazard=hazard_text,
            ),
            "countermeasure": compose_section5_countermeasure(
                process_name=process_name,
                hazard=hazard_text,
                countermeasure=countermeasure,
            ),
            "note": "hazard 사진 기반 향후 유사공정 대책 후보 - 현장 확인 후 확정 필요",
            "confidence": confidence,
            "photoObservationIds": [observation_id] if observation_id else [],
            "evidencePhotoIds": [
                _safe_text(observation.get("photoAssetId"))
            ]
            if _safe_text(observation.get("photoAssetId"))
            else [],
            "needsReview": True,
            "source": "AI_PHOTO_AND_RISK_LIBRARY",
        }
        if rule_id:
            row["standardRiskRuleId"] = rule_id
        rows.append(row)
    return rows[:3]


def build_risk_library_provenance(
    finding_candidates: list[dict[str, Any]],
    future_plans: list[dict[str, Any]],
    section6_drafts: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    provenance: list[dict[str, Any]] = []
    for index, finding in enumerate(finding_candidates):
        rule_id = _safe_text(finding.get("standardRiskRuleId"))
        source_id = f"rule:{rule_id}" if rule_id else f"observation:{index + 1}"
        hazard_entry = {
            "fieldPath": f"findingCandidates[{index}].hazardDescription",
            "source": "RISK_LIBRARY" if rule_id else "AI_PHOTO",
            "sourceId": source_id,
            "evidencePhotoIds": list(finding.get("linkedPhotoIds") or []),
            "photoObservationIds": list(finding.get("photoObservationIds") or []),
            "confidence": float(finding.get("confidence") or 0),
            "needsReview": bool(finding.get("needsReview", True)),
            "note": "표준 위험 라이브러리 기반 위험요인 문안",
        }
        plan_entry = {
            "fieldPath": f"findingCandidates[{index}].improvementPlan",
            "source": "RULE_TEMPLATE" if rule_id else "AI_PHOTO",
            "sourceId": source_id,
            "evidencePhotoIds": list(finding.get("linkedPhotoIds") or []),
            "photoObservationIds": list(finding.get("photoObservationIds") or []),
            "confidence": float(finding.get("confidence") or 0),
            "needsReview": bool(finding.get("needsReview", True)),
            "note": "표준 위험 라이브러리 기반 지적사항 문안",
        }
        if rule_id:
            hazard_entry["standardRiskRuleId"] = rule_id
            plan_entry["standardRiskRuleId"] = rule_id
        provenance.append(hazard_entry)
        provenance.append(plan_entry)

    for index, plan in enumerate(future_plans):
        rule_id = _safe_text(plan.get("standardRiskRuleId"))
        source_id = f"rule:{rule_id}" if rule_id else f"future-observation:{index + 1}"
        hazard_entry = {
            "fieldPath": f"sectionDrafts.doc8[{index}].hazard",
            "source": "RISK_LIBRARY" if rule_id else "AI_PHOTO",
            "sourceId": source_id,
            "evidencePhotoIds": list(plan.get("evidencePhotoIds") or []),
            "photoObservationIds": list(plan.get("photoObservationIds") or []),
            "confidence": float(plan.get("confidence") or 0),
            "needsReview": bool(plan.get("needsReview", True)),
            "note": "표준 위험 라이브러리 기반 향후 공정 위험요인 문안",
        }
        countermeasure_entry = {
            "fieldPath": f"sectionDrafts.doc8[{index}].countermeasure",
            "source": "RULE_TEMPLATE" if rule_id else "AI_PHOTO",
            "sourceId": source_id,
            "evidencePhotoIds": list(plan.get("evidencePhotoIds") or []),
            "photoObservationIds": list(plan.get("photoObservationIds") or []),
            "confidence": float(plan.get("confidence") or 0),
            "needsReview": bool(plan.get("needsReview", True)),
            "note": "표준 위험 라이브러리 기반 예방대책 문안",
        }
        if rule_id:
            hazard_entry["standardRiskRuleId"] = rule_id
            countermeasure_entry["standardRiskRuleId"] = rule_id
        provenance.append(hazard_entry)
        provenance.append(countermeasure_entry)
    if section6_drafts:
        for field_path, rows in (
            ("sectionDrafts.doc11[0].content", section6_drafts.get("doc11") or []),
            ("sectionDrafts.doc12[0].content", section6_drafts.get("doc12") or []),
        ):
            if not rows:
                continue
            row = rows[0]
            provenance.append(
                {
                    "fieldPath": field_path,
                    "source": "AI_PHOTO",
                    "sourceId": "section6-risk-support",
                    "evidencePhotoIds": list(row.get("evidencePhotoIds") or []),
                    "photoObservationIds": list(row.get("photoObservationIds") or []),
                    "confidence": float(row.get("confidence") or 0),
                    "needsReview": True,
                    "note": "사진 기반 위험유형으로 생성한 교육/지원사항 초안",
                }
            )
        doc14 = section6_drafts.get("doc14") or {}
        if _safe_text(doc14.get("body")):
            provenance.append(
                {
                    "fieldPath": "sectionDrafts.doc14.body",
                    "source": "AI_PHOTO",
                    "sourceId": "section6-risk-support",
                    "evidencePhotoIds": list(doc14.get("evidencePhotoIds") or []),
                    "photoObservationIds": list(doc14.get("photoObservationIds") or []),
                    "confidence": float(doc14.get("confidence") or 0),
                    "needsReview": True,
                    "note": "사진 기반 기타 지원사항 초안",
                }
            )
    return provenance


def _build_review_queue(
    report_meta: dict[str, Any],
    photo_observations: list[dict[str, Any]],
    finding_candidates: list[dict[str, Any]],
    future_plans: list[dict[str, Any]],
    section6_drafts: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    queue: list[dict[str, Any]] = []
    observations_by_id = _observation_by_id(photo_observations)
    required_report_meta_fields = {
        "progressRate": ("공정률", "reportMeta", "progressRate"),
        "previousImplementationStatus": ("이전 기술지도 이행여부", "reportMeta", "previousImplementationStatus"),
        "notificationMethod": ("통보방법", "dispatch", "notificationMethod"),
    }

    for field_name, (label, section, field) in required_report_meta_fields.items():
        current_value = _safe_text(report_meta.get(field_name))
        if current_value:
            continue
        queue.append(
            _queue_item(
                field_path=f"reportMeta.{field_name}",
                section=section,
                field=field,
                label=label,
                source="DATA",
                confidence=0.1,
                reason="행정 필수값이 비어 있어 사용자 확인이 필요합니다.",
                severity="required",
            )
        )

    for index, observation in enumerate(photo_observations):
        observation_id = _safe_text(observation.get("id")) or f"photoObservations[{index}]"
        risk = _observation_risk(observation)
        hazard_summary = _safe_text(risk.get("hazardSummary")) or _observation_hazard(observation)
        if not hazard_summary:
            continue
        confidence = _observation_confidence(observation, {})
        needs_review = bool(observation.get("needsHumanReview", True)) or confidence < 0.75
        if not needs_review:
            continue
        queue.append(
            _queue_item(
                field_path=f"photoObservations[{index}].observedRiskStructured.hazardSummary",
                section="photoObservations",
                field="hazardSummary",
                label="AI 위험요인 확인",
                source="AI_PHOTO",
                confidence=confidence,
                reason=review_reason_for_observation(observation, confidence=confidence),
                severity="warning",
                suggested_value=hazard_summary,
                evidence_photo_ids=[_safe_text(observation.get("photoAssetId"))] if _safe_text(observation.get("photoAssetId")) else [],
            )
        )

    for index, finding in enumerate(finding_candidates):
        location_value = _safe_text(finding.get("location"))
        observation = None
        for observation_id in list(finding.get("photoObservationIds") or []):
            candidate = observations_by_id.get(_safe_text(observation_id))
            if candidate is not None:
                observation = candidate
                break
        location_confidence = _risk_structured_confidence(observation or {})
        needs_location_review = (
            bool(finding.get("needsReview", True))
            and (
                not location_value
                or "확인 필요" in location_value
                or location_confidence < 0.75
            )
        )
        if needs_location_review:
            queue.append(
                _queue_item(
                    field_path=f"findingCandidates[{index}].location",
                    section="doc4",
                    field="location",
                    label="4번 위험장소 확인",
                    suggested_value=location_value,
                    source="AI_PHOTO",
                    confidence=float(finding.get("confidence") or 0),
                    reason=review_reason_for_finding(finding),
                    severity="warning",
                    evidence_photo_ids=list(finding.get("linkedPhotoIds") or []),
                )
            )
        if not _safe_text(finding.get("standardRiskRuleId")):
            queue.append(
                _queue_item(
                    field_path=f"findingCandidates[{index}].improvementPlan",
                    section="doc4",
                    field="improvementPlan",
                    label="4번 지적사항 표준 규칙 확인",
                    suggested_value=_safe_text(finding.get("improvementPlan")),
                    source="RISK_LIBRARY",
                    confidence=float(finding.get("confidence") or 0),
                    reason=review_reason_for_finding(finding),
                    severity="required",
                    evidence_photo_ids=list(finding.get("linkedPhotoIds") or []),
                )
            )
        elif bool(finding.get("needsReview", True)):
            queue.append(
                _queue_item(
                    field_path=f"findingCandidates[{index}].improvementPlan",
                    section="doc4",
                    field="improvementPlan",
                    label="4번 지적사항 확인",
                    suggested_value=_safe_text(finding.get("improvementPlan")),
                    source="RULE_TEMPLATE",
                    confidence=float(finding.get("confidence") or 0),
                    reason=review_reason_for_finding(finding),
                    severity="warning",
                    evidence_photo_ids=list(finding.get("linkedPhotoIds") or []),
                )
            )

    for index, plan in enumerate(future_plans):
        process_name = _safe_text(plan.get("processName"))
        evidence_photo_ids = list(plan.get("evidencePhotoIds") or [])
        if not process_name or "확인 필요" in process_name or bool(plan.get("needsReview", True)):
            queue.append(
                _queue_item(
                    field_path=f"sectionDrafts.doc8[{index}].processName",
                    section="doc5",
                    field="processName",
                    label="5번 진행공정 확인",
                    suggested_value=process_name,
                    source="AI_PHOTO",
                    confidence=float(plan.get("confidence") or 0),
                    reason=review_reason_for_plan(plan),
                    severity="warning",
                    evidence_photo_ids=evidence_photo_ids,
                )
            )
        if not _safe_text(plan.get("standardRiskRuleId")):
            queue.append(
                _queue_item(
                    field_path=f"sectionDrafts.doc8[{index}].countermeasure",
                    section="doc5",
                    field="countermeasure",
                    label="5번 예방대책 표준 규칙 확인",
                    suggested_value=_safe_text(plan.get("countermeasure")),
                    source="RISK_LIBRARY",
                    confidence=float(plan.get("confidence") or 0),
                    reason=review_reason_for_plan(plan),
                    severity="required",
                    evidence_photo_ids=evidence_photo_ids,
                )
            )
        elif (
            bool(plan.get("needsReview", True))
            and _safe_text(plan.get("countermeasure")).startswith("확인 필요")
        ):
            queue.append(
                _queue_item(
                    field_path=f"sectionDrafts.doc8[{index}].countermeasure",
                    section="doc5",
                    field="countermeasure",
                    label="5번 예방대책 확인",
                    suggested_value=_safe_text(plan.get("countermeasure")),
                    source="RULE_TEMPLATE",
                    confidence=float(plan.get("confidence") or 0),
                    reason=review_reason_for_plan(plan),
                    severity="warning",
                    evidence_photo_ids=evidence_photo_ids,
            )
            )
    if section6_drafts:
        doc11 = section6_drafts.get("doc11") or []
        doc12 = section6_drafts.get("doc12") or []
        doc14 = section6_drafts.get("doc14") or {}
        if doc11:
            item = doc11[0]
            queue.append(
                _queue_item(
                    field_path="sectionDrafts.doc11[0].content",
                    section="other",
                    field="doc11.content",
                    label="6번 안전교육 초안 확인",
                    suggested_value=_safe_text(item.get("content")),
                    source="AI_PHOTO",
                    confidence=float(item.get("confidence") or 0),
                    reason="현장 참석인원과 실제 교육 실시 내용을 확인해야 합니다.",
                    severity="warning",
                    evidence_photo_ids=list(item.get("evidencePhotoIds") or []),
                )
            )
        if doc12:
            item = doc12[0]
            queue.append(
                _queue_item(
                    field_path="sectionDrafts.doc12[0].content",
                    section="other",
                    field="doc12.content",
                    label="6번 지원사항 초안 확인",
                    suggested_value=_safe_text(item.get("content")),
                    source="AI_PHOTO",
                    confidence=float(item.get("confidence") or 0),
                    reason="실제 지원 내역과 안전조치 이행 상태 확인이 필요합니다.",
                    severity="warning",
                    evidence_photo_ids=list(item.get("evidencePhotoIds") or []),
                )
            )
        if _safe_text(doc14.get("body")):
            queue.append(
                _queue_item(
                    field_path="sectionDrafts.doc14.body",
                    section="other",
                    field="doc14.body",
                    label="6번 기타 메모 확인",
                    suggested_value=_safe_text(doc14.get("body")),
                    source="AI_PHOTO",
                    confidence=float(doc14.get("confidence") or 0),
                    reason="AI 초안 메모로 실제 조치일자와 현장 적용 여부 확인이 필요합니다.",
                    severity="info",
                    evidence_photo_ids=list(doc14.get("evidencePhotoIds") or []),
                )
            )
    return queue


def _build_validation_result(
    photo_observations: list[dict[str, Any]],
    finding_candidates: list[dict[str, Any]],
    future_plans: list[dict[str, Any]],
    review_queue: list[dict[str, Any]],
) -> dict[str, Any]:
    blocking_issues: list[str] = []
    warnings: list[str] = []

    if not photo_observations:
        blocking_issues.append("사진 기반 관찰값이 없어 photoObservations를 생성하지 못했습니다.")

    if not finding_candidates:
        warnings.append("현재 위험요인 사진에 대한 4번 지적사항 초안이 비어 있습니다.")

    if not future_plans:
        warnings.append("현재 공정 사진에 대한 5번 예방대책 초안이 비어 있습니다.")

    if any(not _safe_text(item.get("standardRiskRuleId")) for item in finding_candidates):
        warnings.append("일부 4번 지적사항은 표준 위험 규칙 재선택이 필요합니다.")

    if any(not _safe_text(item.get("standardRiskRuleId")) for item in future_plans):
        warnings.append("일부 5번 예방대책은 표준 위험 규칙 재선택이 필요합니다.")

    if any(bool(item.get("needsReview", True)) for item in [*finding_candidates, *future_plans]):
        warnings.append("일부 4번/5번 문안은 현장 확인 후 확정이 필요합니다.")

    unresolved_required = [
        item for item in review_queue if _safe_text(item.get("severity")) == "required" and not bool(item.get("resolved", False))
    ]
    unresolved_warning = [
        item for item in review_queue if _safe_text(item.get("severity")) in {"warning", "info"} and not bool(item.get("resolved", False))
    ]
    for item in unresolved_required:
        message = f"{_safe_text(item.get('label'))}: {_safe_text(item.get('reason')) or '사용자 확인이 필요합니다.'}"
        if message not in blocking_issues:
            blocking_issues.append(message)
    if unresolved_required:
        warnings.append("출력 전 필수 확인 항목이 남아 있습니다.")
    if unresolved_warning:
        warnings.append("검토 권장 항목이 남아 있습니다.")

    return {
        "valid": len(blocking_issues) == 0,
        "blockingIssues": blocking_issues,
        "warnings": warnings,
        "reviewedFieldPaths": [
            _safe_text(item.get("fieldPath"))
            for item in review_queue
            if bool(item.get("resolved", False)) and _safe_text(item.get("fieldPath"))
        ],
    }


def _build_doc5_summary(
    finding_candidates: list[dict[str, Any]],
    future_plans: list[dict[str, Any]],
) -> dict[str, str]:
    current_risks = [
        _safe_text(item.get("hazardDescription"))
        for item in finding_candidates
        if _safe_text(item.get("hazardDescription"))
    ][:2]
    future_processes = [
        _safe_text(item.get("processName"))
        for item in future_plans
        if _safe_text(item.get("processName")) and "확인 필요" not in _safe_text(item.get("processName"))
    ][:3]
    if future_processes:
        future_process_focus = (
            f"향후 {', '.join(future_processes)} 공정에서 유해·위험요인 및 예방대책 재점검 필요"
        )
    elif future_plans:
        future_process_focus = "향후 진행공정 확인 후 유해·위험요인 및 예방대책 재선정 필요"
    else:
        future_process_focus = ""
    return {
        "progressOverview": "",
        "accidentTrend": "",
        "findingCase": " / ".join(current_risks),
        "workEnvironmentRisk": " / ".join(current_risks),
        "futureProcessFocus": future_process_focus,
    }


def _build_section6_drafts(
    finding_candidates: list[dict[str, Any]],
    future_plans: list[dict[str, Any]],
    photo_observations: list[dict[str, Any]],
) -> dict[str, Any]:
    source = finding_candidates[0] if finding_candidates else (future_plans[0] if future_plans else {})
    if not source:
        return {"doc11": [], "doc12": [], "doc14": {}}
    return compose_section6_drafts(
        source=source,
        photo_observations=photo_observations,
    )


def compose_standard_report_draft(
    report_id: str,
    *,
    report_meta: dict[str, Any] | None,
    photo_observations: list[dict[str, Any]],
    photo_evidence: list[dict[str, Any]],
    risk_matches: list[dict[str, Any]],
) -> dict[str, Any]:
    del report_id

    finding_candidates = build_section4_findings(photo_observations, risk_matches)
    future_plans = build_section5_future_plans(photo_observations, risk_matches)
    section6_drafts = _build_section6_drafts(
        finding_candidates,
        future_plans,
        photo_observations,
    )
    review_queue = _build_review_queue(
        report_meta or {},
        photo_observations,
        finding_candidates,
        future_plans,
        section6_drafts,
    )
    section_drafts = _empty_section_drafts()
    section_drafts["doc5"] = _build_doc5_summary(finding_candidates, future_plans)
    section_drafts["doc7"] = [dict(item) for item in finding_candidates]
    section_drafts["doc8"] = future_plans
    section_drafts["doc11"] = section6_drafts["doc11"]
    section_drafts["doc12"] = section6_drafts["doc12"]
    if section6_drafts["doc14"]:
        section_drafts["doc14"] = section6_drafts["doc14"]

    return {
        "photoEvidence": photo_evidence,
        "photoObservations": photo_observations,
        "findingCandidates": finding_candidates,
        "sectionDrafts": section_drafts,
        "validationResult": _build_validation_result(
            photo_observations,
            finding_candidates,
            future_plans,
            review_queue,
        ),
        "fieldProvenance": build_risk_library_provenance(
            finding_candidates,
            future_plans,
            section6_drafts,
        ),
        "reviewQueue": review_queue,
        "documentsCompat": {},
    }
