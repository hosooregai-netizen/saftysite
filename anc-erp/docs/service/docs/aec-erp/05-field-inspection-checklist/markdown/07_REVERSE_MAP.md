# 07. Reverse Map — 현장점검 체크리스트

## 1. Feature

```yaml
featureId: inspection.checklist.management
featureName: 현장점검 체크리스트
priority: P0
module: field-inspection-checklist
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 체크리스트 템플릿 목록 | `/projects/[projectId]/checklist-templates` | 프로젝트에서 사용 가능한 템플릿 조회 |
| 점검회차 체크리스트 | `/inspections/[inspectionRoundId]/checklist` | 점검회차별 체크리스트 입력 |
| 모바일 입력 | `/inspections/[inspectionRoundId]/checklist/mobile` | 현장 모바일 카드 입력 |
| 데스크톱 검토 | `/inspections/[inspectionRoundId]/checklist/review` | 입력 결과 검토 |
| 세션 상세 | `/checklist-sessions/[sessionId]` | 체크리스트 세션 상태 |
| 결과 목록 | `/checklist-sessions/[sessionId]/results` | 항목별 결과 |
| 지적사항 후보 | `/checklist-sessions/[sessionId]/finding-candidates` | 주의/불량 후보 검토 |
| 사진 목록 | `/checklist-sessions/[sessionId]/photos` | 결과별 사진 |
| 템플릿 관리자 | `/admin/checklist-templates` | 표준 점검표 관리 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| checklist | ChecklistSessionHeader, ChecklistCategoryTabs, ChecklistResultTable |
| mobile | ChecklistItemCard, ChecklistResultRadioGroup, MobileChecklistBottomBar |
| review | ChecklistResultMatrix, ChecklistMissingInputPanel, ChecklistReportMappingPanel |
| finding-candidates | ChecklistFindingCandidateTable, ChecklistFindingCandidateDrawer |
| photos | ChecklistPhotoUploader, ChecklistPhotoGrid |
| admin | ChecklistTemplateTable, ChecklistTemplateEditor, ChecklistItemEditor |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| ChecklistSessionHeader | GET `/api/v1/checklist-sessions/{sessionId}` |
| ChecklistCategoryTabs | GET `/api/v1/checklist-templates/{templateId}/items` |
| ChecklistResultTable | GET `/api/v1/checklist-sessions/{sessionId}/results` |
| ChecklistResultRadioGroup | PATCH `/api/v1/checklist-results/{resultId}` |
| ChecklistPhotoUploader | POST `/api/v1/checklist-results/{resultId}/photos/upload` |
| ChecklistFindingCandidateDrawer | POST `/api/v1/finding-candidates/{candidateId}/convert-to-finding` |
| ChecklistMissingInputPanel | POST `/api/v1/checklist-sessions/{sessionId}/results/validate` |
| ChecklistReportMappingPanel | GET `/api/v1/checklist-sessions/{sessionId}/report-mapping` |
| MobileChecklistBottomBar | POST `/api/v1/checklist-sessions/{sessionId}/mobile-drafts/{draftId}/commit` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET checklist-templates | ChecklistTemplate |
| GET checklist-template items | ChecklistCategory, ChecklistItem |
| POST checklist-sessions | ChecklistSession, ChecklistResult, RiskReductionChecklistItem |
| PATCH checklist-results | ChecklistResult, FindingCandidate |
| convert-to-finding | FindingCandidate, Finding |
| photos/upload | ChecklistPhoto, FileAsset |
| summarize | ChecklistReportMapping |
| sync-to-report | ChecklistReportMapping, DocumentInstance |
| mobile-drafts commit | ChecklistMobileDraft, ChecklistResult, ChecklistPhoto |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| ChecklistSession | checklist-summary-and-finding-candidate |
| ChecklistResult | checklist-summary-and-finding-candidate |
| RiskReductionChecklistItem | checklist-summary-and-finding-candidate |
| AdditionalHazardItem | checklist-summary-and-finding-candidate |
| ChecklistPhoto | checklist-summary-and-finding-candidate |
| FindingCandidate | checklist-summary-and-finding-candidate |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 템플릿 생성 | test_checklist_template_create_success |
| 세션 생성 | test_checklist_session_create_from_template |
| 결과 초기화 | test_checklist_session_initializes_results |
| 위험성 감소대책 초기화 | test_checklist_session_generates_risk_reduction_items |
| 주의 지적후보 | test_checklist_result_caution_creates_finding_candidate |
| 불량 지적후보 | test_checklist_result_bad_creates_finding_candidate |
| 잠금 수정 방지 | test_checklist_locked_session_prevents_update |
| 추가위험 등록 | test_additional_hazard_create_success |
| 사진 연결 | test_checklist_photo_upload_links_result |
| 보고서 매핑 | test_checklist_summary_generates_report_mapping |
| 모바일 임시저장 | test_checklist_mobile_draft_commit |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId |
| 점검회차/일정 | inspectionRoundId |
| 보고서 자동화 | ChecklistReportMapping, DocumentInstance |
| 지적사항/조치현황 | FindingCandidate → Finding |
| 사진대지 | ChecklistPhoto, EvidencePhoto |
| 웹하드 | 사진 파일 FileAsset |
| 메일함 | 지적사항 조치요청 메일 |
| 관리자/템플릿 | ChecklistTemplate, ChecklistItem |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 현장 입력과 보고서 표 불일치 | ChecklistItem.sourceSectionKey와 reportLabel 유지 |
| 주의/불량 지적사항 누락 | FindingCandidate 자동 생성 |
| 사진 누락 | caution/bad 사진누락 warning |
| 해당없음 남발 | 사유 입력 권장 및 검토 패널 표시 |
| 템플릿 변경으로 기존 세션 훼손 | session에 templateVersion snapshot 저장 |
| 모바일 오프라인 충돌 | mobile draft version 비교 |
| 보고서 생성 후 결과 변경 | reportMapping stale 상태 표시 |
