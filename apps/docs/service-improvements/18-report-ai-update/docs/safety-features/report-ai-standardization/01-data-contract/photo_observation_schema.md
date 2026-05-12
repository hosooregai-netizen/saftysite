# Photo Observation Schema

## 목표

사진 한 장이 보고서 필드로 이어지려면 단순 `category`가 아니라 구조화된 관찰카드가 필요하다.

## 권장 schema

```ts
type PhotoObservationCard = {
  id: string;
  reportId: string;
  photoAssetId: string;

  photoRole:
    | 'step1_overview'
    | 'step2_hazard'
    | 'followup'
    | 'education'
    | 'support'
    | 'other';

  visualObjects: string[];
  workContext: {
    majorProcess: string;
    detailProcess: string;
    locationText: string;
    confidence: number;
  };

  riskContext: {
    accidentType: string;
    causativeAgent: string;
    causativeAgentKey: string;
    hazardSummary: string;
    unsafeCondition: string;
    unsafeBehavior: string;
    riskLevel: '상' | '중' | '하' | '확인 필요';
    confidence: number;
  };

  standardMapping: {
    ruleKey: string | null;
    matchScore: number;
    matchedBy: string[];
    fallbackReason: string;
  };

  aiText: {
    locationCandidate: string;
    hazardDescription: string;
    improvementPlan: string;
    preventiveMeasure: string;
    educationTopic: string;
    supportMemo: string;
  };

  needsHumanReview: boolean;
  reviewReasons: string[];
  createdAt: string;
};
```

## 핵심

사진에서 바로 보고서 필드로 가지 말고, 반드시 중간 관찰카드를 만든다.

```text
photo
→ observation card
→ risk library mapping
→ report section composer
```

## 리뷰 기준

아래 조건이면 `needsHumanReview = true`다.

```text
confidence < 0.75
ruleKey 없음
locationText에 확인 필요 포함
hazardSummary가 fallback 문구
accidentType이 확인 필요
causativeAgentKey 없음
```
