from __future__ import annotations

from typing import Any


def _build_evidence_for_photo(
    report_id: str,
    photo: dict[str, Any],
    *,
    index: int,
    category: str,
    source_step: str,
    scene_type: str,
    process_type: str,
    location_hint: str,
    hazard_signals: list[str],
    accident_candidates: list[str],
    causative_candidates: list[str],
    notes: str,
) -> dict[str, Any]:
    return {
        "photoAssetId": photo["id"],
        "category": category,
        "sourceStep": source_step,
        "filename": photo.get("filename", ""),
        "imageUrl": photo.get("data_url", ""),
        "aiCategorySuggestion": category,
        "aiCategoryConfidence": 0.82 if source_step == "step1_overview" else 0.88,
        "aiCategoryReason": "단계형 업로드로 받은 사진 묶음 내부에서 후속 해석만 수행",
        "sceneType": scene_type,
        "processType": process_type,
        "locationHint": location_hint,
        "ppeSignals": ["보호구 착용 상태 재확인 필요"],
        "hazardSignals": hazard_signals,
        "accidentTypeCandidates": accident_candidates,
        "causativeAgentCandidates": causative_candidates,
        "measurementContext": "",
        "educationContext": "",
        "activityContext": "",
        "confidence": min(0.95, 0.72 + (index * 0.04)),
        "notes": f"{report_id} {notes}",
    }


def build_draft_from_photos(report_id: str, photos: list[dict[str, Any]]) -> dict[str, Any]:
    photo_evidence = []
    finding_candidates = []

    for index, photo in enumerate(photos, start=1):
        category = photo.get("category") or "hazard"
        photo_id = photo["id"]
        hint = f"{index}번 사진 작업구간"

        photo_evidence.append(
            _build_evidence_for_photo(
                report_id,
                photo,
                index=index,
                category=category,
                source_step="manual_override",
                scene_type="construction-photo",
                process_type="현장 점검",
                location_hint=hint,
                hazard_signals=["개선 필요 요소 포착"],
                accident_candidates=["떨어짐" if index == 1 else "물체에 맞음"],
                causative_candidates=["temporary_structure" if index == 1 else "lifting_load"],
                notes=f"사진 {index} 기반 자동 추정",
            )
        )

        finding_candidates.append(
            {
                "linkedPhotoIds": [photo_id],
                "location": hint,
                "hazardDescription": "사진에서 식별된 주요 위험요인에 대한 추가 점검 필요",
                "accidentType": "떨어짐" if index == 1 else "물체에 맞음",
                "causativeAgentKey": "temporary_structure" if index == 1 else "lifting_load",
                "riskLevel": "상" if index == 1 else "중",
                "improvementPlan": "작업 전 안전시설 상태와 출입통제 체계를 재정비",
                "emphasis": "사진 기반 자동초안으로 현장 확인 후 확정 필요",
                "legalReferenceCandidates": ["산업안전보건기준에 관한 규칙"],
                "referenceMaterialCandidates": ["표준 안전점검 체크리스트"],
                "confidence": 0.74,
                "needsReview": True,
            }
        )

    return {
        "photoEvidence": photo_evidence,
        "findingCandidates": finding_candidates,
        "sectionDrafts": {
            "doc5": {
                "progressOverview": "사진 기반 자동초안으로 현재 공정의 핵심 위험요인 집약 필요",
                "accidentTrend": "금회 사진 기준 추락 및 낙하물 위험 중심의 지적 경향",
                "findingCase": "현장 주요 위험요인에 대한 즉시 시정 필요 사례 추출",
                "workEnvironmentRisk": "작업반경과 개구부 주변의 추락 위험요인 집중 관리 필요",
                "futureProcessFocus": "향후 공정 진행 전 추락 위험요인과 출입통제 재확인 필요",
            },
            "doc7": [],
            "doc8": [],
            "doc11": [],
            "doc12": [],
            "doc13": [],
            "doc14": {
                "title": "AI 추천 안전정보",
                "body": "사진 기반 초안이므로 현장 확인 후 최종 문안 확정 필요",
                "confidence": 0.62,
            },
        },
        "validationResult": {
            "valid": False,
            "blockingIssues": ["현장 주소, 연락처 등 행정 필수값을 검토 단계에서 입력해야 합니다."],
            "warnings": ["AI 초안은 법적 제출 전 사용자가 확인해야 합니다."],
            "reviewedFieldPaths": [],
        },
    }


def build_draft_from_guided_photos(
    report_id: str,
    overview_photos: list[dict[str, Any]],
    hazard_photos: list[dict[str, Any]],
) -> dict[str, Any]:
    photo_evidence = []
    finding_candidates = []

    for index, photo in enumerate(overview_photos, start=1):
        photo_evidence.append(
            _build_evidence_for_photo(
                report_id,
                photo,
                index=index,
                category="site_overview" if index == 1 else "process",
                source_step="step1_overview",
                scene_type="site-overview",
                process_type="철골 조립 및 외장 패널 취부",
                location_hint=f"전경/공정 묶음 {index}번",
                hazard_signals=["공정 흐름과 작업반경 확인 필요"],
                accident_candidates=["떨어짐", "부딪힘"],
                causative_candidates=["temporary_structure", "moving_equipment"],
                notes=f"step1 사진 {index} 기반 공정/전경 해석",
            )
        )

    for index, photo in enumerate(hazard_photos, start=1):
        photo_evidence.append(
            _build_evidence_for_photo(
                report_id,
                photo,
                index=index + len(overview_photos),
                category="hazard",
                source_step="step2_hazard",
                scene_type="hazard-closeup",
                process_type="위험요인 점검",
                location_hint=f"위험요인 묶음 {index}번",
                hazard_signals=["지적 필요 위험요인 포착", "즉시 시정 검토 필요"],
                accident_candidates=["떨어짐" if index == 1 else "물체에 맞음"],
                causative_candidates=["temporary_structure" if index == 1 else "lifting_load"],
                notes=f"step2 사진 {index} 기반 위험요인 해석",
            )
        )

        finding_candidates.append(
            {
                "linkedPhotoIds": [photo["id"]],
                "location": f"위험요인 묶음 {index}번",
                "hazardDescription": "사진에서 식별된 주요 위험요인에 대한 보강 및 출입통제 필요",
                "accidentType": "떨어짐" if index == 1 else "물체에 맞음",
                "causativeAgentKey": "temporary_structure" if index == 1 else "lifting_load",
                "riskLevel": "상" if index == 1 else "중",
                "improvementPlan": "작업 전 안전시설 상태와 통제구역을 재정비하고 작업 전파 교육 실시",
                "emphasis": "단계형 업로드 기반 자동초안으로 현장 확인 후 최종 확정 필요",
                "legalReferenceCandidates": ["산업안전보건기준에 관한 규칙"],
                "referenceMaterialCandidates": ["표준 안전점검 체크리스트"],
                "confidence": 0.78 if index == 1 else 0.73,
                "needsReview": True,
            }
        )

    return {
        "photoEvidence": photo_evidence,
        "findingCandidates": finding_candidates,
        "sectionDrafts": {
            "doc5": {
                "progressOverview": "전경/공정 사진을 바탕으로 현재 공정 흐름과 작업반경을 우선 정리했습니다.",
                "accidentTrend": "위험요인 사진 기준 추락 및 낙하물 위험 중심의 지적 경향이 확인됩니다.",
                "findingCase": "위험 기인물 사진을 기반으로 즉시 시정이 필요한 사례를 우선 추렸습니다.",
                "workEnvironmentRisk": "개구부 인접 작업과 자재 반입 동선이 겹치는 구간의 위험 관리가 필요합니다.",
                "futureProcessFocus": "향후 공정에서는 고소작업과 인양 하부 통제를 중심으로 재점검이 필요합니다.",
            },
            "doc7": [],
            "doc8": [
                {
                    "processName": "외장 패널 취부",
                    "hazard": "외곽부 작업 시 개구부 접근 및 추락 위험",
                    "countermeasure": "작업 시작 전 난간, 작업발판, 수평생명줄 상태를 확인",
                    "confidence": 0.83,
                }
            ],
            "doc11": [
                {
                    "topic": "고소작업 전 TBM",
                    "content": "step1 공정 흐름과 step2 위험요인을 바탕으로 추락방지, 하부통제, 작업반경 교육안을 자동 제안했습니다.",
                    "attendeeCount": "",
                    "confidence": 0.67,
                }
            ],
            "doc12": [
                {
                    "activityType": "현장 순회점검",
                    "content": "위험요인 사진 중심으로 즉시 시정 대상과 후속 확인 대상을 자동 분리했습니다.",
                    "confidence": 0.64,
                }
            ],
            "doc13": [
                {
                    "title": "유사 추락사고 참고 사례",
                    "summary": "개구부 및 작업발판 관련 사고 사례를 자동 추천해 후속 검토에 활용합니다.",
                    "confidence": 0.61,
                }
            ],
            "doc14": {
                "title": "AI 추천 안전정보",
                "body": "doc11/doc12는 기본적으로 리소스 자동삽입 모드로 제안되며, 워크스페이스에서 수동 덮어쓰기가 가능합니다.",
                "confidence": 0.66,
            },
        },
        "validationResult": {
            "valid": False,
            "blockingIssues": ["현장 주소, 연락처 등 행정 필수값을 검토 단계에서 입력해야 합니다."],
            "warnings": [
                "step1과 step2 사진은 이미 단계별로 분리 수집되었으므로, 검수 단계에서는 묶음 검토만 수행합니다."
            ],
            "reviewedFieldPaths": [],
        },
    }
