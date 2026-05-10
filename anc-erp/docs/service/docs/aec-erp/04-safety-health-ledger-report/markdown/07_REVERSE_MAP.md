# 07. Reverse Map — 공사안전보건대장 이행확인 보고서 자동화

## 1. Feature

```yaml
featureId: document.safety_health_ledger_report
featureName: 공사안전보건대장 이행확인 보고서 자동화
priority: P0
module: safety-health-ledger-report
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 보고서 목록 | `/projects/[projectId]/documents/safety-reports` | 프로젝트별 이행확인 보고서 조회 |
| 보고서 생성 | `/projects/[projectId]/documents/safety-reports/new` | 점검회차/발주처 선택 후 초안 생성 |
| 보고서 상세 | `/documents/safety-reports/[documentId]` | 문서 요약 및 상태 |
| 보고서 편집 | `/documents/safety-reports/[documentId]/edit` | 섹션별 편집 |
| 보고서 미리보기 | `/documents/safety-reports/[documentId]/preview` | A4 미리보기 |
| 섹션 관리 | `/documents/safety-reports/[documentId]/sections` | 섹션별 상태/재생성 |
| 변수 관리 | `/documents/safety-reports/[documentId]/variables` | 변수와 데이터 출처 확인 |
| Export | `/documents/safety-reports/[documentId]/export` | 최종본 생성 |
| 제출 | `/documents/safety-reports/[documentId]/submission` | 메일 제출/이력 |
| 발주처 업무 연결 | `/inspections/[inspectionRoundId]/owner-reports/[ownerReportTaskId]/document` | 회차별 발주처 보고서 업무에서 문서 생성 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| 보고서 목록 | SafetyReportTable, ReportStatusBadge, OwnerReportBranchBadge |
| 보고서 생성 | SafetyReportWizard, InspectionRoundSelector, OwnerPartySelector, ReportTemplateSelector |
| 보고서 상세 | SafetyReportSummaryCard, ReportVersionHistory, ReportLinkedDataPanel |
| 보고서 편집 | DocumentSectionNavigator, DocumentSectionEditor, A4ReportPreview, ReportSaveBar |
| 미리보기 | A4ReportPreview, PageNavigator, PrintLayoutWarningPanel |
| 섹션 관리 | SectionStatusTable, SectionRegenerateButton |
| 변수 관리 | ReportVariablePanel, MissingFieldPanel |
| Export | ReportExportChecklist, ReportExportBar, WebhardSaveLocation |
| 제출 | SubmissionHistory, MailDraftButton, SubmittedFileCard |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| SafetyReportTable | GET `/api/v1/projects/{projectId}/safety-reports` |
| SafetyReportWizard | POST `/api/v1/safety-reports/draft` |
| InspectionRoundSelector | GET `/api/v1/projects/{projectId}/inspection-rounds` |
| OwnerPartySelector | GET `/api/v1/inspection-rounds/{inspectionRoundId}/owner-report-branches` |
| ReportRequiredDataPanel | GET `/api/v1/inspection-rounds/{inspectionRoundId}/safety-report-required-data` |
| MissingFieldPanel | GET `/api/v1/safety-reports/{documentId}/missing-fields` |
| DocumentSectionEditor | POST `/api/v1/safety-reports/{documentId}/save-section` |
| SectionRegenerateButton | POST `/api/v1/safety-reports/{documentId}/sections/{sectionKey}/regenerate` |
| A4ReportPreview | GET `/api/v1/safety-reports/{documentId}` |
| ReportVariablePanel | GET `/api/v1/safety-reports/{documentId}/variables` |
| RefreshLinkedDataButton | POST `/api/v1/safety-reports/{documentId}/refresh-linked-data` |
| ReportExportBar | POST `/api/v1/safety-reports/{documentId}/export` |
| MailDraftButton | POST `/api/v1/safety-reports/{documentId}/mark-submitted` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| POST `/safety-reports/draft` | DocumentInstance, SafetyReportSnapshot, SafetyReportVersion |
| POST `/safety-reports/{id}/generate` | DocumentInstance, SafetyReportSection, SourceLink |
| POST `/safety-reports/{id}/validate` | MissingField, ReviewWarning |
| POST `/safety-reports/{id}/save-section` | SafetyReportSection, SafetyReportVersion |
| POST `/safety-reports/{id}/export` | DocumentInstance, SafetyReportExportJob, FileAsset |
| POST `/safety-reports/{id}/clone-for-owner` | DocumentInstance, ProjectParty |
| GET `/required-data` | Project, InspectionRound, ProjectParty, ChecklistResult, Finding, SafetyCostUsage |
| POST `/refresh-linked-data` | SourceLink, ReviewWarning, SafetyReportSection |
| POST `/mark-submitted` | DocumentInstance, InspectionOwnerReportTask, Submission, MailThread |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| DocumentInstance | safety-report-generation |
| SafetyReportSnapshot | safety-report-generation |
| SafetyReportSection | safety-report-generation |
| Project | safety-report-generation |
| ProjectParty | safety-report-generation |
| InspectionRound | safety-report-generation |
| ChecklistResult | safety-report-generation |
| Finding | safety-report-generation |
| CorrectiveAction | safety-report-generation |
| EvidencePhoto | safety-report-generation |
| SafetyCostUsage | safety-report-generation |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 초안 생성 | test_safety_report_draft_create_success |
| 필수 연결키 검증 | test_safety_report_requires_project_round_owner |
| 중복 방지 | test_safety_report_prevents_duplicate_active_owner_report |
| 발주처별 분기 | test_safety_report_generates_owner_specific_document |
| 누락정보 | test_safety_report_missing_required_fields |
| 타 발주처 복제 | test_safety_report_clone_for_owner_replaces_owner_specific_values |
| 점검표 매핑 | test_safety_report_checklist_results_mapped |
| 사진대지 매핑 | test_safety_report_finding_photo_ledger_mapped |
| 안전관리비 계산 | test_safety_report_safety_cost_rate_calculated |
| export 차단 | test_safety_report_export_blocked_when_required_missing |
| 최신 저장본 export | test_safety_report_export_uses_latest_saved_snapshot |
| 웹하드 저장 | test_safety_report_export_creates_file_asset |
| 발주처 업무 연결 | test_safety_report_links_owner_report_task |
| 제출 상태 | test_safety_report_mark_submitted_updates_owner_report_task |
| 원본 변경 감지 | test_safety_report_refresh_linked_data_detects_stale_source |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ProjectParty, Contact |
| 계약/견적 | contractId, serviceScope, deliverables |
| 점검회차/일정 | inspectionRoundId, ownerReportTaskId |
| 현장점검 체크리스트 | checklistResults |
| 지적사항/조치현황 | Finding, CorrectiveAction |
| 사진대지 | EvidencePhoto, FileAsset |
| 산업안전보건관리비 | SafetyCostUsage |
| 웹하드 | exportedFileId, final folder |
| 메일함 | 제출 메일, MailThread |
| 결재/제출 | Approval, Submission |
| 관리자/템플릿 | DocumentTemplate, PromptTemplate |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 동일 회차 발주처별 보고서 혼동 | inspectionRoundId + ownerPartyId unique active rule |
| 발주처별 금액/공정율 오기 | owner-specific variable validation |
| AI가 법령 문구 생성 | templateSections의 문구만 허용 |
| 점검표와 지적사항 불일치 | checklist_finding_mismatch warning |
| 사진대지 지적/조치 사진 누락 | photo_pair_missing warning |
| 오래된 원본 데이터로 export | stale_linked_data 감지 및 save-before-export |
| 최종본/초안 혼동 | status badge와 Draft watermark |
| 웹하드 저장 누락 | export 후 FileAsset 생성 필수 |
