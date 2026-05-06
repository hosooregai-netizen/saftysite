# PLAN.md

## 사진 기반 표준 기술지도 보고서 자동작성 구현 계획

### 목적

현재 저장소의 `guided_photo_flow -> ai draft -> ReportPayload -> inspection session -> HWPX/PDF` 흐름을 유지하면서, **현장/일정 선택 + 최소 사진 2장**으로 표준 기술지도 결과보고서 1~6번 섹션 초안을 생성하는 기능을 단계적으로 구현한다.

이 계획은 구현 순서, 수정 대상 파일, 리스크, 테스트 방법을 정리한 실행 문서다.

### 상위 원칙

- 사실정보는 DB 또는 사용자 입력값만 사용한다.
- AI는 사진 기반 관찰값만 구조화 JSON으로 만든다.
- 최종 보고서 문장은 표준 위험 라이브러리와 템플릿이 만든다.
- 사용자가 최종 확정한다.
- 기존 guided photo flow, `ReportPayload` top-level shape, HWPX/PDF 생성 라우트, local mode를 깨뜨리지 않는다.
- 한 번에 대규모 리팩터링하지 않고 Step 단위로 구현한다.

### 표준보고서 1~6 섹션 적용 원칙

1. 기술지도 대상사업장  
   데이터 전용. AI 사용 금지.

2. 기술지도 개요  
   데이터/사용자 입력 중심. AI 사용 금지 또는 보조만 허용.

3. 이전 기술지도 사항 이행여부  
   이전 보고서 + 선택적 follow-up 사진 + 사용자 확인.  
   v1은 **초안 + 검토대기** 전략을 사용한다.

4. 현재 공정 내 현존하는 위험성 제거  
   위험요인 사진 + AI 관찰카드 + 표준 위험 라이브러리.

5. 향후 진행공정에 대한 유해·위험 요인 파악 및 대책  
   개요 사진 + 현재 공정 관찰값 + 공정 힌트 + 표준 위험 라이브러리.

6. 사업장 지원 사항 등 기타 사항  
   교육/지원 자료가 부족하면 보수적 초안 + 검토대기.  
   v1은 **초안 + 검토대기** 전략을 사용한다.

## 현재 구조 요약

### 백엔드

- `apps/api/app/main.py`
  - `default_photo_step_buckets`
  - `sync_guided_photo_state`
  - `apply_ai_draft_to_report`
  - `upload_guided_step_one`
  - `upload_guided_step_two`
  - `draft_from_guided_photos`
- `apps/api/app/services/ai_pipeline.py`
  - `build_draft_from_guided_photos`
  - 현재는 `photoEvidence`, `findingCandidates`, `sectionDrafts`, `validationResult`를 하드코딩 초안 형태로 생성

### 프런트 / 계약 / 렌더링

- `packages/contracts/src/schemas.ts`
  - `ReportPayload` schema와 `photoEvidence`, `findingCandidates`, `sectionDrafts`, `validationResult` 정의
- `apps/web/lib/reportApi.ts`
  - 서버 API + local mode helper
- `apps/web/components/ReportWorkspace.tsx`
  - 1~6번 편집 UI와 autosave 흐름
- `apps/web/lib/reportSessionMapper.ts`
  - `ReportPayload -> InspectionSession` 매핑
- `apps/web/app/api/documents/inspection/hwpx/route.ts`
- `apps/web/app/api/documents/inspection/pdf/route.ts`

### 현재 한계

- AI draft가 관찰값/위험라이브러리/섹션 Composer로 분리되어 있지 않다.
- fact field provenance가 명확하지 않다.
- review queue가 동적이 아니라 하드코딩 성격이 있다.
- 3번/6번 섹션은 사진과 기존 데이터가 부족할 때 보수적 처리 전략이 필요하다.

## 수정 대상 파일 목록

### 우선 수정 대상

- `apps/api/app/main.py`
- `apps/api/app/services/ai_pipeline.py`
- `packages/contracts/src/schemas.ts`
- `apps/web/lib/reportApi.ts`
- `apps/web/components/ReportWorkspace.tsx`
- `apps/web/lib/reportSessionMapper.ts`

### 신규 추가 예상 파일

- `apps/api/app/services/photo_observation_cards.py`
- `apps/api/app/services/standard_risk_library.py`
- `apps/api/app/services/standard_report_composer.py`

### 가능하면 수정 최소화할 파일

- `apps/web/app/api/documents/inspection/hwpx/route.ts`
- `apps/web/app/api/documents/inspection/pdf/route.ts`

## 단계별 구현 순서

### Step 1. 사실정보 seed와 provenance 고정

#### 목표

- `create_report()`와 `build_report_meta_seed()` 기준으로 1번/2번 섹션 fact source를 고정한다.
- AI가 덮어쓰면 안 되는 필드를 provenance metadata로 명시한다.

#### 작업

- `reportMeta`에서 AI 금지 필드 목록을 확정한다.
- optional field로 `fieldProvenance` 또는 동등 metadata를 추가한다.
- `apply_ai_draft_to_report()`가 fact field를 overwrite하지 않도록 merge 경계를 정리한다.

#### 리스크

- 기존 draft merge 과정에서 AI 초안이 사실정보를 덮어쓸 수 있다.
- local mode와 schema parse가 provenance 추가로 깨질 수 있다.

#### 테스트

- 보고서 생성 직후 payload에서 `siteName`, `visitDate`, `drafterName`, `progressRate`, `siteAddress`, `siteContact`가 DB/user seed를 유지하는지 확인
- 기존 report create/local mode parse 스모크

### Step 2. PhotoObservationCard 도입

#### 목표

- 사진마다 구조화 관찰값을 만드는 계층을 AI pipeline 앞단에 추가한다.

#### 작업

- `photo_observation_cards.py` 추가
- `ai_pipeline.py`의 하드코딩 evidence 생성을 관찰카드 생성 함수로 분리
- 최소 출력 필드:
  - `photoRole`
  - `observedProcess`
  - `observedRisk`
  - `previousGuidanceCheck`
  - `supportObservation`
  - `confidence`
  - `needsHumanReview`

#### 리스크

- 최소 2장만으로 3번/6번까지 과도한 추론을 할 수 있다.
- step bucket별 역할이 섞이면 후속 risk matching 품질이 떨어질 수 있다.

#### 테스트

- `step1_overview` 사진은 process/site overview 성격으로 생성되는지
- `step2_hazard` 사진은 hazard 성격으로 생성되는지
- 기존 `photoEvidence` top-level shape가 유지되는지

### Step 3. 표준 위험 라이브러리와 matcher 추가

#### 목표

- AI 관찰값을 표준 위험 라이브러리에 매칭해 4번/5번 섹션 문장을 표준화한다.

#### 작업

- `standard_risk_library.py` 추가
- 최소 rule 필드:
  - `majorProcess`
  - `detailProcess`
  - `accidentType`
  - `causativeAgent`
  - `hazardKeywords`
  - `standardGuidanceText`
  - `standardCountermeasureText`
  - `defaultRiskLevel`
- matcher 점수 규칙 구현
- 낮은 점수 매치는 `needsReview: true`

#### 리스크

- 라이브러리 커버리지가 낮으면 잘못된 확신을 줄 수 있다.
- 자유문장 AI 결과와 표준 rule 문장이 섞이면 일관성이 깨진다.

#### 테스트

- 대표 rule 3~5개 deterministic match 스냅샷
- unknown case는 `needsReview: true`로 떨어지는지 확인

### Step 4. 표준보고서 Composer 추가

#### 목표

- 관찰카드와 위험 매칭 결과를 합쳐 `ReportPayload` 호환 draft를 만든다.

#### 작업

- `standard_report_composer.py` 추가
- `build_draft_from_guided_photos()`를 다음 순서로 변경
  1. observation cards 생성
  2. risk matches 생성
  3. `compose_standard_report_draft(...)`
- top-level 반환 shape는 유지
  - `photoEvidence`
  - `findingCandidates`
  - `sectionDrafts`
  - `validationResult`

#### 섹션 전략

- 1번: DB/user input only
- 2번: DB/user input only
- 3번: 이전 보고서 + optional follow-up 사진, 없으면 `확인 필요`
- 4번: `findingCandidates`
- 5번: `sectionDrafts.doc8`
- 6번: `doc11`, `doc12`, `doc14`에 보수적 초안 또는 review-needed placeholder

#### 리스크

- 기존 `ReportWorkspace`가 기대하는 nested doc shape와 충돌할 수 있다.
- mapper가 문서를 충분히 싣지 못하면 export에서 누락이 생길 수 있다.

#### 테스트

- `reportPayloadSchema` parse 통과
- `sectionDrafts.doc8/doc11/doc12/doc14` 렌더 가능 여부 확인
- `findingCandidates`가 기존 workspace 편집 흐름과 호환되는지 확인

### Step 5. review queue / validation 동적화

#### 목표

- 하드코딩된 review queue를 제거하고, draft 결과 기반 validation으로 바꾼다.

#### 작업

- `apply_ai_draft_to_report()`에서 draft 내 `validationResult`와 `reviewQueue`를 사용
- 부족 데이터는 review queue에 강제로 남긴다:
  - `reportMeta.siteAddress`
  - `reportMeta.siteContact`
  - `reportMeta.progressRate`
  - `reportMeta.visitCount`
  - `findingCandidates[*].location`
  - `findingCandidates[*].hazardDescription`
  - `findingCandidates[*].improvementPlan`
  - 3번/6번 확인 필요 필드

#### 리스크

- export 직전 blocking issue 통제가 약하면 불완전 보고서가 나갈 수 있다.
- review queue shape를 바꾸면 local mode 또는 workspace warning UI가 흔들릴 수 있다.

#### 테스트

- 입력 부족 시 `validationResult.blockingIssues`와 warnings가 동적으로 채워지는지
- review 완료 후 export 허용 조건이 적절한지

### Step 6. 계약 타입 확장

#### 목표

- `ReportPayload` top-level shape는 유지하면서 optional 필드를 늘린다.

#### 작업

- `packages/contracts/src/schemas.ts`에 optional 확장:
  - `photoObservations`
  - `riskLibraryMatches`
  - `fieldProvenance`
  - richer `reviewMeta.reviewQueue`
- 기존 키는 그대로 유지

#### 리스크

- demo data/local mode parse 실패
- 기존 API consumer가 unknown field를 처리 못할 수 있음

#### 테스트

- contracts schema parse
- 기존 sample payload parse

### Step 7. local mode 호환

#### 목표

- 서버 없는 상태에서도 새 optional field가 기본값과 함께 동작하게 유지한다.

#### 작업

- `reportApi.ts`의 local helpers 업데이트
  - `buildLocalBasePayload`
  - `syncLocalGuidedState`
  - `finalizeLocalDraftRecord`

#### 리스크

- local mode만 payload shape가 달라져 workspace가 깨질 수 있다.

#### 테스트

- 로컬 report create
- photo upload
- local finalize
- workspace reopen roundtrip

### Step 8. ReportWorkspace 최소 조정

#### 목표

- UI 대개편 없이 새 composer 결과와 review 상태를 보여준다.

#### 작업

- 3번/6번 review-needed 상태를 warning 그룹에 반영
- `findingCandidates`, `doc8`, `doc11`, `doc12`, `doc14` 표시만 보강
- fact field overwrite 방지 경계 확인

#### 리스크

- normalize/autosave 과정에서 metadata 손실 가능
- review queue UI가 신규 필드를 반영하지 못할 수 있음

#### 테스트

- autosave roundtrip
- reopen 후 warnings/reviewQueue 유지 확인

### Step 9. HWPX/PDF 매핑 검증 및 최소 보강

#### 목표

- 문서 export route는 바꾸지 않고 mapper 단계에서 표준 draft 결과를 충분히 싣는다.

#### 작업

- `reportSessionMapper.ts` 점검 및 최소 보강
- 특히 확인 대상:
  - `document4FollowUps`
  - `document7Findings`
  - `document8Plans`
  - `document11`
  - `document12`
  - `document14`

#### 리스크

- 3번 follow-up과 6번 기타 사항이 inspection session으로 충분히 변환되지 않을 수 있다.

#### 테스트

- mapper unit/snapshot
- HWPX/PDF route smoke

## API 및 계약 호환성 원칙

### 유지 대상 API

- `POST /api/v1/reports/{report_id}/photo-steps/step-1`
- `POST /api/v1/reports/{report_id}/photo-steps/step-2`
- `POST /api/v1/reports/{report_id}/photo-steps/review`
- `POST /api/v1/reports/{report_id}/draft-from-guided-photos`

### 유지 대상 draft 반환 키

- `photoEvidence`
- `findingCandidates`
- `sectionDrafts`
- `validationResult`

### optional 확장 허용

- `photoObservations`
- `riskLibraryMatches`
- `fieldProvenance`
- richer `reviewMeta.reviewQueue`

## 단계별 테스트 계획

### 백엔드

- `build_report_meta_seed()`가 fact field를 AI 없이 채우는지
- `build_draft_from_guided_photos()`가 기존 keys를 유지하는지
- risk matcher가 known case에서 deterministic한지
- `apply_ai_draft_to_report()`가 동적 validation을 쓰는지

### 프런트 / contracts

- `packages/contracts` schema test
- `apps/web/lib/reportApi.ts` local mode parse
- `ReportWorkspace` autosave roundtrip
- `mapReportPayloadToInspectionSession()` snapshot

### 출력 회귀

- HWPX route와 PDF route가 기존 request shape로 동작하는지
- `findingCandidates/doc8/doc11/doc12/doc14`가 inspection session에 정상 매핑되는지

### 사용자 흐름 스모크

1. 현장/일정 선택
2. step1 사진 업로드
3. step2 사진 업로드
4. review
5. draft 생성
6. workspace 검토
7. HWPX/PDF 생성

## v1 범위와 보류 사항

### v1 범위

- 최소 사진 2장 기반 초안 생성
- 4번/5번 품질 우선
- 3번/6번은 초안 + 검토대기
- `ReportPayload` 호환 유지

### v1 이후 보류

- 3번 이행여부의 정밀 판정 자동화
- 6번 교육/지원 기록의 풍부한 자동생성
- 위험 라이브러리 대규모 확장
- export 문구 정교화와 레이아웃 최적화

## 완료 기준

- 어떤 파일을 수정할지 명확히 목록화되어 있다.
- 어떤 순서로 구현할지 Step 단위로 제안되어 있다.
- 각 Step별 리스크와 테스트 방법이 포함되어 있다.
- guided photo flow, local mode, HWPX/PDF route를 유지하는 호환성 규칙이 명시되어 있다.
