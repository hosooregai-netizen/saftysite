# 05. Design Markdown — 결재/서명/제출

## 1. 화면 목표

결재/서명/제출 화면은 문서가 제출 가능한 상태인지 한눈에 판단하고, 남은 승인·서명·첨부·수신자·메일 작업을 빠르게 완료하도록 돕는 업무 통제 화면이다.

핵심 목표:

- 초안/검토본/최종본/날인본/제출본을 혼동하지 않게 한다.
- 결재 단계와 현재 담당자를 명확히 보여준다.
- 제출 전 차단 사유를 눈에 띄게 표시한다.
- 발주처별 제출 상태를 matrix로 보여준다.
- 메일함과 웹하드 연결 상태를 시각적으로 보여준다.

## 2. 화면 목록

### 2.1 결재함

Route:

```text
/approvals/inbox
```

주요 영역:

- 내 결재 대기
- 내가 요청한 결재
- 반려/수정 요청
- 마감 임박
- 완료된 결재

컬럼:

| 컬럼 | 설명 |
|---|---|
| 문서명 | 결재 대상 문서 |
| 프로젝트 | 연결 프로젝트 |
| 발주처 | ownerPartyId가 있는 경우 |
| 요청자 | 결재 요청자 |
| 현재 단계 | 점검 담당자 검토 등 |
| 상태 | active/approved/rejected |
| 마감일 | dueDate |
| 액션 | 승인/반려/수정요청 |

### 2.2 문서 결재 화면

Route:

```text
/documents/[documentId]/approval
```

Layout:

```text
┌──────────────────────────────────────────────┐
│ Document Header: 문서명 / 프로젝트 / 발주처 / 상태 │
├──────────────┬────────────────┬──────────────┤
│ Approval     │ Document       │ Action Panel │
│ Stepper      │ Summary        │ Comment      │
└──────────────┴────────────────┴──────────────┘
```

주요 컴포넌트:

- ApprovalStepper
- ApprovalStepCard
- ApprovalCommentThread
- ApprovalActionPanel
- ChangeRequestPanel
- DocumentVersionCard

### 2.3 서명/날인 화면

Route:

```text
/documents/[documentId]/signing
```

표시 항목:

- 문서 유형
- 서명/날인 필요 여부
- 서명자 또는 날인자
- 등록된 서명/직인 자산
- 날인본 업로드
- 서명/날인 완료 상태
- 최종본 파일

### 2.4 제출 준비 화면

Route:

```text
/documents/[documentId]/submission
```

구성:

- 제출 준비도 카드
- 결재 완료 여부
- 서명/날인 완료 여부
- 최종본 파일
- 첨부파일 목록
- 수신자 목록
- 제출 채널 선택
- 메일 초안
- 제출 전 체크리스트

### 2.5 프로젝트 제출 이력

Route:

```text
/projects/[projectId]/submissions
```

표시 항목:

| 컬럼 | 설명 |
|---|---|
| 제출명 | 보고서 제출 등 |
| 문서 | 제출 문서 |
| 발주처 | 제출 대상 |
| 채널 | mail/manual/share |
| 제출일 | submittedAt |
| 상태 | submitted/confirmed/revision_requested |
| 제출 파일 | FileAsset |
| 메일 | MailThread |
| 확인 | 발주처 확인 여부 |

### 2.6 발주처별 제출 matrix

공사안전보건대장 이행확인 보고서처럼 발주처별 제출이 필요한 경우 표시한다.

```text
제1회 점검
├── 삼성문화재단: 결재완료 / 최종본 / 제출완료 / 확인대기
└── 삼성생명공익재단: 결재완료 / 최종본 / 제출완료 / 확인대기
```

### 2.7 관리자 결재 템플릿

Route:

```text
/admin/approval-templates
```

구성:

- 문서 유형별 결재선
- 단계명
- 승인자 역할
- 필수 여부
- 서명/날인 필요 여부
- 발행/복제/보관

## 3. UX 규칙

1. 제출 가능 상태는 `ready`, `warning`, `blocked` 세 단계로 표시한다.
2. blocked 항목은 제출 버튼을 비활성화한다.
3. 결재 반려 또는 수정 요청이 있으면 export/submit을 막는다.
4. 서명/날인이 필요한 문서에서 날인본이 없으면 danger warning을 표시한다.
5. 최종본 파일과 날인본 파일을 badge로 명확히 구분한다.
6. 메일 제출은 첨부파일 목록과 수신자 확인 후에만 가능하다.
7. 수동 제출은 제출일, 제출자, 증빙 메모를 입력하게 한다.
8. 발주처별 제출은 owner badge로 구분한다.
9. 제출 후에는 문서, 파일, 메일, 제출 이력을 모두 연결해서 보여준다.
10. 법적 전자서명으로 오해되지 않도록 “업무상 서명/날인 확인” 표현을 사용한다.

## 4. 핵심 컴포넌트

### ApprovalStepper

단계 표시:

```text
작성 완료 → 점검 담당자 검토 → 기술사 확인 → 제출 처리
```

상태:

- pending
- active
- approved
- rejected
- changes_requested
- skipped

### ApprovalActionPanel

액션:

- 승인
- 반려
- 수정 요청
- 위임
- 취소

### SignatureRequirementPanel

표시:

- 서명 필요 여부
- 날인 필요 여부
- 담당자
- 서명 자산
- 날인본 파일
- 완료 상태

### SubmissionReadinessPanel

표시:

```text
결재: 완료/미완료
서명/날인: 완료/미완료
최종본: 있음/없음
첨부파일: 완료/누락
수신자: 완료/누락
메일: 작성/미작성
원본 변경: 없음/있음
```

### SubmissionPackageBuilder

기능:

- 최종본 파일 선택
- 날인본 파일 선택
- 증빙 첨부 선택
- 사진대지 선택
- 산업안전보건관리비 첨부 선택
- 웹하드 위치 표시

### SubmissionMailDraftPanel

구성:

- 제목
- 수신자
- 참조
- 본문
- 첨부파일
- 메일함 연결 상태
- 발송 또는 guest draft 복사

### OwnerSubmissionMatrix

행:

- 점검회차
- 발주처

열:

- 결재
- 서명/날인
- 최종본
- 제출
- 확인

## 5. Empty State

### 결재 요청 없음

```text
대기 중인 결재가 없습니다.
문서 상세 화면에서 결재 요청을 생성할 수 있습니다.
```

### 제출 이력 없음

```text
아직 제출 이력이 없습니다.
최종본을 생성한 뒤 제출 패키지를 구성하세요.
```

## 6. Warning State

### 결재 미완료

```text
필수 결재 단계가 완료되지 않았습니다.
제출 전에 모든 필수 승인 단계를 완료하세요.
```

### 서명/날인 누락

```text
이 문서는 날인본이 필요합니다.
날인본 파일을 업로드하거나 서명/날인 필요 여부를 재검토하세요.
```

### 최종본 누락

```text
제출 가능한 최종본 파일이 없습니다.
문서 export를 먼저 수행하세요.
```

### 수신자 누락

```text
발주처 제출 수신자가 설정되지 않았습니다.
프로젝트 관계자 또는 연락처에서 수신자를 선택하세요.
```

## 7. Responsive

### Desktop

- 결재 화면은 stepper + document summary + action panel 3-column
- 제출 화면은 readiness panel + package builder + mail draft 3-column
- matrix와 history table을 함께 표시

### Tablet

- action panel은 drawer
- package builder는 accordion

### Mobile

- 결재 승인/반려 중심
- 제출 실행보다는 상태 확인과 간단한 승인에 최적화
