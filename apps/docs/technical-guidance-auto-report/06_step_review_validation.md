# Step 6. 사용자 검토, 검증, 출처관리

## 목적

사용자가 전체 보고서 양식을 처음부터 다시 쓰지 않게 하고, **확인 필요한 항목만** 검토하게 한다.

## 검토 대상 분류

| 검토 유형 | 예시 | 처리 방식 |
|---|---|---|
| 행정 필수값 누락 | 현장 주소, 연락처, 공정률, 총회차 | `reviewQueue`에 추가 |
| AI 추정값 | 위험장소, 공정명, 재해유형, 기인물 | confidence 낮으면 검토 필요 |
| 사용자 확정 필요 | 이전 이행여부, 통보방법, 직접전달 서명자 | 반드시 사용자 선택 |
| 표준 라이브러리 매칭 실패 | ruleKey 없음, 매칭 점수 낮음 | 지적사항 직접 확인 |
| 출력 전 책임 확인 | 최종 검토/법적 책임 확인 | 다운로드 전 확인 모달 |

## Review Queue 스키마

```ts
type ReviewQueueItem = {
  fieldPath: string;
  label: string;
  value?: string;
  suggestedValue?: string;
  source: 'DATA' | 'AI_PHOTO' | 'RISK_LIBRARY' | 'USER_INPUT' | 'RULE';
  confidence: number;
  needsReview: boolean;
  status: 'pending' | 'confirmed' | 'edited' | 'dismissed';
  evidencePhotoIds?: string[];
  notes?: string;
};
```

## 검토 UI 예시

```md
확인 필요 5개

1. 공정률
   - 상태: 필수값 누락
   - 입력: [    ] %

2. 위험장소
   - AI 추천: 굴착부 주변
   - 근거사진: photo_002
   - 입력: [굴착부 주변]

3. 재해유형
   - AI 추천: 충돌
   - 선택: [추락/낙하/충돌/붕괴/감전/화재/협착/전도]

4. 이전 기술지도 이행여부
   - AI 추천: 확인 필요
   - 선택: [이행/불이행/확인 필요]

5. 통보방법
   - 선택: [직접전달/등기우편/전자우편/모바일/기타]
```

## Validation Result 스키마

```ts
type ValidationResult = {
  valid: boolean;
  blockingIssues: string[];
  warnings: string[];
  reviewedFieldPaths: string[];
};
```

## 검증 규칙

### 출력 전 필수값

```ts
const REQUIRED_BEFORE_EXPORT = [
  'reportMeta.siteName',
  'reportMeta.visitDate',
  'reportMeta.drafterName',
  'reportMeta.progressRate',
  'reportMeta.visitCount',
  'reportMeta.totalVisitCount',
  'reportMeta.siteAddress',
  'reportMeta.siteContact',
  'findingCandidates[0].location',
  'findingCandidates[0].hazardDescription',
  'findingCandidates[0].improvementPlan',
];
```

### AI 필드 검증

- `confidence < 0.75`면 `needsReview = true`
- `riskLevel`은 `상 | 중 | 하`만 허용
- `accidentType`은 허용 목록만 허용
- `causativeAgentKey`가 비어 있으면 검토 필요
- `linkedPhotoIds`가 비어 있으면 근거 사진 없음 경고

### 섹션별 검증

| 섹션 | 검증 |
|---|---|
| 1번 | 현장명, 주소, 책임자, 공사기간, 공사금액 누락 확인 |
| 2번 | 실시일, 공정률, 회차, 담당 요원, 통보방법 확인 |
| 3번 | 이전 지적사항이 있는데 이행결과가 비어 있으면 경고 |
| 4번 | 최소 1개 지적사항 필요, 사진 근거 연결 권장 |
| 5번 | 최소 1개 향후 공정 위험대책 권장 |
| 6번 | 교육/지원사항이 모두 비어 있으면 경고 |

## 출처관리

각 자동작성 필드에는 출처를 남긴다.

```json
{
  "fieldPath": "findingCandidates[0].improvementPlan",
  "source": "RISK_LIBRARY",
  "sourceId": "rule:EXCAVATOR_COLLISION_PREVENTION",
  "evidencePhotoIds": ["photo_002"],
  "confidence": 0.84,
  "needsReview": true
}
```

## 현재 프로젝트 적용 포인트

현재 프로젝트의 `apply_ai_draft_to_report()`는 `reviewMeta.reviewQueue`를 고정값으로 만든다. 개편 후에는 Composer의 검증 결과로 동적으로 만든다.

```py
review_queue = build_review_queue(
    report_meta=report.payload["reportMeta"],
    draft=draft,
)
report.payload["reviewMeta"]["reviewQueue"] = review_queue
report.payload["validationResult"] = validation_result
```

## 완료 조건

- 사용자는 누락/불확실한 항목만 검토한다.
- 검토 완료 전에는 다운로드가 막히거나 경고된다.
- AI 작성 필드와 데이터 기반 필드의 출처가 분리된다.
- 사용자가 수정한 값은 AI 재생성보다 우선한다.
