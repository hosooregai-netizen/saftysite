# 04. Codex Implementation Prompt — 웹하드

## Prompt

```text
You are implementing the Webhard module for A&C 기술사 ERP.

The service is a construction safety engineering ERP. The Webhard module is a full-screen project file manager that stores contracts, owner materials, contractor submissions, schedules, inspection files, photos, draft reports, review reports, final reports, signed documents, mail attachments, and share links.

Tech Stack:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2
- MVP Storage: local file storage + InMemory repositories
- V1 Storage: MongoDB repository adapter + object storage
- API namespace: /api/v1

Implement only the Webhard module.

Existing concepts:
- Project
- ProjectParty
- InspectionRound
- Contract
- DocumentInstance
- Finding
- CorrectiveAction
- EvidencePhoto
- SafetyCostUsage
- MailMessage
- Submission
- Approval
- AuditLog

Required backend models:
- Folder
- FileAsset
- FileVersion
- FileEntityLink
- ShareLink
- ShareLinkAccessLog
- FileActivity
- FileClassificationSuggestion
- StorageObject
- UploadSession

Required backend APIs:

Folders:
- GET /api/v1/folders
- POST /api/v1/folders
- GET /api/v1/folders/{folderId}
- PATCH /api/v1/folders/{folderId}
- DELETE /api/v1/folders/{folderId}
- POST /api/v1/projects/{projectId}/folders/bootstrap
- POST /api/v1/folders/{folderId}/move
- GET /api/v1/projects/{projectId}/folder-tree

Files:
- GET /api/v1/files
- POST /api/v1/files/upload
- GET /api/v1/files/{fileId}
- PATCH /api/v1/files/{fileId}
- DELETE /api/v1/files/{fileId}
- POST /api/v1/files/{fileId}/restore
- POST /api/v1/files/{fileId}/archive
- POST /api/v1/files/{fileId}/lock
- POST /api/v1/files/{fileId}/unlock
- POST /api/v1/files/{fileId}/move
- POST /api/v1/files/{fileId}/copy
- GET /api/v1/files/{fileId}/download
- GET /api/v1/files/{fileId}/preview
- POST /api/v1/files/bulk-action

Versions:
- GET /api/v1/files/{fileId}/versions
- POST /api/v1/files/{fileId}/versions
- GET /api/v1/file-versions/{versionId}/download
- POST /api/v1/file-versions/{versionId}/restore-as-current

Share Links:
- GET /api/v1/share-links
- POST /api/v1/share-links
- GET /api/v1/share-links/{shareLinkId}
- PATCH /api/v1/share-links/{shareLinkId}
- DELETE /api/v1/share-links/{shareLinkId}
- POST /api/v1/share-links/{shareLinkId}/revoke
- GET /api/v1/public/share/{token}
- GET /api/v1/public/share/{token}/download

Linking:
- GET /api/v1/files/{fileId}/links
- POST /api/v1/files/{fileId}/links
- DELETE /api/v1/files/{fileId}/links/{linkId}
- POST /api/v1/files/{fileId}/classify
- POST /api/v1/files/{fileId}/apply-classification

Mail Attachment Save:
- POST /api/v1/mail/messages/{messageId}/attachments/save-to-webhard
- GET /api/v1/mail/messages/{messageId}/attachments/save-suggestions

Activities and Search:
- GET /api/v1/files/{fileId}/activities
- GET /api/v1/webhard/activities
- GET /api/v1/webhard/search
- GET /api/v1/webhard/storage-usage

Required frontend routes:
- /webhard
- /webhard/projects/[projectId]
- /webhard/projects/[projectId]/folders/[folderId]
- /webhard/recent
- /webhard/shared
- /webhard/trash
- /webhard/search
- /files/[fileId]
- /files/[fileId]/versions
- /files/[fileId]/activity
- /share/[token]

Required frontend components:
- WebhardShell
- WebhardCommandBar
- WebhardLeftRail
- ProjectFolderTree
- FolderBreadcrumb
- FileList
- FileGrid
- FileRow
- FileCard
- FilePreviewPanel
- FileDetailPanel
- FileTagEditor
- FileLinkTargetPanel
- FileVersionPanel
- FileActivityTimeline
- UploadDropzone
- UploadQueue
- NewFolderModal
- RenameModal
- MoveCopyModal
- ShareLinkModal
- ShareLinkList
- PublicShareView
- TrashTable
- StorageUsageCard
- FileClassificationSuggestionPanel
- MailAttachmentSavePanel

Business requirements:
1. Webhard uses a full-screen shell, not a narrow tab.
2. Project folder bootstrap creates the default A&C folder tree.
3. Files can be linked to Project, Contract, InspectionRound, DocumentInstance, Finding, CorrectiveAction, SafetyCostUsage, MailMessage, Submission, and Approval.
4. Upload creates FileAsset, FileVersion v1, and FileActivity.
5. Generated document export creates FileAsset with source=generated_document.
6. Mail attachment save creates FileAsset with source=mail_attachment and links MailMessage.
7. Final reports, submitted reports, and signed files should be locked or deletion-restricted.
8. Share links support token, expiration, permission, revoke, and access log.
9. Search supports project, folder, tag, file type, linked entity, and text query.
10. Folder display names can change without breaking projectId and folderId links.
11. File classification uses the service AI prompt `webhard-file-classification` and must require user confirmation when confidence is low.
12. All upload, move, delete, share, revoke, download, and restore actions should create FileActivity or AuditLog.

Validation:
1. folderId is required for upload.
2. File size must be greater than 0.
3. System folders cannot be deleted by normal users.
4. Locked files cannot be deleted, moved, or renamed unless admin override is used.
5. ShareLink must target either fileId or folderId.
6. Revoked or expired share links must not be accessible.
7. generated_document should link to DocumentInstance.
8. mail_attachment should link to MailMessage.

Seed data:
Create the default folder tree for the Leeum elevator replacement project:
- 00_계약_견적
- 01_발주처_제공자료
- 02_시공사_제출자료
- 03_공사개요_공정표
- 04_현장점검/제1회 ... 제10회
- 05_현장사진/원본
- 05_현장사진/지적사항
- 05_현장사진/조치현황
- 06_보고서_초안
- 07_검토본
- 08_최종본
- 09_메일첨부
- 99_기타

Tests:
- test_project_folder_bootstrap_creates_default_tree
- test_folder_system_folder_delete_blocked
- test_file_upload_creates_asset_and_version
- test_file_upload_records_activity
- test_file_classification_contract_folder
- test_file_classification_site_photo_folder
- test_generated_document_saved_to_final_folder
- test_mail_attachment_save_links_mail_message
- test_file_version_add_success
- test_file_move_updates_folder
- test_locked_file_cannot_be_deleted
- test_final_report_delete_blocked
- test_share_link_create_success
- test_share_link_revoke_blocks_access
- test_share_link_expired_blocks_access
- test_share_link_access_log_created
- test_file_entity_link_document_instance
- test_webhard_search_by_tag_and_project
- test_trash_restore_file

Deliverables:
- Backend models and repositories
- Local storage adapter
- Backend API routes and services
- File classification service
- Share link service
- Frontend full-screen webhard shell
- File list/grid/detail panels
- Upload queue
- API client functions
- Type definitions
- Tests
- README note for this module
```
