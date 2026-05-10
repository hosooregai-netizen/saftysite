# 05. Module Containment Map — A&C 기술사 ERP

## 1. 왜 이 문서가 필요한가

기능은 구현과 문서 관리를 위해 00~14로 분리되어 있지만, 실제 ERP 화면에서는 대부분의 기능이 `Project`, `InspectionRound`, `DocumentInstance` 안에 포함된다.

따라서 Codex가 각 기능을 독립 메뉴/독립 데이터로 구현하지 않도록 포함 관계를 명확히 한다.

## 2. 실제 ERP 포함 구조

```text
A&C ERP
├── Dashboard
├── Projects
│   └── Project Detail
│       ├── Overview
│       ├── Parties / Contacts
│       ├── Contract / Estimate
│       ├── Inspection Rounds
│       │   └── Inspection Round Detail
│       │       ├── Checklist
│       │       ├── Findings / Corrective Actions
│       │       ├── Photo Ledger
│       │       ├── Safety Cost Usage
│       │       └── Owner Report Tasks
│       ├── Documents / Reports
│       │   └── Document Detail
│       │       ├── Sections
│       │       ├── Variables
│       │       ├── Findings / Actions Section
│       │       ├── Photo Ledger Section
│       │       ├── Approval / Signature
│       │       └── Submission
│       ├── Webhard
│       ├── Mail Threads
│       └── Activity / History
├── Webhard Full-screen App
├── Mailbox 3-pane App
├── Admin
└── Global Dashboard / Statistics
```

## 3. 기능 번호와 실제 포함 위치

| 기능 번호 | 기능명 | 실제 포함 위치 | 전역 바로가기 가능 여부 | 핵심 부모 키 |
|---:|---|---|---|---|
| 00 | 전체 골격 | 루트 / 공통 | 예 | 없음 |
| 01 | 프로젝트/현장 원장 | Project Detail 루트 | 예 | projectId |
| 02 | 계약/견적 | Project Detail > 계약/견적 | 예, 계약 전체 목록 | projectId, contractId |
| 03 | 점검회차/일정 | Project Detail > 점검회차 | 예, 캘린더 | projectId, inspectionRoundId |
| 04 | 이행확인 보고서 | Project > Documents, InspectionRound > OwnerReportTask | 예, 문서함 | projectId, inspectionRoundId, ownerPartyId, documentId |
| 05 | 현장점검 체크리스트 | InspectionRound Detail > Checklist | 아니오 또는 점검 바로가기 | projectId, inspectionRoundId, sessionId |
| 06 | 지적/조치/사진대지 | InspectionRound Detail 및 Document Detail 내부 | 예, 미조치 목록 | projectId, inspectionRoundId, findingId, photoLedgerId |
| 07 | 산업안전보건관리비 | InspectionRound/OwnerReport/Document Section 내부 | 예, 비용 현황 | projectId, ownerPartyId, inspectionRoundId |
| 08 | 안전관리계획서 | Project > Documents | 예, 문서함 | projectId, documentId |
| 09 | 안전보건대장 | Project > Documents / Ledger | 예, 문서함 | projectId, ledgerId |
| 10 | 웹하드 | Project Detail > Webhard + Full-screen Webhard | 예 | projectId, folderId, fileId |
| 11 | 메일함 | Project Detail > Mail + Full-screen Mailbox | 예 | projectId, mailThreadId |
| 12 | 결재/서명/제출 | Document Detail 내부 + 제출 현황 | 예, 결재함 | documentId, approvalWorkflowId, submissionId |
| 13 | 관리자/템플릿/프롬프트 | Admin | 예 | templateId, promptId |
| 14 | 대시보드/통계 | Global Dashboard + Project Dashboard | 예 | projectId optional |

## 4. 핵심 containment rules

### 4.1 계약/견적은 프로젝트 안에 포함된다

맞다. 계약/견적 관리는 프로젝트 밖의 독립 기능이 아니라 프로젝트 상세 안의 탭/섹션이어야 한다.

기본 route:

```text
/projects/[projectId]/contracts
/projects/[projectId]/contracts/new
/contracts/[contractId]
```

`/contracts` 같은 전역 route는 전체 계약 목록, 검색, 미수금, 날인본 누락 같은 업무 큐 용도로만 사용한다.

### 4.2 지적사항/조치사항/사진대지는 보고서 안에도 포함된다

맞다. 기능 06은 독립 기능으로 분리했지만 실제로는 다음 위치에 모두 나타난다.

```text
/inspections/[inspectionRoundId]/findings
/inspections/[inspectionRoundId]/photo-ledger
/documents/safety-reports/[documentId]/sections/photo_ledger
/documents/safety-reports/[documentId]/sections/implementation_confirmation
```

즉, 지적/조치/사진대지는 원본 업무 모듈이면서 동시에 보고서 섹션이다.

### 4.3 결재/서명/제출은 문서 내부에 포함된다

맞다. 기능 12는 독립 메뉴처럼 보일 수 있지만 실제 부모는 `DocumentInstance`다.

기본 route:

```text
/documents/[documentId]/approval
/documents/[documentId]/submission
```

전역 `/approvals`는 결재함, `/submissions`는 제출 현황 큐다.

### 4.4 웹하드와 메일함은 앱이지만 Project linkage를 잃으면 안 된다

웹하드와 메일함은 full-screen app으로 분리될 수 있지만 모든 파일/메일은 가능한 한 projectId, documentId, findingId, submissionId와 연결되어야 한다.

## 5. 데이터 소유권 구조

```text
Project
├── Contract
├── Estimate
├── InspectionSchedule
├── InspectionRound
│   ├── ChecklistSession
│   ├── ChecklistResult
│   ├── Finding
│   │   ├── CorrectiveAction
│   │   └── EvidencePhoto
│   ├── PhotoLedger
│   ├── SafetyCostUsage
│   └── OwnerReportTask
├── DocumentInstance
│   ├── SafetyReportSection
│   ├── ApprovalWorkflow
│   ├── SignatureTask
│   └── Submission
├── FileAsset
└── MailThread
```

## 6. Codex가 구현 전 반드시 확인할 질문

1. 이 기능의 parent entity는 무엇인가?
2. projectId가 필요한가?
3. inspectionRoundId가 필요한가?
4. ownerPartyId가 필요한가?
5. documentId가 필요한가?
6. 이 기능은 전역 메뉴인가, 프로젝트 내부 탭인가, 문서 내부 섹션인가?
7. top-level route가 있다면 project linkage를 보존하는가?
8. 관련 파일/메일/제출/감사로그 연결이 필요한가?

## 7. 결론

기능은 분리되어 있지만, 실제 ERP에서는 다음 원칙이 맞다.

```text
계약/견적은 프로젝트 안에 포함된다.
점검/체크리스트/지적/사진대지는 점검회차 안에 포함된다.
지적/조치/사진대지는 보고서 섹션에도 포함된다.
결재/서명/제출은 문서 안에 포함된다.
웹하드/메일함은 전역 앱이지만 프로젝트와 문서에 연결된다.
```
