# Step 24 Manifest: Webhard Permission & Public Share Hardening

## 목적

웹하드가 Drive-like UI로 전환된 이후, 실제 업무용 파일 관리 기능에서 가장 중요한 권한/공유/공개 링크 보안 경계를 고도화한다.

## 대상 기능

```text
/webhard
→ Drive-like file manager
→ DriveItem
→ DrivePermission
→ DriveShare
→ Share Dialog
→ /share/[token]
→ public share root boundary
```

## 이번 단계의 범위

- 권한 모델 hardening
- 폴더 권한 상속과 effective permission resolver
- share dialog / shared badge / general access UX
- public share root boundary
- revoked / expired / deleted / trashed share 차단
- public share page 탐색 UX
- Drive-like UI non-regression QA

## 제외 범위

- 실제 object storage/S3 전환
- 대용량 파일 업로드 최적화
- 메일함/사진첩/보고서 UI 변경
- Google Drive 브랜드/로고 복제
