# 07. Reverse Map — 안전관리계획서 자동화

## 1. Feature

```yaml
featureId: safety_management_plan.automation
featureName: 안전관리계획서 자동화
priority: P1
module: safety-management-plan
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 계획서 목록 | `/projects/[projectId]/safety-management-plans` | 프로젝트별 안전관리계획서 조회 |
| 계획서 생성 | `/projects/[projectId]/safety-management-plans/new` | 템플릿/자료 선택 후 초안 생성 |
| 계획서 상세 | `/safety-management-plans/[planId]` | 계획서 요약 및 상태 |
| 계획서 편집 | `/safety-management-plans/[planId]/edit` | 섹션별 편집 |
| 미리보기 | `/safety-management-plans/[planId]/preview` | A4 미리보기 |
| 섹션 관리 | `/safety-management-plans/[planId]/sections` | 섹션별 상태/재생성 |
| 위험요인 | `/safety-management-plans/[planId]/risks` | 공종별 위험요인/감소대책 |
| 조직 | `/safety-management-plans/[planId]/organization` | 안전관리조직도/책임 |
| 교육 | `/safety-management-plans/[planId]/education` | 안전교육 계획 |
| 비상대응 | `/safety-management-plans/[planId]/emergency` | 비상연락망/사고대응 |
| 첨부자료 | `/safety-management-plans/[planId]/attachments` | 웹하드 파일 연결 |
| Export | `/safety-management-plans/[planId]/export` | 최종본 생성 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| 목록 | SafetyManagementPlanTable, PlanStatusBadge, PlanFilterBar |
| 생성 | SafetyManagementPlanWizard, PlanTemplateSelector, PlanRequiredDataPanel |
| 상세 | PlanSummaryCard, PlanVersionHistory, StaleSourceWarningPanel |
| 편집 | PlanSectionNavigator, PlanSectionEditor, PlanA4Preview |
| 위험요인 | WorkTypeTable, RiskRegisterTable, RiskItemForm, RiskMatrixBadge |
| 조직 | SafetyOrganizationEditor, ContactPicker, OrganizationRoleTable |
| 교육 | EducationPlanTable, EducationPlanForm |
| 비상대응 | EmergencyContactTable, EmergencyProcedureEditor |
| 첨부자료 | AttachmentLinkPanel, WebhardFilePicker |
| Export | PlanExportChecklist, WebhardSaveLocation, ExportFormatSelector |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| SafetyManagementPlanTable | GET `/api/v1/projects/{projectId}/safety-management-plans` |
| SafetyManagementPlanWizard | POST `/api/v1/projects/{projectId}/safety-management-plans` |
| PlanSectionEditor | POST `/api/v1/safety-management-plans/{planId}/save-section` |
| SectionRegenerateButton | POST `/api/v1/safety-management-plans/{planId}/sections/{sectionKey}/regenerate` |
| RiskRegisterTable | GET `/api/v1/safety-management-plans/{planId}/risks` |
| RiskItemForm | POST/PATCH `/api/v1/safety-management-risks/{riskItemId}` |
| GenerateRisksButton | POST `/api/v1/safety-management-plans/{planId}/risks/generate-from-work-types` |
| ImportChecklistButton | POST `/api/v1/safety-management-plans/{planId}/risks/import-from-checklist` |
| SafetyOrganizationEditor | GET/PATCH `/api/v1/safety-management-plans/{planId}/organization` |
| EducationPlanTable | GET/PATCH `/api/v1/safety-management-plans/{planId}/education` |
| EmergencyContactTable | GET/PATCH `/api/v1/safety-management-plans/{planId}/emergency` |
| AttachmentLinkPanel | POST `/api/v1/safety-management-plans/{planId}/attachments/link` |
| PlanExportChecklist | POST `/api/v1/safety-management-plans/{planId}/validate` |
| ExportButton | POST `/api/v1/safety-management-plans/{planId}/export` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| POST `/safety-management-plans` | SafetyManagementPlan, SafetyManagementProjectSnapshot |
| POST `/generate` | SafetyManagementPlanSection, SafetyManagementRiskItem |
| POST `/save-section` | SafetyManagementPlanSection, SafetyManagementPlanVersion |
| POST `/risks/generate-from-work-types` | SafetyManagementWorkType, SafetyManagementRiskItem |
| POST `/risks/import-from-checklist` | ChecklistResult, Finding, SafetyManagementRiskItem |
| PATCH `/organization` | SafetyOrganizationPlan, Contact |
| PATCH `/education` | SafetyEducationPlan |
| PATCH `/emergency` | SafetyEmergencyPlan |
| POST `/attachments/link` | SafetyManagementPlanAttachment, FileAsset |
| POST `/export` | SafetyManagementPlan, FileAsset, AuditLog |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| SafetyManagementPlan | safety-management-plan-generation |
| SafetyManagementPlanSection | safety-management-plan-generation |
| SafetyManagementWorkType | safety-management-plan-generation |
| SafetyManagementRiskItem | safety-management-plan-generation |
| SafetyOrganizationPlan | safety-management-plan-generation |
| SafetyEducationPlan | safety-management-plan-generation |
| SafetyEmergencyPlan | safety-management-plan-generation |
| Project | safety-management-plan-generation |
| Contract | safety-management-plan-generation |
| ProjectParty | safety-management-plan-generation |
| Contact | safety-management-plan-generation |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 계획서 생성 | test_safety_management_plan_create_success |
| 필수 연결 검증 | test_safety_management_plan_requires_project_and_template |
| 중복 방지 | test_safety_management_plan_prevents_duplicate_active_without_revision |
| 프로젝트 snapshot | test_safety_management_plan_loads_project_snapshot |
| 공종 생성 | test_safety_management_plan_work_type_create_success |
| 위험요인 검증 | test_safety_management_plan_risk_item_requires_hazard_and_measure |
| 위험요인 후보 생성 | test_safety_management_plan_generate_risks_from_work_types |
| 체크리스트 import | test_safety_management_plan_import_risks_from_checklist |
| 누락정보 | test_safety_management_plan_missing_required_fields |
| AI 섹션 재생성 | test_safety_management_plan_section_regenerate_ai_draft |
| export 차단 | test_safety_management_plan_export_blocked_when_required_missing |
| 최신 저장본 export | test_safety_management_plan_export_uses_latest_saved_snapshot |
| 웹하드 저장 | test_safety_management_plan_export_creates_file_asset |
| 원본 변경 감지 | test_safety_management_plan_refresh_linked_data_sets_stale |
| 버전 생성 | test_safety_management_plan_version_created_on_save |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ProjectParty, Contact |
| 계약/견적 | contractId, 공사기간, 용역범위 |
| 점검회차/일정 | inspectionRoundId optional revision link |
| 현장점검 체크리스트 | 위험요인/점검계획 기준, Risk import/export |
| 지적사항/사진대지 | 추가 유해위험요인과 보완대책 연결 |
| 안전보건대장 | RiskRegister와 감소대책을 장기 대장으로 이관 |
| 웹하드 | 첨부자료, export 파일 FileAsset |
| 메일함 | 안전관리계획서 제출 메일 |
| 결재/제출 | 검토, 확정, 제출 이력 |
| 관리자/템플릿 | DocumentTemplate, standard legal text, PromptTemplate |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 안전관리계획서 원본 템플릿 부재 | 템플릿 버전 구조를 먼저 만들고, 세부 목차는 템플릿 수령 후 조정 |
| AI가 법령 문구 생성 | templateSections 문구만 사용 |
| 현장 특수성 없는 일반문구 남발 | `현장 확인 필요`와 missingFields로 분리 |
| 계획서 위험요인과 체크리스트 불일치 | RiskRegister ↔ ChecklistTemplate mapping |
| 프로젝트 원장 변경 후 계획서 stale | refresh-linked-data와 stale warning |
| export 시 이전 snapshot 사용 | save-before-export 테스트 필수 |
| 첨부자료 누락 | required attachment validation |
