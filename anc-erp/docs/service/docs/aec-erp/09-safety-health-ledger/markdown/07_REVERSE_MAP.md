# 07. Reverse Map — 안전보건대장 자동화

## 1. Feature

```yaml
featureId: safety_health_ledger.automation
featureName: 안전보건대장 자동화
priority: P1
module: safety-health-ledger
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 대장 목록 | `/projects/[projectId]/safety-health-ledgers` | 프로젝트 안전보건대장 조회 |
| 대장 생성 | `/projects/[projectId]/safety-health-ledgers/new` | 프로젝트/템플릿/원본 연결 |
| 대장 상세 | `/safety-health-ledgers/[ledgerId]` | 대장 요약 및 상태 |
| 대장 편집 | `/safety-health-ledgers/[ledgerId]/edit` | 섹션별 편집 |
| 위험요인 register | `/safety-health-ledgers/[ledgerId]/risks` | 위험요인 관리 |
| 감소대책 | `/safety-health-ledgers/[ledgerId]/measures` | 감소대책 관리 |
| 점검이력 | `/safety-health-ledgers/[ledgerId]/inspections` | 점검회차 누적 이력 |
| 지적/조치이력 | `/safety-health-ledgers/[ledgerId]/findings` | 지적사항 및 조치 누적 |
| 안전관리비 이력 | `/safety-health-ledgers/[ledgerId]/safety-costs` | 비용 확인 이력 |
| 첨부자료 | `/safety-health-ledgers/[ledgerId]/attachments` | 연결 파일 관리 |
| 미리보기 | `/safety-health-ledgers/[ledgerId]/preview` | A4 문서 preview |
| Export | `/safety-health-ledgers/[ledgerId]/export` | 최종본 생성 |
| 버전 | `/safety-health-ledgers/[ledgerId]/versions` | 개정/버전 이력 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| 대장 목록 | SafetyHealthLedgerTable, LedgerStatusBadge |
| 대장 생성 | LedgerWizard, LedgerMissingFieldPanel |
| 대장 상세 | LedgerSummaryCard, LedgerReviewWarningPanel |
| 대장 편집 | LedgerSectionNavigator, LedgerSectionEditor, LedgerSourceLinkPanel |
| 위험요인 register | LedgerRiskRegisterTable, LedgerRiskItemForm, RiskRecurrenceBadge |
| 감소대책 | RiskReductionMeasureTable, LedgerRiskStatusBadge |
| 점검이력 | LedgerInspectionHistoryTable, LedgerSyncPreviewModal |
| 지적/조치이력 | LedgerFindingHistoryTable, LedgerActionHistoryTimeline |
| 안전관리비 이력 | LedgerSafetyCostHistoryTable |
| 첨부자료 | LedgerAttachmentPanel |
| 미리보기 | LedgerA4Preview |
| Export | LedgerExportChecklist |
| 버전 | LedgerVersionHistory |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| SafetyHealthLedgerTable | GET `/api/v1/projects/{projectId}/safety-health-ledgers` |
| LedgerWizard | POST `/api/v1/projects/{projectId}/safety-health-ledgers` |
| LedgerSectionEditor | POST `/api/v1/safety-health-ledgers/{ledgerId}/sections/{sectionKey}/save` |
| LedgerRiskRegisterTable | GET `/api/v1/safety-health-ledgers/{ledgerId}/risks` |
| LedgerRiskItemForm | POST/PATCH `/api/v1/safety-health-ledger-risks` |
| RiskReductionMeasureTable | GET `/api/v1/safety-health-ledgers/{ledgerId}/measures` |
| LedgerInspectionHistoryTable | GET `/api/v1/safety-health-ledgers/{ledgerId}/inspection-history` |
| LedgerFindingHistoryTable | GET `/api/v1/safety-health-ledgers/{ledgerId}/finding-history` |
| LedgerSafetyCostHistoryTable | GET `/api/v1/safety-health-ledgers/{ledgerId}/safety-cost-history` |
| LedgerAttachmentPanel | GET/POST `/api/v1/safety-health-ledgers/{ledgerId}/attachments` |
| LedgerSyncPreviewModal | POST sync endpoints |
| LedgerA4Preview | GET `/api/v1/safety-health-ledgers/{ledgerId}` |
| LedgerExportChecklist | POST `/api/v1/safety-health-ledgers/{ledgerId}/validate`, POST `/export` |
| LedgerVersionHistory | GET `/api/v1/safety-health-ledgers/{ledgerId}/versions` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| POST `/safety-health-ledgers` | SafetyHealthLedger, SafetyHealthLedgerVersion |
| POST `/generate` | SafetyHealthLedgerSnapshot, SafetyHealthLedgerSection |
| POST `/risks/import-from-plan` | SafetyManagementPlan, LedgerRiskItem, LedgerRiskReductionMeasure |
| POST `/inspection-history/sync` | InspectionRound, ChecklistSession, LedgerInspectionHistory |
| POST `/finding-history/sync` | Finding, CorrectiveAction, LedgerFindingHistory |
| POST `/safety-cost-history/sync` | SafetyCostUsage, LedgerSafetyCostHistory |
| POST `/risks/detect-recurrence` | LedgerRiskItem, LedgerFindingHistory, LedgerReviewWarning |
| POST `/export` | SafetyHealthLedgerVersion, FileAsset, AuditLog |
| POST `/attachments` | LedgerAttachment, FileAsset |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| SafetyHealthLedger | safety-health-ledger-generation |
| SafetyHealthLedgerSnapshot | safety-health-ledger-generation |
| LedgerRiskItem | safety-health-ledger-generation |
| LedgerRiskReductionMeasure | safety-health-ledger-generation |
| LedgerInspectionHistory | safety-health-ledger-generation |
| LedgerFindingHistory | safety-health-ledger-generation |
| LedgerSafetyCostHistory | safety-health-ledger-generation |
| Project | safety-health-ledger-generation |
| SafetyManagementPlan | safety-health-ledger-generation |
| Finding | safety-health-ledger-generation |
| CorrectiveAction | safety-health-ledger-generation |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 대장 생성 | test_safety_health_ledger_create_success |
| 중복 방지 | test_safety_health_ledger_prevents_duplicate_active_ledger |
| 위험요인 import | test_safety_health_ledger_imports_risks_from_safety_management_plan |
| 위험요인 검증 | test_ledger_risk_requires_hazard_description |
| 점검 이력 sync | test_ledger_syncs_inspection_history |
| 지적/조치 이력 sync | test_ledger_syncs_finding_action_history |
| 안전관리비 sync | test_ledger_syncs_safety_cost_history |
| 반복 위험 감지 | test_ledger_detects_repeated_risks |
| 버전 생성 | test_ledger_version_created_on_sync |
| export 차단 | test_ledger_export_blocked_when_required_missing |
| 최신 snapshot export | test_ledger_export_uses_latest_saved_snapshot |
| 파일 생성 | test_ledger_export_creates_file_asset |
| 첨부 연결 | test_ledger_attachment_links_file_asset |
| 원본 변경 warning | test_ledger_stale_source_warning_created |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ProjectParty, Contact |
| 안전관리계획서 | SafetyManagementPlan, SafetyManagementRiskItem |
| 점검회차/일정 | InspectionRound, LedgerInspectionHistory |
| 현장점검 체크리스트 | ChecklistSession, ChecklistResult |
| 지적사항/조치현황 | Finding, CorrectiveAction |
| 사진대지 | EvidencePhoto, FileAsset |
| 산업안전보건관리비 | SafetyCostUsage |
| 이행확인 보고서 | DocumentInstance, linkedReportIds |
| 웹하드 | LedgerAttachment, exportedFileId |
| 결재/제출 | export 후 Submission optional |
| 관리자/템플릿 | LedgerTemplate, PromptTemplate |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 회차별 보고서와 대장 혼동 | 대장은 projectId 기준, 보고서는 inspectionRoundId+ownerPartyId 기준으로 구분 |
| 원본 데이터 변경 후 대장 미갱신 | stale source warning 및 sync preview 제공 |
| 반복 위험요인 누락 | riskType/checklistItem/title keyword 기반 recurrence detection |
| 조치 미확인 항목을 완료로 표시 | verified CorrectiveAction만 완료로 표시 |
| 안전관리계획서 위험요인과 실제 점검 결과 불일치 | sourceLink와 mismatch warning 제공 |
| export 시 오래된 snapshot 사용 | save-before-export invariant 적용 |
| 첨부자료 누락 | LedgerAttachment validation 및 warning |
