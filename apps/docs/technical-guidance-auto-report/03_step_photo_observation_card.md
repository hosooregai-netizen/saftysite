# Step 3. AI 사진 관찰카드 생성

## 목적

AI가 사진을 보고 바로 보고서 문장을 쓰지 않게 한다. 먼저 **사진 관찰카드**를 만들고, 이후 표준 위험 라이브러리와 섹션 컴포저가 보고서 문장으로 변환한다.

## 왜 관찰카드가 필요한가

사진에서 바로 보고서 문장을 만들면 다음 문제가 생긴다.

- 근거 사진과 문장의 연결이 약해진다.
- AI가 현장 정보를 지어낼 수 있다.
- 같은 위험요인도 매번 다른 문체로 작성된다.
- 사용자가 수정할 때 어떤 판단이 틀렸는지 찾기 어렵다.

따라서 AI 출력은 “보고서 문장”이 아니라 “구조화된 관찰값”이어야 한다.

## Photo Observation Card 스키마

```ts
type PhotoObservationCard = {
  id: string;
  reportId: string;
  photoAssetId: string;

  photoRole:
    | 'current_process'
    | 'current_hazard'
    | 'previous_guidance_check'
    | 'future_process_hint'
    | 'education_support'
    | 'site_overview'
    | 'unknown';

  observedProcess?: {
    majorProcess:
      | '기초 및 토공사'
      | '골조공사'
      | '내부 마감공사'
      | '외부 마감공사'
      | '지붕공사'
      | '기타'
      | '확인 필요';
    detailProcess?: string;
    confidence: number;
  };

  observedRisk?: {
    locationText?: string;
    accidentType:
      | '추락'
      | '낙하'
      | '충돌'
      | '붕괴'
      | '감전'
      | '화재'
      | '협착'
      | '전도'
      | '확인 필요';
    causativeAgent?: string;
    hazardSummary?: string;
    recommendedActionKey?: string;
    riskLevel: '상' | '중' | '하' | '확인 필요';
    confidence: number;
  };

  previousGuidanceCheck?: {
    matchedPreviousFindingId?: string;
    suggestedResult: '이행 완료' | '불이행' | '부분 이행' | '확인 필요';
    reason?: string;
    confidence: number;
  };

  supportObservation?: {
    supportType: '교육' | '자료보급' | '현장순회' | '기타' | '확인 필요';
    attendeeCountText?: string;
    topicCandidate?: string;
    contentCandidate?: string;
    confidence: number;
  };

  rawAiNotes: string;
  needsHumanReview: boolean;
  createdAt: string;
};
```

## AI 출력 예시

```json
{
  "id": "obs_001",
  "reportId": "report_123",
  "photoAssetId": "photo_001",
  "photoRole": "current_hazard",
  "observedProcess": {
    "majorProcess": "기초 및 토공사",
    "detailProcess": "굴착작업",
    "confidence": 0.82
  },
  "observedRisk": {
    "locationText": "굴착부 주변",
    "accidentType": "충돌",
    "causativeAgent": "굴착기",
    "hazardSummary": "굴착기 작업반경 내 근로자 접근 가능 및 출입통제 미흡",
    "recommendedActionKey": "EXCAVATOR_COLLISION_PREVENTION",
    "riskLevel": "중",
    "confidence": 0.78
  },
  "rawAiNotes": "굴착기와 작업구역이 식별되며 작업반경 통제 여부 확인 필요",
  "needsHumanReview": true,
  "createdAt": "2026-05-05T00:00:00Z"
}
```

## AI 프롬프트 원칙

AI에게는 반드시 다음 제한을 준다.

```md
사진에서 확인 가능한 관찰값만 JSON으로 반환한다.
확실하지 않은 값은 '확인 필요'로 표시한다.
현장명, 주소, 공사금액, 담당자, 공정률은 생성하지 않는다.
보고서 문장으로 쓰지 말고 공정, 위치, 위험요인, 재해유형, 기인물을 분리한다.
허용 목록 밖의 재해유형/위험수준은 사용하지 않는다.
```

## 현재 프로젝트 적용 포인트

현재 `apps/api/app/services/ai_pipeline.py`는 `_build_evidence_for_photo()`와 `finding_candidates`를 바로 만든다. 개편 후에는 다음 순서로 바꾼다.

```py
photo_observations = analyze_photos_to_observation_cards(...)
risk_matches = match_observations_to_risk_library(photo_observations)
section_drafts = compose_standard_report_sections(...)
```

## 완료 조건

- `photoEvidence`에는 사진별 관찰 요약이 들어간다.
- `findingCandidates`는 관찰카드 + 위험 라이브러리 매칭 결과로 생성된다.
- AI가 직접 현장 사실정보를 생성하지 않는다.
- 모든 AI 관찰값에는 `confidence`와 `needsHumanReview`가 있다.
