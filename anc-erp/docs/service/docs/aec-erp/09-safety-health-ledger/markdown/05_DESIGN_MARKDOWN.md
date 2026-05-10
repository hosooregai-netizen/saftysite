# 05. Design Markdown — 안전보건대장 자동화

## 1. 화면 목표

안전보건대장 자동화 화면은 프로젝트 전체 기간의 위험요인, 감소대책, 점검이력, 지적사항, 조치이력, 안전관리비, 첨부자료를 장기 누적 대장 형태로 관리하는 화면이다.

이 화면은 회차별 보고서 편집기보다 더 장기적인 관점의 `대장 workspace`로 설계한다.

핵심 목표:

1. 프로젝트 전체 위험요인을 한눈에 확인한다.
2. 안전관리계획서에서 온 계획 데이터와 현장점검에서 온 실행 데이터를 구분한다.
3. 반복 지적사항과 미조치 항목을 빠르게 찾는다.
4. 회차별 점검·보고서·사진대지·안전관리비 이력을 연결한다.
5. 대장 export 전 누락정보와 검토 경고를 명확히 보여준다.

## 2. 화면 목록

### 2.1 안전보건대장 목록

Route:

```text
/projects/[projectId]/safety-health-ledgers
```

표시 항목:

| 컬럼 | 설명 |
|---|---|
| 대장명 | 프로젝트 안전보건대장 |
| 상태 | draft/review/confirmed/exported |
| 위험요인 | 전체/반복/미조치 수 |
| 점검이력 | 반영된 점검회차 수 |
| 지적사항 | open/verified/closed 수 |
| 안전관리비 | 최근 기준월/사용률 |
| 최종본 | exported file |
| 최근 갱신 | updatedAt |

### 2.2 대장 생성 마법사

Route:

```text
/projects/[projectId]/safety-health-ledgers/new
```

Step:

```text
1. 프로젝트 확인
2. 템플릿 선택
3. 안전관리계획서 연결
4. 위험요인 가져오기
5. 점검/지적/안전관리비 데이터 연결
6. 누락정보 확인
7. 초안 생성
```

### 2.3 대장 상세/편집

Route:

```text
/safety-health-ledgers/[ledgerId]/edit
```

Layout:

```text
┌─────────────────────────────────────────────────────────┐
│ Top: 대장명 / 프로젝트 / 상태 / 저장 / 동기화 / export    │
├──────────────┬────────────────────────┬─────────────────┤
│ Section Nav  │ Ledger Editor          │ Review Panel    │
│ 240px        │ fluid                  │ 360px           │
└──────────────┴────────────────────────┴─────────────────┘
```

섹션:

```text
기본정보
공사개요
관계자
주요 유해·위험요인
위험성 감소대책
설계/계획 단계 검토사항
시공 단계 확인사항
점검 이력
지적사항 이력
조치 완료 이력
산업안전보건관리비 이력
첨부문서
개정 이력
```

### 2.4 위험요인 Register

Route:

```text
/safety-health-ledgers/[ledgerId]/risks
```

컬럼:

| 컬럼 | 설명 |
|---|---|
| 공종 | 승강기 철거 등 |
| 작업내용 | 작업 단위 |
| 유해·위험요인 | 추락, 감전, 화재 등 |
| 위험도 | low/medium/high/critical |
| 감소대책 | 요약 |
| 책임조직 | 시공사 등 |
| 관련 점검항목 | ChecklistItem |
| 반복 | recurrence badge |
| 상태 | identified/planned/in_control/needs_action/repeated/closed |

### 2.5 점검이력 화면

Route:

```text
/safety-health-ledgers/[ledgerId]/inspections
```

표시:

- 회차
- 문서번호
- 점검일
- 체크리스트 요약
- 주의/불량 수
- 지적사항 수
- 미조치 수
- 연결 보고서
- 연결 사진대지

### 2.6 지적/조치 이력 화면

Route:

```text
/safety-health-ledgers/[ledgerId]/findings
```

표시:

- 지적사항
- 위험유형
- 발생 회차
- 발주처
- 조치 상태
- 조치내용
- 확인일
- 증빙사진
- 반복 여부

### 2.7 산업안전보건관리비 이력 화면

Route:

```text
/safety-health-ledgers/[ledgerId]/safety-costs
```

표시:

- 기준월
- 발주처
- 계상금액
- 사용금액
- 사용률
- 적정성 의견
- 증빙파일
- 보고서 반영 여부

### 2.8 A4 미리보기 / Export

Route:

```text
/safety-health-ledgers/[ledgerId]/preview
/safety-health-ledgers/[ledgerId]/export
```

Export 전 체크리스트:

- 필수 기본정보
- 위험요인 누락
- 감소대책 누락
- 미조치 지적사항
- 반복 위험요인
- 안전관리비 증빙 누락
- 첨부자료 누락
- 최신 동기화 여부
- 웹하드 저장 위치

## 3. UX 규칙

1. 대장은 프로젝트 단위 문서임을 상단에 명확히 표시한다.
2. 회차별 보고서와 다르다는 것을 설명하는 안내 배너를 제공한다.
3. 계획 데이터와 실행 데이터를 다른 badge로 구분한다.
4. 반복 위험요인은 별도 badge와 warning으로 강조한다.
5. 미조치 지적사항은 export 전 warning으로 표시한다.
6. 최신 동기화가 필요한 경우 `원본 데이터 변경됨` 배지를 표시한다.
7. 위험요인 register는 표 중심으로 정보 밀도 높게 구성한다.
8. 대장 미리보기는 A4 문서 형식으로 제공한다.
9. 사용자가 직접 수정한 섹션과 AI 초안 섹션을 구분한다.
10. 원본 sourceLink를 클릭하면 관련 점검회차, 지적사항, 보고서로 이동할 수 있어야 한다.

## 4. 컴포넌트 상세

### LedgerWizard

- 프로젝트 확인
- 템플릿 선택
- 안전관리계획서 연결
- 위험요인 import
- 이력 데이터 sync
- 누락정보 확인
- 초안 생성

### LedgerRiskRegisterTable

- 공종/위험요인/감소대책/책임조직/상태/반복 여부
- inline edit
- source link
- 반복 위험요인 필터

### LedgerSyncPreviewModal

- 새로 반영될 점검회차
- 새로 반영될 지적사항
- 변경된 조치상태
- 새 안전관리비 이력
- 충돌/중복 항목

### LedgerReviewWarningPanel

그룹:

```text
필수 누락정보
반복 위험요인
미조치 지적사항
증빙 누락
원본 변경
export 전 확인
```

### LedgerA4Preview

- 대장 문서 preview
- 섹션별 페이지 이동
- 표 넘침 경고
- 초안 watermark
- 최종본 파일명 preview

## 5. Empty State

대장이 없을 때:

```text
등록된 안전보건대장이 없습니다.
프로젝트 원장과 안전관리계획서를 기반으로 안전보건대장 초안을 생성하세요.
```

버튼:

- 안전보건대장 생성
- 안전관리계획서에서 생성
- 템플릿 선택

## 6. Responsive

### Desktop

- section nav + editor + review panel
- 위험요인 register는 full table
- A4 preview 별도 탭

### Tablet

- review panel은 drawer
- table horizontal scroll

### Mobile

- 조회 중심
- 위험요인/지적사항 card list
- export는 데스크톱 권장
