from __future__ import annotations

from typing import Any, TypedDict


class StandardRiskRule(TypedDict):
    key: str
    id: str
    majorProcess: str
    detailProcess: str
    accidentType: str
    accidentTypes: list[str]
    causativeAgent: str
    causativeAgentKey: str
    causativeAgentAliases: list[str]
    keywords: list[str]
    hazardKeywords: list[str]
    processKeywords: list[str]
    locationKeywords: list[str]
    appliesToPhotoRoles: list[str]
    standardHazardText: str
    standardGuidanceText: str
    standardCountermeasureText: str
    standardPreventiveMeasure: str
    defaultRiskLevel: str
    legalReferenceCandidates: list[str]
    referenceMaterialCandidates: list[str]
    locationFallback: str


class RiskLibraryMatch(TypedDict):
    observationId: str
    photoRole: str
    ruleKey: str | None
    matchScore: float
    matchedBy: list[str]
    standardHazardText: str
    standardGuidanceText: str
    standardCountermeasureText: str
    standardPreventiveMeasure: str
    riskLevel: str
    needsHumanReview: bool
    fallbackReason: str


_RISK_LIBRARY_MATCH_THRESHOLD = 5.0
_RISK_LIBRARY_LOW_CONFIDENCE = 0.82
_DEFAULT_RULE_SCOPE = ["step2_hazard", "step1_overview"]
_DEFAULT_LAW_REFERENCES = ["산업안전보건기준에 관한 규칙"]
_FUTURE_PROCESS_RULE_KEYS_BY_DETAIL: dict[tuple[str, str], list[str]] = {
    ("기초 및 토공사", "굴착 작업"): [
        "EARTH_RETAINING_SHORING_COLLAPSE_FALL",
        "EXCAVATOR_COLLISION_PREVENTION",
        "DUMP_TRUCK_BACKING_COLLISION",
    ],
    ("기초 및 토공사", "굴착기 작업"): [
        "EARTH_RETAINING_SHORING_COLLAPSE_FALL",
        "EXCAVATOR_COLLISION_PREVENTION",
        "DUMP_TRUCK_BACKING_COLLISION",
    ],
    ("골조공사", "철골 조립"): [
        "STEEL_FRAME_FALL_PROTECTION",
        "FORMWORK_SHORING_COLLAPSE_PREVENTION",
        "LIFTING_STRUCK_BY_LOAD",
    ],
    ("골조공사", "단부 및 개구부 주변 작업"): [
        "OPENING_FALL_COVER",
        "REBAR_IMPALEMENT_PREVENTION",
        "STAIR_GUARDRAIL_FALL_PREVENTION",
        "FORMWORK_SHORING_COLLAPSE_PREVENTION",
    ],
    ("골조공사", "철근 배근 및 돌출부 관리"): [
        "REBAR_IMPALEMENT_PREVENTION",
        "OPENING_FALL_COVER",
        "HOUSEKEEPING_TRIP_FALL",
    ],
    ("외부 마감공사", "외장 패널 취부"): [
        "SCAFFOLD_EDGE_FALL_PREVENTION",
        "EXTERIOR_PANEL_EDGE_FALL",
        "AERIAL_LIFT_FALL_PREVENTION",
    ],
    ("외부 마감공사", "고소작업대 사용 작업"): [
        "AERIAL_LIFT_FALL_PREVENTION",
        "SCAFFOLD_EDGE_FALL_PREVENTION",
        "EXTERIOR_PANEL_EDGE_FALL",
    ],
    ("외부 마감공사", "비계 및 작업발판 작업"): [
        "SCAFFOLD_EDGE_FALL_PREVENTION",
        "MOBILE_SCAFFOLD_FALL_PREVENTION",
        "AERIAL_LIFT_FALL_PREVENTION",
    ],
    ("지붕공사", "방수 및 지붕 작업"): [
        "ROOF_EDGE_FALL_PROTECTION",
        "LADDER_FALL_PREVENTION",
    ],
    ("내부 마감공사", "사다리 사용 작업"): [
        "LADDER_FALL_PREVENTION",
        "TEMPORARY_POWER_ELECTRIC_SHOCK",
        "WELDING_FIRE_PREVENTION",
    ],
}
_FUTURE_PROCESS_RULE_KEYS_BY_MAJOR: dict[str, list[str]] = {
    "기초 및 토공사": [
        "EARTH_RETAINING_SHORING_COLLAPSE_FALL",
        "EXCAVATOR_COLLISION_PREVENTION",
        "DUMP_TRUCK_BACKING_COLLISION",
        "MOBILE_CRANE_OVERTURN_PREVENTION",
    ],
    "골조공사": [
        "STEEL_FRAME_FALL_PROTECTION",
        "FORMWORK_SHORING_COLLAPSE_PREVENTION",
        "LIFTING_STRUCK_BY_LOAD",
        "OPENING_FALL_COVER",
        "REBAR_IMPALEMENT_PREVENTION",
    ],
    "외부 마감공사": [
        "SCAFFOLD_EDGE_FALL_PREVENTION",
        "EXTERIOR_PANEL_EDGE_FALL",
        "AERIAL_LIFT_FALL_PREVENTION",
        "MOBILE_SCAFFOLD_FALL_PREVENTION",
    ],
    "내부 마감공사": [
        "TEMPORARY_POWER_ELECTRIC_SHOCK",
        "WELDING_FIRE_PREVENTION",
        "LADDER_FALL_PREVENTION",
        "COMPRESSOR_HOSE_TRIP_PRESSURE",
        "GRINDER_CUTTING_INJURY",
    ],
    "지붕공사": [
        "ROOF_EDGE_FALL_PROTECTION",
        "LADDER_FALL_PREVENTION",
    ],
    "기타": [
        "HOUSEKEEPING_TRIP_FALL",
        "MATERIAL_STACK_COLLAPSE",
        "CONFINED_SPACE_SUFFOCATION_PREVENTION",
    ],
}


def _safe_text(value: object) -> str:
    return str(value or "").strip()


def _normalize_text(value: object) -> str:
    return _safe_text(value).lower()


def _merge_keywords(*groups: list[str]) -> list[str]:
    rows: list[str] = []
    seen: set[str] = set()
    for group in groups:
        for keyword in group:
            normalized = _safe_text(keyword)
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            rows.append(normalized)
    return rows


def _rule(
    *,
    key: str,
    major_process: str,
    detail_process: str,
    accident_types: list[str],
    causative_agent: str,
    causative_agent_key: str,
    causative_agent_aliases: list[str],
    hazard_keywords: list[str],
    process_keywords: list[str],
    location_keywords: list[str],
    standard_hazard_text: str,
    standard_guidance_text: str,
    standard_preventive_measure: str,
    default_risk_level: str,
    reference_material_candidates: list[str],
    location_fallback: str,
    applies_to_photo_roles: list[str] | None = None,
    legal_reference_candidates: list[str] | None = None,
) -> StandardRiskRule:
    return {
        "key": key,
        "id": key,
        "majorProcess": major_process,
        "detailProcess": detail_process,
        "accidentType": accident_types[0] if accident_types else "",
        "accidentTypes": list(accident_types),
        "causativeAgent": causative_agent,
        "causativeAgentKey": causative_agent_key,
        "causativeAgentAliases": list(causative_agent_aliases),
        "keywords": _merge_keywords(
            list(causative_agent_aliases),
            list(hazard_keywords),
            list(process_keywords),
            list(location_keywords),
        ),
        "hazardKeywords": list(hazard_keywords),
        "processKeywords": list(process_keywords),
        "locationKeywords": list(location_keywords),
        "appliesToPhotoRoles": list(applies_to_photo_roles or _DEFAULT_RULE_SCOPE),
        "standardHazardText": standard_hazard_text,
        "standardGuidanceText": standard_guidance_text,
        "standardCountermeasureText": standard_preventive_measure,
        "standardPreventiveMeasure": standard_preventive_measure,
        "defaultRiskLevel": default_risk_level,
        "legalReferenceCandidates": list(
            legal_reference_candidates or _DEFAULT_LAW_REFERENCES
        ),
        "referenceMaterialCandidates": list(reference_material_candidates),
        "locationFallback": location_fallback,
    }


STANDARD_RISK_RULES: list[StandardRiskRule] = [
    _rule(
        key="OPENING_FALL_COVER",
        major_process="골조공사",
        detail_process="단부 및 개구부 주변 작업",
        accident_types=["추락"],
        causative_agent="단부 및 개구부",
        causative_agent_key="temporary_structure",
        causative_agent_aliases=["단부 및 개구부", "개구부", "단부", "난간", "안전난간"],
        hazard_keywords=["개구부", "덮개", "난간", "추락", "단부"],
        process_keywords=["개구부", "슬래브", "골조", "통로"],
        location_keywords=["개구부", "단부", "작업통로"],
        standard_hazard_text="단부 및 개구부 주변 방호조치 미흡으로 인한 추락 위험",
        standard_guidance_text="단부 및 개구부에는 견고한 덮개 또는 안전난간을 설치하고 임의 이동 방지조치 및 위험표지를 유지하실 것",
        standard_preventive_measure="개구부 덮개 고정, 안전난간 설치, 위험표지 부착 및 작업 전 상태 확인을 실시",
        default_risk_level="상",
        reference_material_candidates=["개구부 추락방지 안전점검표"],
        location_fallback="단부 및 개구부 주변",
    ),
    _rule(
        key="STAIR_GUARDRAIL_FALL_PREVENTION",
        major_process="골조공사",
        detail_process="계단 및 계단참 작업",
        accident_types=["추락"],
        causative_agent="계단 및 계단참",
        causative_agent_key="stair_edge",
        causative_agent_aliases=["계단", "계단참", "난간", "안전난간"],
        hazard_keywords=["계단", "계단참", "난간", "추락", "개방부"],
        process_keywords=["통로", "이동", "골조", "마감"],
        location_keywords=["계단", "계단참", "수직통로"],
        standard_hazard_text="계단 및 계단참에 안전난간이 미설치되어 이동 중 추락 위험",
        standard_guidance_text="계단 및 계단참에는 안전난간과 손잡이를 설치하고 임시 통로 사용 전 방호상태를 재확인하실 것",
        standard_preventive_measure="계단 및 계단참 안전난간 설치, 손잡이 고정, 개방부 방호 및 이동통로 점검을 실시",
        default_risk_level="상",
        reference_material_candidates=["계단·통로 안전점검표"],
        location_fallback="계단 및 계단참 주변",
    ),
    _rule(
        key="REBAR_IMPALEMENT_PREVENTION",
        major_process="골조공사",
        detail_process="철근 배근 및 돌출부 관리",
        accident_types=["절단/베임/찔림", "넘어짐", "협착", "전도", "추락"],
        causative_agent="돌출 철근",
        causative_agent_key="rebar",
        causative_agent_aliases=["철근", "돌출 철근", "배근", "rebar"],
        hazard_keywords=["철근", "돌출", "찔림", "넘어짐", "보호캡", "개구부"],
        process_keywords=["철근", "배근", "골조", "슬래브", "기초"],
        location_keywords=["철근", "배근구간", "통로", "개구부"],
        standard_hazard_text="철근 돌출부 접촉 및 통로 간섭에 따른 찔림·넘어짐 위험",
        standard_guidance_text="철근 돌출부에는 보호캡을 설치하고 보행통로와 작업구간을 구분하여 접근통제 상태를 확인하실 것",
        standard_preventive_measure="철근 보호캡 설치, 돌출부 식별표시, 보행통로 정리 및 접근통제를 실시",
        default_risk_level="중",
        reference_material_candidates=["철근 돌출부 보호조치 점검표"],
        location_fallback="철근 배근 및 돌출부 주변",
    ),
    _rule(
        key="SCAFFOLD_EDGE_FALL_PREVENTION",
        major_process="외부 마감공사",
        detail_process="비계 및 작업발판 작업",
        accident_types=["추락"],
        causative_agent="비계 및 작업발판",
        causative_agent_key="temporary_structure",
        causative_agent_aliases=["비계", "작업발판", "강관비계", "외곽 작업부"],
        hazard_keywords=["비계", "작업발판", "난간", "추락", "외곽"],
        process_keywords=["비계", "발판", "외장", "도장", "석재"],
        location_keywords=["외곽", "비계", "작업발판"],
        standard_hazard_text="비계 및 작업발판 가장자리 작업 시 추락 위험",
        standard_guidance_text="비계와 작업발판의 설치상태, 안전난간, 발판 고정상태를 점검하고 추락방지조치를 유지하실 것",
        standard_preventive_measure="안전난간 보강, 작업발판 고정, 발판 간격 점검 및 자재 적치 제한을 실시",
        default_risk_level="중",
        reference_material_candidates=["비계·작업발판 안전점검표"],
        location_fallback="비계 및 작업발판 주변",
    ),
    _rule(
        key="LADDER_FALL_PREVENTION",
        major_process="내부 마감공사",
        detail_process="사다리 사용 작업",
        accident_types=["추락", "전도"],
        causative_agent="사다리",
        causative_agent_key="portable_ladder",
        causative_agent_aliases=["사다리", "이동식 사다리", "A형사다리"],
        hazard_keywords=["사다리", "전도", "추락", "미고정", "미끄럼"],
        process_keywords=["설비", "전기", "마감", "천장", "보수"],
        location_keywords=["실내", "복도", "천장", "통로"],
        standard_hazard_text="사다리 사용 중 전도 및 추락 위험",
        standard_guidance_text="사다리는 견고한 바닥에 설치하고 전도방지, 미끄럼방지, 상부 고정조치를 확인한 후 2인 1조로 사용하실 것",
        standard_preventive_measure="사다리 고정, 미끄럼방지 상태 확인, 2인 1조 사용, 필요 시 안전대 또는 이동식 작업발판 대체 사용 및 과도한 상부작업 금지를 실시",
        default_risk_level="중",
        reference_material_candidates=["사다리 작업 안전수칙"],
        location_fallback="사다리 사용 작업구간",
    ),
    _rule(
        key="MOBILE_SCAFFOLD_FALL_PREVENTION",
        major_process="외부 마감공사",
        detail_process="이동식비계 사용 작업",
        accident_types=["추락", "전도"],
        causative_agent="이동식비계",
        causative_agent_key="mobile_scaffold",
        causative_agent_aliases=["이동식비계", "이동식 발판", "이동식 작업발판"],
        hazard_keywords=["이동식비계", "바퀴", "난간", "추락", "전도"],
        process_keywords=["보수", "외장", "설비", "점검"],
        location_keywords=["외곽", "작업구간", "통로"],
        standard_hazard_text="이동식비계 사용 중 난간 미비와 바퀴 고정 불량으로 인한 추락 및 전도 위험",
        standard_guidance_text="이동식비계 작업 전 난간, 발판, 바퀴고정 및 아웃트리거 상태를 점검하고 이동 중 탑승을 금지하실 것",
        standard_preventive_measure="난간 설치, 바퀴 잠금 확인, 아웃트리거 보강 및 이동 중 탑승 금지를 실시",
        default_risk_level="중",
        reference_material_candidates=["이동식비계 사용 전 점검표"],
        location_fallback="이동식비계 사용 작업구간",
    ),
    _rule(
        key="EARTH_RETAINING_SHORING_COLLAPSE_FALL",
        major_process="기초 및 토공사",
        detail_process="흙막이 지보공 작업",
        accident_types=["붕괴", "추락"],
        causative_agent="흙막이 지보공",
        causative_agent_key="earth_retaining_support",
        causative_agent_aliases=["흙막이", "지보공", "토류판", "버팀보"],
        hazard_keywords=["흙막이", "지보공", "버팀보", "붕괴", "추락"],
        process_keywords=["굴착", "터파기", "흙막이", "지보공"],
        location_keywords=["굴착부", "흙막이", "버팀보"],
        standard_hazard_text="흙막이 지보공 변형 또는 방호조치 미흡으로 인한 붕괴 및 추락 위험",
        standard_guidance_text="흙막이 지보공의 변형, 이완, 접합상태를 점검하고 개방부 주변 방호와 접근통제를 유지하실 것",
        standard_preventive_measure="지보공 변형 점검, 부재 보강, 개방부 방호 및 작업구간 접근통제를 실시",
        default_risk_level="상",
        reference_material_candidates=["흙막이 지보공 안전점검표"],
        location_fallback="흙막이 지보공 주변",
    ),
    _rule(
        key="FORMWORK_SHORING_COLLAPSE_PREVENTION",
        major_process="골조공사",
        detail_process="거푸집 및 동바리 작업",
        accident_types=["붕괴", "협착"],
        causative_agent="거푸집 및 동바리",
        causative_agent_key="temporary_structure",
        causative_agent_aliases=["거푸집", "동바리", "서포트", "지지대"],
        hazard_keywords=["거푸집", "동바리", "붕괴", "협착", "전도"],
        process_keywords=["거푸집", "동바리", "콘크리트", "타설", "해체"],
        location_keywords=["슬래브", "보", "지하", "타설구간"],
        standard_hazard_text="거푸집 및 동바리 조립·해체 과정에서 붕괴 및 협착 위험",
        standard_guidance_text="거푸집 및 동바리의 설치기준 준수 여부와 지지상태를 점검하고 해체 전 작업순서를 확인하실 것",
        standard_preventive_measure="지지상태 점검, 부재 고정, 해체순서 준수 및 작업구간 출입통제를 실시",
        default_risk_level="상",
        reference_material_candidates=["거푸집·동바리 안전작업 기준"],
        location_fallback="거푸집 및 동바리 작업구간",
    ),
    _rule(
        key="STEEL_FRAME_FALL_PROTECTION",
        major_process="골조공사",
        detail_process="철골 설치 작업",
        accident_types=["추락"],
        causative_agent="철골 및 외곽 단부",
        causative_agent_key="steel_frame",
        causative_agent_aliases=["철골", "외곽 단부", "철골 작업발판", "볼트 체결부"],
        hazard_keywords=["철골", "외곽", "단부", "추락", "작업발판"],
        process_keywords=["철골", "골조", "조립", "설치", "볼트"],
        location_keywords=["외곽", "철골", "상부", "설치구간"],
        standard_hazard_text="철골 설치 작업 시 외곽부 및 작업발판 주변 추락 위험",
        standard_guidance_text="철골 설치 구간의 작업발판과 외곽 단부 방호조치를 점검하고 추락방지시설 유지상태를 재확인하실 것",
        standard_preventive_measure="외곽 단부 안전난간 설치, 작업발판 고정, 안전대 부착설비 확보 및 작업 전 점검을 실시",
        default_risk_level="중",
        reference_material_candidates=["철골공사 안전점검표"],
        location_fallback="철골 설치 및 외곽 작업구간",
    ),
    _rule(
        key="LIFTING_STRUCK_BY_LOAD",
        major_process="골조공사",
        detail_process="자재 인양 및 반입",
        accident_types=["낙하", "충돌", "물체에 맞음"],
        causative_agent="인양 자재 및 크레인",
        causative_agent_key="lifting_load",
        causative_agent_aliases=["인양", "양중", "자재", "크레인", "하역"],
        hazard_keywords=["인양", "양중", "자재", "낙하", "충돌"],
        process_keywords=["인양", "반입", "하역", "적치"],
        location_keywords=["반입", "하역", "양중", "작업반경"],
        standard_hazard_text="인양 자재 하부 접근과 작업반경 혼재로 인한 충돌 및 낙하물 위험",
        standard_guidance_text="인양 작업반경 내 근로자 출입을 통제하고 신호수 배치 및 하부 접근금지 조치를 이행하실 것",
        standard_preventive_measure="작업반경 내 출입금지, 신호수 배치, 하부 접근 통제 및 인양계획 공유를 실시",
        default_risk_level="중",
        reference_material_candidates=["양중작업 안전수칙"],
        location_fallback="인양 자재 반입 및 하역 구간",
    ),
    _rule(
        key="MOBILE_CRANE_OVERTURN_PREVENTION",
        major_process="기초 및 토공사",
        detail_process="이동식크레인 작업",
        accident_types=["낙하", "충돌", "전도"],
        causative_agent="이동식크레인",
        causative_agent_key="mobile_crane",
        causative_agent_aliases=["이동식크레인", "크레인", "아웃트리거", "양중장비"],
        hazard_keywords=["크레인", "낙하", "충돌", "아웃트리거", "전도"],
        process_keywords=["양중", "철근", "거푸집", "하역", "설치"],
        location_keywords=["작업반경", "지반", "진입로", "하역구간"],
        standard_hazard_text="이동식크레인 작업 시 인양물 낙하, 작업반경 충돌 및 지반 불량에 따른 전도 위험",
        standard_guidance_text="이동식크레인 설치 전 지반상태와 아웃트리거 지지상태를 확인하고 양중계획과 작업반경 통제를 준수하실 것",
        standard_preventive_measure="지반다짐 확인, 아웃트리거 받침 설치, 작업반경 통제 및 정격하중 준수를 실시",
        default_risk_level="상",
        reference_material_candidates=["이동식크레인 작업계획서 점검표"],
        location_fallback="이동식크레인 작업반경",
    ),
    _rule(
        key="EXCAVATION_COLLAPSE_ACCESS",
        major_process="기초 및 토공사",
        detail_process="굴착 작업",
        accident_types=["붕괴"],
        causative_agent="굴착 사면",
        causative_agent_key="excavation_edge",
        causative_agent_aliases=["굴착", "사면", "터파기", "흙막이"],
        hazard_keywords=["굴착", "사면", "붕괴", "접근", "토사"],
        process_keywords=["굴착", "터파기", "흙막이", "토공"],
        location_keywords=["굴착부", "사면", "흙막이"],
        standard_hazard_text="굴착부 주변 접근 및 사면 상태 미확인에 따른 붕괴 위험",
        standard_guidance_text="굴착부 주변 출입을 통제하고 사면 안정상태와 장비 작업반경을 수시로 점검하실 것",
        standard_preventive_measure="사면 안정상태 점검, 작업반경 출입통제, 장비 동선 분리 및 우천 후 재점검을 실시",
        default_risk_level="중",
        reference_material_candidates=["굴착공사 안전점검표"],
        location_fallback="굴착부 주변",
    ),
    _rule(
        key="EXCAVATOR_COLLISION_PREVENTION",
        major_process="기초 및 토공사",
        detail_process="굴착기 작업",
        accident_types=["충돌"],
        causative_agent="굴착기",
        causative_agent_key="excavator",
        causative_agent_aliases=["굴착기", "백호우", "장비 작업반경"],
        hazard_keywords=["굴착기", "작업반경", "신호수", "충돌"],
        process_keywords=["굴착", "터파기", "상차", "토공"],
        location_keywords=["작업반경", "진입로", "사면"],
        standard_hazard_text="굴착기 작업반경 내 출입과 장비 이동 중 충돌 위험",
        standard_guidance_text="굴착기 작업반경 내 근로자 출입을 금지하고 신호수 배치 및 장비 이동동선을 분리하실 것",
        standard_preventive_measure="작업반경 출입금지, 신호수 배치, 장비 유도 및 보행동선 분리를 실시",
        default_risk_level="중",
        reference_material_candidates=["굴착기 작업 안전수칙"],
        location_fallback="굴착기 작업반경",
    ),
    _rule(
        key="DUMP_TRUCK_BACKING_COLLISION",
        major_process="기초 및 토공사",
        detail_process="덤프트럭 후진 작업",
        accident_types=["충돌", "물체에 맞음"],
        causative_agent="덤프트럭",
        causative_agent_key="dump_truck",
        causative_agent_aliases=["덤프트럭", "후진차량", "운반트럭"],
        hazard_keywords=["덤프트럭", "후진", "유도", "충돌", "협착"],
        process_keywords=["반출", "적재", "운반", "토공"],
        location_keywords=["진입로", "적재장", "후진구간"],
        standard_hazard_text="덤프트럭 후진 및 적재구간 작업 중 충돌 위험",
        standard_guidance_text="덤프트럭 후진 시 유도자를 배치하고 보행동선과 차량동선을 분리하여 충돌을 예방하실 것",
        standard_preventive_measure="후진 유도자 배치, 경고음 확인, 보행동선 분리 및 적재장 출입통제를 실시",
        default_risk_level="중",
        reference_material_candidates=["건설기계 후진작업 안전수칙"],
        location_fallback="덤프트럭 후진 작업구간",
    ),
    _rule(
        key="AERIAL_LIFT_FALL_PREVENTION",
        major_process="외부 마감공사",
        detail_process="고소작업대 사용 작업",
        accident_types=["추락", "협착"],
        causative_agent="고소작업대",
        causative_agent_key="aerial_lift",
        causative_agent_aliases=["고소작업대", "시저리프트", "붐리프트"],
        hazard_keywords=["고소작업대", "리프트", "추락", "협착", "난간"],
        process_keywords=["외장", "설비", "점검", "보수"],
        location_keywords=["상부", "외곽", "천장"],
        standard_hazard_text="고소작업대 사용 중 추락 및 협착 위험",
        standard_guidance_text="고소작업대 사용 전 난간, 바퀴고정, 비상하강장치 상태를 점검하고 승강 중 몸을 내밀지 않도록 관리하실 것",
        standard_preventive_measure="난간 상태 점검, 안전대 체결, 평탄한 바닥 확보 및 협착위험 구간 접근통제를 실시",
        default_risk_level="중",
        reference_material_candidates=["고소작업대 사용 전 점검표"],
        location_fallback="고소작업대 사용 작업구간",
    ),
    _rule(
        key="TEMPORARY_POWER_ELECTRIC_SHOCK",
        major_process="내부 마감공사",
        detail_process="가설전기 및 전기설비 작업",
        accident_types=["감전", "화재"],
        causative_agent="전기설비",
        causative_agent_key="temporary_power",
        causative_agent_aliases=["가설전기", "분전반", "배선", "전선", "전기설비"],
        hazard_keywords=["감전", "분전반", "배선", "누전", "전선", "전기"],
        process_keywords=["전기", "배선", "내부", "설비"],
        location_keywords=["통로", "분전반", "실내", "전기실"],
        standard_hazard_text="가설전기 및 전기설비 사용 중 감전 위험",
        standard_guidance_text="가설전기 설비의 누전차단기 작동상태와 배선 손상 여부를 점검하고 임시배선을 정리하실 것",
        standard_preventive_measure="누전차단기 점검, 배선 절연상태 확인, 전선 정리 및 분전반 잠금조치를 실시",
        default_risk_level="중",
        reference_material_candidates=["가설전기 안전관리 기준"],
        location_fallback="가설전기 및 분전반 주변",
    ),
    _rule(
        key="COMPRESSOR_HOSE_TRIP_PRESSURE",
        major_process="내부 마감공사",
        detail_process="공기압축기 및 호스 사용 작업",
        accident_types=["전도", "충돌"],
        causative_agent="공기압축기 및 호스",
        causative_agent_key="compressor",
        causative_agent_aliases=["공기압축기", "압축기", "컴프레서", "호스", "compressor"],
        hazard_keywords=["호스", "넘어짐", "압력", "방치", "전도"],
        process_keywords=["설비", "마감", "청소", "보수", "공압"],
        location_keywords=["통로", "실내", "작업구간"],
        standard_hazard_text="공기압축기 호스 방치와 압력장치 관리 미흡에 따른 넘어짐 및 압력 위험",
        standard_guidance_text="공기압축기와 호스는 통로를 침범하지 않도록 정리하고 압력장치 이상 여부와 연결부 상태를 확인하실 것",
        standard_preventive_measure="호스 정리, 압력계·연결부 점검, 통로 확보 및 작업 전 이상 유무 확인을 실시",
        default_risk_level="중",
        reference_material_candidates=["공기압축기 사용 안전수칙"],
        location_fallback="공기압축기 및 호스 사용 작업구간",
    ),
    _rule(
        key="HOUSEKEEPING_TRIP_FALL",
        major_process="기타",
        detail_process="정리정돈 및 보행통로 관리",
        accident_types=["전도", "추락"],
        causative_agent="정리되지 않은 통로",
        causative_agent_key="housekeeping",
        causative_agent_aliases=["통로", "정리정돈", "폐기물", "자재", "housekeeping"],
        hazard_keywords=["정리", "청소", "폐기물", "통로", "넘어짐", "단차"],
        process_keywords=["정리", "청소", "마감", "이동", "반출"],
        location_keywords=["통로", "출입구", "작업구간"],
        standard_hazard_text="통로 정리정돈 미흡과 장애물 방치에 따른 넘어짐 위험",
        standard_guidance_text="보행통로의 자재와 폐기물을 정리하고 미끄럼·단차·장애물 상태를 점검하실 것",
        standard_preventive_measure="보행통로 확보, 장애물 제거, 폐기물 정리 및 미끄럼 방지상태 확인을 실시",
        default_risk_level="하",
        reference_material_candidates=["현장 정리정돈 안전점검표"],
        location_fallback="보행통로 및 작업구간",
    ),
    _rule(
        key="MATERIAL_STACK_COLLAPSE",
        major_process="기타",
        detail_process="자재 적재 및 보관",
        accident_types=["붕괴", "낙하", "전도"],
        causative_agent="적재 자재",
        causative_agent_key="material_stack",
        causative_agent_aliases=["적재", "자재더미", "자재", "팔레트", "material stack"],
        hazard_keywords=["적재", "붕괴", "낙하", "전도", "받침", "결속"],
        process_keywords=["자재", "반입", "보관", "적치"],
        location_keywords=["자재보관", "적치장", "통로"],
        standard_hazard_text="자재 적재 불량에 따른 전도·붕괴 및 낙하 위험",
        standard_guidance_text="자재 적재 높이와 받침·결속 상태를 확인하고 보행통로와 적치구역을 분리하실 것",
        standard_preventive_measure="적재높이 제한, 받침·결속 보강, 통로 분리 및 낙하 위험구간 접근통제를 실시",
        default_risk_level="중",
        reference_material_candidates=["자재 적재 및 보관 안전수칙"],
        location_fallback="자재 적재 및 보관구간",
    ),
    _rule(
        key="GRINDER_CUTTING_INJURY",
        major_process="내부 마감공사",
        detail_process="그라인더 및 절단 작업",
        accident_types=["협착", "화재"],
        causative_agent="그라인더 및 절단기",
        causative_agent_key="grinder",
        causative_agent_aliases=["그라인더", "연삭기", "절단기", "grinder"],
        hazard_keywords=["그라인더", "연삭", "절단", "비산", "불티", "접촉"],
        process_keywords=["금속", "절단", "설비", "보수"],
        location_keywords=["작업구간", "실내", "철물"],
        standard_hazard_text="그라인더 사용 중 회전부 접촉, 비산물 및 불티에 따른 상해 위험",
        standard_guidance_text="그라인더 방호덮개와 보안경 착용 상태를 확인하고 불티비산 방지 및 가연물 제거 조치를 이행하실 것",
        standard_preventive_measure="방호덮개 설치, 보안경·안면보호구 착용, 불티비산 방지 및 가연물 제거를 실시",
        default_risk_level="중",
        reference_material_candidates=["그라인더 작업 안전수칙"],
        location_fallback="그라인더 및 절단 작업구간",
    ),
    _rule(
        key="WELDING_FIRE_PREVENTION",
        major_process="내부 마감공사",
        detail_process="용접 및 절단 작업",
        accident_types=["화재", "화상"],
        causative_agent="용접기 및 절단기",
        causative_agent_key="welding_equipment",
        causative_agent_aliases=["용접기", "절단기", "용접", "절단", "불티"],
        hazard_keywords=["용접", "절단", "불티", "화재", "가연물"],
        process_keywords=["설비", "배관", "철물", "보수"],
        location_keywords=["실내", "작업구역", "자재적치"],
        standard_hazard_text="용접 및 절단 작업 중 비산불티에 의한 화재 위험",
        standard_guidance_text="용접·절단 작업 전 가연물을 제거하고 소화기 비치 및 화재감시자를 배치하실 것",
        standard_preventive_measure="가연물 제거, 불티비산방지포 설치, 소화기 비치 및 화재감시를 실시",
        default_risk_level="중",
        reference_material_candidates=["용접·절단 작업 화재예방 수칙"],
        location_fallback="용접 및 절단 작업구간",
    ),
    _rule(
        key="CONFINED_SPACE_SUFFOCATION_PREVENTION",
        major_process="기타",
        detail_process="밀폐공간 작업",
        accident_types=["질식"],
        causative_agent="밀폐공간",
        causative_agent_key="confined_space",
        causative_agent_aliases=["밀폐공간", "탱크", "맨홀", "지하 pit", "저수조"],
        hazard_keywords=["밀폐공간", "질식", "산소결핍", "유해가스", "환기"],
        process_keywords=["청소", "보수", "점검", "배관", "설비"],
        location_keywords=["탱크", "맨홀", "지하실", "pit"],
        standard_hazard_text="밀폐공간 내부 산소결핍 및 유해가스에 의한 질식 위험",
        standard_guidance_text="밀폐공간 출입 전 산소 및 유해가스 농도를 측정하고 환기, 감시인 배치, 구조장비 확보 후 작업하실 것",
        standard_preventive_measure="산소·가스 측정, 강제환기, 감시인 배치 및 구조장비 확보 후 작업을 실시",
        default_risk_level="상",
        reference_material_candidates=["밀폐공간 작업 안전수칙"],
        location_fallback="밀폐공간 작업구간",
    ),
    _rule(
        key="EXTERIOR_PANEL_EDGE_FALL",
        major_process="외부 마감공사",
        detail_process="외장 패널 취부",
        accident_types=["추락"],
        causative_agent="외곽 작업부 및 작업발판",
        causative_agent_key="temporary_structure",
        causative_agent_aliases=["외장 패널", "외곽", "작업발판", "파사드"],
        hazard_keywords=["외장", "패널", "외곽", "추락", "발판"],
        process_keywords=["외장", "패널", "취부", "마감"],
        location_keywords=["외곽", "패널", "파사드"],
        standard_hazard_text="외장 패널 취부 과정에서 외곽부 접근과 작업발판 사용에 따른 추락 위험",
        standard_guidance_text="외곽부 작업 전 작업발판 고정상태와 추락방지시설을 확인하고 근로자 접근동선을 정리하실 것",
        standard_preventive_measure="외곽부 방호조치 보강, 작업발판 고정, 안전대 사용점검 및 자재 적치구간 분리를 실시",
        default_risk_level="중",
        reference_material_candidates=["외장마감 고소작업 안전수칙"],
        location_fallback="외장 패널 취부 작업구간",
    ),
    _rule(
        key="ROOF_EDGE_FALL_PROTECTION",
        major_process="지붕공사",
        detail_process="방수 및 지붕 작업",
        accident_types=["추락"],
        causative_agent="지붕 단부 및 채광창",
        causative_agent_key="temporary_structure",
        causative_agent_aliases=["지붕", "채광창", "단부", "방수"],
        hazard_keywords=["지붕", "방수", "단부", "채광창", "추락"],
        process_keywords=["지붕", "방수", "보수"],
        location_keywords=["지붕", "채광창", "단부"],
        standard_hazard_text="지붕 단부 및 채광창 주변 작업 시 추락 위험",
        standard_guidance_text="지붕 단부와 채광창 주변 방호상태를 점검하고 작업구역 접근통제를 유지하실 것",
        standard_preventive_measure="단부 안전난간 설치, 채광창 덮개 고정, 안전대 부착설비 확보 및 출입통제를 실시",
        default_risk_level="중",
        reference_material_candidates=["지붕작업 추락방지 점검표"],
        location_fallback="지붕 및 채광창 주변",
    ),
]


def get_standard_risk_rule(rule_key: str) -> StandardRiskRule | None:
    target_key = _safe_text(rule_key)
    if not target_key:
        return None
    for rule in STANDARD_RISK_RULES:
        if rule["key"] == target_key or rule["id"] == target_key:
            return rule
    return None


def list_standard_risk_rules() -> list[StandardRiskRule]:
    return [dict(rule) for rule in STANDARD_RISK_RULES]


def _process_signature_from_observation_and_match(
    overview_observation: dict[str, Any],
    overview_match: dict[str, Any] | None,
) -> tuple[str, str]:
    process = _observation_process(overview_observation)
    major_process = _safe_text(process.get("majorProcess"))
    detail_process = _safe_text(process.get("detailProcess"))
    if major_process and major_process != "확인 필요" and detail_process:
        return major_process, detail_process

    matched_rule = get_standard_risk_rule(
        _safe_text((overview_match or {}).get("ruleKey"))
    )
    if matched_rule is not None:
        return matched_rule["majorProcess"], matched_rule["detailProcess"]
    return major_process, detail_process


def _future_rule_keys_for_process(
    major_process: str,
    detail_process: str,
) -> list[str]:
    exact = _FUTURE_PROCESS_RULE_KEYS_BY_DETAIL.get((major_process, detail_process))
    if exact:
        return list(exact)
    return list(_FUTURE_PROCESS_RULE_KEYS_BY_MAJOR.get(major_process, []))


def _hazard_context_texts(
    photo_observations: list[dict[str, Any]],
    risk_matches: list[dict[str, Any]],
    *,
    target_major_process: str,
) -> list[str]:
    matches_by_id = {
        _safe_text(match.get("observationId")): match
        for match in risk_matches
        if _safe_text(match.get("observationId"))
    }
    texts: list[str] = []
    for observation in photo_observations:
        if _observation_photo_role(observation) != "step2_hazard":
            continue
        match = matches_by_id.get(_safe_text(observation.get("id")), {})
        matched_rule = get_standard_risk_rule(_safe_text(match.get("ruleKey")))
        if matched_rule is not None and matched_rule["majorProcess"] != target_major_process:
            continue
        risk = _observation_risk(observation)
        texts.extend(
            [
                _normalize_text(_safe_text(risk.get("hazardSummary"))),
                _normalize_text(_safe_text(risk.get("locationText"))),
                _normalize_text(_safe_text(risk.get("causativeAgent"))),
                _normalize_text(_safe_text(match.get("standardHazardText"))),
            ]
        )
    return [text for text in texts if text]


def recommend_future_process_rules(
    overview_observation: dict[str, Any],
    overview_match: dict[str, Any] | None,
    *,
    photo_observations: list[dict[str, Any]],
    risk_matches: list[dict[str, Any]],
    limit: int = 3,
) -> list[StandardRiskRule]:
    major_process, detail_process = _process_signature_from_observation_and_match(
        overview_observation,
        overview_match,
    )
    if not major_process or major_process == "확인 필요":
        return []

    ordered_keys = _future_rule_keys_for_process(major_process, detail_process)
    hazard_texts = _hazard_context_texts(
        photo_observations,
        risk_matches,
        target_major_process=major_process,
    )

    seen_keys: set[str] = set()
    selected_rules: list[StandardRiskRule] = []
    for rule_key in ordered_keys:
        rule = get_standard_risk_rule(rule_key)
        if rule is None or rule["key"] in seen_keys:
            continue
        seen_keys.add(rule["key"])
        selected_rules.append(rule)
        if len(selected_rules) >= limit:
            return selected_rules

    remaining_rules = [
        rule
        for rule in STANDARD_RISK_RULES
        if rule["majorProcess"] == major_process and rule["key"] not in seen_keys
    ]
    remaining_rules.sort(
        key=lambda rule: (
            -_keyword_hits(
                hazard_texts,
                rule["keywords"] + rule["processKeywords"],
            ),
            rule["detailProcess"],
            rule["key"],
        )
    )
    for rule in remaining_rules:
        selected_rules.append(rule)
        if len(selected_rules) >= limit:
            break
    return selected_rules


def _observation_process(observation: dict[str, Any]) -> dict[str, Any]:
    structured = observation.get("observedProcessStructured")
    return structured if isinstance(structured, dict) else {}


def _observation_risk(observation: dict[str, Any]) -> dict[str, Any]:
    structured = observation.get("observedRiskStructured")
    return structured if isinstance(structured, dict) else {}


def _observation_photo_role(observation: dict[str, Any]) -> str:
    return _safe_text(observation.get("photoRole"))


def _observation_confidence(observation: dict[str, Any]) -> float:
    try:
        return float(observation.get("confidence") or 0)
    except (TypeError, ValueError):
        return 0.0


def _keyword_hits(texts: list[str], keywords: list[str]) -> int:
    normalized_texts = [text for text in texts if text]
    hits = 0
    for keyword in keywords:
        normalized_keyword = _normalize_text(keyword)
        if normalized_keyword and any(
            normalized_keyword in text for text in normalized_texts
        ):
            hits += 1
    return hits


def _matches_alias(value: str, aliases: list[str]) -> bool:
    if not value:
        return False
    normalized_value = _normalize_text(value)
    return any(
        normalized_alias
        and (
            normalized_alias in normalized_value or normalized_value in normalized_alias
        )
        for normalized_alias in (_normalize_text(alias) for alias in aliases)
    )


def _score_rule(
    rule: StandardRiskRule,
    observation: dict[str, Any],
) -> tuple[float, list[str], int, int]:
    process = _observation_process(observation)
    risk = _observation_risk(observation)
    major_process = _safe_text(process.get("majorProcess"))
    detail_process = _safe_text(process.get("detailProcess"))
    observed_process = _safe_text(observation.get("observedProcess"))
    accident_type = _safe_text(risk.get("accidentType"))
    causative_agent = _safe_text(risk.get("causativeAgent"))
    causative_agent_key = _safe_text(risk.get("causativeAgentKey"))
    hazard_summary = _safe_text(risk.get("hazardSummary"))
    location_text = _safe_text(risk.get("locationText"))
    visual_objects = []
    for item in observation.get("visualObjects", []):
        if isinstance(item, dict):
            label = _safe_text(item.get("label"))
            category = _safe_text(item.get("category"))
            if label:
                visual_objects.append(_normalize_text(label))
            if category:
                visual_objects.append(_normalize_text(category))
            continue
        if _safe_text(item):
            visual_objects.append(_normalize_text(item))
    ai_text = observation.get("aiText") if isinstance(observation.get("aiText"), dict) else {}
    ai_text_values = [
        _normalize_text(ai_text.get("hazardDescription")),
        _normalize_text(ai_text.get("improvementPlan")),
        _normalize_text(ai_text.get("preventiveMeasure")),
        _normalize_text(ai_text.get("educationTopic")),
        _normalize_text(ai_text.get("supportMemo")),
    ]

    matched_by: list[str] = []
    score = 0.0
    exact_hits = 0
    keyword_hits = 0

    if detail_process and detail_process == rule["detailProcess"]:
        score += 4.0
        exact_hits += 1
        matched_by.append("process")
    elif (
        _keyword_hits(
            [_normalize_text(detail_process), _normalize_text(observed_process)],
            rule["processKeywords"],
        )
        > 0
    ):
        score += 1.5
        matched_by.append("process")

    if major_process and major_process == rule["majorProcess"]:
        score += 3.0
        exact_hits += 1
        if "process" not in matched_by:
            matched_by.append("process")

    if accident_type and accident_type in rule["accidentTypes"]:
        score += 3.0
        exact_hits += 1
        matched_by.append("accidentType")

    if causative_agent and _matches_alias(causative_agent, rule["causativeAgentAliases"]):
        score += 3.0
        exact_hits += 1
        matched_by.append("causativeAgent")

    if causative_agent_key and causative_agent_key == rule["causativeAgentKey"]:
        score += 3.0
        exact_hits += 1
        matched_by.append("causativeAgentKey")

    visual_hits = _keyword_hits(visual_objects, rule["keywords"] + rule["causativeAgentAliases"])
    if visual_hits > 0:
        score += min(visual_hits * 1.5, 3.0)
        keyword_hits += visual_hits
        matched_by.append("visualObject")

    keyword_hits += _keyword_hits(
        [
            _normalize_text(hazard_summary),
            _normalize_text(location_text),
            *ai_text_values,
        ],
        rule["keywords"],
    )
    if keyword_hits > 0:
        score += min(keyword_hits, 3)
        matched_by.append("keyword")

    return score, matched_by, exact_hits, keyword_hits


def _select_best_match(
    observation: dict[str, Any],
) -> tuple[StandardRiskRule | None, float, list[str], str]:
    photo_role = _observation_photo_role(observation)
    if not photo_role:
        return None, 0.0, [], "사진 역할이 없어 표준 위험 규칙을 선택할 수 없습니다."

    applicable_rules = [
        rule for rule in STANDARD_RISK_RULES if photo_role in rule["appliesToPhotoRoles"]
    ]
    if not applicable_rules:
        return None, 0.0, [], "해당 사진 역할에 적용 가능한 표준 위험 규칙이 없습니다."

    action_key = _safe_text(_observation_risk(observation).get("recommendedActionKey"))
    if action_key:
        direct_rule = get_standard_risk_rule(action_key)
        if direct_rule and photo_role in direct_rule["appliesToPhotoRoles"]:
            return direct_rule, 100.0, ["actionKey"], ""

    best_rule: StandardRiskRule | None = None
    best_score = 0.0
    best_labels: list[str] = []
    best_exact_hits = -1
    best_keyword_hits = -1
    best_key = ""

    for rule in applicable_rules:
        score, matched_by, exact_hits, keyword_hits = _score_rule(rule, observation)
        candidate_key = rule["key"]
        is_better = (
            score > best_score
            or (score == best_score and exact_hits > best_exact_hits)
            or (
                score == best_score
                and exact_hits == best_exact_hits
                and keyword_hits > best_keyword_hits
            )
            or (
                score == best_score
                and exact_hits == best_exact_hits
                and keyword_hits == best_keyword_hits
                and candidate_key < best_key
            )
        )
        if is_better:
            best_rule = rule
            best_score = score
            best_labels = matched_by
            best_exact_hits = exact_hits
            best_keyword_hits = keyword_hits
            best_key = candidate_key

    if best_rule is None or best_score < _RISK_LIBRARY_MATCH_THRESHOLD:
        return (
            None,
            best_score,
            best_labels,
            "표준 위험 라이브러리 매칭 점수가 낮아 확인 필요 상태로 남깁니다.",
        )
    return best_rule, best_score, best_labels, ""


def _normalize_match_score(
    raw_score: float,
    observation: dict[str, Any],
    *,
    matched: bool,
) -> float:
    if raw_score >= 100.0:
        return 1.0
    observation_confidence = _observation_confidence(observation)
    if matched:
        return round(
            max(min(raw_score / 12.0, 0.99), min(observation_confidence, 0.99)),
            2,
        )
    return round(
        max(min(raw_score / 12.0, 0.59), min(observation_confidence, 0.59)),
        2,
    )


def match_observation_to_risk_rule(observation: dict[str, Any]) -> RiskLibraryMatch:
    rule, raw_score, matched_by, fallback_reason = _select_best_match(observation)
    observation_id = _safe_text(observation.get("id"))
    photo_role = _observation_photo_role(observation)

    if rule is None:
        risk = _observation_risk(observation)
        hazard_text = _safe_text(risk.get("hazardSummary")) or "사진 기반 위험요인 현장 확인 필요"
        fallback_guidance = (
            f"확인 필요: {fallback_reason} 사진 초안을 기준으로 현장 확인 후 표준 개선대책을 확정해 주세요."
        )
        return {
            "observationId": observation_id,
            "photoRole": photo_role,
            "ruleKey": None,
            "matchScore": _normalize_match_score(raw_score, observation, matched=False),
            "matchedBy": matched_by,
            "standardHazardText": hazard_text,
            "standardGuidanceText": fallback_guidance,
            "standardCountermeasureText": fallback_guidance,
            "standardPreventiveMeasure": fallback_guidance,
            "riskLevel": "중",
            "needsHumanReview": True,
            "fallbackReason": fallback_reason,
        }

    needs_human_review = bool(observation.get("needsHumanReview", True)) or (
        _observation_confidence(observation) < _RISK_LIBRARY_LOW_CONFIDENCE
    )
    return {
        "observationId": observation_id,
        "photoRole": photo_role,
        "ruleKey": rule["key"],
        "matchScore": _normalize_match_score(raw_score, observation, matched=True),
        "matchedBy": matched_by,
        "standardHazardText": rule["standardHazardText"],
        "standardGuidanceText": rule["standardGuidanceText"],
        "standardCountermeasureText": rule["standardCountermeasureText"],
        "standardPreventiveMeasure": rule["standardPreventiveMeasure"],
        "riskLevel": rule["defaultRiskLevel"],
        "needsHumanReview": needs_human_review,
        "fallbackReason": "",
    }


def match_observations_to_risk_library(
    observations: list[dict[str, Any]],
) -> list[RiskLibraryMatch]:
    return [match_observation_to_risk_rule(observation) for observation in observations]
