# Storage Security Follow-up

## 현재 이슈

MVP에서는 파일 내용이 `dataUrl`, `textContent`, `externalUrl` 형태로 저장될 수 있다.

## 리스크

- data URL이 응답에 과도하게 포함되면 payload가 커진다.
- 권한 없는 사용자에게 민감 내용이 노출될 수 있다.
- public share metadata endpoint와 content endpoint를 분리하지 않으면 과노출 위험이 있다.

## 권장 분리

```text
metadata endpoint
→ name, kind, size, contentType, share status

content endpoint
→ dataUrl/textContent/externalUrl
→ can_read_item 또는 active share token 확인 후 반환
```

## 향후 object storage 전환

```text
DriveItem
→ objectKey
→ contentType
→ sizeBytes
→ checksum
→ signed download URL
```

## QA 기준

- 목록 API는 필요 이상으로 dataUrl을 반환하지 않는다.
- public metadata는 workspace 내부 정보를 노출하지 않는다.
- 다운로드/미리보기 API는 권한 검사를 통과해야 한다.
