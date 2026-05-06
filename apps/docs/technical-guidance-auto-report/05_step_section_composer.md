# Step 5. 표준보고서 섹션별 자동작성 Composer

## 목적

현장 DB, 사진 관찰카드, 위험 라이브러리 매칭 결과를 합쳐 표준 기술지도 결과보고서의 1~6번 섹션을 자동으로 채운다.

## 전체 입력

```ts
type ComposeInput = {
  reportMeta: ReportMeta;
  previousFindings: PreviousGuidanceFinding[];
  photoObservations: PhotoObservationCard[];
  riskMatches: RiskLibraryMatch[];
  userHints: {
    progressRate?: string;
    nextProcessHint?: string;
    attendeeCount?: string;
    educationMaterialName?: string;
  };
};
```

## 전체 출력

현재 프로젝트의 `ReportPayload` 구조를 유지한다.

```ts
type ComposeOutput = {
  reportMeta: ReportMeta;
  photoEvidence: PhotoEvidence[];
  findingCandidates: FindingCandidate[];
  sectionDrafts: {
    doc5: SummaryDraft;
    doc7: FindingCandidate[];
    doc8: FutureProcessRiskPlan[];
    doc11: SafetyEducationRecord[];
    doc12: ActivityRecord[];
    doc13: CaseRecord[];
    doc14: SafetyInfo;
  };
  documentsCompat: {
    document4FollowUps?: PreviousGuidanceFollowUpItem[];
  };
  validationResult: ValidationResult;
};
```

## 섹션별 작성 방식

### 1번. 기술지도 대상사업장

- AI 사용 금지
- `reportMeta`와 `adminSiteSnapshot`에 DB 값 입력
- 누락값은 `reviewQueue`에 추가

### 2번. 기술지도 개요

- AI 사용 금지 또는 보조만 허용
- 공정률, 회차, 담당자, 실시일, 통보방법은 데이터/사용자 입력
- 이전 기술지도 이행여부는 3번 결과를 요약해서 반영

### 3번. 이전 기술지도 사항 이행여부

입력:

- 이전 보고서 지적사항
- 현재 확인 사진
- AI의 `previousGuidanceCheck`
- 사용자 확정값

출력:

```ts
type PreviousGuidanceFollowUpItem = {
  id: string;
  guidanceDate: string;
  confirmationDate: string;
  location: string;
  hazardDescription: string;
  actionRequired: string;
  result: '이행' | '미이행' | '확인 필요';
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
};
```

### 4번. 현재 공정 내 현존하는 위험성 제거

입력:

- `step2_hazard` 사진
- `PhotoObservationCard.observedRisk`
- `RiskLibraryMatch`

출력:

```ts
type FindingCandidate = {
  linkedPhotoIds: string[];
  location: string;
  hazardDescription: string;
  accidentType: string;
  causativeAgentKey: string;
  riskLevel: '상' | '중' | '하';
  improvementPlan: string;
  emphasis: string;
  legalReferenceCandidates: string[];
  referenceMaterialCandidates: string[];
  confidence: number;
  needsReview: boolean;
};
```

작성 예시:

```json
{
  "location": "굴착부 주변",
  "hazardDescription": "굴착기 사용으로 인한 충돌 위험",
  "accidentType": "충돌",
  "causativeAgentKey": "굴착기",
  "riskLevel": "중",
  "improvementPlan": "굴착기 작업반경 내 근로자 출입을 금지하고 장비 유도 및 신호수를 배치하여 충돌위험을 예방하실 것",
  "emphasis": "□ 추후 이행여부 확인 필요",
  "confidence": 0.78,
  "needsReview": true
}
```

### 5번. 향후 진행공정에 대한 유해·위험요인 및 대책

입력:

- `step1_overview` 공정 사진
- 현재 공정 관찰값
- 일정/공정계획
- 위험 라이브러리

출력:

```ts
type FutureProcessRiskPlan = {
  processName: string;
  hazard: string;
  countermeasure: string;
  confidence: number;
};
```

작성 예시:

```json
{
  "processName": "기초 및 토공사(굴착작업)",
  "hazard": "굴착기 사용으로 인한 충돌",
  "countermeasure": "작업반경 내 출입금지, 신호수 배치 등",
  "confidence": 0.84
}
```

### 6번. 사업장 지원 사항 등 기타 사항

입력:

- 4번 현재 위험요인
- 5번 향후 공정 위험
- 교육/지원 사진
- 참석인원/자료명 사용자 입력

출력:

```ts
type SafetyEducationRecord = {
  topic: string;
  attendeeCount: string;
  content: string;
  confidence: number;
};

type ActivityRecord = {
  activityType: string;
  content: string;
  confidence: number;
};
```

작성 예시:

```json
{
  "topic": "굴착작업 충돌 및 추락위험 예방교육",
  "attendeeCount": "",
  "content": "굴착기 작업반경 내 출입금지, 신호수 배치, 굴착부 주변 추락방지조치 및 작업 전 위험성 확인에 대해 교육함",
  "confidence": 0.72
}
```

## 현재 프로젝트 적용 포인트

현재 `build_draft_from_guided_photos()`가 `photoEvidence`, `findingCandidates`, `sectionDrafts`를 반환한다. 이 함수를 다음처럼 리팩터링한다.

```py
def build_draft_from_guided_photos(report_id, overview_photos, hazard_photos, *, report_meta=None, previous_findings=None):
    observations = analyze_photos_to_observation_cards(
        report_id=report_id,
        overview_photos=overview_photos,
        hazard_photos=hazard_photos,
    )
    risk_matches = match_observations_to_risk_library(observations)
    return compose_standard_report_draft(
        report_id=report_id,
        report_meta=report_meta or {},
        observations=observations,
        risk_matches=risk_matches,
        previous_findings=previous_findings or [],
    )
```

## 완료 조건

- 기존 `ReportWorkspace.tsx`가 깨지지 않도록 `ReportPayload` shape는 유지한다.
- 표준보고서 1~6번 UI에 바로 반영되는 값이 생성된다.
- 사진 기반 작성 필드는 근거 사진 ID가 연결된다.
- `documentsCompat.document4FollowUps`로 3번 이전 이행여부를 연결한다.
