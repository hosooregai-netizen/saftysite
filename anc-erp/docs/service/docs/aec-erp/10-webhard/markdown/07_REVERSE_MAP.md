# 07. Reverse Map — 웹하드

## 1. Feature

```yaml
featureId: webhard.file_management
featureName: 웹하드
priority: P0.5
module: webhard
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 웹하드 홈 | `/webhard` | 최근 파일, 프로젝트 폴더, 공유 파일 |
| 프로젝트 웹하드 | `/webhard/projects/[projectId]` | 프로젝트 폴더 트리와 파일 관리 |
| 폴더 상세 | `/webhard/projects/[projectId]/folders/[folderId]` | 특정 폴더 파일 목록 |
| 최근 파일 | `/webhard/recent` | 최근 업로드/수정 파일 |
| 공유 파일 | `/webhard/shared` | 공유 링크가 있는 파일 |
| 휴지통 | `/webhard/trash` | 삭제 파일 복구/영구삭제 |
| 검색 | `/webhard/search` | 파일 검색 |
| 파일 상세 | `/files/[fileId]` | 파일 미리보기/상세/연결 |
| 파일 버전 | `/files/[fileId]/versions` | 버전 목록/복원 |
| 파일 활동 | `/files/[fileId]/activity` | 활동 이력 |
| 공개 공유 링크 | `/share/[token]` | 외부 공유 보기 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/webhard` | WebhardShell, WebhardLeftRail, StorageUsageCard |
| `/webhard/projects/[projectId]` | ProjectFolderTree, FileList, FileGrid, FileDetailPanel |
| `/webhard/projects/[projectId]/folders/[folderId]` | FolderBreadcrumb, FileList, UploadDropzone |
| `/files/[fileId]` | FilePreviewPanel, FileDetailPanel, FileTagEditor, FileLinkTargetPanel |
| `/files/[fileId]/versions` | FileVersionPanel |
| `/files/[fileId]/activity` | FileActivityTimeline |
| `/webhard/shared` | ShareLinkList, ShareLinkModal |
| `/webhard/trash` | TrashTable |
| `/share/[token]` | PublicShareView |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| ProjectFolderTree | GET `/api/v1/projects/{projectId}/folder-tree` |
| WebhardCommandBar | POST `/api/v1/files/upload`, POST `/api/v1/folders` |
| FileList | GET `/api/v1/files` |
| FileGrid | GET `/api/v1/files` |
| FileDetailPanel | GET `/api/v1/files/{fileId}` |
| FilePreviewPanel | GET `/api/v1/files/{fileId}/preview` |
| FileTagEditor | PATCH `/api/v1/files/{fileId}` |
| FileLinkTargetPanel | GET/POST `/api/v1/files/{fileId}/links` |
| FileVersionPanel | GET/POST `/api/v1/files/{fileId}/versions` |
| UploadDropzone | POST `/api/v1/files/upload` |
| FileClassificationSuggestionPanel | POST `/api/v1/files/{fileId}/classify` |
| ShareLinkModal | POST `/api/v1/share-links` |
| ShareLinkList | GET `/api/v1/share-links`, POST `/api/v1/share-links/{id}/revoke` |
| PublicShareView | GET `/api/v1/public/share/{token}` |
| TrashTable | POST `/api/v1/files/{fileId}/restore` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| POST `/projects/{projectId}/folders/bootstrap` | Folder, FileActivity |
| GET `/projects/{projectId}/folder-tree` | Folder |
| POST `/files/upload` | FileAsset, FileVersion, FileActivity |
| GET `/files/{fileId}` | FileAsset, FileVersion, FileEntityLink, ShareLink |
| POST `/files/{fileId}/versions` | FileVersion, FileActivity |
| POST `/files/{fileId}/links` | FileEntityLink, FileActivity |
| POST `/files/{fileId}/classify` | FileClassificationSuggestion |
| POST `/share-links` | ShareLink, FileActivity |
| GET `/public/share/{token}` | ShareLink, ShareLinkAccessLog |
| POST `/mail/messages/{messageId}/attachments/save-to-webhard` | FileAsset, FileEntityLink, MailMessage |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| FileAsset | webhard-file-classification |
| Folder | webhard-file-classification |
| FileEntityLink | webhard-file-classification |
| MailMessage | webhard-file-classification |
| DocumentInstance | webhard-file-classification |
| InspectionRound | webhard-file-classification |
| Finding | webhard-file-classification |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| 기본 폴더 생성 | test_project_folder_bootstrap_creates_default_tree |
| 시스템 폴더 삭제 제한 | test_folder_system_folder_delete_blocked |
| 파일 업로드 | test_file_upload_creates_asset_and_version |
| 활동 이력 | test_file_upload_records_activity |
| 계약서 분류 | test_file_classification_contract_folder |
| 현장사진 분류 | test_file_classification_site_photo_folder |
| 문서 export 저장 | test_generated_document_saved_to_final_folder |
| 메일첨부 저장 | test_mail_attachment_save_links_mail_message |
| 버전 추가 | test_file_version_add_success |
| 파일 이동 | test_file_move_updates_folder |
| 잠금 삭제 제한 | test_locked_file_cannot_be_deleted |
| 최종본 삭제 제한 | test_final_report_delete_blocked |
| 공유 링크 생성 | test_share_link_create_success |
| 공유 링크 폐기 | test_share_link_revoke_blocks_access |
| 공유 링크 만료 | test_share_link_expired_blocks_access |
| 접근 로그 | test_share_link_access_log_created |
| 문서 연결 | test_file_entity_link_document_instance |
| 검색 | test_webhard_search_by_tag_and_project |
| 휴지통 복구 | test_trash_restore_file |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, 기본 폴더 생성 |
| 계약/견적 | 계약서/견적서/날인본 FileAsset |
| 점검회차/일정 | 회차별 폴더, 공사일정 첨부 |
| 현장점검 체크리스트 | 체크리스트 사진/첨부 |
| 지적사항/사진대지 | 지적사진, 조치사진, 마크업 원본 |
| 산업안전보건관리비 | 사용내역서, 증빙파일 |
| 안전관리계획서 | 계획서 초안/최종본/첨부 |
| 안전보건대장 | 대장 최종본/첨부/개정본 |
| 이행확인 보고서 | 발주처별 최종본/제출본 |
| 메일함 | 첨부파일 저장, 발송 첨부 선택 |
| 결재/제출 | 최종본, 날인본, 제출 파일 |
| 관리자/템플릿 | 폴더 정책, 파일 태그 정책 |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 프로젝트명 변경으로 폴더 경로 깨짐 | 내부 연결은 projectId/folderId 유지 |
| 최종본/초안 혼동 | versionKind, tags, locked status 분리 |
| 메일 첨부 저장 후 원본 메일 추적 불가 | FileEntityLink(mail_message) 필수 |
| 보고서 export 파일이 웹하드에 누락 | export service에서 FileAsset 생성 필수 |
| 공유 링크 무기한 노출 | 만료일/폐기/접근 로그 제공 |
| 사진 원본 훼손 | 원본 FileAsset과 markupInfo 분리 |
| 시스템 폴더 삭제 | isSystem folder 삭제 제한 |
| 권한 없는 외부 접근 | token hash, expiry, permission 검증 |
