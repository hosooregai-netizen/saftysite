# Cross Feature Flows

## 보고서 작성 → 출력 → 메일 발송

```text
headquarters-sites
→ report-workspace
→ billing-credits
→ report-list
→ mailbox
```

## 비로그인 작업 → 로그인 → 데이터 이전

```text
local/guest state
→ account-settings
→ auth-workspace
→ guest import
→ webhard/photo-album/report data
```

## 사진첩 → 보고서 증거

```text
photo-album
→ select photo
→ report-workspace
→ photoEvidence / linkedPhotoIds
```

## 웹하드 공유

```text
auth-workspace
→ webhard permission
→ share link
→ public share page
```

## 메일함 연동

```text
auth-workspace Google login
≠ mailbox Gmail connect

mailbox Gmail connect
→ Gmail sync/send
→ report attachment send
```
