# 05. Design Markdown — 산업안전보건관리비 사용내용 확인

## 1. 화면 목표

산업안전보건관리비 사용내용 확인 화면은 발주처별 계상금액, 사용금액, 사용률, 관련근거, 적정성 의견을 보고서 표 형태로 입력·검토·확정하는 화면이다.

단순 입력폼이 아니라 다음 상태를 한 화면에서 확인해야 한다.

- 발주처별 금액
- 사용률 계산값
- 입력값 불일치 warning
- 관련근거/증빙파일
- AI 초안과 사용자 확정 의견
- 보고서 반영 상태
- 변경 이력

## 2. 화면 목록

### 2.1 프로젝트 안전관리비 목록

Route: `/projects/[projectId]/safety-costs`

표시:

- 프로젝트명
- 점검회차
- 발주처
- 계상금액
- 사용금액
- 사용률
- 기준월
- 적정성 상태
- 증빙파일 수
- 보고서 반영 상태

### 2.2 발주처별 매트릭스

Route: `/projects/[projectId]/safety-costs/owner-matrix`

| 발주처 | 계상금액 | 사용금액 | 사용률 | 기준월 | 관련근거 | 증빙 | 적정성 | 보고서 |
|---|---:|---:|---:|---|---|---:|---|---|

### 2.3 점검회차 안전관리비 입력

Route: `/inspections/[inspectionRoundId]/safety-costs/new`

입력 섹션:

- 발주처 선택
- 계상금액
- 사용금액
- 사용률 자동 계산
- 사용자 입력 사용률 optional
- 기준월/기준일
- 관련근거
- 증빙파일
- 적정성 의견
- 검토자/확인자

### 2.4 상세/검토 화면

Route: `/safety-costs/[usageId]`

Layout:

```text
Sticky Header
- 제2026-01호
- 제1회
- 발주처
- 상태
- 저장 / 확정 / 보고서 반영

Main
- 계상금액
- 사용금액
- 사용률 gauge
- 기준월
- 관련근거
- 적정성 의견

Right Panel
- 증빙파일
- 누락정보
- 금액 warning
- owner mismatch warning
- A4 preview
```

### 2.5 증빙파일 화면

Route: `/safety-costs/[usageId]/evidence`

기능:

- drag & drop upload
- 웹하드에서 선택
- 메일 첨부에서 가져오기
- 증빙 유형 선택
- 파일 미리보기
- 파일 교체/삭제
- 웹하드 저장 위치 확인

### 2.6 보고서 문구 미리보기

Route: `/safety-costs/[usageId]/preview`

미리보기 문구 예:

```text
산업안전보건관리비 사용 실적
계상금액 ￦99,462,613 중 37,978,000원 38.2% (1월말 기준)
관련근거 산업안전보건관리비 사용내역서
적정성 공사 특수성을 반영, 적정하게 사용 중으로 판단됨
```

## 3. UX Rules

1. 금액은 오른쪽 정렬하고 원 단위 쉼표를 사용한다.
2. 사용률은 자동 계산하고 progress/gauge로 표시한다.
3. 입력 사용률과 계산 사용률이 다르면 warning을 표시한다.
4. 관련근거와 증빙파일 누락을 명확히 표시한다.
5. AI 초안과 확정 의견을 구분한다.
6. 발주처별 금액이 섞이면 danger warning을 표시한다.
7. A4 preview는 실제 보고서 표와 유사해야 한다.
8. 증빙파일이 없으면 노란 warning badge를 표시한다.
9. 사용금액이 계상금액을 초과하면 빨간 danger badge를 표시한다.
10. 보고서 반영 후에는 `synced_to_report` badge를 표시한다.

## 4. 디자인 컴포넌트

### SafetyCostSummaryCard

표시 항목:

- 발주처명
- 계상금액
- 사용금액
- 사용률
- 기준월
- 적정성 상태
- 증빙파일 수
- 보고서 반영 상태

### SafetyCostUsageRateGauge

표시:

- 사용률 숫자
- progress bar
- 계산 기준 tooltip
- rate mismatch warning

### SafetyCostOwnerMatrix

컬럼:

```text
발주처 / 계상금액 / 사용금액 / 사용률 / 기준월 / 관련근거 / 증빙 / 적정성 / 보고서
```

### SafetyCostEvidenceUploader

기능:

- drag & drop upload
- 웹하드에서 선택
- 증빙 유형 선택
- 파일명 표시
- 미리보기
- 삭제/교체

### SafetyCostReportPreviewCard

보고서 문구 미리보기:

```text
산업안전보건관리비 사용 실적
계상금액 ￦99,462,613 중 37,978,000원 38.2% (1월말 기준)
관련근거 산업안전보건관리비 사용내역서
적정성 공사 특수성을 반영, 적정하게 사용 중으로 판단됨
```

### SafetyCostReviewPanel

표시:

- AI 초안 badge
- 검토 의견
- 적정성 상태 선택
- 확정 버튼
- 추가 증빙 요청 버튼

## 5. Empty State

```text
이 점검회차의 산업안전보건관리비 사용내역이 등록되지 않았습니다.
발주처별 계상금액과 사용금액을 입력하세요.
```

버튼:

- 사용내역 입력
- 시공사 제출파일에서 가져오기
- 웹하드 파일 연결

## 6. Warning State

### 증빙파일 누락

```text
사용내역서 또는 관련 증빙파일이 연결되지 않았습니다.
보고서 export 전 증빙파일 확인을 권장합니다.
```

### 사용률 불일치

```text
입력 사용률과 시스템 계산 사용률이 다릅니다.
계상금액과 사용금액을 다시 확인하세요.
```

### 발주처 값 혼동

```text
이 사용내역은 선택한 발주처와 다른 발주처 파일 또는 금액을 참조하고 있을 수 있습니다.
ownerPartyId와 증빙파일 출처를 확인하세요.
```

## 7. Responsive

### Desktop

- 좌측 메인 입력폼
- 우측 증빙/경고/A4 preview panel
- 발주처별 matrix table

### Tablet

- 입력폼과 preview toggle
- matrix horizontal scroll

### Mobile

- 금액 입력 카드
- 증빙 업로드 중심
- 최종 확정은 데스크톱 권장
