# 05. Design Markdown — 대시보드/통계

## 1. 화면 목표

대시보드/통계 화면은 A&C ERP 사용자가 오늘 가장 중요한 업무를 빠르게 파악하고, 프로젝트별 위험 신호를 놓치지 않도록 돕는 관제 화면이다.

디자인 목표:

1. 오늘 할 일을 가장 위에 표시한다.
2. 지연/누락/위험 상태는 색상과 badge로 명확히 구분한다.
3. 프로젝트, 회차, 발주처, 문서 상태를 한눈에 연결한다.
4. 통계 화면은 수치와 원본 링크를 함께 제공한다.
5. AI 브리핑은 보조 패널로 제공하되, 원본 수치와 분리한다.

## 2. 화면 목록

### 2.1 전체 대시보드

Route:

```text
/dashboard
```

Layout:

```text
Topbar: 날짜 / 사용자 / 프로젝트 전환 / 전체 검색
Widget Row 1: 오늘 점검, 제출 예정, 미조치 지적, 결재 대기
Widget Row 2: 프로젝트 위험도, 발주처별 보고서 상태, 안전관리비 경고
Main: 오늘 업무 queue + 프로젝트별 현황 table
Right Panel: AI 업무 브리핑 / 알림
```

### 2.2 내 업무 대시보드

Route:

```text
/dashboard/my-work
```

구성:

- 오늘 할 일
- 이번 주 할 일
- 내가 담당하는 점검
- 내가 작성 중인 보고서
- 내가 검토해야 하는 문서
- 내가 확인해야 하는 조치현황
- 내가 발송해야 하는 메일

### 2.3 프로젝트 대시보드

Route:

```text
/projects/[projectId]/dashboard
```

구성:

- 프로젝트 요약 헤더
- 점검회차 timeline
- 발주처별 보고서 matrix
- 미조치 지적사항 table
- 사진대지 상태
- 산업안전보건관리비 사용률
- 결재/제출 상태
- 최근 웹하드 파일
- 최근 메일

### 2.4 통계 화면

Route:

```text
/dashboard/statistics
```

구성:

- 기간 필터
- 프로젝트 필터
- 발주처 필터
- 월별 점검 건수 chart
- 월별 보고서 제출 chart
- 위험유형별 지적사항 chart
- 조치 평균 소요일 chart
- 산업안전보건관리비 사용률 chart
- 통계 table

### 2.5 알림 센터

Route:

```text
/dashboard/alerts
```

구성:

- active alerts
- acknowledged alerts
- resolved alerts
- severity filter
- project filter
- alert rule 관리 진입

## 3. UX 규칙

- danger 상태는 빨간색, warning 상태는 주황색으로 표시한다.
- 사용자가 바로 이동할 수 있도록 모든 widget은 관련 route를 가진다.
- 통계 수치에는 기준일과 계산 기준을 표시한다.
- AI 브리핑은 "AI 요약" badge를 표시한다.
- 대시보드는 원본 업무 데이터를 직접 수정하지 않는다.
- 완료 처리, 제출 처리, 조치 확인은 원본 모듈 화면으로 이동해서 수행한다.
- 발주처별 지표는 ownerParty badge를 함께 표시한다.
- 날짜 기준 통계는 오늘/이번 주/이번 달/직접 선택 필터를 제공한다.

## 4. 핵심 컴포넌트

### DashboardWidgetCard

공통 구조:

```text
제목
주요 수치
trend
severity badge
관련 항목 리스트
바로가기 버튼
```

### ProjectHealthTable

컬럼:

| 컬럼 | 설명 |
|---|---|
| 프로젝트 | 상세 이동 |
| 상태 | normal/watch/warning/danger |
| 다음 점검 | plannedDate |
| 미제출 보고서 | count |
| 미조치 | count |
| 조치 지연 | count |
| 안전관리비 경고 | count |
| 위험점수 | riskScore |

### OwnerReportStatusMatrix

행:

- 점검회차

열:

- 발주처
- 초안
- 검토
- 최종본
- 제출
- 확인

### DashboardInsightPanel

표시:

- 오늘 요약
- 긴급 업무 Top 5
- 프로젝트 위험 신호
- 통계 특이사항
- 다음 액션

### AlertRuleTable

컬럼:

- 규칙명
- 조건
- threshold
- severity
- 활성 여부
- 최근 실행일

## 5. Empty State

### 데이터 없음

```text
표시할 대시보드 데이터가 없습니다.
프로젝트를 생성하거나 점검회차를 등록하면 대시보드가 자동으로 채워집니다.
```

### 알림 없음

```text
현재 활성 알림이 없습니다.
```

## 6. Warning State

### 통계 계산 불가

```text
일부 통계는 필수 원본 데이터가 없어 계산되지 않았습니다.
```

### 권한 제한

```text
접근 권한이 있는 프로젝트의 데이터만 표시됩니다.
```

### 원본 변경 감지

```text
집계 이후 원본 데이터가 변경되었습니다. 새로고침하여 최신 대시보드를 확인하세요.
```

## 7. Responsive

### Desktop

- 12-column widget grid
- 우측 AI/알림 패널
- table + chart 동시 표시

### Tablet

- 2-column card grid
- chart와 table을 세로로 배치

### Mobile

- 내 업무 중심 card list
- 오늘 점검/제출/미조치만 우선 표시
- 통계 chart는 요약 card로 축약
