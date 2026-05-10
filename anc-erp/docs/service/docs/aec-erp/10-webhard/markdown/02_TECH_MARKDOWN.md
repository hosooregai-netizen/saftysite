# 02. Tech Markdown — 웹하드

## 1. Frontend Routes

```text
/webhard
/webhard/projects/[projectId]
/webhard/projects/[projectId]/folders/[folderId]
/webhard/recent
/webhard/shared
/webhard/trash
/webhard/search
/files/[fileId]
/files/[fileId]/versions
/files/[fileId]/activity
/share/[token]
```

## 2. Frontend Components

```text
WebhardShell
WebhardCommandBar
WebhardLeftRail
ProjectFolderTree
FolderBreadcrumb
FileList
FileGrid
FileRow
FileCard
FilePreviewPanel
FileDetailPanel
FileTagEditor
FileLinkTargetPanel
FileVersionPanel
FileActivityTimeline
UploadDropzone
UploadQueue
NewFolderModal
RenameModal
MoveCopyModal
ShareLinkModal
ShareLinkList
PublicShareView
TrashTable
StorageUsageCard
FileClassificationSuggestionPanel
MailAttachmentSavePanel
```

## 3. Backend APIs

### Folders

```text
GET    /api/v1/folders
POST   /api/v1/folders
GET    /api/v1/folders/{folderId}
PATCH  /api/v1/folders/{folderId}
DELETE /api/v1/folders/{folderId}
POST   /api/v1/projects/{projectId}/folders/bootstrap
POST   /api/v1/folders/{folderId}/move
GET    /api/v1/projects/{projectId}/folder-tree
```

### Files

```text
GET    /api/v1/files
POST   /api/v1/files/upload
GET    /api/v1/files/{fileId}
PATCH  /api/v1/files/{fileId}
DELETE /api/v1/files/{fileId}
POST   /api/v1/files/{fileId}/restore
POST   /api/v1/files/{fileId}/archive
POST   /api/v1/files/{fileId}/lock
POST   /api/v1/files/{fileId}/unlock
POST   /api/v1/files/{fileId}/move
POST   /api/v1/files/{fileId}/copy
GET    /api/v1/files/{fileId}/download
GET    /api/v1/files/{fileId}/preview
POST   /api/v1/files/bulk-action
```

### Versions

```text
GET  /api/v1/files/{fileId}/versions
POST /api/v1/files/{fileId}/versions
GET  /api/v1/file-versions/{versionId}/download
POST /api/v1/file-versions/{versionId}/restore-as-current
```

### Share Links

```text
GET    /api/v1/share-links
POST   /api/v1/share-links
GET    /api/v1/share-links/{shareLinkId}
PATCH  /api/v1/share-links/{shareLinkId}
DELETE /api/v1/share-links/{shareLinkId}
POST   /api/v1/share-links/{shareLinkId}/revoke
GET    /api/v1/public/share/{token}
GET    /api/v1/public/share/{token}/download
```

### Linking

```text
GET  /api/v1/files/{fileId}/links
POST /api/v1/files/{fileId}/links
DELETE /api/v1/files/{fileId}/links/{linkId}
POST /api/v1/files/{fileId}/classify
POST /api/v1/files/{fileId}/apply-classification
```

### Mail Attachment Save

```text
POST /api/v1/mail/messages/{messageId}/attachments/save-to-webhard
GET  /api/v1/mail/messages/{messageId}/attachments/save-suggestions
```

### Activities and Search

```text
GET /api/v1/files/{fileId}/activities
GET /api/v1/webhard/activities
GET /api/v1/webhard/search
GET /api/v1/webhard/storage-usage
```

## 4. Data Models

### Folder

```ts
type FolderType =
  | 'project_root'
  | 'contract'
  | 'owner_material'
  | 'contractor_material'
  | 'schedule'
  | 'inspection'
  | 'site_photo'
  | 'draft_report'
  | 'review_report'
  | 'final_report'
  | 'mail_attachment'
  | 'trash'
  | 'custom'

type Folder = {
  id: string
  projectId?: string
  parentFolderId?: string
  name: string
  type: FolderType
  path: string
  displayOrder: number
  isSystem: boolean
  isArchived: boolean
  createdBy?: string
  createdAt: string
  updatedAt: string
}
```

### FileAsset

```ts
type FileAssetStatus =
  | 'active'
  | 'archived'
  | 'deleted'
  | 'locked'
  | 'processing'
  | 'failed'

type FileSource =
  | 'upload'
  | 'mail_attachment'
  | 'generated_document'
  | 'photo_capture'
  | 'external_link'
  | 'system'

type FileAsset = {
  id: string
  projectId?: string
  folderId: string
  ownerPartyId?: string
  inspectionRoundId?: string
  fileName: string
  originalFileName: string
  extension: string
  mimeType: string
  sizeBytes: number
  storageKey: string
  checksum?: string
  source: FileSource
  status: FileAssetStatus
  tags: string[]
  linkedEntityType?: string
  linkedEntityId?: string
  currentVersionId?: string
  previewStatus: 'none' | 'processing' | 'ready' | 'failed'
  uploadedBy?: string
  createdAt: string
  updatedAt: string
}
```

### FileVersion

```ts
type FileVersionKind =
  | 'original'
  | 'working'
  | 'review'
  | 'final'
  | 'signed'
  | 'submitted'
  | 'archived'

type FileVersion = {
  id: string
  fileId: string
  versionNo: number
  versionKind: FileVersionKind
  fileName: string
  storageKey: string
  sizeBytes: number
  checksum?: string
  changeSummary?: string
  createdBy?: string
  createdAt: string
}
```

### FileEntityLink

```ts
type FileEntityLink = {
  id: string
  fileId: string
  projectId?: string
  entityType:
    | 'project'
    | 'contract'
    | 'inspection_round'
    | 'checklist_session'
    | 'finding'
    | 'corrective_action'
    | 'evidence_photo'
    | 'document_instance'
    | 'safety_cost_usage'
    | 'mail_message'
    | 'submission'
    | 'approval'
  entityId: string
  relationType:
    | 'source'
    | 'attachment'
    | 'exported_file'
    | 'evidence'
    | 'photo'
    | 'final_output'
    | 'signed_copy'
  createdAt: string
}
```

### ShareLink

```ts
type ShareLinkPermission = 'view' | 'download' | 'view_and_download'

type ShareLink = {
  id: string
  fileId?: string
  folderId?: string
  projectId?: string
  tokenHash: string
  title?: string
  permission: ShareLinkPermission
  expiresAt?: string
  passwordHash?: string
  isRevoked: boolean
  createdBy?: string
  createdAt: string
  revokedAt?: string
}
```

### ShareLinkAccessLog

```ts
type ShareLinkAccessLog = {
  id: string
  shareLinkId: string
  accessedAt: string
  ipHash?: string
  userAgent?: string
  action: 'view' | 'download' | 'denied' | 'expired'
}
```

### FileActivity

```ts
type FileActivity = {
  id: string
  fileId?: string
  folderId?: string
  projectId?: string
  activityType:
    | 'uploaded'
    | 'downloaded'
    | 'previewed'
    | 'renamed'
    | 'moved'
    | 'copied'
    | 'tagged'
    | 'linked'
    | 'unlinked'
    | 'version_added'
    | 'shared'
    | 'share_revoked'
    | 'archived'
    | 'deleted'
    | 'restored'
    | 'locked'
  actorId?: string
  message: string
  metadata?: Record<string, unknown>
  createdAt: string
}
```

### FileClassificationSuggestion

```ts
type FileClassificationSuggestion = {
  fileId?: string
  fileName: string
  recommendedProjectId?: string
  recommendedFolderId?: string
  recommendedTags: string[]
  linkedEntityType?: string
  linkedEntityId?: string
  confidence: number
  reasons: string[]
  needsUserConfirmation: boolean
}
```

## 5. Validation Rules

### Folder

- system folder는 일반 사용자가 삭제할 수 없다.
- project folder는 projectId를 가져야 한다.
- 같은 parentFolderId 안에서 folder name 중복은 경고한다.
- 프로젝트명 변경은 folder path display만 갱신하고 내부 연결키는 projectId를 유지한다.

### FileAsset

- folderId는 필수다.
- fileName은 필수다.
- sizeBytes는 0보다 커야 한다.
- locked 파일은 삭제/이동/이름변경을 제한한다.
- final_report, submitted, signed 태그가 있는 파일은 삭제 제한 대상이다.
- generated_document는 linkedEntityType=document_instance를 권장한다.
- mail_attachment는 linkedEntityType=mail_message를 권장한다.
- finding_photo/action_photo는 inspectionRoundId와 findingId 연결을 권장한다.

### ShareLink

- fileId 또는 folderId 중 하나는 필수다.
- expiresAt이 과거이면 접근할 수 없다.
- isRevoked=true이면 접근할 수 없다.
- 공개 링크 다운로드는 permission에 따라 제한한다.
- 접근 시 ShareLinkAccessLog를 기록한다.

## 6. Service Rules

### Project Folder Bootstrap

```text
1. Project 조회
2. project_root Folder 생성
3. 표준 하위 폴더 생성
4. 기존 InspectionRound가 있으면 04_현장점검/제N회 폴더 생성
5. AuditLog 기록
```

### Upload Flow

```text
1. upload request 수신
2. folder/project 권한 확인
3. storage adapter에 파일 저장
4. FileAsset 생성
5. FileVersion v1 생성
6. classification suggestion 생성
7. linkedEntity가 있으면 FileEntityLink 생성
8. FileActivity 기록
9. preview job 생성 optional
```

### Generated Document Save

```text
1. Document export service에서 file stream 수신
2. documentType/status 기준 target folder 결정
3. FileAsset source=generated_document 생성
4. FileEntityLink(document_instance, exported_file) 생성
5. DocumentInstance.exportedFileId 업데이트
6. FileActivity 기록
```

### Mail Attachment Save

```text
1. MailMessage와 attachment 확인
2. project/folder suggestion 생성
3. 사용자 확인
4. storage adapter에 저장
5. FileAsset source=mail_attachment 생성
6. FileEntityLink(mail_message, attachment) 생성
7. MailMessage.savedAttachmentIds 업데이트
8. FileActivity 기록
```

### Share Link Create

```text
1. file/folder 권한 확인
2. random token 생성
3. token hash 저장
4. ShareLink 생성
5. FileActivity shared 기록
6. 사용자에게 public URL 반환
```

## 7. Folder Policy

| Source | Target Folder |
|---|---|
| contract final/signed | 00_계약_견적 |
| owner material | 01_발주처_제공자료 |
| contractor material | 02_시공사_제출자료 |
| schedule attachment | 03_공사개요_공정표 |
| inspection material | 04_현장점검/제N회 |
| site photo original | 05_현장사진/원본 |
| finding photo | 05_현장사진/지적사항 |
| action photo | 05_현장사진/조치현황 |
| draft report | 06_보고서_초안 |
| review report | 07_검토본 |
| final/submitted report | 08_최종본 |
| mail attachment | 09_메일첨부 |
| unknown | 99_기타 |

## 8. Tests

```text
test_project_folder_bootstrap_creates_default_tree
test_folder_system_folder_delete_blocked
test_file_upload_creates_asset_and_version
test_file_upload_records_activity
test_file_classification_contract_folder
test_file_classification_site_photo_folder
test_generated_document_saved_to_final_folder
test_mail_attachment_save_links_mail_message
test_file_version_add_success
test_file_move_updates_folder
test_locked_file_cannot_be_deleted
test_final_report_delete_blocked
test_share_link_create_success
test_share_link_revoke_blocks_access
test_share_link_expired_blocks_access
test_share_link_access_log_created
test_file_entity_link_document_instance
test_webhard_search_by_tag_and_project
test_trash_restore_file
```
