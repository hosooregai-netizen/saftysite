# 10. Global Reverse Map — 00~14 누적

## 목적

A&C ERP의 모든 기능을 화면, 컴포넌트, API, 데이터 모델, 프롬프트, 테스트까지 역추적한다.

## Global Map

| Feature ID | 기능 | 대표 Route | 핵심 모델 | 핵심 프롬프트 |
|---|---|---|---|---|
| project.field.registry | 프로젝트/현장 원장 | `/projects/[projectId]` | Project, Organization, ProjectParty, Contact | project-info-extraction |
| contract.estimate.management | 계약/견적 관리 | `/projects/[projectId]/contracts` | Contract, ContractParty, PaymentTerm | contract-draft-generation |
| inspection.schedule.management | 점검회차/일정 | `/projects/[projectId]/inspections` | InspectionSchedule, InspectionRound, InspectionOwnerReportTask | inspection-schedule-generation |
| document.safety_health_ledger_report | 이행확인 보고서 | `/documents/safety-reports/[documentId]` | DocumentInstance, SafetyReportSnapshot | safety-report-generation |
| inspection.checklist.management | 현장점검 체크리스트 | `/inspections/[inspectionRoundId]/checklist` | ChecklistSession, ChecklistResult, FindingCandidate | checklist-summary-and-finding-candidate |
| finding.action.photo_ledger | 지적/조치/사진대지 | `/inspections/[inspectionRoundId]/photo-ledger` | Finding, CorrectiveAction, EvidencePhoto, PhotoLedger | finding-action-photo-ledger |
| safety_cost.usage_confirmation | 산업안전보건관리비 | `/inspections/[inspectionRoundId]/safety-costs` | SafetyCostUsage, SafetyCostEvidence, SafetyCostReview | safety-cost-usage-comment |
| safety_management_plan.automation | 안전관리계획서 자동화 | `/projects/[projectId]/safety-management-plans` | SafetyManagementPlan, SafetyManagementRiskItem, SafetyManagementPlanSection | safety-management-plan-generation |
| safety_health_ledger.automation | 안전보건대장 자동화 | `/projects/[projectId]/safety-health-ledgers` | SafetyHealthLedger, LedgerRiskItem, LedgerInspectionHistory | safety-health-ledger-generation |
| webhard.file_management | 웹하드 | `/webhard/projects/[projectId]` | Folder, FileAsset, FileVersion, ShareLink | webhard-file-classification |
| mailbox.project_communication | 메일함 | `/mail` | MailAccount, MailThread, MailMessage, MailAttachment | mail-draft-and-classification |
| approval.signature.submission | 결재/서명/제출 | `/documents/[documentId]/approval` | ApprovalWorkflow, ApprovalStep, SignatureTask, Submission | approval-submission-readiness |
| admin.template.prompt | 관리자/템플릿/프롬프트 | `/admin/templates` | DocumentTemplate, TemplateVersion, PromptTemplate, PromptVersion | template-variable-mapping-and-prompt-governance |
| dashboard.statistics | 대시보드/통계 | `/dashboard` | DashboardSnapshot, ProjectHealthMetric, StatisticsMetric, AlertRule | dashboard-insight-summary |

## 핵심 연결키

| 연결키 | 사용 위치 |
|---|---|
| projectId | 모든 모듈의 루트, 웹하드 프로젝트 폴더 기준 |
| ownerPartyId | 발주처별 계약, 보고서, 사진대지, 안전관리비, 파일 분기 |
| inspectionRoundId | 체크리스트, 지적사항, 사진대지, 안전관리비, 보고서, 회차별 폴더 기준 |
| documentId | 보고서, 사진대지, 안전관리비 sync-to-report, export 파일 연결 |
| planId | 안전관리계획서 섹션, 위험요인, 첨부, export 기준 |
| ledgerId | 안전보건대장 섹션, 위험요인, 점검이력, export 기준 |
| fileId | 웹하드, 사진, 증빙파일, 최종본, 메일첨부, 공유 링크 |
| folderId | 웹하드 폴더 트리, 업로드 위치, 자동 저장 위치 |
| mailMessageId | 메일 첨부파일 저장 및 제출 이력 연결 |
| approvalId | 문서 내부 검토, 기술사 승인, 반려 이력 연결 |
| signatureTaskId | 서명/날인 필요 항목, 서명본/날인본 파일 확인 연결 |
| submissionId | 제출본 파일, 제출 메일, 발주처 제출 이력 연결 |
| templateId | 문서 템플릿, 체크리스트 템플릿, 메일 템플릿 연결 |
| promptId | 서비스 AI 프롬프트, Codex 프롬프트, 디자인/Reverse Prompt 연결 |
| templateVersionId | 문서 생성 시점의 템플릿 버전 추적 |
| promptVersionId | AI 실행 시점의 프롬프트 버전 추적 |
| dashboardSnapshotId | 특정 시점의 KPI/위험/업무 요약 스냅샷 추적 |
| alertRuleId | 지연·미제출·미조치 등 업무 알림 규칙 추적 |

## 구현 불변 조건

- 발주처가 분기되는 기능은 반드시 `ownerPartyId`를 포함한다.
- 프로젝트 단위 누적 기능은 반드시 `projectId`를 기준으로 한다.
- 회차별 보고서는 `inspectionRoundId + ownerPartyId`, 안전보건대장은 `projectId` 기준임을 구분한다.
- 보고서와 대장 export는 최신 저장 snapshot을 기준으로 한다.
- AI 초안은 최종본이 아니며 사용자 확정이 필요하다.
- 사진, 증빙, 최종본 파일은 `FileAsset`으로 연결한다.
- 문서 export 파일은 웹하드 `FileAsset`으로 저장하고 `DocumentInstance`와 연결한다.
- 메일 첨부파일은 웹하드 저장 시 `MailMessage`, `MailAttachment`, `FileAsset`을 연결한다.
- 보고서 제출 메일은 `DocumentInstance`, `FileAsset`, `MailMessage`, `Submission`을 연결한다.
- 제출 전 문서는 `ApprovalWorkflow` 완료와 `SignatureTask` 완료 여부를 검증한다.
- 발주처별 제출은 `ownerPartyId + documentId + finalFileId` 조합으로 추적한다.
- 조치요청 메일은 `Finding`, `CorrectiveAction`, `MailThread`를 연결한다.
- 공유 링크는 만료/폐기/권한/접근 로그를 가진다.
- 기능 구현 전 해당 기능의 Reverse Map을 먼저 확인한다.

- 템플릿과 프롬프트는 publish 전 테스트케이스를 통과해야 한다.
- 문서/프롬프트/법령 문구 수정은 `AdminAuditLog`를 남긴다.
- 법령/고시 문구는 권한 있는 관리자만 수정할 수 있다.

- 대시보드는 원본 업무 데이터를 수정하지 않고 집계/요약/알림만 수행한다.
- 통계 수치는 원본 모델 기준의 계산식을 명시하고, 수동 입력값과 계산값이 다르면 경고한다.
