# 07. Reverse Map — 메일함

## 1. Feature

```yaml
featureId: mailbox.project_communication
featureName: 메일함
priority: P0.5
module: mailbox
```

## 2. 기능 → 화면

| 기능 | Route | 설명 |
|---|---|---|
| 통합 메일함 | `/mail` | 받은편지함/보낸메일함/임시보관함 통합 |
| 받은편지함 | `/mail/inbox` | 수신 메일 |
| 보낸메일함 | `/mail/sent` | 발송 메일 |
| 임시보관함 | `/mail/drafts` | 작성 중 초안 |
| 메일 작성 | `/mail/compose` | 일반 메일 작성 |
| 스레드 상세 | `/mail/threads/[threadId]` | 대화 스레드 |
| 메시지 상세 | `/mail/messages/[messageId]` | 개별 메일 |
| 프로젝트 메일 | `/projects/[projectId]/mail` | 프로젝트별 메일 필터 |
| 프로젝트 메일 작성 | `/projects/[projectId]/mail/compose` | 프로젝트 context compose |
| 회차 메일 | `/inspections/[inspectionRoundId]/mail` | 점검회차 일정협의/제출 메일 |
| 보고서 제출 메일 | `/documents/[documentId]/submission-mail` | 문서 제출 전용 메일 |
| 조치요청 메일 | `/findings/[findingId]/action-request-mail` | 지적사항 조치요청 |
| 계약 발송 메일 | `/contracts/[contractId]/send-mail` | 계약서/견적서 발송 |
| 메일 계정 설정 | `/settings/mail-accounts` | OAuth/guest 설정 |
| 메일 템플릿 설정 | `/settings/mail-templates` | 템플릿/서명 관리 |

## 3. 화면 → 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/mail` | MailboxShell, MailLeftPane, MailThreadList, MailDetailPane |
| `/mail/compose` | ComposePanel, MailRecipientInput, MailTemplateSelector, MailAIDraftPanel |
| `/projects/[projectId]/mail` | ProjectMailFilter, MailThreadList, MailEntityLinker |
| `/documents/[documentId]/submission-mail` | SubmissionMailComposer, MailSendChecklist, MailAttachmentList |
| `/findings/[findingId]/action-request-mail` | ActionRequestMailComposer, FindingMailTable, MailAttachmentList |
| `/mail/messages/[messageId]` | MailMessageHeader, MailBodyViewer, MailAttachmentSavePanel |
| `/settings/mail-accounts` | OAuthConnectCard, MailSyncStatusBadge, MailSyncLogPanel |
| `/settings/mail-templates` | MailTemplateEditor, MailSignatureEditor |

## 4. 컴포넌트 → API

| 컴포넌트 | API |
|---|---|
| MailAccountSelector | GET `/api/v1/mail/accounts` |
| OAuthConnectCard | POST `/api/v1/mail/oauth/google/start` |
| MailSyncStatusBadge | POST `/api/v1/mail/accounts/{accountId}/sync` |
| MailThreadList | GET `/api/v1/mail/threads` |
| MailDetailPane | GET `/api/v1/mail/messages/{messageId}` |
| MailEntityLinker | POST `/api/v1/mail/messages/{messageId}/link-entity` |
| MailAttachmentSavePanel | POST `/api/v1/mail/attachments/{attachmentId}/save-to-webhard` |
| ComposePanel | POST `/api/v1/mail/drafts`, POST `/api/v1/mail/drafts/{draftId}/send` |
| MailAIDraftPanel | POST `/api/v1/mail/drafts/{draftId}/generate` |
| MailSendChecklist | POST `/api/v1/mail/drafts/{draftId}/validate` |
| SubmissionMailComposer | POST `/api/v1/documents/{documentId}/submission-mail/draft` |
| ActionRequestMailComposer | POST `/api/v1/findings/action-request-mail/draft` |
| MaterialRequestMailComposer | POST `/api/v1/projects/{projectId}/material-request-mail/draft` |
| ScheduleCoordinationMailComposer | POST `/api/v1/inspection-rounds/{inspectionRoundId}/schedule-coordination-mail/draft` |

## 5. API → 데이터 모델

| API | 모델 |
|---|---|
| GET `/mail/accounts` | MailAccount |
| POST `/mail/accounts/{id}/sync` | MailSyncJob, MailThread, MailMessage |
| GET `/mail/threads` | MailThread, MailEntityLink |
| GET `/mail/messages/{id}` | MailMessage, MailAttachment |
| POST `/mail/messages/{id}/classify` | MailEntityLink, Project, Contact |
| POST `/mail/drafts` | MailDraft |
| POST `/mail/drafts/{id}/generate` | MailDraft, MailTemplate |
| POST `/mail/drafts/{id}/send` | MailMessage, MailThread, AuditLog |
| POST `/attachments/{id}/save-to-webhard` | MailAttachment, FileAsset, Folder |
| POST `/documents/{id}/submission-mail/draft` | DocumentInstance, FileAsset, Submission, MailDraft |
| POST `/findings/action-request-mail/draft` | Finding, EvidencePhoto, MailDraft |
| POST `/mail/templates` | MailTemplate |

## 6. 데이터 모델 → 프롬프트

| 모델 | 프롬프트 |
|---|---|
| MailDraft | mail-draft-and-classification |
| MailMessage | mail-draft-and-classification |
| MailAttachment | mail-draft-and-classification |
| DocumentInstance | mail-draft-and-classification |
| Finding | mail-draft-and-classification |
| FileAsset | mail-draft-and-classification |
| Submission | mail-draft-and-classification |
| Project | mail-draft-and-classification |
| Contact | mail-draft-and-classification |

## 7. 기능 → 테스트

| 기능 | 테스트 |
|---|---|
| guest 계정 생성 | test_mail_account_guest_create |
| OAuth 시작 | test_mail_oauth_start_returns_auth_url |
| 메일 sync | test_mail_sync_creates_threads_and_messages |
| 제목 기반 프로젝트 분류 | test_mail_project_classification_by_subject |
| 연락처 기반 프로젝트 분류 | test_mail_project_classification_by_contact_email |
| 보고서 제출 초안 | test_mail_draft_create_report_submission |
| 제출파일 필수 | test_mail_draft_report_submission_requires_exported_file |
| 조치요청 지적사항 필수 | test_mail_draft_action_request_requires_findings |
| 수신자 검증 | test_mail_draft_validate_recipients |
| 연결 모드 발송 | test_mail_send_connected_mode_success |
| guest mode 발송 차단 | test_mail_send_guest_mode_blocked_or_copy_only |
| 첨부 웹하드 저장 | test_mail_attachment_save_to_webhard |
| 첨부 중복 버전 | test_mail_attachment_duplicate_creates_file_version |
| 제출 이력 생성 | test_report_submission_mail_creates_submission |
| 문서 상태 업데이트 | test_report_submission_mail_updates_document_status |
| 지적사항 상태 업데이트 | test_action_request_mail_updates_finding_status |
| 엔티티 연결 확정 | test_mail_message_link_entity_confirmed |
| 템플릿 변수 매핑 | test_mail_template_variable_mapping |

## 8. 다음 모듈 연결

| 연결 모듈 | 연결 방식 |
|---|---|
| 프로젝트/현장 원장 | projectId, Contact, Organization |
| 계약/견적 | 계약서/견적서 발송 메일, finalFileId |
| 점검회차/일정 | 일정협의 메일, inspectionRoundId |
| 보고서 자동화 | DocumentInstance 제출 메일, exportedFileId |
| 체크리스트 | 자료요청/점검 준비 메일 |
| 지적사항/조치현황 | 조치요청 메일, Finding 상태 변경 |
| 산업안전보건관리비 | 사용내역서 요청/첨부 저장 |
| 웹하드 | 첨부파일 저장, FileAsset 연결 |
| 결재/제출 | Submission 생성/갱신 |
| 관리자/템플릿 | MailTemplate, Signature, OAuth 설정 |
| 대시보드 | 미확인 메일, 미저장 첨부, 미제출 메일 |

## 9. 리스크

| 리스크 | 대응 |
|---|---|
| 메일과 프로젝트 오연결 | suggested/confirmed/rejected 링크 상태 분리 |
| 첨부파일 웹하드 저장 누락 | 미저장 첨부 warning 및 저장 패널 제공 |
| 보고서 제출 메일에 최종본 누락 | report_submission validation에서 차단 |
| OAuth 미연결 상태 발송 혼동 | guest mode에서는 발송 대신 초안 복사만 제공 |
| AI가 없는 첨부파일을 언급 | attachment checklist 기반 본문 생성 |
| 발주처별 문서 첨부 혼동 | ownerPartyId 검증 및 owner_mismatch warning |
| 제출 이력 누락 | send 후 Submission 자동 생성/갱신 |
| 조치요청 발송 후 Finding 상태 미변경 | action_request send hook에서 상태 업데이트 |
| 메일 sync 중복 | providerMessageId/providerThreadId unique 처리 |
