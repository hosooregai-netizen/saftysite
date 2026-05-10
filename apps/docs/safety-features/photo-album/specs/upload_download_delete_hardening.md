# Upload / Download / Delete Hardening

## 업로드 상태

```text
idle
selecting
preparing
uploading
uploaded
failed
```

## 요구사항

- 이미지 파일만 허용한다.
- 파일 크기 제한을 둔다.
- 업로드 전 preview를 표시한다.
- 업로드 실패 파일과 성공 파일을 분리한다.
- siteId가 없으면 업로드 버튼을 비활성화한다.
- roundNo 기본값을 제공한다.
- 삭제 전 confirm dialog를 표시한다.
- guest mode에서는 cache에서 제거한다.
- authenticated mode에서는 서버 API 호출 후 목록을 갱신한다.
