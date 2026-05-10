# 07. Reverse Map — 프로젝트/현장 원장 관리

## 1. Feature

```yaml
featureId: project.field.registry
featureName: 프로젝트/현장 원장 관리
priority: P0
module: project-field
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 프로젝트 목록 | `/projects` | 전체 프로젝트 조회/검색/필터 |
| 프로젝트 생성 | `/projects/new` | 프로젝트 기본정보 등록 |
| 프로젝트 상세 | `/projects/[projectId]` | 프로젝트 요약 및 관련 업무 진입 |
| 개요 탭 | `/projects/[projectId]/overview` | 공사개요, 금액, 공정율 |
| 관계자 탭 | `/projects/[projectId]/parties` | 발주처, 시공사, 엔지니어링사 |
| 연락처 탭 | `/projects/[projectId]/contacts` | 담당자 연락처 |
| 누락정보 탭 | `/projects/[projectId]/requirements` | 문서/계약/점검/메일 필수정보 |
| 관련업무 탭 | `/projects/[projectId]/related` | 계약, 점검, 문서, 파일, 메일 카운트 |
| 이력 탭 | `/projects/[projectId]/history` | 변경 이력 |
| 설정 | `/projects/[projectId]/settings` | 보관, 권한, 알림, 폴더 정책 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/projects` | ProjectTable, ProjectFilterBar, ProjectStatusBadge |
| `/projects/new` | ProjectForm, ProjectPartyForm, ContactForm, ProjectRequiredFieldPanel |
| `/projects/[projectId]` | ProjectSummaryCard, RelatedWorkTabs, MissingFieldPanel |
| `/projects/[projectId]/overview` | ConstructionAmountCard, InspectionSummaryCard |
| `/projects/[projectId]/parties` | ProjectPartyTable, OwnerPartyCard, ContractorPartyCard, EngineerPartyCard |
| `/projects/[projectId]/contacts` | ContactTable, ContactCard, ContactForm |
| `/projects/[projectId]/requirements` | ProjectRequiredFieldPanel, ProjectImpactWarningPanel |
| `/projects/[projectId]/related` | RelatedWorkTabs, RelatedCountCards |
| `/projects/[projectId]/history` | ProjectActivityTimeline |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| ProjectTable | `GET /api/v1/projects` |
| ProjectForm | `POST /api/v1/projects`, `PATCH /api/v1/projects/{projectId}` |
| ProjectSummaryCard | `GET /api/v1/projects/{projectId}/summary` |
| ProjectPartyTable | `GET /api/v1/projects/{projectId}/parties` |
| ProjectPartyForm | `POST /api/v1/projects/{projectId}/parties` |
| OwnerPartyCard | `GET /api/v1/projects/{projectId}/parties` |
| ContactTable | `GET /api/v1/projects/{projectId}/contacts` |
| ContactForm | `POST /api/v1/projects/{projectId}/contacts` |
| ProjectRequiredFieldPanel | `GET /api/v1/projects/{projectId}/requirements` |
| RelatedWorkTabs | `GET /api/v1/projects/{projectId}/related-counts` |
| ProjectActivityTimeline | `GET /api/v1/projects/{projectId}/history` |
| ProjectExtractionPreview | `POST /api/v1/projects/extract-from-document` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| `GET /projects` | Project |
| `POST /projects` | Project, ProjectActivityLog |
| `GET /projects/{projectId}` | Project, ProjectParty, Contact |
| `GET /projects/{projectId}/summary` | Project, ProjectParty, RelatedCounts |
| `GET /projects/{projectId}/requirements` | ProjectRequirementStatus |
| `GET /projects/{projectId}/parties` | ProjectParty, Organization |
| `POST /projects/{projectId}/parties` | ProjectParty, Organization, ProjectActivityLog |
| `GET /projects/{projectId}/contacts` | Contact, Organization |
| `POST /projects/{projectId}/contacts` | Contact, ProjectActivityLog |
| `POST /projects/extract-from-document` | ProjectExtractionResult |
| `POST /projects/{projectId}/apply-extracted-info` | Project, Organization, ProjectParty, Contact |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| Project | `project-info-extraction` |
| Organization | `project-info-extraction` |
| ProjectParty | `project-info-extraction` |
| Contact | `project-info-extraction` |
| ProjectRequirementStatus | `project-info-extraction` |

## 7. 프롬프트 → 테스트

| 프롬프트 | 테스트 |
|---|---|
| `project-info-extraction` | `test_extract_project_from_contract` |
| `project-info-extraction` | `test_extract_multiple_owners` |
| `project-info-extraction` | `test_extract_contacts` |
| `project-info-extraction` | `test_missing_unknown_fields_are_null` |
| `project-info-extraction` | `test_extraction_preview_does_not_persist` |

## 8. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 프로젝트 생성 | `test_project_create_success` |
| 프로젝트명 필수 | `test_project_requires_project_name` |
| 프로젝트 수정 | `test_project_update_success` |
| 공정율 검증 | `test_project_progress_rate_range` |
| 날짜 범위 검증 | `test_project_date_range_validation` |
| 총 점검회차 검증 | `test_project_total_inspection_rounds_non_negative` |
| 삭제 제한 | `test_project_soft_archive_when_related_documents_exist` |
| 복수 발주처 | `test_project_party_multiple_owners` |
| 발주처별 보고서 | `test_project_party_owner_requires_separate_report` |
| 분담비율 경고 | `test_project_party_share_ratio_warning` |
| 분담금액 경고 | `test_project_party_share_amount_warning` |
| 담당자 등록 | `test_contact_create_success` |
| 보고서 수신 이메일 | `test_contact_report_recipient_requires_email_warning` |
| 누락정보 | `test_project_requirements_for_safety_report` |
| 관련 카운트 | `test_project_related_counts` |
| 변경 이력 | `test_project_activity_log_created_on_update` |
| 추출 preview | `test_project_extraction_preview_does_not_apply_without_confirmation` |
| 추출 반영 | `test_project_apply_extracted_info_creates_parties_and_contacts` |

## 9. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 계약/견적 | `projectId`, `ProjectParty`, `Contact` |
| 점검회차/일정 | `inspectionCycleText`, `totalInspectionRounds`, `startDate`, `endDate` |
| 보고서 자동화 | `projectId`, `ownerPartyId`, `requiresSeparateReport` |
| 체크리스트 | `projectId`, `inspectionRoundId` |
| 지적사항/조치현황 | `projectId`, `ownerPartyId` |
| 사진대지 | `projectId`, `inspectionRoundId`, `ownerPartyId` |
| 산업안전보건관리비 | `projectId`, `ownerPartyId` |
| 웹하드 | project folder event, `FileAsset.projectId` |
| 메일함 | `Contact.email`, `MailThread.projectId` |
| 결재/제출 | `Submission.projectId`, `ownerPartyId` |

## 10. 리스크

| 리스크 | 대응 |
|---|---|
| 발주처/시공사/엔지니어링사 구분 오류 | Organization type과 ProjectParty role을 분리 |
| 발주처별 보고서 분기 누락 | `requiresSeparateReport` 필드 필수 |
| 총 공사금액과 발주처별 금액 혼동 | `Project.totalAmount`와 `ProjectParty.shareAmount` 분리 |
| 문서 생성 필수값 누락 | `ProjectRequiredFieldPanel` 제공 |
| 프로젝트명 변경 시 웹하드 폴더명 불일치 | 폴더 displayName과 projectId 분리 |
| AI 추출 결과 오적용 | preview → 사용자 확인 → apply 단계 분리 |
| 하위 문서 생성 후 프로젝트 변경 | impact warning + ActivityLog |
