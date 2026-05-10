# 08. Reverse Prompt — 웹하드

## Prompt

```text
너는 A&C 기술사 ERP의 Reverse Mapping Agent다.

대상 기능:
웹하드

기능 설명:
웹하드는 프로젝트별 계약서, 발주처 제공자료, 시공사 제출자료, 공사개요/공정표, 현장점검 자료, 현장사진, 지적사진, 조치사진, 보고서 초안, 검토본, 최종본, 메일 첨부파일, 공유 링크를 관리하는 full-screen 파일관리 기능이다.

업무 맥락:
- 웹하드는 단순 파일 저장소가 아니라 ERP 산출물 저장소다.
- 모든 파일은 가능하면 Project와 연결된다.
- 파일은 Folder 안에 저장되지만 DocumentInstance, InspectionRound, Finding, MailMessage, Submission 등과도 연결될 수 있다.
- 문서 export 결과는 웹하드에 자동 저장되어야 한다.
- 메일 첨부파일은 웹하드에 저장되고 MailMessage와 연결되어야 한다.
- 최종본, 제출본, 날인본은 삭제 제한과 lock 상태가 필요하다.
- 공유 링크는 만료일, 권한, 폐기, 접근 로그를 가져야 한다.
- 파일 분류는 AI가 추천하되, 확신이 낮으면 사용자 확인이 필요하다.

입력:
{
  "featureName": "웹하드",
  "businessRequirements": [],
  "screenRequirements": [],
  "dataRequirements": [],
  "aiRequirements": [],
  "fileRequirements": [],
  "shareRequirements": [],
  "mailRequirements": [],
  "testRequirements": []
}

해야 할 일:
1. featureId를 `webhard.file_management`로 설정한다.
2. 필요한 route를 도출한다.
3. 필요한 component를 도출한다.
4. 필요한 API endpoint를 도출한다.
5. 필요한 data model을 도출한다.
6. 필요한 service-ai prompt를 연결한다.
7. 필요한 implementation prompt를 연결한다.
8. 필요한 design prompt를 연결한다.
9. acceptance test와 edge case test를 도출한다.
10. 다음 모듈과의 연결점을 표시한다.
    - 프로젝트/현장 원장
    - 계약/견적
    - 점검회차/일정
    - 현장점검 체크리스트
    - 지적사항/사진대지
    - 산업안전보건관리비
    - 안전관리계획서
    - 안전보건대장
    - 공사안전보건대장 이행확인 보고서
    - 메일함
    - 결재/제출
    - 관리자/템플릿

출력 JSON:
{
  "featureId": "webhard.file_management",
  "featureName": "웹하드",
  "routes": [],
  "components": [],
  "apis": [],
  "models": [],
  "serviceAiPrompts": [],
  "implementationPrompts": [],
  "designPrompts": [],
  "tests": [],
  "downstreamDependencies": [],
  "warnings": []
}

반드시 포함할 routes:
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

반드시 포함할 models:
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
- Project
- DocumentInstance
- InspectionRound
- Finding
- MailMessage
- Submission
- AuditLog

반드시 포함할 prompts:
- webhard-file-classification
- webhard implementation prompt
- webhard design prompt

반드시 포함할 tests:
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

주의:
- 웹하드는 full-screen shell로 설계한다.
- 폴더명 변경이 데이터 연결을 깨뜨리면 안 된다.
- 파일은 폴더뿐 아니라 ERP 엔티티와도 연결되어야 한다.
- 최종본/제출본/날인본은 삭제 제한 대상이다.
- 공유 링크 token 원문을 저장하지 말고 hash를 저장한다.
- 공유 링크 접근은 만료/폐기/권한을 반드시 검증한다.
- 메일 첨부 저장 시 MailMessage와 FileAsset 연결을 남긴다.
- 문서 export 저장 시 DocumentInstance와 FileAsset 연결을 남긴다.
- AI 파일 분류는 추천일 뿐이며 확신이 낮으면 사용자가 확인해야 한다.
```
