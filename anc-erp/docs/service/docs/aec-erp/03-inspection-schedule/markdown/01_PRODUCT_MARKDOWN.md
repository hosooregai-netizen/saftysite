# 01. Product Markdown — 점검회차/일정 관리

## 1. 기능 정의

점검회차/일정 관리는 프로젝트의 공사기간, 계약기간, 점검주기, 총 점검횟수, 발주처별 보고서 제출 조건을 기준으로 현장점검 일정을 생성하고 관리하는 기능이다.

이 기능은 단순한 캘린더가 아니라 다음 업무의 기준키를 만든다.

```text
점검회차
→ 현장점검 체크리스트
→ 지적사항
→ 조치현황
→ 사진대지
→ 공사안전보건대장 이행확인 보고서
→ 발주처별 제출 메일
→ 제출 이력
```

## 2. 이 기능이 필요한 이유

A&C 업무에서는 하나의 프로젝트가 여러 회차의 이행점검으로 나뉘고, 각 회차마다 체크리스트, 지적사항, 사진대지, 보고서, 제출 이력이 생성된다.

리움미술관 승강기 교체공사 예시:

| 항목 | 값 |
|---|---|
| 공사기간 | 2025.10 ~ 2028.02 |
| 점검주기 | 3개월 이내 1회 |
| 총 점검회차 | 10회 |
| 2026년 | 1회, 2회, 3회, 4회 |
| 2027년 | 5회, 6회, 7회, 8회 |
| 2028년 | 9회, 10회 |
| 보고서 | 발주처별 제출 |

따라서 ERP는 날짜만 저장하는 것이 아니라, 회차별로 다음 상태를 함께 관리해야 한다.

- 예정월
- 예정일
- 실제 점검일
- 문서번호
- 점검 담당자
- 확인자
- 시공사 참석자
- 체크리스트 입력 상태
- 지적사항 수
- 조치완료 상태
- 사진대지 상태
- 보고서 초안/검토/최종본 상태
- 발주처별 제출 상태
- 계약 지급 milestone
- 웹하드 회차 폴더

## 3. 주요 사용자

| 사용자 | 사용 목적 |
|---|---|
| 대표/기술사 | 회차별 점검 및 보고서 제출 현황 검토 |
| 상무/점검 담당자 | 점검일 확정, 현장점검 수행, 체크리스트 입력 |
| 문서 작성자 | 회차 기준 보고서 생성, 사진대지 정리, 누락정보 확인 |
| 계약/행정 담당자 | 계약상 점검횟수, 기성/준공 지급조건과 회차 연결 |
| 발주처 담당자 | 해당 회차 보고서 수신 및 확인 |
| 관리자 | 반복 일정 규칙, 알림, 권한, 업무 템플릿 관리 |

## 4. 핵심 기능

### 4.1 점검 일정 생성

프로젝트 또는 계약의 기준값을 불러와 점검회차를 생성한다.

입력 기준:

- Project.startDate / Project.endDate
- Contract.contractStartDate / Contract.contractEndDate
- Contract.inspectionCount
- Project.inspectionCycleText
- 사용자가 지정한 회차별 예정월/예정일
- ProjectParty.requiresSeparateReport

생성 결과:

| 회차 | 예정월 | 예정일 | 문서번호 | milestone |
|---:|---|---|---|---|
| 1 | 2026-01 | 2026-01-23 | 제2026-01호 | - |
| 2 | 2026-04 | 미정 | 제2026-02호 | - |
| 3 | 2026-07 | 미정 | 제2026-03호 | - |
| 4 | 2026-10 | 미정 | 제2026-04호 | 1차기성 |
| 5 | 2027-01 | 미정 | 제2027-05호 | - |
| 6 | 2027-04 | 미정 | 제2027-06호 | - |
| 7 | 2027-07 | 미정 | 제2027-07호 | - |
| 8 | 2027-10 | 미정 | 제2027-08호 | - |
| 9 | 2028-01 | 미정 | 제2028-09호 | - |
| 10 | 2028-02 | 미정 | 제2028-10호 | 준공금 |

### 4.2 점검회차 상태 관리

| 상태 | 의미 |
|---|---|
| planned | 예정만 생성됨 |
| scheduled | 점검일 확정 |
| in_progress | 현장점검 진행중 |
| checked | 체크리스트 입력 완료 |
| review | 보고서 검토중 |
| report_ready | 최종본 생성 가능 |
| submitted | 발주처 제출 완료 |
| closed | 회차 종료 |
| cancelled | 취소 |

### 4.3 발주처별 보고서 업무 생성

발주처가 여러 개이고 `requiresSeparateReport = true`이면, 같은 점검회차 안에서 발주처별 보고서 업무를 만든다.

```text
제1회 점검
├── 삼성문화재단 보고서 업무
└── 삼성생명공익재단 보고서 업무
```

각 업무는 다음 상태를 가진다.

| 상태 | 의미 |
|---|---|
| not_started | 생성 전/미시작 |
| drafting | 초안 작성중 |
| review | 검토중 |
| exported | 최종본 생성 |
| submitted | 제출 완료 |
| confirmed | 발주처 확인 |
| cancelled | 취소 |

### 4.4 회차별 업무 자동 생성

점검회차가 생성되면 회차별 할 일을 자동 생성한다.

| 업무 | 기본 마감 |
|---|---|
| 점검 일정 확인 | D-30 |
| 발주처 일정 협의 | D-14 |
| 시공사 일정 협의 | D-14 |
| 점검 준비자료 확인 | D-7 |
| 현장점검 | D-Day |
| 체크리스트 입력 완료 | D+1 |
| 지적사항 정리 | D+3 |
| 사진대지 정리 | D+5 |
| 보고서 초안 작성 | D+7 |
| 내부 검토 | D+10 |
| 발주처별 보고서 제출 | D+14 |

### 4.5 점검 일정 캘린더

월/주/리스트/연도 타임라인으로 점검 일정을 보여준다.

필터:

- 프로젝트
- 점검 담당자
- 발주처
- 회차 상태
- 제출기한
- 미제출 보고서
- 미조치 지적사항
- 계약 milestone

### 4.6 일정 변경 관리

점검일이 변경되면 변경 이력을 남긴다.

필수 기록:

- 기존 예정일
- 변경 예정일
- 기존 실제 점검일
- 변경 실제 점검일
- 변경 사유
- 변경 요청자
- 변경 승인자
- 관련 메일/파일
- 알림 발송 여부

### 4.7 공사일정 첨부 연결

회차별 또는 연도별 공사일정 파일을 연결한다.

연결 대상:

- Project
- InspectionRound
- WorkScheduleAttachment
- FileAsset

## 5. 사용자 흐름

### 5.1 점검회차 자동 생성

```text
프로젝트 선택
→ 점검회차 탭 진입
→ 점검 일정 생성 클릭
→ 기준 선택: 프로젝트 공사기간 / 계약기간 / 수동
→ 점검주기 입력
→ 총 회차 입력
→ 발주처별 보고서 생성 여부 확인
→ 일정 미리보기
→ 저장
→ 회차별 업무 생성
→ 회차별 웹하드 폴더 생성 이벤트
```

### 5.2 점검일 확정

```text
점검회차 선택
→ 예정월 확인
→ 실제 점검일 입력
→ 점검 담당자 지정
→ 발주처 확인자 지정
→ 시공사 참석자 지정
→ 저장
→ 일정 협의/리마인드 업무 갱신
```

### 5.3 회차 종료

```text
체크리스트 입력 완료
→ 지적사항 등록
→ 조치현황 확인
→ 사진대지 완료
→ 보고서 초안 생성
→ 내부 검토
→ 발주처별 최종본 export
→ 메일 제출
→ 제출완료
→ 회차 종료
```

## 6. 핵심 데이터

### InspectionSchedule

프로젝트 전체 점검 일정의 상위 묶음이다.

- scheduleId
- projectId
- contractId
- scheduleName
- basisType
- cycleText
- totalRounds
- startDate
- endDate
- status

### InspectionRound

점검회차 단위다.

- inspectionRoundId
- projectId
- scheduleId
- roundNo
- documentNo
- plannedMonth
- plannedDate
- actualInspectionDate
- inspectorUserId
- confirmerContactId
- contractorContactId
- status
- reportDueDate
- milestoneLabel
- memo

### InspectionOwnerReportTask

발주처별 보고서 업무다.

- taskId
- inspectionRoundId
- ownerPartyId
- documentInstanceId
- status
- exportedFileId
- submittedAt
- mailThreadId

### InspectionTask

회차별 할 일이다.

- taskId
- inspectionRoundId
- taskType
- title
- dueDate
- assigneeId
- status
- linkedEntityType
- linkedEntityId

### WorkScheduleAttachment

공사일정 도면/첨부자료 연결이다.

- attachmentId
- projectId
- inspectionRoundId
- year
- title
- fileId
- highlightedArea
- note

## 7. 완료 기준

- 프로젝트 기준으로 점검회차를 자동 생성할 수 있다.
- 계약기간/공사기간/수동 입력 기준을 모두 지원한다.
- 총 10회 같은 고정 회차 일정을 지원한다.
- 예정월, 예정일, 실제 점검일을 분리하여 저장한다.
- 발주처별 보고서 업무가 자동 생성된다.
- 회차별 기본 업무가 자동 생성된다.
- 점검 일정 변경 이력이 남는다.
- 공사일정 첨부자료를 연도별/회차별로 연결할 수 있다.
- 보고서 제출 완료 시 회차와 발주처별 업무 상태가 갱신된다.
