# 07. Reverse Map — 지적사항/조치현황/사진대지

## 1. Feature

```yaml
featureId: finding.action.photo_ledger
featureName: 지적사항/조치현황/사진대지
priority: P0
module: finding-action-photo-ledger
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 프로젝트 지적사항 | `/projects/[projectId]/findings` | 프로젝트 전체 지적사항 |
| 점검회차 지적사항 | `/inspections/[inspectionRoundId]/findings` | 회차별 지적사항 |
| 지적사항 생성 | `/inspections/[inspectionRoundId]/findings/new` | 수동 지적사항 등록 |
| 지적사항 상세 | `/findings/[findingId]` | 지적/조치/사진/이력 |
| 지적사항 수정 | `/findings/[findingId]/edit` | 제목/상세/기한 수정 |
| 조치현황 | `/findings/[findingId]/actions` | 조치 등록/확인 |
| 사진 관리 | `/findings/[findingId]/photos` | 지적사진/조치사진 |
| 조치 확인 | `/findings/[findingId]/verify` | 확인/반려 |
| 사진대지 목록 | `/inspections/[inspectionRoundId]/photo-ledger` | 회차별 사진대지 |
| 사진대지 생성 | `/inspections/[inspectionRoundId]/photo-ledger/new` | 발주처별 사진대지 생성 |
| 사진대지 편집 | `/photo-ledgers/[photoLedgerId]/edit` | 매칭/캡션/순서 |
| 사진대지 미리보기 | `/photo-ledgers/[photoLedgerId]/preview` | A4 미리보기 |
| 사진대지 export | `/photo-ledgers/[photoLedgerId]/export` | PDF/HWPX 또는 보고서 동기화 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/projects/[projectId]/findings` | FindingTable, FindingStatusBadge, FindingRiskBadge |
| `/inspections/[inspectionRoundId]/findings` | FindingTable, OwnerPhotoLedgerFilter |
| `/findings/[findingId]` | FindingSourceLinkPanel, FindingTimeline, FindingPhotoGallery |
| `/findings/[findingId]/actions` | CorrectiveActionForm, CorrectiveActionTable, VerificationPanel |
| `/findings/[findingId]/photos` | PhotoUploader, PhotoGrid, PhotoMarkupEditor, PhotoCaptionEditor |
| `/inspections/[inspectionRoundId]/photo-ledger` | PhotoPairMatcher, PhotoLedgerEntryTable, PhotoLedgerA4Preview |
| `/photo-ledgers/[photoLedgerId]/edit` | PhotoLedgerEntryCard, PhotoCaptionEditor, MissingPhotoWarningPanel |
| `/photo-ledgers/[photoLedgerId]/preview` | PhotoLedgerA4Preview, PhotoLedgerExportChecklist |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| FindingTable | GET `/api/v1/inspection-rounds/{inspectionRoundId}/findings` |
| FindingForm | POST `/api/v1/inspection-rounds/{inspectionRoundId}/findings` |
| FindingStatusBadge | GET `/api/v1/findings/{findingId}` |
| CorrectiveActionForm | POST `/api/v1/findings/{findingId}/actions` |
| VerificationPanel | POST `/api/v1/corrective-actions/{actionId}/verify`, POST `/api/v1/corrective-actions/{actionId}/reject` |
| PhotoUploader | POST `/api/v1/findings/{findingId}/photos/upload` |
| PhotoMarkupEditor | POST `/api/v1/evidence-photos/{photoId}/markup` |
| PhotoCaptionEditor | POST `/api/v1/evidence-photos/{photoId}/set-caption` |
| PhotoPairMatcher | PATCH `/api/v1/photo-ledger-entries/{entryId}` |
| PhotoLedgerA4Preview | GET `/api/v1/photo-ledgers/{photoLedgerId}` |
| PhotoLedgerExportChecklist | POST `/api/v1/photo-ledgers/{photoLedgerId}/validate` |
| ActionRequestMailButton | POST `/api/v1/findings/action-request-mail/draft` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET `/findings` | Finding |
| POST `/findings` | Finding, FindingTimelineEvent |
| POST `/request-action` | Finding, MailDraft |
| POST `/actions` | CorrectiveAction, FindingTimelineEvent |
| POST `/verify` | CorrectiveAction, Finding |
| POST `/photos/upload` | EvidencePhoto, FileAsset |
| POST `/markup` | EvidencePhoto, PhotoMarkupInfo |
| POST `/photo-ledgers` | PhotoLedger |
| POST `/generate-entries` | PhotoLedgerEntry, Finding, CorrectiveAction, EvidencePhoto |
| POST `/validate` | PhotoLedgerWarning |
| POST `/sync-to-report` | PhotoLedger, DocumentInstance, SafetyReportVersion |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| Finding | finding-action-photo-ledger |
| CorrectiveAction | finding-action-photo-ledger |
| EvidencePhoto | finding-action-photo-ledger |
| PhotoLedgerEntry | finding-action-photo-ledger |
| PhotoLedger | finding-action-photo-ledger |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 지적사항 생성 | test_finding_create_success |
| 필수 연결키 | test_finding_requires_project_and_round |
| 발주처 검증 | test_finding_owner_party_must_be_owner |
| 체크리스트 후보 전환 | test_finding_from_checklist_candidate |
| 중복 방지 | test_finding_prevent_duplicate_source |
| 조치 요청 | test_finding_request_action_changes_status |
| 조치 제출 | test_corrective_action_submit_success |
| 조치 확인 | test_corrective_action_verify_success |
| 조치 반려 | test_corrective_action_reject_requires_reason |
| 종결 조건 | test_finding_close_requires_verified_action |
| 사진 연결 | test_evidence_photo_upload_link_finding |
| 사진 마크업 | test_evidence_photo_markup_saved |
| 사진대지 생성 | test_photo_ledger_create_success |
| 사진대지 항목 자동 생성 | test_photo_ledger_generate_entries_from_findings |
| 조치사진 누락 경고 | test_photo_ledger_warns_missing_action_photo |
| 미확인 조치 경고 | test_photo_ledger_warns_unverified_action |
| 발주처 필터 | test_photo_ledger_owner_filter |
| 순서 변경 | test_photo_ledger_reorder_entries |
| export | test_photo_ledger_export_uses_confirmed_entries |
| 보고서 동기화 | test_photo_ledger_sync_to_safety_report |
| 조치요청 메일 | test_action_request_mail_draft_includes_findings |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, ownerPartyId |
| 점검회차/일정 | inspectionRoundId |
| 현장점검 체크리스트 | FindingCandidate, ChecklistResult |
| 보고서 자동화 | photo_ledger section, needsImprovement |
| 산업안전보건관리비 | 총평의 문서관리/예산관리와 함께 표시 |
| 웹하드 | EvidencePhoto.fileId, exported PhotoLedger |
| 메일함 | 조치요청 메일, 시공사 회신 |
| 결재/제출 | 보고서 최종본 export 전 확인 |
| 관리자/템플릿 | 사진대지 레이아웃 템플릿 |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 지적사진과 조치사진 매칭 오류 | PhotoPairMatcher와 대표사진 선택 |
| 조치 미확인 상태가 완료로 표시 | verified 상태만 완료 표현 |
| 발주처별 사진대지 혼동 | ownerPartyId 필터 |
| 원본 사진 훼손 | markupInfo overlay 저장 |
| 사진대지 export 전 사진 누락 | validate endpoint와 warning |
| 기존 보고서와 사진대지 불일치 | sync-to-report 후 DocumentVersion 생성 |
| 중복 지적사항 | sourceType + sourceId 중복 검증 |
| 메일 조치요청 누락 | ActionRequestMailDraft 생성 |
