# 07. Reverse Map — 산업안전보건관리비 사용내용 확인

## 1. Feature

```yaml
featureId: safety_cost.usage_confirmation
featureName: 산업안전보건관리비 사용내용 확인
priority: P0
module: safety-cost-usage
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 프로젝트 안전관리비 목록 | `/projects/[projectId]/safety-costs` | 프로젝트 전체 사용내역 조회 |
| 발주처별 매트릭스 | `/projects/[projectId]/safety-costs/owner-matrix` | 발주처별 비교 |
| 회차별 사용내역 | `/inspections/[inspectionRoundId]/safety-costs` | 점검회차 기준 조회 |
| 사용내역 생성 | `/inspections/[inspectionRoundId]/safety-costs/new` | 발주처별 사용내역 입력 |
| 상세 | `/safety-costs/[usageId]` | 사용내역 상세 |
| 수정 | `/safety-costs/[usageId]/edit` | 금액/기준/의견 수정 |
| 증빙 | `/safety-costs/[usageId]/evidence` | 증빙파일 관리 |
| 검토 | `/safety-costs/[usageId]/review` | 적정성 의견 검토/확정 |
| 미리보기 | `/safety-costs/[usageId]/preview` | 보고서 문구 미리보기 |
| 이력 | `/safety-costs/[usageId]/history` | 변경 이력 |
| 보고서 섹션 | `/documents/safety-reports/[documentId]/safety-cost-usage` | 보고서 반영 섹션 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| safety-costs | SafetyCostSummaryCard, SafetyCostUsageTable, SafetyCostStatusBadge |
| owner-matrix | SafetyCostOwnerMatrix, SafetyCostUsageRateGauge |
| new/edit | SafetyCostUsageForm, SafetyCostWarningPanel |
| evidence | SafetyCostEvidenceUploader, SafetyCostEvidenceTable |
| review | SafetyCostCommentGeneratorPanel, SafetyCostReviewPanel |
| preview | SafetyCostReportPreviewCard |
| history | SafetyCostHistoryTimeline |
| report section | SafetyCostSyncToReportButton, SafetyCostReportPreviewCard |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| SafetyCostUsageTable | GET `/api/v1/projects/{projectId}/safety-cost-usages` |
| SafetyCostOwnerMatrix | GET `/api/v1/projects/{projectId}/safety-cost-usages/owner-matrix` |
| SafetyCostUsageForm | POST/PATCH `/api/v1/safety-cost-usages` |
| SafetyCostUsageRateGauge | POST `/api/v1/safety-cost-usages/{usageId}/calculate-rate` |
| SafetyCostWarningPanel | POST `/api/v1/safety-cost-usages/{usageId}/validate` |
| SafetyCostEvidenceUploader | POST `/api/v1/safety-cost-usages/{usageId}/evidence/upload` |
| SafetyCostCommentGeneratorPanel | POST `/api/v1/safety-cost-usages/{usageId}/generate-comment` |
| SafetyCostReviewPanel | POST `/api/v1/safety-cost-usages/{usageId}/review`, POST `/confirm` |
| SafetyCostSyncToReportButton | POST `/api/v1/safety-cost-usages/{usageId}/sync-to-report` |
| SafetyCostHistoryTimeline | GET `/api/v1/safety-cost-usages/{usageId}/history` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET safety-cost-usages | SafetyCostUsage |
| POST safety-cost-usages | SafetyCostUsage, SafetyCostHistoryEvent |
| calculate-rate | SafetyCostUsage, SafetyCostValidationWarning |
| validate | SafetyCostValidationWarning |
| evidence/upload | SafetyCostEvidence, FileAsset |
| generate-comment | SafetyCostReview, SafetyCostUsage |
| confirm | SafetyCostUsage, SafetyCostReview, AuditLog |
| sync-to-report | SafetyCostUsage, DocumentInstance, SafetyCostReportMapping |
| owner-matrix | ProjectParty, SafetyCostUsage |
| history | SafetyCostHistoryEvent |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| SafetyCostUsage | safety-cost-usage-comment |
| SafetyCostEvidence | safety-cost-usage-comment |
| SafetyCostReview | safety-cost-usage-comment |
| ChecklistSummary | safety-cost-usage-comment |
| Finding | safety-cost-usage-comment |
| ProjectParty | safety-cost-usage-comment |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 생성 | test_safety_cost_create_success |
| 필수키 | test_safety_cost_requires_project_round_owner |
| 발주처 검증 | test_safety_cost_owner_party_must_be_owner |
| 사용률 계산 | test_safety_cost_calculates_used_rate |
| 사용률 불일치 | test_safety_cost_rate_mismatch_warning |
| 사용금액 초과 | test_safety_cost_used_amount_exceeds_calculated_amount_warning |
| 확정 기준 | test_safety_cost_requires_basis_for_confirm |
| 증빙 업로드 | test_safety_cost_evidence_upload_link_file |
| 의견 생성 | test_safety_cost_generate_comment |
| 검토 | test_safety_cost_review_create_success |
| 확정 | test_safety_cost_confirm_success |
| 증빙 없는 확정 차단 | test_safety_cost_confirm_blocked_without_evidence |
| 보고서 동기화 | test_safety_cost_sync_to_report_updates_sections |
| 이력 생성 | test_safety_cost_history_created_on_amount_update |
| 발주처 매트릭스 | test_safety_cost_owner_matrix_returns_all_owners |
| export 경고 | test_safety_cost_report_export_missing_warning |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ownerPartyId |
| 점검회차/일정 | inspectionRoundId |
| 보고서 자동화 | safety_cost_usage section, project_summary, implementation_confirmation |
| 웹하드 | SafetyCostEvidence.fileId |
| 메일함 | 시공사 제출 메일 첨부파일 저장 |
| 결재/제출 | 보고서 export 전 확정 여부 검증 |
| 관리자/템플릿 | 적정성 표준문구, 증빙유형 관리 |
| 대시보드 | 증빙 누락, 미확정, 보고서 미반영 알림 |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 총 공사금액과 계상금액 혼동 | SafetyCostUsage.calculatedAmount 별도 모델 |
| 발주처별 값 혼동 | ownerPartyId 필수 |
| 입력 사용률 오류 | 시스템 계산값 우선 |
| 증빙파일 누락 | evidence_required 상태와 export warning |
| AI 적정성 단정 | 검토용 초안 badge와 사용자 확정 필요 |
| 보고서 반영 누락 | sync-to-report 상태 관리 |
| 금액 수정 이력 누락 | SafetyCostHistoryEvent 필수 |
| 파일과 회차 연결 누락 | SafetyCostEvidence에 inspectionRoundId 저장 |
