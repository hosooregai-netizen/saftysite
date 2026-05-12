# Standard Risk Library Improvement

## 현재 문제

`standard_risk_library.py`의 rule은 표준화 방향이 좋지만, 실제 사진 기반 위험요인을 넓게 커버하기에는 부족하다. 특히 사다리, 철근, 개구부, 작업발판, 전선, 압축기, 고소작업대, 적재물 같은 기본 현장 객체가 충분히 mapping되지 않으면 `확인 필요`가 반복된다.

## 보강해야 할 rule categories

```text
LADDER_FALL_PREVENTION
OPENING_FALL_COVER
TEMPORARY_STAIRS_GUARDRAIL
REBAR_IMPALEMENT_PREVENTION
MOBILE_SCAFFOLD_FALL_PREVENTION
AERIAL_LIFT_FALL_PREVENTION
TEMPORARY_POWER_ELECTRIC_SHOCK
COMPRESSOR_HOSE_TRIP_PRESSURE
HOUSEKEEPING_TRIP_FALL
MATERIAL_STACK_COLLAPSE
WELDING_FIRE_PREVENTION
GRINDER_CUTTING_INJURY
```

## rule schema

```py
{
  "key": "LADDER_FALL_PREVENTION",
  "majorProcess": "내부 마감공사",
  "detailProcess": "사다리 사용 작업",
  "accidentType": "떨어짐",
  "causativeAgent": "이동식 사다리",
  "causativeAgentKey": "ladder",
  "keywords": ["사다리", "A형 사다리", "이동식 사다리", "말비계"],
  "hazardKeywords": ["추락", "전도", "미끄러짐"],
  "standardHazardText": "이동식 사다리 사용 중 전도 및 추락 위험",
  "standardGuidanceText": "이동식 사다리 지지상태, 전도방지 조치, 2인1조 작업 및 안전대 사용 상태 확인 필요",
  "standardPreventiveMeasure": "사다리 사용 전 미끄럼방지 상태와 작업자 안전수칙 준수 여부를 확인하고, 장시간 고소작업은 작업발판으로 대체하도록 지도",
  "defaultRiskLevel": "중",
  "legalReferenceCandidates": ["산업안전보건기준에 관한 규칙"],
  "referenceMaterialCandidates": ["이동식 사다리 안전작업 지침"],
  "locationFallback": "사다리 사용 작업구간"
}
```

## matching 개선

현재처럼 threshold가 너무 높으면 fallback이 많아진다. Vision extraction에서 `visualObjects`, `causativeAgent`, `accidentType`이 들어오면 rule 매칭 점수를 보강한다.

```text
visual object match +3
causative agent match +3
accident type match +2
process match +2
hazard keyword match +2
```

## QA

- 사다리 사진 → LADDER_FALL_PREVENTION
- 철근 돌출/배근 사진 → REBAR_IMPALEMENT_PREVENTION 또는 OPENING_FALL_COVER
- 고소작업대 사진 → AERIAL_LIFT_FALL_PREVENTION
- 개구부/단부 사진 → OPENING_FALL_COVER
