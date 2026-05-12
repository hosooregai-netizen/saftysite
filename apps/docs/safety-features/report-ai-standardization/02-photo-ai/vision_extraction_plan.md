# Vision Extraction Plan

## 문제

현재 apps.zip은 사진의 픽셀 정보를 직접 분석하지 않고, filename/location_hint 중심으로 판단한다. 따라서 사다리 사진, 철근 사진을 넣어도 파일명이 `hazard`면 AI는 실제 사다리/철근/개구부를 알 수 없다.

## 목표

사진을 실제로 분석하는 Vision extraction layer를 추가한다.

## 신규 backend module

```text
apps/api/app/services/vision_photo_extractor.py
```

## 신규 함수

```py
def extract_photo_observation_with_vision(
    *,
    report_id: str,
    photo: dict[str, Any],
    role: str,
    report_meta: dict[str, Any],
    standard_context: dict[str, Any],
) -> dict[str, Any]:
    ...
```

## Vision prompt 요구사항

- JSON only
- 없는 정보는 만들지 말고 confidence를 낮춘다.
- 사진에서 보이는 객체/상황을 먼저 추출한다.
- 사고유형/기인물/위험요인/대책은 표준 후보 중 선택한다.
- 결과는 PhotoObservationCard schema에 맞춘다.

## Vision output 예시

```json
{
  "visualObjects": ["이동식 사다리", "실내 벽체 작업", "공기압축기", "전선"],
  "workContext": {
    "majorProcess": "내부 마감공사",
    "detailProcess": "사다리 사용 작업",
    "locationText": "실내 벽체 작업구간",
    "confidence": 0.82
  },
  "riskContext": {
    "accidentType": "떨어짐",
    "causativeAgent": "이동식 사다리",
    "causativeAgentKey": "ladder",
    "hazardSummary": "이동식 사다리 사용 중 전도 및 추락 위험",
    "unsafeCondition": "사다리 전도방지 조치 및 2인1조 확인 필요",
    "unsafeBehavior": "상부 작업 중 무리한 자세 가능성",
    "riskLevel": "중",
    "confidence": 0.78
  },
  "aiText": {
    "locationCandidate": "실내 벽체 작업구간",
    "hazardDescription": "이동식 사다리 사용 중 전도 및 추락 위험",
    "improvementPlan": "사다리 전도방지 조치, 2인1조 작업 및 안전대 사용 상태 확인 필요",
    "preventiveMeasure": "이동식 사다리 사용 전 지지상태와 미끄럼방지 조치 점검",
    "educationTopic": "이동식 사다리 안전작업 교육",
    "supportMemo": "사다리 사용 작업 전 안전수칙 및 전도방지 조치 안내"
  }
}
```

## fallback

OpenAI API key가 없거나 vision 실패 시 현재 keyword 기반 fallback을 사용한다. 단, fallback 결과는 반드시 `needsHumanReview=true`로 남긴다.
