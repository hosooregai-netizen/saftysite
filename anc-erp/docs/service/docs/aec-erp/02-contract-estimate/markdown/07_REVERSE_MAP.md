# 07. Reverse Map — 계약/견적 관리

## 1. Feature

```yaml
featureId: contract.estimate.management
featureName: 계약/견적 관리
priority: P0
module: contract-estimate
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 계약 목록 | `/projects/[projectId]/contracts` | 프로젝트별 계약서 조회 |
| 계약 생성 | `/projects/[projectId]/contracts/new` | 신규 계약서 생성 |
| 계약 상세 | `/contracts/[contractId]` | 계약 요약 및 관련 업무 |
| 계약 수정 | `/contracts/[contractId]/edit` | 계약정보 수정 |
| 계약 미리보기 | `/contracts/[contractId]/preview` | A4 계약서 미리보기 |
| 지급조건 | `/contracts/[contractId]/payments` | 지급조건/분담금액 관리 |
| 계약 파일 | `/contracts/[contractId]/files` | 최종본/날인본 관리 |
| 계약 변경 | `/contracts/[contractId]/changes` | 변경 이력 관리 |
| 견적 목록 | `/projects/[projectId]/estimates` | 프로젝트별 견적서 조회 |
| 견적 생성 | `/projects/[projectId]/estimates/new` | 견적서 작성 |
| 견적 상세 | `/estimates/[estimateId]` | 견적서 상세/계약 전환 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/projects/[projectId]/contracts` | ContractTable, ContractStatusBadge, ContractAmountSummary |
| `/projects/[projectId]/contracts/new` | ContractForm, ContractPartySplitEditor, PaymentTermForm |
| `/contracts/[contractId]` | ContractSummaryCard, ContractTabs, ContractVersionHistory |
| `/contracts/[contractId]/edit` | ContractForm, ContractPartyTable, PaymentTermTable |
| `/contracts/[contractId]/preview` | ContractPreviewA4, MissingFieldPanel, AIDraftPanel |
| `/contracts/[contractId]/payments` | PaymentTermTable, PaymentSplitMatrix, PaymentStatusBadge |
| `/contracts/[contractId]/files` | SignedFileUploader, ContractFileList |
| `/contracts/[contractId]/changes` | ContractChangeTimeline, ContractChangeForm |
| `/projects/[projectId]/estimates` | EstimateTable, EstimateStatusBadge |
| `/projects/[projectId]/estimates/new` | EstimateForm, EstimateItemTable |
| `/estimates/[estimateId]` | EstimatePreviewA4, EstimateConvertButton |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| ContractTable | GET `/api/v1/projects/{projectId}/contracts` |
| ContractForm | POST `/api/v1/projects/{projectId}/contracts`, PATCH `/api/v1/contracts/{contractId}` |
| ContractPartySplitEditor | GET/POST `/api/v1/contracts/{contractId}/parties` |
| PaymentTermTable | GET `/api/v1/contracts/{contractId}/payment-terms` |
| PaymentTermForm | POST `/api/v1/contracts/{contractId}/payment-terms` |
| PaymentSplitMatrix | POST `/api/v1/contracts/{contractId}/payment-terms/calculate-split` |
| ContractPreviewA4 | POST `/api/v1/contracts/{contractId}/preview` |
| AIDraftPanel | POST `/api/v1/contracts/{contractId}/generate` |
| SignedFileUploader | POST `/api/v1/contracts/{contractId}/files/upload` |
| EstimateTable | GET `/api/v1/projects/{projectId}/estimates` |
| EstimateForm | POST `/api/v1/projects/{projectId}/estimates` |
| EstimateConvertButton | POST `/api/v1/estimates/{estimateId}/convert-to-contract` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET `/projects/{projectId}/contracts` | Contract |
| POST `/projects/{projectId}/contracts` | Contract |
| GET `/contracts/{contractId}` | Contract, ContractParty, PaymentTerm, ContractVersion |
| POST `/contracts/{contractId}/parties/apply-project-parties` | ProjectParty, ContractParty |
| POST `/contracts/{contractId}/payment-terms/calculate-split` | PaymentTerm, PaymentSplitItem |
| POST `/contracts/{contractId}/generate` | Contract, ContractVersion, PromptTemplate |
| POST `/contracts/{contractId}/export` | ContractVersion, FileAsset |
| POST `/contracts/{contractId}/mark-signed` | Contract, FileAsset, AuditLog |
| POST `/estimates/{estimateId}/convert-to-contract` | Estimate, Contract |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| Contract | contract-draft-generation |
| ContractParty | contract-draft-generation |
| PaymentTerm | contract-draft-generation |
| Estimate | contract-draft-generation |
| Project | contract-draft-generation |
| ProjectParty | contract-draft-generation |

## 7. 프롬프트 → 테스트

| 프롬프트 | 테스트 |
|---|---|
| contract-draft-generation | test_contract_generate_draft |
| contract-draft-generation | test_contract_multiple_clients_prompt_output |
| contract-draft-generation | test_contract_payment_split_prompt_output |
| contract-draft-generation | test_contract_missing_fields_are_separated |
| contract-draft-generation | test_contract_does_not_invent_legal_terms |

## 8. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 계약 생성 | test_contract_create_success |
| 계약금액 검증 | test_contract_amount_must_be_positive |
| 복수 발주처 | test_contract_multiple_clients_supported |
| ProjectParty 적용 | test_contract_apply_project_parties |
| 분담비율 계산 | test_contract_share_ratio_calculation |
| 지급조건 분할 | test_payment_term_split_by_ratio |
| 지급조건 합계 검증 | test_payment_term_split_sum_matches_amount |
| 계약서 초안 생성 | test_contract_generate_creates_version |
| 계약서 export | test_contract_export_uses_latest_version |
| 날인 상태 변경 | test_contract_mark_signed_requires_signed_file |
| 견적서 계약 전환 | test_estimate_create_and_convert_to_contract |
| 웹하드 저장 | test_contract_file_saved_to_webhard_contract_folder |
| 상태 변경 이력 | test_contract_status_change_creates_audit_log |

## 9. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ProjectParty |
| 점검회차/일정 | contractStartDate, contractEndDate, inspectionCount |
| 보고서 자동화 | serviceScope, deliverables, owner parties |
| 웹하드 | finalFileId, signedFileId, FileAsset |
| 메일함 | 계약서/견적서 발송 메일 |
| 결재/제출 | 계약 검토, 날인, 제출 이력 |
| 관리자/템플릿 | 계약서 템플릿, 일반조건 문구 |

## 10. 리스크

| 리스크 | 대응 |
|---|---|
| 발주처별 분담비율과 지급조건 금액 불일치 | PaymentSplitMatrix에서 즉시 검증 |
| 계약금액과 지급조건 합계 불일치 | ContractAmountSummary warning |
| 최종본/날인본 혼동 | finalFileId와 signedFileId 분리 |
| AI가 법률/일반조건 문구를 임의 생성 | templateText 기반 문구만 사용 |
| 복수 발주처 계약 누락 | ContractParty 다중 client 지원 |
| 점검횟수 누락으로 일정 생성 불가 | inspectionCount 필드 필수 권장 |
| 계약서 export 시 오래된 초안 사용 | latest ContractVersion 재조회 |
